import { api } from './fetch';

export interface Channel {
  channel: string;
  last_message: string;
  last_message_time: number;
  messages: number;
  creator: string;
}

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
  txid?: string;
  tx?: { h: string };
  paymail?: string;
  type?: string;
  context?: string;
  channel?: string;
  messageID?: string;
  encrypted?: string;
  bapID?: string;
  content?: string;
  timestamp?: number;
  createdAt?: number;
  blk?: { t: number };
  myBapId?: string;
  MAP?: Array<{
    paymail?: string;
    type?: string;
    context?: string;
    channel?: string;
    messageID?: string;
    encrypted?: string;
    bapID?: string;
  }>;
  B?: Array<{
    encoding: string;
    Data: {
      utf8: string;
    };
  }>;
}

export interface MessageResponse {
  results: Message[];
  signers?: Array<{
    idKey: string;
    paymail: string;
    logo?: string;
    isFriend?: boolean;
  }>;
}

export interface MessageQuery {
  limit?: number;
  before?: string;
  after?: string;
  sort?: 'asc' | 'desc';
}

export const getMessages = async (
  channelName: string,
): Promise<MessageResponse> => {
  return api.get<MessageResponse>(`/channels/${channelName}/messages`);
};

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
