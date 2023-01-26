import styled from "styled-components";

const ChannelTextArea = styled.input.attrs((props) => ({
  className: props.className,
}))`
  border: 0;
  border-radius: 8px;
  background-color: var(--channeltextarea-background);
  color: var(--text-normal);
  font-size: 15px;
  height: 44px;
  outline: none;
  width: 100%;

  &::placeholder {
    color: var(--text-muted);
  }
`;

export default ChannelTextArea;
