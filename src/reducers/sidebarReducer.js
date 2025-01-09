import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: {
      reducer(state) {
        state.isOpen = !state.isOpen;
      },
      prepare() {
        return { payload: undefined };
      },
    },
  },
});

export const { toggleSidebar } = sidebarSlice.actions;

export default sidebarSlice.reducer;
