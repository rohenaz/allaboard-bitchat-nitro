import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PrivateKey, PublicKey, ECIES, Hash } from "@bsv/sdk";
import { head, last } from "lodash";
import moment from "moment";
import { AiFillPushpin } from "react-icons/ai";
import { FaTerminal } from "react-icons/fa";
import { GiUnicorn } from "react-icons/gi";
import { MdChat } from "react-icons/md";
import { useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import tw, { styled } from "twin.macro";
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
  loadLikes,
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
import { isValidEmail } from "../../utils/strings";

const Wrapper = styled.div`
  background-color: var(--background-primary);
  display: flex;
  flex: 1;
  overflow-y: auto;
  height: calc(100dvh - 48px - 58px);
  max-width: 100vw;
`;

const AddFriendButton = styled.button`
  border-radius: 4px;
  background-color: rgb(88, 101, 242);
  color: white;
  padding: 1rem;

  &:disabled {
    background-color: var(--background-secondary);
  }
`;

const Container = styled.div`
  margin-top: auto;
  width: 100%;
`;

const HeaderContainer = styled.div`
  margin: 1rem 1rem 0.25rem 1rem;
`;

const PrimaryHeading = styled.h1`
  color: var(--header-primary);
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
`;

const SecondaryHeading = styled.h2`
  color: var(--header-secondary);
  margin-bottom: 1rem;
  font-size: 0.875rem;
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
  const { hideUnverifiedMessages } = useSelector((state) => state.settings);
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
  const pathId = last(pathName.split("/")) || null;
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
      setTimeout(() => containerBottomRef.current.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }, [messages.loading]);

  useEffect(() => {
    console.log({ activeUserId, activeChannelId, pathId });
    if (activeChannelId) {
      console.log("load messages", {
        activeChannelId,
      });
      dispatch(
        loadMessages({
          activeChannelId,
          page: 1 // Reset to first page when channel changes
        })
      );
    }

    if (!activeChannelId && !activeUserId && pathId === "channels") {
      console.log("load messages global");
      dispatch(loadMessages({}));
    }
  }, [pathId, activeUserId, activeChannelId, dispatch]);

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
  }, [activeChannelId, activeUserId, decIdentity, dispatch]);

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
    if (!hasMessages || !messages.byId) return [];

    // Use the order from messages.allIds and filter out invalid messages
    return messages.allIds
      .map(id => {
        const message = messages.byId[id];
        if (!message) return null;

        if (hideUnverifiedMessages && !isValidEmail(head(message.MAP).paymail)) {
          return null;
        }

        const isValidMessage = (
          (!activeChannelId && !head(message.MAP).channel) ||
          head(message.AIP)?.bapId === activeUser?._id ||
          head(message.MAP).channel === activeChannelId
        );

        if (!isValidMessage) return null;

        if (head(message.MAP).encrypted === "true") {
          return processEncryptedMessage(message, session, friendRequests, decIdentity);
        }
        return message;
      })
      .filter(Boolean);
  }, [
    hasMessages,
    messages.byId,
    messages.allIds,
    hideUnverifiedMessages,
    activeChannelId,
    activeUser?._id,
    session,
    friendRequests,
    decIdentity
  ]);

  useEffect(() => {
    if (messages) {
      // Load likes for all messages in a single batch
      const messageIds = messages.allIds;
      if (messageIds.length > 0) {
        dispatch(loadLikes(messageIds));
        dispatch(loadDiscordReactions(messages.allMessageIds));
      }
    }
  }, [messages, dispatch]);

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
      return "";
    }
    const channelPin = head(
      ps.sort((a, b) => (a?.timestamp > b?.timestamp ? -1 : 1))
    );
    if (!channelPin || !channelPin?.expiresAt) {
      return "";
    }

    const mins = moment.unix(channelPin?.expiresAt).diff(moment(), "minutes");
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
    } 
     if (activeUser) {
      return <>{activeUser?.user?.alternateName}</>;
    }
    return null;
  }, [activeChannelId, activeUser]);

  const subheading = useMemo(() => {
    if (activeChannelId) {
      return <>This is the start of #{activeChannelId}.</>;
    } 
    if (activeUser) {
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
      sendFriendRequest(activeUser.idKey, decIdentity.xprv);
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
    } 
     if (activeUser) {
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
    friendRequests.incoming.allIds.includes(activeUser.idKey) &&
    !friendRequests.outgoing.allIds.includes(activeUser.idKey)
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
    friendRequests.outgoing.allIds.includes(activeUser.idKey) &&
    !friendRequests.incoming.allIds.includes(activeUser.idKey)
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
      friendRequests.incoming.allIds.includes(activeUser.idKey) &&
      friendRequests.outgoing.allIds.includes(activeUser.idKey)
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
                ? "Encrypted notes that only you can read. Click enable notes to generate a key for this conversation."
                : "You are not currently accepting new messages from non-friends."}
            </SecondaryHeading>

            <AddFriendButton
              onClick={addFriend}
              disabled={friendRequestStatus === FetchStatus.Loading}
            >
              {"Add Friend"}
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
      friendRequests.incoming.allIds.includes(activeUser.idKey) &&
      friendRequests.outgoing.allIds.includes(activeUser.idKey)
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
            friendRequests.outgoing.allIds.includes(activeUser.idKey) &&
            friendRequests.incoming.allIds.includes(activeUser.idKey) && (
              <div>FRIENDS</div>
            )}
          {decryptStatus !== FetchStatus.Loading &&
            activeChannelId &&
            !activeUser &&
            !pins.byChannel[activeChannelId] && (
              <button
                type="button"
                className="flex items-center cursor-pointer text-[color:gold]"
                onClick={togglePinChannelModal}
                onKeyDown={(e) => e.key === 'Enter' && togglePinChannelModal()}
              >
                <AiFillPushpin className="mr-2" /> Pin this Channel
              </button>
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
              appIcon={getAppIcon(m)}
            />
          ))}

        {hasMessages && <ContainerBottom ref={containerBottomRef} />}

        <UserPopover
          open={showPopover}
          anchorEl={anchorEl}
          onClose={handleClickAway}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          user={user}
          setShowPopover={setShowPopover}
          self={
            head(user.AIP)?.bapId === session?.user?.bapId ||
            user.idKey === session?.user?.bapId
          }
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

// Helper function to get the appropriate app icon
const getAppIcon = (message) => {
  const app = head(message.MAP).app;
  
  switch (app) {
    case "bitchat":
      return (
        <div style={{ color: "lime", display: "flex", alignItems: "center" }}>
          <FaTerminal style={{ width: ".75rem", height: ".75rem" }} />
        </div>
      );
    case "blockpost.network":
      return (
        <div style={{ color: "white", display: "flex", alignItems: "center" }}>
          <BlockpostIcon style={{ width: "1rem" }} />
        </div>
      );
    case "bitchatnitro.com":
      return <NitroIcon style={{ width: ".75rem", height: ".75rem" }} />;
    case "retrofeed.me":
      return (
        <div style={{ color: "#F42B2C" }}>
          <RetrofeedIcon style={{ width: ".75rem", height: ".75rem", opacity: "0.5" }} />
        </div>
      );
    case "pewnicornsocial.club":
      return (
        <div style={{ color: "pink" }}>
          <GiUnicorn style={{ width: ".75rem", height: ".75rem", opacity: "0.5" }} />
        </div>
      );
    default:
      return (
        <div style={{ color: "white", display: "flex", alignItems: "center", opacity: ".25" }}>
          <MdChat style={{ width: ".75rem", height: ".75rem" }} />
        </div>
      );
  }
};

// Helper function to process encrypted messages
const processEncryptedMessage = (message, session, friendRequests, decIdentity) => {
  const messageFromMe = head(message.AIP)?.bapId === session.user?.bapId;
  const messageToMe = head(message.MAP)?.bapID === session.user?.bapId;
  const messageSelf = messageToMe && messageFromMe;

  const friendPrivateKey = friendPrivateKeyFromSeedString(
    messageSelf
      ? "notes"
      : messageToMe
      ? head(message.AIP)?.bapId
      : head(message.MAP)?.bapID,
    decIdentity.xprv
  );

  const friendPubKey = messageToMe
    ? head(friendRequests.incoming.byId[head(message.AIP).bapId]?.MAP)?.publicKey
    : head(friendRequests.incoming.byId[head(message.MAP).bapID]?.MAP)?.publicKey;

  if (!messageSelf && (!friendPrivateKey || !friendPubKey)) {
    console.error("failed to make key", friendPrivateKey, friendPubKey);
    return message;
  }

  try {
    const decryptedContent = decrypt(
      head(message.B)?.Data?.utf8,
      friendPrivateKey,
      messageSelf
        ? undefined
        : messageToMe
        ? new PublicKey(head(friendRequests.incoming.byId[head(message.AIP).bapId]?.MAP).publicKey)
        : new PublicKey(head(friendRequests.incoming.byId[head(message.MAP).bapID]?.MAP).publicKey)
    );

    return {
      ...message,
      B: [{ content: Buffer.from(decryptedContent).toString("utf8") }],
    };
  } catch (e) {
    console.error("failed to decrypt", head(message.MAP), head(message.AIP), friendPubKey, e);
    return message;
  }
};

export default Messages;
