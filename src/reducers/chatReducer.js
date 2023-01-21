import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { last } from "lodash";
import * as channelAPI from "../api/channel";
import { validateEmail } from "../utils/strings.js";

var audio = new Audio("https://bitchatnitro.com/audio/notify.mp3");
audio.volume = 0.25;

export const loadMessages = createAsyncThunk(
  "chat/loadMessages",
  async ({ activeChannelId, activeUserId, myBapId }, { rejectWithValue }) => {
    try {
      // console.log("loading messages", {
      //   activeChannelId,
      //   activeUserId,
      //   user: session.user,
      // });
      const response = await channelAPI.getMessages(
        activeChannelId,
        activeUserId,
        myBapId
      );
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

export const loadDiscordReactions = createAsyncThunk(
  "chat/loadDiscordReactions",
  async (messageIds, { rejectWithValue }) => {
    try {
      const response = await channelAPI.getDiscordReactions(messageIds);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

const initialState = {
  messages: { byId: {}, allIds: [], allMessageIds: [], loading: true },
  reactions: {
    byTxTarget: {},
    byMessageTarget: {},
    allMessageIds: [],
    allTxIds: [],
    allTxTargets: [],
    allMessageTargets: [],
    loading: true,
  },
  typingUser: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    receiveNewReaction(state, action) {
      const reaction = action.payload;
      // state.reactions.byId[reaction.tx.h] = reaction;
      if (reaction.MAP.context === "tx") {
        if (!state.reactions.byTxTarget[reaction.MAP.tx]) {
          state.reactions.byTxTarget[reaction.MAP.tx] = [];
        }
        state.reactions.byTxTarget[reaction.MAP.tx].push(reaction);
        state.reactions.allTxTargets.push(reaction.MAP.tx);
        state.reactions.allTxIds.push(reaction.tx.h);
      } else if (reaction.MAP.context === "messageID") {
        if (!state.reactions.byMessageTarget[reaction.MAP.messageID]) {
          state.reactions.byMessageTarget[reaction.MAP.messageID] = [];
        }
        state.reactions.byMessageTarget[reaction.MAP.messageID].push(reaction);
        state.reactions.allMessageTargets.push(reaction.MAP.messageID);
        state.reactions.allMessageIds.push(reaction.tx.h);
      }
    },
    receiveNewMessage(state, action) {
      // TODO: If channel is set, update channel updateAt time

      const message = action.payload;
      const myBapId = message.myBapId;
      if (
        (!message.MAP.context || message.MAP.context === "channel") &&
        message.MAP.paymail &&
        !validateEmail(message.MAP.paymail)
      ) {
        console.log("invalid message", message);
        return;
      }

      console.log("valid message", message);
      state.messages.byId[message.tx.h] = message;
      state.messages.allIds.push(message.tx.h);

      if (message.MAP.messageID) {
        state.messages.allMessageIds.push(message.MAP.messageID);
      }

      // play audio if channel matches or user matches
      let pathId = last(window.location.pathname.split("/")) || null;

      if (message.AIP) {
        // If DM
        const fromThem = pathId === message.AIP.bapId;
        const toMe = message.MAP.bapID === myBapId;
        const fromMe = myBapId === message.AIP.bapId;
        const toThem = message.MAP.bapID === pathId;

        if ((fromThem && toMe) || (fromMe && toThem)) {
          audio.play();
          return;
        }
      }

      if (
        (!pathId && !message.MAP?.channel) ||
        pathId?.toLowerCase() === message.MAP?.channel?.toLowerCase()
      ) {
        // IF CHANNEL or GLOBAL
        audio.play();
      }
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
        state.reactions.byTxTarget = {};
        state.reactions.byMessageTarget = {};
        state.reactions.allTxTargets = [];
        state.reactions.allMessageTargets = [];
        state.reactions.loading = false;
        action.payload.c.forEach((reaction) => {
          if (!state.reactions.byTxTarget[reaction.MAP.tx]) {
            state.reactions.byTxTarget[reaction.MAP.tx] = [];
          }
          state.reactions.byTxTarget[reaction.MAP.tx].push(reaction);
          state.reactions.allTxTargets.push(reaction.MAP.tx);
          state.reactions.allTxIds.push(reaction.tx.h);
        });
      })
      .addCase(loadDiscordReactions.fulfilled, (state, action) => {
        state.reactions.byMessageTarget = {};
        state.reactions.allMessageTargets = [];
        state.reactions.loading = false;
        action.payload.c.forEach((reaction) => {
          if (!state.reactions.byMessageTarget[reaction.MAP.messageID]) {
            state.reactions.byMessageTarget[reaction.MAP.messageID] = [];
          }
          state.reactions.byMessageTarget[reaction.MAP.messageID].push(
            reaction
          );
          state.reactions.allMessageTargets.push(reaction.MAP.messageID);
          state.reactions.allMessageIds.push(reaction.tx.h);
        });
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.messages.byId = {};
        state.messages.allIds = [];
        state.messages.loading = false;
        action.payload.c.forEach((message) => {
          if (message.MAP.paymail && !validateEmail(message.MAP.paymail)) {
            return;
          }

          // Filter out txs with wrong encoding (oops)
          if (
            message.B.encoding === "utf-8" &&
            message.MAP.encrypted === "true"
          ) {
            return;
          }

          state.messages.byId[message.tx.h] = message;
          state.messages.allIds.push(message.tx.h);
          // Discord messages
          if (message.MAP.messageID) {
            state.messages.allMessageIds.push(message.MAP.messageID);
          }
        });
      });
  },
});

export const {
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
