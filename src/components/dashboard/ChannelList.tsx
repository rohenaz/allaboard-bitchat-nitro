import type React from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadChannels } from '../../reducers/channelsReducer';
import type { AppDispatch } from '../../store';
import { FetchStatus } from '../../utils/common';
import Hashtag from './Hashtag';
import List from './List';
import ListItem from './ListItem';

interface Channel {
  channel: string;
  last_message_time: number;
  last_message: string;
  messages: number;
  creator?: string;
}

interface RootState {
  channels: {
    loading: boolean;
    byId: { [key: string]: Channel };
    allIds: string[];
  };
  session: {
    user?: {
      idKey?: string;
    };
  };
}

const Container = styled.div`
  margin-top: 20px;
`;

const Title = styled.h2`
  padding: 0 10px;
  margin: 0;
  text-transform: uppercase;
  font-weight: 500;
  font-size: 12px;
  height: 24px;
  line-height: 24px;
  color: var(--channels-default);
`;

const ChannelList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const params = useParams();
  const { status: handcashStatus } = useHandcash();
  const { status: yoursStatus } = useYours();

  const { loading, byId, allIds } = useSelector(
    (state: RootState) => state.channels,
  );
  const user = useSelector((state: RootState) => state.session.user);

  useEffect(() => {
    if (user?.idKey) {
      dispatch(loadChannels());
    }
  }, [dispatch, user]);

  const handleClick = useCallback(
    (channelId: string) => {
      navigate(`/channels/${channelId}`);
    },
    [navigate],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (
    handcashStatus === FetchStatus.LOADING ||
    yoursStatus === FetchStatus.LOADING
  ) {
    return <div>Loading wallet...</div>;
  }

  return (
    <Container>
      <Title>Text Channels</Title>
      <List>
        {allIds.map((channelId) => {
          const channel = byId[channelId];
          return (
            <ListItem
              key={channelId}
              active={channelId === params.channel}
              onClick={() => handleClick(channelId)}
            >
              <Hashtag />
              {channel.channel}
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
};

export default ChannelList;
