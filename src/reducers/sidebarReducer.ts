import { createSlice } from '@reduxjs/toolkit';

interface SidebarState {
	isOpen: boolean;
}

const initialState: SidebarState = {
	isOpen: true, // Default to open on desktop, mobile will handle this differently
};

const sidebarSlice = createSlice({
	name: 'sidebar',
	initialState,
	reducers: {
		toggleSidebar: (state) => {
			state.isOpen = !state.isOpen;
		},
	},
});

export const { toggleSidebar } = sidebarSlice.actions;

export default sidebarSlice.reducer;
