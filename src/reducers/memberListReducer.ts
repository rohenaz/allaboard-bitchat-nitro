import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import { head } from 'lodash';
import * as channelAPI from '../api/channel';
import * as userAPI from '../api/user';
import type { AppDispatch, RootState } from '../store';

// Define Signer interface
export interface Signer {
  idKey: string;
  paymail?: string | null;
  logo?: string | null;
  displayName?: string | null;
  icon?: string | null;
  isFriend?: boolean;
  walletType?: 'handcash' | 'yours';
  currentAddress?: string;
}

// Define FriendRequest interface
export interface FriendRequest {
  tx: {
    h: string;
  };
  AIP?: Array<{
    bapId: string;
    address?: string;
  }>;
  MAP: Array<{
    bapID: string;
    publicKey?: string;
  }>;
  signer?: Signer;
}

// Define MemberListState interface
export interface MemberListState {
  active: string | null;
  onlineUsers: string[];
  byId: Record<string, Signer>;
  allIds: string[];
  isOpen: boolean;
  loading: boolean;
  signers: {
    byId: Record<string, Signer>;
    allIds: string[];
  };
  friendRequests: {
    loading: boolean;
    incoming: {
      byId: Record<string, FriendRequest>;
      allIds: string[];
    };
    outgoing: {
      byId: Record<string, FriendRequest>;
      allIds: string[];
    };
  };
}

// Initial state
const initialState: MemberListState = {
  active: null,
  onlineUsers: [],
  byId: {},
  allIds: [],
  isOpen: false,
  loading: true,
  signers: {
    byId: {},
    allIds: [],
  },
  friendRequests: {
    loading: true,
    incoming: { allIds: [], byId: {} },
    outgoing: { allIds: [], byId: {} },
  },
};

// Define response types
interface GetUsersResponse {
  message: string;
  signers: Signer[];
}

// loadUsers thunk
export const loadUsers = createAsyncThunk(
  'memberList/loadUsers',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.log('loadUsers thunk starting');
      const response = await userAPI.getUsers();
      console.log('loadUsers thunk got response:', response);
      if (Array.isArray(response)) {
        return response;
      }
      console.log('loadUsers thunk returning empty array - response not an array');
      return [];
    } catch (err: any) {
      console.error('loadUsers thunk error:', err);
      return rejectWithValue(err.response);
    }
  },
);

// Define loadFriends return type
interface LoadFriendsResponse {
  friend: FriendRequest[];
  signers: Signer[];
}

export const loadFriends = createAsyncThunk<
  { friend: FriendRequest[]; signers: Signer[]; bapId: string },
  void,
  { state: RootState; rejectValue: string }
>('memberList/loadFriends', async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const bapId = state.session.user?.idKey;
  if (!bapId) {
    return rejectWithValue('No BAP ID found in session');
  }

  try {
    const users = await userAPI.getFriends(bapId);
    // Convert User[] to LoadFriendsResponse format
    const signers = users.map(user => ({
      idKey: user.idKey || '',
      paymail: user.paymail,
      logo: user.avatar,
      displayName: user.name,
      isFriend: true
    }));
    return { friend: [], signers, bapId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to load friends');
  }
});

const memberListSlice = createSlice({
  name: 'memberList',
  initialState,
  reducers: {
    receiveNewFriend(
      state,
      action: PayloadAction<FriendRequest & { bapId: string }>,
    ) {
      const friend = action.payload;
      const requester = head(friend.AIP)?.bapId;
      const recipient = head(friend.MAP)?.bapID;

      if (!requester || !recipient) return;

      if (recipient === action.payload.bapId) {
        state.friendRequests.incoming.allIds.push(requester);
        state.friendRequests.incoming.byId[requester] = friend;
      } else if (requester === action.payload.bapId) {
        state.friendRequests.outgoing.allIds.push(recipient);
        state.friendRequests.outgoing.byId[recipient] = friend;
      }

      if (
        (state.friendRequests.outgoing.allIds.includes(requester) &&
          state.friendRequests.incoming.allIds.includes(recipient)) ||
        (state.friendRequests.incoming.allIds.includes(requester) &&
          state.friendRequests.outgoing.allIds.includes(recipient))
      ) {
        const userId =
          recipient === action.payload.bapId ? requester : recipient;
        if (state.byId[userId]) {
          state.byId[userId].isFriend = true;
        }
      }
    },
    setActiveUser(state, action: PayloadAction<string>) {
      state.active = action.payload;
    },
    updateOnlineUsers(state, action: PayloadAction<string[]>) {
      state.onlineUsers = action.payload;
    },
    toggleMemberList(state) {
      console.log('Handling toggleMemberList, current isOpen:', state.isOpen);
      state.isOpen = !state.isOpen;
      console.log('New isOpen value:', state.isOpen);
    },
    ingestSigners(state, action: PayloadAction<Signer[]>) {
      action.payload.forEach((signer) => {
        // Add to main users list
        if (!state.allIds.includes(signer.idKey)) {
          state.byId[signer.idKey] = signer;
          state.allIds.push(signer.idKey);
        }
        // Add to signers list
        if (!state.signers.allIds.includes(signer.idKey)) {
          state.signers.allIds.push(signer.idKey);
          state.signers.byId[signer.idKey] = signer;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUsers.fulfilled, (state, action) => {
        state.loading = false;
        console.log('load users fulfilled, payload:', action.payload);
        if (!Array.isArray(action.payload)) {
          console.error('Expected array of users but got:', action.payload);
          return;
        }
        for (const user of action.payload) {
          console.log('Processing user:', user);
          if (!state.allIds.includes(user.idKey)) {
            state.byId[user.idKey] = {
              ...user,
              // Support both old and new field names
              paymail: user.paymail || user.displayName,
              logo: user.logo || user.icon,
            };
            state.allIds.push(user.idKey);
            console.log('Added user to state:', user.idKey);
          }
        }
        console.log('Final state:', { 
          userCount: state.allIds.length, 
          users: state.byId 
        });
      })
      .addCase(loadUsers.rejected, (state, action) => {
        state.loading = false;
        console.error('Failed to load users:', action.payload);
      })
      .addCase(loadFriends.pending, (state) => {
        state.friendRequests.loading = true;
      })
      .addCase(loadFriends.fulfilled, (state, action) => {
        state.friendRequests.loading = false;
        const { friend, signers, bapId } = action.payload;

        const brokenTxHashes = [
          'bb83989697819428c0e8aadaf1bdff0a16bc14ab5e36310ff1e22b5bf835574c',
          '95a4c088bd32c4547d64e7d1405ceae2143e3a45324a9f8c4eb6bba9ef53be98',
          '7182af3be9c258068df78adc68ee7a628721a5e6aa0dda2a0e21dc160bf20bbe',
        ];

        signers.forEach((s) => {
          if (!state.signers.allIds.includes(s.idKey)) {
            state.signers.allIds.push(s.idKey);
            state.signers.byId[s.idKey] = s;
          }
        });

        friend.forEach((f) => {
          if (brokenTxHashes.includes(f.tx.h)) return;

          const requesterAddress = head(f.AIP)?.address;
          const requester = signers.find(
            (si) => si.currentAddress === requesterAddress,
          )?.idKey;
          const recipient = head(f.MAP)?.bapID;
          if (!requester || !recipient) return;

          if (recipient === bapId) {
            const friendWithSigner = {
              ...f,
              signer: signers.find((si) => si.idKey === requester),
            };
            state.friendRequests.incoming.allIds.push(requester);
            state.friendRequests.incoming.byId[requester] = friendWithSigner;
          } else if (requester === bapId) {
            const friendWithSigner = {
              ...f,
              signer: signers.find((si) => si.idKey === requester),
            };
            state.friendRequests.outgoing.allIds.push(recipient);
            state.friendRequests.outgoing.byId[recipient] = friendWithSigner;
          }

          // If mutual friend requests
          if (
            (state.friendRequests.outgoing.allIds.includes(requester) &&
              state.friendRequests.incoming.allIds.includes(recipient)) ||
            (state.friendRequests.incoming.allIds.includes(requester) &&
              state.friendRequests.outgoing.allIds.includes(recipient))
          ) {
            const userId = recipient === bapId ? requester : recipient;
            if (state.byId[userId]) {
              state.byId[userId].isFriend = true;
            }
          }
        });
      })
      .addCase(loadFriends.rejected, (state, action) => {
        state.friendRequests.loading = false;
        console.error('Failed to load friends:', action.payload);
      });
  },
});

export const {
  receiveNewFriend,
  updateOnlineUsers,
  toggleMemberList,
  setActiveUser,
  ingestSigners,
} = memberListSlice.actions;

export default memberListSlice.reducer;
