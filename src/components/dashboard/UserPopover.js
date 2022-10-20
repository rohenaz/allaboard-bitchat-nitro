import React from "react";

import Popover from "@mui/material/Popover";
import styled from "styled-components";

import moment from "moment";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useHandcash } from "../../context/handcash";
import { receiveNewMessage } from "../../reducers/chatReducer";
import Avatar, { GreenDotWrapper } from "./Avatar";
import InvisibleSubmitButton from "./InvisibleSubmitButton";

const StyledPopover = styled(Popover)`
  & .MuiPopover-paper {
    border-radius: 8px;
    background-color: var(--background-floating);
    transition-duration: 0s !important;
  }
`;

const Banner = styled.div`
  background-color: ${(p) => p.bgColor};
  width: 300px;
  height: 60px;
`;

const AvatarWrapper = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;

  & ${GreenDotWrapper} {
    padding: 0px;
    font-size: 28px;
    height: 30px;
    width: 30px;
    right: -2px;
    bottom: 2px;
    background-color: var(--background-floating);
  }
`;

const Header = styled.div`
  padding: 64px 16px 16px;
  overflow: hidden;
  position: relative;
  display: block;
`;

const Divider = styled.div`
  height: 1px;
  background-color: var(--background-modifier-accent);
  margin-bottom: 12px;
`;

const Content = styled.div`
  padding: 0 16px 16px 16px;
`;

const Username = styled.span`
  color: var(--interactive-active);
  font-weight: 600;
  font-size: 24px;
`;

const Footer = styled.div`
  padding: 0 16px 16px;
`;

const Note = styled.div`
  font-size: 13px;
  color: var(--text-normal);
  padding-bottom: 8px;
`;

const Input = styled.input`
  background-color: var(--background-secondary-alt);
  font-size: 14px;
  padding: 10px;
  height: 40px;
  width: 100%;
  border-radius: 3px;
  border: 1px solid var(--background-secondary-alt);
  outline: none;
  color: var(--text-muted);
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border: 1px solid #00b0f4;
  }
`;

const UserPopover = ({ user, self, setShowPopover, ...delegated }) => {
  const navigate = useNavigate();
  const { authToken } = useHandcash();
  const dispatch = useDispatch();

  const handleSubmit = (event) => {
    event.preventDefault();
    const content = event.target.content.value;

    if (content !== "") {
      event.target.reset();
      setShowPopover(false);
      if (!authToken) {
        console.error("no auth token");
        dispatch(
          receiveNewMessage({
            B: {
              content:
                "Error: Failed to send. You need to import an identity to use DMs.",
              "content-type": "text/plain",
              encoding: "utf8",
            },
            MAP: {
              app: "bitchatnitro.com",
              type: "message",
              paymail: "system@bitchatnitro.com",
            },
            timestamp: moment.unix(),
            blk: { t: moment.unix() },
            tx: { h: "error" },
            _id: "error",
          })
        );
        return;
      }
      // console.log({ user });
      // TODO: sendMessage;
      if (user.AIP) {
        navigate(`/@/${user.AIP.bapId}`);
      }
    }
  };

  return (
    <StyledPopover {...delegated}>
      <Banner
        // bgColor={user.avatarColor}
        bgcolor={`#000`}
      ></Banner>
      <AvatarWrapper>
        <Avatar
          size="52px"
          w="90px"
          border="6px solid var(--background-floating)"
          //bgColor={user.avatarColor}
          bgcolor={`#000`}
          paymail={user.MAP?.paymail}
        />
      </AvatarWrapper>
      <Header>
        <Username>{user.MAP?.paymail}</Username>
      </Header>
      <Content>
        <Divider></Divider>
      </Content>

      <Footer>
        <Note>
          {self
            ? `Yourself`
            : user.AIP
            ? user.AIP?.bapId
              ? user.isFriend
                ? `You are friends`
                : `You are not friends`
              : `Unknown user`
            : `Anonymous user`}
        </Note>

        {user.AIP?.bapId && (
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              name="content"
              placeholder={`message @${user.MAP?.paymail}`}
            />
            <InvisibleSubmitButton />
          </form>
        )}
      </Footer>
    </StyledPopover>
  );
};

export default UserPopover;
