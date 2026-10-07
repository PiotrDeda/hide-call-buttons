import { isValidElement } from 'react'
import {
	createIconMatcher,
	removeElements,
	removeRootChildrenAt,
} from './buttons'
import type { ReactNode } from 'react'
import type { ElementMatcher, ResolvedIcons } from './buttons'
import type { Settings } from './storage'

/** Generated icon component name first, then legacy asset names. */
export const CallIconNames = ['PhoneCallIcon', 'ic_audio', 'nav_header_connect']
/** Generated icon component name first, then legacy asset names. */
export const VideoIconNames = ['VideoIcon', 'ic_video', 'video']

/** Default-exported function components. */
export const ProfileActionsName = 'UserProfileActions'
export const ContactButtonsNames = [
	'SimplifiedUserProfileContactButtons',
	'UserProfileContactButtons',
]
export const VCVideoButtonName = 'VideoButton'
/** `React.memo` component, matched by its wrapped function name. */
export const DMHeaderButtonsName = 'PrivateChannelButtons'
/** Module export holding the legacy UI DM header buttons. */
export const LegacyDMHeaderButtonsProp = 'ChannelButtons'

export type RenderPatch = (tree: ReactNode) => ReactNode

/**
 * Creates render output patches shared by every host mod.
 *
 * @param setting Reads a setting at render time.
 * @param resolveIcons Resolves icon names into asset IDs and icon components.
 */
export function createRenderPatches(
	setting: (key: keyof Settings) => boolean,
	resolveIcons: (names: string[]) => ResolvedIcons,
) {
	const isCallButton = createIconMatcher(resolveIcons(CallIconNames))
	const isVideoButton = createIconMatcher(resolveIcons(VideoIconNames))

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

	const profileActions: RenderPatch = tree => {
		const call = setting('upHideVoiceButton')
		const video = setting('upHideVideoButton')
		if (!call && !video) return tree

		return removeElements(tree, matcherFor(call, video))
	}

	const contactButtons: RenderPatch = tree => {
		const call = setting('upHideVoiceButton')
		const video = setting('upHideVideoButton')
		if (!call && !video) return tree

		const result = removeElements(tree, matcherFor(call, video))
		if (result !== tree) return result

		// Last known layout: [message, voice call, video call, ...]
		return removeRootChildrenAt(tree, indicesFor(call, video, [1, 2]))
	}

	const dmHeaderButtons: RenderPatch = tree => {
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
	}

	const legacyDMHeaderButtons: RenderPatch = tree => {
		const call = setting('dmHideCallButton')
		const video = setting('dmHideVideoButton')
		if (!call && !video) return tree

		return removeElements(tree, matcherFor(call, video))
	}

	return {
		profileActions,
		contactButtons,
		dmHeaderButtons,
		legacyDMHeaderButtons,
	}
}
