import { last } from 'lodash';
import moment from 'moment';
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
import SubmitButton from './SubmitButton';

import {
  receiveNewMessage,
  toggleFileUpload,
} from '../../reducers/chatReducer';
import { FetchStatus } from '../../utils/common';
import InvisibleSubmitButton from './InvisibleSubmitButton';
import PlusModal from './modals/PlusModal';

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

const TypingStatus = styled.span`
  ${tw`text-xs font-medium text-[color:var(--text-normal)]`}
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

const WriteArea = () => {
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
  const inputRef = useRef(null);

  const friendRequests = useSelector(
    (state) => state.memberList.friendRequests,
  );
  const loadingMembers = useSelector((state) => state.memberList.loading);
  const loadingPins = useSelector((state) => state.channels.pins.loading);
  const loadingChannels = useSelector((state) => state.channels.loading);
  const loadingMessages = useSelector((state) => state.chat.messages.loading);
  const loadingFriendRequests = useSelector(
    (state) => state.memberList.friendRequests.loading,
  );
  const session = useSelector((state) => state.session);
  const typingUser = useSelector((state) => state.chat.typingUser);

  const activeChannelId = useMemo(() => params.channel, [params.channel]);
  const activeUserId = useMemo(() => params.user, [params.user]);
  const pendingMessage = useMemo(() => searchParams.get('m'), [searchParams]);
  const [messageContent, setMessageContent] = useState(pendingMessage || '');

  const _channelName =
    activeChannelId ||
    activeUserId ||
    last(window?.location?.pathname?.split('/'));

  const changeContent = useCallback((e) => {
    setMessageContent(e.target.value);
  }, []);

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
    async (event) => {
      event.preventDefault();
      if (!authToken && !connected) {
        return;
      }

      const content = event.target.msg_content.value;
      const hasContent = content !== '' || pendingFiles.length > 0;

      if (hasContent && (profile?.paymail || pandaProfile)) {
        setMessageContent('');
        event.target.reset();
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

  const handleKeyDown = useCallback((event) => {
    const CTRL_KEY = 17;
    const CMD_KEY = 91;
    const V_KEY = 86;
    const C_KEY = 67;
    let ctrlDown = false;

    if (event.keyCode === CTRL_KEY || event.keyCode === CMD_KEY) {
      ctrlDown = true;
    }

    if (ctrlDown && event.keyCode === C_KEY) {
      // Handle Ctrl+C if needed
    }
    if (ctrlDown && event.keyCode === V_KEY) {
      // Handle Ctrl+V if needed
    }
  }, []);

  const handleKeyUp = useCallback((event) => {
    const ENTER_KEY = 13;
    const CTRL_KEY = 17;
    const CMD_KEY = 91;
    const V_KEY = 86;

    if (event.keyCode === CTRL_KEY || event.keyCode === CMD_KEY) {
      // Reset ctrl key state
      return;
    }

    if (event.keyCode === ENTER_KEY && !event.shiftKey) {
      // Handle Enter key press (without shift)
      event.preventDefault();
      event.target.form.dispatchEvent(
        new Event('submit', { cancelable: true }),
      );
    } else if (event.keyCode === V_KEY && event.ctrlKey) {
      // Handle Ctrl+V if needed
    }
  }, []);

  const handleCloseAttachment = useCallback(() => {
    setPendingFiles([]);
  }, [setPendingFiles]);

  const handlePlusClick = useCallback(() => {
    if (
      signStatus === FetchStatus.Loading ||
      postStatus === FetchStatus.Loading
    ) {
      return;
    }
    dispatch(toggleFileUpload());
  }, [dispatch, signStatus, postStatus]);

  return (
    <Container>
      <Form onSubmit={handleSubmit} autoComplete="off">
        {pendingFiles.length > 0 && (
          <AttachmentBar>
            <AttachmentLabel>Attachments:</AttachmentLabel>
            {pendingFiles.map((f, idx) => (
              <AttachmentItem key={f.name}>
                <AttachmentName>{f.name}</AttachmentName>
                {idx < pendingFiles.length - 1 ? ',' : ''}
              </AttachmentItem>
            ))}
            {pendingFiles.length > 0 && (
              <CloseButton
                onClick={handleCloseAttachment}
                onKeyDown={(e) => e.key === 'Enter' && handleCloseAttachment()}
                tabIndex={0}
                aria-label="Close attachments"
              >
                <IoMdClose size={16} />
              </CloseButton>
            )}
          </AttachmentBar>
        )}

        <PlusButton
          onClick={handlePlusClick}
          type="button"
          aria-label="Add attachment"
          disabled={
            signStatus === FetchStatus.Loading ||
            postStatus === FetchStatus.Loading
          }
        >
          <StyledPlusIcon />
        </PlusButton>

        <MessageInput
          type="text"
          id="channelTextArea"
          name="msg_content"
          autoComplete="off"
          placeholder={
            !activeUser?.idKey && activeUser
              ? 'DMs Disabled'
              : activeUser && loadingMembers
                ? 'Loading members...'
                : !activeUser && loadingPins
                  ? 'Loading pinned channels...'
                  : !activeUser && loadingChannels
                    ? 'Loading channels...'
                    : activeUser && loadingFriendRequests
                      ? 'Loading friends'
                      : loadingMessages
                        ? 'Loading messages...'
                        : decryptStatus === FetchStatus.Loading
                          ? 'Decrypting...'
                          : signStatus === FetchStatus.Loading
                            ? 'Signing...'
                            : postStatus === FetchStatus.Loading
                              ? 'Posting...'
                              : `Message ${
                                  activeChannelId
                                    ? `#${activeChannelId}`
                                    : activeUserId
                                      ? `@${activeUserId}`
                                      : 'in global chat'
                                }`
          }
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          onFocus={() => {}}
          value={messageContent}
          onChange={changeContent}
          ref={inputRef}
          disabled={
            guest ||
            (!self &&
              activeUser &&
              !(
                friendRequests.incoming.allIds.includes(activeUser?._id) &&
                friendRequests.outgoing.allIds.includes(activeUser?._id)
              ) &&
              !decIdentity?.result?.commsPublicKey)
          }
        />
        <SubmitButton />
        <InvisibleSubmitButton />
      </Form>
      <TypingStatus>
        {typingUser && `${typingUser.paymail} is typing...`}
      </TypingStatus>
      <PlusModal
        open={showPlusPopover}
        onClose={() => inputRef.current?.focus()}
      />
    </Container>
  );
};

export default WriteArea;
