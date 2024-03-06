import { useMemo } from "react";
import styled from "styled-components";
import { getBase64Url } from "../../utils/file";
import { FileRenderer } from "./FileRenderer";

const Container = styled.div`
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  min-width: 260px;
  max-width: 100%;
  max-height: 100%;
  position: relative;
  cursor: pointer;
  aspect-ratio: 16/9;

  @media (min-width: 768px) {
    max-width: 320px;
    max-height: 320px;
  }

  img {
    width: 100%;
    object-fit: contain;
  }
`;

const MessageFile = ({ file, onClick }) => {
  const b64 = useMemo(() => getBase64Url(file), [file]);

  if (!b64) {
    return null;
  }

  const fileType = file["content-type"].split("/")[0];

  return (
    <Container>
      <FileRenderer type={fileType} data={b64} onClick={onClick} />
    </Container>
  );
};

export default MessageFile;
