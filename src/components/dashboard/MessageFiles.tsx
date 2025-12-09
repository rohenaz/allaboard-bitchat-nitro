import type React from 'react';
import { useState } from 'react';
import MessageFile from './MessageFile';
import FilePreviewModal from './modals/FilePreviewModal';

interface File {
	txid?: string;
	name?: string;
	url?: string;
	'content-type'?: string;
	media_type?: string;
}

interface MessageFilesProps {
	files?: File[];
}

const MessageFiles: React.FC<MessageFilesProps> = ({ files }) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	if (!files || files.length === 0) {
		return null;
	}

	return (
		<>
			<div className="flex flex-wrap my-2 pr-4 pb-3 relative gap-2">
				{files.map((file, index) => (
					<MessageFile
						key={file.txid || file.url || `file-${index}`}
						file={file}
						onClick={() => setSelectedFile(file)}
					/>
				))}
			</div>

			<FilePreviewModal
				open={!!selectedFile}
				file={selectedFile}
				onOpenChange={(open) => !open && setSelectedFile(null)}
			/>
		</>
	);
};

export default MessageFiles;
