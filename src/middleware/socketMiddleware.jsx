import { head, last } from 'lodash';
import { receiveNewChannel } from '../reducers/channelsReducer';
import { receiveNewMessage, receiveNewReaction } from '../reducers/chatReducer';
import { receiveNewFriend } from '../reducers/memberListReducer';
import { API_BASE_URL } from '../config/env';

// Audio notification setup
let audio;
try {
  audio = new Audio('/audio/notify.mp3');
  audio.volume = 0.25;
} catch (error) {
  console.error('Failed to initialize audio:', error);
}

const playNotification = () => {
  if (audio) {
    audio.play().catch(error => {
      console.error('Failed to play notification:', error);
    });
  }
};

const sockQuery = (verbose) => {
  return {
    v: 3,
    q: {
      find: {
        'MAP.type': verbose
          ? { $in: ['friend', 'post', 'message', 'like', 'pin_channel'] }
          : { $in: ['friend', 'message', 'like', 'pin_channel'] },
      },
    },
  };
};

const socketMiddleware = (store) => {
  let eventSource = null;

  const setupEventSource = () => {
    if (eventSource) {
      eventSource.close();
    }

    const sock_b64 = btoa(JSON.stringify(sockQuery(false)));
    const socket_url = `${API_BASE_URL}/s/$all/${sock_b64}`;
    
    console.log('Setting up EventSource connection to:', socket_url);
    eventSource = new EventSource(socket_url);
    
    eventSource.onmessage = (e) => {
      const res = JSON.parse(e.data);
      const data = res.data[0];
      if (!data) return;

      console.log('Socket received:', res);
      const channelId = last(window?.location?.pathname?.split('/')) || null;
      const { session } = store.getState();
      const { memberList } = store.getState();
      data.myBapId = session.user?.bapId;

      switch (head(data.MAP).type) {
        case 'like':
          console.log('dispatch new like', data);
          store.dispatch(receiveNewReaction(data));
          break;

        case 'message':
          if (head(data.MAP).context === 'channel') {
            // Get message content from either format
            const content = head(data.B)?.Data?.utf8 || head(data.B)?.content || '';
            
            store.dispatch(
              receiveNewChannel({
                channel: head(data.MAP).channel,
                last_message_time: data.timestamp,
                last_message: content,
                creator: head(data.MAP).paymail || head(data.AIP)?.bapId,
                messages: 1,
              }),
            );
          }

          // If dm
          if (data.AIP && head(data.MAP).context === 'bapID') {
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
                store.dispatch(receiveNewMessage(data));
                playNotification();
              }
            } else if (fromMe) {
              // new message from self via DM
              store.dispatch(receiveNewMessage(data));
            }
          } else {
            // Public message
            if (head(data.MAP).channel && head(data.MAP).channel === channelId) {
              store.dispatch(receiveNewMessage(data));
              // Play sound for new messages in the current channel
              playNotification();
            }
          }
          break;

        case 'friend':
          store.dispatch(receiveNewFriend(data));
          break;

        case 'pin_channel':
          // Instead of using receiveNewPin, we'll trigger a pin refresh
          store.dispatch({ type: 'channels/loadPins' });
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
    };

    eventSource.onopen = () => {
      console.log('EventSource connection opened');
    };
  };

  // Check for existing session and set up connection
  const state = store.getState();
  if (state.session.user) {
    console.log('Found existing session, setting up EventSource');
    setupEventSource();
  }

  return (next) => (action) => {
    // Handle both setYoursUser and login.fulfilled actions
    if (
      (action.type === 'session/setYoursUser' && action.payload) ||
      (action.type === 'session/login/fulfilled' && action.payload)
    ) {
      console.log('User logged in, setting up EventSource');
      setupEventSource();
    }

    if (action.type === 'session/logout') {
      if (eventSource) {
        console.log('User logged out, closing EventSource');
        eventSource.close();
        eventSource = null;
      }
      localStorage.clear();
      window.location.href = 'https://bitchatnitro.com';
    }

    return next(action);
  };
};

export default socketMiddleware;
