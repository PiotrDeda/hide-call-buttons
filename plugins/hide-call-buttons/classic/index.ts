import { find, findByName, findByProps } from '@vendetta/metro'
import { after, instead } from '@vendetta/patcher'
import { storage } from '@vendetta/plugin'
import { getAssetIDByName } from '@vendetta/ui/assets'
import {
	ContactButtonsNames,
	createRenderPatches,
	DMHeaderButtonsName,
	LegacyDMHeaderButtonsProp,
	ProfileActionsName,
	VCVideoButtonName,
} from '../js/patches'
import { DefaultSettings } from '../js/storage'
import Settings from './settings'
import type { RenderPatch } from '../js/patches'
import type { Settings as SettingsShape } from '../js/storage'

const unpatches: Array<() => unknown> = []

const setting = (key: keyof SettingsShape): boolean =>
	storage[key] ?? DefaultSettings[key]

export default {
	onLoad() {
		for (const [key, value] of Object.entries(DefaultSettings))
			storage[key] ??= value

		const patches = createRenderPatches(setting, names => ({
			assets: names.map(name => getAssetIDByName(name)),
			components: [findIconComponent(names[0]!)],
		}))

		// User profile
		patchRender(
			findByName(ProfileActionsName, false),
			'default',
			patches.profileActions,
		)

		// Simplified user profile
		for (const name of ContactButtonsNames)
			patchRender(findByName(name, false), 'default', patches.contactButtons)

		// Voice channel
		const VideoButton = findByName(VCVideoButtonName, false)
		if (typeof VideoButton?.default === 'function')
			unpatches.push(
				instead('default', VideoButton, function (this: unknown, args, orig) {
					if (setting('hideVCVideoButton')) return null
					return orig.apply(this, args)
				}),
			)

		// Tabs V2 DM header
		patchRender(
			find(exports => exports?.type?.name === DMHeaderButtonsName),
			'type',
			patches.dmHeaderButtons,
		)

		// Legacy UI DM header
		patchRender(
			findByProps(LegacyDMHeaderButtonsProp),
			LegacyDMHeaderButtonsProp,
			patches.legacyDMHeaderButtons,
		)
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

function findIconComponent(name: string) {
	try {
		return findByProps(name)?.[name]
	} catch {}
}
