fetch('http://localhost:5173')
  .then((response) => response.text())
  .then((html) => {
    if (html.includes('BitChat Nitro')) {
    } else {
    }
  })
  .catch((_err) => {});
fetch('https://auth.sigmaidentity.com/.well-known/oauth-authorization-server')
  .then((response) => response.json())
  .then((data) => {
    if (data.authorization_endpoint) {
    } else {
    }
  })
  .catch((_err) => {});
const baseUrl = 'https://auth.sigmaidentity.com/authorize';
const params = new URLSearchParams({
  client_id: 'bitchat-nitro',
  redirect_uri: 'http://localhost:5173/auth/sigma/callback',
  response_type: 'code',
  provider: 'sigma',
  scope: 'openid profile',
  state: 'test-state-123',
});

const _oauthUrl = `${baseUrl}?${params.toString()}`;
