import type { FC } from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const Message = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
    background-color: var(--brand);
    color: white;
    border: none;

    &:hover {
      background-color: var(--brand-dark);
    }
  `
      : `
    background-color: transparent;
    color: var(--text-normal);
    border: 1px solid var(--background-tertiary);

    &:hover {
      background-color: var(--background-secondary);
    }
  `}
`;

const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Container>
        <Title>{title}</Title>
        <Message>{message}</Message>
        <ButtonContainer>
          <Button onClick={onClose} $variant="secondary">
            {cancelText}
          </Button>
          <Button onClick={handleConfirm} $variant="primary">
            {confirmText}
          </Button>
        </ButtonContainer>
      </Container>
    </Modal>
  );
};

export default ConfirmationModal;
