import { api } from './fetch';

export interface Channel {
  channel: string;
  last_message: string;
  last_message_time: number;
  messages: number;
  creator: string;
}

export const getChannels = async (): Promise<Channel[]> => {
  return api.get<Channel[]>('/social/channels');
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
  return api.get(`/social/q/friend/${queryFriendsB64(idKey)}?d=friends`);
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
  AIP?: Array<{
    bapId?: string;
    address?: string;
  }>;
  B?: Array<{
    encoding: string;
    content?: string;
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
  return api.get<MessageResponse>(`/social/channels/${channelName}/messages`);
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
  return api.get<Channel[]>('/social/channels/pinned');
}

export async function getChannel(id: string): Promise<Channel> {
  return api.get<Channel>(`/social/channels/${id}`);
}

export async function createChannel(data: CreateChannelData): Promise<Channel> {
  return api.post<Channel>('/social/channels', data);
}

export async function updateChannel(
  id: string,
  data: Partial<Channel>,
): Promise<Channel> {
  return api.put<Channel>(`/social/channels/${id}`, data);
}

export async function deleteChannel(id: string): Promise<void> {
  return api.delete(`/social/channels/${id}`);
}

export async function sendMessage(
  channelId: string,
  content: string,
): Promise<Message> {
  return api.post<Message>(`/social/channels/${channelId}/messages`, {
    content,
  });
}

export async function getReactions(messageId: string): Promise<Reaction[]> {
  return api.get<Reaction[]>(`/social/messages/${messageId}/reactions`);
}

export async function getDiscordReactions(
  messageId: string,
): Promise<Reaction[]> {
  return api.get<Reaction[]>(`/social/messages/${messageId}/discord-reactions`);
}

export async function getLikes(messageId: string): Promise<Reaction[]> {
  return api.get<Reaction[]>(`/social/messages/${messageId}/likes`);
}
