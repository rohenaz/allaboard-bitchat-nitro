import styled from 'styled-components';

const SubmitButton = styled.button.attrs(() => ({ type: 'submit' }))`
  background-color: ${(p) => p.bgcolor || 'var(--primary)'};
  border: 0;
  border-radius: 4px;
  padding: 12px 8px;
  margin: 16px 0 12px 0;
  color: var(--primary-foreground);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${(p) => p.bgcolorhover || 'var(--primary)'};
    opacity: 0.9;
    cursor: pointer;
  }

  &:disabled {
    background-color: var(--muted);
    color: var(--muted-foreground);
  }
`;

export default SubmitButton;
