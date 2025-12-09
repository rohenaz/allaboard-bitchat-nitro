import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background-color: var(--card);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--elevation-low);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--foreground);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--accent);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 80px;
`;

const FormWrapper = styled.div`
  width: 100%;
  max-width: 600px;
`;

const ComingSoonBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 13px;
  color: var(--muted-foreground);
  margin-bottom: 24px;

  &::before {
    content: '🚀';
  }
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted-foreground);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--foreground);
  font-size: 14px;
  transition: all 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--foreground);
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  transition: all 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const NewServerPage: FC = () => {
	const navigate = useNavigate();

	const handleBack = () => {
		navigate('/channels');
	};

	return (
		<Container>
			<Header>
				<BackButton onClick={handleBack}>
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back
				</BackButton>
				<HeaderInfo>
					<PageTitle>Submit a Server</PageTitle>
				</HeaderInfo>
			</Header>

			<Content>
				<FormWrapper>
					<ComingSoonBadge>Server submissions opening soon - stay tuned</ComingSoonBadge>

					<Card>
						<CardHeader>
							<CardTitle>Server Submission Form</CardTitle>
							<CardDescription>
								Submit your server to be featured in BitChat Nitro. Once approved, users will be
								able to discover and join your community.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField>
								<Label htmlFor="server-name">Server Name</Label>
								<Input id="server-name" type="text" placeholder="My Awesome Server" disabled />
							</FormField>

							<FormField>
								<Label htmlFor="server-email">Contact Email</Label>
								<Input id="server-email" type="email" placeholder="admin@example.com" disabled />
							</FormField>

							<FormField>
								<Label htmlFor="server-url">Server URL</Label>
								<Input id="server-url" type="url" placeholder="https://myserver.com" disabled />
							</FormField>

							<FormField>
								<Label htmlFor="server-description">Description</Label>
								<TextArea
									id="server-description"
									placeholder="Tell us about your server..."
									disabled
								/>
							</FormField>

							<Button disabled className="w-full">
								Submit Server
							</Button>
						</CardContent>
					</Card>
				</FormWrapper>
			</Content>
		</Container>
	);
};
