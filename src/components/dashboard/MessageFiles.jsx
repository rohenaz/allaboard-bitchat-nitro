import { useState } from 'react';
import styled from 'styled-components';
import MessageFile from './MessageFile';
import FilePreviewModal from './modals/FilePreviewModal';

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 8px 0;
  padding: 8px 16px 12px 0;
  position: relative;
  gap: 8px;
`;

const MessageFiles = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <>
      <Container>
        {files.map((file) => (
          <MessageFile
            key={file.txid || file.name || file.url}
            file={file}
            onClick={() => setSelectedFile(file)}
          />
        ))}
      </Container>

      <FilePreviewModal
        open={!!selectedFile}
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </>
  );
};

export default MessageFiles;
