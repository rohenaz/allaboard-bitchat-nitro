import { createSlice } from '@reduxjs/toolkit';

interface ProfileState {
  isOpen: boolean;
}

const initialState: ProfileState = {
  isOpen: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    toggleProfile: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { toggleProfile } = profileSlice.actions;

export default profileSlice.reducer;
