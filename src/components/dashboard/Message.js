import { IconButton } from "@mui/material";
import nimble from "@runonbitcoin/nimble";
import Autolinker from "autolinker";
import bops from "bops";
import EmojiPicker from "emoji-picker-react";
import parse from "html-react-parser";
import { uniqBy } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { MdAddReaction } from "react-icons/md";
import OutsideClickHandler from "react-outside-click-handler";
import styled from "styled-components";
import { format } from "timeago.js";
import { useHandcash } from "../../context/handcash";
import { useRelay } from "../../context/relay";
import { useActiveChannel } from "../../hooks";
import ArrowTooltip from "./ArrowTooltip";
import Avatar from "./Avatar";
import { MAP_PREFIX } from "./WriteArea";

const MessageButtons = styled.div`
  background-color: var(--background-primary);
  border-radius: 4px;
  border: 1px solid var(--background-secondary);
  transition: 0.1s ease-in-out;
  height: 32px;
  width: 64px;
  position: absolute;
  top: -16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  display: none;

  &:hover {
    box-shadow: 0 0 0 1px rgba(4, 4, 5, 0.15);
  }
`;

const Container = styled.div`
  display: flex;
  margin: 8px 0;
  padding: 8px 16px 12px 0;
  position: relative;

  &:hover {
    background-color: #32353a;

    ${MessageButtons} {
      display: flex;
    }
  }
`;

const AvatarWrapper = styled.div`
  margin: 0 16px;

  &:hover {
    cursor: pointer;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 4px;
`;

const Username = styled.a`
  color: var(--header-primary);
  font-size: 14px;
  font-weight: 500;
  margin-right: 8px;

  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;

const Timestamp = styled.div`
  color: var(--text-muted);
  font-size: 12px;
  cursor: default;
`;

const Content = styled.div`
  color: var(--text-normal);
  font-size: 14px;
`;

// const autolinker = new Autolinker();

// const IconWrapper = styled.button`
//   ${baseIcon};
//   ${interactiveColor};
//   background-color: transparent;

//   &:hover {
//     background-color: var(--background-modifier-hover);
//   }
// `;

// const Operation = styled.span`
//   font-size: 12px;
//   color: var(--text-normal);

//   button {
//     background: transparent;
//     color: var(--text-link);
//     border: none;
//     font-size: 12px;

//     &:hover {
//       text-decoration: underline;
//     }
//   }
// `;

// const PopupContainer = styled.div`
//   background-color: var(--background-primary);
//   color: var(--text-normal);
//   top: 50%;
//   left: 50%;
//   position: absolute;
//   transform: translateX(-50%) translateY(-50%);
//   width: 440px;
//   border-radius: 4px;
//   font-size: 15px;
// `;

// const PopupMessageContainer = styled.div`
//   padding: 16px;

//   h2 {
//     padding-bottom: 16px;
//   }
// `;

// const PopupButtonContainer = styled.div`
//   background-color: var(--background-secondary);
//   border-radius: 4px;
//   text-align: right;
//   padding: 12px 16px;
// `;

// const CancelButton = styled.button`
//   color: white;
//   padding: 10px 24px;
//   margin: 0 8px;
//   background: transparent;
//   border: none;

//   &:hover {
//     text-decoration: underline;
//   }
// `;

// const DeleteButton = styled.button`
//   color: white;
//   padding: 10px 24px;
//   border-radius: 4px;
//   border: none;
//   background-color: #f04444;

//   &:hover {
//     background-color: #c83434;
//   }
// `;

// const IconButton = ({ children, ...delegated }) => {
//   return (
//     <IconWrapper as="button" type="button" size="20px" w="32px" {...delegated}>
//       {children}
//     </IconWrapper>
//   );
// };

const Message = ({ message, reactions, appIcon, handleClick }) => {
  //const user = useSelector((state) => state.session.user);
  // const [showTextArea, setShowTextArea] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  // const dispatch = useDispatch();
  const activeChannel = useActiveChannel();
  // const [openDeleteMessage, setOpenPopup] = useState(false);

  const { paymail, relayOne } = useRelay();
  const { profile, authToken } = useHandcash();
  // const handleSubmit = (event) => {
  //   event.preventDefault();
  //   const content = event.target.value;
  //   console.log(content);
  //   dispatch(
  //     editMessage({
  //       id: message.tx.h,
  //       channelId: activeChannel.id,
  //       content,
  //       paymail,
  //     })
  //   );
  // };

  // const handleDeleteButtonClick = () => {
  //   dispatch(deleteMessage({ id: message.tx.h, channelId: activeChannel.id }));
  // };

  // useEffect(() => {
  //   if (!showTextArea) {
  //     return;
  //   }

  //   const onKeyDown = (event) => {
  //     const enterKey = 13;
  //     const escapeKey = 27;
  //     if (event.keyCode === enterKey) {
  //       handleSubmit(event);
  //       setShowTextArea(false);
  //     } else if (event.keyCode === escapeKey) {
  //       event.preventDefault();
  //       setShowTextArea(false);
  //     }
  //   };

  //   document.addEventListener("keydown", onKeyDown);
  //   return () => document.removeEventListener("keydown", onKeyDown);
  // });

  // const handleOpenPopup = () => setOpenPopup(true);
  // const handleClosePopup = () => setOpenPopup(false);

  const toggleReactions = useCallback(() => {
    setShowReactions(!showReactions);
  }, [showReactions]);

  const messageContent = useMemo(() => {
    let m = { ...message };
    // Object.defineProperties(m, {
    //   B: {
    //     content: {
    //       writable: true,
    //     },
    //   },
    // });

    if (m.B?.content?.length > 0) {
      let m = { ...message };

      let chunks = m.B.content.split(" ");
      let idx;
      chunks.forEach((c, i) => {
        if (c.startsWith("#")) {
          idx = i;
        }
      });

      if (idx >= 0) {
        let text = chunks[idx];
        chunks[
          idx
        ] = `<a href="https://bitchatnitro.com/channels/${text.replace(
          "#",
          ""
        )}">
            ${text}
          </a>`;
      }
      let l = Autolinker.link(chunks.join(" "));
      return l;
    }
    return m.B?.content;
  }, [message]);

  // useEffect(() => console.log(messageContent), [messageContent]);

  const emojiClick = useCallback(
    async (e, txId) => {
      console.log("emoji clicked", e, txId);
      setShowReactions(false);
      await likeMessage(paymail || profile?.paymail, txId, e.emoji);
    },
    [paymail, profile, showReactions]
  );

  const likeMessage = useCallback(
    async (pm, txId, emoji) => {
      try {
        let dataPayload = [
          MAP_PREFIX, // MAP Prefix
          "SET",
          "app",
          "bitchatnitro.com",
          "type",
          "like",
          "context",
          "tx",
          "tx",
          txId,
          "paymail",
          pm,
        ];

        // add channel
        if (emoji) {
          dataPayload.push("emoji", emoji);
        }

        // check for handcash token
        if (authToken) {
          let hexArray = dataPayload.map((str) =>
            bops.to(bops.from(str, "utf8"), "hex")
          );
          // .join(" ")

          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({ hexArray, authToken, activeChannel }),
          });

          console.log({ resp });
          return;
          // https://bitchatnitro.com/hcsend/
          // { hexArray, authToken}
        }
        const script = nimble.Script.fromASM(
          "OP_0 OP_RETURN " +
            dataPayload
              .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
              .join(" ")
        );
        let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

        let resp = await relayOne().send({ outputs });

        console.log("Sent", resp);
        // let txid = resp.txid;
      } catch (e) {
        console.error(e);
      }
    },
    [authToken]
  );

  const emojis = useMemo(
    () => uniqBy(reactions?.byTarget[message.tx.h], (r) => r.tx.h),
    [reactions, message]
  );

  const hasReacted = useCallback(
    (emoji, pm) => {
      return emojis.some((e) => e.MAP.emoji === emoji && e.MAP.paymail === pm);
    },
    [reactions]
  );

  return (
    <Container>
      <AvatarWrapper onClick={handleClick}>
        <Avatar
          size="27px"
          w="40px"
          //bgColor={message.user.avatarColor}
          bgcolor={`#000`}
          paymail={message.MAP.paymail}
        />
      </AvatarWrapper>
      <div style={{ width: "100%" }}>
        <Header>
          <Username onClick={handleClick}>{message.MAP.paymail}</Username>
          <Timestamp>
            {message.timestamp
              ? format(new Date(message.timestamp * 1000))
              : format(new Date(message.blk.t * 1000))}
            {/* {message.editedAt ? " (edited)" : ""} */}
          </Timestamp>
        </Header>
        {/* {showTextArea ? (
          <>
            <form onSubmit={handleSubmit}>
              <ChannelTextArea
                type="text"
                name="content"
                defaultValue={message.B.content}
              />
              <Operation>
                escape to{" "}
                <button onClick={() => setShowTextArea(false)}>cancel</button> •
                enter to <button>save</button>
              </Operation>
              <InvisibleSubmitButton />
            </form>
          </>
        ) : ( */}
        <Content>{parse(messageContent)}</Content>
        <div
          style={{
            marginTop: ".5rem",
            display: "flex",
          }}
        >
          {uniqBy(emojis, (reaction) => reaction.MAP.emoji)?.map((reaction) => (
            <div
              key={reaction.tx.h}
              style={{
                borderRadius: ".3rem",
                color: "white",
                fontSize: "14px",
                border: "1px solid #333",
                padding: ".25rem",
                width: "fit-content",
                marginRight: ".25rem",
                cursor: hasReacted(
                  reaction.MAP.emoji,
                  paymail || profile?.paymail
                )
                  ? "default"
                  : "pointer",
              }}
              onClick={() => {
                if (
                  !hasReacted(reaction.MAP.emoji, paymail || profile?.paymail)
                ) {
                  likeMessage(
                    paymail || profile?.paymail,
                    reaction.MAP.tx,
                    reaction.MAP.emoji
                  );
                }
              }}
            >
              {reaction.MAP.emoji}{" "}
              {emojis.filter((e) => e.MAP.emoji === reaction.MAP.emoji)?.length}{" "}
            </div>
          ))}
          <div
            style={{ position: "absolute", bottom: "1rem", right: "1.2rem" }}
          >
            {appIcon}
          </div>
        </div>
        {/* )} */}
      </div>

      {/* {(paymail === message.MAP.paymail ||
        profile?.paymail === message.MAP.paymail) && ( */}
      <>
        <MessageButtons>
          {!showReactions && (
            <ArrowTooltip title="Add Reaction" placement="top">
              <IconButton
                style={{
                  color: "rgba(255,255,255,.5)",
                }}
                onClick={toggleReactions}
              >
                <MdAddReaction />
              </IconButton>
            </ArrowTooltip>
          )}
          {/* <ArrowTooltip title="Delete" placement="top">
              <IconButton onClick={handleOpenPopup}>
                <RiDeleteBin5Fill />
              </IconButton>
            </ArrowTooltip> */}
        </MessageButtons>

        {showReactions && (
          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              marginBottom: ".25rem",
              marginRight: ".5rem",
            }}
          >
            <OutsideClickHandler
              onOutsideClick={() => {
                setShowReactions(false);
              }}
            >
              <EmojiPicker
                theme={"dark"}
                onEmojiClick={(e) => emojiClick(e, message.tx.h)}
              />
            </OutsideClickHandler>
          </div>
        )}

        {/* <Modal open={openDeleteMessage} onClose={handleClosePopup}>
            <PopupContainer className="disable-select">
              <PopupMessageContainer>
                <h2>Delete Message</h2>
                Are you sure you want to delete this message?
              </PopupMessageContainer>
              <PopupButtonContainer>
                <CancelButton onClick={handleClosePopup}>Cancel</CancelButton>
                <DeleteButton onClick={handleDeleteButtonClick}>
                  Delete
                </DeleteButton>
              </PopupButtonContainer>
            </PopupContainer>
          </Modal> */}
      </>
      {/* )} */}
    </Container>
  );
};

export default Message;
