import { last } from 'lodash';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { HiPlusCircle } from 'react-icons/hi';
import { IoMdClose } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import type { AppDispatch, RootState } from '../../store';
import { FetchStatus } from '../../utils/common';
import PlusModal from './modals/PlusModal';

interface PendingFile {
  name: string;
  size: number;
  type: string;
  data: string;
}

const Container = styled.div`
  background-color: var(--background-primary);
  padding: 16px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
  border-top: 1px solid var(--background-tertiary);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Form = styled.form`
  position: relative;
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 1200px;
`;

const AttachmentBar = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  margin-top: -40px;
  background-color: var(--background-secondary);
  width: 100%;
  border-radius: 4px;
  padding: 8px;
  z-index: 1;
`;

const AttachmentLabel = styled.span`
  font-weight: 600;
  margin-right: 8px;
`;

const AttachmentItem = styled.div`
  margin-right: 8px;
  display: flex;
  align-items: center;
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
  color: var(--text-muted);
  transition: color 0.2s;
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
    color: var(--text-normal);
    
    ${StyledPlusIcon} {
      color: var(--text-normal);
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    
    &:hover ${StyledPlusIcon} {
      color: var(--text-muted);
    }
  }
`;

const MessageInput = styled.textarea`
  width: 100%;
  min-height: 44px;
  max-height: 50vh;
  padding: 10px;
  padding-left: 44px;
  padding-right: 16px;
  resize: none;
  background-color: var(--channeltextarea-background);
  border-radius: 4px;
  color: var(--text-normal);
  outline: none;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    outline: none;
  }
`;

const CloseButton = styled.button`
  cursor: pointer;
  padding: 4px;
  color: var(--text-normal);
  transition: color 0.2s ease;
  background: none;
  border: none;

  &:hover {
    color: var(--text-danger);
  }
`;

const WriteArea: React.FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const { postMessage, postStatus, pendingFiles, setPendingFiles } =
    useBitcoin();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChannelId = params.channel;
  const activeUserId = params.user;

  const channelName =
    activeChannelId ||
    activeUserId ||
    last(window?.location?.pathname?.split('/'));

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!authToken && !connected) {
        console.log('Cannot post. No Handcash auth and no panda connection');
        return;
      }

      const form = e.target as HTMLFormElement;
      const content = (
        form.elements.namedItem('msg_content') as HTMLTextAreaElement
      )?.value;

      if (content.trim() || (pendingFiles && pendingFiles.length > 0)) {
        try {
          await postMessage(channelName, content, pendingFiles);
          setMessageContent('');
          setPendingFiles([]);
          form.reset();
        } catch (error) {
          console.error('Failed to post message:', error);
        }
      }
    },
    [
      authToken,
      connected,
      pendingFiles,
      channelName,
      postMessage,
      setPendingFiles,
    ],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const form = e.currentTarget.form;
        if (form) {
          const event = new Event('submit', { cancelable: true });
          form.dispatchEvent(event);
        }
      }
    },
    [],
  );

  const handlePlusClick = useCallback(() => {
    if (postStatus === FetchStatus.Loading) return;
    setShowPlusModal(true);
  }, [postStatus]);

  return (
    <Container>
      <Form onSubmit={handleSubmit} autoComplete="off">
        {pendingFiles && pendingFiles.length > 0 && (
          <AttachmentBar>
            <AttachmentLabel>Attachments:</AttachmentLabel>
            {pendingFiles.map((file: PendingFile, idx: number) => (
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
          name="msg_content"
          placeholder={
            postStatus === FetchStatus.Loading
              ? 'Sending message...'
              : `Message ${
                  activeChannelId
                    ? `#${activeChannelId}`
                    : activeUserId
                      ? `@${activeUserId}`
                      : 'in global chat'
                }`
          }
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyPress={handleKeyPress}
          ref={inputRef}
          disabled={postStatus === FetchStatus.Loading}
        />
      </Form>
      <PlusModal
        open={showPlusModal}
        onClose={() => {
          setShowPlusModal(false);
          inputRef.current?.focus();
        }}
      />
    </Container>
  );
};

export default WriteArea;
