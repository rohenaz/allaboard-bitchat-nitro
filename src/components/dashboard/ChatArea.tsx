import type React from 'react';
import Messages from './Messages';
import WriteArea from './WriteArea';

const ChatArea: React.FC = () => {
	return (
		<main className="flex flex-col flex-1 min-w-0 min-h-0 h-full bg-background relative">
			<Messages />
			<WriteArea />
		</main>
	);
};

export default ChatArea;
