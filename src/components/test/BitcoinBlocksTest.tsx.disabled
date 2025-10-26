import '@radix-ui/themes/styles.css';
import {
  AuthButton,
  BackupImport,
  BitcoinAuthProvider,
  SignupFlow,
} from 'bigblocks';
import { useState } from 'react';
import styled from 'styled-components';

const TestContainer = styled.div`
  padding: 20px;
  border: 2px dashed #6366f1;
  border-radius: 8px;
  margin: 20px;
  background: var(--background-secondary);
`;

const TestSection = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--background-modifier-accent);
  border-radius: 6px;
  background: var(--background-primary);
`;

const TestTitle = styled.h4`
  color: var(--text-normal);
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
`;

const TestDescription = styled.p`
  color: var(--text-muted);
  margin: 0 0 12px 0;
  font-size: 12px;
  font-style: italic;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const ToggleButton = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border: 1px solid var(--background-modifier-accent);
  border-radius: 4px;
  background: ${(props) => (props.$active ? 'var(--brand-experiment)' : 'var(--background-secondary)')};
  color: ${(props) => (props.$active ? 'white' : 'var(--text-normal)')};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) => (props.$active ? 'var(--brand-experiment-hover)' : 'var(--background-modifier-hover)')};
  }
`;

export function BitcoinBlocksTest() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testMode, setTestMode] = useState<'auth' | 'backup' | 'signup'>(
    'auth',
  );

  const handleAuthSuccess = (_result: unknown) => {
    // TODO: Integrate with BitChat's existing Redux store
  };

  const handleAuthError = (_error: unknown) => {
    // TODO: Handle auth error
  };

  return (
    <BitcoinAuthProvider
      config={{
        apiUrl: '/api',
        oauthProviders: ['handcash', 'yours'],
      }}
    >
      <TestContainer>
        <h3
          style={{
            color: 'var(--text-normal)',
            marginBottom: '16px',
            fontSize: '16px',
          }}
        >
          🧪 BigBlocks Integration Test (v0.0.21)
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <ToggleButton
            $active={!showAdvanced}
            onClick={() => setShowAdvanced(false)}
          >
            Basic Integration
          </ToggleButton>
          <ToggleButton
            $active={showAdvanced}
            onClick={() => setShowAdvanced(true)}
          >
            Advanced Features
          </ToggleButton>
        </div>

        {!showAdvanced ? (
          <TestSection>
            <TestTitle>Enhanced Auth (Keep BitChat UI)</TestTitle>
            <TestDescription>
              v0.0.21 created a new BigBlocksLoginPage at /login route. Test
              BitChat + BigBlocks integration.
            </TestDescription>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <AuthButton
                mode="signin"
                size="2"
                variant="soft"
                color="blue"
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
                style={{
                  width: '100%',
                  background: 'var(--brand-experiment)',
                  color: 'white',
                }}
              >
                🔐 Enhanced Bitcoin Auth (BitChat Style)
              </AuthButton>

              <button
                type="button"
                style={{
                  padding: '8px 16px',
                  background: 'var(--background-modifier-accent)',
                  color: 'var(--text-normal)',
                  border: '1px solid var(--background-modifier-hover)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                Go to BigBlocksLoginPage (/login)
              </button>
            </div>
          </TestSection>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <ToggleButton
                $active={testMode === 'auth'}
                onClick={() => setTestMode('auth')}
              >
                Auth
              </ToggleButton>
              <ToggleButton
                $active={testMode === 'backup'}
                onClick={() => setTestMode('backup')}
              >
                Backup
              </ToggleButton>
              <ToggleButton
                $active={testMode === 'signup'}
                onClick={() => setTestMode('signup')}
              >
                Signup
              </ToggleButton>
            </div>

            {testMode === 'auth' && (
              <TestSection>
                <TestTitle>BigBlocks Auth Components</TestTitle>
                <TestDescription>
                  Full BigBlocks auth experience with their UI components
                </TestDescription>

                <ButtonRow>
                  <AuthButton
                    mode="signin"
                    size="2"
                    variant="solid"
                    color="blue"
                    onSuccess={handleAuthSuccess}
                    onError={handleAuthError}
                  >
                    Sign In
                  </AuthButton>

                  <AuthButton
                    mode="signup"
                    size="2"
                    variant="soft"
                    color="green"
                    onSuccess={handleAuthSuccess}
                    onError={handleAuthError}
                  >
                    Sign Up
                  </AuthButton>
                </ButtonRow>
              </TestSection>
            )}

            {testMode === 'backup' && (
              <TestSection>
                <TestTitle>Backup Import</TestTitle>
                <TestDescription>
                  Import existing Bitcoin wallet backups (WIF, BAP, etc.)
                </TestDescription>

                <BackupImport
                  onSuccess={(result) => {
                    handleAuthSuccess(result);
                  }}
                  onError={handleAuthError}
                />
              </TestSection>
            )}

            {testMode === 'signup' && (
              <TestSection>
                <TestTitle>New Identity Creation</TestTitle>
                <TestDescription>
                  Complete signup flow with identity generation and backup
                </TestDescription>

                <SignupFlow
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                />
              </TestSection>
            )}
          </>
        )}

        <TestDescription style={{ marginTop: '16px', textAlign: 'center' }}>
          🎯 v0.0.21 Breaking Change: /login route now uses BigBlocksLoginPage
        </TestDescription>
      </TestContainer>
    </BitcoinAuthProvider>
  );
}
