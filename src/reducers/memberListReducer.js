import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { find, head } from "lodash";
import * as channelAPI from "../api/channel.js";

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
  "memberList/loadUsers",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await channelAPI.getUsers();
      // dispatch(loadPins());
      // console.log({ response });
      return response?.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

export const loadFriends = createAsyncThunk(
  "memberList/loadFriends",
  async (_, { dispatch, rejectWithValue, getState }) => {
    const { session } = getState();
    console.log("bap id set in state", session.user.idKey);
    try {
      const response = await channelAPI.getFriends(session.user.idKey);
      // dispatch(loadPins());
      console.log({ response });
      if (response?.data) {
        response.data.bapId = session.user.idKey;
      }
      return response?.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

const memberListSlice = createSlice({
  name: "memberList",
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
        console.log("true friend");
      }
    },
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
        console.log("load users fulfilled");
        action.payload.forEach((user) => {
          // these are now bap identities
          console.log("memberList reducer", { user });
          if (!state.allIds.includes(user.idKey)) {
            state.byId[user.idKey] = user;
            state.allIds.push(user.idKey);
          }
        });
      })
      .addCase(loadFriends.pending, (state, action) => {
        state.friendRequests.loading = true;
      })
      .addCase(loadFriends.fulfilled, (state, action) => {
        console.log("load friends fullfiled", { payload: action.payload });
        state.friendRequests.loading = false;
        action.payload.friend.forEach((friend) => {
          // exclude our original broken friend requests
          if (
            [
              "bb83989697819428c0e8aadaf1bdff0a16bc14ab5e36310ff1e22b5bf835574c",
              "95a4c088bd32c4547d64e7d1405ceae2143e3a45324a9f8c4eb6bba9ef53be98",
              "7182af3be9c258068df78adc68ee7a628721a5e6aa0dda2a0e21dc160bf20bbe",
            ].includes(friend.tx.h)
          ) {
            return;
          }
          // add to signers
          action.payload.signers.forEach((signer) => {
            if (!state.signers.allIds.includes(signer.idKey)) {
              state.signers.allIds.push(signer.idKey);
              state.signers.byId[signer.idKey] = signer;
            }
          });
          // add to friend requests
          const requesterAddress = head(friend.AIP)?.address;
          const requester = find(action.payload.signers, (s) => {
            return s.currentAddress === requesterAddress;
          })?.idKey;
          console.log({ requester });
          const recipient = head(friend.MAP).bapID;

          if (!requester) {
            console.log("wtfd no requester?", {
              friend,
              signers: action.payload.signers,
            });
          }
          // If logged in user is the recipient
          if (requester && recipient === action.payload.bapId) {
            // build my pending list
            state.friendRequests.incoming.allIds.push(requester);

            // attach the corresponding signer
            friend = {
              signer: find(action.payload.signers, (s) => {
                return s.idKey === requester;
              }),
              ...friend,
            };
            state.friendRequests.incoming.byId[requester] = friend;
          } else if (requester && requester === action.payload.bapId) {
            state.friendRequests.outgoing.allIds.push(recipient);

            // attach the corresponding signer
            friend = {
              signer: find(action.payload.signers, (s) => {
                return s.idKey === requester;
              }),
              ...friend,
            };

            state.friendRequests.outgoing.byId[recipient] = friend;

            // Friend matches
            // if (!state.byId[friend.recipient]) {
            //   state.byId[friend.recipient] = {};
            // }
            // state.allIds.push(friend.recipient);
          }

          // if we have a friend thing from both recipient and me
          if (
            (state.friendRequests.outgoing.allIds.includes(requester) &&
              state.friendRequests.incoming.allIds.includes(recipient)) ||
            (state.friendRequests.incoming.allIds.includes(requester) &&
              state.friendRequests.outgoing.allIds.includes(recipient))
            //   state.incomingFriendRequests.includes(friend.requester)) ||
            // (state.outgoingFriendRequests.includes(friend.recipient) &&
            //   state.outgoingFriendRequests.includes(friend.requester))
          ) {
            state.byId[
              recipient === action.payload.bapId ? requester : recipient
            ].isFriend = true;
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

export const {
  receiveNewFriend,
  updateOnlineUsers,
  toggleMemberList,
  setActiveUser,
} = memberListSlice.actions;

export default memberListSlice.reducer;
