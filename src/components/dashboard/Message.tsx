import { IconButton } from '@mui/material';
import EmojiPicker from 'emoji-picker-react';
import { head, tail, uniqBy } from 'lodash';
import moment from 'moment';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { FaCheckCircle, FaLock } from 'react-icons/fa';
import { MdAddReaction } from 'react-icons/md';
import OutsideClickHandler from 'react-outside-click-handler';
import { useSelector } from 'react-redux';
import { Remarkable } from 'remarkable';
import RemarkableReactRenderer from 'remarkable-react';
import styled from 'styled-components';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { isValidEmail } from '../../utils/strings';
import ArrowTooltip from './ArrowTooltip';
import Avatar from './Avatar';
import MessageFiles from './MessageFiles';

interface MessageData {
  tx: {
    h: string;
  };
  MAP: Array<{
    paymail?: string;
    messageID?: string;
    type?: string;
  }>;
  AIP?: Array<{
    identity?: {
      paymail?: string;
      logo?: string;
      alternateName?: string;
    };
    verified?: boolean;
    bapId?: string;
  }>;
  B: Array<{
    Data?: {
      utf8?: string;
    };
    'content-type'?: string;
    media_type?: string;
  }>;
  timestamp?: number;
  blk: {
    t: number;
  };
  _id?: string;
}

interface MapProperties {
  emoji?: string;
  paymail?: string;
  type?: string;
  context?: string;
  messageID?: string;
  [key: string]: string | undefined;
}

interface Reaction {
  MAP: MapProperties[];
}

interface MessageProps {
  message: MessageData;
  reactions?: {
    byMessageTarget: Record<string, Reaction[]>;
    byTxTarget: Record<string, Reaction[]>;
  };
  appIcon?: React.ReactNode;
  handleClick?: (event: React.MouseEvent) => void;
}

interface RootState {
  chat: {
    likes: {
      byTxId: Record<string, { likes: string[] }>;
    };
  };
}

const md = new Remarkable({
  html: true,
  typographer: true,
  breaks: true,
  linkTarget: '_blank',
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

interface EmojiClickData {
  emoji: string;
  names: string[];
  unified: string;
  originalUnified: string;
  activeSkinTone: string;
}

const Message: React.FC<MessageProps> = ({
  message,
  reactions,
  appIcon,
  handleClick,
}) => {
  const { profile } = useHandcash();
  const { likeMessage } = useBitcoin();
  const likes = useSelector(
    (state: RootState) => state.chat.likes.byTxId[message.tx.h],
  );
  const [showReactions, setShowReactions] = useState(false);
  const isVerified = isValidEmail(head(message.MAP)?.paymail || '');

  const toggleReactions = useCallback(() => {
    setShowReactions(!showReactions);
  }, [showReactions]);

  const messageContent = useMemo(() => {
    const data = head(message.B)?.Data?.utf8;
    const contentType =
      head(message.B)?.['content-type'] ?? head(message.B)?.media_type;
    if (contentType !== 'text/plain') {
      return null;
    }
    return data;
  }, [message]);

  const messageFiles = useMemo(
    () => (messageContent ? tail(message.B) : message.B),
    [message, messageContent],
  );

  const emojiClick = useCallback(
    async (emojiData: EmojiClickData, txId: string) => {
      setShowReactions(false);
      await likeMessage(profile?.paymail, 'tx', txId, emojiData.emoji);
    },
    [profile, likeMessage],
  );

  const emojis = useMemo(() => {
    const allReactions = [
      ...(reactions?.byMessageTarget[head(message.MAP)?.messageID || ''] || []),
      ...(reactions?.byTxTarget[message.tx.h] || []),
    ];

    if (likes) {
      const likesAsReactions = likes.likes.map((like) => ({
        MAP: [
          {
            emoji: '❤️',
            paymail: like,
            type: 'like',
          },
        ],
      }));
      return uniqBy(
        [...allReactions, ...likesAsReactions],
        (r) => `${head(r.MAP)?.paymail}-${head(r.MAP)?.emoji}`,
      );
    }

    return uniqBy(
      allReactions,
      (r) => `${head(r.MAP)?.paymail}-${head(r.MAP)?.emoji}`,
    );
  }, [reactions, message, likes]);

  const hasReacted = useCallback(
    (emoji: string, paymail: string) => {
      return emojis.some(
        (e) => head(e.MAP).emoji === emoji && head(e.MAP).paymail === paymail,
      );
    },
    [emojis],
  );

  const parsedContent = useMemo(() => {
    if (!messageContent) {
      return null;
    }
    return md.render(messageContent);
  }, [messageContent]);

  return (
    <Container>
      <AvatarWrapper onClick={handleClick}>
        <Avatar
          size="27px"
          w="40px"
          bgcolor={'#000'}
          paymail={
            head(message.AIP)?.identity?.paymail || head(message.MAP)?.paymail
          }
          icon={head(message.AIP)?.identity?.logo}
        />
      </AvatarWrapper>
      <div style={{ width: '100%' }}>
        <Header className="justify-between w-full !items-start">
          <div className="flex flex-col md:flex-row justify-start">
            <Username onClick={handleClick}>
              {head(message.AIP)?.identity?.alternateName ||
                head(message.MAP)?.paymail}
            </Username>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {head(message.AIP)?.verified && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://whatsonchain.com/tx/${message.tx.h}`,
                      '_blank',
                    )
                  }
                  className="flex items-center cursor-pointer bg-transparent border-0"
                >
                  <FaLock
                    style={{
                      width: '.6rem',
                      marginRight: '.5rem',
                      color: '#777',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '.75rem',
                      color: '#777',
                      marginRight: '.5rem',
                    }}
                  >
                    {head(message.AIP)?.bapId
                      ? head(message.AIP)?.bapId?.slice(0, 8)
                      : ''}
                  </div>
                </button>
              )}
            </div>

            <InfoContainer>
              {isVerified && <FaCheckCircle color="green" />}

              <a
                href={`https://whatsonchain.com/tx/${message.tx.h}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Timestamp>
                  {message.timestamp
                    ? moment.unix(message.timestamp).fromNow()
                    : moment.unix(message.blk.t).fromNow()}
                </Timestamp>
              </a>
            </InfoContainer>
          </div>
        </Header>
        {parsedContent && <Content>{parsedContent}</Content>}

        <MessageFiles files={messageFiles} />

        <div
          style={{
            marginTop: '.5rem',
            display: 'flex',
          }}
        >
          {uniqBy(emojis, (reaction) => head(reaction.MAP)?.emoji)?.map(
            (reaction) => (
              <button
                key={`${head(reaction.MAP)?.paymail}-${head(reaction.MAP)?.emoji}`}
                type="button"
                className="rounded-md text-white text-sm border border-[#333] p-1 mr-1 cursor-pointer bg-transparent"
                onClick={() => {
                  if (
                    !hasReacted(head(reaction.MAP)?.emoji, profile?.paymail)
                  ) {
                    likeMessage(
                      profile?.paymail,
                      head(reaction.MAP)?.context || 'tx',
                      head(reaction.MAP)?.context
                        ? head(reaction.MAP)[head(reaction.MAP).context]
                        : message.tx.h,
                      head(reaction.MAP).emoji,
                    );
                  }
                }}
              >
                {head(reaction.MAP)?.emoji}{' '}
                {
                  emojis.filter(
                    (e) => head(e.MAP)?.emoji === head(reaction.MAP)?.emoji,
                  )?.length
                }{' '}
              </button>
            ),
          )}
          <div
            style={{ position: 'absolute', bottom: '1rem', right: '1.2rem' }}
          >
            {appIcon}
          </div>
        </div>
      </div>

      <>
        <MessageButtons>
          {!showReactions && (
            <ArrowTooltip title="Add Reaction" placement="top">
              <IconButton
                style={{
                  color: 'rgba(255,255,255,.5)',
                }}
                onClick={toggleReactions}
              >
                <MdAddReaction />
              </IconButton>
            </ArrowTooltip>
          )}
        </MessageButtons>

        {showReactions && (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              marginBottom: '.25rem',
              marginRight: '.5rem',
            }}
          >
            <OutsideClickHandler
              onOutsideClick={() => {
                setShowReactions(false);
              }}
            >
              <EmojiPicker
                theme={'dark'}
                onEmojiClick={(e) => emojiClick(e, message.tx.h)}
              />
            </OutsideClickHandler>
          </div>
        )}
      </>
    </Container>
  );
};

export default Message;
