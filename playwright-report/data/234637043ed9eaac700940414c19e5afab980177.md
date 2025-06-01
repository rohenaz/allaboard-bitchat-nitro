# Test info

- Name: Homepage >> should load and display login button
- Location: /Users/satchmo/code/allaboard-bitchat-nitro/tests/e2e/homepage.spec.ts:4:3

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: getByRole('button', { name: /login/i }) resolved to 2 elements:
    1) <button type="button" class="btn btn-accent w-full gap-2">…</button> aka getByRole('button', { name: 'Login with Handcash' })
    2) <button disabled type="button" class="btn btn-accent w-full gap-2">…</button> aka getByRole('button', { name: 'Login with Yours Wallet' })

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByRole('button', { name: /login/i })

    at /Users/satchmo/code/allaboard-bitchat-nitro/tests/e2e/homepage.spec.ts:12:31
```

# Page snapshot

```yaml
- img "BitChat Logo"
- heading "Open Social Client" [level=1]
- button "Login with Handcash":
  - img
  - text: Login with Handcash
- button "Login with Yours Wallet" [disabled]:
  - img
  - text: Login with Yours Wallet
- text: Need an account?
- link "Register":
  - /url: https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj
- link "Continue as guest (read only)":
  - /url: /channels/nitro
```

# Test source

```ts
   1 | import { expect, test } from '@playwright/test';
   2 |
   3 | test.describe('Homepage', () => {
   4 |   test('should load and display login button', async ({ page }) => {
   5 |     await page.goto('/');
   6 |
   7 |     // Check that the page loads
   8 |     await expect(page).toHaveTitle('BitChat Nitro');
   9 |
  10 |     // Check for login button
  11 |     const loginButton = page.getByRole('button', { name: /login/i });
> 12 |     await expect(loginButton).toBeVisible();
     |                               ^ Error: expect.toBeVisible: Error: strict mode violation: getByRole('button', { name: /login/i }) resolved to 2 elements:
  13 |   });
  14 |
  15 |   test('should navigate to login page', async ({ page }) => {
  16 |     await page.goto('/');
  17 |
  18 |     // Click login button
  19 |     await page.getByRole('button', { name: /login/i }).click();
  20 |
  21 |     // Should be on login page
  22 |     await expect(page).toHaveURL('/login');
  23 |
  24 |     // Check for wallet options
  25 |     await expect(page.getByText('Yours Wallet')).toBeVisible();
  26 |     await expect(page.getByText('HandCash')).toBeVisible();
  27 |   });
  28 | });
  29 |
```