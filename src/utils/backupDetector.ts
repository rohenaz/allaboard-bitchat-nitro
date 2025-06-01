import type {
  BapMasterBackup,
  BapMemberBackup,
  OneSatBackup,
  WifBackup,
} from 'bitcoin-backup';

export enum BackupType {
  BapMaster = 'BapMaster',
  BapMember = 'BapMember',
  Wif = 'Wif',
  OneSat = 'OneSat',
  LegacyPlaintext = 'LegacyPlaintext',
  Unknown = 'Unknown',
}

export interface BackupDetectionResult {
  type: BackupType;
  isEncrypted: boolean;
  data:
    | BapMasterBackup
    | BapMemberBackup
    | OneSatBackup
    | WifBackup
    | { xprv: string; ids: { idKey: string }[] }
    | Record<string, unknown>
    | string;
}

/**
 * Detects the type of backup file from its content
 */
export function detectBackupType(content: string): BackupDetectionResult {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);

    // Check for encrypted backup format (bitcoin-backup package)
    if (parsed.data && parsed.salt && parsed.iv) {
      // Encrypted backup - need to check the schema field after decryption
      return {
        type: BackupType.Unknown, // Will be determined after decryption
        isEncrypted: true,
        data: parsed,
      };
    }

    // Check for BapMasterBackup (decrypted)
    if (parsed.hdKey && parsed.identities && Array.isArray(parsed.identities)) {
      return {
        type: BackupType.BapMaster,
        isEncrypted: false,
        data: parsed as BapMasterBackup,
      };
    }

    // Check for BapMemberBackup (decrypted)
    if (
      parsed.identity &&
      typeof parsed.identity === 'object' &&
      parsed.identity.name &&
      parsed.identity.rootAddress
    ) {
      return {
        type: BackupType.BapMember,
        isEncrypted: false,
        data: parsed as BapMemberBackup,
      };
    }

    // Check for WifBackup (decrypted)
    if (parsed.wif && typeof parsed.wif === 'string') {
      return {
        type: BackupType.Wif,
        isEncrypted: false,
        data: parsed as WifBackup,
      };
    }

    // Check for OneSatBackup (decrypted)
    if (parsed.ordinals && parsed.paymail) {
      return {
        type: BackupType.OneSat,
        isEncrypted: false,
        data: parsed as OneSatBackup,
      };
    }

    // Check for legacy plaintext format (current implementation)
    if (parsed.xprv && parsed.ids && Array.isArray(parsed.ids)) {
      return {
        type: BackupType.LegacyPlaintext,
        isEncrypted: false,
        data: parsed,
      };
    }

    return {
      type: BackupType.Unknown,
      isEncrypted: false,
      data: parsed,
    };
  } catch {
    // Not valid JSON, might be a raw WIF or other format
    return {
      type: BackupType.Unknown,
      isEncrypted: false,
      data: content,
    };
  }
}

/**
 * Converts different backup formats to the legacy format expected by the app
 */
export function convertToLegacyFormat(
  backupResult: BackupDetectionResult,
): { xprv: string; ids: { idKey: string }[] } | null {
  switch (backupResult.type) {
    case BackupType.BapMaster: {
      const master = backupResult.data as BapMasterBackup;
      // Convert identities to the expected format
      const ids = master.identities.map((identity) => ({
        idKey: identity.name || identity.rootAddress,
      }));
      return {
        xprv: master.hdKey.xprv,
        ids,
      };
    }

    case BackupType.BapMember: {
      const member = backupResult.data as BapMemberBackup;
      return {
        xprv: member.identity.xprv,
        ids: [
          {
            idKey: member.identity.name || member.identity.rootAddress,
          },
        ],
      };
    }

    case BackupType.Wif: {
      // WIF backup doesn't have HD key structure
      console.warn('WIF backup format is not fully supported for BAP identity');
      return null;
    }

    case BackupType.LegacyPlaintext:
      return backupResult.data;

    default:
      return null;
  }
}
