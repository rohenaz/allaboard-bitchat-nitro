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

	// Sync mobile state when Redux state changes (from hamburger menu click)
	useEffect(() => {
		if (isMobile) {
			// On mobile, the Redux state drives the mobile state
			setMobileOpen(isOpen);
		}
	}, [isOpen, isMobile]);

	const handleOpenChange = (open: boolean) => {
		if (isMobile) {
			// On mobile, update local state immediately for responsiveness
			setMobileOpen(open);
			// Then sync Redux state if needed
			if (open !== isOpen) {
				dispatch(toggleSidebar());
			}
		} else {
			// On desktop, directly toggle Redux state
			if (open !== isOpen) {
				dispatch(toggleSidebar());
			}
		}
	};

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
