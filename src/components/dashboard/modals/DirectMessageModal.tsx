import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { autofill } from '../../../api/bmap';
import { api } from '../../../api/fetch';
import { loadChannels } from '../../../reducers/channelsReducer';
import type { AppDispatch, RootState } from '../../../store';

interface Channel {
  id: string;
  name: string;
  members: string[];
}

interface DirectMessageModalProps {
  onClose: () => void;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled.div`
  background-color: var(--background-floating);
  border-radius: 8px;
  box-shadow: var(--elevation-high);
  border: 1px solid var(--background-modifier-accent);
  width: 440px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--background-modifier-accent);
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-normal);
  margin: 0;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Input = styled.input`
  width: 100%;
  background-color: var(--background-secondary);
  border: 1px solid var(--background-modifier-accent);
  border-radius: 4px;
  padding: 12px;
  color: var(--text-normal);
  font-size: 16px;
  transition: all 0.15s ease;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--brand-experiment);
    box-shadow: 0 0 0 1px var(--brand-experiment);
  }
`;

const ErrorMessage = styled.div`
  color: var(--text-danger);
  font-size: 14px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background-color: rgba(237, 66, 69, 0.1);
  border-radius: 4px;
  border-left: 4px solid var(--text-danger);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  ${({ $variant = 'secondary' }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: var(--brand-experiment);
          color: white;
          &:hover {
            background-color: var(--brand-experiment-darker);
          }
        `;
      default:
        return `
          background-color: transparent;
          color: var(--text-normal);
          border: 1px solid var(--background-modifier-accent);
          &:hover {
            background-color: var(--background-modifier-hover);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DirectMessageModal = ({ onClose }: DirectMessageModalProps) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.session.user);

  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!currentUser?.idKey) {
      setError('Not logged in');
      setIsLoading(false);
      return;
    }

    try {
      // Find user by username using autofill
      const users = await autofill(username);

      const targetUser = users.find(
        (user) =>
          user.name.toLowerCase() === username.toLowerCase() ||
          user.paymail?.toLowerCase() === username.toLowerCase(),
      );
      if (!targetUser) {
        setError('User not found');
        setIsLoading(false);
        return;
      }

      // Create DM channel
      const channel = await api.post<Channel>('/channels', {
        type: 'dm',
        members: [currentUser.idKey, targetUser.idKey],
      });

      await dispatch(loadChannels());
      navigate(`/channels/${channel.id}`);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create DM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  return (
    <ModalBackdrop
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="presentation"
    >
      <ModalContainer
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="dm-modal-title"
        aria-modal="true"
      >
        <ModalHeader>
          <ModalTitle id="dm-modal-title">Start Direct Message</ModalTitle>
          <CloseButton type="button" onClick={onClose} aria-label="Close modal">
            ✕
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <form onSubmit={handleSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <FormGroup>
              <Input
                type="text"
                placeholder="Enter username or paymail"
                value={username}
                onChange={handleInputChange}
                disabled={isLoading}
                autoFocus
              />
            </FormGroup>

            <ButtonGroup>
              <Button type="button" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                $variant="primary"
                disabled={!username.trim() || isLoading}
              >
                {isLoading ? 'Creating...' : 'Start Conversation'}
              </Button>
            </ButtonGroup>
          </form>
        </ModalBody>
      </ModalContainer>
    </ModalBackdrop>
  );
};

export default DirectMessageModal;
