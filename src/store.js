import { configureStore } from "@reduxjs/toolkit";

import socketMiddleware from "./middleware/socketMiddleware.js";
import channelsReducer from "./reducers/channelsReducer.js";
import chatReducer from "./reducers/chatReducer.js";
import memberListReducer from "./reducers/memberListReducer.js";
import profileReducer from "./reducers/profileReducer.js";
import sessionReducer from "./reducers/sessionReducer.js";
import sidebarReducer from "./reducers/sidebarReducer.js";

const store = configureStore({
  reducer: {
    chat: chatReducer,
    channels: channelsReducer,
    session: sessionReducer,
    sidebar: sidebarReducer,
    memberList: memberListReducer,
    profile: profileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(socketMiddleware),
});

export default store;
