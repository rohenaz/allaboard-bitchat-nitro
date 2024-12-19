import { last } from 'lodash';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
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
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 0;
  height: 100%;
  
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

const Messages: React.FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const { postStatus } = useBitcoin();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messages = useSelector((state: RootState) => state.chat.messages);
  const reactions = useSelector((state: RootState) => state.chat.reactions);

  const activeChannelId = useMemo(() => params.channel, [params.channel]);
  const activeUserId = useMemo(() => params.user, [params.user]);

  const channelName =
    activeChannelId ||
    activeUserId ||
    last(window?.location?.pathname?.split('/'));

  const fetchMessageList = useCallback(() => {
    console.log('🔄 Initializing message fetch for:', channelName, {
      isAuthenticated: !!authToken,
      isConnected: connected,
    });
    dispatch(fetchMessages(channelName));
  }, [authToken, connected, dispatch, channelName]);

  useEffect(() => {
    console.log('📱 Messages component mounted', {
      messageCount: messages.data.length,
      loading: messages.loading,
      error: messages.error,
    });
    fetchMessageList();
  }, [fetchMessageList]);

  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [shouldScrollToBottom, messages.data]);

  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = e.currentTarget;
      setShouldScrollToBottom(false);

      if (scrollTop === 0 && !isLoadingMore && messages.hasMore) {
        console.log('📜 Loading more messages...');
        setIsLoadingMore(true);
        try {
          await dispatch(fetchMoreMessages(channelName));
          console.log('✅ Additional messages loaded');
        } finally {
          setIsLoadingMore(false);
        }
      }
    },
    [dispatch, isLoadingMore, messages.hasMore, channelName],
  );

  if (messages.loading) {
    console.log('⌛ Messages loading state active');
    return (
      <Container>
        <LoadingContainer>Loading messages...</LoadingContainer>
      </Container>
    );
  }

  console.log('🎯 Rendering messages:', {
    count: messages.data.length,
    hasMore: messages.hasMore,
    firstMessage: messages.data[0],
    lastMessage: messages.data[messages.data.length - 1],
  });

  return (
    <Container>
      <MessagesContainer onScroll={handleScroll}>
        <div ref={messagesEndRef} />
        {messages.data.map((message) => (
          <Message key={message.tx.h} message={message} reactions={reactions} />
        ))}
      </MessagesContainer>
    </Container>
  );
};

export default Messages;
