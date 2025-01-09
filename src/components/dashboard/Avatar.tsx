import React from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../../config/env';

interface AvatarProps {
  size?: string;
  paymail?: string;
  icon?: string;
}

const AvatarContainer = styled.div<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;
  overflow: hidden;
  shrink: 0;
  background: var(--background-primary);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarFallback = styled.div<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: var(--background-accent);
  color: var(--text-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: ${({ size }) => `${Number.parseInt(size) / 2.5}px`};
  text-transform: uppercase;
`;

const Avatar: React.FC<AvatarProps> = ({
  size = '40px',
  paymail = '',
  icon = '',
}): React.ReactElement => {
  const [imgError, setImgError] = React.useState(false);

  const getInitials = (paymail: string) => {
    const parts = paymail.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return parts[0].slice(0, 2);
  };

  const handleError = () => {
    setImgError(true);
  };

  if (!icon || imgError) {
    return (
      <AvatarContainer size={size}>
        <AvatarFallback size={size}>
          {paymail ? getInitials(paymail) : '??'}
        </AvatarFallback>
      </AvatarContainer>
    );
  }

  return (
    <AvatarContainer size={size}>
      <AvatarImage
        src={icon.startsWith('http') ? icon : `${API_BASE_URL}/files/${icon}`}
        alt={paymail || 'avatar'}
        onError={handleError}
      />
    </AvatarContainer>
  );
};

export default Avatar;
