import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import { loadFriends } from './memberListReducer';

/**
 * Session user state
 */
interface SessionUser {
  wallet?: string;           // 'sigma' | 'yours' | 'handcash' | 'guest'

  // Identity fields (from Sigma OAuth)
  idKey?: string;            // Member BAP ID from Sigma
  public_key?: string;       // Bitcoin public key
  address?: string;          // Bitcoin address
  paymail?: string;          // Paymail/email

  // Legacy fields (for backwards compatibility)
  authToken?: string;        // HandCash auth token
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
  idKey?: string;
}

interface YoursUserPayload {
  paymail: string;
  address: string;
}

/**
 * Payload for setting Sigma user
 * Maps directly to SigmaUserInfo from auth.ts
 */
interface SigmaUserPayload {
  sub: string;              // OAuth user ID
  idKey: string;            // Member BAP ID from Sigma
  public_key: string;       // Bitcoin public key
  address: string;          // Bitcoin address
  paymail?: string;         // Paymail
  displayName?: string;     // Display name
  avatar?: string;          // Avatar URL
}

export const login = createAsyncThunk(
  'session/login',
  async (
    { wallet, authToken, idKey }: LoginPayload,
    { dispatch, rejectWithValue },
  ) => {
    try {
      if (idKey) {
        dispatch(setBapId(idKey));
        dispatch(loadFriends());
      }
      return { wallet, authToken, idKey };
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
    setSigmaUser(state, action: PayloadAction<SigmaUserPayload>) {
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.user = {
        wallet: 'sigma',
        idKey: action.payload.idKey,        // Member BAP ID from Sigma
        public_key: action.payload.public_key,
        address: action.payload.address,
        paymail: action.payload.paymail,
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
          idKey: action.payload.idKey,
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
  setSigmaUser,
  setYoursUser,
} = sessionSlice.actions;

export default sessionSlice.reducer;
