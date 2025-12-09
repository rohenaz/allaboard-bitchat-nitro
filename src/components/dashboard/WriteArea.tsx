/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { last } from 'lodash';
import moment from 'moment';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { HiPlusCircle } from 'react-icons/hi';
import { IoMdClose } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useActiveUser } from '../../hooks';
import { receiveNewMessage } from '../../reducers/chatReducer';
import type { AppDispatch, RootState } from '../../store';
import { FetchStatus } from '../../utils/common';
import { toB64 } from '../../utils/file';
import FileRenderer, { type MediaType } from '../dashboard/FileRenderer';

export interface PendingFile {
	name: string;
	size: number;
	type: string;
	data: string;
}

type Profile = {
	paymail?: string;
	displayName?: string;
	avatar?: string;
};

interface ActiveUser {
	_id: string;
	idKey: string;
	paymail: string;
}

interface TypingUser {
	paymail: string;
}

interface BmapTx {
	B: Array<{
		encoding: string;
		content: string;
	}>;
	MAP: Array<{
		app?: string;
		type?: string;
		paymail?: string;
		context?: string;
		channel?: string;
		messageID?: string;
		encrypted?: string;
		bapID?: string;
		tx?: string;
	}>;
	timestamp?: number;
	blk?: {
		t: number;
	};
	tx: {
		h: string;
	};
}

const WriteArea = () => {
	const { authToken, profile } = useHandcash();
	const { pandaProfile } = useYours();
	const { sendMessage: postMessage, postStatus, pendingFiles, setPendingFiles } = useBitcoin();
	const params = useParams();
	const [searchParams] = useSearchParams();
	const dispatch = useDispatch<AppDispatch>();
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const activeUser = useActiveUser() as ActiveUser | null;

	const friendRequests = useSelector((state: RootState) => state.memberList.friendRequests);
	const loadingMembers = useSelector((state: RootState) => state.memberList.loading);
	const loadingChannels = useSelector((state: RootState) => state.channels.loading);
	const loadingMessages = useSelector((state: RootState) => state.chat.messages.loading);
	const session = useSelector((state: RootState) => state.session);
	const typingUser = useSelector((state: RootState) => state.chat.typingUser) as TypingUser | null;

	const activeChannelId = params.channel;
	const activeUserId = params.user;
	const pendingMessage = searchParams.get('m');
	const [messageContent, setMessageContent] = useState(pendingMessage || '');

	const channelName =
		activeChannelId || activeUserId || last(window?.location?.pathname?.split('/'));

	const isAuthenticated = session.isAuthenticated;

	const self = useMemo(() => {
		return activeUser && session.user?.bapId === activeUser._id;
	}, [session.user?.bapId, activeUser]);

	const isDisabled = useMemo(() => {
		if (activeChannelId) {
			return !isAuthenticated;
		}

		if (activeUserId) {
			if (self) return false;

			const hasFriendship =
				activeUser &&
				friendRequests.incoming.allIds.includes(activeUser._id) &&
				friendRequests.outgoing.allIds.includes(activeUser._id);

			return !hasFriendship;
		}

		return !isAuthenticated;
	}, [isAuthenticated, activeChannelId, activeUserId, activeUser, self, friendRequests]);

	const handlePlusClick = useCallback(() => {
		if (postStatus === FetchStatus.Loading) return;
		fileInputRef.current?.click();
	}, [postStatus]);

	const handleFileChange = useCallback(
		async (e: ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || []);
			if (files.length === 0) return;

			const newPendingFiles = await Promise.all(
				files.map(async (file) => {
					const data = await toB64(file);
					return {
						name: file.name,
						size: file.size,
						type: file.type,
						data: data.split(',')[1],
					};
				}),
			);

			setPendingFiles((prev) => [...prev, ...newPendingFiles]);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		},
		[setPendingFiles],
	);

	const handleSubmit = useCallback(
		async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();

			if (!isAuthenticated) {
				return;
			}

			const form = e.currentTarget;
			const formElement = form.elements.namedItem('msg_content') as HTMLTextAreaElement | null;
			const content = formElement?.value || '';
			const hasContent = content !== '' || pendingFiles.length > 0;

			if (hasContent) {
				try {
					let paymail = 'anonymous@yours.org';

					const handcashProfile = profile as Profile | undefined;
					const yoursProfile = pandaProfile as Profile | undefined;

					if (authToken && handcashProfile?.paymail) {
						paymail = handcashProfile.paymail;
					} else if (yoursProfile?.paymail) {
						paymail = yoursProfile.paymail;
					} else if (activeUser?.paymail) {
						paymail = activeUser.paymail;
					}

					const channel = channelName || '';

					if (!channel) {
						console.error('Channel name is required');
						return;
					}

					await postMessage(paymail, content, channel, activeUserId || '');

					setMessageContent('');
					form.reset();
				} catch (error) {
					console.error('Failed to send message:', error);
					const errorMessage: BmapTx = {
						B: [
							{
								encoding: 'utf8',
								content: 'Error: Failed to send',
							},
						],
						MAP: [
							{
								app: 'bitchatnitro.com',
								type: 'message',
								paymail: 'system@bitchatnitro.com',
							},
						],
						timestamp: moment().unix(),
						blk: { t: moment().unix() },
						tx: { h: 'error' },
					};
					dispatch(receiveNewMessage(errorMessage));
				}
			}
		},
		[
			isAuthenticated,
			authToken,
			pandaProfile,
			activeUser,
			profile,
			channelName,
			activeUserId,
			pendingFiles,
			postMessage,
			dispatch,
		],
	);

	const handleKeyPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			const form = e.currentTarget.form;
			if (form) {
				const submitEvent = new Event('submit', {
					cancelable: true,
					bubbles: true,
				});
				form.dispatchEvent(submitEvent);
			}
		}
	}, []);

	const hasContent = messageContent.trim().length > 0;
	const hasFiles = pendingFiles?.length > 0;

	const getPlaceholder = () => {
		if (activeUserId) {
			if (!activeUser?.idKey && activeUser) return 'DMs Disabled';
			if (activeUser && loadingMembers) return 'Loading members...';
			return `Message @${activeUserId}`;
		}
		if (activeChannelId) {
			if (loadingChannels) return 'Loading channels...';
			return `Message #${activeChannelId}`;
		}
		if (loadingMessages) return 'Loading messages...';
		if (postStatus === FetchStatus.Loading) return 'Posting...';
		return 'Message in global chat';
	};

	return (
		<div className="p-4 flex flex-col bg-background">
			{pendingFiles && pendingFiles.length > 0 && (
				<div className="flex flex-wrap gap-2 w-full py-2 mb-2">
					{pendingFiles.map((file, idx) => (
						<div
							key={file.name}
							className="relative w-[120px] h-[120px] rounded-lg overflow-hidden bg-muted"
						>
							<div className="w-full h-full flex items-center justify-center [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_audio]:w-full [&_audio]:h-full">
								<FileRenderer
									type={file.type.split('/')[0] as MediaType}
									data={`data:${file.type};base64,${file.data}`}
								/>
							</div>
							<div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-background/80 text-foreground text-xs truncate">
								{file.name}
							</div>
							<button
								type="button"
								onClick={() => {
									const newFiles = [...pendingFiles];
									newFiles.splice(idx, 1);
									setPendingFiles(newFiles);
								}}
								className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 text-foreground border-none cursor-pointer flex items-center justify-center transition-colors hover:bg-destructive"
								aria-label="Remove attachment"
							>
								<IoMdClose size={16} />
							</button>
						</div>
					))}
				</div>
			)}

			<form onSubmit={handleSubmit} autoComplete="off" className="relative flex items-end">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={handlePlusClick}
					disabled={postStatus === FetchStatus.Loading}
					className="absolute left-1 bottom-1 z-10 text-muted-foreground hover:text-primary"
					aria-label="Add attachment"
				>
					<HiPlusCircle className="w-6 h-6" />
				</Button>

				<input
					type="file"
					ref={fileInputRef}
					onChange={handleFileChange}
					className="hidden"
					multiple
				/>

				<Textarea
					ref={inputRef}
					name="msg_content"
					placeholder={getPlaceholder()}
					value={messageContent}
					onChange={(e) => setMessageContent(e.target.value)}
					onKeyPress={handleKeyPress}
					disabled={isDisabled}
					className={cn(
						'min-h-[44px] max-h-[50vh] pl-12 pr-20 resize-none',
						'bg-muted/50 border-primary/10',
						'focus-visible:ring-primary focus-visible:border-primary',
						'transition-all duration-200',
					)}
				/>

				<Button
					type="submit"
					disabled={isDisabled || (!hasContent && !hasFiles)}
					className={cn(
						'absolute right-2 bottom-2',
						!hasContent && !hasFiles && 'bg-muted-foreground',
					)}
				>
					Send
				</Button>
			</form>

			{typingUser && (
				<div className="absolute bottom-16 text-muted-foreground text-sm italic">
					{typingUser.paymail} is typing...
				</div>
			)}
		</div>
	);
};

export default WriteArea;
