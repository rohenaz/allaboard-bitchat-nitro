import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { head, last } from "lodash";
import * as channelAPI from "../api/channel.js";
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
      return response?.data;
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
      return response?.data;
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
      return response?.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

const initialState = {
  isFileUploadOpen: false,
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
    toggleFileUpload(state, action) {
      state.isFileUploadOpen = !state.isFileUploadOpen;
    },
    receiveNewReaction(state, action) {
      const reaction = action.payload;
      // state.reactions.byId[reaction.tx.h] = reaction;
      if (head(reaction.MAP).context === "tx") {
        if (!state.reactions.byTxTarget[head(reaction.MAP).tx]) {
          state.reactions.byTxTarget[head(reaction.MAP).tx] = [];
        }
        state.reactions.byTxTarget[head(reaction.MAP).tx].push(reaction);
        state.reactions.allTxTargets.push(head(reaction.MAP).tx);
        state.reactions.allTxIds.push(reaction.tx.h);
      } else if (head(reaction.MAP).context === "messageID") {
        if (!state.reactions.byMessageTarget[head(reaction.MAP).messageID]) {
          state.reactions.byMessageTarget[head(reaction.MAP).messageID] = [];
        }
        state.reactions.byMessageTarget[head(reaction.MAP).messageID].push(
          reaction
        );
        state.reactions.allMessageTargets.push(head(reaction.MAP).messageID);
        state.reactions.allMessageIds.push(reaction.tx.h);
      }
    },
    receiveNewMessage(state, action) {
      // TODO: If channel is set, update channel updateAt time

      const message = action.payload;
      const myBapId = message.myBapId;
      if (
        (!head(message.MAP).context ||
          head(message.MAP).context === "channel") &&
        head(message.MAP).paymail &&
        !validateEmail(head(message.MAP).paymail)
      ) {
        console.log("invalid message", message);
        return;
      }

      console.log("valid message", message);
      state.messages.byId[message.tx.h] = message;
      state.messages.allIds.push(message.tx.h);

      if (head(message.MAP).messageID) {
        state.messages.allMessageIds.push(head(message.MAP).messageID);
      }

      // play audio if channel matches or user matches
      let pathId = last(window?.location?.pathname?.split("/")) || null;

      if (message.AIP) {
        // If DM
        const fromThem = pathId === head(message.AIP).bapId;
        const toMe = head(message.MAP).bapID === myBapId;
        const fromMe = myBapId === head(message.AIP).bapId;
        const toThem = head(message.MAP).bapID === pathId;

        if ((fromThem && toMe) || (fromMe && toThem)) {
          audio.play();
          return;
        }
      }

      if (
        (!pathId && !head(message.MAP)?.channel) ||
        pathId?.toLowerCase() === head(message.MAP)?.channel?.toLowerCase()
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
        (action.payload?.like || []).forEach((reaction) => {
          if (!state.reactions.byTxTarget[head(reaction.MAP).tx]) {
            state.reactions.byTxTarget[head(reaction.MAP).tx] = [];
          }
          state.reactions.byTxTarget[head(reaction.MAP).tx].push(reaction);
          state.reactions.allTxTargets.push(head(reaction.MAP).tx);
          state.reactions.allTxIds.push(reaction.tx.h);
        });
      })
      .addCase(loadDiscordReactions.fulfilled, (state, action) => {
        state.reactions.byMessageTarget = {};
        state.reactions.allMessageTargets = [];
        state.reactions.loading = false;
        (action.payload?.like || []).forEach((reaction) => {
          if (!state.reactions.byMessageTarget[head(reaction.MAP).messageID]) {
            state.reactions.byMessageTarget[head(reaction.MAP).messageID] = [];
          }
          state.reactions.byMessageTarget[head(reaction.MAP).messageID].push(
            reaction
          );
          state.reactions.allMessageTargets.push(head(reaction.MAP).messageID);
          state.reactions.allMessageIds.push(reaction.tx.h);
        });
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.messages.byId = {};
        state.messages.allIds = [];
        state.messages.loading = false;
        (action.payload?.message || []).forEach((message) => {
          if (
            head(message.MAP).paymail &&
            !validateEmail(head(message.MAP).paymail)
          ) {
            return;
          }

          // Filter out txs with wrong encoding (oops)
          if (
            head(message.B).encoding === "utf-8" &&
            head(message.MAP).encrypted === "true"
          ) {
            return;
          }

          state.messages.byId[message.tx.h] = message;
          state.messages.allIds.push(message.tx.h);
          // Discord messages
          if (head(message.MAP).messageID) {
            state.messages.allMessageIds.push(head(message.MAP).messageID);
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
  toggleFileUpload,
} = chatSlice.actions;

export default chatSlice.reducer;
