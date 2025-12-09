import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { head } from 'lodash';
import * as channelAPI from '../api/channel';
import * as userAPI from '../api/user';
import * as bmapAPI from '../api/bmap';
import type { ConfirmedFriend, BmapFriendRequest, FriendsResponse } from '../api/bmap';
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

// Raw signer from API
interface RawSigner {
	idKey: string;
	currentAddress?: string;
	identity?:
		| string
		| {
				paymail?: string;
				email?: string;
				alternateName?: string;
				name?: string;
				image?: string;
				logo?: string;
		  };
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
	// Confirmed friends with encryption keys
	confirmedFriends: {
		byId: Record<string, ConfirmedFriend>;
		allIds: string[];
	};
}

// Initial state
const initialState: MemberListState = {
	active: null,
	onlineUsers: [],
	byId: {},
	allIds: [],
	isOpen: true,
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
	confirmedFriends: {
		byId: {},
		allIds: [],
	},
};

// loadUsers thunk
export const loadUsers = createAsyncThunk(
	'memberList/loadUsers',
	async (_, { rejectWithValue }) => {
		try {
			const response = await userAPI.getUsers();
			if (Array.isArray(response)) {
				return response;
			}
			return [];
		} catch (err) {
			console.error('loadUsers thunk error:', err);
			const error = err as { response?: unknown };
			return rejectWithValue(error.response);
		}
	},
);

export const loadFriends = createAsyncThunk<
	{
		friends: ConfirmedFriend[];
		incomingRequests: BmapFriendRequest[];
		outgoingRequests: BmapFriendRequest[];
		signers: Signer[];
		bapId: string;
	},
	void,
	{ state: RootState; rejectValue: string }
>('memberList/loadFriends', async (_, { getState, rejectWithValue }) => {
	const state = getState();
	const bapId = state.session.user?.idKey;
	if (!bapId) {
		return rejectWithValue('No BAP ID found in session');
	}

	try {
		// Call BMAP API which returns friends with encryption keys
		const response = await bmapAPI.getFriendRelationships(bapId);

		// Also fetch user details for signers
		const users = await userAPI.getFriends(bapId);
		const signers = users.map((user) => ({
			idKey: user.idKey || '',
			paymail: user.paymail,
			logo: user.avatar,
			displayName: user.name,
			isFriend: true,
		}));

		return {
			friends: response.friends || [],
			incomingRequests: response.incomingRequests || [],
			outgoingRequests: response.outgoingRequests || [],
			signers,
			bapId,
		};
	} catch (error) {
		const err = error as Error;
		return rejectWithValue(err.message || 'Failed to load friends');
	}
});

const memberListSlice = createSlice({
	name: 'memberList',
	initialState,
	reducers: {
		receiveNewFriend(state, action: PayloadAction<FriendRequest & { bapId: string }>) {
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
				const userId = recipient === action.payload.bapId ? requester : recipient;
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
			state.isOpen = !state.isOpen;
		},
		ingestSigners(state, action: PayloadAction<RawSigner[]>) {
			for (const signer of action.payload) {
				let parsedSigner: Signer;

				// Handle signers from messages endpoint which have identity as JSON string
				if (typeof signer.identity === 'string') {
					try {
						const identity = JSON.parse(signer.identity);
						parsedSigner = {
							idKey: signer.idKey,
							paymail: identity.paymail || identity.email,
							displayName: identity.alternateName || identity.name,
							logo: identity.image || identity.logo,
							icon: identity.image || identity.logo,
							currentAddress: signer.currentAddress,
							isFriend: false,
						};
					} catch (e) {
						console.error('Failed to parse signer identity:', e);
						parsedSigner = {
							idKey: signer.idKey,
							currentAddress: signer.currentAddress,
						};
					}
				} else {
					// Handle signers that are already in the expected format
					parsedSigner = signer;
				}

				// Add to main users list
				if (!state.allIds.includes(parsedSigner.idKey)) {
					state.byId[parsedSigner.idKey] = parsedSigner;
					state.allIds.push(parsedSigner.idKey);
				}
				// Add to signers list
				if (!state.signers.allIds.includes(parsedSigner.idKey)) {
					state.signers.allIds.push(parsedSigner.idKey);
					state.signers.byId[parsedSigner.idKey] = parsedSigner;
				}
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loadUsers.pending, (state) => {
				state.loading = true;
			})
			.addCase(loadUsers.fulfilled, (state, action) => {
				state.loading = false;
				if (!Array.isArray(action.payload)) {
					console.error('Expected array of users but got:', action.payload);
					return;
				}
				for (const user of action.payload) {
					if (user.idKey && !state.allIds.includes(user.idKey)) {
						state.byId[user.idKey] = {
							idKey: user.idKey,
							paymail: user.paymail,
							logo: user.avatar,
							displayName: user.name,
							icon: user.avatar,
							currentAddress: user.currentAddress,
							walletType: undefined,
							isFriend: false,
						};
						state.allIds.push(user.idKey);
					}
				}
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
				const { friends, incomingRequests, outgoingRequests, signers, bapId } = action.payload;

				// Store signers
				for (const s of signers) {
					if (!state.signers.allIds.includes(s.idKey)) {
						state.signers.allIds.push(s.idKey);
						state.signers.byId[s.idKey] = s;
					}
					// Also add to byId for member display
					if (!state.allIds.includes(s.idKey)) {
						state.allIds.push(s.idKey);
						state.byId[s.idKey] = { ...s, isFriend: true };
					} else {
						state.byId[s.idKey].isFriend = true;
					}
				}

				// Store confirmed friends with encryption keys
				for (const friend of friends) {
					if (!state.confirmedFriends.allIds.includes(friend.bapID)) {
						state.confirmedFriends.allIds.push(friend.bapID);
					}
					state.confirmedFriends.byId[friend.bapID] = friend;
				}

				// Store incoming friend requests
				state.friendRequests.incoming.allIds = [];
				state.friendRequests.incoming.byId = {};
				for (const req of incomingRequests) {
					const signer = signers.find((s) => s.idKey === req.bapID);
					state.friendRequests.incoming.allIds.push(req.bapID);
					state.friendRequests.incoming.byId[req.bapID] = {
						tx: { h: req.txid },
						AIP: [{ bapId: req.bapID }],
						MAP: [{ bapID: bapId, publicKey: req.publicKey }],
						signer,
					};
				}

				// Store outgoing friend requests
				state.friendRequests.outgoing.allIds = [];
				state.friendRequests.outgoing.byId = {};
				for (const req of outgoingRequests) {
					const signer = signers.find((s) => s.idKey === req.bapID);
					state.friendRequests.outgoing.allIds.push(req.bapID);
					state.friendRequests.outgoing.byId[req.bapID] = {
						tx: { h: req.txid },
						AIP: [{ bapId: bapId }],
						MAP: [{ bapID: req.bapID }],
						signer,
					};
				}
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
