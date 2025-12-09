import styled from 'styled-components';

interface LabelProps {
	error?: boolean;
}

const Label = styled.label<LabelProps>`
  color: ${(p) => (p.error ? 'var(--text-danger)' : 'var(--text-normal)')};
  font-weight: 500;
  text-transform: uppercase;
  font-size: 12px;
  padding: 8px 0;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export default Label;
