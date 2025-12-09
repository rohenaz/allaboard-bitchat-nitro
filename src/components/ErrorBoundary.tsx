import { Component, type ErrorInfo, type ReactNode } from 'react';
import styled from 'styled-components';

interface Props {
	children?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

const ErrorContainer = styled.div`
  min-height: 100vh;
  background-color: var(--background);
  color: var(--foreground);
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorContent = styled.div`
  max-width: 800px;
  width: 100%;
  text-align: center;
`;

const ErrorTitle = styled.h1`
  color: var(--text-danger);
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 24px;
`;

const ErrorDetails = styled.div`
  background-color: var(--card);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
`;

const ErrorText = styled.pre`
  white-space: pre-wrap;
  color: var(--muted-foreground);
  font-size: 14px;
  overflow-x: auto;
  text-align: left;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 120px;

  ${({ $variant = 'primary' }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: var(--primary);
          color: var(--primary-foreground);
          &:hover {
            background-color: var(--primary);
            opacity: 0.9;
          }
        `;
			default:
				return `
          background-color: var(--card);
          color: var(--foreground);
          border: 1px solid var(--border);
          &:hover {
            background-color: var(--accent);
          }
        `;
		}
	}}

  &:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
`;

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ error, errorInfo });
		console.error('Uncaught error:', error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return (
				<ErrorContainer>
					<ErrorContent>
						<ErrorTitle>Sorry.. there was an error</ErrorTitle>
						<ErrorDetails>
							<ErrorText>{this.state.error?.toString()}</ErrorText>
						</ErrorDetails>
						<ButtonGroup>
							<Button type="button" $variant="primary" onClick={() => window.location.reload()}>
								Reload Page
							</Button>
							<Button type="button" $variant="secondary" onClick={() => window.history.back()}>
								Go Back
							</Button>
						</ButtonGroup>
					</ErrorContent>
				</ErrorContainer>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
