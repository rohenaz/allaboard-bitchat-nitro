import { createSlice } from '@reduxjs/toolkit';

export const SETTINGS_OPTIONS = {
	HIDE: 'HIDE',
	SHOW: 'SHOW',
} as const;

type SettingsOption = (typeof SETTINGS_OPTIONS)[keyof typeof SETTINGS_OPTIONS];

interface SettingsState {
	hideUnverifiedMessages: boolean;
	isOpen: boolean;
}

// Simple localStorage access for settings
const getStoredSetting = (key: string, defaultValue: boolean): boolean => {
	try {
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : defaultValue;
	} catch {
		return defaultValue;
	}
};

const saveStoredSetting = (key: string, value: SettingsOption): void => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Ignore storage errors
	}
};

const hideUnverifiedMessagesInitState = getStoredSetting('settings.hideUnverifiedMessages', true);

const initialState: SettingsState = {
	hideUnverifiedMessages: hideUnverifiedMessagesInitState,
	isOpen: false,
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		toggleHideUnverifiedMessages(state) {
			state.hideUnverifiedMessages = !state.hideUnverifiedMessages;
			saveStoredSetting(
				'settings.hideUnverifiedMessages',
				state.hideUnverifiedMessages ? SETTINGS_OPTIONS.SHOW : SETTINGS_OPTIONS.HIDE,
			);
		},
		toggleSettings(state) {
			// Add debugging to trace calls
			if (typeof window !== 'undefined') {
				// biome-ignore lint/suspicious/noConsole: Debug code to trace modal opening issue
				console.log(
					'🔧 toggleSettings called, current:',
					state.isOpen,
					'-> will be:',
					!state.isOpen,
				);
				// biome-ignore lint/suspicious/noConsole: Debug code to trace modal opening issue
				console.trace('Call stack:');
			}
			state.isOpen = !state.isOpen;
		},
		openSettings(state) {
			state.isOpen = true;
		},
		closeSettings(state) {
			state.isOpen = false;
		},
	},
});

export const { toggleSettings, toggleHideUnverifiedMessages, closeSettings, openSettings } =
	settingsSlice.actions;

export default settingsSlice.reducer;
