import type { ReactNode } from 'react';
import {
  ContextMenu as ShadcnContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './context-menu';

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  separator?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  children: ReactNode;
  items: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ children, items }) => {
  return (
    <ShadcnContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {items.map((item) =>
          item.separator ? (
            <ContextMenuSeparator key={item.id} />
          ) : (
            <ContextMenuItem key={item.id} onClick={item.onClick}>
              {item.icon}
              <span>{item.label}</span>
            </ContextMenuItem>
          )
        )}
      </ContextMenuContent>
    </ShadcnContextMenu>
  );
};