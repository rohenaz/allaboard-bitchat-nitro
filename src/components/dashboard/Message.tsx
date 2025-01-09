import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { head, tail } from 'lodash';
import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { MdAddReaction } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import OutsideClickHandler from 'react-outside-click-handler';
import { useSelector } from 'react-redux';
import { useBitcoin } from '../../context/bitcoin';
import type { RootState } from '../../store';
import { isValidEmail } from '../../utils/strings';
import Avatar from './Avatar';
import MessageFiles from './MessageFiles';

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
    Data?: {
      utf8: string;
    };
    content?: string;
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

const Message: FC<MessageProps> = ({ message, reactions }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { likeMessage } = useBitcoin();
  const session = useSelector((state: RootState) => state.session);
  const _isVerified = isValidEmail(head(message.MAP)?.paymail || '');

  const handleEmojiClick = async (
    emojiData: EmojiClickData,
    messageId: string,
  ) => {
    if (!session.user?.paymail) return;
    await likeMessage(session.user.paymail, 'tx', messageId, emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const messageContent = useMemo(() => {
    const firstB = head(message.B);
    if (!firstB) return '';
    
    // Try to get content from any available source
    return (
      firstB.content || // Direct content field
      firstB.Data?.utf8 || // Data.utf8 field
      '' // Fallback empty string
    );
  }, [message]);

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
    <div className="relative flex my-2 py-2 pl-0 pr-4 group hover:bg-base-200">
      <div className="absolute top-[-16px] right-4 hidden h-8 w-16 bg-base-100 rounded-sm border border-base-200 transition-all duration-100 group-hover:flex items-center justify-center hover:shadow-xs">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="btn btn-ghost btn-xs"
        >
          <MdAddReaction size={16} />
        </button>
      </div>

      <div className="mx-4 cursor-pointer">
        <Avatar icon="" paymail={sender} size="40px" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center pb-1">
          <button 
            className="text-base-content font-medium text-sm mr-2 hover:underline cursor-pointer"
          >
            {sender}
          </button>
          <div className="text-base-content/60 text-xs cursor-default">
            {message.timestamp
              ? new Date(message.timestamp * 1000).toLocaleString()
              : message.blk?.t
                ? new Date(message.blk.t * 1000).toLocaleString()
                : ''}
          </div>
        </div>

        <div className="text-base-content text-sm">
          <ReactMarkdown
            components={{
              p: ({ children }) => <span>{children}</span>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary hover:underline"
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
        </div>

        {messageFiles && <MessageFiles files={messageFiles} />}

        <div className="flex items-center gap-2 mt-1">
          {Object.entries(groupedReactions).map(([emoji, count], index) => (
            <div
              key={`${emoji}-${index}`}
              className="flex items-center gap-1 bg-base-300/50 px-2 py-1 rounded-sm text-sm"
            >
              <span>{emoji}</span>
              {count > 1 && <span className="ml-1">{count}</span>}
            </div>
          ))}

          {showEmojiPicker && (
            <OutsideClickHandler
              onOutsideClick={() => setShowEmojiPicker(false)}
            >
              <div className="absolute z-50 mt-2">
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
        </div>
      </div>
    </div>
  );
};

export default Message;
