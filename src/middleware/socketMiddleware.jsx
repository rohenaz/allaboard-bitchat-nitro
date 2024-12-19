import { io } from 'socket.io-client';
import { receiveNewChannel } from '../reducers/channelsReducer';
import {
  receiveDeletedMessage,
  receiveEditedMessage,
  receiveNewMessage,
  receiveNewReaction,
  updateTypingUser,
} from '../reducers/chatReducer';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3055', {
  autoConnect: false,
  transports: ['websocket'],
});

const socketMiddleware = (store) => (next) => (action) => {
  if (action.type === 'session/setUser' && action.payload) {
    socket.connect();
  }

  if (action.type === 'session/logout') {
    socket.disconnect();
  }

  socket.on('channel', (channel) => {
    store.dispatch(receiveNewChannel(channel));
  });

  socket.on('message', (message) => {
    store.dispatch(receiveNewMessage(message));
  });

  socket.on('edit-message', (message) => {
    store.dispatch(receiveEditedMessage(message));
  });

  socket.on('delete-message', (message) => {
    store.dispatch(receiveDeletedMessage(message));
  });

  socket.on('reaction', (reaction) => {
    store.dispatch(receiveNewReaction(reaction));
  });

  socket.on('typing', (user) => {
    store.dispatch(updateTypingUser(user));
  });

  socket.on('stop-typing', () => {
    store.dispatch(updateTypingUser(null));
  });

  return next(action);
};

export default socketMiddleware;
