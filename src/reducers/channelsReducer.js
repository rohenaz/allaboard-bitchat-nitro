import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { find } from "lodash";
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
        state.byId[channel.channell] = [];
      }

      if (!state.allIds.includes(channel.channel)) {
        state.byId[channel.channel] = channel;
        state.allIds.push(channel.channel);
      } else {
        // existing channel - update it
        // TODO: its less code to merge these the other way
        let c = Object.assign(state.byId[channel.channel], {});
        c.last_message_time = channel.last_message_time;
        c.last_message = channel.last_message;
        c.messages = c.messages + 1;
        state.byId[channel.channel] = c;
      }
    },
    receiveNewPin(state, action) {
      const pin = action.payload;
      if (!state.pins.byChannel[pin.MAP.channel]) {
        state.pins.byChannel[pin.MAP.channel] = [];
      }
      state.pins.byChannel[pin.MAP.channel].push(pin);
      if (!state.pins.allChannels.includes(pin.MAP.channel)) {
        state.pins.allChannels.push(pin.MAP.channel);
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
      .addCase(loadPins.pending, (state, action) => {
        state.pins.loading = true;
      })
      .addCase(loadPins.fulfilled, (state, action) => {
        state.pins.loading = false;

        action.payload.c.forEach((pin) => {
          const channel = state.byId[pin.MAP.channel];

          let paymentAmount = 0;

          if (pin.MAP.channel === channel.channel) {
            let paymentOutput = find(
              pin.out,
              (o) => o.e.a === pinPaymentAddress
            );
            paymentAmount = paymentOutput?.e?.v || 0;

            if (paymentAmount > 0) {
              const units = Math.floor(paymentAmount / satsPerUnit);
              let expireMinutesFromTimestamp = minutesPerUnit * units;
              let expireTime =
                expireMinutesFromTimestamp * msPerMinute + pin.timestamp; // 100 sat / minute

              // (calculate .00100000 bsv per 10 minutes) e.v/100000 (5c)
              if (moment.unix(expireTime).diff(moment(), "minutes") > 0) {
                console.log(moment.unix(expireTime).diff(moment(), "minutes"));
                pin.expiresAt = expireTime;
                if (!state.pins.byChannel[pin.MAP.channel]) {
                  state.pins.byChannel[pin.MAP.channel] = [];
                }
                state.pins.byChannel[pin.MAP.channel].push(pin);
                if (!state.pins.allChannels.includes(pin.MAP.channel)) {
                  state.pins.allChannels.push(pin.MAP.channel);
                }
              }
            }
          }
        });
      })
      .addCase(loadChannels.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(loadChannels.fulfilled, (state, action) => {
        state.byId = {};
        state.allIds = [];
        state.loading = false;
        action.payload.c.forEach((c) => {
          //     return c;
          //   })
          //   .sort((a, b) =>
          //     a.pinned && !b.pinned ? -1 : a.timestamp > b.timestamp ? -1 : 1
          //   );
          // return newData;

          state.byId[c.channel] = c;
          state.allIds.push(c.channel);
        });
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
