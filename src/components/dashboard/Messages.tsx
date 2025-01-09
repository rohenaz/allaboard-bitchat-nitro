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

const MessageList = styled.div`
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

const Messages: FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const messageListRef = useRef<any>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messages = useSelector((state: RootState) => state.chat.messages);
  const reactions = useSelector((state: RootState) => state.chat.reactions);

  const activeChannelId = useMemo(() => params.channel, [params.channel]);
  const activeUserId = useMemo(() => params.user, [params.user]);

  const channelName =
    params.channel ||
    activeUserId ||
    last(window?.location?.pathname?.split('/'));

  const fetchMessageList = useCallback(() => {
    if (channelName) {
      dispatch(fetchMessages(channelName));
    }
  }, [dispatch, channelName]);

  useEffect(() => {
    fetchMessageList();
  }, [fetchMessageList]);

  // Scroll to bottom (which is actually the top due to flex-direction: column-reverse)
  useEffect(() => {
    if (shouldScrollToBottom && messageListRef.current) {
      messageListRef.current.scrollTop = 0;
    }
  }, [shouldScrollToBottom, messages.data]);

  const handleScroll = useCallback(
    (event: { currentTarget: { scrollTop: number; scrollHeight: number; clientHeight: number } }) => {
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
          dispatch(fetchMoreMessages(channelName));
        } finally {
          setIsLoadingMore(false);
        }
      }
    },
    [dispatch, isLoadingMore, messages.hasMore, channelName],
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
      <MessageList ref={messageListRef} onScroll={handleScroll}>
        {messages.data.map((message, index) => (
          <Message 
            key={`${message.tx.h}-${message.timestamp || index}`} 
            message={message} 
            reactions={reactions} 
          />
        ))}
      </MessageList>
    </Container>
  );
};

export default Messages;
