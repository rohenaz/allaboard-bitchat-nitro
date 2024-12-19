import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { head, last } from "lodash";
import * as channelAPI from "../api/channel";
import { validateEmail } from "../utils/strings.jsx";

const audio = new Audio("https://bitchatnitro.com/audio/notify.mp3");
audio.volume = 0.25;

export const loadMessages = createAsyncThunk(
  "chat/loadMessages",
  async ({ activeChannelId, activeUserId, myBapId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await channelAPI.getMessages(
        activeChannelId,
        activeUserId,
        myBapId
      );
      return {
        messages: response?.data?.message || [],
        pagination: {
          page: response?.data?.page || 1,
          limit: response?.data?.limit || 100,
          count: response?.data?.count || 0
        }
      };
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

export const loadLikes = createAsyncThunk(
  "chat/loadLikes",
  async (txIds, { rejectWithValue }) => {
    try {
      const response = await channelAPI.getLikes(txIds);
      if (!response || !Array.isArray(response)) {
        console.error('Invalid response from getLikes:', response);
        return rejectWithValue('Invalid response format from getLikes');
      }
      return response;
    } catch (err) {
      console.error('Error loading likes:', err);
      return rejectWithValue(err.response || err.message);
    }
  }
);

const initialState = {
  isFileUploadOpen: false,
  messages: {
    byId: {},
    allIds: [],
    allMessageIds: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 100,
      count: 0
    }
  },
  reactions: {
    byTxTarget: {},
    byMessageTarget: {},
    allMessageIds: [],
    allTxIds: [],
    allTxTargets: [],
    allMessageTargets: [],
    loading: true,
  },
  likes: {
    byTxId: {},
    loading: false,
    error: null
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
      if (!head(message.MAP).context) {
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
      const pathId = last(window?.location?.pathname?.split("/")) || null;

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
      .addCase(loadMessages.pending, (state) => {
        state.messages.loading = true;
        state.messages.error = null;
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.messages.byId = {};
        state.messages.allIds = [];
        state.messages.loading = false;
        state.messages.pagination = action.payload.pagination;

        for (const message of (action.payload.messages || [])) {
          // Filter out txs with wrong encoding (oops)
          if (
            head(message.B).encoding === "utf-8" &&
            head(message.MAP).encrypted === "true"
          ) {
            continue;
          }

          state.messages.byId[message.tx.h] = message;
          state.messages.allIds.push(message.tx.h);
          // Discord messages
          if (head(message.MAP).messageID) {
            state.messages.allMessageIds.push(head(message.MAP).messageID);
          }
        }
      })
      .addCase(loadMessages.rejected, (state, action) => {
        state.messages.loading = false;
        state.messages.error = action.payload;
      })
      .addCase(loadDiscordReactions.fulfilled, (state, action) => {
        state.reactions.byMessageTarget = {};
        state.reactions.allMessageTargets = [];
        state.reactions.loading = false;
        for (const reaction of (action.payload?.like || [])) {
          if (!state.reactions.byMessageTarget[head(reaction.MAP).messageID]) {
            state.reactions.byMessageTarget[head(reaction.MAP).messageID] = [];
          }
          state.reactions.byMessageTarget[head(reaction.MAP).messageID].push(
            reaction
          );
          state.reactions.allMessageTargets.push(head(reaction.MAP).messageID);
          state.reactions.allMessageIds.push(reaction.tx.h);
        }
      })
      .addCase(loadLikes.pending, (state) => {
        state.likes.loading = true;
        state.likes.error = null;
      })
      .addCase(loadLikes.fulfilled, (state, action) => {
        state.likes.loading = false;
        state.likes.error = null;
        
        // Reset the state for new likes
        state.likes.byTxId = {};
        
        if (Array.isArray(action.payload)) {
          action.payload.forEach(like => {
            if (like?.txid) {
              state.likes.byTxId[like.txid] = {
                likes: Array.isArray(like.likes) ? like.likes : [],
                total: typeof like.total === 'number' ? like.total : 0,
                signers: Array.isArray(like.signers) ? like.signers : []
              };
            }
          });
        }
      })
      .addCase(loadLikes.rejected, (state, action) => {
        state.likes.loading = false;
        state.likes.error = action.payload;
        console.error('Failed to load likes:', action.payload);
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
