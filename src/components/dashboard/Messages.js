import bsv from "bsv";
import { head, last } from "lodash";
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
import { useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useBap } from "../../context/bap";
import {
  decrypt,
  friendPrivateKeyFromSeedString,
  useBitcoin,
} from "../../context/bitcoin";
import { useHandcash } from "../../context/handcash";
import { usePopover } from "../../hooks";
import {
  loadDiscordReactions,
  loadMessages,
  loadReactions,
} from "../../reducers/chatReducer";
import { FetchStatus } from "../../utils/common";
import "../common/slider.less";
import BlockpostIcon from "../icons/BlockpostIcon";
import NitroIcon from "../icons/NitroIcon";
import RetrofeedIcon from "../icons/RetrofeedIcon";
import Avatar from "./Avatar";
import Hashtag from "./Hashtag";
import Message from "./Message";
import UserPopover from "./UserPopover";
import PinChannelModal from "./modals/PinChannelModal";

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
  const params = useParams();

  const dispatch = useDispatch();
  const { decIdentity } = useBap();
  const { friendRequestStatus, sendFriendRequest } = useBitcoin();
  const { decryptStatus } = useHandcash();

  const messages = useSelector((state) => state.chat.messages);
  const pins = useSelector((state) => state.channels.pins);
  const users = useSelector((state) => state.memberList);
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
  const pathName = window?.location?.pathname?.endsWith("/")
    ? window?.location?.pathname?.slice(0, -1)
    : window?.location?.pathname;
  let pathId = last(pathName.split("/")) || null;

  // const activeChannelId = params.channel;
  // const activeUserId = params.user;

  const hasMessages = useMemo(() => {
    return messages.allIds.length > 0;
  }, [messages]);

  const activeChannelId = useMemo(() => {
    return params.channel;
  }, [params]);

  const activeUserId = useMemo(() => {
    return params.user;
  }, [params]);

  useEffect(() => {
    if (messages.loading === false && containerBottomRef.current) {
      setTimeout(containerBottomRef.current.scrollIntoView(false), 0);
    }
  }, [containerBottomRef.current, messages.loading, messages.allIds]);

  useEffect(() => {
    console.log({ activeUserId, activeChannelId, pathId });
    if (activeChannelId) {
      console.log("load messages", {
        activeChannelId,
      });
      dispatch(
        loadMessages({
          activeChannelId,
        })
      );
    }

    if (!activeChannelId && !activeUserId && pathId === "channels") {
      console.log("load messages global");
      dispatch(loadMessages({}));
    }
  }, [pathId, activeUserId, activeChannelId]);

  useEffect(() => {
    if (activeUserId && decIdentity?.bapId && !activeChannelId) {
      console.log("load messages", {
        activeUserId,
      });
      dispatch(
        loadMessages({
          activeChannelId,
          activeUserId,
          myBapId: decIdentity?.bapId,
        })
      );
    }

    //}
  }, [activeChannelId, activeUserId, decIdentity]);

  const [
    user,
    anchorEl,
    showPopover,
    setShowPopover,
    handleClick,
    handleClickAway,
  ] = usePopover();

  const activeUser = useMemo(() => users?.byId[users.active], [users]);

  const self = useMemo(() => {
    return activeUserId && session.user?.bapId === activeUserId;
  }, [session, activeUserId]);

  const messagesSorted = useMemo(() => {
    // console.log({ loading: friendRequests.loading, decIdentity });
    if (hasMessages) {
      let m = [];
      for (let txid of Object.keys(messages.byId)) {
        if (
          (!activeChannelId && !head(messages.byId[txid].MAP).channel) ||
          head(messages.byId[txid].AIP)?.bapId === activeUser?._id ||
          head(messages.byId[txid].MAP).channel === activeChannelId
        ) {
          m.push(messages.byId[txid]);
        }
      }
      console.log({ m });
      return m
        .map((message) => {
          if (head(message.MAP).encrypted === "true") {
            console.log("encrypted message", activeUser, message);
            // private key is my key from

            // If this is self, get the nodes public key

            const messageFromMe =
              head(message.AIP)?.bapId === session.user?.bapId;
            const messageToMe =
              head(message.MAP)?.bapID === session.user?.bapId;
            const messageSelf = messageToMe && messageFromMe;

            const friendPrivateKey = friendPrivateKeyFromSeedString(
              messageSelf
                ? "notes"
                : messageToMe
                ? head(message.AIP)?.bapId
                : head(message.MAP)?.bapID,
              decIdentity.xprv
            );

            // let hdPrivateFriendKey;
            // try {
            //   const hdPk = bsv.HDPrivateKey(decIdentity.xprv);

            //   console.log({ self, messageSelf });
            //   const seedHex = bsv.crypto.Hash.sha256(
            //     Buffer.from(self ? "notes" : message.MAP.bapID)
            //   ).toString("hex");
            //   const signingPath = getSigningPathFromHex(seedHex);

            //   hdPrivateFriendKey = hdPk.deriveChild(signingPath);
            //   // console.log("using notes seed?", hdPrivateFriendKey);
            // } catch (e) {
            //   console.error(e);
            //   return message;
            // }

            // get the friend's public key
            // TODO: Handle self case
            const friendPubKey = messageToMe
              ? head(friendRequests.incoming.byId[head(message.AIP).bapId]?.MAP)
                  .publicKey
              : head(friendRequests.incoming.byId[head(message.MAP).bapID]?.MAP)
                  .publicKey;

            if (!messageSelf && (!friendPrivateKey || !friendPubKey)) {
              console.error(
                "failed to make key",
                friendPrivateKey,
                friendPubKey
              );
              return message;
            }

            console.log({
              friendPubKey,
              messageSelf,
              messageToMe,
              message,
              session,
            });
            try {
              const decryptedContent = decrypt(
                head(message.B)?.Data?.utf8,
                friendPrivateKey,
                messageSelf
                  ? undefined
                  : messageToMe
                  ? new bsv.PublicKey(
                      head(
                        friendRequests.incoming.byId[head(message.AIP).bapId]
                          ?.MAP
                      ).publicKey
                    )
                  : new bsv.PublicKey(
                      head(
                        friendRequests.incoming.byId[head(message.MAP).bapID]
                          ?.MAP
                      ).publicKey
                    )
              );
              // console.log("decrypted", decryptedContent);
              return {
                ...message,
                ...{
                  B: [
                    {
                      content: Buffer.from(decryptedContent).toString("utf8"),
                    },
                  ],
                },
              };
            } catch (e) {
              console.error(
                "failed to decrypt",
                head(message.MAP),
                head(message.AIP),
                friendPubKey,
                e
              );

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
    self,
    decIdentity,
    friendRequests,
    activeUserId,
    activeUser,
    hasMessages,
    messages.allIds,
    activeChannelId,
    users,
    session,
  ]);

  useEffect(() => {
    if (messages) {
      // console.log("load reactions for", messages.allIds, { messages });
      dispatch(loadReactions(messages.allIds));
      dispatch(loadDiscordReactions(messages.allMessageIds));
    }
  }, [messages, activeUser, activeChannelId]);

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
    const ps = [...(pins.byChannel[activeChannelId] || [])];
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
  }, [pins, activeChannelId]);

  const togglePinChannelModal = useCallback(() => {
    setShowPinChannelModal(!showPinChannelModal);
  }, [showPinChannelModal]);

  const heading = useMemo(() => {
    if (activeChannelId) {
      return <>Welcome to #{activeChannelId}!</>;
    } else if (activeUser) {
      return <>{activeUser?.user?.alternateName}</>;
    }
    return null;
  }, [activeChannelId, activeUser]);

  const subheading = useMemo(() => {
    if (activeChannelId) {
      return <>This is the start of #{activeChannelId}.</>;
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
  }, [self, activeChannelId, activeUser]);

  const addFriend = useCallback(() => {
    if (activeUser && decIdentity.xprv) {
      // console.log("add friend", activeUser);
      sendFriendRequest(activeUser._id, decIdentity.xprv);
    } else {
      console.error("no goods!");
    }
  }, [decIdentity, sendFriendRequest, activeUser]);

  const icon = useMemo(() => {
    if (activeChannelId) {
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
            icon={activeUser.user?.logo}
          />
        </>
      );
    }
    return null;
  }, [activeChannelId, activeUser]);

  // useEffect(() => {
  //   console.log({ session, friendRequests, activeUser });
  // }, [session, friendRequests, activeUser]);

  if (activeUser && !decIdentity) {
    return (
      <Wrapper className="scrollable">
        <Container>
          <HeaderContainer>
            <SecondaryHeading>
              Import an identity to enable DMs.
            </SecondaryHeading>
          </HeaderContainer>
        </Container>
      </Wrapper>
    );
  }

  if (
    (decIdentity && activeUser && friendRequests.loading) ||
    (activeChannelId && messages.loading)
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
    !friendRequests.outgoing.allIds.includes(activeUser._id)
    // !activeUser.isFriend
  ) {
    console.log({ activeUser, friendRequests });
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
    !friendRequests.incoming.allIds.includes(activeUser._id)
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
    !(
      friendRequests.incoming.allIds.includes(activeUser._id) &&
      friendRequests.outgoing.allIds.includes(activeUser._id)
    ) &&
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
    !(
      friendRequests.incoming.allIds.includes(activeUser._id) &&
      friendRequests.outgoing.allIds.includes(activeUser._id)
    ) &&
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
          {activeUser &&
            session &&
            friendRequests.outgoing.allIds.includes(activeUser._id) &&
            friendRequests.incoming.allIds.includes(activeUser._id) && (
              <div>FRIENDS</div>
            )}
          {decryptStatus !== FetchStatus.Loading &&
            activeChannelId &&
            !activeUser &&
            !pins.byChannel[activeChannelId] && (
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
          {pins.allChannels.includes(activeChannelId) && (
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
                head(m.MAP).app === "bitchat" ? (
                  <div
                    style={{
                      color: "lime",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaTerminal style={{ width: ".75rem", height: ".75rem" }} />
                  </div>
                ) : head(m.MAP).app === "blockpost.network" ? (
                  <div
                    style={{
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <BlockpostIcon style={{ width: "1rem" }} />
                  </div>
                ) : head(m.MAP).app === "bitchatnitro.com" ? (
                  <NitroIcon style={{ width: ".75rem", height: ".75rem" }} />
                ) : head(m.MAP).app === "retrofeed.me" ? (
                  <div style={{ color: "#F42B2C" }}>
                    <RetrofeedIcon
                      style={{
                        width: ".75rem",
                        height: ".75rem",
                        opacity: "0.5",
                      }}
                    />
                  </div>
                ) : head(m.MAP).app === "pewnicornsocial.club" ? (
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
          channel={activeChannelId}
        />
      </Container>
    </Wrapper>
  );
};

export default Messages;
