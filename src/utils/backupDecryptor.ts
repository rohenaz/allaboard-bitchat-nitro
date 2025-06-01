import { decryptBackup as decryptBitcoinBackup } from 'bitcoin-backup';
import {
  type BackupDetectionResult,
  BackupType,
  detectBackupType,
} from './backupDetector';

export interface DecryptionResult {
  success: boolean;
  result?: BackupDetectionResult;
  error?: string;
  needsPassword?: boolean;
}

/**
 * Attempts to decrypt an encrypted backup with a password
 */
export async function decryptBackup(
  encryptedData: string,
  password: string,
): Promise<DecryptionResult> {
  try {
    const decrypted = await decryptBitcoinBackup(encryptedData, password);

    // Now detect the type of the decrypted data
    const detectionResult = detectBackupType(JSON.stringify(decrypted));

    return {
      success: true,
      result: detectionResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Decryption failed',
    };
  }
}

/**
 * Process a backup file content - handles both encrypted and decrypted formats
 */
export async function processBackupFile(
  content: string,
  password?: string,
): Promise<DecryptionResult> {
  // First detect the backup type
  const detection = detectBackupType(content);

  if (detection.isEncrypted) {
    // Encrypted backup - needs password
    if (!password) {
      return {
        success: false,
        needsPassword: true,
        error: 'Password required for encrypted backup',
      };
    }

    // If detection.data is an object (encrypted backup format), convert to string
    const encryptedString =
      typeof detection.data === 'string'
        ? detection.data
        : JSON.stringify(detection.data);
    return decryptBackup(encryptedString, password);
  }

  // Not encrypted, return as-is
  return {
    success: true,
    result: detection,
  };
}
