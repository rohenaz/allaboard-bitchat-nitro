import { head, tail } from 'lodash';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MdAddReaction } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useBitcoin } from '../../context/bitcoin';
import type { BmapTx } from '../../reducers/chatReducer';
import type { RootState } from '../../store';
import { isValidEmail } from '../../utils/validation';
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

const MessageContainer = styled.div`
  position: relative;
  display: flex;
  margin: 8px 16px;
  padding: 12px 16px;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  
  &:hover {
    background: var(--background-glass);
    backdrop-filter: blur(var(--blur-light));
    -webkit-backdrop-filter: blur(var(--blur-light));
    border: 1px solid var(--border-subtle);
    transform: translateY(-1px);
    box-shadow: var(--elevation-medium);
  }
`;

const ReactionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }

  &:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
`;

const ReactionToolbar = styled.div`
  position: absolute;
  top: -20px;
  right: 20px;
  display: none;
  height: 40px;
  width: 72px;
  background: var(--background-glass);
  backdrop-filter: blur(var(--blur-medium));
  -webkit-backdrop-filter: blur(var(--blur-medium));
  border-radius: 12px;
  border: 1px solid var(--border-glass);
  box-shadow: var(--elevation-glass);
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;

  ${MessageContainer}:hover & {
    display: flex;
    animation: fadeIn 0.2s ease-out;
  }

  &:hover {
    background: var(--background-glass-light);
    box-shadow: var(--elevation-high), var(--glow-brand);
    transform: scale(1.05);
  }
`;

const AvatarContainer = styled.div`
  margin: 0 16px;
  cursor: pointer;
`;

const MessageContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 4px;
`;

const SenderButton = styled.button`
  background: none;
  border: none;
  color: var(--foreground);
  font-weight: 600;
  font-size: 14px;
  margin-right: 8px;
  cursor: pointer;
  border-radius: 6px;
  padding: 2px 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--background-glass-light);
    color: var(--brand-experiment-lighter);
    transform: translateY(-1px);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--brand-experiment-glow);
    outline: none;
  }
`;

const Timestamp = styled.div`
  color: var(--muted-foreground);
  font-size: 12px;
  cursor: default;
`;

const MessageBody = styled.div`
  color: var(--foreground);
  font-size: 14px;

  a {
    color: var(--primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ReactionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const ReactionPill = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--background-glass);
  backdrop-filter: blur(var(--blur-light));
  -webkit-backdrop-filter: blur(var(--blur-light));
  border: 1px solid var(--border-subtle);
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--background-glass-light);
    border-color: var(--border-glass);
    transform: translateY(-1px) scale(1.05);
    box-shadow: var(--elevation-medium);
  }
`;

const EmojiPickerContainer = styled.div`
  position: absolute;
  z-index: 1000;
  margin-top: 8px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--background-glass);
  backdrop-filter: blur(var(--blur-heavy));
  -webkit-backdrop-filter: blur(var(--blur-heavy));
  border: 1px solid var(--border-glass);
  box-shadow: var(--elevation-high);
  animation: fadeIn 0.2s ease-out;
  pointer-events: auto;
`;

const Message: FC<MessageProps> = ({ message, reactions }) => {
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const emojiPickerRef = useRef<HTMLDivElement>(null);
	const { likeMessage } = useBitcoin();
	const session = useSelector((state: RootState) => state.session);
	const _isVerified = isValidEmail(head(message.MAP)?.paymail || '');

	// Handle outside clicks for emoji picker
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
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
	const messageReactions = message.tx?.h ? reactions?.byTxTarget?.[message.tx.h] || [] : [];

	// Group reactions by emoji
	const groupedReactions = messageReactions.reduce((acc: { [key: string]: number }, reaction) => {
		const emoji = head(reaction.MAP)?.emoji;
		if (emoji) {
			acc[emoji] = (acc[emoji] || 0) + 1;
		}
		return acc;
	}, {});

	/**
	 * When a message contains text, the files are after the text.
	 * When a message contains only files, the files are the message.
	 */
	const messageFiles = useMemo(
		() => (messageContent ? tail(message.B) : message.B),
		[message, messageContent],
	);

	return (
		<MessageContainer>
			<ReactionToolbar>
				<ReactionButton
					type="button"
					onClick={() => setShowEmojiPicker(!showEmojiPicker)}
					aria-label="Add reaction"
				>
					<MdAddReaction size={16} />
				</ReactionButton>
			</ReactionToolbar>

			<AvatarContainer>
				<Avatar icon="" paymail={sender} size="40px" />
			</AvatarContainer>

			<MessageContent>
				<MessageHeader>
					<SenderButton type="button" aria-label={`View ${sender}'s profile`}>
						{sender}
					</SenderButton>
					<Timestamp>
						{message.timestamp
							? new Date(message.timestamp * 1000).toLocaleString()
							: message.blk?.t
								? new Date(message.blk.t * 1000).toLocaleString()
								: ''}
					</Timestamp>
				</MessageHeader>

				<MessageBody>
					<ReactMarkdown
						components={{
							p: ({ children }) => <span>{children}</span>,
							a: ({ href, children }) => (
								<a href={href} target="_blank" rel="noopener noreferrer">
									{children}
								</a>
							),
						}}
					>
						{messageContent}
					</ReactMarkdown>
				</MessageBody>

				{messageFiles && <MessageFiles files={messageFiles} />}

				<ReactionsContainer>
					{Object.entries(groupedReactions).map(([emoji, count]) => (
						<ReactionPill key={`${emoji}-${Object.keys(groupedReactions).indexOf(emoji)}`}>
							<span>{emoji}</span>
							{count > 1 && <span>{count}</span>}
						</ReactionPill>
					))}

					{showEmojiPicker && (
						<EmojiPickerContainer ref={emojiPickerRef}>
							<EmojiPicker
								onEmojiSelect={(emoji) => message.tx?.h && handleEmojiClick(emoji, message.tx.h)}
							/>
						</EmojiPickerContainer>
					)}
				</ReactionsContainer>
			</MessageContent>
		</MessageContainer>
	);
};

export default Message;
