import { useLayoutEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';

// Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector<RootState, T>(selector);

// Window hooks
export const useWindowWidth = () => {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    function updateSize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return width;
};

// Channel hooks
export const useActiveChannel = () => {
  const loading = useAppSelector((state) => state.channels.loading);
  const activeChannelId = useAppSelector((state) => state.channels.active);
  const channelsById = useAppSelector((state) => state.channels.byId);
  return (
    (!loading && activeChannelId && channelsById[activeChannelId]) || false
  );
};

// User hooks
export const useActiveUserOld = () => {
  const loading = useAppSelector((state) => state.memberList.loading);
  const activeChannelId = useAppSelector((state) => state.channels.active);
  const activeUserId = useAppSelector((state) => state.memberList.active);
  const usersById = useAppSelector((state) => state.memberList.byId);
  return (
    (!activeChannelId && !loading && activeUserId && usersById[activeUserId]) ||
    false
  );
};

// UI hooks
export const usePopover = () => {
  const [showPopover, setShowPopover] = useState(false);
  const [user, setUser] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLElement>, userId: string) => {
    setUser(userId);
    setShowPopover(true);
    setAnchorEl(event.currentTarget);
  };

  const handleClickAway = () => {
    setUser('');
    setShowPopover(false);
    setAnchorEl(null);
  };

  return [
    user,
    anchorEl,
    showPopover,
    setShowPopover,
    handleClick,
    handleClickAway,
  ] as const;
};

// Export other hook files
export * from './useActiveUser';
