import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  background-color: var(--background-primary);
  color: var(--text-primary);
`;

const ErrorTitle = styled.h1`
  margin-bottom: 1rem;
  color: var(--error);
`;

const ErrorMessage = styled.pre`
  margin: 1rem 0;
  padding: 1rem;
  background-color: var(--background-secondary);
  border-radius: 4px;
  overflow: auto;
  max-width: 100%;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background-color: var(--brand);
  color: var(--text-normal);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--brand-darker);
  }
`;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong</ErrorTitle>
          {this.state.error && (
            <ErrorMessage>{this.state.error.message}</ErrorMessage>
          )}
          <RetryButton onClick={this.handleRetry}>Try Again</RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
