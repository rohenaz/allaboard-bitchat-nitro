import React, { useCallback, useState } from "react";
import { FaCheck } from "react-icons/fa";
import OutsideClickHandler from "react-outside-click-handler";

const DirectMessageModal = ({ open, onClose }) => {
  const [inputValue, setInputValue] = useState();

  const changeInput = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const onSubmit = useCallback(() => {
    console.log({ inputValue });
  }, [inputValue]);

  return (
    <div
      style={{
        position: "absolute",
        width: "100vw",
        height: "100vh",
        background: `rgba(0,0,0,.5)`,
        alignItems: "center",
        justifyContent: "center",
        display: `${open ? "flex" : "none"}`,
        pointerEvents: `${open ? "unset" : "none"}`,
      }}
    >
      <OutsideClickHandler onOutsideClick={onClose}>
        <div
          style={{
            background: "#111",
            padding: "2rem",
            margin: "auto",
            borderRadius: "1rem",
            color: "#777",
            zIndex: "999",
          }}
        >
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <b>Create Direct Message</b>
              <p>Enter the BAP ID, name or paymail address of the user.</p>

              <input
                type="text"
                style={{
                  background: `#333`,
                  color: `#EEE`,
                  width: "100%",
                  padding: ".5rem",
                }}
                onChange={changeInput}
              />
            </div>
            <br />
            <button
              onClick={onSubmit}
              style={{
                background: "#000",
                padding: "1rem",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                margin: "auto",
              }}
            >
              <FaCheck style={{ marginRight: ".5rem" }} /> Okay
            </button>
          </div>
        </div>
      </OutsideClickHandler>
    </div>
  );
};

export default DirectMessageModal;
