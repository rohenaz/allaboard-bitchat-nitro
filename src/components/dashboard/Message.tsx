import EmojiPicker from 'emoji-picker-react';
import { head } from 'lodash';
import type React from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import RemarkableReactRenderer from 'remarkable-react';
import { useBitcoin } from '../../context/bitcoin';
import type {
  EmojiClickData,
  Message as MessageType,
  RootState,
} from '../../types';
import Avatar from './Avatar';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { likeMessage } = useBitcoin();
  const session = useSelector((state: RootState) => state.session);

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

  return (
    <div className="flex p-4 hover:bg-gray-50">
      <Avatar icon="" paymail={sender} size="40px" />
      <div className="ml-4 flex-1">
        <div className="flex items-center">
          <span className="font-semibold">{sender}</span>
          <span className="ml-2 text-sm text-gray-500">
            {new Date(message.timestamp * 1000).toLocaleString()}
          </span>
        </div>
        <div className="mt-1">
          <RemarkableReactRenderer source={messageContent} />
        </div>
        <div className="mt-2 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-500 hover:text-gray-700"
          >
            Add Reaction
          </button>
          {showEmojiPicker && (
            <div className="absolute mt-2">
              <EmojiPicker
                onEmojiClick={(emojiData) =>
                  handleEmojiClick(emojiData, message.tx.h)
                }
                autoFocusSearch={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
