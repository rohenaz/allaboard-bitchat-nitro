import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { toggleSidebar } from '../../reducers/sidebarReducer';
import type { RootState } from '../../store';

interface MobileSidebarProviderProps {
	children: React.ReactNode;
}

export function MobileSidebarProvider({ children }: MobileSidebarProviderProps) {
	const dispatch = useDispatch();
	const isMobile = useIsMobile();
	const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
	const [mobileOpen, setMobileOpen] = useState(false);

	// Handle mobile/desktop state transitions
	useEffect(() => {
		if (isMobile) {
			// On mobile, use local state for sidebar
			setMobileOpen(false);
		}
	}, [isMobile]);

	const handleOpenChange = (open: boolean) => {
		if (isMobile) {
			setMobileOpen(open);
			// Update Redux state to keep in sync
			if (open !== isOpen) {
				dispatch(toggleSidebar());
			}
		} else {
			// On desktop, use Redux state
			if (open !== isOpen) {
				dispatch(toggleSidebar());
			}
		}
	};

	// Sync mobile state when Redux state changes (from hamburger menu click)
	useEffect(() => {
		if (isMobile) {
			setMobileOpen(isOpen);
		}
	}, [isOpen, isMobile]);

	return (
		<SidebarProvider
			open={isMobile ? mobileOpen : isOpen}
			onOpenChange={handleOpenChange}
			style={{ '--sidebar-width': '240px' } as React.CSSProperties}
		>
			{children}
		</SidebarProvider>
	);
}
