import styled from 'styled-components';

const ChannelTextArea = styled.input.attrs({
  className: 'border-0 rounded-lg text-[15px] h-11 w-full outline-hidden',
})`
  background-color: var(--input);
  color: var(--foreground);

  &::placeholder {
    color: var(--muted-foreground);
  }
`;

export default ChannelTextArea;
