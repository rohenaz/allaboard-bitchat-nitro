import { head, tail } from 'lodash';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MdAddReaction } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import { useBitcoin } from '../../context/bitcoin';
import type { BmapTx } from '../../reducers/chatReducer';
import type { RootState } from '../../store';
import { isValidEmail } from '../../utils/validation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { EmojiPicker } from '../ui/EmojiPicker';
import Avatar from './Avatar';
import MessageFiles from './MessageFiles';

interface MessageProps {
  message: BmapTx;
  reactions: {
    byTxTarget: Record<string, BmapTx[]>;
    byMessageTarget: Record<string, BmapTx[]>;
  };
}

const MessageCard: FC<MessageProps> = ({ message, reactions }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { likeMessage } = useBitcoin();
  const session = useSelector((state: RootState) => state.session);
  const _isVerified = isValidEmail(head(message.MAP)?.paymail || '');

  // Handle outside clicks for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiClick = async (emoji: string, messageId: string) => {
    if (!session.user?.paymail) return;
    await likeMessage(session.user.paymail, 'tx', messageId, emoji);
    setShowEmojiPicker(false);
  };

  const messageContent = useMemo(() => {
    const firstB = head(message.B);
    if (!firstB) return '';

    // Try to get content from any available source
    return firstB.content || '';
  }, [message]);

  const sender = head(message.MAP)?.paymail || '';
  const messageReactions = message.tx?.h
    ? reactions?.byTxTarget?.[message.tx.h] || []
    : [];

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
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="mx-4 my-2 p-4 border-0 bg-transparent hover:bg-muted/50 transition-colors">
        {/* Reaction toolbar - only visible on hover */}
        {isHovered && (
          <div className="absolute -top-2 right-5 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Add reaction"
            >
              <MdAddReaction className="h-4 w-4" />
            </Button>

            {/* Emoji picker positioned relative to button */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute top-full right-0 mt-2 z-50 rounded-lg overflow-hidden shadow-lg border border-border bg-popover"
              >
                <EmojiPicker
                  onEmojiSelect={(emoji) =>
                    message.tx?.h && handleEmojiClick(emoji, message.tx.h)
                  }
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 cursor-pointer">
            <Avatar icon="" paymail={sender} size="40px" />
          </div>

          {/* Message content */}
          <div className="flex-1 min-w-0">
            {/* Header with sender and timestamp */}
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 font-semibold text-sm hover:bg-accent"
                aria-label={`View ${sender}'s profile`}
              >
                {sender}
              </Button>
              <span className="text-xs text-muted-foreground">
                {message.timestamp
                  ? new Date(message.timestamp * 1000).toLocaleString()
                  : message.blk?.t
                    ? new Date(message.blk.t * 1000).toLocaleString()
                    : ''}
              </span>
            </div>

            {/* Message body */}
            <div className="text-sm text-foreground">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <span>{children}</span>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {messageContent}
              </ReactMarkdown>
            </div>

            {/* Message files */}
            {messageFiles && <MessageFiles files={messageFiles} />}

            {/* Reactions */}
            {Object.entries(groupedReactions).length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {Object.entries(groupedReactions).map(([emoji, count]) => (
                  <Badge
                    key={`${emoji}-${Object.keys(groupedReactions).indexOf(emoji)}`}
                    variant="secondary"
                    className="gap-1.5 px-2.5 py-1 rounded-full cursor-pointer hover:bg-secondary/80 transition-colors"
                  >
                    <span>{emoji}</span>
                    {count > 1 && <span className="text-xs">{count}</span>}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MessageCard;
