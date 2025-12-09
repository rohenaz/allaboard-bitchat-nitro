import { SIGMA_API_URL } from '../config/constants';
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
	q?: string; // Search query for identity/search
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

// Response from api.sigmaidentity.com/identity/search
interface SigmaIdentitySearchResult {
	idKey: string;
	currentAddress?: string;
	identity?: {
		alternateName?: string;
		description?: string;
		image?: string;
		logo?: string;
		paymail?: string;
	};
	block?: number;
	timestamp?: number;
}

interface SigmaSearchResponse {
	results: SigmaIdentitySearchResult[];
	total: number;
	page: number;
	limit: number;
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

/**
 * Search identities using api.sigmaidentity.com
 */
export async function searchIdentities(query: string): Promise<User[]> {
	try {
		const response = await fetch(
			`${SIGMA_API_URL}/identity/search?q=${encodeURIComponent(query)}&limit=20`,
		);
		if (!response.ok) {
			console.error('Identity search failed:', response.status);
			return [];
		}
		const data: SigmaSearchResponse = await response.json();

		return data.results.map((result) => ({
			id: result.idKey,
			name: result.identity?.alternateName || '',
			avatar: result.identity?.image || result.identity?.logo || '',
			paymail: result.identity?.paymail || '',
			idKey: result.idKey,
			currentAddress: result.currentAddress,
			status: 'online' as const,
			lastSeen: result.timestamp ? new Date(result.timestamp * 1000).toISOString() : undefined,
		}));
	} catch (error) {
		console.error('Failed to search identities:', error);
		return [];
	}
}

/**
 * Get profile by BAP ID using api.sigmaidentity.com
 */
export async function getProfile(bapId: string): Promise<User | null> {
	try {
		const response = await fetch(`${SIGMA_API_URL}/profile/${bapId}`);
		if (!response.ok) return null;
		const data = await response.json();

		return {
			id: data.idKey || bapId,
			name: data.identity?.alternateName || '',
			avatar: data.identity?.image || data.identity?.logo || '',
			paymail: data.identity?.paymail || '',
			idKey: data.idKey || bapId,
			currentAddress: data.currentAddress,
			status: 'online',
		};
	} catch (error) {
		console.error('Failed to get profile:', error);
		return null;
	}
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
		console.error('Failed to parse identity:', e);
		return {
			name: '',
			status: 'offline',
		};
	}
}

export async function getUsers(query?: UserQuery): Promise<User[]> {
	// If we have a search query, use the sigma identity search
	if (query?.q) {
		return searchIdentities(query.q);
	}

	// Fall back to bmap API for listing (may not work)
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
