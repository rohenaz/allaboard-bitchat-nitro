import { configureStore } from '@reduxjs/toolkit';

import socketMiddleware from './middleware/socketMiddleware';
import channelsReducer from './reducers/channelsReducer';
import chatReducer from './reducers/chatReducer';
import memberListReducer from './reducers/memberListReducer';
import profileReducer from './reducers/profileReducer';
import serverReducer from './reducers/serverReducer';
import sessionReducer from './reducers/sessionReducer';
import settingsReducer from './reducers/settingsReducer';
import sidebarReducer from './reducers/sidebarReducer';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    channels: channelsReducer,
    servers: serverReducer,
    session: sessionReducer,
    sidebar: sidebarReducer,
    memberList: memberListReducer,
    profile: profileReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
