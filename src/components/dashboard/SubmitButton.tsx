import type React from 'react';
import styled from 'styled-components';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	disabled?: boolean;
}

const Button = styled.button<{ disabled?: boolean }>`
  background-color: ${({ disabled }) => (disabled ? 'var(--secondary)' : 'var(--primary)')};
  color: ${({ disabled }) => (disabled ? 'var(--muted-foreground)' : 'var(--primary-foreground)')};
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.2s ease;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? 'var(--secondary)' : 'var(--primary)')};
    opacity: ${({ disabled }) => (disabled ? 0.5 : 0.9)};
  }
`;

const SubmitButton: React.FC<SubmitButtonProps> = ({ disabled, ...props }) => {
	return <Button disabled={disabled} {...props} />;
};

export default SubmitButton;
