import { Modal } from "@mui/material";
import React, { useCallback, useRef } from "react";
import { HiUpload } from "react-icons/hi";
import styled from "styled-components";
export const costPerUnit = 0.025;
export const minutesPerUnit = 10;

const PopupMessageContainer = styled.div`
  padding: 16px;

  h2 {
    padding-bottom: 16px;
  }
`;

const PopupContainer = styled.div`
  background-color: var(--background-primary);
  color: var(--text-normal);
  top: 50%;
  left: 50%;
  position: absolute;
  transform: translateX(-50%) translateY(-50%);
  width: 440px;
  max-width: 98%;
  border-radius: 4px;
  font-size: 15px;
`;

const PlusModal = ({ open, onClose, file, setFile, channel }) => {
  const inputRef = useRef(null);

  const pickFile = (e) => {
    inputRef.current.click();
  };

  const handleFileChange = useCallback(
    (event) => {
      console.log("file change 1", event);
      const fileObj = event.target.files && event.target.files[0];
      console.log("file change 2", fileObj);

      if (!fileObj) {
        return;
      }
      setFile([...file, fileObj]);

      console.log("fileObj is", fileObj);

      // 👇️ reset file input
      event.target.value = null;

      // 👇️ is now empty
      // console.log(event.target.files);

      // 👇️ can still access file object here
      // console.log(fileObj);
      // console.log(fileObj.name);
    },
    [file, setFile]
  );

  return (
    open && (
      <Modal open={open} onClose={onClose}>
        <PopupContainer className="disable-select">
          <PopupMessageContainer>
            <div className="flex items-center" onClick={pickFile}>
              <HiUpload className="mr-2" />
              Upload File
            </div>
          </PopupMessageContainer>
          <input
            style={{ display: "none" }}
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
          />
        </PopupContainer>
      </Modal>
    )
  );
};

export default PlusModal;
