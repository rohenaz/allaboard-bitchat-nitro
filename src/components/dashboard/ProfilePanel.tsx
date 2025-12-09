import type React from 'react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import type { RootState } from '../../types';
import Avatar from './Avatar';

const ProfilePanel: React.FC = () => {
	const session = useSelector((state: RootState) => state.session);
	const isOpen = useSelector((state: RootState) => state.profile.isOpen);

	if (!session.user) {
		return null;
	}

	return (
		<div
			className={cn(
				'fixed bottom-0 left-[72px] w-60 h-screen bg-card border-r border-muted z-[100] transition-transform duration-200 ease-out',
				isOpen ? 'translate-x-0' : '-translate-x-full',
			)}
		>
			<div className="p-5 bg-card border-b border-muted">
				<div className="flex flex-col items-center gap-3">
					<Avatar size="80px" paymail={session.user.paymail} icon={session.user.icon || ''} />
					<div className="text-center">
						<div className="text-xl font-semibold text-foreground">{session.user.paymail}</div>
						<div className="text-sm text-muted-foreground">Online</div>
					</div>
				</div>
			</div>

			<div className="p-5 border-b border-muted">
				<h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Wallet</h3>
				<div>{session.user.wallet}</div>
			</div>

			{session.user.address && (
				<div className="p-5 border-b border-muted">
					<h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Address</h3>
					<div className="break-all">{session.user.address}</div>
				</div>
			)}
		</div>
	);
};

export default ProfilePanel;
