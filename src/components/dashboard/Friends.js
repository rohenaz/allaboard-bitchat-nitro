import { head, uniq } from "lodash";
import { useSelector } from "react-redux";
import { Nav } from "rsuite";
import NavItem from "rsuite/esm/Nav/NavItem";
import styled from "styled-components";
import { useBap } from "../../context/bap";
import Avatar from "./Avatar";

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
  const { onFileChange, identity, loadIdentityStatus } = useBap();

  const incomingFriendRequests = useSelector(
    (state) => state.memberList.friendRequests.incoming
  );
  const outgoingFriendRequests = useSelector(
    (state) => state.memberList.friendRequests.outgoing
  );

  const memberList = useSelector((state) => state.memberList);

  const handleClick = () => {
    console.log(`clicked`);
  };

  if (!identity) {
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

        <div class="p-4 text-white">
          {memberList.friendRequests.loading ? `Loading...` : ``}
          {!memberList.friendRequests.loading && (
            // make this columnar
            <div>
              Incoming
              <div>
                {uniq(incomingFriendRequests.allIds).map((ifrId) => {
                  const ifr = incomingFriendRequests.byId[ifrId];
                  console.log({ ifr });
                  return (
                    <div key={ifrId}>
                      From: {ifr.signer.identity?.paymail || ifr.signer.idKey}
                    </div>
                  );
                })}
              </div>
              <br />
              Outgoing
              <div>
                {uniq(outgoingFriendRequests.allIds).map((ofrId) => {
                  const ofr = outgoingFriendRequests.byId[ofrId];
                  const signer = memberList.signers.byId[head(ofr.MAP).bapID];
                  console.log({ ofr });
                  return (
                    <div key={ofrId}>
                      <div onClick={handleClick} className="flex gap-2 my-2">
                        <Avatar
                          size="27px"
                          w="40px"
                          //bgColor={message.user.avatarColor}
                          bgcolor={`#000`}
                          paymail={signer.identity?.paymail}
                          icon={signer.identity?.logo}
                        />
                        {signer.identity?.paymail || signer.idKey}
                      </div>
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
