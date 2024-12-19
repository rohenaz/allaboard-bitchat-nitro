import styled from 'styled-components';
import tw from 'twin.macro';

const ChannelTextArea = styled.input.attrs((props) => ({
  className: props.className,
}))`
  ${tw`border-0 rounded-lg text-[15px] h-11 w-full outline-none`}
  background-color: var(--channeltextarea-background);
  color: var(--text-normal);

  &::placeholder {
    color: var(--text-muted);
  }
`;

export default ChannelTextArea;
