import React from 'react';
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '../../config/constants';

interface AvatarProps {
	size?: string;
	paymail?: string;
	icon?: string;
	status?: 'online' | 'offline' | 'away' | 'dnd';
	showStatus?: boolean;
	className?: string;
}

const statusColors = {
	online: 'bg-green-500',
	offline: 'bg-gray-400',
	away: 'bg-yellow-500',
	dnd: 'bg-red-500',
} as const;

const Avatar: React.FC<AvatarProps> = ({
	size = '32px',
	paymail,
	icon,
	status = 'offline',
	showStatus = false,
	className,
}) => {
	const avatarUrl = icon
		? icon
		: paymail
			? `${API_BASE_URL}/ordinals/avatar/${paymail}`
			: undefined;

	const getInitials = (email?: string) => {
		if (!email) return '?';
		return email.charAt(0).toUpperCase();
	};

	// Convert size string to className
	const sizeClass =
		size === '24px'
			? 'h-6 w-6'
			: size === '32px'
				? 'h-8 w-8'
				: size === '40px'
					? 'h-10 w-10'
					: size === '48px'
						? 'h-12 w-12'
						: 'h-8 w-8';

	const statusSizeClass =
		size === '24px'
			? 'h-2 w-2'
			: size === '32px'
				? 'h-2.5 w-2.5'
				: size === '40px'
					? 'h-3 w-3'
					: size === '48px'
						? 'h-3.5 w-3.5'
						: 'h-2.5 w-2.5';

	return (
		<div className="relative inline-block">
			<ShadcnAvatar
				className={cn(
					sizeClass,
					'border-2 border-border hover:border-ring hover:scale-105 transition-all duration-200 cursor-pointer',
					className,
				)}
			>
				{avatarUrl && <AvatarImage src={avatarUrl} alt={paymail || 'Avatar'} />}
				<AvatarFallback className="bg-muted text-sm font-medium">
					{getInitials(paymail)}
				</AvatarFallback>
			</ShadcnAvatar>

			{showStatus && (
				<span
					className={cn(
						'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
						statusSizeClass,
						statusColors[status],
					)}
				/>
			)}
		</div>
	);
};

export default Avatar;
