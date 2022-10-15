import { head } from "lodash";
import moment from "moment";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AiFillPushpin } from "react-icons/ai";
import { FaTerminal } from "react-icons/fa";
import { GiUnicorn } from "react-icons/gi";
import { MdChat } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useActiveChannel, useActiveUser, usePopover } from "../../hooks";
import {
  loadDiscordReactions,
  loadReactions,
} from "../../reducers/chatReducer";
import "../common/slider.less";
import BlockpostIcon from "../icons/BlockpostIcon";
import NitroIcon from "../icons/NitroIcon";
import RetrofeedIcon from "../icons/RetrofeedIcon";
import Avatar from "./Avatar";
import Hashtag from "./Hashtag";
import Message from "./Message";
import PinChannelModal from "./modals/PinChannelModal";
import UserPopover from "./UserPopover";

const Wrapper = styled.div`
  background-color: var(--background-primary);
  display: flex;
  flex: 1;
  overflow: auto;
  height: calc(100vh - 48px - 68px);
`;

const Container = styled.div`
  margin-top: auto;
  width: 100%;
`;

const HeaderContainer = styled.div`
  margin: 16px 16px 4px 16px;
`;

const PrimaryHeading = styled.h1`
  color: var(--header-primary);
  margin-top: 12px;
  margin-bottom: 4px;
`;

const SecondaryHeading = styled.h2`
  color: var(--header-secondary);
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 400;
`;

const Divider = styled.hr`
  border: 0;
  border-top: 1px solid var(--channeltextarea-background);
  width: 100%;
`;

const ContainerBottom = styled.div``;

const Messages = () => {
  const activeChannel = useActiveChannel();
  const activeUser = useActiveUser();
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat.messages);
  const pins = useSelector((state) => state.channels.pins);
  const hasMessages = messages.allIds.length > 0;

  const reactions = useSelector((state) => state.chat.reactions);
  const hasReactions =
    (reactions.allTxIds || []).concat(reactions.allMessageIds)?.length > 0;
  const [showPinChannelModal, setShowPinChannelModal] = useState(false);

  // Scroll to bottom of the chat history whenever there is a new message
  // or when messages finish loading
  const containerBottomRef = useRef(null);
  useEffect(() => {
    console.log({ activeUser });
    if (messages.loading === false && containerBottomRef.current) {
      setTimeout(containerBottomRef.current.scrollIntoView(false), 0);
    }
  }, [containerBottomRef.current, messages.loading, messages.allIds]);

  const [
    user,
    anchorEl,
    showPopover,
    setShowPopover,
    handleClick,
    handleClickAway,
  ] = usePopover();

  const messagesSorted = useMemo(() => {
    if (hasMessages) {
      let m = [];
      for (let txid of Object.keys(messages.byId)) {
        if (
          (!activeChannel?.channel && !messages.byId[txid].MAP.channel) ||
          messages.byId[txid].AIP?.bapId === activeUser?._id ||
          messages.byId[txid].MAP.channel === activeChannel?.channel
        ) {
          m.push(messages.byId[txid]);
        }
      }
      return m.sort((a, b) => {
        return !a.timestamp || a.timestamp < b.timestamp ? -1 : 1;
      });
    }
    return [];
  }, [activeUser, hasMessages, messages, activeChannel]);

  useEffect(() => {
    if (messagesSorted) {
      dispatch(loadReactions(messages.allIds));
      dispatch(loadDiscordReactions(messages.allMessageIds));
    }
  }, [messagesSorted]);

  // hasMessages &&
  //   messages.sort((a, b) => {
  //     return !!a.timestamp && a.timestamp > b.timestamp ? -1 : 1;
  //   });

  // const reactionList = useMemo(() => {
  //   if (hasMessages) {
  //     let m = [];
  //     for (let txid of Object.keys(messages.byId)) {
  //       m.push(messages.byId[txid]);
  //     }
  //     return m.sort((a, b) => {
  //       return !a.timestamp || a.timestamp < b.timestamp ? -1 : 1;
  //     });
  //   }
  //   return [];
  // }, [hasMessages, messages]);

  // let unix = +new Date() / 1000;
  const expiresIn = useMemo(() => {
    const ps = [...(pins.byChannel[activeChannel?.channel] || [])];
    if (!ps) {
      return ``;
    }
    const channelPin = head(
      ps.sort((a, b) => (a?.timestamp > b?.timestamp ? -1 : 1))
    );
    if (!channelPin || !channelPin?.expiresAt) {
      return ``;
    }

    let mins = moment.unix(channelPin?.expiresAt).diff(moment(), "minutes");
    if (mins > 60) {
      return `${Math.floor(mins / 60)} hours and ${mins % 60} minutes`;
    }
    return `${mins} minutes`;
  }, [pins, activeChannel]);

  const togglePinChannelModal = useCallback(() => {
    setShowPinChannelModal(!showPinChannelModal);
  }, [showPinChannelModal]);

  const heading = useMemo(() => {
    if (activeChannel) {
      return <>Welcome to #{activeChannel?.channel}!</>;
    } else if (activeUser) {
      return <>{activeUser?.user?.alternateName}</>;
    }
    return null;
  }, [activeChannel, activeUser]);

  const subheading = useMemo(() => {
    if (activeChannel) {
      return <>This is the start of #{activeChannel?.channel}.</>;
    } else if (activeUser) {
      return (
        <>
          This is the beginning of your direct message history with{" "}
          {activeUser?.user?.alternateName}
        </>
      );
    }
    return null;
  }, [activeChannel, activeUser]);

  const icon = useMemo(() => {
    if (activeChannel) {
      return (
        <Hashtag
          size="36px"
          w="68px"
          color="white"
          bgcolor="var(--background-accent)"
        />
      );
    } else if (activeUser) {
      // TODO: Hook up avatar status
      return (
        <>
          <Avatar
            size={72}
            w={72}
            h={72}
            // bgColor={user.avatarColor}
            bgcolor={"#000"}
            // status="online"
            icon={activeUser.user.logo}
          />
        </>
      );
    }
    return null;
  }, [activeChannel, activeUser]);

  return (
    <Wrapper className="scrollable">
      <Container>
        <HeaderContainer className="disable-select">
          {icon}

          <PrimaryHeading>{heading}</PrimaryHeading>
          <SecondaryHeading>{subheading}</SecondaryHeading>
          {!activeUser && !pins.byChannel[activeChannel?.channel] && (
            <div
              style={{
                cursor: "pointer",
                alignItems: "center",
                display: "flex",
                color: "gold",
              }}
              onClick={togglePinChannelModal}
            >
              <AiFillPushpin style={{ marginRight: ".5rem" }} /> Pin this
              Channel
            </div>
          )}
          {pins.allChannels.includes(activeChannel?.channel) && (
            <div style={{ color: "#777" }}>
              This channel is pinned for another {expiresIn}
            </div>
          )}
          {hasMessages && <Divider />}
        </HeaderContainer>
        {hasMessages &&
          messagesSorted.map((m) => (
            <Message
              key={m.tx.h}
              message={m}
              reactions={hasReactions ? reactions : null}
              handleClick={(event) => handleClick(event, m)}
              appIcon={
                m.MAP.app === "bitchat" ? (
                  <div
                    style={{
                      color: "lime",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaTerminal style={{ width: ".75rem", height: ".75rem" }} />
                  </div>
                ) : m.MAP.app === "blockpost.network" ? (
                  <div
                    style={{
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <BlockpostIcon style={{ width: "1rem" }} />
                  </div>
                ) : m.MAP.app === "bitchatnitro.com" ? (
                  <div
                    style={{
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      opacity: ".25",
                    }}
                  >
                    <NitroIcon style={{ width: ".75rem", height: ".75rem" }} />
                  </div>
                ) : m.MAP.app === "retrofeed.me" ? (
                  <div style={{ color: "#F42B2C" }}>
                    <RetrofeedIcon
                      style={{
                        width: ".75rem",
                        height: ".75rem",
                        opacity: "0.5",
                      }}
                    />
                  </div>
                ) : m.MAP.app === "pewnicornsocial.club" ? (
                  <div style={{ color: "pink" }}>
                    <GiUnicorn
                      style={{
                        width: ".75rem",
                        height: ".75rem",
                        opacity: "0.5",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      opacity: ".25",
                    }}
                  >
                    <MdChat style={{ width: ".75rem", height: ".75rem" }} />
                  </div>
                )
              }
            />
          ))}
        {hasMessages && (
          <ContainerBottom ref={containerBottomRef}></ContainerBottom>
        )}
        <UserPopover
          open={showPopover}
          anchorEl={anchorEl}
          onClose={handleClickAway}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          user={user}
          setShowPopover={setShowPopover}
        />
        <PinChannelModal
          open={showPinChannelModal}
          onClose={() => setShowPinChannelModal(false)}
          channel={activeChannel?.channel}
        />
      </Container>
    </Wrapper>
  );
};

export default Messages;
