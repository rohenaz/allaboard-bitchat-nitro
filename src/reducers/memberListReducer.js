import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { find, head } from 'lodash';
import * as channelAPI from '../api/channel';

const initialState = {
  active: null,
  onlineUsers: [],
  byId: {},
  allIds: [],
  isOpen: false,
  loading: true,
  // friends: [],
  signers: {
    byId: {},
    allIds: [],
  },
  friendRequests: {
    loading: true,
    incoming: { allIds: [], byId: {} },
    outgoing: { allIds: [], byId: {} },
  },
  // incomingFriendRequests: [], // Array of BAP ids
  // outgoingFriendRequests: [], // Array of BAP ids
};

export const loadUsers = createAsyncThunk(
  'memberList/loadUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await channelAPI.getUsers();
      return response;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const loadFriends = createAsyncThunk(
  'memberList/loadFriends',
  async (_, { rejectWithValue, getState }) => {
    const { session } = getState();
    try {
      const response = await channelAPI.getFriends(session.bapId);
      return response;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

const memberListSlice = createSlice({
  name: 'memberList',
  initialState,
  reducers: {
    receiveNewFriend(state, action) {
      const friend = action.payload;
      const requester = head(friend.AIP).bapId;
      const recipient = head(friend.MAP).bapID;
      // If logged in user is the recipient
      if (recipient === action.payload.bapId) {
        // build my pending list
        state.friendRequests.incoming.allIds.push(requester);

        state.friendRequests.incoming.byId[requester] = friend;
      } else if (requester === action.payload.bapId) {
        state.friendRequests.outgoing.allIds.push(recipient);

        state.friendRequests.outgoing.byId[recipient] = friend;
      }

      // if we have a friend thing from both recipient and me
      if (
        (state.friendRequests.outgoing.allIds.includes(requester) &&
          state.friendRequests.incoming.allIds.includes(recipient)) ||
        (state.friendRequests.incoming.allIds.includes(requester) &&
          state.friendRequests.outgoing.allIds.includes(recipient))
      ) {
        state.byId[
          recipient === action.payload.bapId ? requester : recipient
        ].isFriend = true;
      }
    },
    setActiveUser(state, action) {
      state.active = action.payload;
    },
    updateOnlineUsers(state, action) {
      state.onlineUsers = action.payload;
    },
    toggleMemberList(state, _action) {
      state.isOpen = !state.isOpen;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUsers.pending, (state, _action) => {
        state.loading = true;
      })
      .addCase(loadUsers.fulfilled, (state, action) => {
        state.loading = false;
        const users = action.payload?.data || [];
        for (const user of users) {
          if (!state.allIds.includes(user.idKey)) {
            state.byId[user.idKey] = user;
            state.allIds.push(user.idKey);
          }
        }
      })
      .addCase(loadFriends.pending, (state, _action) => {
        state.friendRequests.loading = true;
      })
      .addCase(loadFriends.fulfilled, (state, action) => {
        state.friendRequests.loading = false;
        const friends = action.payload?.data || [];
        for (const friend of friends) {
          // exclude our original broken friend requests
          if (friend.MAP?.type === 'friend') {
            const bapId = friend.MAP?.bapID;
            const publicKey = friend.MAP?.publicKey;
            const signer = friend.AIP?.signer;

            if (bapId && publicKey && signer) {
              state.friendRequests.incoming.byId[bapId] = friend;
              if (!state.friendRequests.incoming.allIds.includes(bapId)) {
                state.friendRequests.incoming.allIds.push(bapId);
              }
            }
          }
        }
      });
  },
});

export const {
  receiveNewFriend,
  updateOnlineUsers,
  toggleMemberList,
  setActiveUser,
} = memberListSlice.actions;

export default memberListSlice.reducer;
