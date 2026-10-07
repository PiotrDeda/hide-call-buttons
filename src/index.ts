import { find, findByName, findByProps } from '@vendetta/metro'
import { after, instead } from '@vendetta/patcher'
import { storage } from '@vendetta/plugin'
import { getAssetIDByName } from '@vendetta/ui/assets'
import { isValidElement } from 'react'
import {
	createIconMatcher,
	removeElements,
	removeRootChildrenAt,
} from './buttons'
import Settings from './settings'
import { DefaultSettings } from './storage'
import type { ReactNode } from 'react'
import type { ElementMatcher } from './buttons'
import type { Settings as SettingsShape } from './storage'

type RenderPatch = (tree: ReactNode) => ReactNode

const unpatches: Array<() => unknown> = []

const setting = (key: keyof SettingsShape): boolean =>
	storage[key] ?? DefaultSettings[key]

/** Collects indices for the positional fallback. */
const indicesFor = (
	call: boolean,
	video: boolean,
	[callIndex, videoIndex]: [number, number],
) => [...(call ? [callIndex] : []), ...(video ? [videoIndex] : [])]

export default {
	onLoad() {
		for (const [key, value] of Object.entries(DefaultSettings))
			storage[key] ??= value

		// Generated icon component name first, then legacy asset names
		const isCallButton = createIconMatcher(
			resolveIcons('PhoneCallIcon', 'ic_audio', 'nav_header_connect'),
		)
		const isVideoButton = createIconMatcher(
			resolveIcons('VideoIcon', 'ic_video', 'video'),
		)

		const matcherFor =
			(call: boolean, video: boolean): ElementMatcher =>
			node =>
				(call && isCallButton(node)) || (video && isVideoButton(node))

		// User profile
		patchRender(findByName('UserProfileActions', false), 'default', tree => {
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
			patchRender(findByName(name, false), 'default', tree => {
				const call = setting('upHideVoiceButton')
				const video = setting('upHideVideoButton')
				if (!call && !video) return tree

				const result = removeElements(tree, matcherFor(call, video))
				if (result !== tree) return result

				// Last known layout: [message, voice call, video call, ...]
				return removeRootChildrenAt(tree, indicesFor(call, video, [1, 2]))
			})

		// Voice channel
		const VideoButton = findByName('VideoButton', false)
		if (typeof VideoButton?.default === 'function')
			unpatches.push(
				instead('default', VideoButton, function (this: unknown, args, orig) {
					if (setting('hideVCVideoButton')) return null
					return orig.apply(this, args)
				}),
			)

		// Tabs V2 DM header
		patchRender(
			find(exports => exports?.type?.name === 'PrivateChannelButtons'),
			'type',
			tree => {
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
			},
		)

		// Legacy UI DM header
		patchRender(findByProps('ChannelButtons'), 'ChannelButtons', tree => {
			const call = setting('dmHideCallButton')
			const video = setting('dmHideVideoButton')
			if (!call && !video) return tree

			return removeElements(tree, matcherFor(call, video))
		})
	},
	onUnload() {
		for (const unpatch of unpatches.splice(0)) unpatch()
	},
	settings: Settings,
}

function patchRender(parent: any, key: string, patch: RenderPatch) {
	if (typeof parent?.[key] !== 'function') return
	unpatches.push(after(key, parent, (_, tree) => patch(tree)))
}

/** Resolves asset IDs and the generated icon component for the given names. */
function resolveIcons(componentName: string, ...legacyAssetNames: string[]) {
	let component: unknown
	try {
		component = findByProps(componentName)?.[componentName]
	} catch {}

	return {
		assets: [componentName, ...legacyAssetNames].map(getAssetIDByName),
		components: [component],
	}
}
