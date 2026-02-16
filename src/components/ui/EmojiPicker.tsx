import { EmojiPicker as FrimoussePicker } from 'frimousse';
import type { FC } from 'react';

interface EmojiPickerProps {
	onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker: FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
	return (
		<div className="emoji-picker">
			<FrimoussePicker.Root className="flex h-[368px] w-fit flex-col bg-card rounded-lg border">
				<FrimoussePicker.Search
					className="z-10 mx-2 mt-2 mb-1 appearance-none rounded-md bg-input px-2.5 py-2 text-sm border-none text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
					placeholder="Search for emoji..."
				/>
				<FrimoussePicker.Viewport className="relative flex-1 outline-none overflow-hidden">
					<FrimoussePicker.Loading className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
						Loading emojis...
					</FrimoussePicker.Loading>
					<FrimoussePicker.Empty className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
						No emoji found.
					</FrimoussePicker.Empty>
					<FrimoussePicker.List
						className="select-none pb-1.5 overflow-y-auto h-full"
						components={{
							CategoryHeader: ({ category, ...props }) => (
								<div
									className="bg-card px-3 pt-3 pb-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider"
									{...props}
								>
									{category.label}
								</div>
							),
							Row: ({ children, ...props }) => (
								<div className="px-1.5" {...props}>
									{children}
								</div>
							),
							Emoji: ({ emoji, ...props }) => (
								<button
									type="button"
									onClick={() => onEmojiSelect(emoji.emoji)}
									className="flex w-8 h-8 items-center justify-center rounded-md text-lg border-none bg-transparent cursor-pointer transition-colors hover:bg-accent data-[active]:bg-accent"
									title={emoji.label}
									{...props}
								>
									{emoji.emoji}
								</button>
							),
						}}
					/>
				</FrimoussePicker.Viewport>
			</FrimoussePicker.Root>
		</div>
	);
};