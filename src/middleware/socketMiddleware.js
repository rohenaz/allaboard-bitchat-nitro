import { last } from "lodash";
import { receiveNewMessage } from "../reducers/chatReducer";

let channelId = last(window.location.pathname.split("/")) || null;

const sockQuery = (verbose, activeChannel) => {
  let q = {
    v: 3,
    q: {
      find: {
        "MAP.type": verbose ? { $in: ["post", "message"] } : "message",
      },
    },
  };
  if (activeChannel) {
    q.q.find["MAP.channel"] = activeChannel;
  } else {
    q.q.find["MAP.channel"] = { $exists: false };
  }
  return q;
};

const socketMiddleware = () => {
  var sock_b64 = btoa(JSON.stringify(sockQuery(false, channelId)));
  var socket_url = "https://b.map.sv/s/" + sock_b64;

  return (storeAPI) => {
    // socket
    let socket = new EventSource(socket_url);
    socket.onmessage = (e) => {
      var res = JSON.parse(e.data);
      var data = res.data[0];
      console.log(res);
      if (res.type === "push" && data.MAP.type === "message") {
        // if (!audio.muted) {
        //   audio.play()
        // }
        // var i = document.querySelector("#chat")
        // i.setAttribute("placeholder", "")
        // i.removeAttribute("readonly")
        // data.m = `${
        //   data.MAP.paymail || data.AIP?.address
        // }: ${data.B.content.trim()}`;
        storeAPI.dispatch(receiveNewMessage(data));
        // data.timestamp = moment(data.blk.t*1000).format('M/D, h:mm:ss a');
        // data.h = data.tx.h
        // data.url = data.MAP.type === 'post' ? 'https://blockpost.network/post/' : 'https://whatsonchain.com/tx/'
        // var html = template2(data)
        // var d = document.createElement("div")
        // d.innerHTML = html
        // if (data.MAP.type === 'post') {
        //   d.classList = "row post"
        // } else {
        //   d.className = "row"
        // }
        // document.querySelector(".container").appendChild(d)

        // if (bottom()) {
        //   document.querySelector('.container').scrollTop = document.querySelector('.container').scrollHeight
        // }
      } else if (res.type === "block") {
        // TODO: put a new block message in the chat, BSV yellow color
        // var header = `NEW BLOCK ${data.block_height}`
        // figlet(header, '3D-ASCII', function(err, text) {
        //   if (err) {
        //     return
        //   }
        // })
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
          console.log("todo: socket change active channel");
          break;
        case "chat/sendMessage":
          // socket.emit("send-message", action.payload);
          console.log("delete me - docket send message");
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
