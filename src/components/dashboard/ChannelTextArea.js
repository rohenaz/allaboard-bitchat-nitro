import styled from 'styled-components';

const ChannelTextArea = styled.input.attrs({
  className: 'border-0 rounded-lg text-[15px] h-11 w-full outline-hidden',
})`
  background-color: var(--channeltextarea-background);
  color: var(--text-normal);

  &::placeholder {
    color: var(--text-muted);
  }
`;

export default ChannelTextArea;
