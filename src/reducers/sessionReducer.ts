import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import { loadFriends } from './memberListReducer';

interface SessionUser {
  paymail?: string;
  wallet?: string;
  authToken?: string;
  bapId?: string;
  idKey?: string;
  address?: string;
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

function loadSessionFromStorage(): SessionUser | null {
  try {
    const stored = localStorage.getItem('bitchat-nitro.session');
    if (stored) {
      return JSON.parse(stored) as SessionUser;
    }
  } catch (e) {
    console.error('Failed to load session from storage:', e);
  }
  return null;
}

function saveSessionToStorage(user: SessionUser | null) {
  if (!user) {
    localStorage.removeItem('bitchat-nitro.session');
    return;
  }
  localStorage.setItem('bitchat-nitro.session', JSON.stringify(user));
}

const persistedUser = loadSessionFromStorage();

const initialState: SessionState = {
  user: persistedUser,
  loading: false,
  error: null,
  isAuthenticated: persistedUser !== null && persistedUser.wallet !== undefined,
};

interface LoginPayload {
  wallet: string; // 'handcash' | 'yours' | 'guest'
  authToken?: string;
  bapId?: string;
}

interface YoursUserPayload {
  paymail: string;
  address: string;
}

export const login = createAsyncThunk(
  'session/login',
  async (
    { wallet, authToken, bapId }: LoginPayload,
    { dispatch, rejectWithValue },
  ) => {
    try {
      if (bapId) {
        dispatch(setBapId(bapId));
        dispatch(loadFriends());
      }
      return { wallet, authToken, bapId };
    } catch (err) {
      const error = err as { response?: { data?: string } };
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  },
);

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    connectSocket(_state, _action) {},
    loginGuest(state) {
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.user = {
        wallet: 'guest',
      };
      saveSessionToStorage(state.user);
    },
    setYoursUser(state, action: PayloadAction<YoursUserPayload>) {
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.user = {
        wallet: 'yours',
        paymail: action.payload.paymail,
        address: action.payload.address,
      };
      saveSessionToStorage(state.user);
    },
    logout(state) {
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = null;
      localStorage.removeItem('bitchat-nitro.hc-auth-token');
      localStorage.removeItem('bitchat-nitro._bapid');
      localStorage.removeItem('nitro__HandcashProvider_authToken');
      localStorage.removeItem('nitro__HandcashProvider_profile');
      localStorage.removeItem('nitro__YoursProvider_profile');
      saveSessionToStorage(null);
      window.location.href = '/login';
    },
    setBapId(state, action: PayloadAction<string>) {
      const newUser = Object.assign({}, state.user || {});
      newUser.idKey = action.payload;
      state.user = newUser;
      saveSessionToStorage(state.user);
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.isAuthenticated = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          wallet: action.payload.wallet,
          authToken: action.payload.authToken,
          bapId: action.payload.bapId,
        };
        saveSessionToStorage(state.user);
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

export const {
  connectSocket,
  loginGuest,
  logout,
  setBapId,
  setError,
  setYoursUser,
} = sessionSlice.actions;

export default sessionSlice.reducer;
