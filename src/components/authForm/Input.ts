import styled from 'styled-components';

interface InputProps {
	error?: boolean;
}

const Input = styled.input<InputProps>`
  background-color: var(--background-modifier-accent);
  font-size: 14px;
  padding: 10px;
  margin-bottom: 12px;
  height: 40px;
  width: 100%;
  border-radius: 4px;
  border: 1px solid
    ${(p) => (p.error ? 'var(--destructive)' : 'var(--border)')};
  outline: none;
  color: var(--text-normal);
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border: 1px solid ${(p) => (p.error ? 'var(--text-danger)' : 'var(--brand-experiment)')};
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

export default Input;
