import type { ComponentPropsWithoutRef } from 'react';
import styled from 'styled-components';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  $hoverColor?: string;
  color?: string;
}

export const Button = styled.button<ButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: ${(props) => props.color || '#777'};
  color: white;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => props.$hoverColor || '#555'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }

  svg {
    margin-right: 8px;
  }
`;
