import { createBigBlocksAuth, useBitcoinAuth } from 'bigblocks';
/**
 * Custom hook that integrates BigBlocks authentication capabilities
 * while preserving BitChat's existing UI and Redux state management
 */
import { useCallback, useEffect, useState } from 'react';
import { loadChannels } from '../reducers/channelsReducer';
import { login, setBapId, setYoursUser } from '../reducers/sessionReducer';
import { useAppDispatch } from './index';

interface BitchatAuthOptions {
  enableBigBlocksFeatures?: boolean;
}

interface BitchatAuthResult {
  // BigBlocks auth functionality
  bigBlocksAuth: ReturnType<typeof useBitcoinAuth>;

  // BitChat-compatible methods that integrate with existing UI
  handleHandcashLogin: () => Promise<void>;
  handleYoursLogin: () => Promise<void>;
  handleBigBlocksAuth: (provider: 'handcash' | 'yours') => Promise<void>;

  // Enhanced features from BigBlocks
  handleBackupImport: (backupData: string, password?: string) => Promise<void>;
  handleSignupFlow: () => Promise<void>;

  // State that works with both systems
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useBitchatAuth(
  options: BitchatAuthOptions = {},
): BitchatAuthResult {
  const { enableBigBlocksFeatures = false } = options;
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize BigBlocks auth
  const bigBlocksAuth = useBitcoinAuth();

  // Create BigBlocks auth manager for backend functionality
  const authManager = createBigBlocksAuth({
    apiUrl: '/api/auth',
    // Configure to work with BitChat's backend
    blockchainService: {
      mode: 'proxy',
      proxy: {
        endpoint: '/api/blockchain',
      },
    },
    oauthProviders: ['handcash', 'yours'],
    onSuccess: async (user) => {
      // Convert BigBlocks user to BitChat session format
      if (user.address && user.idKey) {
        dispatch(setBapId(user.idKey));
        dispatch(
          setYoursUser({
            paymail: user.paymail || `${user.address}@bitchat.nitro`,
            address: user.address,
          }),
        );

        // Load channels after successful auth
        await dispatch(loadChannels());
      }
    },
    onError: (authError) => {
      setError(authError.message || 'Authentication failed');
    },
  });

  // Enhanced HandCash login using BigBlocks backend
  const handleHandcashLogin = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (enableBigBlocksFeatures) {
        // Use BigBlocks OAuth flow for enhanced features
        const result = await authManager.authenticateWithOAuth('handcash');
        if (result.success && result.user) {
          // BigBlocks handles the onSuccess callback
          return;
        }
      } else {
        // Fallback to existing HandCash flow
        const HANDCASH_API_URL = import.meta.env.VITE_HANDCASH_API_URL;
        window.location.href = `${HANDCASH_API_URL}/hcLogin`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'HandCash login failed');
    } finally {
      setIsLoading(false);
    }
  }, [enableBigBlocksFeatures, authManager]);

  // Enhanced Yours Wallet login using BigBlocks backend
  const handleYoursLogin = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (enableBigBlocksFeatures) {
        // Use BigBlocks OAuth flow for enhanced features
        const result = await authManager.authenticateWithOAuth('yours');
        if (result.success && result.user) {
          // BigBlocks handles the onSuccess callback
          return;
        }
      } else {
        // Keep existing Yours wallet integration for now
        // This preserves the current working flow
        throw new Error('Use existing Yours wallet flow');
      }
    } catch (err) {
      // Fallback to existing implementation
      setError(
        err instanceof Error ? err.message : 'Yours wallet login failed',
      );
    } finally {
      setIsLoading(false);
    }
  }, [enableBigBlocksFeatures, authManager]);

  // New BigBlocks-powered authentication method
  const handleBigBlocksAuth = useCallback(
    async (provider: 'handcash' | 'yours') => {
      try {
        setError(null);
        setIsLoading(true);

        const result = await authManager.authenticateWithOAuth(provider);

        if (result.success && result.user) {
        } else {
          throw new Error(result.error || 'Authentication failed');
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'BigBlocks authentication failed',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [authManager],
  );

  // New backup import functionality using BigBlocks
  const handleBackupImport = useCallback(
    async (backupData: string, password?: string) => {
      try {
        setError(null);
        setIsLoading(true);

        const result = await authManager.importBackup(backupData, password);

        if (result.success && result.user) {
          // Convert to BitChat session format
          dispatch(
            login({
              wallet: 'bigblocks',
              authToken: result.session?.token,
              bapId: result.user.idKey,
            }),
          );
        } else {
          throw new Error(result.error || 'Backup import failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Backup import failed');
      } finally {
        setIsLoading(false);
      }
    },
    [authManager, dispatch],
  );

  // New signup flow using BigBlocks
  const handleSignupFlow = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const result = await authManager.createNewIdentity();

      if (result.success && result.user) {
        // Convert to BitChat session format
        dispatch(
          login({
            wallet: 'bigblocks',
            authToken: result.session?.token,
            bapId: result.user.idKey,
          }),
        );
      } else {
        throw new Error(result.error || 'Signup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  }, [authManager, dispatch]);

  return {
    bigBlocksAuth,
    handleHandcashLogin,
    handleYoursLogin,
    handleBigBlocksAuth,
    handleBackupImport,
    handleSignupFlow,
    isLoading,
    error,
    isAuthenticated: bigBlocksAuth.isAuthenticated,
  };
}
