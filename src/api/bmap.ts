import { api } from './fetch';

// Identity & Search endpoints
export interface AutofillResult {
  idKey: string;
  paymail: string;
  name: string;
  avatar?: string;
}

export interface IdentitySearchParams {
  query?: string;
  paymail?: string;
  idKey?: string;
  limit?: number;
}

export const autofill = async (query: string): Promise<AutofillResult[]> => {
  return api.get<AutofillResult[]>('/social/autofill', {
    params: { query },
  });
};

export const searchIdentities = async (params: IdentitySearchParams) => {
  return api.get('/social/identity/search', {
    params: params as Record<string, string>,
  });
};

// Post endpoints
export interface Post {
  txid: string;
  content: string;
  author: {
    idKey: string;
    paymail: string;
    name: string;
    avatar?: string;
  };
  timestamp: number;
  likes?: number;
  replies?: number;
}

export const getFeed = async (bapId?: string) => {
  const path = bapId ? `/social/feed/${bapId}` : '/social/feed';
  return api.get<Post[]>(path);
};

export const getPost = async (txid: string) => {
  return api.get<Post>(`/social/post/${txid}`);
};

export const replyToPost = async (txid: string, content: string) => {
  return api.post(`/social/post/${txid}/reply`, { content });
};

export const likePost = async (txid: string, emoji?: string) => {
  return api.post(`/social/post/${txid}/like`, { emoji });
};

export const searchPosts = async (query: string) => {
  return api.get('/social/post/search', { params: { query } });
};

export const getPostsByAddress = async (address: string) => {
  return api.get(`/social/post/address/${address}`);
};

export const getPostsByBapId = async (bapId: string) => {
  return api.get(`/social/post/bap/${bapId}`);
};

// Likes & Reactions
export interface Like {
  txid: string;
  emoji: string;
  author: {
    idKey: string;
    paymail: string;
  };
  timestamp: number;
}

export const getLikesForBapId = async (bapId: string) => {
  return api.get<Like[]>(`/social/bap/${bapId}/like`);
};

export const createLike = async (targetTxid: string, emoji: string) => {
  return api.post('/social/likes', { targetTxid, emoji });
};

// Friends
export interface Friend {
  idKey: string;
  paymail: string;
  name: string;
  avatar?: string;
  status: 'pending' | 'accepted' | 'blocked';
}

export const getFriendRelationships = async (bapId: string) => {
  return api.get<Friend[]>(`/social/friend/${bapId}`);
};

// Direct Messages
export interface DirectMessage {
  txid: string;
  content: string;
  from: string;
  to: string;
  timestamp: number;
  encrypted?: boolean;
}

export const getDirectMessages = async (bapId: string) => {
  return api.get<DirectMessage[]>(`/social/@/${bapId}/messages`);
};

export const getConversation = async (bapId: string, targetBapId: string) => {
  return api.get<DirectMessage[]>(`/social/@/${bapId}/messages/${targetBapId}`);
};

// WebSocket endpoints for real-time updates
export const listenToMessages = (
  bapId: string,
  onMessage: (data: DirectMessage) => void,
) => {
  // Note: This would need to be implemented with actual WebSocket connection
  // For now, we'll use SSE which is already available
  return api.sse<DirectMessage>(`/social/@/${bapId}/messages/listen`, {
    onMessage,
  });
};

export const listenToConversation = (
  bapId: string,
  targetBapId: string,
  onMessage: (data: DirectMessage) => void,
) => {
  return api.sse<DirectMessage>(`/social/@/${bapId}/messages/${targetBapId}/listen`, {
    onMessage,
  });
};
