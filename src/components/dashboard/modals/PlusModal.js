import React, { useCallback, useRef, useState } from "react";
import { RiImageAddFill } from "react-icons/ri";
import OutsideClickHandler from "react-outside-click-handler";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useBitcoin } from "../../../context/bitcoin";
import { toggleFileUpload } from "../../../reducers/chatReducer";
import { FetchStatus } from "../../../utils/common";

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

const PlusModal = ({ open, onClose, channel }) => {
  const inputRef = useRef(null);
  const { setPendingFiles, pendingFiles } = useBitcoin();
  const isFileUploadOpen = useSelector((state) => state.chat.isFileUploadOpen);
  const dispatch = useDispatch();

  const pickFile = (e) => {
    inputRef.current.click();
  };
  window.ondragover = function (e) {
    e.preventDefault();
    return false;
  };
  window.ondrop = function (e) {
    e.preventDefault();
    return false;
  };
  const handleFileChange = useCallback(
    (event, file) => {
      console.log("file change 1", event);
      const fileObj = file ? file : event.target.files[0];
      console.log("file change 2", fileObj);

      if (!fileObj) {
        return;
      }

      fileObj.loadingStatus === FetchStatus.Idle;
      setPendingFiles([...pendingFiles, fileObj]);

      console.log("fileObj is", fileObj);

      // 👇️ reset file input
      event.target.value = null;
      dispatch(toggleFileUpload());
      onClose();

      // 👇️ is now empty
      // console.log(event.target.files);

      // 👇️ can still access file object here
      // console.log(fileObj);
      // console.log(fileObj.name);
    },
    [pendingFiles, setPendingFiles]
  );

  const [dragActive, setDragActive] = useState(false);

  // handle drag events
  const handleDrag = function (e) {
    console.log("handle drag", e);
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // triggers when file is dropped
  const handleDrop = function (e) {
    console.log("DROP", e);
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // at least one file has been dropped so do something
      // handleFiles(e.dataTransfer.files);
      handleFileChange(e, e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        width: "100vw",
        height: "100vh",
        background: `rgba(0,0,0,.5)`,
        alignItems: "center",
        justifyContent: "center",
        display: `${isFileUploadOpen ? "flex" : "none"}`,
        pointerEvents: `${isFileUploadOpen ? "unset" : "none"}`,
      }}
      className="top-0 left-0"
    >
      <OutsideClickHandler
        onOutsideClick={() => {
          if (isFileUploadOpen) {
            dispatch(toggleFileUpload());
            onClose();
          }
        }}
      >
        <PopupContainer className="disable-select">
          <PopupMessageContainer>
            <form
              id="form-file-upload"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onSubmit={(e) => e.preventDefault()}
            >
              <button
                type="button"
                onClick={pickFile}
                className={`relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-2 mb-2 ${
                  dragActive ? "ring-1 ring-indigo-500 ring-offset-" : ""
                }`}
              >
                <RiImageAddFill className="mx-auto text-6xl" />
                <span className="mt-2 block text-sm font-medium text-gray-400">
                  Drag image or click to upload
                </span>
              </button>
              {/* <div className="flex items-center">
              <HiUpload className="mr-2" />
              Upload File
            </div> */}
              <input
                style={{ display: "none" }}
                ref={inputRef}
                type="file"
                onChange={handleFileChange}
              />
            </form>
          </PopupMessageContainer>
        </PopupContainer>
      </OutsideClickHandler>
    </div>
  );
};

export default PlusModal;
