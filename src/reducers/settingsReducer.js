import { createSlice } from "@reduxjs/toolkit";
import { loadFromLocalStorage, saveInLocalStorage } from "../utils/storage";

export const SETTINGS_OPTIONS = Object.freeze({
  HIDE: "HIDE",
  SHOW: "SHOW",
});

const hideUnverifiedMessagesInitState =
  loadFromLocalStorage("settings.hideUnverifiedMessages") ===
  SETTINGS_OPTIONS.HIDE
    ? false
    : true;

const initialState = {
  hideUnverifiedMessages: hideUnverifiedMessagesInitState,
  isOpen: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    toggleHideUnverifiedMessages(state) {
      state.hideUnverifiedMessages = !state.hideUnverifiedMessages;
      saveInLocalStorage(
        "settings.hideUnverifiedMessages",
        state.hideUnverifiedMessages
          ? SETTINGS_OPTIONS.SHOW
          : SETTINGS_OPTIONS.HIDE
      );
    },
    toggleSettings(state) {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { toggleSettings, toggleHideUnverifiedMessages } =
  settingsSlice.actions;

export default settingsSlice.reducer;
