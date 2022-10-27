import userEvent from "@testing-library/user-event";
import { uniq } from "lodash";
import { useSelector } from "react-redux";
import { Nav } from "rsuite";
import NavItem from "rsuite/esm/Nav/NavItem";
import styled from "styled-components";

const Wrapper = styled.div`
  background-color: var(--background-primary);
  display: flex;
  flex: 1;
  overflow: auto;
  height: 100vh;
  width: 100%;
`;

const Container = styled.div`
  margin-top: auto;
  width: 100%;
`;

const HeaderContainer = styled.div`
  margin: 16px 16px 4px 16px;
`;

const Friends = () => {
  const incomingFriendRequests = useSelector(
    (state) => state.memberList.friendRequests.incoming
  );
  const outgoingFriendRequests = useSelector(
    (state) => state.memberList.friendRequests.outgoing
  );
  const memberList = useSelector((state) => state.memberList);

  if (!userEvent._id) {
    return (
      <Wrapper className="scrollable">
        <Container>
          <HeaderContainer className="disable-select">
            Import an identity to see friends.
          </HeaderContainer>
        </Container>
      </Wrapper>
    );
  }
  return (
    <Wrapper className="scrollable">
      <Container>
        <HeaderContainer className="disable-select">
          <Nav>
            <NavItem
              active={false}
              icon={null}
              href={``}
              onSelect={() => {}}
              disabled={false}
            />
          </Nav>
        </HeaderContainer>

        <div>
          {memberList.friendRequests.loading ? `Loading...` : ``}
          {!memberList.friendRequests.loading && (
            <div>
              Incoming:
              <div>
                {uniq(incomingFriendRequests.allIds).map((ifrId) => {
                  const ifr = incomingFriendRequests.byId[ifrId];
                  return (
                    <div>
                      To: {ifr.MAP.bapID} From: {ifr.AIP.bapId}
                    </div>
                  );
                })}
              </div>
              <br />
              Outgoing:
              <div>
                {uniq(outgoingFriendRequests.allIds).map((ofrId) => {
                  const ofr = outgoingFriendRequests.byId[ofrId];
                  return (
                    <div>
                      To: {ofr.MAP.bapID} From: {ofr.AIP.bapId}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Container>
    </Wrapper>
  );
};

export default Friends;
