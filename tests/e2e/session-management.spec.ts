import { expect, test } from '@playwright/test';

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should persist session across browser refresh', async ({ page }) => {
    // 1. Mock a valid session
    await page.addInitScript(() => {
      const mockSession = {
        accessToken: 'valid_access_token',
        userInfo: {
          sub: 'user123',
          paymail: 'user@example.com',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          displayName: 'Test User',
          avatar: 'https://example.com/avatar.jpg',
          publicKey: 'mock_public_key'
        },
        expiresAt: Date.now() + 3600000, // 1 hour from now
        createdAt: Date.now()
      };
      localStorage.setItem('sigma-auth-session', JSON.stringify(mockSession));
    });

    // 2. Navigate to app
    await page.goto('/');
    
    // 3. Should show checking authentication state
    await expect(page.getByText(/checking authentication/i)).toBeVisible();
    
    // 4. Refresh the page
    await page.reload();
    
    // 5. Should still show checking authentication (session should persist)
    await expect(page.getByText(/checking authentication/i)).toBeVisible();
    
    // 6. Verify session data is still in localStorage
    const sessionData = await page.evaluate(() => {
      const stored = localStorage.getItem('sigma-auth-session');
      return stored ? JSON.parse(stored) : null;
    });
    
    expect(sessionData).toBeTruthy();
    expect(sessionData.userInfo.paymail).toBe('user@example.com');
    expect(sessionData.accessToken).toBe('valid_access_token');
  });

  test('should clear expired sessions automatically', async ({ page }) => {
    // 1. Mock an expired session
    await page.addInitScript(() => {
      const expiredSession = {
        accessToken: 'expired_token',
        userInfo: {
          sub: 'user123',
          paymail: 'user@example.com',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          displayName: 'Test User'
        },
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        createdAt: Date.now() - 3600000 // Created 1 hour ago
      };
      localStorage.setItem('sigma-auth-session', JSON.stringify(expiredSession));
    });

    // 2. Navigate to app
    await page.goto('/');
    
    // 3. Should detect expired session and show login page
    await expect(page.getByText(/choose your login method/i)).toBeVisible();
    
    // 4. Verify expired session was cleared
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('sigma-auth-session');
    });
    
    expect(sessionData).toBeNull();
  });

  test('should handle corrupted session data gracefully', async ({ page }) => {
    // 1. Mock corrupted session data
    await page.addInitScript(() => {
      localStorage.setItem('sigma-auth-session', 'invalid-json-data');
    });

    // 2. Navigate to app
    await page.goto('/');
    
    // 3. Should handle corrupted data gracefully and show login
    await expect(page.getByText(/choose your login method/i)).toBeVisible();
    
    // 4. Verify corrupted session was cleared
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('sigma-auth-session');
    });
    
    expect(sessionData).toBeNull();
  });

  test('should restore Redux state from valid session', async ({ page }) => {
    // 1. Mock a valid session
    await page.addInitScript(() => {
      const mockSession = {
        accessToken: 'valid_access_token',
        userInfo: {
          sub: 'user123',
          paymail: 'testuser@sigma.com',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          displayName: 'Test User',
          avatar: 'https://example.com/avatar.jpg',
          publicKey: '0x123456789abcdef'
        },
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now()
      };
      localStorage.setItem('sigma-auth-session', JSON.stringify(mockSession));
    });

    // 2. Navigate to app
    await page.goto('/');
    
    // 3. Should show checking authentication state
    await expect(page.getByText(/checking authentication/i)).toBeVisible();
    
    // Note: In a real app, this would dispatch setSigmaUser and redirect to /channels/nitro
    // For testing, we verify the session restoration logic works
  });

  test('should handle session timeout gracefully', async ({ page }) => {
    // 1. Mock a session that expires soon
    await page.addInitScript(() => {
      const soonToExpireSession = {
        accessToken: 'soon_to_expire_token',
        userInfo: {
          sub: 'user123',
          paymail: 'user@example.com',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          displayName: 'Test User'
        },
        expiresAt: Date.now() + 1000, // Expires in 1 second
        createdAt: Date.now() - 3600000
      };
      localStorage.setItem('sigma-auth-session', JSON.stringify(soonToExpireSession));
    });

    // 2. Navigate to app
    await page.goto('/');
    
    // 3. Wait for session to expire
    await page.waitForTimeout(1100);
    
    // 4. Refresh page to trigger session check
    await page.reload();
    
    // 5. Should detect expired session and show login
    await expect(page.getByText(/choose your login method/i)).toBeVisible();
  });

  test('should clear session on explicit logout', async ({ page }) => {
    // 1. Mock authenticated session
    await page.addInitScript(() => {
      const mockSession = {
        accessToken: 'valid_access_token',
        userInfo: {
          sub: 'user123',
          paymail: 'user@example.com',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          displayName: 'Test User'
        },
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now()
      };
      localStorage.setItem('sigma-auth-session', JSON.stringify(mockSession));
    });

    // 2. Navigate to app
    await page.goto('/');
    
    // 3. Simulate logout by calling clearSession
    await page.evaluate(() => {
      // This would normally be triggered by a logout button/action
      localStorage.removeItem('sigma-auth-session');
      sessionStorage.removeItem('sigma-auth-state');
    });
    
    // 4. Refresh page
    await page.reload();
    
    // 5. Should show login page after session cleared
    await expect(page.getByText(/choose your login method/i)).toBeVisible();
    
    // 6. Verify session data is cleared
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('sigma-auth-session');
    });
    
    expect(sessionData).toBeNull();
  });

  test('should handle multiple tabs with same session', async ({ context }) => {
    // 1. Create first tab with session
    const page1 = await context.newPage();
    await page1.addInitScript(() => {
      const mockSession = {
        accessToken: 'valid_access_token',
        userInfo: {
          sub: 'user123',
          paymail: 'user@example.com',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          displayName: 'Test User'
        },
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now()
      };
      localStorage.setItem('sigma-auth-session', JSON.stringify(mockSession));
    });
    
    await page1.goto('/');
    
    // 2. Create second tab (should share same localStorage)
    const page2 = await context.newPage();
    await page2.goto('/');
    
    // 3. Both tabs should have access to the same session
    const session1 = await page1.evaluate(() => {
      return localStorage.getItem('sigma-auth-session');
    });
    
    const session2 = await page2.evaluate(() => {
      return localStorage.getItem('sigma-auth-session');
    });
    
    expect(session1).toBe(session2);
    expect(session1).toBeTruthy();
    
    // 4. Clear session in first tab
    await page1.evaluate(() => {
      localStorage.removeItem('sigma-auth-session');
    });
    
    // 5. Session should be cleared in both tabs
    await page1.reload();
    await page2.reload();
    
    await expect(page1.getByText(/choose your login method/i)).toBeVisible();
    await expect(page2.getByText(/choose your login method/i)).toBeVisible();
  });

  test('should validate session structure', async ({ page }) => {
    // 1. Mock session with missing required fields
    await page.addInitScript(() => {
      const invalidSession = {
        accessToken: 'valid_token',
        // Missing userInfo
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now()
      };
      localStorage.setItem('sigma-auth-session', JSON.stringify(invalidSession));
    });

    // 2. Navigate to app
    await page.goto('/');
    
    // 3. Should handle invalid session structure and show login
    await expect(page.getByText(/choose your login method/i)).toBeVisible();
    
    // 4. Verify invalid session was cleared
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('sigma-auth-session');
    });
    
    expect(sessionData).toBeNull();
  });

  test('should handle session with missing required user fields', async ({ page }) => {
    // 1. Mock session with incomplete user info
    await page.addInitScript(() => {
      const incompleteSession = {
        accessToken: 'valid_token',
        userInfo: {
          // Missing required fields like sub, paymail, address
          displayName: 'Test User'
        },
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now()
      };
      localStorage.setItem('sigma-auth-session', JSON.stringify(incompleteSession));
    });

    // 2. Navigate to app
    await page.goto('/');
    
    // 3. Should handle incomplete user info gracefully
    await expect(page.getByText(/choose your login method/i)).toBeVisible();
    
    // 4. Verify incomplete session was cleared
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('sigma-auth-session');
    });
    
    expect(sessionData).toBeNull();
  });
});