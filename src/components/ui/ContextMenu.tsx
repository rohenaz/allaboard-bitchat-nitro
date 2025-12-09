import type React from 'react';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

interface ContextMenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: ReactNode;
  disabled?: boolean;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const MenuContainer = styled.div`
  position: fixed;
  z-index: 10001;
  background-color: var(--popover);
  border-radius: 6px;
  box-shadow: var(--elevation-high);
  border: 1px solid var(--border);
  min-width: 180px;
  padding: 6px 0;
  animation: ${fadeIn} 0.1s ease-out;
`;

const MenuItem = styled.button<{ $danger?: boolean; $disabled?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: none;
  border: none;
  color: ${({ $danger, $disabled }) =>
    $disabled
      ? 'var(--muted-foreground)'
      : $danger
        ? 'var(--destructive)'
        : 'var(--foreground)'};
  font-size: 14px;
  font-weight: 400;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.1s ease;

  &:hover {
    background-color: ${({ $disabled, $danger }) =>
      $disabled
        ? 'transparent'
        : $danger
          ? 'var(--destructive)'
          : 'var(--accent)'};
    color: ${({ $disabled, $danger }) =>
      $disabled
        ? 'var(--muted-foreground)'
        : $danger
          ? 'white'
          : 'var(--foreground)'};
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: -2px;
  }
`;

const MenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
`;

const MenuLabel = styled.div`
  flex: 1;
  min-width: 0;
`;

const MenuSeparator = styled.div`
  height: 1px;
  background-color: var(--border);
  margin: 4px 0;
`;

const TriggerContainer = styled.div`
  display: inline-block;
`;

export const ContextMenu: FC<ContextMenuProps> = ({
  items,
  children,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (disabled) return;

      const x = e.clientX;
      const y = e.clientY;

      // Adjust position if menu would go off screen
      const menuWidth = 180;
      const menuHeight = items.length * 40; // Approximate
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + menuWidth > viewportWidth) {
        adjustedX = x - menuWidth;
      }

      if (y + menuHeight > viewportHeight) {
        adjustedY = y - menuHeight;
      }

      setPosition({ x: adjustedX, y: adjustedY });
      setIsVisible(true);
    },
    [disabled, items.length],
  );

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled) return;
      item.onClick();
      handleClose();
    },
    [handleClose],
  );

  // Close menu on click outside or escape
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, handleClose]);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (isVisible && menuRef.current) {
      const firstItem = menuRef.current.querySelector(
        'button:not([disabled])',
      ) as HTMLButtonElement;
      if (firstItem) {
        firstItem.focus();
      }
    }
  }, [isVisible]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isVisible) return;

      const menuItems = menuRef.current?.querySelectorAll(
        'button:not([disabled])',
      ) as NodeListOf<HTMLButtonElement>;
      if (!menuItems || menuItems.length === 0) return;

      const currentIndex = Array.from(menuItems).findIndex(
        (item) => item === document.activeElement,
      );

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % menuItems.length;
          menuItems[nextIndex].focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex =
            currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
          menuItems[prevIndex].focus();
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          (document.activeElement as HTMLButtonElement)?.click();
          break;
      }
    },
    [isVisible],
  );

  return (
    <>
      <TriggerContainer ref={triggerRef} onContextMenu={handleContextMenu}>
        {children}
      </TriggerContainer>

      {isVisible && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              background: 'transparent',
            }}
            onClick={handleClose}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClose();
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close menu"
          />

          {/* Menu */}
          <MenuContainer
            ref={menuRef}
            style={{
              left: position.x,
              top: position.y,
            }}
            onKeyDown={handleKeyDown}
            role="menu"
            aria-orientation="vertical"
          >
            {items.map((item) =>
              item.separator ? (
                <MenuSeparator key={item.id} />
              ) : (
                <MenuItem
                  key={item.id}
                  $danger={item.danger}
                  $disabled={item.disabled}
                  disabled={item.disabled}
                  onClick={() => handleItemClick(item)}
                  role="menuitem"
                  aria-disabled={item.disabled}
                >
                  {item.icon && <MenuIcon>{item.icon}</MenuIcon>}
                  <MenuLabel>{item.label}</MenuLabel>
                </MenuItem>
              ),
            )}
          </MenuContainer>
        </>
      )}
    </>
  );
};
