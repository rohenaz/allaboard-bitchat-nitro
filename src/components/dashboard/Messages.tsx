import { last } from 'lodash';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { fetchMessages, fetchMoreMessages } from '../../reducers/chatReducer';
import type { AppDispatch, RootState } from '../../store';
import Message from './Message';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--background-primary);
  flex: 1;
  min-height: 0;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 0;
  height: 100%;
  max-height: 100%;
  
  /* Custom scrollbar styles */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thin-thumb);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thin-thumb-hover);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-normal);
`;

const Messages: FC = () => {
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const messageListRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messages = useSelector((state: RootState) => state.chat.messages);
  const reactions = useSelector((state: RootState) => state.chat.reactions);
  const currentUser = useSelector((state: RootState) => state.session.user);

  const activeUserId = useMemo(() => params.user, [params.user]);

  const channelName =
    params.channel ||
    activeUserId ||
    last(window?.location?.pathname?.split('/'));

  const fetchMessageList = useCallback(() => {
    if (params.channel) {
      dispatch(fetchMessages({ channelName: params.channel }));
    } else if (params.user && currentUser?.bapId) {
      dispatch(
        fetchMessages({
          userId: params.user,
          currentUserId: currentUser.bapId,
        }),
      );
    }
  }, [dispatch, params.channel, params.user, currentUser?.bapId]);

  useEffect(() => {
    fetchMessageList();
  }, [fetchMessageList]);

  // Scroll to bottom (which is actually the top due to flex-direction: column-reverse)
  useEffect(() => {
    if (shouldScrollToBottom && messageListRef.current) {
      messageListRef.current.scrollTop = 0;
    }
  }, [shouldScrollToBottom]);

  const handleScroll = useCallback(
    (event: {
      currentTarget: {
        scrollTop: number;
        scrollHeight: number;
        clientHeight: number;
      };
    }) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

      // Check if we're at the bottom (which is actually scrollTop = 0 due to column-reverse)
      setShouldScrollToBottom(scrollTop === 0);

      // Check if we're at the top (which is actually the bottom due to column-reverse)
      if (
        Math.abs(scrollHeight - clientHeight - scrollTop) < 1 &&
        !isLoadingMore &&
        messages.hasMore &&
        channelName
      ) {
        setIsLoadingMore(true);
        try {
          if (params.channel) {
            dispatch(fetchMoreMessages({ channelName: params.channel }));
          } else if (params.user && currentUser?.bapId) {
            dispatch(
              fetchMoreMessages({
                userId: params.user,
                currentUserId: currentUser.bapId,
              }),
            );
          }
        } finally {
          setIsLoadingMore(false);
        }
      }
    },
    [
      dispatch,
      isLoadingMore,
      messages.hasMore,
      channelName,
      params.channel,
      params.user,
      currentUser?.bapId,
    ],
  );

  if (messages.loading) {
    return (
      <Container>
        <LoadingContainer>Loading messages...</LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <MessagesContainer ref={messageListRef} onScroll={handleScroll}>
        {messages.data.map((message, index) => (
          <Message
            key={`${message.tx?.h || index}-${message.timestamp || index}`}
            message={message}
            reactions={reactions}
          />
        ))}
      </MessagesContainer>
    </Container>
  );
};

export default Messages;
