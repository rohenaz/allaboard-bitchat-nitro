import React from 'react';
import { FaImage } from 'react-icons/fa';
import OutsideClickHandler from 'react-outside-click-handler';
import tw, { styled } from 'twin.macro';

const ModalOverlay = styled.div`
  ${tw`fixed inset-0 flex items-center justify-center z-50`}
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  ${tw`bg-background-secondary rounded-lg shadow-xl`}
  min-width: 300px;
  max-width: 90vw;
`;

const ModalHeader = styled.div`
  ${tw`px-6 py-4 border-b border-background-tertiary`}
`;

const Title = styled.h3`
  ${tw`text-lg font-semibold text-header-primary`}
`;

const ModalBody = styled.div`
  ${tw`p-6`}
`;

const OptionButton = styled.button`
  ${tw`w-full text-left px-4 py-3 rounded hover:bg-background-modifier-hover flex items-center gap-3`}
  color: var(--text-normal);
  
  &:hover {
    color: var(--header-primary);
  }
`;

const PlusModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <ModalOverlay>
      <OutsideClickHandler onOutsideClick={onClose}>
        <ModalContent>
          <ModalHeader>
            <Title>Add to your message</Title>
          </ModalHeader>
          <ModalBody>
            <OptionButton>
              <FaImage size={24} />
              Upload a File
            </OptionButton>
          </ModalBody>
        </ModalContent>
      </OutsideClickHandler>
    </ModalOverlay>
  );
};

export default PlusModal;
