import { css } from 'styled-components';
import tw from 'twin.macro';

export const hideInDesktop = css`
  @media (min-width: 768px) {
    display: none;
  }
`;

export const interactiveColor = css`
  color: var(--channels-default);
  &:hover {
    color: var(--interactive-hover);
  }
  &:active {
    color: var(--interactive-active);
  }
`;

export const textLink = css`
  color: var(--text-link);
  &:hover {
    text-decoration: underline;
  }
`;

export const scrollbar = css`
  ::-webkit-scrollbar {
    width: 16px;
    height: 16px;
  }

  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thin-thumb);
    border: 4px solid transparent;
    border-radius: 8px;
    min-height: 40px;
    background-clip: padding-box;
  }

  ::-webkit-scrollbar-track {
    border: 4px solid transparent;
    background-clip: padding-box;
    background-color: var(--scrollbar-thin-track);
    border-radius: 8px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-thin-thumb-hover);
  }
`;

export const scrollbarLight = css`
  ::-webkit-scrollbar {
    width: 16px;
    height: 16px;
  }

  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-auto-thumb);
    border: 4px solid transparent;
    border-radius: 8px;
    min-height: 40px;
    background-clip: padding-box;
  }

  ::-webkit-scrollbar-track {
    border: 4px solid transparent;
    background-clip: padding-box;
    background-color: var(--scrollbar-auto-track);
    border-radius: 8px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-auto-thumb-hover);
  }
`;
