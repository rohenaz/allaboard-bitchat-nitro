import React from "react";
import styled from "styled-components";
import Avatar from "./Avatar";

const Footer = styled.div`
  background-color: var(--background-secondary-alt);
  height: 52px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
`;

const Username = styled.div`
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: var(--header-primary);
    font-weight: 600;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    justify-content: start;
`;

const ListFooter = ({user, profile, decIdentity}) => {
    return (
        <Footer>
            <Avatar
                size="21px"
                w="32px"
                // bgColor={user.avatarColor}
                bgcolor={"#000"}
                status="online"
                paymail={user?.paymail || profile?.paymail}
            />
            <Username>
                <div>{user?.alternativeName || profile?.paymail}</div>
                <div style={{fontSize: ".75rem", color: "#777"}}>
                    {decIdentity?.bapId?.slice(0, 8)}
                </div>
            </Username>
        </Footer>
    );
}

export default ListFooter;
