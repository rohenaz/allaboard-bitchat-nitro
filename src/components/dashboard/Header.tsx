import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { FaCog, FaGithub, FaSignInAlt, FaSignOutAlt, FaUserFriends } from 'react-icons/fa';
import { ImProfile } from 'react-icons/im';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getBitchatServer } from '../../constants/servers';
import { useHandcash } from '../../context/handcash';
import { useActiveUser } from '../../hooks';
import { toggleMemberList } from '../../reducers/memberListReducer';
import { logout } from '../../reducers/sessionReducer';
import type { RootState } from '../../store';
import ArrowTooltip from './ArrowTooltip';
import { UserSearch } from './UserSearch';

interface HeaderProps {
	isFriendsPage?: boolean;
}

const Header = ({ isFriendsPage = false }: HeaderProps): ReactElement => {
	const dispatch = useDispatch();
	const params = useParams<{ channel?: string; user?: string }>();
	const isMemberListOpen = useSelector((state: RootState) => state.memberList.isOpen);
	const channels = useSelector((state: RootState) => state.channels);
	const session = useSelector((state: RootState) => state.session);
	const activeUser = useActiveUser();
	const navigate = useNavigate();
	const { authToken, profile } = useHandcash();

	const activeChannelId = useMemo(() => params.channel, [params]);
	const activeUserId = useMemo(() => params.user, [params]);
	const guest = useMemo(() => !authToken && !activeUser, [authToken, activeUser]);

	const channelName = useMemo(() => {
		if (isFriendsPage) return 'Friends';
		if (!channels?.loading && activeChannelId) return activeChannelId;
		if (profile?.paymail) return profile.paymail;
		if (activeUser?.paymail) return activeUser.paymail;
		if (activeUserId) return activeUserId;
		return 'general';
	}, [
		isFriendsPage,
		channels?.loading,
		activeChannelId,
		profile?.paymail,
		activeUser?.paymail,
		activeUserId,
	]);

	return (
		<header className="flex items-center justify-between h-12 min-h-[48px] bg-background border-b border-border px-4 relative z-10">
			<div className="flex items-center flex-1 min-w-0">
				<SidebarTrigger className="md:hidden" />

				<div className="flex items-center min-w-0">
					{activeChannelId && (
						<span className="text-muted-foreground text-2xl font-semibold mr-2">#</span>
					)}
					{activeUserId && (
						<span className="text-muted-foreground text-2xl font-semibold mr-2">@</span>
					)}
					<h1 className="text-base font-semibold leading-5 text-foreground m-0 overflow-hidden text-ellipsis whitespace-nowrap">
						{channelName}
					</h1>
				</div>
			</div>

			<div className="flex items-center justify-center flex-1 max-w-[400px] px-4">
				{isFriendsPage && <UserSearch />}
			</div>

			<div className="flex items-center gap-2">
				<ArrowTooltip title="Settings">
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => navigate(`/servers/${getBitchatServer()._id}`)}
					>
						<FaCog className="h-5 w-5" />
					</Button>
				</ArrowTooltip>

				<ArrowTooltip title="GitHub Repository">
					<Button variant="ghost" size="icon" className="h-6 w-6" asChild>
						<a
							href="https://github.com/rohenaz/allaboard-bitchat-nitro"
							target="_blank"
							rel="noopener noreferrer"
						>
							<FaGithub className="h-5 w-5" />
						</a>
					</Button>
				</ArrowTooltip>

				<ArrowTooltip title={`${isMemberListOpen ? 'Hide' : 'Show'} Member List`}>
					<Button
						variant="ghost"
						size="icon"
						className={`h-6 w-6 ${isMemberListOpen ? 'text-primary' : ''}`}
						onClick={() => dispatch(toggleMemberList())}
					>
						<FaUserFriends className="h-5 w-5" />
					</Button>
				</ArrowTooltip>

				<ArrowTooltip title="Manage Profile on Sigma">
					<Button variant="ghost" size="icon" className="h-6 w-6" asChild>
						<a
							href={`https://auth.sigmaidentity.com/account${session.user?.idKey ? `/${session.user.idKey}` : ''}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ImProfile className="h-5 w-5" />
						</a>
					</Button>
				</ArrowTooltip>

				{!guest && (
					<ArrowTooltip title="Sign Out">
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={() => dispatch(logout())}
						>
							<FaSignOutAlt className="h-5 w-5" />
						</Button>
					</ArrowTooltip>
				)}

				{guest && (
					<ArrowTooltip title="Sign In">
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={() => navigate('/login')}
						>
							<FaSignInAlt className="h-5 w-5" />
						</Button>
					</ArrowTooltip>
				)}
			</div>
		</header>
	);
};

export default Header;
