import { Settings } from 'lucide-react';
import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { logout } from '../../reducers/sessionReducer';
import { toggleSettings } from '../../reducers/settingsReducer';
import type { RootState } from '../../store';
import Avatar from './Avatar';

const UserPanel: FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const user = useSelector((state: RootState) => state.session.user);

	const _handleSignOut = async () => {
		dispatch(logout());
		navigate('/');
	};

	const handleSettingsClick = () => {
		dispatch(toggleSettings());
	};

	// Display name with paymail as fallback
	const displayName = user?.displayName || user?.paymail || 'Guest';

	return (
		<div className="flex items-center px-2 h-[52px] min-h-[52px] bg-card border-t border-border relative">
			<div className="flex items-center flex-1 min-w-0 cursor-pointer px-2 py-0.5 rounded hover:bg-accent transition-colors">
				<Avatar size="32px" paymail={user?.paymail} icon={user?.avatar} />
				<div className="ml-2 flex-1 min-w-0">
					<div className="text-sm font-semibold leading-[18px] text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
						{displayName}
					</div>
					<div className="text-xs leading-4 text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
						{user?.wallet === 'sigma'
							? 'Sigma Identity'
							: user?.wallet === 'yours'
								? 'Yours Wallet'
								: user?.wallet === 'handcash'
									? 'HandCash'
									: user?.wallet
										? user.wallet
										: 'Not connected'}
					</div>
				</div>
			</div>

			<div className="flex items-center">
				<Button
					variant="ghost"
					size="icon"
					onClick={handleSettingsClick}
					title="User Settings"
					className="h-8 w-8 text-muted-foreground hover:text-foreground"
				>
					<Settings className="h-5 w-5" />
				</Button>
			</div>
		</div>
	);
};

export default UserPanel;
