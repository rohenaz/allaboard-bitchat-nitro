import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as channelAPI from "../api/channel";

const initialState = {
  active: null,
  onlineUsers: [],
  byId: {},
  allIds: [],
  isOpen: false,
  loading: true,
};

export const loadUsers = createAsyncThunk(
  "memberList/loadUsers",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await channelAPI.getUsers();
      // dispatch(loadPins());
      console.log({ response });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

const memberListSlice = createSlice({
  name: "memberList",
  initialState,
  reducers: {
    setActiveUser(state, action) {
      state.active = action.payload;
    },
    updateOnlineUsers(state, action) {
      state.onlineUsers = action.payload;
    },
    toggleMemberList(state, action) {
      state.isOpen = !state.isOpen;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUsers.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(loadUsers.fulfilled, (state, action) => {
        state.loading = false;

        action.payload.c.forEach((user) => {
          if (!state.allIds.includes(user._id)) {
            state.byId[user._id] = user;
            state.allIds.push(user._id);
          }
        });
      });
  },
});

export const { updateOnlineUsers, toggleMemberList, setActiveUser } =
  memberListSlice.actions;

export default memberListSlice.reducer;
