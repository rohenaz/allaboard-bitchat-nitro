import { lazy } from 'react';

// Auth components
export const LoginPage = lazy(() => import('../components/authForm/LoginPage'));
export const SignupPage = lazy(
  () => import('../components/authForm/SignupPage'),
);

// Dashboard components
export const Dashboard = lazy(
  () => import('../components/dashboard/Dashboard'),
);

// Modal components
export const SettingsModal = lazy(
  () => import('../components/dashboard/modals/SettingsModal'),
);
export const ImportIDModal = lazy(
  () => import('../components/dashboard/modals/ImportIDModal'),
);
export const DirectMessageModal = lazy(
  () => import('../components/dashboard/modals/DirectMessageModal'),
);
export const PinChannelModal = lazy(
  () => import('../components/dashboard/modals/PinChannelModal'),
);

// List components
export const ChannelList = lazy(
  () => import('../components/dashboard/ChannelList'),
);
export const ServerList = lazy(
  () => import('../components/dashboard/ServerList'),
);
export const UserList = lazy(() => import('../components/dashboard/UserList'));
export const MemberList = lazy(
  () => import('../components/dashboard/MemberList'),
);

// Message components
export const Message = lazy(() => import('../components/dashboard/Message'));
export const MessageFiles = lazy(
  () => import('../components/dashboard/MessageFiles'),
);
export const FileRenderer = lazy(
  () => import('../components/dashboard/FileRenderer'),
);
