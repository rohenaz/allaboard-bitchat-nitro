import React from 'react';

import styled from 'styled-components';
import NitroIcon from '../icons/NitroIcon';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--brand);
  min-height: 100dvh;
  width: 100%;
  color: var(--text-muted);
  justify-content: center;
`;

const Container = styled.div`
  padding: 28px;
  background-color: var(--background-primary);
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media only screen and (max-width: 550px) {
    padding: 16px;
    min-height: 100dvh;
    min-width: 100vw;
    border-radius: 0;
    justify-content: flex-start;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  font-size: 40px;
  color: white;
  margin-bottom: 20px;
`;

const Heading = styled.h1`
  color: var(--header-primary);
  font-size: 24px;
  font-weight: 500;
`;

const Layout = ({ heading, children }) => {
  return (
    <Wrapper className="disable-select">
      <Container>
        <Header>
          <NitroIcon style={{ width: '6rem', padding: '.5rem' }} />
        </Header>
        <Heading>{heading}</Heading>
        {children}
      </Container>
    </Wrapper>
  );
};

export default Layout;
