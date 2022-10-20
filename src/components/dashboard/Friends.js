import { Nav } from "rsuite";
import NavItem from "rsuite/esm/Nav/NavItem";
import styled from "styled-components";

const Wrapper = styled.div`
  background-color: var(--background-primary);
  display: flex;
  flex: 1;
  overflow: auto;
  height: calc(100vh - 48px - 68px);
`;

const Container = styled.div`
  margin-top: auto;
  width: 100%;
`;

const HeaderContainer = styled.div`
  margin: 16px 16px 4px 16px;
`;

const Friends = () => {
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
      </Container>
    </Wrapper>
  );
};

export default Friends;
