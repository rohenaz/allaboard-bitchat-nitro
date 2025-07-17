import { EmojiPicker as FrimoussePicker } from 'frimousse';
import type { FC } from 'react';
import styled from 'styled-components';

const StyledEmojiPicker = styled.div`
  .frimousse-root {
    display: flex;
    height: 368px;
    width: fit-content;
    flex-direction: column;
    background-color: var(--background-secondary);
    border-radius: 8px;
    border: 1px solid var(--background-modifier-border);
  }

  .frimousse-search {
    z-index: 10;
    margin: 8px;
    margin-bottom: 4px;
    appearance: none;
    border-radius: 6px;
    background-color: var(--channeltextarea-background);
    padding: 8px 10px;
    font-size: 14px;
    border: none;
    color: var(--text-normal);
    
    &:focus {
      outline: 2px solid var(--brand-experiment);
      outline-offset: -2px;
    }
  }

  .frimousse-viewport {
    position: relative;
    flex: 1;
    outline: none;
    overflow: hidden;
  }

  .frimousse-loading,
  .frimousse-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 14px;
  }

  .frimousse-list {
    user-select: none;
    padding-bottom: 6px;
    overflow-y: auto;
    height: 100%;
  }

  .frimousse-category-header {
    background-color: var(--background-secondary);
    padding: 12px 12px 6px;
    font-weight: 600;
    color: var(--text-muted);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .frimousse-row {
    scroll-margin: 6px;
    padding: 0 6px;
  }

  .frimousse-emoji {
    display: flex;
    width: 32px;
    height: 32px;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 18px;
    border: none;
    background: none;
    cursor: pointer;
    transition: background-color 0.1s;

    &:hover,
    &[data-active] {
      background-color: var(--background-modifier-hover);
    }
  }
`;

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker: FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  return (
    <StyledEmojiPicker>
      <FrimoussePicker.Root className="frimousse-root">
        <FrimoussePicker.Search
          className="frimousse-search"
          placeholder="Search for emoji..."
        />
        <FrimoussePicker.Viewport className="frimousse-viewport">
          <FrimoussePicker.Loading className="frimousse-loading">
            Loading emojis...
          </FrimoussePicker.Loading>
          <FrimoussePicker.Empty className="frimousse-empty">
            No emoji found.
          </FrimoussePicker.Empty>
          <FrimoussePicker.List
            className="frimousse-list"
            components={{
              CategoryHeader: ({ category, ...props }) => (
                <div className="frimousse-category-header" {...props}>
                  {category.label}
                </div>
              ),
              Row: ({ children, ...props }) => (
                <div className="frimousse-row" {...props}>
                  {children}
                </div>
              ),
              Emoji: ({ emoji, ...props }) => (
                <button
                  type="button"
                  onClick={() => onEmojiSelect(emoji.emoji)}
                  className="frimousse-emoji"
                  title={emoji.label}
                  {...props}
                >
                  {emoji.emoji}
                </button>
              ),
            }}
          />
        </FrimoussePicker.Viewport>
      </FrimoussePicker.Root>
    </StyledEmojiPicker>
  );
};
