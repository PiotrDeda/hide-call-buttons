import Page from '@revenge-mod/components/Page'
import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { Design } from '@revenge-mod/discord/design'
import { ScrollView } from 'react-native'
import { DefaultSettings } from './storage'
import type { PluginSettingsComponent } from '@revenge-mod/plugins/types'
import type { Settings } from './storage'

const { Stack, TableRowGroup, TableSwitchRow } = Design

interface Toggle {
	key: keyof Settings
	label: string
	icon: string
}

const Groups: Array<{ title: string; toggles: Toggle[] }> = [
	{
		title: 'User Profile',
		toggles: [
			{
				key: 'upHideVoiceButton',
				label: 'Hide call button',
				icon: 'PhoneCallIcon',
			},
			{
				key: 'upHideVideoButton',
				label: 'Hide video button',
				icon: 'VideoIcon',
			},
		],
	},
	{
		title: 'DMs',
		toggles: [
			{
				key: 'dmHideCallButton',
				label: 'Hide call button',
				icon: 'PhoneCallIcon',
			},
			{
				key: 'dmHideVideoButton',
				label: 'Hide video button',
				icon: 'VideoIcon',
			},
		],
	},
	{
		title: 'Other',
		toggles: [
			{
				key: 'hideVCVideoButton',
				label: 'Hide video button in VC',
				icon: 'VideoIcon',
			},
		],
	},
]

const SettingsComponent: PluginSettingsComponent<{ jsonStorage: Settings }> = ({
	api,
}) => {
	const settings = api.jsonStorage.use()

	return (
		<ScrollView>
			<Page>
				<Stack spacing={24}>
					{Groups.map(({ title, toggles }) => (
						<TableRowGroup key={title} title={title}>
							{toggles.map(({ key, label, icon }) => (
								<TableSwitchRow
									key={key}
									label={label}
									icon={<TableRowAssetIcon name={icon} />}
									value={settings?.[key] ?? DefaultSettings[key]}
									onValueChange={value => {
										api.jsonStorage.set({ [key]: value })
									}}
								/>
							))}
						</TableRowGroup>
					))}
				</Stack>
			</Page>
		</ScrollView>
	)
}

export default SettingsComponent
