import axios from "axios";

const api = axios.create({
  baseURL: "https://bmap-api-production.up.railway.app/q/", // "https://b.map.sv/q/",
});

const verboseMode = false;

var queryPinnedChannels = {
  v: 3,
  q: {
    find: {
      // "blk.i": { $gt: 600000 },
      "MAP.app": "bitchatnitro.com",
      // "MAP.type": "pin_channel",
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
          "AIP.bapId": {
            $exists: true,
          },
        },
      },
      {
        $project: {
          user: 1,
          "AIP.bapId": 1,
          "AIP.identity": 1,
          timestamp: 1,
        },
      },
      {
        $sort: {
          timestamp: -1,
        },
      },
      {
        $group: {
          // _id: "$AIP.bapId",
          _id: "$AIP.address",
          user: {
            // $first: "$AIP.identity",
            $first: "$AIP.address",
          },
          last_message_time: {
            $last: "$timestamp",
          },
          actions: {
            $sum: 1,
          },
        },
      },
    ],
    sort: { last_message_time: -1 },
    limit: 100,
  },
};

// var queryUsers = {
//   v: 3,
//   q: {
//     aggregate: [
//       {
//         $match: {
//           "AIP.bapId": { $exists: true },
//         },
//       },
//       {
//         $sort: { timestamp: -1 },
//       },
//       {
//         $group: {
//           _id: "$AIP.bapId",
//           user: { $first: "$AIP.identity" },
//           last_message_time: { $last: "$timestamp" },
//           actions: { $sum: 1 },
//         },
//       },
//     ],
//     sort: { last_message_time: -1 },
//     limit: 100,
//   },
// };
var queryUsersB64 = btoa(JSON.stringify(queryUsers));

var queryFriends = (idKey) => {
  return {
    v: 3,
    q: {
      find: {
        $or: [{ "AIP.bapId": idKey }, { "MAP.bapID": idKey }],
      },

      sort: { timestamp: -1 },

      // {
      //   $group: {
      //     _id: "$AIP.bapId",
      //     requester: { $first: "$AIP.bapId" },
      //     recipient: { $first: "$MAP.bapID" },
      //     publicKey: { $first: "$MAP.publicKey" },
      //     last_message_time: { $last: "$timestamp" },
      //     actions: { $sum: 1 },
      //   },
      // },

      // sort: { last_message_time: -1 },
      limit: 100,
    },
  };
};
// var queryFriends = (idKey) => {
//   return {
//     v: 3,
//     q: {
//       aggregate: [
//         {
//           $match: {
//             "MAP.type": "friend",
//             "AIP.bapId": idKey,
//           },
//         },
//         {
//           $sort: { timestamp: -1 },
//         },
//         {
//           $group: {
//             _id: "$AIP.bapId",
//             requester: { $first: "$AIP.bapId" },
//             recipient: { $first: "$MAP.bapID" },
//             publicKey: { $first: "$MAP.publicKey" },
//             last_message_time: { $last: "$timestamp" },
//             actions: { $sum: 1 },
//           },
//         },
//       ],
//       sort: { last_message_time: -1 },
//       limit: 100,
//     },
//   };
// };
var queryFriendsB64 = (idKey) => btoa(JSON.stringify(queryFriends(idKey)));

var queryChannels = {
  v: 3,
  q: {
    aggregate: [
      {
        $match: {
          "MAP.channel": { $not: { $regex: "^\\s*$|^$|_enc$" } },
        },
      },
      {
        $sort: { "blk.t": 1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: [{ $type: "$MAP.channel" }, "string"] },
              { $toLower: "$MAP.channel" },
              "$MAP.channel",
            ],
          },
          channel: {
            $first: {
              $cond: [
                { $eq: [{ $type: "$MAP.channel" }, "string"] },
                { $toLower: "$MAP.channel" },
                "$MAP.channel",
              ],
            },
          },
          creator: { $first: "$MAP.paymail" },
          last_message: { $last: "$B.Data.utf8" },
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
  // console.log("query with", userId, channelId);
  let q = {
    v: 3,
    q: {
      find: {
        // verbose mode dead for now
        // "MAP.type": verboseMode ? { $in: ["post", "message"] } : "message",
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
    q.q.find["$or"] = [
      { $and: [{ "MAP.bapID": myId }, { "AIP.bapId": userId }] },
      { $and: [{ "AIP.bapId": myId }, { "MAP.bapID": userId }] },
    ];
    // stuff added by indexer uses camelCase
    // stuff in the protocol uses caps ID
    //TODO: q.q.find["MAP.encrypted"] = true;
  } else {
    q.q.find["$and"] = [
      { "MAP.context": { $exists: false } },
      { "MAP.channel": { $exists: false } },
    ];
  }
  return btoa(JSON.stringify(q));
};

const queryReactions = (txIds) => {
  let q = {
    v: 3,
    q: {
      find: {
        // "MAP.type": "like",
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
        // "MAP.type": "like",
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
  return await api.get(`pin_channel/${queryPinnedChannelsB64}?d=pins`);
};

export const getChannels = async () => {
  return await api.get(`message/${queryChannelsB64}?d=channels`);
};

export const getUsers = async () => {
  return await api.get(`messages/${queryUsersB64}?d=users`);
};

export const getFriends = async (idKey) => {
  return await api.get(`friend/${queryFriendsB64(idKey)}?d=friends`);
};

export const getMessages = async (channelId, userId, myId) => {
  return await api.get(
    `message/${query(verboseMode, channelId, userId, myId)}?d=messages`
  );
};

export const getReactions = async (txIds) => {
  if (!txIds?.length) {
    console.log("no txids for reactions");
    return [];
  }
  return await api.get(`like/${queryReactions(txIds)}?d=reactions`);
};

export const getDiscordReactions = async (messageIds) => {
  if (!messageIds?.length) {
    return [];
  }
  return await api.get(
    `like/${queryDiscordReactions(messageIds)}?d-disc-react`
  );
};
