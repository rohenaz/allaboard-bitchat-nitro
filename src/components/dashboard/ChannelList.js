import React, { useCallback, useEffect, useState } from "react";

import { head } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Link as RDLink } from "react-router-dom";
import styled from "styled-components";
import { useBitcoin } from "../../context/bitcoin";
import { useHandcash } from "../../context/handcash";
import { useRelay } from "../../context/relay";
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
  height: calc(100vh - 48px - 52px);
  padding: 10px 2px 10px 8px;
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
`;

const ChannelList = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadChannels());
  }, [dispatch]);

  const { paymail } = useRelay();
  const { profile } = useHandcash();

  // const user = useSelector((state) => state.session.user);
  const channels = useSelector((state) => state.channels);
  const activeChannelId = useSelector((state) => state.channels.active);
  const isInDesktop = useWindowWidth() > 768;
  const [unpinsSet, setUnpinsSet] = useState(false);
  const messages = useSelector((state) => state.chat.messages);
  const { sendPin, pinStatus } = useBitcoin();
  const [pendingPin, setPendingPin] = useState(false);

  const hasMessages = messages.allIds.length > 0;
  const [hoveringChannel, setHoveringChannel] = useState();

  const mouseOver = useCallback(
    (id) => {
      if (id) {
        setHoveringChannel(id);
      }
    },
    [hoveringChannel]
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
      channels.pins.allChannels.forEach((c) => {
        // console.log(
        //   "unpins at",
        //   new Date(head(channels.pins.byChannel[c]).expiresAt * 1000)
        // );
        setTimeout(() => {
          dispatch(unpinChannel, c);
        }, head(channels.pins.byChannel[c]).expiresAt * 1000);
      });
    }
  }, [unpinsSet, channels.pins?.allChannels]);

  // const pinChannel = useCallback(
  //   async (id) => {
  //     if (id) {
  //       try {
  //         await sendPin(paymail || profile?.paymail, id, units);
  //         setShowPinChannelModal(false);
  //       } catch (e) {
  //         console.error(e);
  //       }
  //     }
  //   },
  //   [units, paymail, profile, sendPin]
  // );

  const renderChannel = useCallback(
    (id) => {
      return (
        <Link
          key={id}
          to={`/channels/${id}`}
          onClick={() => !isInDesktop && dispatch(toggleSidebar())}
        >
          <ListItem
            icon={<Hashtag size="20px" />}
            text={id || "global"}
            style={{
              gap: "8px",
              padding: "8px 4px",
            }}
            id={id}
            isPinned={channels.pins.byChannel[id]}
            onMouseEnter={(e) => mouseOver(e.target.id)}
            onMouseLeave={(e) => mouseOut(e.target.id)}
            hasActivity={
              (!id &&
                messages?.allIds?.some(
                  (cid) =>
                    messages.byId[cid]?.MAP && !messages.byId[cid]?.MAP.channel
                )) ||
              messages?.allIds?.some(
                (cid) => messages.byId[cid]?.MAP.channel === id
              )
            }
            isActive={id === activeChannelId || (!id && !activeChannelId)}
            showPin={
              pinStatus !== FetchStatus.Loading && id && hoveringChannel === id
            }
            onClickPin={() => {
              setPendingPin(id);
            }}
          />
        </Link>
      );
    },
    [hoveringChannel, messages, isInDesktop, activeChannelId, channels]
  );

  return (
    <Container className="disable-select">
      <Header>
        <Heading>Bitchat [Nitro]</Heading>
      </Header>
      <Content className="scrollable">
        <List gap="2px">
          {!channels.pins.loading &&
            channels.pins.allChannels
              // .sort((a, b) => {
              //   //   const timeA = a && channels.byId[a]?.last_message_time;
              //   //   const timeB = b && channels.byId[b]?.last_message_time;
              //   //   console.log({ timeA, timeB });
              //   //   return timeA > timeB ? -1 : 1;
              // })
              .map(renderChannel)}
          {!channels.loading &&
            channels.allIds
              .filter((id) => !channels.pins.byChannel[id])
              .map(renderChannel)}
        </List>
      </Content>
      <Footer>
        <Avatar
          size="21px"
          w="32px"
          // bgColor={user.avatarColor}
          bgcolor={"#000"}
          status="online"
          paymail={paymail || profile?.paymail}
        />
        {/* <Username>{user.username}</Username> */}
        <Username>{paymail || profile?.paymail}</Username>
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
