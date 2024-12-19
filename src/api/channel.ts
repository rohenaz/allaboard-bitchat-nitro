import type { Channel } from '../types/channel';
import { api } from './fetch';

export const getChannels = async (): Promise<Channel[]> => {
  return api.get<Channel[]>('/channels');
};

export const getUsers = async () => {
  const response = await api.get('/identities');
  return response;
};

export const getFriends = async (idKey: string) => {
  const queryFriends = (idKey: string) => {
    return {
      v: 3,
      q: {
        find: {
          $or: [{ 'MAP.bapID': idKey }],
        },
        sort: { timestamp: -1 },
        limit: 100,
      },
    };
  };

  const queryFriendsB64 = (idKey: string) =>
    btoa(JSON.stringify(queryFriends(idKey)));
  return api.get(`q/friend/${queryFriendsB64(idKey)}?d=friends`);
};

export interface Message {
  id: string;
  content: string;
  channelId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
  }>;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
  }>;
}

export interface MessageQuery {
  limit?: number;
  before?: string;
  after?: string;
  sort?: 'asc' | 'desc';
}

export interface CreateChannelData {
  name?: string;
  description?: string;
  type: 'channel' | 'dm';
  members: string[];
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  createdAt: string;
}

export async function getPinnedChannels(): Promise<Channel[]> {
  return api.get<Channel[]>('/channels/pinned');
}

export async function getChannel(id: string): Promise<Channel> {
  return api.get<Channel>(`/channels/${id}`);
}

export async function createChannel(data: CreateChannelData): Promise<Channel> {
  return api.post<Channel>('/channels', data);
}

export async function updateChannel(
  id: string,
  data: Partial<Channel>,
): Promise<Channel> {
  return api.put<Channel>(`/channels/${id}`, data);
}

export async function deleteChannel(id: string): Promise<void> {
  return api.delete(`/channels/${id}`);
}

export async function getMessages(
  channelId: string,
  query: MessageQuery = { sort: 'desc', limit: 100 },
): Promise<Message[]> {
  return api.get<Message[]>(`/channels/${channelId}/messages`, {
    params: {
      ...query,
      sort: query.sort || 'desc', // Default to descending order
      limit: query.limit || 100,
    },
  });
}

export async function sendMessage(
  channelId: string,
  content: string,
): Promise<Message> {
  return api.post<Message>(`/channels/${channelId}/messages`, { content });
}

export async function getReactions(messageId: string): Promise<Reaction[]> {
  return api.get<Reaction[]>(`/messages/${messageId}/reactions`);
}

export async function getDiscordReactions(
  messageId: string,
): Promise<Reaction[]> {
  return api.get<Reaction[]>(`/messages/${messageId}/discord-reactions`);
}

export async function getLikes(messageId: string): Promise<Reaction[]> {
  return api.get<Reaction[]>(`/messages/${messageId}/likes`);
}
