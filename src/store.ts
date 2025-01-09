import { configureStore } from '@reduxjs/toolkit';
import type { Action, ThunkAction } from '@reduxjs/toolkit';
import channelsReducer from './reducers/channelsReducer';
import chatReducer from './reducers/chatReducer';
import memberListReducer from './reducers/memberListReducer';
import profileReducer from './reducers/profileReducer';
import serverReducer from './reducers/serverReducer';
import sessionReducer from './reducers/sessionReducer';
import settingsReducer from './reducers/settingsReducer';
import sidebarReducer from './reducers/sidebarReducer';
import socketMiddleware from './middleware/socketMiddleware';

const store = configureStore({
  reducer: {
    session: sessionReducer,
    channels: channelsReducer,
    chat: chatReducer,
    memberList: memberListReducer,
    servers: serverReducer,
    sidebar: sidebarReducer,
    settings: settingsReducer,
    profile: profileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'channels/loadChannels/fulfilled',
          'channels/loadChannels/rejected',
          'channels/loadChannels/pending',
        ],
      },
    }).concat(socketMiddleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;
