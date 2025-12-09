import { createSlice } from '@reduxjs/toolkit';

interface ProfileState {
	profile: unknown; // TODO: Add proper profile type
	isOpen: boolean;
}

const initialState: ProfileState = {
	profile: {},
	isOpen: false,
};

const profileSlice = createSlice({
	name: 'profile',
	initialState,
	reducers: {
		setProfile: (state, action) => {
			state.profile = action.payload;
		},
		toggleProfile: (state) => {
			state.isOpen = !state.isOpen;
		},
	},
});

export const { setProfile, toggleProfile } = profileSlice.actions;

export default profileSlice.reducer;
