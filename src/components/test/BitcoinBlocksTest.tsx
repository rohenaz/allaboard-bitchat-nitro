import '@radix-ui/themes/styles.css';
import { AuthButton, BitcoinAuthProvider, BitcoinThemeProvider } from 'bigblocks';

export function BitcoinBlocksTest() {
  const handleAuthSuccess = (result: any) => {
    console.log('BitcoinBlocks Auth successful:', result);
    // TODO: Integrate with BitChat's existing auth system
  };

  const handleAuthError = (error: any) => {
    console.error('BitcoinBlocks Auth failed:', error);
  };

  return (
    <BitcoinThemeProvider>
      <BitcoinAuthProvider config={{ apiUrl: '/api' }}>
        <div style={{ padding: '20px', border: '2px dashed #6366f1', borderRadius: '8px', margin: '20px' }}>
          <h3 style={{ color: 'var(--text-normal)', marginBottom: '16px' }}>
            🧪 BitcoinBlocks Test Component
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AuthButton 
              mode="signin"
              size="3"
              variant="solid"
              color="blue"
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            >
              Sign In with Bitcoin (BitcoinBlocks)
            </AuthButton>
            
            <AuthButton 
              mode="signup"
              size="2"
              variant="soft"
              color="green"
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            >
              Create Account (BitcoinBlocks)
            </AuthButton>
            
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              margin: 0,
              fontStyle: 'italic' 
            }}>
              Test component using bitcoinblocks AuthButton. Remove after testing.
            </p>
          </div>
        </div>
      </BitcoinAuthProvider>
    </BitcoinThemeProvider>
  );
}