import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { autofill } from '../../../api/bmap';
import { api } from '../../../api/fetch';
import { loadChannels } from '../../../reducers/channelsReducer';
import type { AppDispatch, RootState } from '../../../store';

interface Channel {
	id: string;
	name: string;
	members: string[];
}

interface DirectMessageModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const DirectMessageModal = ({ open, onOpenChange }: DirectMessageModalProps) => {
	const [username, setUsername] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.session.user);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		if (!currentUser?.idKey) {
			setError('Not logged in');
			setIsLoading(false);
			return;
		}

		try {
			// Find user by username using autofill
			const users = await autofill(username);

			const targetUser = users.find(
				(user) =>
					user.name.toLowerCase() === username.toLowerCase() ||
					user.paymail?.toLowerCase() === username.toLowerCase(),
			);
			if (!targetUser) {
				setError('User not found');
				setIsLoading(false);
				return;
			}

			// Create DM channel
			const channel = await api.post<Channel>('/channels', {
				type: 'dm',
				members: [currentUser.idKey, targetUser.idKey],
			});

			await dispatch(loadChannels());
			navigate(`/channels/${channel.id}`);
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create DM');
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setUsername(e.target.value);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[440px]">
				<DialogHeader>
					<DialogTitle>Start Direct Message</DialogTitle>
					<DialogDescription>
						Enter a username or paymail to start a conversation.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					{error && (
						<div className="mb-4 rounded-md border-l-4 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div className="mb-4">
						<Input
							type="text"
							placeholder="Enter username or paymail"
							value={username}
							onChange={handleInputChange}
							disabled={isLoading}
							autoFocus
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!username.trim() || isLoading}>
							{isLoading ? 'Creating...' : 'Start Conversation'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default DirectMessageModal;
