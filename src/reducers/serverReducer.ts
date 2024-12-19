import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { FetchStatus } from '../utils/common';
import env from '../utils/env';

interface Server {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  icon?: string;
  paymail?: string;
}

interface ServersState {
  loading: boolean;
  data: Server[];
  error: string | null;
}

const initialState: ServersState = {
  loading: false,
  data: [],
  error: null,
};

export const fetchServers = createAsyncThunk(
  'servers/fetchServers',
  async () => {
    const response = await fetch(`${env.REACT_APP_API_URL}/servers`);
    if (!response.ok) {
      throw new Error('Failed to fetch servers');
    }
    return response.json();
  },
);

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServers.pending, (state) => {
        state.loading = FetchStatus.Loading;
        state.error = null;
      })
      .addCase(fetchServers.fulfilled, (state, action) => {
        state.loading = FetchStatus.Success;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchServers.rejected, (state, action) => {
        state.loading = FetchStatus.Error;
        state.error = action.error.message || 'Failed to fetch servers';
      });
  },
});

export default serversSlice.reducer;
