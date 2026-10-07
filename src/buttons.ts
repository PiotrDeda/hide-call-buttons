import { cloneElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'

export type ElementMatcher = (node: unknown) => boolean

type AnyProps = Record<string, unknown>

/** Resolved icon references. */
export interface ResolvedIcons {
	/** Asset IDs. */
	assets: Iterable<unknown>
	/** Generated icon components. */
	components: Iterable<unknown>
}

const MaxDepth = 16

/**
 * Creates a matcher for elements rendering one of the given icons.
 *
 * Matches an element when its `icon`, `source` or `IconComponent` prop references the icon,
 * or when it is a pressable whose first child renders the icon.
 */
export function createIconMatcher(icons: ResolvedIcons): ElementMatcher {
	const assets = new Set<unknown>(icons.assets)
	const components = new Set<unknown>(icons.components)
	assets.delete(undefined)
	components.delete(undefined)

	const isIcon = (icon: unknown): boolean => {
		if (icon == null) return false
		if (assets.has(icon) || components.has(icon)) return true
		if (!isValidElement(icon)) return false

		return (
			components.has(icon.type) || assets.has((icon.props as AnyProps)?.source)
		)
	}

	const ownPropsMatch = (props: AnyProps) =>
		isIcon(props.icon) || isIcon(props.source) || isIcon(props.IconComponent)

	return node => {
		if (!isValidElement(node)) return false

		const props = node.props as AnyProps | null
		if (!props) return false
		if (ownPropsMatch(props)) return true

		// Legacy DM header buttons wrap the icon image in a pressable
		if (props.onPress === undefined) return false

		const { children } = props
		const first = Array.isArray(children) ? children[0] : children
		return isValidElement(first) && ownPropsMatch(first.props as AnyProps)
	}
}

/**
 * Walks a rendered tree in pre-order through `props.children`.
 * A visitor returning `undefined` descends into the element, any other value replaces it.
 *
 * @returns The same tree when nothing changed, a shallow copy of the changed path otherwise.
 */
function walk(
	node: ReactNode,
	visit: (element: ReactElement) => ReactNode | undefined,
	depth = 0,
): ReactNode {
	if (depth > MaxDepth || node == null || typeof node !== 'object') return node

	if (Array.isArray(node)) {
		let changed = false
		const result = node.map(child => {
			const next = walk(child, visit, depth + 1)
			if (next !== child) changed = true
			return next
		})

		return changed ? result : node
	}

	if (!isValidElement(node)) return node

	const replaced = visit(node)
	if (replaced !== undefined) return replaced

	const { children } = node.props as { children?: ReactNode }
	const next = walk(children, visit, depth + 1)
	if (next === children) return node

	return cloneElement(node, { children: next } as AnyProps)
}

/**
 * Replaces every element matching the predicate with `null`.
 *
 * @returns The same tree when nothing matched.
 */
export function removeElements(
	tree: ReactNode,
	shouldRemove: ElementMatcher,
): ReactNode {
	return walk(tree, element => (shouldRemove(element) ? null : undefined))
}

/**
 * Replaces children of the root element at the given indices with `null`.
 * Used as a fallback when the buttons can't be matched by their icons.
 *
 * @returns The same tree when the root element doesn't satisfy the predicate.
 */
export function removeRootChildrenAt(
	tree: ReactNode,
	indices: number[],
	isContainer: (children: unknown[]) => boolean = () => true,
): ReactNode {
	if (!indices.length || !isValidElement(tree)) return tree

	const { children } = tree.props as { children?: unknown }
	if (!Array.isArray(children) || !isContainer(children)) return tree

	const next = children.slice()
	for (const index of indices) if (index < next.length) next[index] = null

	return cloneElement(tree, { children: next } as AnyProps)
}
