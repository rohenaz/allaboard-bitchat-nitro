import { head, uniq } from "lodash";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate()
  const { onFileChange, identity, loadIdentityStatus } = useBap();

  const incomingFriendRequests = useSelector(
    (state) => state.memberList.friendRequests.incoming
  );
  const outgoingFriendRequests = useSelector(
    (state) => state.memberList.friendRequests.outgoing
  );

  const memberList = useSelector((state) => state.memberList);

  const handleClick = (e, bapId) => {
 
    // navigate to user page
    navigate(`/@/${bapId}`)

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
                 <div className="my-4 font-semibold">
                 Incoming Friend Requests
              </div>
              <div>
                {uniq(incomingFriendRequests.allIds).map((ifrId) => {
                  const ifr = incomingFriendRequests.byId[ifrId];
                  // this is wrong its getting the user recieving the request, not the signer
                  // const signer = memberList.signers.byId[head(ifr.MAP).bapID];
                  const signer = ifr.signer
                  console.log({ ifr });
                  return (
                    <div key={ifrId}>

<div className="flex gap-2 my-2" onClick={(e) => handleClick(e, signer.idKey)}>
                        <Avatar
                          size="27px"
                          w="40px"
                          //bgColor={message.user.avatarColor}
                          bgcolor={`#000`}
                          paymail={signer.identity?.paymail}
                          icon={signer.identity?.logo}
                        />
                        <div className="flex flex-col">
                        <div className="text-gray-400">{signer.identity?.paymail || signer.idKey}</div>
                        <div  >{signer.identity?.alternateName}</div>
                        
                        </div>
                      </div>


                    </div>
                  );
                })}
              </div>
              <div className="my-4 font-semibold">
              Waiting for Approval
              </div>
              <div>
                {uniq(outgoingFriendRequests.allIds).map((ofrId) => {
                  const ofr = outgoingFriendRequests.byId[ofrId];
                  const signer = memberList.signers.byId[head(ofr.MAP).bapID];
                  console.log({ ofr });
                  return (
                    <div key={ofrId}>
                      <div onClick={(e) => handleClick(e, signer.idKey) } className="flex gap-2 my-2">
                        <Avatar
                          size="27px"
                          w="40px"
                          //bgColor={message.user.avatarColor}
                          bgcolor={`#000`}
                          paymail={signer.identity?.paymail}
                          icon={signer.identity?.logo}
                        />
                        <div className="flex flex-col">
                        <div className="text-gray-400">{signer.identity?.paymail || signer.idKey}</div>
                        <div>{signer.identity?.alternateName}</div>
                        </div>
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
