import axios from "axios";

const api = axios.create({
  baseURL: "https://b.map.sv/q/",
});

const verboseMode = false;

var queryPinnedChannels = {
  v: 3,
  q: {
    find: {
      // "blk.i": { $gt: 600000 },
      "MAP.app": "bitchatnitro.com",
      "MAP.type": "pin_channel",
      "MAP.context": "channel",
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
var queryPinnedChannelsB64 = btoa(JSON.stringify(queryPinnedChannels));

var queryUsers = {
  v: 3,
  q: {
    aggregate: [
      {
        $match: {
          "AIP.bapId": { $exists: true },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$AIP.bapId",
          user: { $first: "$AIP.identity" },
          last_message_time: { $last: "$timestamp" },
          actions: { $sum: 1 },
        },
      },
    ],
    sort: { last_message_time: -1 },
    limit: 100,
  },
};
var queryUsersB64 = btoa(JSON.stringify(queryUsers));

var queryChannels = {
  v: 3,
  q: {
    aggregate: [
      {
        $match: {
          "MAP.type": "message",
          "MAP.channel": { $not: { $regex: "^\\s*$|^$|_enc$" } },
        },
      },
      {
        $sort: { "blk.t": 1 },
      },
      {
        $group: {
          _id: { $toLower: "$MAP.channel" },
          channel: { $first: { $toLower: "$MAP.channel" } },
          creator: { $first: "$MAP.paymail" },
          last_message: { $last: "$B.content" },
          last_message_time: { $last: "$timestamp" },
          messages: { $sum: 1 },
        },
      },
    ],
    sort: { last_message_time: -1 },
    limit: 100,
  },
};
var queryChannelsB64 = btoa(JSON.stringify(queryChannels));

const query = (verboseMode, channelId, userId, myId) => {
  console.log("query with", userId, channelId);
  let q = {
    v: 3,
    q: {
      find: {
        "MAP.type": verboseMode ? { $in: ["post", "message"] } : "message",
      },
      sort: {
        timestamp: -1,
        "blk.t": -1,
      },
      limit: 100,
    },
  };
  if (channelId) {
    q.q.find["MAP.channel"] = channelId;
  } else if (userId && myId) {
    q.q.find["AIP.bapId"] = { $in: [userId, myId] };
    //TODO: q.q.find["MAP.encrypted"] = true;
  } else {
    q.q.find["MAP.channel"] = { $exists: false };
  }
  return btoa(JSON.stringify(q));
};

const queryReactions = (txIds) => {
  let q = {
    v: 3,
    q: {
      find: {
        "MAP.type": "like",
        "MAP.tx": { $in: txIds || [] },
      },
      sort: {
        timestamp: -1,
        "blk.t": -1,
      },
      limit: 1000,
    },
  };

  return btoa(JSON.stringify(q));
};

const queryDiscordReactions = (messageIds) => {
  let q = {
    v: 3,
    q: {
      find: {
        "MAP.type": "like",
        "MAP.messageID": { $in: messageIds || [] },
      },
      sort: {
        timestamp: -1,
        "blk.t": -1,
      },
      limit: 1000,
    },
  };

  return btoa(JSON.stringify(q));
};

export const getPinnedChannels = async () => {
  return await api.get(queryPinnedChannelsB64);
};

export const getChannels = async () => {
  return await api.get(queryChannelsB64);
};

export const getUsers = async () => {
  return await api.get(queryUsersB64);
};

export const getMessages = async (channelId, userId, myId) => {
  return await api.get(query(verboseMode, channelId, userId, myId));
};

export const getReactions = async (txIds) => {
  if (!txIds?.length) {
    return;
  }
  return await api.get(queryReactions(txIds));
};

export const getDiscordReactions = async (messageIds) => {
  if (!messageIds?.length) {
    return;
  }
  return await api.get(queryDiscordReactions(messageIds));
};
