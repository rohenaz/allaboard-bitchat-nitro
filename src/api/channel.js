import axios from "axios";

const api = axios.create({
  baseURL: "https://b.map.sv/q/",
});

const verboseMode = false;

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

const query = (verboseMode, channelId) => {
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

export const getChannels = async () => {
  return await api.get(queryChannelsB64);
};

export const getMessages = async (channelId) => {
  return await api.get(query(verboseMode, channelId));
};

export const getReactions = async (txIds) => {
  return await api.get(queryReactions(txIds));
};
