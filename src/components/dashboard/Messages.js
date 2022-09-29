import { last } from "lodash";
import React, { useEffect, useMemo, useRef } from "react";
import { FaTerminal } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useActiveChannel, usePopover } from "../../hooks";
import { loadReactions } from "../../reducers/chatReducer";
import NitroIcon from "../icons/NitroIcon";
import Hashtag from "./Hashtag";
import Message from "./Message";
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
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat.messages);
  const hasMessages = messages.allIds.length > 0;

  const reactions = useSelector((state) => state.chat.reactions);
  const hasReactions = reactions.allIds?.length > 0;

  // Scroll to bottom of the chat history whenever there is a new message
  const containerBottomRef = useRef(null);
  useEffect(() => {
    containerBottomRef.current.scrollIntoView(false);
  }, [messages.allIds, containerBottomRef]);

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
        m.push(messages.byId[txid]);
      }
      return m.sort((a, b) => {
        return !a.timestamp || a.timestamp < b.timestamp ? -1 : 1;
      });
    }
    return [];
  }, [hasMessages, messages]);

  useEffect(() => {
    if (messagesSorted) {
      dispatch(loadReactions(messages.allIds));
    }
  }, [messagesSorted]);

  // hasMessages &&
  //   messages.sort((a, b) => {
  //     return !!a.timestamp && a.timestamp > b.timestamp ? -1 : 1;
  //   });

  const reactionList = useMemo(() => {
    if (hasMessages) {
      let m = [];
      for (let txid of Object.keys(messages.byId)) {
        m.push(messages.byId[txid]);
      }
      return m.sort((a, b) => {
        return !a.timestamp || a.timestamp < b.timestamp ? -1 : 1;
      });
    }
    return [];
  }, [hasMessages, messages]);

  return (
    <Wrapper className="scrollable">
      <Container>
        <HeaderContainer className="disable-select">
          <Hashtag
            size="36px"
            w="68px"
            color="white"
            bgcolor="var(--background-accent)"
          />
          <PrimaryHeading>
            Welcome to #
            {activeChannel?.channel ||
              last(window.location.pathname.split("/"))}
            !
          </PrimaryHeading>
          <SecondaryHeading>
            This is the start of #
            {activeChannel?.channel ||
              last(window.location.pathname.split("/"))}
            .
          </SecondaryHeading>
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
                ) : (
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
                )
              }
            />
          ))}
        <ContainerBottom ref={containerBottomRef}></ContainerBottom>
        <UserPopover
          open={showPopover}
          anchorEl={anchorEl}
          onClose={handleClickAway}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          user={user}
          setShowPopover={setShowPopover}
        />
      </Container>
    </Wrapper>
  );
};

export default Messages;
