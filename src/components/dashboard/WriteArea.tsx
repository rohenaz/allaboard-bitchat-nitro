import { last } from 'lodash';
import moment from 'moment';
import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { HiPlusCircle } from 'react-icons/hi';
import { IoMdClose } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import tw, { styled } from 'twin.macro';
import { useBap } from '../../context/bap';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useActiveUser } from '../../hooks';
import {
  receiveNewMessage,
  toggleFileUpload,
} from '../../reducers/chatReducer';
import { FetchStatus } from '../../utils/common';
import InvisibleSubmitButton from './InvisibleSubmitButton';
import SubmitButton from './SubmitButton';
import PlusModal from './modals/PlusModal';

interface FriendRequest {
  loading: boolean;
  data: Array<{
    _id: string;
    paymail: string;
    logo?: string;
    alternateName?: string;
  }>;
}

interface RootState {
  memberList: {
    friendRequests: FriendRequest;
    loading: boolean;
  };
  channels: {
    pins: {
      loading: boolean;
    };
    loading: boolean;
  };
  chat: {
    messages: {
      loading: boolean;
    };
    typingUser: string | null;
  };
  session: {
    user?: {
      bapId?: string;
    };
  };
}

interface PendingFile {
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
}

interface KeyboardState {
  ctrlDown: boolean;
  cmdDown: boolean;
}

const Container = styled.div`
  ${tw`bg-background-primary px-4 py-2 flex-none flex items-center justify-center`}
  padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
  border-top: 1px solid var(--background-tertiary);
  width: 100%;
`;

const Form = styled.form`
  ${tw`relative flex gap-2`}
  width: 100%;
  max-width: 1200px;
`;

const AttachmentBar = styled.div`
  ${tw`flex items-center absolute -mt-10 bg-background-secondary w-full rounded p-2`}
  z-index: 1;
`;

const AttachmentLabel = styled.span`
  ${tw`font-semibold mr-2`}
`;

const AttachmentItem = styled.div`
  ${tw`mr-2 flex items-center truncate`}
`;

const AttachmentName = styled.div`
  ${tw`min-w-0 truncate`}
`;

const StyledPlusIcon = styled(HiPlusCircle)`
  ${tw`text-2xl text-[color:var(--text-muted)] transition-colors duration-200`}
`;

const PlusButton = styled.button`
  ${tw`flex items-center justify-center absolute left-3 h-full cursor-pointer bg-transparent border-0 p-0 focus:outline-none`}
  z-index: 1;

  &:hover {
    ${tw`text-[color:var(--text-normal)]`}
    
    svg {
      ${tw`text-[color:var(--text-normal)]`}
    }
  }

  &:disabled {
    ${tw`cursor-not-allowed opacity-50`}
    
    &:hover svg {
      ${tw`text-[color:var(--text-muted)]`}
    }
  }
`;

const MessageInput = styled.textarea`
  ${tw`w-full min-h-[44px] max-h-[50vh] py-2.5 resize-none bg-[color:var(--channeltextarea-background)] rounded text-[color:var(--text-normal)] placeholder-[color:var(--text-muted)]`}
  padding-left: 2.75rem;
  padding-right: 1rem;
  outline: none;
  &:focus {
    outline: none;
  }
`;

const CloseButton = styled.button`
  ${tw`cursor-pointer p-1 hover:text-red-400 focus:outline-none`}
  transition: color 0.2s ease;
`;

const WriteArea: React.FC = () => {
  const { authToken, decryptStatus, profile, signStatus } = useHandcash();
  const { connected, pandaProfile } = useYours();
  const { sendMessage, postStatus, pendingFiles, setPendingFiles } =
    useBitcoin();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [showPlusPopover, setShowPlusPopover] = useState(false);
  const { decIdentity } = useBap();
  const activeUser = useActiveUser();
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const _friendRequests = useSelector(
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
  const _typingUser = useSelector((state: RootState) => state.chat.typingUser);

  const activeChannelId = useMemo(() => params.channel, [params.channel]);
  const activeUserId = useMemo(() => params.user, [params.user]);
  const pendingMessage = useMemo(() => searchParams.get('m'), [searchParams]);
  const [messageContent, setMessageContent] = useState(pendingMessage || '');

  const _channelName =
    activeChannelId ||
    activeUserId ||
    last(window?.location?.pathname?.split('/'));

  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    ctrlDown: false,
    cmdDown: false,
  });

  const changeContent = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessageContent(e.target.value);
    },
    [],
  );

  const _togglePlusPopover = useCallback(() => {
    setShowPlusPopover((prev) => !prev);
  }, []);

  const guest = useMemo(() => {
    return !authToken && !pandaProfile;
  }, [authToken, pandaProfile]);

  const self = useMemo(() => {
    return activeUser && session.user?.bapId === activeUser?._id;
  }, [session.user?.bapId, activeUser]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!authToken && !connected) {
        return;
      }

      const form = event.target as HTMLFormElement;
      const content = (form.msg_content as HTMLTextAreaElement).value;
      const hasContent = content !== '' || pendingFiles.length > 0;

      if (hasContent && (profile?.paymail || pandaProfile)) {
        setMessageContent('');
        form.reset();
        try {
          await sendMessage(
            profile?.paymail || pandaProfile?.displayName,
            content,
            activeChannelId,
            activeUserId,
            decIdentity,
          );
        } catch (_e) {
          dispatch(
            receiveNewMessage({
              B: { content: 'Error: Failed to send' },
              MAP: {
                app: 'bitchatnitro.com',
                type: 'message',
                paymail: 'system@bitchatnitro.com',
              },
              timestamp: moment().unix(),
              blk: { t: moment().unix() },
              tx: { h: 'error' },
              _id: 'error',
            }),
          );
        }
      }
    },
    [
      authToken,
      connected,
      profile?.paymail,
      pandaProfile,
      pendingFiles.length,
      activeChannelId,
      activeUserId,
      decIdentity,
      dispatch,
      sendMessage,
    ],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const CTRL_KEY = 17;
      const CMD_KEY = 91;
      const V_KEY = 86;
      const C_KEY = 67;

      if (event.keyCode === CTRL_KEY) {
        setKeyboardState((prev) => ({ ...prev, ctrlDown: true }));
      } else if (event.keyCode === CMD_KEY) {
        setKeyboardState((prev) => ({ ...prev, cmdDown: true }));
      }

      if (
        (keyboardState.ctrlDown || keyboardState.cmdDown) &&
        event.keyCode === C_KEY
      ) {
        // Handle Ctrl+C if needed
      }
      if (
        (keyboardState.ctrlDown || keyboardState.cmdDown) &&
        event.keyCode === V_KEY
      ) {
        // Handle Ctrl+V if needed
      }
    },
    [keyboardState],
  );

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ENTER_KEY = 13;
      const CTRL_KEY = 17;
      const CMD_KEY = 91;
      const V_KEY = 86;

      if (event.keyCode === CTRL_KEY) {
        setKeyboardState((prev) => ({ ...prev, ctrlDown: false }));
      } else if (event.keyCode === CMD_KEY) {
        setKeyboardState((prev) => ({ ...prev, cmdDown: false }));
      }

      if (event.keyCode === ENTER_KEY && !event.shiftKey) {
        event.preventDefault();
        const form = event.currentTarget.form;
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      } else if (
        event.keyCode === V_KEY &&
        (keyboardState.ctrlDown || keyboardState.cmdDown)
      ) {
        // Handle Ctrl+V if needed
      }
    },
    [keyboardState],
  );

  const handleCloseAttachment = useCallback(() => {
    setPendingFiles([]);
  }, [setPendingFiles]);

  const handlePlusClick = useCallback(() => {
    if (
      signStatus === FetchStatus.Loading ||
      decryptStatus === FetchStatus.Loading ||
      loadingMembers ||
      loadingPins ||
      loadingChannels ||
      loadingMessages ||
      loadingFriendRequests
    ) {
      return;
    }
    _togglePlusPopover();
  }, [
    signStatus,
    decryptStatus,
    loadingMembers,
    loadingPins,
    loadingChannels,
    loadingMessages,
    loadingFriendRequests,
    _togglePlusPopover,
  ]);

  return (
    <Container>
      {pendingFiles.length > 0 && (
        <AttachmentBar>
          <AttachmentLabel>Attachments</AttachmentLabel>
          {pendingFiles.map((file: PendingFile, index: number) => (
            <AttachmentItem key={`${file.name}-${index}`}>
              <AttachmentName>{file.name}</AttachmentName>
              <CloseButton onClick={handleCloseAttachment}>
                <IoMdClose />
              </CloseButton>
            </AttachmentItem>
          ))}
        </AttachmentBar>
      )}
      <Form onSubmit={handleSubmit}>
        <PlusButton
          type="button"
          onClick={handlePlusClick}
          disabled={
            signStatus === FetchStatus.Loading ||
            decryptStatus === FetchStatus.Loading ||
            loadingMembers ||
            loadingPins ||
            loadingChannels ||
            loadingMessages ||
            loadingFriendRequests
          }
        >
          <StyledPlusIcon />
        </PlusButton>
        <MessageInput
          ref={inputRef}
          name="msg_content"
          value={messageContent}
          onChange={changeContent}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={
            guest
              ? 'Please connect your wallet to chat'
              : self
                ? "You can't message yourself"
                : 'Message'
          }
          disabled={guest || self}
        />
        <SubmitButton
          type="submit"
          disabled={
            guest ||
            self ||
            postStatus === FetchStatus.Loading ||
            (!messageContent && !pendingFiles.length)
          }
        />
        <InvisibleSubmitButton type="submit" />
      </Form>
      <PlusModal
        open={showPlusPopover}
        onClose={_togglePlusPopover}
        anchorEl={inputRef.current}
      />
    </Container>
  );
};

export default WriteArea;
