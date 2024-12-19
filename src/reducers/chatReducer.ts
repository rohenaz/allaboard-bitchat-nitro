import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { head, last } from 'lodash';
import * as channelAPI from '../api/channel';
import { ingestSigners } from './memberListReducer';

// Audio notification setup
const audio = new Audio('https://bitchatnitro.com/audio/notify.mp3');
audio.volume = 0.25;

// Types
interface MessageData {
  tx: {
    h: string; // Transaction hash
  };
  MAP: Array<{
    type?: string;
    context?: string;
    channel?: string;
    messageID?: string;
    encrypted?: string;
    bapID?: string;
    paymail?: string;
  }>;
  B: Array<{
    encoding: string;
    Data: {
      utf8: string;
    };
  }>;
  AIP?: Array<{
    bapId: string;
  }>;
  timestamp?: number;
  myBapId?: string;
}

interface ReactionData {
  tx: {
    h: string;
  };
  MAP: Array<{
    context: 'tx' | 'messageID';
    tx?: string;
    messageID?: string;
  }>;
}

interface ChatState {
  isFileUploadOpen: boolean;
  messages: {
    data: MessageData[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
  };
  reactions: {
    byTxTarget: Record<string, BmapTx[]>;
    byMessageTarget: Record<string, BmapTx[]>;
  };
  typingUser: string | null;
}

// Thunks
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (channelName: string, { dispatch, rejectWithValue }) => {
    try {
      console.log('🔍 Fetching messages for channel:', channelName);
      const response = await channelAPI.getMessages(channelName);
      console.log('📨 Raw message response:', response);

      // Extract messages and signers from response
      const messages = response?.results || [];
      const signers = response?.signers || [];
      console.log(
        `✅ Fetched ${messages.length} messages and ${signers.length} signers`,
      );

      // Ingest signers if present
      if (signers.length > 0) {
        dispatch(ingestSigners(signers));
      }

      // Transform messages to expected format if needed
      const transformedMessages = messages.map((msg: any) => ({
        tx: { h: msg.txid || msg.tx?.h },
        MAP: [
          {
            paymail: msg.paymail || msg.MAP?.[0]?.paymail,
            type: msg.type || msg.MAP?.[0]?.type || 'message',
            context: msg.context || msg.MAP?.[0]?.context || 'channel',
            channel: msg.channel || msg.MAP?.[0]?.channel,
            messageID: msg.messageID || msg.MAP?.[0]?.messageID,
            encrypted: msg.encrypted || msg.MAP?.[0]?.encrypted,
            bapID: msg.bapID || msg.MAP?.[0]?.bapID,
          },
        ],
        B: [
          {
            encoding: 'utf8',
            Data: { utf8: msg.content || msg.B?.[0]?.Data?.utf8 || '' },
          },
        ],
        timestamp: msg.timestamp || msg.createdAt || Date.now() / 1000,
        myBapId: msg.myBapId,
      }));

      // Sort messages by timestamp in descending order (newest first)
      return transformedMessages.sort((a, b) => {
        const timestampA = a.timestamp || 0;
        const timestampB = b.timestamp || 0;
        return timestampB - timestampA;
      });
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load messages',
      );
    }
  },
);

export const fetchMoreMessages = createAsyncThunk(
  'chat/fetchMoreMessages',
  async (channelName: string, { rejectWithValue }) => {
    try {
      const response = await channelAPI.getMessages(channelName);
      const messages = response?.results || [];

      // Transform and sort messages
      const transformedMessages = messages
        .map((msg: any) => ({
          tx: { h: msg.txid },
          MAP: [
            {
              paymail: msg.paymail,
              type: msg.type,
              context: msg.context,
              channel: msg.channel,
              messageID: msg.messageID,
              encrypted: msg.encrypted,
              bapID: msg.bapID,
            },
          ],
          B: [
            {
              encoding: 'utf8',
              Data: { utf8: msg.content },
            },
          ],
          timestamp: msg.timestamp,
          myBapId: msg.myBapId,
        }))
        .sort((a, b) => {
          const timestampA = a.timestamp || 0;
          const timestampB = b.timestamp || 0;
          return timestampB - timestampA;
        });

      return transformedMessages;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load messages',
      );
    }
  },
);

const initialState: ChatState = {
  isFileUploadOpen: false,
  messages: {
    data: [],
    loading: false,
    error: null,
    hasMore: true,
  },
  reactions: {
    byTxTarget: {},
    byMessageTarget: {},
  },
  typingUser: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleFileUpload(state) {
      state.isFileUploadOpen = !state.isFileUploadOpen;
    },
    receiveNewMessage(state, action) {
      const message = action.payload;
      // Insert new message at the beginning of the array (newest first)
      state.messages.data.unshift(message);
    },
    receiveEditedMessage(state, action) {
      const editedMessage = action.payload;
      const index = state.messages.data.findIndex(
        (msg) => msg.tx.h === editedMessage.tx.h,
      );
      if (index !== -1) {
        state.messages.data[index] = editedMessage;
      }
    },
    receiveDeletedMessage(state, action) {
      const deletedMessage = action.payload;
      state.messages.data = state.messages.data.filter(
        (msg) => msg.tx.h !== deletedMessage.tx.h,
      );
    },
    receiveNewReaction(state, action) {
      const reaction = action.payload;
      const mapData = head(reaction.MAP);
      if (!mapData) return;

      if (mapData.context === 'tx') {
        const txTarget = mapData.tx;
        if (!txTarget) return;

        if (!state.reactions.byTxTarget[txTarget]) {
          state.reactions.byTxTarget[txTarget] = [];
        }
        state.reactions.byTxTarget[txTarget].push(reaction);
      } else if (mapData.context === 'messageID') {
        const messageId = mapData.messageID;
        if (!messageId) return;

        if (!state.reactions.byMessageTarget[messageId]) {
          state.reactions.byMessageTarget[messageId] = [];
        }
        state.reactions.byMessageTarget[messageId].push(reaction);
      }
    },
    updateTypingUser(state, action) {
      state.typingUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        console.log('⏳ Messages fetch pending...');
        state.messages.loading = true;
        state.messages.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        console.log('✅ Messages fetch succeeded');
        console.log('📊 Message state update:', {
          messageCount: action.payload.length,
          firstMessage: action.payload[0],
          lastMessage: action.payload[action.payload.length - 1],
        });
        state.messages.loading = false;
        state.messages.data = action.payload;
        state.messages.hasMore = action.payload.length === 100;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        console.error('❌ Messages fetch failed:', action.payload);
        state.messages.loading = false;
        state.messages.error = action.payload as string;
      })
      .addCase(fetchMoreMessages.fulfilled, (state, action) => {
        // Append messages while maintaining sort order
        const allMessages = [...state.messages.data, ...action.payload];
        state.messages.data = allMessages.sort((a, b) => {
          const timestampA = a.timestamp || 0;
          const timestampB = b.timestamp || 0;
          return timestampB - timestampA;
        });
        state.messages.hasMore = action.payload.length === 100;
      });
  },
});

export const {
  receiveNewMessage,
  receiveNewReaction,
  receiveEditedMessage,
  receiveDeletedMessage,
  updateTypingUser,
  toggleFileUpload,
} = chatSlice.actions;

export default chatSlice.reducer;
