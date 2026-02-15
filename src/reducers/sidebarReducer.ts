import { createSlice } from '@reduxjs/toolkit';

interface SidebarState {
	isOpen: boolean;
}

// Check if mobile on initialization
const getInitialSidebarState = (): boolean => {
	if (typeof window === 'undefined') return true;
	return window.innerWidth >= 768; // Default open on desktop, closed on mobile
};

const initialState: SidebarState = {
	isOpen: getInitialSidebarState(),
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
