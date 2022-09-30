import React, { useCallback, useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useBap } from "../../context/bap";
import { useHandcash } from "../../context/handcash";
import { useRelay } from "../../context/relay";

import { head } from "lodash";
import { useWindowWidth } from "../../hooks";
import { loadChannels } from "../../reducers/channelsReducer";
import { toggleSidebar } from "../../reducers/sidebarReducer";
import Avatar from "./Avatar";
import Hashtag from "./Hashtag";
import List from "./List";
import ListItem from "./ListItem";

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
  const { profile, hcEncrypt, authToken } = useHandcash();
  const { setIdentity, identity } = useBap();

  // const user = useSelector((state) => state.session.user);
  const channels = useSelector((state) => state.channels);
  const activeChannelId = useSelector((state) => state.channels.active);
  const isInDesktop = useWindowWidth() > 768;

  const messages = useSelector((state) => state.chat.messages);
  const hasMessages = messages.allIds.length > 0;

  const inputFileRef = React.useRef();

  const onFileChange = useCallback(
    async (e) => {
      /*Selected files data can be collected here.*/
      console.log(e.target.files);

      // const encryptedData = localStorage.getItem("bitchat-nitro._bapid");

      const file = head(e.target.files);
      const text = await toText(file);

      console.log({ text, authToken });
      // encrypt the uploaded file and store it locally
      if (authToken) {
        // handcash
        const encryptedData = await hcEncrypt(JSON.parse(text));
        console.log({ encryptedData });
        setIdentity(encryptedData);
      }
    },
    [authToken, hcEncrypt, setIdentity]
  );

  const uploadIdentity = useCallback(() => {
    inputFileRef.current.click();
  }, []);

  return (
    <Container className="disable-select">
      <Header>
        <Heading>Bitchat [Nitro]</Heading>
      </Header>
      <Content className="scrollable">
        <List gap="2px">
          {!channels.loading &&
            channels.allIds.map((id) => (
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
                  hasActivity={
                    (!id &&
                      messages?.allIds?.some(
                        (cid) =>
                          messages.byId[cid]?.MAP &&
                          !messages.byId[cid]?.MAP.channel
                      )) ||
                    messages?.allIds?.some(
                      (cid) => messages.byId[cid]?.MAP.channel === id
                    )
                  }
                  isActive={id === activeChannelId || (!id && !activeChannelId)}
                />
              </Link>
            ))}
        </List>
      </Content>
      <Footer onClick={uploadIdentity}>
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
        <input
          type="file"
          ref={inputFileRef}
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </Footer>
    </Container>
  );
};

export default ChannelList;

const toText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
