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
