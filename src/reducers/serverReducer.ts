import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { AppDispatch } from '../store';
interface Server {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  icon?: string;
  paymail?: string;
}

interface ServerState {
  loading: boolean;
  error: string | null;
  data: Server[];
}

const initialState: ServerState = {
  loading: false,
  error: null,
  data: [
    {
      _id: 'bitchat',
      name: 'BitChat',
      description: 'The main BitChat server',
      icon: '/images/blockpost-logo.svg',
      paymail: 'bitchat@bitchatnitro.com',
    },
    // More servers can be added here or fetched from an endpoint
  ],
};

const serverSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    fetchServersStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchServersSuccess(state, action: PayloadAction<Server[]>) {
      state.loading = false;
      state.data = action.payload;
    },
    fetchServersFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addServer(state, action: PayloadAction<Server>) {
      state.data.push(action.payload);
    },
    removeServer(state, action: PayloadAction<string>) {
      state.data = state.data.filter((server) => server._id !== action.payload);
    },
  },
});

export const {
  fetchServersStart,
  fetchServersSuccess,
  fetchServersFailure,
  addServer,
  removeServer,
} = serverSlice.actions;

export const fetchServers = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchServersStart());
    // Since there's no API endpoint yet, we'll just return success with the initial data
    dispatch(
      fetchServersSuccess([
        {
          _id: 'bitchat',
          name: 'BitChat',
          description: 'The main BitChat server',
          icon: '/images/blockpost-logo.svg',
          paymail: 'bitchat@bitchatnitro.com',
        },
      ]),
    );
  } catch (error) {
    dispatch(
      fetchServersFailure(
        error instanceof Error ? error.message : 'Failed to fetch servers',
      ),
    );
  }
};

export default serverSlice.reducer;
