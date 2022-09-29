import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import * as channelAPI from "../api/channel";
var audio = new Audio("https://bitchatnitro.com/audio/notify.mp3");
audio.volume = 0.25;
//const searchParams = new URLSearchParams(window.location.search);

export const loadMessages = createAsyncThunk(
  "chat/loadMessages",
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await channelAPI.getMessages(channelId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

export const loadReactions = createAsyncThunk(
  "chat/loadReactions",
  async (txIds, { rejectWithValue }) => {
    try {
      const response = await channelAPI.getReactions(txIds);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

const initialState = {
  messages: { byId: {}, allIds: [], loading: true },
  reactions: { byTarget: {}, allIds: [], allTargets: [], loading: true },
  typingUser: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    receiveNewReaction(state, action) {
      const reaction = action.payload;
      // state.reactions.byId[reaction.tx.h] = reaction;
      if (!state.reactions.byTarget[reaction.MAP.tx]) {
        state.reactions.byTarget[reaction.MAP.tx] = [];
      }
      state.reactions.byTarget[reaction.MAP.tx].push(reaction);
      state.reactions.allIds.push(reaction.tx.h);
      state.reactions.allTargets.push(reaction.MAP.tx);
    },
    receiveNewMessage(state, action) {
      const message = action.payload;
      state.messages.byId[message.tx.h] = message;
      state.messages.allIds.push(message.tx.h);
      audio.play();
    },
    receiveEditedMessage(state, action) {
      const message = action.payload;
      state.messages.byId[message.tx.h] = message;
    },
    receiveDeletedMessage(state, action) {
      const message = action.payload;
      delete state.messages.byId[message.tx.h];
      state.messages.allIds = state.messages.allIds.filter(
        (id) => id !== message.tx.h
      );
    },
    editMessage(state, action) {},
    deleteMessage(state, action) {},
    typing(state, action) {},
    stopTyping(state, action) {},
    updateTypingUser(state, action) {
      state.typingUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadReactions.pending, (state, action) => {
        state.reactions.loading = true;
      })
      .addCase(loadMessages.pending, (state, action) => {
        state.messages.loading = true;
      })
      .addCase(loadReactions.fulfilled, (state, action) => {
        state.reactions.byId = {};
        state.reactions.allTargets = [];
        state.reactions.loading = false;
        action.payload.c.forEach((reaction) => {
          if (!state.reactions.byTarget[reaction.MAP.tx]) {
            state.reactions.byTarget[reaction.MAP.tx] = [];
          }
          state.reactions.byTarget[reaction.MAP.tx].push(reaction);
          state.reactions.allIds.push(reaction.tx.h);
          state.reactions.allTargets.push(reaction.MAP.tx);
        });
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.messages.byId = {};
        state.messages.allIds = [];
        state.messages.loading = false;
        action.payload.c.forEach((message) => {
          state.messages.byId[message.tx.h] = message;
          state.messages.allIds.push(message.tx.h);
        });
      });
  },
});

export const {
  setActiveChannel,
  receiveNewMessage,
  receiveNewReaction,
  receiveEditedMessage,
  receiveDeletedMessage,
  updateOnlineUsers,
  updateTypingUser,
  editMessage,
  deleteMessage,
  stopTyping,
  typing,
} = chatSlice.actions;

export default chatSlice.reducer;
