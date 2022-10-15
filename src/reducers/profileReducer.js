import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: {},
  isOpen: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile(state, action) {
      state.profile = action.payload;
    },
    toggleProfile(state, action) {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { setProfile, toggleProfile } = profileSlice.actions;

export default profileSlice.reducer;
