import type React from 'react';
import styled from 'styled-components';

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const Button = styled.button<{ disabled?: boolean }>`
  background-color: ${({ disabled }) =>
    disabled ? 'var(--button-secondary-background)' : 'var(--button-primary)'};
  color: ${({ disabled }) =>
    disabled ? 'var(--text-muted)' : 'var(--text-normal)'};
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ disabled }) =>
      disabled
        ? 'var(--button-secondary-background)'
        : 'var(--button-primary-hover)'};
  }
`;

const SubmitButton: React.FC<SubmitButtonProps> = ({ disabled, ...props }) => {
  return <Button disabled={disabled} {...props} />;
};

export default SubmitButton;
