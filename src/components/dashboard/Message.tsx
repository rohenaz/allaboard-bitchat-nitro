import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { head, tail } from 'lodash';
import type React from 'react';
import { useMemo, useState } from 'react';
import { MdAddReaction } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import OutsideClickHandler from 'react-outside-click-handler';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useBitcoin } from '../../context/bitcoin';
import type { RootState } from '../../store';
import { isValidEmail } from '../../utils/strings';
import Avatar from './Avatar';
import MessageFiles from './MessageFiles';

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

const ReactionButton = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  opacity: 0;

  ${Container}:hover & {
    opacity: 1;
  }

  &:hover {
    color: var(--text-normal);
  }
`;

const ReactionContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--background-modifier-accent);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

interface BmapTx {
  tx: {
    h: string;
  };
  MAP: Array<{
    app?: string;
    type?: string;
    paymail?: string;
    context?: string;
    channel?: string;
    messageID?: string;
    encrypted?: string;
    bapID?: string;
    emoji?: string;
    tx?: string;
  }>;
  B?: Array<{
    encoding: string;
    Data: {
      utf8: string;
    };
    'content-type'?: string;
    media_type?: string;
  }>;
  timestamp?: number;
  blk?: {
    t: number;
  };
}

interface MessageProps {
  message: BmapTx;
  reactions: {
    byTxTarget: Record<string, BmapTx[]>;
    byMessageTarget: Record<string, BmapTx[]>;
  };
}

const Message: React.FC<MessageProps> = ({ message, reactions }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { likeMessage } = useBitcoin();
  const session = useSelector((state: RootState) => state.session);
  const isVerified = isValidEmail(head(message.MAP)?.paymail || '');

  const handleEmojiClick = async (
    emojiData: EmojiClickData,
    messageId: string,
  ) => {
    if (!session.user?.paymail) return;
    await likeMessage(session.user.paymail, 'tx', messageId, emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const messageContent = head(message.B)?.Data?.utf8 || '';
  const sender = head(message.MAP)?.paymail || '';
  const messageReactions = reactions?.byTxTarget?.[message.tx.h] || [];

  // Group reactions by emoji
  const groupedReactions = messageReactions.reduce(
    (acc: { [key: string]: number }, reaction) => {
      const emoji = head(reaction.MAP)?.emoji;
      if (emoji) {
        acc[emoji] = (acc[emoji] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  /**
   * When a message contains text, the files are after the text.
   * When a message contains only files, the files are the message.
   */
  const messageFiles = useMemo(
    () => (messageContent ? tail(message.B) : message.B),
    [message, messageContent],
  );

  return (
    <Container>
      <AvatarWrapper>
        <Avatar icon="" paymail={sender} size="40px" />
      </AvatarWrapper>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Header>
          <Username>{sender}</Username>
          <Timestamp>
            {message.timestamp
              ? new Date(message.timestamp * 1000).toLocaleString()
              : message.blk?.t
                ? new Date(message.blk.t * 1000).toLocaleString()
                : ''}
          </Timestamp>
        </Header>
        <Content>
          <ReactMarkdown
            components={{
              p: ({ children }) => <span>{children}</span>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-[var(--text-link)] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {messageContent}
          </ReactMarkdown>
        </Content>
        {messageFiles && <MessageFiles files={messageFiles} />}
        <InfoContainer>
          <ReactionButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <MdAddReaction size={16} />
          </ReactionButton>
          {Object.entries(groupedReactions).map(([emoji, count], index) => (
            <ReactionContainer key={index}>
              <span>{emoji}</span>
              {count > 1 && <span style={{ marginLeft: '4px' }}>{count}</span>}
            </ReactionContainer>
          ))}
          {showEmojiPicker && (
            <OutsideClickHandler
              onOutsideClick={() => setShowEmojiPicker(false)}
            >
              <div
                style={{
                  position: 'absolute',
                  zIndex: 50,
                  marginTop: '0.5rem',
                }}
              >
                <EmojiPicker
                  onEmojiClick={(emojiData) =>
                    handleEmojiClick(emojiData, message.tx.h)
                  }
                  autoFocusSearch={false}
                  theme={Theme.DARK}
                />
              </div>
            </OutsideClickHandler>
          )}
        </InfoContainer>
      </div>
    </Container>
  );
};

export default Message;
