import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
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

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 8px 0;
  padding: 8px 16px 12px 0;
  position: relative;
  gap: 8px;
`;

const MessageFiles: React.FC<MessageFilesProps> = ({ files }) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	if (!files || files.length === 0) {
		return null;
	}

	return (
		<>
			<Container>
				{files.map((file, index) => (
					<MessageFile
						key={file.txid || file.url || `file-${index}`}
						file={file}
						onClick={() => setSelectedFile(file)}
					/>
				))}
			</Container>

			<FilePreviewModal
				open={!!selectedFile}
				file={selectedFile}
				onOpenChange={(open) => !open && setSelectedFile(null)}
			/>
		</>
	);
};

export default MessageFiles;
