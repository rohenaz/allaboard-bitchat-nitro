import bsv from "bsv";
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
import { useBap } from "../../context/bap";
import {
  decrypt,
  friendPublicKeyFromSeedString,
  useBitcoin,
} from "../../context/bitcoin";
import { useHandcash } from "../../context/handcash";
import { useActiveChannel, useActiveUser, usePopover } from "../../hooks";
import {
  loadDiscordReactions,
  loadMessages,
  loadReactions,
} from "../../reducers/chatReducer";
import { FetchStatus } from "../../utils/common";
import { getSigningPathFromHex } from "../../utils/sign";
import "../common/slider.less";
import BlockpostIcon from "../icons/BlockpostIcon";
import NitroIcon from "../icons/NitroIcon";
import RetrofeedIcon from "../icons/RetrofeedIcon";
import Avatar from "./Avatar";
import Hashtag from "./Hashtag";
import Message from "./Message";
import PinChannelModal from "./modals/PinChannelModal";
import UserPopover from "./UserPopover";
const { BAP } = require("bitcoin-bap");

const Wrapper = styled.div`
  background-color: var(--background-primary);
  display: flex;
  flex: 1;
  overflow: auto;
  height: calc(100vh - 48px - 68px);
`;

const AddFriendButton = styled.button`
  border-radius: 0.25rem;
  background-color: var(--brand);
  color: white;
  padding: 1rem;
  &:disabled {
    background: var(--background-secondary);
  }
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
  const { decIdentity } = useBap();
  const { friendRequestStatus, sendFriendRequest } = useBitcoin();
  const { decryptStatus } = useHandcash();
  const messages = useSelector((state) => state.chat.messages);
  const pins = useSelector((state) => state.channels.pins);
  const hasMessages = messages.allIds.length > 0;
  const reactions = useSelector((state) => state.chat.reactions);
  const hasReactions =
    (reactions.allTxIds || []).concat(reactions.allMessageIds)?.length > 0;
  const [showPinChannelModal, setShowPinChannelModal] = useState(false);
  const friendRequests = useSelector(
    (state) => state.memberList.friendRequests
  );
  const session = useSelector((state) => state.session);
  // Scroll to bottom of the chat history whenever there is a new message
  // or when messages finish loading
  const containerBottomRef = useRef(null);
  useEffect(() => {
    if (messages.loading === false && containerBottomRef.current) {
      setTimeout(containerBottomRef.current.scrollIntoView(false), 0);
    }
  }, [containerBottomRef.current, messages.loading, messages.allIds]);

  useEffect(() => {
    dispatch(
      loadMessages({
        activeChannelId: activeChannel?.channel,
        activeUserId: activeUser?._id,
      })
    );
  }, [activeChannel, activeUser, session]);

  const [
    user,
    anchorEl,
    showPopover,
    setShowPopover,
    handleClick,
    handleClickAway,
  ] = usePopover();

  const messagesSorted = useMemo(() => {
    // console.log({ loading: friendRequests.loading, decIdentity });
    if (hasMessages && decIdentity?.xprv) {
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
      return m
        .map((message) => {
          if (message.MAP.encrypted === "true") {
            // private key is my key from

            // If this is sel;f, get the nodes public key
            const self = message.AIP.bapId === activeUser?._id;

            let publicKey;
            if (self) {
              publicKey = friendPublicKeyFromSeedString(
                "notes",
                decIdentity.xprv
              );
            } else {
              if (friendRequests.incoming.byId[message.AIP.bapId]) {
                publicKey = new bsv.PublicKey(
                  friendRequests.incoming.byId[message.AIP.bapId]?.publicKey
                );
              } else {
                console.log("no self, no friends", friendRequests, message);
                return message;
              }
            }
            // get the user's public key
            // const publicKey =
            //   message.AIP.bapId === activeUser?._id
            //     ? friendPublicKeyFromSeedString("notes", decIdentity.xprv)
            //     : friendRequests.incoming.byId[message.AIP.bapId] &&
            //       new bsv.PublicKey(
            //         friendRequests.incoming.byId[message.AIP.bapId]?.publicKey
            //       );
            if (!publicKey) {
              console.log(
                "fail",
                friendRequests.incoming.byId,
                message.AIP.bapId
              );
            }

            const hdPk = bsv.HDPrivateKey(decIdentity.xprv);

            const seedHex = bsv.crypto.Hash.sha256(
              Buffer.from(
                message.AIP.bapId === activeUser?._id
                  ? "notes"
                  : message.AIP.bapId
              )
            ).toString("hex");
            const signingPath = getSigningPathFromHex(seedHex);

            const hdPrivateFriendKey = hdPk.deriveChild(signingPath);
            // console.log("using notes seed?", hdPrivateFriendKey);

            try {
              const decryptedContent = decrypt(
                message.B.content,
                hdPrivateFriendKey.privateKey
              );
              // console.log("decrypted", decryptedContent);
              return {
                ...message,
                ...{
                  B: {
                    content: Buffer.from(decryptedContent).toString("utf8"),
                  },
                },
              };
            } catch (e) {
              console.error("failed to decrypt", message.B, e);
              return message;
            }
          }
          return message;
        })
        .sort((a, b) => {
          return !a.timestamp || a.timestamp < b.timestamp ? -1 : 1;
        });
    }
    return [];
  }, [
    decIdentity,
    friendRequests,
    activeUser,
    hasMessages,
    messages,
    activeChannel,
  ]);

  useEffect(() => {
    if (messages) {
      console.log("FIRE LOAD REACT", messages.allIds.length);
      dispatch(loadReactions(messages.allIds));
      dispatch(loadDiscordReactions(messages.allMessageIds));
    }
  }, [messages.length, activeUser, activeChannel]);

  const self = useMemo(() => {
    return activeUser && session.user?.bapId === activeUser?._id;
  }, [session, activeUser]);

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
      return self ? (
        <>This is the beginning of your notes.</>
      ) : (
        <>
          This is the beginning of your direct message history with{" "}
          {activeUser?.user?.alternateName}
        </>
      );
    }
    return null;
  }, [self, activeChannel, activeUser]);

  const addFriend = useCallback(() => {
    if (activeUser) {
      // console.log("add friend", activeUser);
      sendFriendRequest(activeUser._id, decIdentity.xprv);
    }
  }, [decIdentity, sendFriendRequest, activeUser]);

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

  if (
    (activeUser && friendRequests.loading) ||
    (activeChannel && messages.loading)
  ) {
    return (
      <Wrapper className="scrollable">
        <Container>
          <HeaderContainer>
            <SecondaryHeading>Loading...</SecondaryHeading>
          </HeaderContainer>
        </Container>
      </Wrapper>
    );
  }

  if (
    activeUser &&
    !friendRequests.loading &&
    friendRequests.incoming.allIds.includes(activeUser._id) &&
    !activeUser.isFriend
  ) {
    return (
      <Wrapper className="scrollable">
        <Container>
          <HeaderContainer className="disable-select">
            {icon}

            <PrimaryHeading>{heading}</PrimaryHeading>
            <SecondaryHeading>
              You have a friend request from {activeUser.user?.alternateName}
            </SecondaryHeading>

            <AddFriendButton
              onClick={addFriend}
              disabled={friendRequestStatus === FetchStatus.Loading}
            >
              Accept
            </AddFriendButton>
          </HeaderContainer>
        </Container>
      </Wrapper>
    );
  }

  if (
    activeUser &&
    friendRequests &&
    friendRequests.outgoing.allIds.includes(activeUser._id) &&
    !activeUser.isFriend
  ) {
    return (
      <Wrapper className="scrollable">
        <Container>
          <HeaderContainer className="disable-select">
            {icon}

            <PrimaryHeading>{heading}</PrimaryHeading>
            <SecondaryHeading>
              Waiting for a response to your friend request.
            </SecondaryHeading>
          </HeaderContainer>
        </Container>
      </Wrapper>
    );
  }

  if (
    !self &&
    activeUser &&
    !decIdentity?.result?.commsPublicKey &&
    !activeUser?.isFriend &&
    !friendRequests.loading
  ) {
    return (
      <Wrapper className="scrollable">
        <Container>
          <HeaderContainer className="disable-select">
            {icon}

            <PrimaryHeading>{heading}</PrimaryHeading>
            <SecondaryHeading>
              {self
                ? `Encrypted notes that only you can read. Click enable notes to generate a key for this conversation.`
                : `You are not currently accepting new messages from non-friends.`}
            </SecondaryHeading>

            <AddFriendButton
              onClick={addFriend}
              disabled={friendRequestStatus === FetchStatus.Loading}
            >
              {`Add Friend`}
            </AddFriendButton>
          </HeaderContainer>
          <br />
          <br />
          <br />
        </Container>
      </Wrapper>
    );
  }

  if (
    activeUser &&
    !self &&
    !activeUser?.user?.commsPublicKey &&
    !activeUser?.isFriend &&
    !friendRequests.loading
  ) {
    return (
      <Wrapper className="scrollable">
        <Container>
          <HeaderContainer className="disable-select">
            {icon}

            <PrimaryHeading>{heading}</PrimaryHeading>
            <SecondaryHeading>
              This user is not currently accepting new messages from
              non-friends.
            </SecondaryHeading>

            <AddFriendButton onClick={addFriend}>Add Friend</AddFriendButton>
          </HeaderContainer>
        </Container>
      </Wrapper>
    );
  }

  return (
    <Wrapper className="scrollable">
      <Container>
        <HeaderContainer className="disable-select">
          {icon}

          <PrimaryHeading>{heading}</PrimaryHeading>
          <SecondaryHeading>{subheading}</SecondaryHeading>
          {activeUser && activeUser.isFriend && <div>FRIENDS</div>}
          {decryptStatus !== FetchStatus.Loading &&
            activeChannel &&
            !activeUser &&
            !pins.byChannel[activeChannel?.channel] && (
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
                  <NitroIcon style={{ width: ".75rem", height: ".75rem" }} />
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
          self={user.AIP?.bapId === session?.user?.bapId}
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
