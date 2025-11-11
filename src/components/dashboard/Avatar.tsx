import React from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../../config/constants';

interface AvatarProps {
  size?: string;
  paymail?: string;
  icon?: string;
  status?: 'online' | 'offline' | 'away' | 'dnd';
  showStatus?: boolean;
  className?: string;
}

const AvatarWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const AvatarContainer = styled.div<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--background-glass);
  backdrop-filter: blur(var(--blur-light));
  -webkit-backdrop-filter: blur(var(--blur-light));
  border: 2px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover {
    border-color: var(--border-glass);
    box-shadow: var(--elevation-medium);
    transform: scale(1.05);
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarFallback = styled.div<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: linear-gradient(135deg, var(--brand-experiment), var(--brand-experiment-darker));
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: ${({ size }) => `${Number.parseInt(size) / 2.5}px`};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusIndicator = styled.div<{
  status: 'online' | 'offline' | 'away' | 'dnd';
  size: string;
}>`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: ${({ size }) => `${Math.max(Number.parseInt(size) * 0.25, 12)}px`};
  height: ${({ size }) => `${Math.max(Number.parseInt(size) * 0.25, 12)}px`};
  border-radius: 50%;
  border: 2px solid var(--background-primary);
  background-color: ${({ status }) => {
    switch (status) {
      case 'online':
        return 'var(--status-positive)';
      case 'away':
        return 'var(--status-warning)';
      case 'dnd':
        return 'var(--status-danger)';
      default:
        return 'var(--text-muted)';
    }
  }};
  box-shadow: 0 0 8px ${({ status }) => {
    switch (status) {
      case 'online':
        return 'var(--status-positive-glow)';
      case 'away':
        return 'var(--status-warning-glow)';
      case 'dnd':
        return 'var(--status-danger-glow)';
      default:
        return 'transparent';
    }
  }};
  transition: all 0.2s ease;
  
  ${({ status }) =>
    status === 'online' &&
    `
    animation: pulse 2s infinite;
  `}
`;

const Avatar: React.FC<AvatarProps> = ({
  size = '40px',
  paymail = '',
  icon = '',
  status = 'offline',
  showStatus = false,
  className = '',
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

  const avatarContent =
    !icon || imgError ? (
      <AvatarContainer size={size} className={className}>
        <AvatarFallback size={size}>
          {paymail ? getInitials(paymail) : '??'}
        </AvatarFallback>
      </AvatarContainer>
    ) : (
      <AvatarContainer size={size} className={className}>
        <AvatarImage
          src={icon.startsWith('http') ? icon : `${API_BASE_URL}/files/${icon}`}
          alt={paymail || 'avatar'}
          onError={handleError}
        />
      </AvatarContainer>
    );

  if (showStatus) {
    return (
      <AvatarWrapper>
        {avatarContent}
        <StatusIndicator status={status} size={size} />
      </AvatarWrapper>
    );
  }

  return avatarContent;
};

export default Avatar;
