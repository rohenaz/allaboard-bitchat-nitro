/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { last } from 'lodash';
import moment from 'moment';
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode, RefObject } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { HiPlusCircle } from 'react-icons/hi';
import { IoMdClose } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useBap } from '../../context/bap';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useActiveUser } from '../../hooks';
import { receiveNewMessage } from '../../reducers/chatReducer';
import type { AppDispatch, RootState } from '../../store';
import { FetchStatus } from '../../utils/common';

type Profile = {
  paymail?: string;
  displayName?: string;
  avatar?: string;
};

interface PendingFile {
  name: string;
  size: number;
  type: string;
  data: string;
}

interface SendButtonProps {
  $hasContent: boolean;
  $hasFiles: boolean;
}

interface DecIdentity {
  xprv: string;
  bapId?: string;
  ids?: { idKey: string }[];
  commsPublicKey?: string;
}

interface ActiveUser {
  _id: string;
  idKey: string;
  paymail: string;
}

interface TypingUser {
  paymail: string;
}

interface BmapTx {
  B: Array<{
    encoding: string;
    Data: {
      utf8: string;
    };
  }>;
  MAP: Array<{
    app?: string;
    type?: string;
    paymail?: string;
    context?: string;
    channel?: string;
    messageID?: string;
    encrypted?: string;
    bapID?: string;
    tx?: string;
  }>;
  timestamp?: number;
  blk?: {
    t: number;
  };
  tx: {
    h: string;
  };
}

interface FormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  autoComplete?: string;
}

interface TextAreaProps {
  $hasContent?: boolean;
  $hasFiles?: boolean;
  ref?: RefObject<HTMLTextAreaElement>;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

const Container = styled.div`
  background-color: var(--b1);
  padding: 16px;
  border-top: 1px solid color-mix(in srgb, var(--p) 10%, transparent);
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--p),
      transparent
    );
    opacity: 0.5;
  }
`;

const Form = styled.form`
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 1200px;
`;

const AttachmentBar = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  margin-top: -40px;
  background: color-mix(in srgb, var(--b1) 95%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid color-mix(in srgb, var(--p) 10%, transparent);
  width: 100%;
  border-radius: 8px;
  padding: 8px;
  z-index: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const AttachmentLabel = styled.span`
  font-weight: 600;
  color: var(--bc);
  margin-right: 8px;
`;

const AttachmentItem = styled.div`
  margin-right: 8px;
  display: flex;
  align-items: center;
  color: var(--bc);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AttachmentName = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledPlusIcon = styled(HiPlusCircle)`
  font-size: 24px;
  color: var(--n);
  transition: all 0.2s ease;
`;

const PlusButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 12px;
  height: 100%;
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 0;
  z-index: 1;

  &:hover {
    color: var(--p);

    ${StyledPlusIcon} {
      color: var(--p);
      filter: drop-shadow(0 0 4px var(--p));
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover ${StyledPlusIcon} {
      color: var(--n);
      filter: none;
    }
  }
`;

const MessageInput = styled.textarea<TextAreaProps>`
  width: 100%;
  min-height: 44px;
  max-height: 50vh;
  padding: 12px;
  padding-left: 44px;
  padding-right: 72px;
  resize: none;
  background-color: var(--b2);
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--p) 10%, transparent);
  color: var(--bc);
  outline: none;
  font-size: 14px;
  transition: all 0.2s ease;

  &::placeholder {
    color: var(--n);
  }

  &:focus {
    outline: none;
    border-color: var(--p);
    box-shadow: 0 0 0 1px var(--p),
                0 0 8px color-mix(in srgb, var(--p) 20%, transparent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button<{ $hasContent: boolean; $hasFiles: boolean }>`
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 6px 16px;
  border-radius: 6px;
  background-color: ${({ $hasContent, $hasFiles }) =>
    $hasContent || $hasFiles ? 'var(--p)' : 'var(--n)'};
  color: var(--pc);
  border: none;
  cursor: ${({ $hasContent, $hasFiles }) =>
    $hasContent || $hasFiles ? 'pointer' : 'not-allowed'};
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover:not(:disabled) {
    background-color: var(--pf);
    transform: translateY(-1px);
    box-shadow: 0 0 8px color-mix(in srgb, var(--p) 40%, transparent);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  cursor: pointer;
  padding: 4px;
  color: var(--bc);
  transition: all 0.2s ease;
  background: none;
  border: none;
  border-radius: 4px;

  &:hover {
    color: var(--er);
    background-color: color-mix(in srgb, var(--er) 10%, transparent);
  }
`;

const TypingStatus = styled.div`
  position: absolute;
  bottom: 60px;
  color: var(--n);
  font-size: 0.85rem;
  font-style: italic;
`;

const WriteArea = () => {
  const { authToken, profile } = useHandcash();
  const { connected, pandaProfile } = useYours();
  const { decIdentity } = useBap();
  const {
    sendMessage: postMessage,
    postStatus,
    pendingFiles,
    setPendingFiles,
  } = useBitcoin();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeUser = useActiveUser() as ActiveUser | null;

  const friendRequests = useSelector(
    (state: RootState) => state.memberList.friendRequests,
  );
  const loadingMembers = useSelector(
    (state: RootState) => state.memberList.loading,
  );
  const loadingPins = useSelector(
    (state: RootState) => state.channels.pins.loading,
  );
  const loadingChannels = useSelector(
    (state: RootState) => state.channels.loading,
  );
  const loadingMessages = useSelector(
    (state: RootState) => state.chat.messages.loading,
  );
  const loadingFriendRequests = useSelector(
    (state: RootState) => state.memberList.friendRequests.loading,
  );
  const session = useSelector((state: RootState) => state.session);
  const typingUser = useSelector(
    (state: RootState) => state.chat.typingUser,
  ) as TypingUser | null;

  const activeChannelId = params.channel;
  const activeUserId = params.user;
  const pendingMessage = searchParams.get('m');
  const [messageContent, setMessageContent] = useState(pendingMessage || '');

  const channelName =
    activeChannelId ||
    activeUserId ||
    last(window?.location?.pathname?.split('/'));

  const isAuthenticated = useMemo(() => {
    // Check if we have a valid Handcash connection
    const hasHandcash = Boolean(authToken);
    
    // Check if we have a valid Yours wallet connection
    const hasYours = Boolean(pandaProfile && connected === FetchStatus.Success.toLowerCase());
    console.log('Yours auth debug:', { 
      pandaProfile, 
      connected, 
      expectedStatus: FetchStatus.Success.toLowerCase(),
      hasYours 
    });
    
    // Check if we have a valid BAP connection
    const hasBap = Boolean(activeUser && decIdentity);
    
    const result = hasHandcash || hasYours || hasBap;
    console.log('Auth state:', { hasHandcash, hasYours, hasBap, result });
    return result;
  }, [authToken, pandaProfile, connected, activeUser, decIdentity]);

  const guest = useMemo(() => {
    return !isAuthenticated;
  }, [isAuthenticated]);

  const self = useMemo(() => {
    return activeUser && session.user?.bapId === activeUser._id;
  }, [session.user?.bapId, activeUser]);

  const isDisabled = useMemo(() => {
    // In channel view, require authentication
    if (activeChannelId) {
      return !isAuthenticated; // Require wallet connection for posting
    }
    
    // In DM view, check friendship status
    if (activeUserId) {
      // Allow self-messages
      if (self) return false;
      
      // Check friendship status for DMs
      const hasFriendship = activeUser && 
        friendRequests.incoming.allIds.includes(activeUser._id) &&
        friendRequests.outgoing.allIds.includes(activeUser._id);
      
      return !hasFriendship;
    }
    
    // In global chat, require authentication
    return !isAuthenticated;
  }, [isAuthenticated, activeChannelId, activeUserId, activeUser, self, friendRequests]);

  const handlePlusClick = useCallback(() => {
    if (postStatus === FetchStatus.Loading) return;
    console.log('File upload coming soon!');
  }, [postStatus]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted, auth state:', { authToken, connected, pandaProfile, activeUser });
    
    if (!isAuthenticated) {
      console.log('Cannot post. Not authenticated');
      return;
    }

    const form = e.currentTarget;
    const formElement = form.elements.namedItem('msg_content') as HTMLTextAreaElement | null;
    const content = formElement?.value || '';
    const hasContent = content !== '' || pendingFiles.length > 0;
    console.log('Content check:', { content, hasContent, pendingFiles });

    // Allow posting if we have content and are authenticated
    if (hasContent) {
      try {
        // Get the paymail from any available source
        let paymail = 'anonymous@yours.org'; // Default paymail
        
        const handcashProfile = profile as Profile | undefined;
        const yoursProfile = pandaProfile as Profile | undefined;
        
        if (authToken && handcashProfile?.paymail) {
          paymail = handcashProfile.paymail; // Use Handcash paymail
        } else if (yoursProfile?.paymail) {
          paymail = yoursProfile.paymail; // Use Yours paymail
        } else if (activeUser?.paymail) {
          paymail = activeUser.paymail; // Use BAP paymail
        }

        const channel = channelName || '';
        console.log('Attempting to post message:', { paymail, channel, activeUserId, content });

        if (!channel) {
          console.error('Channel name is required');
          return;
        }

        // Don't clear the message until we know the post was successful
        const result = await postMessage(
          paymail,
          content,
          channel,
          activeUserId || '',
          decIdentity as DecIdentity,
        );
        console.log('Post message result:', result);

        // Only clear after successful post
        setMessageContent('');
        form.reset();
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage: BmapTx = {
          B: [
            {
              encoding: 'utf8',
              Data: { utf8: 'Error: Failed to send' },
            },
          ],
          MAP: [
            {
              app: 'bitchatnitro.com',
              type: 'message',
              paymail: 'system@bitchatnitro.com',
            },
          ],
          timestamp: moment().unix(),
          blk: { t: moment().unix() },
          tx: { h: 'error' },
        };
        dispatch(receiveNewMessage(errorMessage));
      }
    }
  }, [isAuthenticated, authToken, connected, pandaProfile, activeUser, profile, channelName, activeUserId, pendingFiles, postMessage, decIdentity, dispatch]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    }
  }, []);

  return (
    <Container>
      <Form onSubmit={handleSubmit} autoComplete="off">
        {pendingFiles && pendingFiles.length > 0 && (
          <AttachmentBar>
            <AttachmentLabel>Attachments:</AttachmentLabel>
            {pendingFiles.map((file, idx) => (
              <AttachmentItem key={file.name}>
                <AttachmentName>{file.name}</AttachmentName>
                {idx < pendingFiles.length - 1 ? ',' : ''}
              </AttachmentItem>
            ))}
            <CloseButton
              onClick={() => setPendingFiles([])}
              aria-label="Close attachments"
            >
              <IoMdClose size={16} />
            </CloseButton>
          </AttachmentBar>
        )}

        <PlusButton
          onClick={handlePlusClick}
          type="button"
          aria-label="Add attachment"
          disabled={postStatus === FetchStatus.Loading}
        >
          <StyledPlusIcon />
        </PlusButton>

        <MessageInput
          ref={inputRef}
          name="msg_content"
          placeholder={
            activeUserId
              ? (!activeUser?.idKey && activeUser)
                ? 'DMs Disabled'
                : activeUser && loadingMembers
                ? 'Loading members...'
                : `Message @${activeUserId}`
              : activeChannelId
              ? loadingChannels
                ? 'Loading channels...'
                : `Message #${activeChannelId}`
              : loadingMessages
              ? 'Loading messages...'
              : postStatus === FetchStatus.Loading
              ? 'Posting...'
              : 'Message in global chat'
          }
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isDisabled}
        />
        <SendButton
          type="submit"
          disabled={isDisabled}
          $hasContent={messageContent.trim().length > 0}
          $hasFiles={pendingFiles?.length > 0}
        >
          Send
        </SendButton>
      </Form>
      {typingUser && (
        <TypingStatus>{typingUser.paymail} is typing...</TypingStatus>
      )}
    </Container>
  );
};

export default WriteArea;
