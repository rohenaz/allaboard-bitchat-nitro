import { head, last } from 'lodash';
import { listenToMessages } from '../api/bmap';
import { API_BASE_URL } from '../config/env';
import { receiveNewChannel } from '../reducers/channelsReducer';
import { receiveNewMessage, receiveNewReaction } from '../reducers/chatReducer';
import { receiveNewFriend } from '../reducers/memberListReducer';

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
    audio.play().catch((error) => {
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
  let dmListener = null;

  const setupEventSource = async () => {
    if (eventSource) {
      eventSource.close();
    }

    if (dmListener) {
      dmListener.close();
      dmListener = null;
    }

    // Get current user from Redux state
    const currentUser = store.getState().session.user;

    const sock_b64 = btoa(JSON.stringify(sockQuery(false)));
    let socket_url = `${API_BASE_URL}/s/$all/${sock_b64}`;

    // Add token from localStorage for SSE auth (since headers not supported)
    const accessToken = localStorage.getItem('sigma_access_token');
    if (accessToken) {
      socket_url += `?token=${accessToken}`;
    }

    eventSource = new EventSource(socket_url, { withCredentials: true });

    eventSource.onmessage = (e) => {
      const res = JSON.parse(e.data);
      const data = res.data[0];
      if (!data) return;
      const channelId = last(window?.location?.pathname?.split('/')) || null;
      const { session } = store.getState();
      const { memberList } = store.getState();
      data.myBapId = session.user?.bapId;

      switch (head(data.MAP).type) {
        case 'like':
          store.dispatch(receiveNewReaction(data));
          break;

        case 'message':
          if (head(data.MAP).context === 'channel') {
            // Get message content from either format
            const content = head(data.B)?.content || '';

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
            if (
              head(data.MAP).channel &&
              head(data.MAP).channel === channelId
            ) {
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

    eventSource.onopen = () => {};

    // Also set up DM listener if user has a bapId (use member BAP ID, not OAuth user ID)
    if (currentUser?.bapId) {
      console.log('[SocketMiddleware] Setting up DM listener for BAP ID:', currentUser.bapId);
      dmListener = listenToMessages(currentUser.bapId, (data) => {
        // Transform DM to expected format
        const message = {
          tx: { h: data.txid },
          MAP: [
            {
              paymail: data.from,
              type: 'message',
              context: 'messageID',
              bapID: data.from,
              encrypted: data.encrypted ? 'true' : undefined,
            },
          ],
          B: [
            {
              encoding: 'utf-8',
              content: data.content,
            },
          ],
          timestamp: data.timestamp,
          myBapId: currentUser.bapId,
        };
        store.dispatch(receiveNewMessage(message));
        playNotification();
      });
    }
  };

  // Check for existing session and set up connection
  const state = store.getState();
  if (state.session.user) {
    setupEventSource();
  }

  return (next) => (action) => {
    // Handle both setYoursUser and login.fulfilled actions
    if (
      (action.type === 'session/setYoursUser' && action.payload) ||
      (action.type === 'session/login/fulfilled' && action.payload)
    ) {
      setupEventSource();
    }

    if (action.type === 'session/logout') {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (dmListener) {
        dmListener.close();
        dmListener = null;
      }
      localStorage.clear();
      window.location.href = 'https://bitchatnitro.com';
    }

    return next(action);
  };
};

export default socketMiddleware;
