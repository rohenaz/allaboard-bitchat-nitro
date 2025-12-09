import { BsPin, BsPinFill } from 'react-icons/bs';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: ${(p) => (p.$horizontal ? 'row' : 'column')};
  gap: ${(p) => p.$gap};
`;

const ListItemContainer = styled.div`
  padding: 6px;
  margin: 1px 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--muted-foreground);
  opacity: ${(props) => (props.$hasActivity ? 1 : 0.6)};
  background-color: ${(props) =>
    props.$isActive ? 'var(--accent)' : 'transparent'};
  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
    opacity: 1;
  }
`;

const PinButton = styled.button`
  margin-left: auto;
  padding: 4px;
  color: var(--muted-foreground);
  &:hover {
    color: var(--foreground);
  }
`;

const _ListItem = ({
  icon,
  text,
  style,
  id,
  isPinned,
  onMouseEnter,
  onMouseLeave,
  hasActivity,
  isActive,
  showPin,
  onClickPin,
  ...props
}) => {
  return (
    <ListItemContainer
      style={style}
      id={id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      $hasActivity={hasActivity}
      $isActive={isActive}
      {...props}
    >
      {icon}
      <span>{text}</span>
      {showPin && (
        <PinButton
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClickPin();
          }}
          type="button"
        >
          {isPinned ? <BsPinFill /> : <BsPin />}
        </PinButton>
      )}
    </ListItemContainer>
  );
};

const List = ({ horizontal, gap, children, ...delegated }) => {
  return (
    <Wrapper $horizontal={horizontal} $gap={gap} {...delegated}>
      {children}
    </Wrapper>
  );
};

export default List;
