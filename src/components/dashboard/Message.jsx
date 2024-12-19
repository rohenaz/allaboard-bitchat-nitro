import React, { useCallback, useMemo, useState } from "react";
import { IconButton } from "@mui/material";
import EmojiPicker from "emoji-picker-react";
import { head, tail, uniqBy } from "lodash";
import moment from "moment";
import { FaCheckCircle, FaLock } from "react-icons/fa";
import { MdAddReaction } from "react-icons/md";
import OutsideClickHandler from "react-outside-click-handler";
import { Remarkable } from "remarkable";
import RemarkableReactRenderer from "remarkable-react";
import styled from "styled-components";
import { useBitcoin } from "../../context/bitcoin";
import { useHandcash } from "../../context/handcash";
import { isValidEmail } from "../../utils/strings";
import ArrowTooltip from "./ArrowTooltip";
import Avatar from "./Avatar";
import MessageFiles from "./MessageFiles";
import { useSelector } from "react-redux";

const md = new Remarkable({
  html: true,
  typographer: true,
  breaks: true,
  linkTarget: "_blank",
});
md.renderer = new RemarkableReactRenderer();

const MessageButtons = styled.div`
  background-color: var(--background-primary);
  border-radius: 4px;
  border: 1px solid var(--background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  display: none;
  transition: 0.1s ease-in-out;
  height: 32px;
  width: 64px;
  position: absolute;
  top: -16px;
  right: 16px;

  &:hover {
    box-shadow: 0 0 0 1px rgba(4, 4, 5, 0.15);
  }
`;

const Container = styled.div`
  display: flex;
  margin: 0.5rem 0;
  padding: 0.5rem 1rem 0.5rem 0;
  position: relative;
  overflow-wrap: anywhere;

  &:hover {
    background-color: var(--background-secondary);

    ${MessageButtons} {
      display: flex;
    }
  }
`;

const AvatarWrapper = styled.div`
  margin: 0 1rem;
  cursor: pointer;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 0.25rem;
`;

const Username = styled.a`
  color: var(--header-primary);
  font-size: 0.875rem;
  font-weight: 500;
  margin-right: 0.5rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const InfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Timestamp = styled.div`
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: default;
`;

const Content = styled.div`
  color: var(--text-normal);
  font-size: 0.875rem;

  a {
    color: var(--text-link);
    font-size: 0.75rem;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Message = ({ message, reactions, appIcon, handleClick }) => {
  //const user = useSelector((state) => state.session.user);
  // const [showTextArea, setShowTextArea] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  // const dispatch = useDispatch();
  // const [openDeleteMessage, setOpenPopup] = useState(false);
  const { profile } = useHandcash();
  const { likeMessage, likeStatus } = useBitcoin();
  const likes = useSelector(state => state.chat.likes.byTxId[message.tx.h]);
  const isVerified = isValidEmail(head(message.MAP).paymail || "");
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

    const data = head(m.B)?.Data?.utf8;
    // if (data?.length > 0) {
    //   return data;

    //   // let chunks = head(m.B)?.Data?.utf8?.split(" ");
    //   // let idxs = [];
    //   // chunks.forEach((c, i) => {
    //   //   if (c.startsWith("#")) {
    //   //     idxs.push(i);
    //   //   }
    //   // });

    //   // for (let idx of idxs) {
    //   //   let text = chunks[idx];
    //   //   chunks[
    //   //     idx
    //   //   ] = `[${text}](https://bitchatnitro.com/channels/${text.replace(
    //   //     /[^a-zA-Z\-\d\s:]/g,
    //   //     ""
    //   //   )})`;
    //   // }
    //   // // let l = Autolinker.link(chunks.join(" "));
    //   // // return DOMPurify.sanitize(marked(chunks.join(" ")));
    //   // try {
    //   //   const m = md.render(chunks.join(" "));
    //   //   return m;
    //   // } catch (e) {
    //   //   console.error(e);
    //   // }
    // }

    /**
     * If there is no text message, we don't want to render it.
     * This can happen when a message contains only file(s).
     */
    const contentType =
      head(m.B)?.["content-type"] ?? head(m.B)?.["media_type"];
    if (contentType !== "text/plain") {
      return null;
    }

    return data;
  }, [message]);

  /**
   * When a message contains text, the files are after the text.
   * When a message contains only files, the files are the message.
   */
  const messageFiles = useMemo(
    () => (messageContent ? tail(message.B) : message.B),
    [message, messageContent]
  );

  // useEffect(() => console.log(messageContent), [messageContent]);

  const emojiClick = useCallback(
    async (e, txId) => {
      console.log("emoji clicked", e, txId);
      setShowReactions(false);
      await likeMessage(profile?.paymail, "tx", txId, e.emoji);
    },
    [profile, showReactions]
  );

  const emojis = useMemo(() => {
    // Combine legacy reactions with new likes
    const allReactions = [
      ...(reactions?.byMessageTarget[head(message.MAP).messageID] || []),
      ...(reactions?.byTxTarget[message.tx.h] || []),
    ];
    
    // Add new likes format if available
    if (likes) {
      const likesAsReactions = likes.likes.map(like => ({
        MAP: [{
          emoji: "❤️", // Default emoji for likes
          paymail: like, // Like contains the paymail
          type: "like" // Mark as a new-style like
        }]
      }));
      return uniqBy([...allReactions, ...likesAsReactions], 
        (r) => `${head(r.MAP).paymail}-${head(r.MAP).emoji}`
      );
    }
    
    return uniqBy(allReactions, 
      (r) => `${head(r.MAP).paymail}-${head(r.MAP).emoji}`
    );
  }, [reactions, message, likes]);

  const hasReacted = useCallback((emoji, paymail) => {
    return emojis.some(
      (e) => head(e.MAP).emoji === emoji && head(e.MAP).paymail === paymail
    );
  }, [emojis]);

  const parsedContent = useMemo(() => {
    if (!messageContent) {
      return null;
    }

    return md.render(messageContent);
    // return parse(sanitize(messageContent));
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
        <Header className="justify-between w-full !items-start">
          <div className="flex flex-col md:flex-row justify-start">
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
            </div>

            <InfoContainer>
              {isVerified && <FaCheckCircle color="green" />}

              <a
                href={`https://whatsonchain.com/tx/${message.tx.h}`}
                target="_blank"
              >
                <Timestamp>
                  {message.timestamp
                    ? moment.unix(message.timestamp).fromNow()
                    : moment.unix(message.blk.t).fromNow()}
                  {/* {message.editedAt ? " (edited)" : ""} */}
                </Timestamp>
              </a>
            </InfoContainer>
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
        {parsedContent && <Content>{parsedContent}</Content>}

        <MessageFiles files={messageFiles} />

        <div
          style={{
            marginTop: ".5rem",
            display: "flex",
          }}
        >
          {uniqBy(emojis, (reaction) => head(reaction.MAP).emoji)?.map(
            (reaction) => (
              <div
                key={`${head(reaction.MAP).paymail}-${head(reaction.MAP).emoji}`}
                className="rounded-md text-white text-sm border border-[#333] p-1 mr-1 cursor-pointer"
                onClick={() => {
                  if (!hasReacted(head(reaction.MAP).emoji, profile?.paymail)) {
                    likeMessage(
                      profile?.paymail,
                      head(reaction.MAP).context || "tx",
                      head(reaction.MAP).context ? head(reaction.MAP)[head(reaction.MAP).context] : message.tx.h,
                      head(reaction.MAP).emoji
                    );
                  }
                }}
              >
                {head(reaction.MAP).emoji}{" "}
                {emojis.filter(
                  (e) => head(e.MAP).emoji === head(reaction.MAP).emoji
                )?.length}{" "}
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
