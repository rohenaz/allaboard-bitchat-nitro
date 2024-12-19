import { last } from 'lodash';
import moment from 'moment';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useActiveUser } from '../../hooks';
import {
  fetchMessages,
  fetchMoreMessages,
  receiveNewMessage,
} from '../../reducers/chatReducer';
import { FetchStatus } from '../../utils/common';
import Message from './Message';
import WriteArea from './WriteArea';

interface MessageData {
  tx: {
    h: string;
  };
  MAP: Array<{
    paymail?: string;
    messageID?: string;
    type?: string;
  }>;
  AIP?: Array<{
    identity?: {
      paymail?: string;
      logo?: string;
      alternateName?: string;
    };
    verified?: boolean;
    bapId?: string;
  }>;
  B: Array<{
    Data?: {
      utf8?: string;
    };
    'content-type'?: string;
    media_type?: string;
  }>;
  timestamp?: number;
  blk: {
    t: number;
  };
  _id?: string;
}

interface Reaction {
  MAP: Array<{
    emoji: string;
    paymail: string;
    type: string;
    context?: string;
    messageID?: string;
    [key: string]: string | undefined;
  }>;
}

interface RootState {
  chat: {
    messages: {
      loading: boolean;
      data: MessageData[];
      hasMore: boolean;
    };
    reactions: {
      byMessageTarget: Record<string, Reaction[]>;
      byTxTarget: Record<string, Reaction[]>;
    };
  };
  session: {
    user?: {
      bapId?: string;
    };
  };
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  background-color: var(--background-primary);
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 0;
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
  const dispatch = useDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const _activeUser = useActiveUser();

  const messages = useSelector((state: RootState) => state.chat.messages);
  const reactions = useSelector((state: RootState) => state.chat.reactions);
  const _session = useSelector((state: RootState) => state.session);

  const activeChannelId = useMemo(() => params.channel, [params.channel]);
  const activeUserId = useMemo(() => params.user, [params.user]);

  const _channelName =
    activeChannelId ||
    activeUserId ||
    last(window?.location?.pathname?.split('/'));

  const fetchMessageList = useCallback(() => {
    if (authToken || connected) {
      dispatch(fetchMessages(_channelName));
    }
  }, [authToken, connected, dispatch, _channelName]);

  useEffect(() => {
    fetchMessageList();
  }, [fetchMessageList]);

  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [shouldScrollToBottom]);

  useEffect(() => {
    if (postStatus === FetchStatus.Success) {
      setShouldScrollToBottom(true);
    }
  }, [postStatus]);

  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = e.currentTarget;
      setShouldScrollToBottom(false);

      if (scrollTop === 0 && !isLoadingMore && messages.hasMore) {
        setIsLoadingMore(true);
        try {
          await dispatch(fetchMoreMessages(_channelName));
        } finally {
          setIsLoadingMore(false);
        }
      }
    },
    [dispatch, isLoadingMore, messages.hasMore, _channelName],
  );

  if (messages.loading === FetchStatus.Loading) {
    return (
      <Container>
        <LoadingContainer>Loading...</LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <MessagesContainer onScroll={handleScroll}>
        <div ref={messagesEndRef} />
        {messages.data.map((message) => (
          <Message key={message.tx.h} message={message} reactions={reactions} />
        ))}
      </MessagesContainer>
      <WriteArea />
    </Container>
  );
};

export default Messages;
