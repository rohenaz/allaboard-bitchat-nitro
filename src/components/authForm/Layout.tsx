import type { FC, ReactNode } from 'react';
import styled from 'styled-components';

interface LayoutProps {
	heading: string;
	children: ReactNode;
}

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const Card = styled.div`
  background-color: var(--background);
  border-radius: 8px;
  box-shadow: var(--elevation-high);
  max-width: 480px;
  width: 100%;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.div`
  margin-bottom: 32px;
  text-align: center;
`;

const Logo = styled.img`
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
`;

const Heading = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 8px 0;
`;

const SubHeading = styled.p`
  font-size: 14px;
  color: var(--muted-foreground);
  margin: 0;
`;

const Content = styled.div`
  width: 100%;
`;

const Layout: FC<LayoutProps> = ({ heading, children }) => {
	return (
		<Container>
			<Card>
				<Header>
					<Logo src="/images/logo-noBgColor.svg" alt="BitChat Logo" />
					<Heading>Welcome to BitChat</Heading>
					<SubHeading>{heading}</SubHeading>
				</Header>
				<Content>{children}</Content>
			</Card>
		</Container>
	);
};

export default Layout;
