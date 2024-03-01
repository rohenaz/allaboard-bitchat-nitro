import React from "react";
import styled from "styled-components";
import {
  toggleHideUnverifiedMessages,
  toggleSettings,
} from "../../../reducers/settingsReducer";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Switch,
} from "@mui/material";

const SettingsContainer = styled.div`
  box-shadow: 24px;
  padding: 1rem;
`;

const Label = styled.label`
  font-family: var(--font);
`;

export const SettingsModal = () => {
  const dispatch = useDispatch();
  const { isOpen, hideUnverifiedMessages } = useSelector(
    (state) => state.settings
  );

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        dispatch(toggleSettings());
      }}
    >
      <SettingsContainer>
        <DialogTitle fontFamily="var(--font)">Settings</DialogTitle>
        <DialogContent>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  onChange={() => dispatch(toggleHideUnverifiedMessages())}
                  checked={hideUnverifiedMessages}
                />
              }
              label={<Label>Hide unverified messages</Label>}
            />
          </FormGroup>
        </DialogContent>
      </SettingsContainer>
    </Dialog>
  );
};
