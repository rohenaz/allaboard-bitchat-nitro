import { api } from './fetch';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  paymail?: string;
  bapId?: string;
  idKey?: string;
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

export async function getUsers(query?: UserQuery): Promise<User[]> {
  return api.get<User[]>('/identities', {
    params: query as Record<string, string>,
  });
}

export async function getUser(id: string): Promise<User> {
  return api.get<User>(`/users/${id}`);
}

export async function updateUser(
  id: string,
  data: Partial<Identity>,
): Promise<User> {
  return api.put<User>(`/users/${id}`, data);
}

export async function getFriends(userId: string): Promise<User[]> {
  return api.get<User[]>(`/users/${userId}/friends`);
}

export async function getFriendRequests(
  userId: string,
): Promise<FriendRequest[]> {
  return api.get<FriendRequest[]>(`/users/${userId}/friend-requests`);
}

export async function sendFriendRequest(
  userId: string,
  friendId: string,
): Promise<FriendRequest> {
  return api.post<FriendRequest>(`/users/${userId}/friend-requests`, {
    friendId,
  });
}

export async function acceptFriendRequest(
  userId: string,
  requestId: string,
): Promise<void> {
  return api.post(`/users/${userId}/friend-requests/${requestId}/accept`);
}

export async function rejectFriendRequest(
  userId: string,
  requestId: string,
): Promise<void> {
  return api.post(`/users/${userId}/friend-requests/${requestId}/reject`);
}

export async function removeFriend(
  userId: string,
  friendId: string,
): Promise<void> {
  return api.delete(`/users/${userId}/friends/${friendId}`);
}
