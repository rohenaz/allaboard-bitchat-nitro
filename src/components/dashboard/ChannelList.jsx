// src/components/dashboard/ChannelList.js
import { useCallback, useEffect, useState } from "react";
import { head } from "lodash";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { Link as RDLink } from "react-router-dom";
import styled from "styled-components";
import { useBap } from "../../context/bap";
import { useBitcoin } from "../../context/bitcoin";
import { useHandcash } from "../../context/handcash";
import { useWindowWidth } from "../../hooks";
import { loadChannels, unpinChannel } from "../../reducers/channelsReducer";
import { toggleSidebar } from "../../reducers/sidebarReducer";
import { FetchStatus } from "../../utils/common";
import Avatar from "./Avatar";
import Hashtag from "./Hashtag";
import List from "./List";
import ListItem from "./ListItem";
import PinChannelModal from "./modals/PinChannelModal";

const Link = styled(RDLink)`
  &:hover {
    text-decoration: none;
  }
`;

const Container = styled.div`
  width: 240px;
  display: flex;
  flex-direction: column;
  text-overflow: ellipsis;
  background-color: var(--background-secondary);
  flex-shrink: 0;
`;

const Header = styled.div`
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--background-tertiary);
  height: 48px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 0 16px;
`;

const Heading = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const Content = styled.div`
  background-color: var(--background-secondary);
  flex: 1;
  height: calc(100dvh - 48px - 52px);
  padding: 10px 2px 10px 8px;
  overflow-y: auto;
  overflow-x: hidden;
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--background-tertiary);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--background-floating);
  }
`;

const Footer = styled.div`
  background-color: var(--background-secondary-alt);
  height: 52px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
`;

const Username = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: var(--header-primary);
  font-weight: 600;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  justify-content: start;

  div:last-child {
    font-size: .75rem;
    color: var(--text-muted);
  }
`;

const ChannelList = ({ activeChannelId }) => {
  const dispatch = useDispatch();
  const { profile } = useHandcash();
  const channels = useSelector((state) => state.channels);
  const isInDesktop = useWindowWidth() > 768;
  const [unpinsSet, setUnpinsSet] = useState(false);
  const messages = useSelector((state) => state.chat.messages);
  const user = useSelector((state) => state.session.user);
  const { pinStatus } = useBitcoin();
  const [pendingPin, setPendingPin] = useState(false);
  const [hoveringChannel, setHoveringChannel] = useState();
  const { decIdentity } = useBap();
  const [lastMessageSeen] = useState(moment().unix());

  useEffect(() => {
    dispatch(loadChannels());
  }, [dispatch]);

  const mouseOver = useCallback(
    (id) => {
      if (id) {
        setHoveringChannel(id);
      }
    },
    []
  );

  const mouseOut = useCallback(
    (id) => {
      if (hoveringChannel === id) {
        setHoveringChannel(undefined);
      }
    },
    [hoveringChannel]
  );

  useEffect(() => {
    if (
      !unpinsSet &&
      channels.pins?.allChannels &&
      channels.pins.allChannels?.length > 0 &&
      !channels.pins.loading
    ) {
      setUnpinsSet(true);
      for (const c of channels.pins.allChannels) {
        setTimeout(() => {
          dispatch(unpinChannel(c));
        }, head(channels.pins.byChannel[c]).expiresAt * 1000);
      }
    }
  }, [unpinsSet, channels.pins, dispatch]);

  const renderChannel = useCallback(
    (id) => {
      const channel = channels.byId[id];
      if (!channel) {
        console.log('Channel not found in byId:', id);
        return null;
      }

      return (
        <Link
          key={id}
          to={`/channels${id ? `/${id}` : ""}`}
          onClick={() => !isInDesktop && dispatch(toggleSidebar())}
        >
          <ListItem
            icon={<Hashtag size="20px" />}
            text={channel.channel || "global"}
            style={{
              gap: "8px",
              padding: "8px 4px",
            }}
            id={channel.channel}
            isPinned={channels.pins?.byChannel[channel.channel]}
            onMouseEnter={(e) => mouseOver(e.target.id)}
            onMouseLeave={(e) => mouseOut(e.target.id)}
            hasActivity={channel.last_message_time > lastMessageSeen}
            isActive={channel.channel === activeChannelId || (!channel.channel && !activeChannelId)}
            showPin={
              pinStatus !== FetchStatus.Loading && channel.channel && hoveringChannel === channel.channel
            }
            onClickPin={() => {
              setPendingPin(channel.channel);
            }}
          />
        </Link>
      );
    },
    [
      lastMessageSeen,
      hoveringChannel,
      isInDesktop,
      activeChannelId,
      channels,
      pinStatus,
      dispatch,
      mouseOver,
      mouseOut,
    ]
  );

  return (
    <Container className="disable-select">
      <Header>
        <Heading>Bitchat [Nitro]</Heading>
      </Header>
      <Content className="scrollable">
        <List gap="2px">
          {!channels.loading && channels.pins?.allChannels?.length > 0 && (
            <>
              {console.log('Rendering pinned channels:', channels.pins.allChannels)}
              {channels.pins.allChannels
                .filter(id => {
                  const exists = !!channels.byId[id];
                  console.log('Pinned channel filter:', { id, exists });
                  return exists;
                })
                .map(renderChannel)}
            </>
          )}
          {!channels.loading && channels.allIds?.length > 0 && (
            channels.allIds
                .filter(id => {
                  const notPinned = !channels.pins?.byChannel[id];
                  const exists = !!channels.byId[id];
                  return notPinned && exists;
                })
                .map(renderChannel)
          )}
        </List>
      </Content>
      <Footer>
        <Avatar
          size="21px"
          w="32px"
          bgcolor={"#000"}
          status="online"
          paymail={profile?.paymail}
        />
        <Username>
          <div>{user?.alternativeName || profile?.paymail}</div>
          <div style={{ fontSize: ".75rem", color: "#777" }}>
            {decIdentity?.bapId?.slice(0, 8)}
          </div>
        </Username>
      </Footer>
      <PinChannelModal
        open={!!pendingPin}
        channel={pendingPin}
        onClose={() => setPendingPin(undefined)}
      />
    </Container>
  );
};

export default ChannelList;
