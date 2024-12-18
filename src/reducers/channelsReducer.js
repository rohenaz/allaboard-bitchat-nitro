// src/reducers/channelsReducer.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { find, head } from "lodash";
import moment from "moment";
import * as channelAPI from "../api/channel";
import { minutesPerUnit } from "../components/dashboard/modals/PinChannelModal";
// TODO: Derive this from actual rates? tricky.. because pin expiration would become unpredictable
const satsPerUnit = 100000;
const msPerMinute = 100;

export const pinPaymentAddress = "17EBFp7FLKioGiCF1SzyFwxzMVzis7cgez";

export const loadPins = createAsyncThunk(
  "channels/loadPins",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await channelAPI.getPinnedChannels();

      return resp.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

export const loadChannels = createAsyncThunk(
  "channels/loadChannels",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await channelAPI.getChannels();
      dispatch(loadPins());
      return response?.data;
    } catch (err) {
      return rejectWithValue(err.response);
    }
  }
);

const initialState = {
  byId: {},
  allIds: [],
  loading: true,
  active: null,
  pins: {
    allChannels: [],
    byChannel: {},
    loading: true,
  },
};

const channelsSlice = createSlice({
  name: "channels",
  initialState,
  reducers: {
    receiveNewChannel(state, action) {
      const channel = action.payload;
      if (!state.byId[channel.channel]) {
        state.byId[channel.channel] = [];
      }

      if (!state.allIds.includes(channel.channel)) {
        state.byId[channel.channel] = channel;
        state.allIds.push(channel.channel);
      } else {
        // existing channel - update it
        const c = Object.assign(state.byId[channel.channel], {});
        c.last_message_time = channel.last_message_time;
        c.last_message = channel.last_message;
        c.messages = c.messages + 1;
        state.byId[channel.channel] = c;
      }
    },
    receiveNewPin(state, action) {
      const pin = action.payload;
      const mapChannel = head(pin.MAP).channel;
      if (!state.pins.byChannel[mapChannel]) {
        state.pins.byChannel[mapChannel] = [];
      }
      state.pins.byChannel[mapChannel].push(pin);
      if (!state.pins.allChannels.includes(mapChannel)) {
        state.pins.allChannels.push(mapChannel);
      }
    },
    setActiveChannel(state, action) {
      if (action.payload) {
        state.active = action.payload;
      }
    },
    unpinChannel(state, action) {
      const channel = action.payload;
      delete state.pins.byChannel[channel];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPins.pending, (state) => {
        state.pins.loading = true;
      })
      .addCase(loadPins.fulfilled, (state, action) => {
        state.pins.loading = false;

        action.payload.pin_channel.forEach((pin) => {
          const mapChannel = head(pin.MAP).channel;
          const channel = state.byId[mapChannel];

          let paymentAmount = 0;
          const proxyChannel = channel?.channel;
          if (channel && mapChannel === channel.channel) {
            const paymentOutput = find(
              pin.out,
              (o) => o.e.a === pinPaymentAddress
            );
            paymentAmount = paymentOutput?.e?.v || 0;

            if (paymentAmount > 0) {
              const units = Math.floor(paymentAmount / satsPerUnit);
              const expireMinutesFromTimestamp = minutesPerUnit * units;
              const expireTime =
                expireMinutesFromTimestamp * msPerMinute + pin.timestamp; // 100 sat / minute

              if (moment.unix(expireTime).diff(moment(), "minutes") > 0) {
                pin.expiresAt = expireTime;
                if (!state.pins.byChannel[mapChannel]) {
                  state.pins.byChannel[mapChannel] = [];
                }
                state.pins.byChannel[mapChannel].push(pin);
                if (!state.pins.allChannels.includes(mapChannel)) {
                  state.pins.allChannels.push(mapChannel);
                }
              }
            }
          }
        });
      })
      .addCase(loadChannels.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadChannels.fulfilled, (state, action) => {
        state.byId = {};
        state.allIds = [];
        state.loading = false;
        
        // Ensure payload.message exists and is an array
        const messages = Array.isArray(action.payload?.message) ? action.payload.message : [];
        
        // Process each message
        for (const message of messages) {
          if (message?.MAP && Array.isArray(message.MAP)) {
            // Find the first MAP entry with channel info
            const channelInfo = message.MAP.find(map => map.channel && map.context === 'channel');
            if (channelInfo?.channel) {
              const channelId = channelInfo.channel;
              if (!state.byId[channelId]) {
                state.byId[channelId] = {
                  channel: channelId,
                  timestamp: message.timestamp
                };
                state.allIds.push(channelId);
              }
            }
          }
        }
      });
  },
});

export const {
  setActiveChannel,
  receiveNewChannel,
  receiveNewPin,
  unpinChannel,
} = channelsSlice.actions;

export default channelsSlice.reducer;
