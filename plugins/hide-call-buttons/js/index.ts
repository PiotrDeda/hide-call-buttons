import { getAssetIdByName } from '@revenge-mod/assets'
import { getModules } from '@revenge-mod/modules/finders'
import {
	createFilterGenerator,
	withName,
	withProps,
} from '@revenge-mod/modules/finders/filters'
import { after, instead } from '@revenge-mod/patcher'
import { lookupGeneratedIconComponent } from '@revenge-mod/utils/discord'
import {
	ContactButtonsNames,
	createRenderPatches,
	DMHeaderButtonsName,
	LegacyDMHeaderButtonsProp,
	ProfileActionsName,
	VCVideoButtonName,
} from './patches'
import SettingsComponent from './settings'
import { DefaultSettings } from './storage'
import type { PluginCleanupApi } from '@revenge-mod/plugins/types'
import type { RenderPatch } from './patches'
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

		const patches = createRenderPatches(setting, names => ({
			assets: names.map(name => getAssetIdByName(name)),
			components: [lookupIconComponent(names[0]!)],
		}))

		// User profile
		patchDefaultExport(cleanup, ProfileActionsName, patches.profileActions)

		// Simplified user profile
		for (const name of ContactButtonsNames)
			patchDefaultExport(cleanup, name, patches.contactButtons)

		// Voice channel
		cleanup(
			getModules(
				withName(VCVideoButtonName),
				exports => {
					if (!hasDefaultNamed(exports, VCVideoButtonName)) return

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
			getModules(withMemoName(DMHeaderButtonsName), memo => {
				cleanup(
					after(memo as { type: AnyFunction }, 'type', patches.dmHeaderButtons),
				)
			}),
		)

		// Legacy UI DM header
		cleanup(
			getModules(withProps(LegacyDMHeaderButtonsProp), exports => {
				cleanup(
					after(
						exports as unknown as Record<string, AnyFunction>,
						LegacyDMHeaderButtonsProp,
						patches.legacyDMHeaderButtons,
					),
				)
			}),
		)
	},
	SettingsComponent,
})

function lookupIconComponent(name: string) {
	try {
		return lookupGeneratedIconComponent(name)
	} catch {}
}

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
	patch: RenderPatch,
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
