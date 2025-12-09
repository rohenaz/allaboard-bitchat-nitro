import React, { useCallback, useContext, useMemo, useState } from 'react';
import { API_BASE_URL, NITRO_API_URL } from '../../config/constants';
import { FetchStatus } from '../../utils/common';
import { lsTest, useLocalStorage } from '../../utils/storage';

interface HandcashProfile {
	paymail: string;
	publicKey: string;
	avatarUrl?: string;
	displayName?: string;
}

interface HandcashContextValue {
	setProfile: (profile: HandcashProfile | null) => void;
	profile: HandcashProfile | null;
	getProfile: () => Promise<HandcashProfile | undefined>;
	authToken: string | null;
	setAuthToken: (token: string | null) => void;
	hcEncrypt: (data: unknown) => Promise<string>;
	hcDecrypt: (encryptedData: string) => Promise<unknown>;
	decryptStatus: FetchStatus;
}

const HandcashContext = React.createContext<HandcashContextValue | undefined>(undefined);

const profileStorageKey = 'nitro__HandcashProvider_profile';
const authTokenStorageKey = 'nitro__HandcashProvider_authToken';

interface HandcashProviderProps {
	children: React.ReactNode;
}

const HandcashProvider: React.FC<HandcashProviderProps> = (props) => {
	const [profile, setProfile] = useLocalStorage<HandcashProfile | null>(profileStorageKey, null);
	const [authToken, setAuthToken] = useLocalStorage<string | null>(authTokenStorageKey, null);
	const [decryptStatus, setDecryptStatus] = useState(FetchStatus.Idle);

	const getProfile = useCallback(async () => {
		if (!lsTest()) {
			throw new Error('localStorage is not available');
		}

		if (authToken) {
			try {
				const resp = await fetch(`${NITRO_API_URL}/hcProfile`, {
					method: 'POST',
					headers: {
						'Content-type': 'application/json',
					},
					body: JSON.stringify({ authToken }),
				});
				const { publicProfile } = await resp.json();
				setProfile(publicProfile);
				return publicProfile;
			} catch (e) {
				// Keep error log for production debugging
				console.error('Failed to get Handcash profile:', e);
				return undefined;
			}
		}
	}, [authToken, setProfile]);

	const hcEncrypt = useCallback(
		(data: unknown) => {
			return new Promise<string>((resolve, reject) => {
				if (!lsTest()) {
					reject(new Error('localStorage is not available'));
					return;
				}

				if (authToken) {
					fetch(`${NITRO_API_URL}/hcEncrypt`, {
						method: 'POST',
						headers: {
							'Content-type': 'application/json',
						},
						body: JSON.stringify({ authToken, data }),
					})
						.then((resp) => {
							resp
								.json()
								.then((d) => {
									const { encryptedData } = d;
									resolve(encryptedData);
								})
								.catch((e) => reject(e));
						})
						.catch((e) => reject(e));
				} else {
					reject(new Error('no auth token'));
				}
			});
		},
		[authToken],
	);

	const hcDecrypt = useCallback(
		async (encryptedData: string) => {
			return new Promise((resolve, reject) => {
				if (!lsTest()) {
					reject(new Error('localStorage is not available'));
				}

				if (authToken) {
					if (encryptedData) {
						setDecryptStatus(FetchStatus.Loading);
						fetch(`${NITRO_API_URL}/hcDecrypt`, {
							method: 'POST',
							headers: {
								'Content-type': 'application/json',
							},
							body: JSON.stringify({ authToken, encryptedData }),
						})
							.then((resp) => {
								resp.json().then((json) => {
									setDecryptStatus(FetchStatus.Success);
									resolve(json);
								});
							})
							.catch((e) => {
								// Keep error log for production debugging
								console.error('Failed to decrypt with Handcash:', e);
								setDecryptStatus(FetchStatus.Error);
								reject(e);
							});
					}
				} else {
					reject(new Error('no auth token'));
				}
			});
		},
		[authToken],
	);

	const value = useMemo(
		() => ({
			setProfile,
			profile,
			getProfile,
			authToken,
			setAuthToken,
			hcEncrypt,
			hcDecrypt,
			decryptStatus,
		}),
		[authToken, profile, setProfile, getProfile, setAuthToken, hcEncrypt, hcDecrypt, decryptStatus],
	);

	return <HandcashContext.Provider value={value} {...props} />;
};

const useHandcash = () => {
	const context = useContext(HandcashContext);
	if (context === undefined) {
		throw new Error('useHandcash must be used within an HandcashProvider');
	}
	return context;
};

export { HandcashProvider, useHandcash };
