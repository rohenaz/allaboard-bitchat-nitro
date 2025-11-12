// Common interfaces used across components

export interface User {
  paymail?: string;
  wallet?: string;
  authToken?: string;
  idKey?: string;
  icon?: string;
  address?: string;
}

export interface Channel {
  channel: string;
  last_message: string;
  last_message_time: number;
  messages: number;
  creator: string;
}

export interface Message {
  tx: {
    h: string;
  };
  MAP: {
    type: string;
    channel?: string;
    context?: string;
    bapID?: string;
    paymail?: string;
    emoji?: string;
  }[];
  B: {
    content: string;
  }[];
  AIP: {
    bapId: string;
  }[];
  timestamp: number;
}

export interface FriendRequest {
  MAP: {
    bapID: string;
    publicKey: string;
  }[];
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
}

export interface EmojiClickData {
  emoji: string;
  names: string[];
  originalUnified: string;
  unified: string;
}

// Redux state interfaces
export interface RootState {
  session: {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
  };
  channels: ChannelsState;
  chat: ChatState;
  memberList: MemberListState;
  servers: ServersState;
  profile: {
    isOpen: boolean;
  };
}

export interface SessionState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ChannelsState {
  channels: Channel[];
  loading: boolean;
  error: string | null;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export interface MemberListState {
  users: User[];
  friendRequests: {
    incoming: {
      allIds: string[];
      byId: Record<string, FriendRequest>;
    };
    outgoing: {
      allIds: string[];
      byId: Record<string, { MAP: { bapID: string }[] }>;
    };
  };
  loading: boolean;
  error: string | null;
}

export interface ServersState {
  servers: Server[];
  loading: boolean;
  error: string | null;
}
