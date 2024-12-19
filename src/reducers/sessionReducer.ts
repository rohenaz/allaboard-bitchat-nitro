import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';

export interface User {
  idKey: string;
}

export interface SessionState {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  error: string | null;
}

export const login = createAsyncThunk(
  'session/login',
  async ({ bapId }: { bapId: string }, { dispatch }) => {
    try {
      dispatch(setBapId(bapId));
      return bapId;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Login failed');
    }
  },
);

const initialState: SessionState = {
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    connectSocket: (_state, _action: PayloadAction<void>) => {},
    logout: (state) => {
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = null;
    },
    setBapId: (state, action: PayloadAction<string>) => {
      state.user = {
        ...(state.user || {}),
        idKey: action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          ...(state.user || {}),
          idKey: action.payload,
        };
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.error.message || 'Login failed';
      });
  },
});

export const { connectSocket, logout, setBapId } = sessionSlice.actions;

export default sessionSlice.reducer;
