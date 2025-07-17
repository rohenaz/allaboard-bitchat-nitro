// Manual OAuth flow test script
console.log('Testing OAuth flow...');

// Test 1: Check if the login page loads
console.log('1. Testing login page...');
fetch('http://localhost:5173')
  .then(response => response.text())
  .then(html => {
    if (html.includes('BitChat Nitro')) {
      console.log('✅ Login page loads correctly');
    } else {
      console.log('❌ Login page failed to load');
    }
  })
  .catch(err => {
    console.log('❌ Error loading login page:', err.message);
  });

// Test 2: Check if the sigma-auth server is accessible
console.log('2. Testing sigma-auth server...');
fetch('https://auth.sigmaidentity.com/.well-known/oauth-authorization-server')
  .then(response => response.json())
  .then(data => {
    if (data.authorization_endpoint) {
      console.log('✅ Sigma-auth server is accessible');
      console.log('   Authorization endpoint:', data.authorization_endpoint);
    } else {
      console.log('❌ Sigma-auth server response invalid');
    }
  })
  .catch(err => {
    console.log('❌ Error accessing sigma-auth server:', err.message);
  });

// Test 3: Test the OAuth URL construction
console.log('3. Testing OAuth URL construction...');
const baseUrl = 'https://auth.sigmaidentity.com/authorize';
const params = new URLSearchParams({
  client_id: 'bitchat-nitro',
  redirect_uri: 'http://localhost:5173/auth/sigma/callback',
  response_type: 'code',
  provider: 'sigma',
  scope: 'openid profile',
  state: 'test-state-123'
});

const oauthUrl = `${baseUrl}?${params.toString()}`;
console.log('✅ OAuth URL constructed:', oauthUrl);

console.log('\n🔗 Manual test instructions:');
console.log('1. Open http://localhost:5173 in your browser');
console.log('2. Click "Sign in with Bitcoin"');
console.log('3. You should be redirected to sigma-auth server');
console.log('4. Check that you see the Bitcoin authentication interface');
console.log('5. The "Welcome back!" message should NOT appear');