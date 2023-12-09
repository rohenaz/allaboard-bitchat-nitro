import { Modal } from "@mui/material";
import moment from "moment";
import React, { useCallback, useMemo, useState } from "react";
import { Slider } from "rsuite";
import styled from "styled-components";
import { useBitcoin } from "../../../context/bitcoin";
import { useHandcash } from "../../../context/handcash/index.js";
import { useRelay } from "../../../context/relay/index.js";
import { FetchStatus } from "../../../utils/common";
import { useLocalStorage } from "../../../utils/storage";
export const costPerUnit = 0.025;
export const minutesPerUnit = 10;

const Scope = {
  Me: "me-scope",
  Everyone: "everyone-scope",
};

const PopupMessageContainer = styled.div`
  padding: 16px;

  h2 {
    padding-bottom: 16px;
  }
`;

const PinUntilContainer = styled.div`
  padding: 16px;
  font-size: 0.9rem;
  margin: 0.5rem 0;

  div {
    padding-bottom: 16px;
  }
`;

const PopupButtonContainer = styled.div`
  background-color: var(--background-secondary);
  border-radius: 4px;
  text-align: right;
  padding: 12px 16px;
`;

const CancelButton = styled.button`
  color: white;
  padding: 10px 24px;
  margin: 0 8px;
  background: transparent;
  border: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PinButton = styled.button`
  color: white;
  padding: 10px 24px;
  border-radius: 4px;
  border: none;
  background-color: #26ab56;

  &:hover {
    background-color: #34eb77;
  }

  &:disabled {
    cursor: default;
    background-color: #555;
    color: #777;
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

const PinChannelModal = ({ open, onClose, channel }) => {
  const [units, setUnits] = useState(1);
  const { profile } = useHandcash();
  const { paymail } = useRelay();
  const { sendPin, pinStatus, pinnedScopes } = useBitcoin();
  const [selectedScope, setSelectedScope] = useState(Scope.Everyone);
  const [myPins, setMyPins] = useLocalStorage("bitchat-local-pins", []);

  const price = useMemo(() => {
    return (units * costPerUnit).toFixed(2);
  }, [units, costPerUnit]);

  const scopeChanged = useCallback(
    (e) => {
      setSelectedScope(e.target.value);
    },
    [selectedScope]
  );

  const handleTitle = useMemo(() => {
    let minutes = units * minutesPerUnit;
    let hourPrefix = minutes > 60 ? `${Math.floor(minutes / 60)}h ` : null;
    let minutesText =
      minutes % 60 === 0
        ? ""
        : hourPrefix
        ? `${minutes % 60}m`
        : `${minutes} minutes`;
    return hourPrefix ? `${hourPrefix} ${minutesText}` : minutesText;
  }, [units]);

  const pinChannel = useCallback(async () => {
    if (selectedScope === Scope.Everyone) {
      if (channel) {
        try {
          await sendPin(paymail || profile?.paymail, channel, units);
          onClose();
        } catch (e) {
          console.error(e);
        }
      }
    } else if (selectedScope === Scope.Me) {
      if (!myPins?.includes(channel)) {
        setMyPins([...pinnedScopes, channel]);
      }
    }
  }, [myPins, selectedScope, units, paymail, profile, channel, sendPin]);

  return (
    open && (
      <Modal open={open} onClose={onClose}>
        <PopupContainer className="disable-select">
          <PopupMessageContainer>
            <h2>Pin Channel</h2>
            Pinned channels appear in a section above the channel list and have
            a rad gold border. How long should we pin this channel?
          </PopupMessageContainer>
          <div style={{ padding: "0 2rem" }}>
            <p>Who should see this pinned channel?</p>
            <label>
              Just Me{" "}
              <input
                type="radio"
                name="who"
                id={Scope.Me}
                value={Scope.Me}
                style={{ marginRight: ".5rem" }}
                onChange={scopeChanged}
                checked={selectedScope === Scope.Me}
              />
            </label>
            <label>
              Everyone{" "}
              <input
                type="radio"
                name="who"
                id={Scope.Everyone}
                value={Scope.Everyone}
                style={{ marginRight: ".5rem" }}
                onChange={scopeChanged}
                checked={selectedScope === Scope.Everyone}
              />
            </label>
          </div>
          {selectedScope === Scope.Everyone && (
            <>
              <div style={{ padding: "0 2rem" }}>
                <Slider
                  min={1}
                  max={144}
                  value={units}
                  handleStyle={{
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 12,
                    height: 22,
                    whiteSpace: "nowrap",
                  }}
                  tooltip={false}
                  className="custom-slider"
                  handleTitle={handleTitle}
                  onChange={setUnits}
                />
              </div>

              <PinUntilContainer>
                Pin until:{" "}
                {moment()
                  .add(units * minutesPerUnit, "minutes")
                  .format("MMM Do, h:mm:ss a")}
              </PinUntilContainer>
              <PopupButtonContainer>
                <CancelButton onClick={onClose}>Cancel</CancelButton>
                <PinButton
                  disabled={pinStatus === FetchStatus.Loading}
                  onClick={pinChannel}
                >
                  {pinStatus === FetchStatus.Loading ? "Pinning" : `$${price}`}
                </PinButton>
              </PopupButtonContainer>
            </>
          )}
          {selectedScope === Scope.Me && (
            <div>
              <PopupButtonContainer>
                <CancelButton onClick={onClose}>Cancel</CancelButton>
                <PinButton onClick={pinChannel}>Pin {channel} for Me</PinButton>
              </PopupButtonContainer>
            </div>
          )}
        </PopupContainer>
      </Modal>
    )
  );
};

export default PinChannelModal;
