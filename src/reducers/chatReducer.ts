import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import { head } from 'lodash';
import * as channelAPI from '../api/channel';
import type { Message, MessageResponse } from '../api/channel';
import { ingestSigners } from './memberListReducer';

// Audio notification setup
const audio = new Audio('https://bitchatnitro.com/audio/notify.mp3');
audio.volume = 0.25;

// Types
interface BmapTx {
  tx: {
    h: string;
  };
  MAP: Array<{
    app?: string;
    type?: string;
    paymail?: string;
    context?: string;
    channel?: string;
    messageID?: string;
    encrypted?: string;
    bapID?: string;
    tx?: string;
  }>;
  B?: Array<{
    encoding: string;
    Data: { utf8: string };
    'content-type'?: string;
  }>;
  timestamp?: number;
  blk?: {
    t: number;
  };
  myBapId?: string;
}

interface ChatState {
  isFileUploadOpen: boolean;
  messages: {
    data: BmapTx[];
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
export const fetchMessages = createAsyncThunk<
  BmapTx[],
  string,
  { rejectValue: string }
>('chat/fetchMessages', async (channelName, { dispatch, rejectWithValue }) => {
  try {
    console.log('🔍 Fetching messages for channel:', channelName);
    const response = await channelAPI.getMessages(channelName);
    console.log('📨 Raw message response:', response);

    // Extract messages and signers from response
    const messages = response.results || [];
    const signers = response.signers || [];
    console.log(
      `✅ Fetched ${messages.length} messages and ${signers.length} signers`,
    );

    // Ingest signers if present
    if (signers.length > 0) {
      dispatch(ingestSigners(signers));
    }

    // Transform messages to expected format if needed
    const transformedMessages = messages.map(
      (msg: Message): BmapTx => {
        // Handle both content formats
        const content = msg.content || msg.B?.[0]?.Data?.utf8 || msg.B?.[0]?.content || '';
        const contentType = msg['content-type'] || msg.B?.[0]?.['content-type'] || 'text/plain';
        
        return {
          tx: { h: msg.txid || msg.tx?.h || '' },
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
              Data: { utf8: content },
              'content-type': contentType,
            },
          ],
          timestamp: msg.timestamp || msg.createdAt || msg.blk?.t,
          blk: msg.blk,
          myBapId: msg.myBapId,
        };
      },
    );

    // Sort messages by timestamp in descending order (newest first)
    return transformedMessages.sort((a: BmapTx, b: BmapTx) => {
      const timestampA = a.timestamp || a.blk?.t || 0;
      const timestampB = b.timestamp || b.blk?.t || 0;
      return timestampB - timestampA;
    });
  } catch (error) {
    console.error('❌ Failed to fetch messages:', error);
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to load messages',
    );
  }
});

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
    receiveNewMessage(state, action: PayloadAction<BmapTx>) {
      const message = action.payload;
      const mapData = head(message.MAP);
      const context = mapData?.context;
      const tx = mapData?.tx;
      const messageID = mapData?.messageID;

      if (context === 'tx' || context === 'messageID') {
        const target = tx || messageID;
        if (target) {
          if (!state.reactions.byTxTarget[target]) {
            state.reactions.byTxTarget[target] = [];
          }
          state.reactions.byTxTarget[target].push(message);
        }
      } else {
        state.messages.data.unshift(message);
      }
    },
    receiveNewReaction(state, action: PayloadAction<BmapTx>) {
      const message = action.payload;
      const mapData = head(message.MAP);
      const context = mapData?.context;
      const messageID = mapData?.messageID;

      if (context === 'tx' || context === 'messageID') {
        const target = messageID;
        if (target) {
          if (!state.reactions.byMessageTarget[target]) {
            state.reactions.byMessageTarget[target] = [];
          }
          state.reactions.byMessageTarget[target].push(message);
        }
      }
    },
    updateTypingUser(state, action: PayloadAction<string | null>) {
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
  toggleFileUpload,
  receiveNewMessage,
  receiveNewReaction,
  updateTypingUser,
} = chatSlice.actions;

export default chatSlice.reducer;
