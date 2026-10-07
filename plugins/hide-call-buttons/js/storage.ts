export interface Settings {
	/** Hide the voice call button on user profiles. */
	upHideVoiceButton: boolean
	/** Hide the video call button on user profiles. */
	upHideVideoButton: boolean
	/** Hide the voice call button in the DM header. */
	dmHideCallButton: boolean
	/** Hide the video call button in the DM header. */
	dmHideVideoButton: boolean
	/** Hide the camera button in voice channels. */
	hideVCVideoButton: boolean
}

export const DefaultSettings: Settings = {
	upHideVoiceButton: true,
	upHideVideoButton: true,
	dmHideCallButton: false,
	dmHideVideoButton: false,
	hideVCVideoButton: false,
}

export interface SettingToggle {
	key: keyof Settings
	label: string
	icon: string
}

/** Settings screen layout. */
export const SettingGroups: Array<{ title: string; toggles: SettingToggle[] }> =
	[
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
