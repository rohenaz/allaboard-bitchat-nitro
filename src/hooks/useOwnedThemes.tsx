/**
 * useOwnedThemes Hook
 *
 * Fetches user's owned ThemeToken NFTs from sigma API.
 * Filters NFTs by MAP.app === 'ThemeToken' to identify theme tokens.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { SIGMA_AUTH_URL } from '../config/constants';
import type { RootState } from '../store';

export interface OwnedTheme {
	origin: string;
	name?: string;
	author?: string;
}

interface UseOwnedThemesResult {
	themes: OwnedTheme[];
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
}

export function useOwnedThemes(): UseOwnedThemesResult {
	const session = useSelector((state: RootState) => state.session);
	const [themes, setThemes] = useState<OwnedTheme[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const accessToken =
		typeof localStorage !== 'undefined' ? localStorage.getItem('sigma_access_token') : null;

	const fetchThemes = useCallback(async () => {
		if (!accessToken || !session.isAuthenticated) {
			setThemes([]);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`${SIGMA_AUTH_URL}/api/wallet/nfts`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (response.ok) {
				const data = await response.json();
				// Filter for theme NFTs (map.type === 'theme')
				const themeTokens =
					data.nfts?.filter((nft: { map?: { type?: string } }) => nft.map?.type === 'theme') || [];
				setThemes(themeTokens);
			} else if (response.status === 404) {
				// Endpoint not implemented yet
				setThemes([]);
			} else {
				setThemes([]);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch themes');
			setThemes([]);
		} finally {
			setLoading(false);
		}
	}, [accessToken, session.isAuthenticated]);

	useEffect(() => {
		fetchThemes();
	}, [fetchThemes]);

	return { themes, loading, error, refresh: fetchThemes };
}
