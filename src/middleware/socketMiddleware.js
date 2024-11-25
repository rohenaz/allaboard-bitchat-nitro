import { head, last } from "lodash";
import { receiveNewChannel, receiveNewPin } from "../reducers/channelsReducer";
import { receiveNewMessage, receiveNewReaction } from "../reducers/chatReducer";
import { receiveNewFriend } from "../reducers/memberListReducer";

const sockQuery = (verbose) => {
  let q = {
    v: 3,
    q: {
      find: {
        // "MAP.type": verbose
        //  ? { $in: ["friend", "post", "message", "like", "pin_channel"] }
        //  : { $in: ["friend", "message", "like", "pin_channel"] },
      },
    },
  };
  // if (activeChannel) {
  //   q.q.find["MAP.channel"] = activeChannel;
  // } else {
  //   q.q.find["MAP.channel"] = { $exists: false };
  // }
  return q;
};

const socketMiddleware = () => {
  var sock_b64 = btoa(JSON.stringify(sockQuery(false)));
  var socket_url =
    "https://bmap-api-production.up.railway.app/s/$all/" + sock_b64; // "https://b.map.sv/s/" + sock_b64;

  return (storeAPI) => {
    // socket
    let socket = new EventSource(socket_url);
    socket.onmessage = (e) => {
      var res = JSON.parse(e.data);
      var data = res.data[0];
      if (!data) {
        return;
      }
      let channelId = last(window?.location?.pathname?.split("/")) || null;

      console.log(res);
      const { session } = storeAPI.getState();
      const { memberList } = storeAPI.getState();
      data.myBapId = session.user?.bapId;
      switch (head(data.MAP).type) {
        case "like":
          console.log("dispatch new like", data);
          storeAPI.dispatch(receiveNewReaction(data));
          break;
        case "message":
          if (head(data.MAP).context === "channel") {
            storeAPI.dispatch(
              receiveNewChannel({
                channel: head(data.MAP).channel,
                last_message_time: data.timestamp,
                last_message: head(data.B).Data.utf8,
                creator: head(data.MAP).paymail || head(data.AIP).bapId,
                messages: 1,
              })
            );
          }

          // If dm
          if (data.AIP && head(data.MAP).context === "bapID") {
            const toMe = head(data.MAP).bapID === data.myBapId;
            const fromMe = data.myBapId === head(data.AIP).bapId;

            if (toMe) {
              // new message to me via DM
              const senderHasSentFriendRequest =
                memberList.friendRequests.incoming.byId[head(data.AIP).bapId];

              const senderIsOutgoingFriend =
                memberList.friendRequests.outgoing.byId[head(data.AIP).bapId];

              // new message to me via DM from FRIEND
              if (senderHasSentFriendRequest && senderIsOutgoingFriend) {
                storeAPI.dispatch(receiveNewMessage(data));
              }
            } else if (fromMe) {
              // new message from self via DM
              storeAPI.dispatch(receiveNewMessage(data));
            }
          } else {
            // Public message
            if (head(data.MAP).channel && head(data.MAP).channel == channelId) {
              storeAPI.dispatch(receiveNewMessage(data));
            }
          }
          break;
        case "friend":
          storeAPI.dispatch(receiveNewFriend(data));
          break;
        case "pin_channel":
          storeAPI.dispatch(receiveNewPin(data));
          break;
      }
    };

    // This part is called when the Redux store is created
    // const socket = io('/', { autoConnect: false });

    // socket.on('send-message', (message) => {
    //   storeAPI.dispatch(receiveNewMessage(message));
    // });

    // socket.on('edit-message', (message) => {
    //   storeAPI.dispatch(receiveEditedMessage(message));
    // });

    // socket.on('delete-message', (message) => {
    //   storeAPI.dispatch(receiveDeletedMessage(message));
    // });

    // socket.on('update-member-list', (user) => {
    //   storeAPI.dispatch(updateOnlineUsers(user));
    // });

    // socket.on('typing', (user) => {
    //   storeAPI.dispatch(updateTypingUser(user));
    // });

    // socket.on('stop-typing', (user) => {
    //   storeAPI.dispatch(updateTypingUser(null));
    // });

    // This part is called when an action is dispatched
    return (next) => (action) => {
      switch (action.type) {
        case "channels/setActiveChannel":
          // socket.emit("set-active-channel", JSON.stringify(action.payload));
          break;
        case "chat/sendMessage":
          // socket.emit("send-message", action.payload);
          break;
        // case "chat/editMessage":
        //   // socket.emit("edit-message", action.payload);
        //   console.log("todo: socket edit message");
        //   break;
        // case "chat/deleteMessage":
        //   socket.emit("delete-message", action.payload);
        //   break;
        // case "chat/typing":
        //   socket.emit("typing", action.payload);
        //   break;
        // case "chat/stopTyping":
        //   socket.emit("stop-typing", action.payload);
        //   break;
        case "session/connectSocket":
          console.log("deleteme? - connect");
          socket.connect();
          // socket.emit("new-client", action.payload);
          break;
        case "session/logout":
          localStorage.clear();
          window.location.href = "/";
          console.log("deleteme? - socket logout");
          // socket.close();
          break;
        default:
          break;
      }
      return next(action);
    };
  };
};

export default socketMiddleware();
