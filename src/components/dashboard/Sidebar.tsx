import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { toggleSidebar } from '../../reducers/sidebarReducer';
import type { RootState } from '../../store';
import ChannelList from './ChannelList';
import ServerList from './ServerList';
import { UserList } from './UserList';

interface ContainerProps {
  $isOpen: boolean;
}

const Overlay = styled.div<ContainerProps>`
  display: none;

  @media (max-width: 768px) {
    display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
`;

const Container = styled.div<ContainerProps>`
  display: flex;
  flex: 0 0 auto;
  height: 100vh;
  background-color: var(--background-tertiary);
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

const ServerListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 72px;
  background-color: var(--background-tertiary);
  padding: 12px 0;
`;

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 240px;
  background-color: var(--background-secondary);
`;

const Sidebar = () => {
  const dispatch = useDispatch();
  const params = useParams();
  const activeUserId = useMemo(() => params.user, [params]);
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);

  const handleOverlayClick = () => {
    dispatch(toggleSidebar());
  };

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={handleOverlayClick} />
      <Container $isOpen={isOpen}>
        <ServerListWrapper>
          <ServerList />
        </ServerListWrapper>
        <ListWrapper>
          {!activeUserId && <ChannelList />}
          {activeUserId && <UserList activeUserId={activeUserId} />}
        </ListWrapper>
      </Container>
    </>
  );
};

export default Sidebar;
