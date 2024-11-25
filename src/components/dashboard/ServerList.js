import React from "react";

import { FaTerminal } from "react-icons/fa";
import { GiUnicorn } from "react-icons/gi";
import { HiPlus } from "react-icons/hi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled, { css } from "styled-components";

import { baseIcon, roundedBackground } from "../../design/mixins";
import BlockpostIcon from "../icons/BlockpostIcon";
import NitroIcon from "../icons/NitroIcon";
import RetrofeedIcon from "../icons/RetrofeedIcon";
import ArrowTooltip from "./ArrowTooltip";

const PillWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  width: 8px;
  height: 48px;
  display: flex;
  align-items: center;
`;

const PillContainer = styled.div`
  width: 8px;
  height: ${(p) => (p.isActive ? "40px" : "0")};
  margin-left: -4px;
  border-radius: 0 4px 4px 0;
  background-color: var(--header-primary);
  transition: 0.2s;
`;

const codeIconStyle = css`
  color: ${(p) => (p.isActive ? "white" : "var(--text-normal)")};
  background-color: ${(p) =>
    p.isActive ? "var(--brand)" : "var(--background-primary)"};

  &:hover {
    background-color: var(--brand);
  }
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  ${baseIcon};
  ${roundedBackground};
  transition: 0.3s;
  ${(p) =>
    p.color
      ? css`
          color: ${p.color};
        `
      : css`
          color: #fff;
        `}
  ${(p) =>
    p.bgcolor
      ? css`
          background-color: ${p.bgcolor};
        `
      : css`
          background-color: #faa519;
        `}
  &:hover {
    border-radius: 16px;
  }

  ${(p) =>
    p.isActive &&
    css`
      border-radius: 16px;
    `}

  &:hover + ${PillWrapper} > ${PillContainer} {
    height: ${(p) => (p.isActive ? "40px" : "24px")};
  }

  ${(p) => p.isActive && codeIconStyle}
`;

const ServerIcon = ({ children, ...delegated }) => {
  return (
    <IconWrapper size="28px" w="48px" {...delegated}>
      {children}
    </IconWrapper>
  );
};

const ListItem = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const Pill = ({ isActive }) => {
  return (
    <PillWrapper>
      <PillContainer isActive></PillContainer>
    </PillWrapper>
  );
};

const Container = styled.div`
  background-color: var(--background-tertiary);
  width: 72px;
  overflow: hidden;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

const ServerList = () => {
  const navigate = useNavigate();
  const session = useSelector((state) => state.session);

  return (
    <Container>
      <ListItem>
        <ArrowTooltip title="Bitchat Nitro" placement="left">
          <ServerIcon
            isActive
            isDiscord
            onClick={() => {
              if (session?.user?.bapId) {
                navigate(`/@/${session.user.idKey}`);
              }
            }}
          >
            <NitroIcon style={{ padding: ".5rem" }} />
          </ServerIcon>

          <Pill isActive />
        </ArrowTooltip>
      </ListItem>
      {/*<ListItem>
        <ArrowTooltip title="Bitchat Classic" placement="left">
          <a href="https://bitchat.allaboardbitcoin.com" target="_blank">
            <ServerIcon color="lime" bgcolor="#000">
              <FaTerminal />
            </ServerIcon>
          </a>
        </ArrowTooltip>
      </ListItem>
      <ListItem>
        <ArrowTooltip title="Pewnicorn Social Club" placement="left">
          <a href="https://www.pewnicornsocial.club" target="_blank">
            <ServerIcon
              color="pink"
              bgcolor="#49485a"
              style={{ padding: ".5rem" }}
            >
              <GiUnicorn />
            </ServerIcon>
          </a>
        </ArrowTooltip>
      </ListItem>
      <ListItem>
        <ArrowTooltip title="Retrofeed" placement="left">
          <a href="https://retrofeed.me/chat" target="_blank">
            <ServerIcon
              color="#F42B2C"
              bgcolor="#49485a"
              style={{ padding: ".5rem" }}
            >
              <RetrofeedIcon />
            </ServerIcon>
          </a>
        </ArrowTooltip>
      </ListItem>*/}
      <ListItem>
        <ArrowTooltip title="Create New App" placement="left">
          <a
            href="https://bitcoinschema.org/#/social_schema?id=message"
            target="_blank"
          >
            <ServerIcon color="#5865f2" bgcolor="#333">
              <HiPlus />
            </ServerIcon>
          </a>
        </ArrowTooltip>
      </ListItem>
    </Container>
  );
};

export default ServerList;
