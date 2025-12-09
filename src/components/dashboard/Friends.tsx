import { Clock, MessageCircle, UserCheck, UserMinus, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
	const [loading, setLoading] = useState(false);

	const memberList = useSelector((state: RootState) => state.memberList);
	const session = useSelector((state: RootState) => state.session);

	// Get outgoing friend requests from Redux
	const outgoingRequests = memberList.friendRequests.outgoing;
	const _incomingReduxRequests = memberList.friendRequests.incoming;

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
		<div className="bg-background flex-1 overflow-hidden">
			<ScrollArea className="h-full">
				<div className="flex flex-col p-6 space-y-6">
					{/* Friends Section */}
					<section>
						<div className="flex items-center gap-2 mb-4">
							<Users className="h-5 w-5 text-muted-foreground" />
							<h2 className="text-lg font-semibold">Friends</h2>
							<Badge variant="secondary">{memberList.allIds.length}</Badge>
						</div>
						{loading ? (
							<div className="text-muted-foreground text-sm">Loading friends...</div>
						) : memberList.allIds.length === 0 ? (
							<Card>
								<CardContent className="py-8 text-center text-muted-foreground">
									<Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p>No friends yet</p>
									<p className="text-sm mt-2">Send friend requests to connect with others</p>
								</CardContent>
							</Card>
						) : (
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{memberList.allIds.map((id) => {
									const user = memberList.byId[id];
									if (!user) return null;

									return (
										<Card key={id}>
											<CardContent className="flex items-center gap-4 p-4">
												<Avatar
													size="48px"
													paymail={user.paymail || undefined}
													icon={user.logo || undefined}
												/>
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">
														{user.displayName || user.paymail?.split('@')[0]}
													</div>
													<div className="text-sm text-muted-foreground truncate">
														{user.paymail}
													</div>
												</div>
												<Button size="sm" onClick={() => handleStartChat(user.idKey)}>
													<MessageCircle className="h-4 w-4 mr-1" />
													Message
												</Button>
											</CardContent>
										</Card>
									);
								})}
							</div>
						)}
					</section>

					{/* Incoming Friend Requests Section */}
					{pendingUsers.length > 0 && (
						<>
							<Separator />
							<section>
								<div className="flex items-center gap-2 mb-4">
									<UserPlus className="h-5 w-5 text-muted-foreground" />
									<h3 className="text-lg font-semibold">Incoming Requests</h3>
									<Badge variant="destructive">{pendingUsers.length}</Badge>
								</div>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{pendingUsers.map((user) => (
										<Card key={user._id}>
											<CardContent className="flex items-center gap-4 p-4">
												<Avatar size="48px" paymail={user.paymail || undefined} />
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">{user.paymail}</div>
													<div className="text-sm text-muted-foreground">Wants to be friends</div>
												</div>
												<div className="flex gap-2">
													<Button
														size="sm"
														onClick={() => handleAcceptFriend(user._id)}
														title="Accept request"
													>
														<UserCheck className="h-4 w-4" />
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleRejectFriend(user._id)}
														title="Decline request"
													>
														<UserMinus className="h-4 w-4" />
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</section>
						</>
					)}

					{/* Outgoing Friend Requests Section */}
					{outgoingRequests.allIds.length > 0 && (
						<>
							<Separator />
							<section>
								<div className="flex items-center gap-2 mb-4">
									<Clock className="h-5 w-5 text-muted-foreground" />
									<h3 className="text-lg font-semibold">Pending Sent Requests</h3>
									<Badge variant="outline">{outgoingRequests.allIds.length}</Badge>
								</div>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{outgoingRequests.allIds.map((bapId) => {
										const request = outgoingRequests.byId[bapId];
										const signer = request?.signer;
										return (
											<Card key={bapId} className="border-dashed">
												<CardContent className="flex items-center gap-4 p-4">
													<Avatar
														size="48px"
														paymail={signer?.paymail || undefined}
														icon={signer?.logo || undefined}
													/>
													<div className="flex-1 min-w-0">
														<div className="font-medium truncate">
															{signer?.displayName ||
																signer?.paymail?.split('@')[0] ||
																bapId.slice(0, 12)}
														</div>
														<div className="text-sm text-muted-foreground">Request pending</div>
													</div>
													<Badge variant="secondary">
														<Clock className="h-3 w-3 mr-1" />
														Pending
													</Badge>
												</CardContent>
											</Card>
										);
									})}
								</div>
							</section>
						</>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};
