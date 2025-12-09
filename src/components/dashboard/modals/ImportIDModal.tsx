import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { FaCheck, FaFileImport, FaKey } from 'react-icons/fa';
import { ImProfile } from 'react-icons/im';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useBap } from '../../../context/bap';
import { toggleProfile } from '../../../reducers/profileReducer';
import type { RootState } from '../../../store';
import { processBackupFile } from '../../../utils/backupDecryptor';
import type { BackupDetectionResult } from '../../../utils/backupDetector';
import { BackupType, detectBackupType } from '../../../utils/backupDetector';
import { FetchStatus } from '../../../utils/common';

const ImportIDModal: React.FC = () => {
	const isProfileOpen = useSelector((state: RootState) => state.profile.isOpen);
	const { onFileChange, identity, loadIdentityStatus } = useBap();
	const inputFileRef = useRef<HTMLInputElement>(null);
	const dispatch = useDispatch();

	const [fileContent, setFileContent] = useState<string>('');
	const [needsPassword, setNeedsPassword] = useState(false);
	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [detectedType, setDetectedType] = useState<BackupType>(BackupType.Unknown);
	const [isProcessing, setIsProcessing] = useState(false);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open && !isProcessing) {
				dispatch(toggleProfile());
			}
		},
		[isProcessing, dispatch],
	);

	const uploadIdentity = useCallback(() => {
		inputFileRef.current?.click();
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

	const handleFileSelect = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
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
		},
		[processDetectedBackup],
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

	return (
		<Dialog open={isProfileOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				{identity ? (
					<div className="text-center py-4">
						<div className="text-primary text-5xl mb-4">
							<FaCheck className="mx-auto" />
						</div>
						<DialogHeader className="text-center">
							<DialogTitle className="text-center">Import Successful!</DialogTitle>
							<DialogDescription className="text-center">
								Your messages will be signed with your identity key.
							</DialogDescription>
						</DialogHeader>
						<Button onClick={() => dispatch(toggleProfile())} className="mt-6">
							<FaCheck className="mr-2 h-4 w-4" /> Got it
						</Button>
					</div>
				) : needsPassword ? (
					<div>
						<DialogHeader>
							<div className="flex items-center gap-3">
								<FaKey className="text-3xl text-primary" />
								<div>
									<DialogTitle>Password Required</DialogTitle>
									<DialogDescription>{getBackupTypeLabel(detectedType)} detected</DialogDescription>
								</div>
							</div>
						</DialogHeader>

						<p className="text-muted-foreground my-4">
							This backup file is encrypted. Please enter your password to decrypt it.
						</p>

						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
							placeholder="Enter password..."
							disabled={isProcessing}
						/>

						{passwordError && <p className="text-destructive text-sm mt-2">{passwordError}</p>}

						<div className="flex gap-3 mt-4">
							<Button
								onClick={handlePasswordSubmit}
								disabled={isProcessing || !password}
								className="flex-1"
							>
								{isProcessing ? 'Decrypting...' : 'Decrypt'}
							</Button>
							<Button
								variant="secondary"
								onClick={() => {
									setNeedsPassword(false);
									setPassword('');
									setPasswordError('');
								}}
								disabled={isProcessing}
								className="flex-1"
							>
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<div>
						<DialogHeader>
							<div className="flex items-center gap-3">
								<ImProfile className="text-3xl text-primary" />
								<DialogTitle>Import Identity</DialogTitle>
							</div>
						</DialogHeader>

						{loadIdentityStatus === FetchStatus.Error && (
							<div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md my-4">
								Error loading identity file. Please try again.
							</div>
						)}

						<div className="bg-muted p-4 rounded-md my-4">
							<h3 className="font-semibold mb-2">Supported Formats:</h3>
							<ul className="text-sm space-y-1 text-muted-foreground">
								<li>BAP Master Backup (encrypted/decrypted)</li>
								<li>BAP Member Backup (encrypted/decrypted)</li>
								<li>WIF Backup</li>
								<li>Legacy Identity Files</li>
							</ul>
						</div>

						<div className="text-center">
							<Button onClick={uploadIdentity} disabled={isProcessing}>
								<FaFileImport className="mr-2 h-4 w-4" />
								{isProcessing ? 'Processing...' : 'Choose Backup File'}
							</Button>

							<p className="text-sm text-muted-foreground mt-3">
								Files are processed locally and never uploaded
							</p>
						</div>
					</div>
				)}

				<input
					type="file"
					ref={inputFileRef}
					onChange={handleFileSelect}
					accept=".json,.txt,.bak,.backup"
					className="hidden"
				/>
			</DialogContent>
		</Dialog>
	);
};

export default ImportIDModal;
