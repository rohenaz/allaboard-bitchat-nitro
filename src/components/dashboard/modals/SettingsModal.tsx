/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { type FC, type MouseEvent, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import {
  closeSettings,
  toggleHideUnverifiedMessages,
  toggleSettings,
} from '../../../reducers/settingsReducer';
import type { RootState } from '../../../store';

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

const ModalBackdrop = styled.dialog`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  border: none;
  padding: 0;
  margin: 0;

  &::backdrop {
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
  }

  &[open] {
    animation: ${fadeIn} 0.2s ease-out;
  }
`;

const ModalContainer = styled.div`
  background-color: var(--background-floating);
  border-radius: 8px;
  box-shadow: var(--elevation-high);
  border: 1px solid var(--background-modifier-accent);
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  padding: 24px;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-normal);
  margin: 0 0 24px 0;
`;

const Section = styled.div`
  background-color: var(--background-secondary);
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-normal);
  margin: 0 0 12px 0;
`;

const FormControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-normal);
`;

const Toggle = styled.input.attrs({ type: 'checkbox' })`
  position: relative;
  width: 44px;
  height: 24px;
  appearance: none;
  background-color: var(--background-modifier-accent);
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:checked {
    background-color: var(--brand-experiment);
  }

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    transform: ${({ checked }) => (checked ? 'translateX(20px)' : 'translateX(0)')};
  }

  &:checked::before {
    transform: translateX(20px);
  }

  &:focus {
    outline: 2px solid var(--brand-experiment);
    outline-offset: 2px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--background-modifier-accent);
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  background-color: var(--brand-experiment);
  color: white;

  &:hover {
    background-color: var(--brand-experiment-darker);
  }

  &:focus {
    outline: 2px solid var(--brand-experiment);
    outline-offset: 2px;
  }
`;

export const SettingsModal: FC = () => {
  const dispatch = useDispatch();
  const { isOpen, hideUnverifiedMessages } = useSelector(
    (state: RootState) => state.settings,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Handle modal open/close
  useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: Debug code to trace modal opening issue
    console.log(
      '🎭 SettingsModal useEffect triggered, isOpen:',
      isOpen,
      'dialogRef.current:',
      !!dialogRef.current,
      'dialog.open:',
      dialogRef.current?.open,
    );

    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      // biome-ignore lint/suspicious/noConsole: Debug code to trace modal opening issue
      console.log('🎭 Opening modal via showModal()');
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current?.open) {
      // biome-ignore lint/suspicious/noConsole: Debug code to trace modal opening issue
      console.log('🎭 Closing modal via close()');
      dialogRef.current.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    dispatch(toggleSettings());
  };

  // Handle click outside
  const handleClickOutside = (e: MouseEvent) => {
    // Only close if clicking on the backdrop itself (not on the modal content)
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  return (
    <ModalBackdrop
      ref={dialogRef}
      onClick={handleClickOutside}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      }}
    >
      <ModalContainer
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ModalTitle>Settings</ModalTitle>

        <Section>
          <SectionTitle>Messages</SectionTitle>
          <FormControl>
            <Label>
              <span>Hide unverified messages</span>
              <Toggle
                checked={hideUnverifiedMessages}
                onChange={() => dispatch(toggleHideUnverifiedMessages())}
              />
            </Label>
          </FormControl>
        </Section>

        <ButtonGroup>
          <Button type="button" onClick={handleClose}>
            Close
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </ModalBackdrop>
  );
};

export default SettingsModal;
