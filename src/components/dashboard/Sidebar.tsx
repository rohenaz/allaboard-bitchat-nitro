import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar as ShadcnSidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import ChannelList from './ChannelList';
import { MobileSidebarProvider } from './MobileSidebarProvider';
import ServerList from './ServerList';
import { UserList } from './UserList';
import UserPanel from './UserPanel';

// Inner sidebar content that uses the sidebar context
function SidebarInner() {
	const params = useParams();
	const activeUserId = useMemo(() => params.user, [params]);

	return (
		<ShadcnSidebar collapsible="offcanvas" className="border-r border-border">
			<div className="flex h-full">
				{/* Server list for mobile - shown inside the sidebar */}
				<div className="flex md:hidden flex-col w-[72px] h-full bg-muted py-3 flex-shrink-0">
					<ServerList />
				</div>
				<div className="flex-1 flex flex-col">
					<SidebarContent className="p-0 gap-0">
						{!activeUserId && <ChannelList />}
						{activeUserId && <UserList activeUserId={activeUserId} />}
					</SidebarContent>
					<SidebarFooter className="p-0">
						<UserPanel />
					</SidebarFooter>
				</div>
			</div>
		</ShadcnSidebar>
	);
}

// Server list sidebar (narrow icons)
function ServerSidebar() {
	return (
		<div className="hidden md:flex flex-col w-[72px] h-full bg-muted py-3 flex-shrink-0">
			<ServerList />
		</div>
	);
}

const Sidebar = () => {
	return (
		<MobileSidebarProvider>
			<div className="flex h-svh">
				<ServerSidebar />
				<SidebarInner />
			</div>
		</MobileSidebarProvider>
	);
};

export default Sidebar;
