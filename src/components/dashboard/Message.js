import { IconButton } from "@mui/material";
import Autolinker from "autolinker";
import EmojiPicker from "emoji-picker-react";
import parse from "html-react-parser";
import { head, uniqBy } from "lodash";
import moment from "moment";
import React, { useCallback, useMemo, useState } from "react";
import { FaLock } from "react-icons/fa";
import { MdAddReaction } from "react-icons/md";
import OutsideClickHandler from "react-outside-click-handler";
import sanitize from "sanitize-html";
import styled from "styled-components";
import { useBitcoin } from "../../context/bitcoin";
import { useHandcash } from "../../context/handcash";
import { useRelay } from "../../context/relay";
import ArrowTooltip from "./ArrowTooltip";
import Avatar from "./Avatar";

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
  overflow-wrap: anywhere;

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

  a {
    color: var(--text-link);
    font-size: 13px;

    &:hover {
      text-decoration: underline;
    }
  }
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
  // const [openDeleteMessage, setOpenPopup] = useState(false);
  const { paymail } = useRelay();
  const { profile } = useHandcash();
  const { likeMessage, likeStatus } = useBitcoin();
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

    if (head(m.B)?.Data?.utf8?.length > 0) {
      let chunks = head(m.B)?.Data?.utf8?.split(" ");
      let idxs = [];
      chunks.forEach((c, i) => {
        if (c.startsWith("#")) {
          idxs.push(i);
        }
      });

      for (let idx of idxs) {
        let text = chunks[idx];
        chunks[
          idx
        ] = `<a href="https://bitchatnitro.com/channels/${text.replace(
          /[^a-zA-Z\-\d\s:]/g,
          ""
        )}">
          ${text}
          </a>`;
      }
      let l = Autolinker.link(chunks.join(" "));
      return l;
    }

    return head(m.B)?.Data?.utf8;
  }, [message]);

  // useEffect(() => console.log(messageContent), [messageContent]);

  const emojiClick = useCallback(
    async (e, txId) => {
      console.log("emoji clicked", e, txId);
      setShowReactions(false);
      await likeMessage(paymail || profile?.paymail, "tx", txId, e.emoji);
    },
    [paymail, profile, showReactions]
  );

  const emojis = useMemo(() => {
    let allReactions = [
      ...(reactions?.byMessageTarget[head(message.MAP).messageID] || []),
      ...(reactions?.byTxTarget[message.tx.h] || []),
    ];
    return uniqBy(allReactions, (r) => r.tx.h);
  }, [reactions, message]);

  const hasReacted = useCallback(
    (emoji, pm) => {
      return emojis.some(
        (e) => head(e.MAP).emoji === emoji && head(e.MAP).paymail === pm
      );
    },
    [reactions]
  );

  const parsedContent = useMemo(() => {
    return parse(sanitize(messageContent));
  }, [messageContent]);

  return (
    <Container>
      <AvatarWrapper onClick={handleClick}>
        <Avatar
          size="27px"
          w="40px"
          //bgColor={message.user.avatarColor}
          bgcolor={`#000`}
          paymail={
            head(message.AIP)?.identity?.paymail || head(message.MAP).paymail
          }
          icon={head(message.AIP)?.identity?.logo}
        />
      </AvatarWrapper>
      <div style={{ width: "100%" }}>
        <Header>
          <Username onClick={handleClick}>
            {head(message.AIP)?.identity?.alternateName ||
              head(message.MAP).paymail}
          </Username>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {head(message.AIP)?.verified && (
              <div
                onClick={() =>
                  window.open(
                    `https://whatsonchain.com/tx/${message.tx.h}`,
                    "_blank"
                  )
                }
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FaLock
                  style={{
                    width: ".6rem",
                    marginRight: ".5rem",
                    color: "#777",
                  }}
                />
                <div
                  style={{
                    fontSize: ".75rem",
                    color: "#777",
                    marginRight: ".5rem",
                  }}
                >
                  {head(message.AIP).bapId
                    ? head(message.AIP).bapId.slice(0, 8)
                    : ""}
                </div>
              </div>
            )}
            <Timestamp>
              {message.timestamp
                ? moment.unix(message.timestamp).fromNow()
                : moment.unix(message.blk.t).fromNow()}
              {/* {message.editedAt ? " (edited)" : ""} */}
            </Timestamp>
          </div>
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
        <Content>{parsedContent}</Content>
        <div
          style={{
            marginTop: ".5rem",
            display: "flex",
          }}
        >
          {uniqBy(emojis, (reaction) => head(reaction.MAP).emoji)?.map(
            (reaction) => (
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
                    head(reaction.MAP).emoji,
                    paymail || profile?.paymail
                  )
                    ? "default"
                    : "pointer",
                }}
                onClick={() => {
                  if (
                    !hasReacted(
                      head(reaction.MAP).emoji,
                      paymail || profile?.paymail
                    )
                  ) {
                    likeMessage(
                      paymail || profile?.paymail,
                      head(reaction.MAP).context,
                      head(reaction.MAP)[head(reaction.MAP).context],
                      head(reaction.MAP).emoji
                    );
                  }
                }}
              >
                {head(reaction.MAP).emoji}{" "}
                {
                  emojis.filter(
                    (e) => head(e.MAP).emoji === head(reaction.MAP).emoji
                  )?.length
                }{" "}
              </div>
            )
          )}
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
