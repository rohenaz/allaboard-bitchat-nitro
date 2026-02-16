import type React from 'react';
import { useMemo } from 'react';
import { getBase64Url } from '../../utils/file';
import FileRenderer, { type MediaType } from './FileRenderer';

interface MessageFileProps {
	file: {
		'content-type'?: string;
		media_type?: string;
	};
	onClick?: () => void;
}

const MessageFile: React.FC<MessageFileProps> = ({ file, onClick }) => {
	const b64 = useMemo(() => getBase64Url(file), [file]);

	if (!b64) {
		return null;
	}

	const contentType = file['content-type'] ?? file.media_type;
	const fileType = contentType?.split('/')[0];

	return (
		<div className="flex-1 rounded-lg overflow-hidden min-w-[260px] max-w-full max-h-full relative cursor-pointer aspect-video md:max-w-[320px] md:max-h-[320px] [&>img]:w-full [&>img]:object-contain">
			<FileRenderer type={fileType as MediaType} data={b64} onClick={onClick} />
		</div>
	);
};

export default MessageFile;
