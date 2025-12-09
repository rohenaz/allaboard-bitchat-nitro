import { api } from './fetch';

export interface User {
	id: string;
	name: string;
	avatar?: string;
	paymail?: string;
	bapId?: string;
	idKey?: string;
	currentAddress?: string;
	status?: 'online' | 'offline' | 'away' | 'dnd';
	lastSeen?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface Identity {
	name: string;
	avatar?: string;
	paymail?: string;
	status?: 'online' | 'offline' | 'away' | 'dnd';
}

export interface UserQuery {
	username?: string;
	paymail?: string;
	bapId?: string;
	idKey?: string;
	status?: 'online' | 'offline' | 'away' | 'dnd';
}

export interface FriendRequest {
	id: string;
	senderId: string;
	recipientId: string;
	status: 'pending' | 'accepted' | 'rejected';
	createdAt: string;
	updatedAt?: string;
}

export interface IdentityResponse {
	idKey: string;
	rootAddress?: string;
	currentAddress?: string;
	addresses: Array<{
		address: string;
		txId: string;
		block: number;
	}>;
	identity: {
		alternateName?: string;
		description?: string;
		homeLocation?: {
			name?: string;
		};
		image?: string;
		url?: string;
		paymail?: string;
	} | null;
	identityTxId?: string;
	block: number;
	timestamp: number;
	valid?: boolean;
}

function parseIdentity(identityData: string | IdentityResponse['identity'] | null): Identity {
	try {
		if (!identityData) {
			return {
				name: '',
				status: 'offline',
			};
		}

		const identity = typeof identityData === 'string' ? JSON.parse(identityData) : identityData;

		return {
			name: identity?.alternateName || '',
			avatar: identity?.image || identity?.logo || '',
			paymail: identity?.paymail || '',
			status: 'online',
		};
	} catch (e) {
		// Keep error log for production debugging
		console.error('Failed to parse identity:', e);
		return {
			name: '',
			status: 'offline',
		};
	}
}

export async function getUsers(query?: UserQuery): Promise<User[]> {
	const response = await api.get<IdentityResponse[]>('/social/identities', {
		params: query as Record<string, string>,
	});

	return response.map((identity) => {
		const parsedIdentity = parseIdentity(identity.identity);
		return {
			id: identity.idKey,
			name: parsedIdentity.name,
			avatar: parsedIdentity.avatar,
			paymail: parsedIdentity.paymail,
			idKey: identity.idKey,
			currentAddress: identity.currentAddress,
			status: parsedIdentity.status,
			lastSeen: new Date(identity.timestamp * 1000).toISOString(),
			createdAt: new Date(identity.timestamp * 1000).toISOString(),
			updatedAt: new Date(identity.timestamp * 1000).toISOString(),
		};
	});
}

export async function getUser(id: string): Promise<User> {
	return api.get<User>(`/users/${id}`);
}

export async function updateUser(id: string, data: Partial<Identity>): Promise<User> {
	return api.put<User>(`/users/${id}`, data);
}

export async function getFriends(userId: string): Promise<User[]> {
	return api.get<User[]>(`/users/${userId}/friends`);
}

export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
	return api.get<FriendRequest[]>(`/users/${userId}/friend-requests`);
}

export async function sendFriendRequest(userId: string, friendId: string): Promise<FriendRequest> {
	return api.post<FriendRequest>(`/users/${userId}/friend-requests`, {
		friendId,
	});
}

export async function acceptFriendRequest(userId: string, requestId: string): Promise<void> {
	return api.post(`/users/${userId}/friend-requests/${requestId}/accept`);
}

export async function rejectFriendRequest(userId: string, requestId: string): Promise<void> {
	return api.post(`/users/${userId}/friend-requests/${requestId}/reject`);
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
	return api.delete(`/users/${userId}/friends/${friendId}`);
}
