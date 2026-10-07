import { findByProps } from '@vendetta/metro'
import { ReactNative } from '@vendetta/metro/common'
import { storage } from '@vendetta/plugin'
import { useProxy } from '@vendetta/storage'
import { getAssetIDByName } from '@vendetta/ui/assets'
import { DefaultSettings, SettingGroups } from '../js/storage'

export default function Settings() {
	useProxy(storage)

	const { TableRow, TableSwitchRow, TableRowGroup } = findByProps('TableRow')
	const { Stack } = findByProps('Stack')

	return (
		<ReactNative.ScrollView>
			<Stack
				style={{ paddingVertical: 24, paddingHorizontal: 12 }}
				spacing={24}
			>
				{SettingGroups.map(({ title, toggles }) => (
					<TableRowGroup key={title} title={title}>
						{toggles.map(({ key, label, icon }) => (
							<TableSwitchRow
								key={key}
								label={label}
								icon={<TableRow.Icon source={getAssetIDByName(icon)} />}
								value={storage[key] ?? DefaultSettings[key]}
								onValueChange={(value: boolean) => {
									storage[key] = value
								}}
							/>
						))}
					</TableRowGroup>
				))}
			</Stack>
		</ReactNative.ScrollView>
	)
}
