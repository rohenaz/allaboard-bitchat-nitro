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
      console.log('Loading channels...');
      const response = await channelAPI.getChannels();
      console.log('Channel API response in thunk:', response);
      
      // Validate response format
      if (!response?.data) {
        console.error('Invalid response format:', response);
        return rejectWithValue('Invalid response format');
      }
      
      dispatch(loadPins());
      return response.data;
    } catch (err) {
      console.error('Error loading channels:', err);
      return rejectWithValue(err.response || err.message);
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
        state.byId[channel.channel] = {
          channel: channel.channel,
          last_message_time: channel.last_message_time || moment().unix(),
          last_message: channel.last_message || "",
          messages: 1,
        };
      }

      if (!state.allIds.includes(channel.channel)) {
        state.allIds.push(channel.channel);
      } else {
        // existing channel - update it
        const c = state.byId[channel.channel];
        c.last_message_time = channel.last_message_time || c.last_message_time;
        c.last_message = channel.last_message || c.last_message;
        c.messages = (c.messages || 0) + 1;
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

        for (const pin of action.payload.pin_channel) {
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
        }
      })
      .addCase(loadChannels.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadChannels.fulfilled, (state, action) => {
        console.log('Processing channels in reducer:', action);
        
        state.byId = {};
        state.allIds = [];
        state.loading = false;
        
        try {
          // Handle different possible response formats
          let channelsToProcess = [];
          
          if (Array.isArray(action.payload)) {
            // If response is an array
            channelsToProcess = action.payload;
          } else if (action.payload?.channels) {
            // If response has a channels property
            channelsToProcess = action.payload.channels;
          } else if (typeof action.payload === 'object') {
            // If response is an object of channels
            channelsToProcess = Object.values(action.payload);
          }
          
          console.log('Channels to process:', channelsToProcess);
          
          if (channelsToProcess.length === 0) {
            console.warn('No channels found in response');
            return;
          }
          
          // Process each channel
          for (const channel of channelsToProcess) {
            console.log('Processing channel:', channel);
            
            // Handle different channel formats
            const channelName = channel.name || channel.channel || channel.id;
            if (!channelName) {
              console.warn('Skipping channel due to missing name:', channel);
              continue;
            }
            
            const channelData = {
              channel: channelName,
              last_message_time: channel.lastMessageTime || channel.last_message_time || 0,
              last_message: channel.lastMessage || channel.last_message || "",
              messages: channel.messageCount || channel.messages || 0,
              creator: channel.creator || "",
            };
            
            console.log('Adding channel to state:', channelData);
            state.byId[channelName] = channelData;
            state.allIds.push(channelName);
          }
          
          console.log('Final channel state:', {
            byId: state.byId,
            allIds: state.allIds
          });
          
          // Sort channels by last message time
          state.allIds.sort((a, b) => {
            const timeA = state.byId[a]?.last_message_time || 0;
            const timeB = state.byId[b]?.last_message_time || 0;
            return timeB - timeA;
          });
          
        } catch (error) {
          console.error('Error processing channels:', error);
          // Reset state on error
          state.byId = {};
          state.allIds = [];
          state.loading = false;
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
