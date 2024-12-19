import type React from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadChannels } from '../../reducers/channelsReducer';
import { FetchStatus } from '../../utils/common';
import Hashtag from './Hashtag';
import List from './List';
import ListItem from './ListItem';

interface Channel {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  icon?: string;
}

interface RootState {
  channels: {
    loading: boolean;
    data: Channel[];
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
  min-height: 0;
  padding: 0 0.5rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

const Title = styled.h2`
  color: var(--header-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin: 1.5rem 0 0.5rem 0.5rem;
`;

const ChannelList: React.FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const channels = useSelector((state: RootState) => state.channels);

  const fetchChannelList = useCallback(() => {
    if (authToken || connected) {
      dispatch(loadChannels());
    }
  }, [authToken, connected, dispatch]);

  useEffect(() => {
    fetchChannelList();
  }, [fetchChannelList]);

  const handleClick = useCallback(
    (id: string) => {
      navigate(`/channels/${id}`);
    },
    [navigate],
  );

  if (channels.loading === FetchStatus.Loading) {
    return null;
  }

  return (
    <Container>
      <Title>Text Channels</Title>
      <List>
        {channels.data.map((channel) => (
          <ListItem
            key={channel._id}
            active={channel._id === params.channel}
            onClick={() => handleClick(channel._id)}
          >
            <Hashtag />
            {channel.name}
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default ChannelList;
