import { getModules } from '@revenge-mod/modules/finders'
import {
	createFilterGenerator,
	withName,
	withProps,
} from '@revenge-mod/modules/finders/filters'
import { after, instead } from '@revenge-mod/patcher'
import { isValidElement } from 'react'
import {
	createIconMatcher,
	removeElements,
	removeRootChildrenAt,
} from './buttons'
import SettingsComponent from './settings'
import { DefaultSettings } from './storage'
import type { PluginCleanupApi } from '@revenge-mod/plugins/types'
import type { ReactNode } from 'react'
import type { ElementMatcher } from './buttons'
import type { Settings } from './storage'

type AnyFunction = (...args: any[]) => any

/** Filters `React.memo` components by the name of the wrapped function. */
const withMemoName = createFilterGenerator<[name: string]>(
	([name], _, exports) => exports?.type?.name === name,
	([name]) => `hide-call-buttons.memoName(${name})`,
)

export default plugin<{ jsonStorage: Settings }>({
	jsonStorage: {
		load: true,
		default: DefaultSettings,
	},
	async start({ cleanup, jsonStorage }) {
		if (!jsonStorage.loaded) await jsonStorage.get()

		const setting = (key: keyof Settings) =>
			(jsonStorage.cache as Partial<Settings> | undefined)?.[key] ??
			DefaultSettings[key]

		const isCallButton = createIconMatcher(
			'PhoneCallIcon',
			'ic_audio',
			'nav_header_connect',
		)
		const isVideoButton = createIconMatcher('VideoIcon', 'ic_video', 'video')

		const matcherFor =
			(call: boolean, video: boolean): ElementMatcher =>
			node =>
				(call && isCallButton(node)) || (video && isVideoButton(node))

		/** Collects indices for the positional fallback. */
		const indicesFor = (
			call: boolean,
			video: boolean,
			[callIndex, videoIndex]: [number, number],
		) => [...(call ? [callIndex] : []), ...(video ? [videoIndex] : [])]

		// User profile
		patchDefaultExport(cleanup, 'UserProfileActions', tree => {
			const call = setting('upHideVoiceButton')
			const video = setting('upHideVideoButton')
			if (!call && !video) return tree

			return removeElements(tree, matcherFor(call, video))
		})

		// Simplified user profile
		for (const name of [
			'SimplifiedUserProfileContactButtons',
			'UserProfileContactButtons',
		])
			patchDefaultExport(cleanup, name, tree => {
				const call = setting('upHideVoiceButton')
				const video = setting('upHideVideoButton')
				if (!call && !video) return tree

				const result = removeElements(tree, matcherFor(call, video))
				if (result !== tree) return result

				// Last known layout: [message, voice call, video call, ...]
				return removeRootChildrenAt(tree, indicesFor(call, video, [1, 2]))
			})

		// Voice channel
		cleanup(
			getModules(
				withName('VideoButton'),
				exports => {
					if (!hasDefaultNamed(exports, 'VideoButton')) return

					cleanup(
						instead(
							exports as { default: AnyFunction },
							'default',
							function (this: unknown, args, original) {
								if (setting('hideVCVideoButton')) return null
								return Reflect.apply(original, this, args)
							},
						),
					)
				},
				{ returnNamespace: true },
			),
		)

		// Tabs V2 DM header
		cleanup(
			getModules(withMemoName('PrivateChannelButtons'), memo => {
				cleanup(
					after(memo as { type: AnyFunction }, 'type', (tree: ReactNode) => {
						const call = setting('dmHideCallButton')
						const video = setting('dmHideVideoButton')
						if (!call && !video) return tree

						const result = removeElements(tree, matcherFor(call, video))
						if (result !== tree) return result

						// Last known layout: [voice call, video call, ...] with accessibility labels
						return removeRootChildrenAt(
							tree,
							indicesFor(call, video, [0, 1]),
							([first]) =>
								isValidElement(first) &&
								(first.props as Record<string, unknown>).accessibilityLabel !==
									undefined,
						)
					}),
				)
			}),
		)

		// Legacy UI DM header
		cleanup(
			getModules(withProps('ChannelButtons'), exports => {
				cleanup(
					after(
						exports as { ChannelButtons: AnyFunction },
						'ChannelButtons',
						(tree: ReactNode) => {
							const call = setting('dmHideCallButton')
							const video = setting('dmHideVideoButton')
							if (!call && !video) return tree

							return removeElements(tree, matcherFor(call, video))
						},
					),
				)
			}),
		)
	},
	SettingsComponent,
})

function hasDefaultNamed(exports: unknown, name: string) {
	const component = (exports as { default?: { name?: unknown } } | undefined)
		?.default

	return typeof component === 'function' && component.name === name
}

/**
 * Patches the render output of a function component exported as `default` from a module.
 */
function patchDefaultExport(
	cleanup: PluginCleanupApi,
	name: string,
	patch: (tree: ReactNode) => ReactNode,
) {
	cleanup(
		getModules(
			withName(name),
			exports => {
				if (!hasDefaultNamed(exports, name)) return

				cleanup(after(exports as { default: AnyFunction }, 'default', patch))
			},
			{ returnNamespace: true },
		),
	)
}
