import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
	Sidebar as ShadcnSidebar,
	SidebarContent,
	SidebarFooter,
	SidebarProvider,
} from '@/components/ui/sidebar';
import type { RootState } from '../../store';
import ChannelList from './ChannelList';
import ServerList from './ServerList';
import { UserList } from './UserList';
import UserPanel from './UserPanel';

// Inner sidebar content that uses the sidebar context
function SidebarInner() {
	const params = useParams();
	const activeUserId = useMemo(() => params.user, [params]);

	return (
		<ShadcnSidebar collapsible="none" className="border-r border-border">
			<SidebarContent className="p-0 gap-0">
				{!activeUserId && <ChannelList />}
				{activeUserId && <UserList activeUserId={activeUserId} />}
			</SidebarContent>
			<SidebarFooter className="p-0">
				<UserPanel />
			</SidebarFooter>
		</ShadcnSidebar>
	);
}

// Server list sidebar (narrow icons)
function ServerSidebar() {
	return (
		<div className="flex flex-col w-[72px] h-full bg-muted py-3 flex-shrink-0">
			<ServerList />
		</div>
	);
}

const Sidebar = () => {
	const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);

	return (
		<SidebarProvider
			defaultOpen={isOpen}
			style={{ '--sidebar-width': '240px' } as React.CSSProperties}
		>
			<div className="flex h-svh">
				<ServerSidebar />
				<SidebarInner />
			</div>
		</SidebarProvider>
	);
};

export default Sidebar;
