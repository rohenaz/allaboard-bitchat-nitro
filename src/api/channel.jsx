import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  },
});

const verboseMode = false;

const queryPinnedChannels = {
  v: 3,
  q: {
    find: {
      'MAP.app': 'bitchatnitro.com',
      'MAP.context': 'channel',
    },
    project: {
      AIP: 1,
      blk: 1,
      timestamp: 1,
      tx: 1,
      MAP: 1,
      out: 1,
    },
    sort: {
      timestamp: -1,
    },
    limit: 10,
  },
};

const queryPinnedChannelsB64 = btoa(JSON.stringify(queryPinnedChannels));

const queryFriends = (idKey, signingAddress) => {
  return {
    v: 3,
    q: {
      find: {
        $or: [{ 'AIP.address': signingAddress }, { 'MAP.bapID': idKey }],
      },
      sort: { timestamp: -1 },
      limit: 100,
    },
  };
};

const queryFriendsB64 = (idKey) => btoa(JSON.stringify(queryFriends(idKey)));

const query = (_verboseMode, channelId, userId, myId) => {
  const q = {
    v: 3,
    q: {
      find: {},
      sort: {
        timestamp: -1,
        'blk.t': -1,
      },
      limit: 100,
    },
  };

  if (channelId) {
    q.q.find.MAP = { ...q.q.find.MAP, channel: channelId };
  } else if (userId && myId) {
    q.q.find.$or = [
      { $and: [{ 'MAP.bapID': myId }, { 'AIP.bapId': userId }] },
      { $and: [{ 'AIP.bapId': myId }, { 'MAP.bapID': userId }] },
    ];
  } else {
    q.q.find.$and = [
      { 'MAP.context': { $exists: false } },
      { 'MAP.channel': { $exists: false } },
    ];
  }
  return btoa(JSON.stringify(q));
};

const queryReactions = (txIds) => {
  const q = {
    v: 3,
    q: {
      find: {
        'MAP.tx': { $in: txIds || [] },
      },
      sort: {
        timestamp: -1,
        'blk.t': -1,
      },
      limit: 1000,
    },
  };

  return btoa(JSON.stringify(q));
};

const queryDiscordReactions = (messageIds) => {
  const q = {
    v: 3,
    q: {
      find: {
        'MAP.messageID': { $in: messageIds || [] },
      },
      sort: {
        timestamp: -1,
        'blk.t': -1,
      },
      limit: 1000,
    },
  };

  return btoa(JSON.stringify(q));
};

export const getPinnedChannels = async () => {
  return await api.get(`q/pin_channel/${queryPinnedChannelsB64}?d=pins`);
};

export const getChannels = async () => {
  const response = await api.get('channels');
  return response;
};

export const getUsers = async () => {
  return await api.get('/identities');
};

export const getFriends = async (idKey) => {
  return await api.get(`q/friend/${queryFriendsB64(idKey)}?d=friends`);
};

export const getMessages = async (channelId, userId, myId) => {
  if (channelId) {
    const response = await api.get(`/messages/${channelId}`, {
      params: {
        sort: JSON.stringify({
          timestamp: -1,
          'blk.t': -1,
        }),
      },
    });
    return {
      data: {
        message: response.data.results,
      },
    };
  }
  if (userId && myId) {
    return await api.get(
      `q/message/${query(verboseMode, channelId, userId, myId)}?d=messages`,
    );
  }
  return await api.get(
    `q/message/${query(verboseMode, channelId, userId, myId)}?d=messages`,
  );
};

export const getReactions = async (txIds) => {
  if (!txIds?.length) {
    return [];
  }
  return await api.get(`q/like/${queryReactions(txIds)}?d=reactions`);
};

export const getDiscordReactions = async (messageIds) => {
  if (!messageIds?.length) {
    return [];
  }
  return await api.get(
    `q/like/${queryDiscordReactions(messageIds)}?d-disc-react`,
  );
};

export const getLikes = async (params) => {
  // Handle channel-based query
  if (params.channel) {
    const { channel, page = 1, limit = 100 } = params;
    try {
      const response = await api.get('likes', {
        params: {
          channel,
          page,
          limit,
        },
        timeout: 5000,
      });

      if (!response.data) {
        console.error('Empty response from likes endpoint');
        return {
          channel,
          page,
          limit,
          count: 0,
          results: [],
        };
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching channel likes:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        channel,
        page,
        limit,
        count: 0,
        results: [],
      };
    }
  }

  // Handle ID-based query (txids or messageIds)
  const ids = params.txids || params.messageIds;
  if (!ids?.length) {
    return [];
  }

  // Validate input IDs
  const validIds = ids.filter(
    (id) => typeof id === 'string' && id.length === 64,
  );

  if (validIds.length === 0) {
    console.warn('No valid IDs found in input:', ids);
    return [];
  }

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await api.post('likes', validIds, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.data) {
        console.error('Empty response from likes endpoint');
        return [];
      }

      // Handle both single object and array responses
      const likesData = Array.isArray(response.data)
        ? response.data
        : [response.data];

      // Transform and validate each like object
      return likesData.map((like) => {
        // Ensure required fields exist with defaults
        const normalizedLike = {
          txid: like.txid || '',
          likes: Array.isArray(like.likes) ? like.likes : [],
          total: typeof like.total === 'number' ? like.total : 0,
          signers: [],
        };

        // Normalize signer data if present
        if (Array.isArray(like.signers)) {
          normalizedLike.signers = like.signers
            .map((signer) => ({
              idKey: signer.idKey || '',
              currentAddress: signer.currentAddress || '',
              rootAddress: signer.rootAddress || '',
              identity: {
                name: signer.identity?.name || '',
                avatar: signer.identity?.avatar || '',
                ...signer.identity,
              },
            }))
            .filter((signer) => signer.idKey || signer.currentAddress);
        }

        return normalizedLike;
      });
    } catch (error) {
      attempt++;

      console.error(
        `Error fetching likes (attempt ${attempt}/${maxRetries}):`,
        {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
          },
        },
      );

      if (attempt === maxRetries) {
        console.error('Max retries reached for likes fetch');
        return [];
      }

      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }

  return [];
};
