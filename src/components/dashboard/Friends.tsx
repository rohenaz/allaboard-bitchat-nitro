import React, { useCallback } from 'react';
import { head, uniq } from 'lodash';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Nav } from 'rsuite';
import NavItem from 'rsuite/esm/Nav/NavItem';
import styled from 'styled-components';
import { useBap } from '../../context/bap';
import Avatar from './Avatar';

interface FriendRequest {
  signer: {
    idKey: string;
    identity?: {
      paymail?: string;
      logo?: string;
      alternateName?: string;
    };
  };
}

interface MemberListState {
  friendRequests: {
    incoming: {
      allIds: string[];
      byId: Record<string, FriendRequest>;
    };
    outgoing: {
      allIds: string[];
      byId: Record<string, {
        MAP: Array<{ bapID: string }>;
      }>;
    };
  };
  signers: {
    byId: Record<string, {
      idKey: string;
      identity?: {
        paymail?: string;
        logo?: string;
        alternateName?: string;
      };
    }>;
  };
}

interface RootState {
  memberList: MemberListState;
}

const Wrapper = styled.div`
  background-color: var(--background-primary);
  display: flex;
  flex: 1;
  overflow: auto;
  height: 100dvh;
  width: 100%;
`;

const Container = styled.div`
  margin-top: auto;
  width: 100%;
`;

const HeaderContainer = styled.div`
  margin: 16px 16px 4px 16px;
`;

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const { identity } = useBap();

  const incomingFriendRequests = useSelector(
    (state: RootState) => state.memberList.friendRequests.incoming,
  );
  const outgoingFriendRequests = useSelector(
    (state: RootState) => state.memberList.friendRequests.outgoing,
  );

  const memberList = useSelector((state: RootState) => state.memberList);

  const handleClick = useCallback((_e: React.MouseEvent, bapId: string) => {
    navigate(`/@/${bapId}`);
  }, [navigate]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, bapId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/@/${bapId}`);
    }
  }, [navigate]);

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
              href={''}
              onSelect={() => {}}
              disabled={false}
            />
          </Nav>
        </HeaderContainer>

        <div className="p-4 text-white">
          {memberList.friendRequests.loading ? 'Loading...' : ''}
          {!memberList.friendRequests.loading && (
            <div>
              <div className="my-4 font-semibold">Incoming Friend Requests</div>
              <div>
                {uniq(incomingFriendRequests.allIds).map((ifrId) => {
                  const ifr = incomingFriendRequests.byId[ifrId];
                  const signer = ifr.signer;
                  return (
                    <div key={ifrId}>
                      <button
                        type="button"
                        className="flex gap-2 my-2 cursor-pointer bg-transparent border-0 w-full text-left"
                        onClick={(e) => handleClick(e, signer.idKey)}
                        onKeyDown={(e) => handleKeyPress(e, signer.idKey)}
                      >
                        <Avatar
                          size="27px"
                          w="40px"
                          bgcolor={'#000'}
                          paymail={signer.identity?.paymail}
                          icon={signer.identity?.logo}
                        />
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="text-gray-400">
                            {signer.identity?.paymail || signer.idKey}
                          </div>
                          <div>{signer.identity?.alternateName}</div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="my-4 font-semibold">Waiting for Approval</div>
              <div>
                {uniq(outgoingFriendRequests.allIds).map((ofrId) => {
                  const ofr = outgoingFriendRequests.byId[ofrId];
                  const signer = memberList.signers.byId[head(ofr.MAP).bapID];
                  return (
                    <div key={ofrId}>
                      <button
                        type="button"
                        className="flex gap-2 my-2 cursor-pointer bg-transparent border-0 w-full text-left"
                        onClick={(e) => handleClick(e, signer.idKey)}
                        onKeyDown={(e) => handleKeyPress(e, signer.idKey)}
                      >
                        <Avatar
                          size="27px"
                          w="40px"
                          bgcolor={'#000'}
                          paymail={signer.identity?.paymail}
                          icon={signer.identity?.logo}
                        />
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="text-gray-400">
                            {signer.identity?.paymail || signer.idKey}
                          </div>
                          <div>{signer.identity?.alternateName}</div>
                        </div>
                      </button>
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