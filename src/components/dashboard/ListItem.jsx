import React from 'react';
import { AiFillPushpin } from 'react-icons/ai';

import styled, { css } from 'styled-components';

const Text = styled.span`
  font-weight: 500;
  ${(p) =>
    `font-size: ${p.textStyle?.fontSize ? p.textStyle.fontSize : '15px'}`};
  ${(p) => `color: ${p.isActive ? 'var(--header-primary)' : 'var(--channels-default)'}`};
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const Icon = styled.div`
  color: var(--text-muted);
  &:hover {
    color: var(--text-link);
  }
`;

const Wrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  border-radius: 4px;

  &:hover {
    background-color: var(--background-modifier-hover);
    cursor: pointer;
  }

  &:hover > ${Text} {
    color: var(--interactive-hover);
  }
  ${(p) =>
    p.isPinned &&
    css`
      border: 1px solid gold;
    `}
  ${(p) =>
    p.isActive &&
    css`
      &,
      &:hover {
        background-color: var(--background-modifier-selected);
      }

      & > ${Text}, &:hover > ${Text} {
        color: var(--interactive-active);
      }
    `}
`;

const ListItem = ({
  icon,
  text,
  isPinned,
  showPin,
  isActive,
  hasActivity,
  onClickPin,
  textStyle,
  ...delegated
}) => {
  return (
    <Container isActive={isActive} isPinned={isPinned} {...delegated}>
      {icon}
      <Wrapper>
        {text && (
          <Text
            isActive={isActive || hasActivity}
            style={textStyle}
            className="disable-select"
          >
            {text}
          </Text>
        )}
        {!isPinned && showPin && (
          <Icon
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClickPin();
            }}
          >
            <AiFillPushpin />
          </Icon>
        )}
      </Wrapper>
    </Container>
  );
};

export default ListItem;
