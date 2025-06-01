# Message Endpoint Expected Response Format

The app expects the `/social/channels/{channelName}/messages` endpoint to return:

```typescript
interface MessageResponse {
  results: Message[];
  signers?: Array<{
    idKey: string;
    paymail: string;
    logo?: string;
    isFriend?: boolean;
  }>;
}
```

## Message Formats Supported

The app handles two different message formats that can be in the `results` array:

### Format 1: Simple Message Object
```typescript
interface Message {
  txid?: string;
  tx?: { h: string };
  paymail?: string;
  type?: string;        // Usually "message"
  context?: string;     // "channel" or "messageID" 
  channel?: string;     // Channel name
  messageID?: string;   // For replies/reactions
  encrypted?: string;   // "true" if encrypted
  bapID?: string;       // Bitcoin Attestation Protocol ID
  content?: string;     // The actual message text
  timestamp?: number;   // Unix timestamp
  createdAt?: number;   // Alternative timestamp field
  blk?: { t: number };  // Block time
  myBapId?: string;     // Current user's BAP ID
}
```

### Format 2: BMAP Transaction Format
```typescript
interface Message {
  txid?: string;
  tx?: { h: string };
  MAP?: Array<{        // Bitcoin Metadata Attestation Protocol
    paymail?: string;
    type?: string;
    context?: string;
    channel?: string;
    messageID?: string;
    encrypted?: string;
    bapID?: string;
  }>;
  B?: Array<{          // Bitcoin file data
    encoding: string;
    Data: {
      utf8: string;    // Message content here
    };
  }>;
  timestamp?: number;
  blk?: { t: number };
  myBapId?: string;
}
```

## How the App Processes Messages

1. **Content Extraction**: The app looks for content in this order:
   - `msg.content` (Format 1)
   - `msg.B[0].Data.utf8` (Format 2)
   - Empty string as fallback

2. **Metadata Extraction**: The app checks for metadata in:
   - Direct properties (`msg.paymail`, `msg.type`, etc.)
   - MAP array (`msg.MAP[0].paymail`, `msg.MAP[0].type`, etc.)

3. **Timestamp**: The app uses the first available:
   - `msg.timestamp`
   - `msg.createdAt`
   - `msg.blk.t`

4. **Transformation**: All messages are transformed to the internal BmapTx format:
```typescript
interface BmapTx {
  tx: { h: string };
  MAP: Array<{ /* metadata */ }>;
  B: Array<{ 
    encoding: string;
    Data: { utf8: string };
    'content-type': string;
  }>;
  timestamp?: number;
  blk?: { t: number };
  myBapId?: string;
}
```

## Real-time Messages (via EventSource)

The socket middleware expects real-time messages in BMAP format with:
- `data.MAP[0].type` = "message"
- `data.MAP[0].context` = "channel" or "bapID" (for DMs)
- `data.B[0].Data.utf8` or `data.B[0].content` for message content

## Key Points

1. The endpoint should return messages sorted by timestamp (newest first)
2. The `signers` array is optional but helps populate user information
3. Both message formats should be supported for backward compatibility
4. Content can be in either `content` field or `B[0].Data.utf8`
5. All metadata fields are optional but `type` should be "message"