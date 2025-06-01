import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import { head } from 'lodash';
import * as bmapAPI from '../api/bmap';
import * as channelAPI from '../api/channel';
import type { Message, MessageResponse } from '../api/channel';
import { ingestSigners } from './memberListReducer';

// Audio notification setup
const audio = new Audio('https://bitchatnitro.com/audio/notify.mp3');
audio.volume = 0.25;

// Types
export interface BmapTx {
  tx?: {
    h: string;
  };
  _id?: string;
  MAP: Array<{
    cmd?: string;
    app?: string;
    type?: string;
    paymail?: string;
    context?: string;
    channel?: string;
    messageID?: string;
    encrypted?: string;
    bapID?: string;
    tx?: string;
    emoji?: string;
  }>;
  AIP?: Array<{
    bapId?: string;
    address?: string;
    signature?: string;
  }>;
  B?: Array<{
    content?: string;
    'content-type'?: string;
    encoding?: string;
  }>;
  timestamp?: number;
  blk?: {
    i?: number;
    t: number;
    h?: string;
  };
  in?: Array<{
    e: {
      a: string;
      h: string;
      i: number;
    };
  }>;
  lock?: number;
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
interface FetchMessagesParams {
  channelName?: string;
  userId?: string;
  currentUserId?: string;
}

export const fetchMessages = createAsyncThunk<
  BmapTx[],
  FetchMessagesParams,
  { rejectValue: string }
>('chat/fetchMessages', async (params, { dispatch, rejectWithValue }) => {
  try {
    const { channelName, userId, currentUserId } = params;
    let response: MessageResponse;

    if (userId && currentUserId) {
      const dmMessages = await bmapAPI.getConversation(currentUserId, userId);
      // Transform DM response to match MessageResponse format
      response = {
        results: dmMessages.map((dm) => ({
          txid: dm.txid,
          content: dm.content,
          timestamp: dm.timestamp,
          paymail: dm.from,
          type: 'message',
          context: 'messageID',
          encrypted: dm.encrypted ? 'true' : undefined,
          bapID: dm.from,
        })),
        signers: [],
      };
    } else if (channelName) {
      response = await channelAPI.getMessages(channelName);
    } else {
      throw new Error('Either channelName or userId must be provided');
    }

    // Extract messages and signers from response
    const messages = response.results || [];
    const signers = response.signers || [];

    // Ingest signers if present
    if (signers.length > 0) {
      dispatch(ingestSigners(signers));
    }

    // Transform messages to expected format if needed
    const transformedMessages = messages.map((msg: Message): BmapTx => {
      // Handle both content formats
      const content = msg.content || msg.B?.[0]?.content || '';
      const contentType = 'text/plain';

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
            encoding: 'utf-8',
            content: content,
            'content-type': contentType,
          },
        ],
        timestamp: msg.timestamp || msg.createdAt || msg.blk?.t,
        blk: msg.blk,
        myBapId: msg.myBapId,
        AIP: msg.AIP,
      };
    });

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
  async (params: FetchMessagesParams, { rejectWithValue }) => {
    try {
      const { channelName, userId, currentUserId } = params;
      let response: MessageResponse;

      if (userId && currentUserId) {
        // Fetch more DM messages
        const dmMessages = await bmapAPI.getConversation(currentUserId, userId);
        response = {
          results: dmMessages.map((dm) => ({
            txid: dm.txid,
            content: dm.content,
            timestamp: dm.timestamp,
            paymail: dm.from,
            type: 'message',
            context: 'messageID',
            encrypted: dm.encrypted ? 'true' : undefined,
            bapID: dm.from,
          })),
          signers: [],
        };
      } else if (channelName) {
        response = await channelAPI.getMessages(channelName);
      } else {
        throw new Error('Either channelName or userId must be provided');
      }

      const messages = response?.results || [];

      // Transform and sort messages
      const transformedMessages = messages
        .map((msg: Message) => ({
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
              encoding: 'utf-8',
              content: msg.content || '',
            },
          ],
          timestamp: msg.timestamp,
          myBapId: msg.myBapId,
          AIP: msg.AIP,
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
        state.messages.loading = true;
        state.messages.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
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
