import type { FC, ReactNode } from 'react';
import styled, { css } from 'styled-components';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeStyles = {
  xs: css`
    padding: 2px 12px;
    font-size: 12px;
    min-height: 24px;
  `,
  sm: css`
    padding: 4px 16px;
    font-size: 14px;
    min-height: 32px;
  `,
  md: css`
    padding: 8px 16px;
    font-size: 14px;
    min-height: 38px;
  `,
  lg: css`
    padding: 12px 20px;
    font-size: 16px;
    min-height: 44px;
  `,
};

const variantStyles = {
  primary: css`
    background-color: var(--brand-experiment);
    color: var(--white-500);
    
    &:hover:not(:disabled) {
      background-color: var(--brand-experiment-hover);
    }
    
    &:active:not(:disabled) {
      background-color: var(--brand-experiment-560);
    }
  `,
  secondary: css`
    background-color: var(--background-modifier-accent);
    color: var(--text-normal);
    
    &:hover:not(:disabled) {
      background-color: var(--background-modifier-hover);
    }
    
    &:active:not(:disabled) {
      background-color: var(--background-modifier-active);
    }
  `,
  accent: css`
    background-color: var(--green-360);
    color: var(--white-500);
    
    &:hover:not(:disabled) {
      background-color: var(--green-360);
      filter: brightness(1.1);
    }
    
    &:active:not(:disabled) {
      background-color: var(--green-360);
      filter: brightness(0.9);
    }
  `,
  ghost: css`
    background-color: transparent;
    color: var(--text-normal);
    
    &:hover:not(:disabled) {
      background-color: var(--background-modifier-hover);
      color: var(--interactive-hover);
    }
    
    &:active:not(:disabled) {
      background-color: var(--background-modifier-active);
    }
  `,
  link: css`
    background-color: transparent;
    color: var(--text-link);
    padding: 0;
    min-height: auto;
    text-decoration: underline;
    
    &:hover:not(:disabled) {
      text-decoration: none;
    }
  `,
};

interface StyledButtonProps {
  $variant: ButtonProps['variant'];
  $size: ButtonProps['size'];
  $fullWidth?: boolean;
}

const StyledButton = styled.button<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
  position: relative;
  white-space: nowrap;
  
  ${({ $size = 'md' }) => sizeStyles[$size]}
  ${({ $variant = 'primary' }) => variantStyles[$variant]}
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    box-shadow: 0 0 0 2px var(--brand-experiment);
  }
`;

export const Button: FC<ButtonProps> = ({
  children,
  onClick,
  className,
  type = 'button',
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}) => {
  return (
    <StyledButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
    >
      {children}
    </StyledButton>
  );
};
