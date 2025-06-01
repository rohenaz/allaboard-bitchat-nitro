import React, { useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getBase64Url } from '../../../utils/file';

const PopupMessageContainer = styled.div`
  padding: 16px;
`;

const PopupContainer = styled.div`
  background-color: var(--background-primary);
  color: var(--text-normal);
  top: 50%;
  left: 50%;
  position: absolute;
  transform: translateX(-50%) translateY(-50%);
  border-radius: 4px;
  width: 100%;
  max-width: 90%;

  @media (min-width: 768px) {
    width: 40%;
  }
`;

const Image = styled.img`
  width: 100%;
`;

const FilePreviewModal = ({ open, onClose, file }) => {
  const b64 = useMemo(() => getBase64Url(file), [file]);
  const modalRef = useRef(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!b64) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 1000,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(0,0,0,.5)',
        alignItems: 'center',
        justifyContent: 'center',
        display: `${open ? 'flex' : 'none'}`,
        pointerEvents: `${open ? 'unset' : 'none'}`,
      }}
      className="top-0 left-0"
    >
      <PopupContainer className="disable-select" ref={modalRef}>
        <PopupMessageContainer>
          <Image src={b64} />
        </PopupMessageContainer>
      </PopupContainer>
    </div>
  );
};

export default FilePreviewModal;
