import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as channelAPI from "../api/channel";

const initialState = {
  active: null,
  onlineUsers: [],
  byId: {},
  allIds: [],
  isOpen: false,
  loading: true,
  // friends: [],
  friendRequests: {
    loading: true,
    incoming: [],
    outgoing: [],
  },
  // incomingFriendRequests: [], // Array of BAP ids
  // outgoingFriendRequests: [], // Array of BAP ids
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

export const loadFriends = createAsyncThunk(
  "memberList/loadFriends",
  async (_, { dispatch, rejectWithValue, getState }) => {
    const { session } = getState();
    console.log("bap id set in state", session.bapId);
    try {
      const response = await channelAPI.getFriends(session.bapId);
      // dispatch(loadPins());
      console.log({ response });
      response.data.bapId = session.bapId;
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
      })
      .addCase(loadFriends.fulfilled, (state, action) => {
        state.friendRequests.loading = false;
        action.payload.c.forEach((friend) => {
          // If logged in user is the recipient
          if (friend.recipient === action.payload.bapId) {
            // build my pending list
            state.friendRequests.incoming.push(friend.requester);
          } else if (friend.requester === action.payload.bapId) {
            state.friendRequests.outgoing.push(friend.recipient);
            // Friend matches
            // if (!state.byId[friend.recipient]) {
            //   state.byId[friend.recipient] = {};
            // }
            // state.allIds.push(friend.recipient);
          }

          // if we have a friend thing from both recipient and me
          if (
            (state.friendRequests.outgoing.includes(friend.requester) &&
              state.friendRequests.incoming.includes(friend.recipient)) ||
            (state.friendRequests.incoming.includes(friend.requester) &&
              state.friendRequests.outgoing.includes(friend.recipient))
            //   state.incomingFriendRequests.includes(friend.requester)) ||
            // (state.outgoingFriendRequests.includes(friend.recipient) &&
            //   state.outgoingFriendRequests.includes(friend.requester))
          ) {
            state.byId[friend.recipient].isFriend = true;

            console.log("true friend");
          }

          // if (!state.allIds.includes(friend.recipient)) {
          //   // TODO: Check both ways first
          //   state.byId[friend.recipient].isFriend = true;
          //   // friend.isFriend = true;
          //   // state.byId[user.requestee] = user.identity;
          //   state.allIds.push(friend.recipient);
          //   if (!state.friends.includes(friend.recipient)) {
          //     console.log("friends with", friend.recipient);
          //     state.friends.push(friend.recipient);
          //   }
          // } else if (state.byId[friend.recipient]) {
          //   console.log("friends with", friend.recipient);
          //   state.byId[friend.recipient].isFriend = true;
          // } else {
          //   console.log("how tho?", {
          //     userId: friend.recipient,
          //     allIds: [...state.allIds],
          //   });
          // }
        });
      });
  },
});

export const { updateOnlineUsers, toggleMemberList, setActiveUser } =
  memberListSlice.actions;

export default memberListSlice.reducer;
