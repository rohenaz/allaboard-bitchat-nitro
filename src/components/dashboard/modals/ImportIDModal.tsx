import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCheck, FaFileImport, FaKey } from 'react-icons/fa';
import { ImProfile } from 'react-icons/im';
import { useDispatch, useSelector } from 'react-redux';
import { useBap } from '../../../context/bap';
import { toggleProfile } from '../../../reducers/profileReducer';
import type { RootState } from '../../../store';
import { processBackupFile } from '../../../utils/backupDecryptor';
import {
	type BackupDetectionResult,
	BackupType,
	detectBackupType,
} from '../../../utils/backupDetector';
import { FetchStatus } from '../../../utils/common';

const ImportIDModal: React.FC = () => {
	const isProfileOpen = useSelector((state: RootState) => state.profile.isOpen);
	const { onFileChange, identity, loadIdentityStatus } = useBap();
	const inputFileRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const dispatch = useDispatch();

	const [fileContent, setFileContent] = useState<string>('');
	const [needsPassword, setNeedsPassword] = useState(false);
	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [detectedType, setDetectedType] = useState<BackupType>(BackupType.Unknown);
	const [isProcessing, setIsProcessing] = useState(false);

	// Handle outside clicks
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node) && !isProcessing) {
				dispatch(toggleProfile());
			}
		};

		if (isProfileOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isProfileOpen, isProcessing, dispatch]);

	const uploadIdentity = useCallback(() => {
		inputFileRef.current?.click();
	}, []);

	const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsProcessing(true);
		setPasswordError('');

		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const text = e.target?.result as string;
				setFileContent(text);

				// Detect backup type
				const detection = detectBackupType(text);
				setDetectedType(detection.type);

				// Process the file
				const result = await processBackupFile(text);

				if (result.needsPassword) {
					setNeedsPassword(true);
					setIsProcessing(false);
				} else if (result.success && result.result) {
					// Convert to legacy format and process
					await processDetectedBackup(result.result);
				} else {
					throw new Error(result.error || 'Failed to process backup');
				}
			} catch (error) {
				console.error('Failed to read file:', error);
				setPasswordError(error instanceof Error ? error.message : 'Failed to read file');
				setIsProcessing(false);
			}
		};
		reader.readAsText(file);
	}, []);

	const processDetectedBackup = useCallback(
		async (detectionResult: BackupDetectionResult) => {
			try {
				// Use the existing onFileChange handler with the processed content
				const mockEvent = {
					target: {
						files: [new File([JSON.stringify(detectionResult.data)], 'backup.json')],
					},
				} as unknown as React.ChangeEvent<HTMLInputElement>;

				await onFileChange(mockEvent);
				setIsProcessing(false);
				setNeedsPassword(false);
				setPassword('');
			} catch (error) {
				console.error('Failed to process backup:', error);
				setPasswordError('Failed to import identity');
				setIsProcessing(false);
			}
		},
		[onFileChange],
	);

	const handlePasswordSubmit = useCallback(async () => {
		if (!password || password.length < 8) {
			setPasswordError('Password must be at least 8 characters');
			return;
		}

		setIsProcessing(true);
		setPasswordError('');

		try {
			const result = await processBackupFile(fileContent, password);

			if (result.success && result.result) {
				await processDetectedBackup(result.result);
			} else {
				setPasswordError(result.error || 'Invalid password');
				setIsProcessing(false);
			}
		} catch (_error) {
			setPasswordError('Failed to decrypt backup');
			setIsProcessing(false);
		}
	}, [fileContent, password, processDetectedBackup]);

	const getBackupTypeLabel = (type: BackupType): string => {
		switch (type) {
			case BackupType.BapMaster:
				return 'BAP Master Backup';
			case BackupType.BapMember:
				return 'BAP Member Backup';
			case BackupType.Wif:
				return 'WIF Backup';
			case BackupType.OneSat:
				return '1Sat Backup';
			case BackupType.LegacyPlaintext:
				return 'Legacy Identity File';
			default:
				return 'Unknown Format';
		}
	};

	if (!isProfileOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div
				className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full"
				ref={modalRef}
			>
				{identity ? (
					<div className="text-center">
						<div className="text-green-500 text-5xl mb-4">
							<FaCheck className="mx-auto" />
						</div>
						<h3 className="text-xl font-bold mb-2">Import Successful!</h3>
						<p className="text-gray-600 dark:text-gray-300 mb-6">
							Your messages will be signed with your identity key.
						</p>
						<button
							type="button"
							onClick={() => dispatch(toggleProfile())}
							className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-md hover:opacity-80 transition-opacity"
						>
							<FaCheck className="inline mr-2" /> Got it
						</button>
					</div>
				) : needsPassword ? (
					<div>
						<div className="flex items-center mb-6">
							<FaKey className="text-3xl mr-3 text-blue-500" />
							<div>
								<h2 className="text-xl font-bold">Password Required</h2>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{getBackupTypeLabel(detectedType)} detected
								</p>
							</div>
						</div>

						<p className="text-gray-600 dark:text-gray-300 mb-4">
							This backup file is encrypted. Please enter your password to decrypt it.
						</p>

						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
							placeholder="Enter password..."
							className="w-full px-4 py-2 border rounded-md mb-4 dark:bg-gray-700 dark:border-gray-600"
							disabled={isProcessing}
						/>

						{passwordError && <p className="text-red-500 text-sm mb-4">{passwordError}</p>}

						<div className="flex gap-3">
							<button
								type="button"
								onClick={handlePasswordSubmit}
								disabled={isProcessing || !password}
								className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isProcessing ? 'Decrypting...' : 'Decrypt'}
							</button>
							<button
								type="button"
								onClick={() => {
									setNeedsPassword(false);
									setPassword('');
									setPasswordError('');
								}}
								disabled={isProcessing}
								className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:opacity-80"
							>
								Cancel
							</button>
						</div>
					</div>
				) : (
					<div>
						<div className="flex items-center mb-6">
							<ImProfile className="text-3xl mr-3 text-blue-500" />
							<h2 className="text-xl font-bold">Import Identity</h2>
						</div>

						{loadIdentityStatus === FetchStatus.Error && (
							<div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md mb-4">
								Error loading identity file. Please try again.
							</div>
						)}

						<div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-6">
							<h3 className="font-semibold mb-2">Supported Formats:</h3>
							<ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
								<li>• BAP Master Backup (encrypted/decrypted)</li>
								<li>• BAP Member Backup (encrypted/decrypted)</li>
								<li>• WIF Backup</li>
								<li>• Legacy Identity Files</li>
							</ul>
						</div>

						<div className="text-center">
							<button
								type="button"
								onClick={uploadIdentity}
								disabled={isProcessing}
								className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
							>
								<FaFileImport className="mr-2" />
								{isProcessing ? 'Processing...' : 'Choose Backup File'}
							</button>

							<p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
								Files are processed locally and never uploaded
							</p>
						</div>
					</div>
				)}
			</div>

			<input
				type="file"
				ref={inputFileRef}
				onChange={handleFileSelect}
				accept=".json,.txt,.bak,.backup"
				className="hidden"
			/>
		</div>
	);
};

export default ImportIDModal;
