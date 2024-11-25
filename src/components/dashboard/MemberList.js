import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import { usePopover } from "../../hooks";
import { loadUsers } from "../../reducers/memberListReducer";
import Avatar from "./Avatar";
import List from "./List";
import ListItem from "./ListItem";
import UserPopover from "./UserPopover";
import getLogo from "../../utils/logo";

const Container = styled.div`
  background-color: var(--background-secondary);
  width: 240px;
  flex: 0 0 auto;
  height: calc(100dvh - 48px);
  overflow: hidden scroll;
  text-overflow: ellipsis;
  padding: 10px 2px 10px 12px;

  @media (max-width: 768px) {
    height: 100dvh;
  }
`;

const Heading = styled.h3`
  font-size: 13px;
  font-weight: 500;
  margin: 8px 8px 4px 8px;
  color: var(--channels-default);
  text-transform: uppercase;
`;

const MemberList = ({ isMobile }) => {
  const memberList = useSelector((state) => state.memberList);
  const [
    user,
    anchorEl,
    showPopover,
    setShowPopover,
    handleClick,
    handleClickAway,
  ] = usePopover();

  const dispatch = useDispatch();
  useEffect(() => {
    if (!memberList.allIds.length) {
      dispatch(loadUsers());
    }
  }, [dispatch]);

  return (
    <Container>
      <Heading className="disable-select">
        online — {memberList.allIds.length}
      </Heading>
      <List gap="2px">
        {memberList.allIds.map((userId) => {
          const u = memberList.byId[userId];

          return (
            <ListItem
              key={u._id}
              icon={
                <Avatar
                  size="21px"
                  w="32px"
                  // bgColor={identity?.avatarColor}
                  bgcolor={`#000`}
                  status="online"
                  paymail={u?.identity?.paymail}
                  icon={getLogo(u?.identity?.logo)}
                />
              }
              text={u?.identity?.alternateName}
              style={{ gap: "12px", padding: "6px 8px" }}
              onClick={(event) => handleClick(event, u)}
            />
          );
        })}
      </List>
      <UserPopover
        open={showPopover}
        anchorEl={anchorEl}
        onClose={handleClickAway}
        anchorOrigin={{ vertical: "center", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        user={user}
        setShowPopover={setShowPopover}
      />
    </Container>
  );
};

export default MemberList;
