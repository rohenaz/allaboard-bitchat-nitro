import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/fetch';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadFriends } from '../../reducers/memberListReducer';
import type { AppDispatch, RootState } from '../../store';
import Avatar from './Avatar';

interface FriendRequest {
	_id: string;
	from: string;
	to: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

interface Channel {
	id: string;
	name: string;
	members: string[];
}

export const Friends = () => {
	const { authToken } = useHandcash();
	const { connected } = useYours();
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
	const [_loading, setLoading] = useState(false);

	const memberList = useSelector((state: RootState) => state.memberList);
	const session = useSelector((state: RootState) => state.session);

	const fetchFriendRequests = useCallback(async () => {
		if (!session.user?.idKey) return;

		try {
			const requests = await api.get<FriendRequest[]>('/friend-requests', {
				params: { userId: session.user.idKey },
			});
			setFriendRequests(requests);
		} catch (error) {
			console.error('Failed to fetch friend requests:', error);
		}
	}, [session.user?.idKey]);

	const handleAcceptFriend = useCallback(
		async (requestId: string) => {
			try {
				await api.put(`/friend-requests/${requestId}/accept`);
				await fetchFriendRequests();
				await dispatch(loadFriends());
			} catch (error) {
				console.error('Failed to accept friend request:', error);
			}
		},
		[dispatch, fetchFriendRequests],
	);

	const handleRejectFriend = useCallback(
		async (requestId: string) => {
			try {
				await api.put(`/friend-requests/${requestId}/reject`);
				await fetchFriendRequests();
			} catch (error) {
				console.error('Failed to reject friend request:', error);
			}
		},
		[fetchFriendRequests],
	);

	const handleStartChat = useCallback(
		async (userId: string) => {
			if (!session.user?.idKey) return;

			try {
				const channel = await api.post<Channel>('/channels', {
					type: 'dm',
					members: [session.user.idKey, userId],
				});
				navigate(`/channels/${channel.id}`);
			} catch (error) {
				console.error('Failed to create DM channel:', error);
			}
		},
		[session.user?.idKey, navigate],
	);

	useEffect(() => {
		if (authToken || connected) {
			setLoading(true);
			void dispatch(loadFriends()).finally(() => setLoading(false));
			void fetchFriendRequests();
		}
	}, [authToken, connected, dispatch, fetchFriendRequests]);

	const pendingRequests = friendRequests.filter(
		(request) =>
			request.status === 'pending' &&
			request.to === session.user?.idKey &&
			!memberList.allIds.includes(request.from),
	);

	const pendingUsers = pendingRequests.map((request) => ({
		_id: request._id,
		paymail: request.from,
		alternateName: request.from,
	}));

	return (
		<div className="bg-base-100 flex-1 overflow-hidden">
			<div className="flex flex-col h-full">
				<div className="p-4">
					<h2 className="text-lg font-bold mb-4">Friends</h2>
					<div className="flex flex-wrap gap-4">
						{memberList.allIds.map((id) => {
							const user = memberList.byId[id];
							if (!user) return null;

							return (
								<div key={id} className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
									<Avatar
										size="40px"
										paymail={user.paymail || undefined}
										icon={user.logo || undefined}
									/>
									<div>
										<div className="font-medium">{user.paymail}</div>
										<div className="flex gap-2 mt-2">
											<button
												type="button"
												className="btn btn-primary btn-sm"
												onClick={() => handleStartChat(user.idKey)}
											>
												Message
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{pendingUsers.length > 0 && (
					<div className="p-4 border-t border-base-300">
						<h3 className="text-lg font-bold mb-4">Friend Requests</h3>
						<div className="flex flex-wrap gap-4">
							{pendingUsers.map((user) => (
								<div key={user._id} className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
									<Avatar size="40px" paymail={user.paymail || undefined} />
									<div>
										<div className="font-medium">{user.paymail}</div>
										<div className="flex gap-2 mt-2">
											<button
												type="button"
												className="btn btn-primary btn-sm"
												onClick={() => handleAcceptFriend(user._id)}
											>
												Accept
											</button>
											<button
												type="button"
												className="btn btn-ghost btn-sm"
												onClick={() => handleRejectFriend(user._id)}
											>
												Reject
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
