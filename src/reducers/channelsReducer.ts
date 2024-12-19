import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import { find } from 'lodash';
import moment from 'moment';
import * as channelAPI from '../api/channel';
import { minutesPerUnit } from '../components/dashboard/modals/PinChannelModal';

// Fix time calculations
const satsPerUnit = 100000;
const msPerMinute = 60000; // Correct value for milliseconds per minute

export const pinPaymentAddress = '17EBFp7FLKioGiCF1SzyFwxzMVzis7cgez';

export interface Channel {
  channel: string;
  creator?: string;
  last_message?: string;
  last_message_time?: number;
  messages?: number;
}

interface PinMap {
  channel: string;
}

interface PinOutput {
  e?: {
    a?: string;
    v?: number;
  };
}

interface Pin {
  MAP: PinMap;
  out?: PinOutput[];
  timestamp?: number;
  expiresAt?: number;
}

interface PinResponse {
  pin_channel: Array<{
    MAP: PinMap;
    out?: PinOutput[];
    timestamp?: number;
  }>;
}

interface ChannelsState {
  byId: Record<string, Channel>;
  allIds: string[];
  loading: boolean;
  error: string | null;
  active: string | null;
  pins: {
    allChannels: string[];
    byChannel: Record<string, Pin[]>;
    loading: boolean;
    error?: string | null;
  };
}

export const loadPins = createAsyncThunk<
  PinResponse,
  void,
  { rejectValue: string }
>('channels/loadPins', async (_, { rejectWithValue }) => {
  try {
    const channels = await channelAPI.getPinnedChannels();
    return {
      pin_channel: channels.map((channel) => ({
        MAP: { channel: channel.channel },
        timestamp: channel.last_message_time,
      })),
    };
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to load pinned channels',
    );
  }
});

export const loadChannels = createAsyncThunk<Channel[], void>(
  'channels/loadChannels',
  async () => {
    const response = await channelAPI.getChannels();

    if (!Array.isArray(response)) {
      throw new Error('Invalid response format - expected array');
    }

    const validChannels = response.filter((channel): channel is Channel =>
      Boolean(channel?.channel && typeof channel.channel === 'string'),
    );

    if (validChannels.length === 0) {
      throw new Error('No valid channels found in response');
    }

    return validChannels;
  },
);

const initialState: ChannelsState = {
  byId: {},
  allIds: [],
  loading: false,
  error: null,
  active: null,
  pins: {
    allChannels: [],
    byChannel: {},
    loading: false,
  },
};

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setChannels: (state, action: PayloadAction<Channel[]>) => {
      const newById: Record<string, Channel> = {};
      const newAllIds: string[] = [];

      for (const channel of action.payload) {
        const channelId = channel.channel;
        if (!channelId) continue;

        newById[channelId] = {
          channel: channelId,
          creator: channel.creator || '',
          last_message: channel.last_message || '',
          last_message_time: channel.last_message_time || 0,
          messages: channel.messages || 0,
        };

        if (!newAllIds.includes(channelId)) {
          newAllIds.push(channelId);
        }
      }

      // Sort by last message time
      newAllIds.sort((a, b) => {
        const timeA = newById[a]?.last_message_time || 0;
        const timeB = newById[b]?.last_message_time || 0;
        return timeB - timeA;
      });

      state.byId = newById;
      state.allIds = newAllIds;
    },
    receiveNewChannel(state, action: PayloadAction<Channel>) {
      const channel = action.payload;
      if (!channel.channel) return;

      state.byId[channel.channel] = {
        ...channel,
        last_message_time: channel.last_message_time || moment().unix(),
        last_message: channel.last_message || '',
        messages: channel.messages || 0,
      };

      if (!state.allIds.includes(channel.channel)) {
        state.allIds.push(channel.channel);
      }
    },
    setActiveChannel(state, action: PayloadAction<string>) {
      state.active = action.payload;
    },
    unpinChannel(state, action: PayloadAction<string>) {
      const channel = action.payload;
      delete state.pins.byChannel[channel];
      state.pins.allChannels = state.pins.allChannels.filter(
        (id) => id !== channel,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPins.pending, (state) => {
        state.pins.loading = true;
        state.pins.error = null;
      })
      .addCase(loadPins.fulfilled, (state, action) => {
        state.pins.loading = false;
        state.pins.error = null;

        if (!action.payload?.pin_channel) return;

        for (const pin of action.payload.pin_channel) {
          const mapChannel = pin.MAP?.channel;
          if (!mapChannel || !state.byId[mapChannel]) continue;

          const paymentOutput = find(
            pin.out,
            (o) => o.e?.a === pinPaymentAddress,
          );
          const paymentAmount = paymentOutput?.e?.v || 0;

          if (paymentAmount > 0) {
            const units = Math.floor(paymentAmount / satsPerUnit);
            const expireMinutesFromTimestamp = minutesPerUnit * units;
            const expireTime =
              expireMinutesFromTimestamp * msPerMinute + (pin.timestamp || 0);

            if (moment.unix(expireTime).diff(moment(), 'minutes') > 0) {
              const newPin: Pin = {
                MAP: pin.MAP,
                out: pin.out,
                timestamp: pin.timestamp,
                expiresAt: expireTime,
              };
              if (!state.pins.byChannel[mapChannel]) {
                state.pins.byChannel[mapChannel] = [];
              }
              state.pins.byChannel[mapChannel].push(newPin);
              if (!state.pins.allChannels.includes(mapChannel)) {
                state.pins.allChannels.push(mapChannel);
              }
            }
          }
        }
      })
      .addCase(loadPins.rejected, (state, action) => {
        state.pins.loading = false;
        state.pins.error = action.payload as string;
      })
      .addCase(loadChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadChannels.fulfilled, (state, action) => {
        const newById: Record<string, Channel> = {};
        const newAllIds: string[] = [];

        for (const channel of action.payload) {
          const channelId = channel.channel;
          if (!channelId) continue;

          newById[channelId] = {
            channel: channelId,
            creator: channel.creator || '',
            last_message: channel.last_message || '',
            last_message_time: channel.last_message_time || 0,
            messages: channel.messages || 0,
          };

          if (!newAllIds.includes(channelId)) {
            newAllIds.push(channelId);
          }
        }

        // Sort by last message time
        newAllIds.sort((a, b) => {
          const timeA = newById[a]?.last_message_time || 0;
          const timeB = newById[b]?.last_message_time || 0;
          return timeB - timeA;
        });

        // Atomic state update
        state.loading = false;
        state.error = null;
        state.byId = newById;
        state.allIds = newAllIds;
      })
      .addCase(loadChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load channels';
      });
  },
});

export const {
  setLoading,
  setError,
  setChannels,
  setActiveChannel,
  receiveNewChannel,
  unpinChannel,
} = channelsSlice.actions;

export default channelsSlice.reducer;
