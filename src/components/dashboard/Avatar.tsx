import styled from '@emotion/styled';
import type React from 'react';
import { API_BASE_URL } from '../../config/env';

interface AvatarProps {
  icon: string;
  paymail: string;
  size?: string;
  color?: string;
  bgcolor?: string;
  w?: string;
  h?: string;
  border?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

interface WrapperProps {
  color?: string;
  bgcolor?: string;
  border?: string;
}

const Wrapper = styled.div<WrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  background-color: ${(props) => props.bgcolor || '#e2e8f0'};
  color: ${(props) => props.color || '#4a5568'};
  border: ${(props) => props.border || 'none'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const Avatar: React.FC<AvatarProps> = ({
  icon,
  paymail,
  size = '40px',
  color,
  bgcolor,
  w,
  h,
  border,
  onClick,
}) => {
  const width = w || size;
  const height = h || size;

  if (!icon) {
    return (
      <Wrapper
        onClick={onClick}
        color={color}
        bgcolor={bgcolor}
        border={border}
        style={{ width, height }}
      >
        {paymail?.charAt(0).toUpperCase()}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      onClick={onClick}
      color={color}
      bgcolor={bgcolor}
      border={border}
      style={{ width, height }}
    >
      <img
        src={icon.startsWith('http') ? icon : `${API_BASE_URL}/files/${icon}`}
        alt={`Avatar for ${paymail}`}
        width={width}
        height={height}
        style={{ objectFit: 'cover' }}
      />
    </Wrapper>
  );
};

export default Avatar;
