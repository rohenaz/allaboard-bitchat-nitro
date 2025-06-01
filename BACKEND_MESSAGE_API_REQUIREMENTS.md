# Backend API Requirements for Messages Endpoint

## Overview
The frontend is expecting specific response formats from the messages endpoint. Currently there appear to be mismatches between what the API returns and what the frontend expects.

## Endpoint: `GET /social/channels/{channelName}/messages`

### Expected Response Structure
Remove any wrapper fields like `channel`, `page`, `limit`, `count`. The response should be:

```json
{
  "results": [ /* array of messages */ ],
  "signers": [ /* optional array of user info */ ]
}
```

### Message Object Formats
The frontend supports TWO message formats. The API can return either format in the `results` array:

#### Format 1: Simple Message Object
```json
{
  "txid": "abc123...",
  "paymail": "user@example.com",
  "type": "message",
  "context": "channel",
  "channel": "general",
  "content": "Hello world!",
  "timestamp": 1748143158,
  "bapID": "user's BAP ID",
  "encrypted": "true", // optional, string not boolean
  "messageID": "xyz789..." // optional, for replies
}
```

#### Format 2: BMAP Transaction Object
```json
{
  "txid": "abc123...",
  "tx": { "h": "abc123..." },
  "MAP": [{
    "paymail": "user@example.com",
    "type": "message",
    "context": "channel",
    "channel": "general",
    "bapID": "user's BAP ID",
    "encrypted": "true", // optional
    "messageID": "xyz789..." // optional
  }],
  "B": [{
    "encoding": "utf-8",
    "Data": {
      "utf8": "Hello world!"
    }
  }],
  "timestamp": 1748143158,
  "blk": { "t": 1748143158 } // optional block time
}
```

### Important Field Notes

1. **Content Location**: 
   - Format 1: Put message text in `content` field
   - Format 2: Put message text in `B[0].content`

2. **Timestamp**: Use one of these (frontend checks in order):
   - `timestamp` (preferred)
   - `createdAt`
   - `blk.t`

3. **Message Type**: Always set `type: "message"` for regular messages

4. **Context**: 
   - Use `"channel"` for channel messages
   - Use `"bapID"` for direct messages
   - Use `"messageID"` for replies

5. **Encrypted**: If the message is encrypted, set as string `"true"`, not boolean

### Signers Array (Optional but Recommended)
Include user information for all unique message authors:

```json
"signers": [
  {
    "idKey": "user's identity key",
    "paymail": "user@example.com",
    "logo": "https://example.com/avatar.jpg", // optional
    "isFriend": true // optional
  }
]
```

### Sorting
Messages should be sorted by timestamp in **descending order** (newest first).

### Example Complete Response
```json
{
  "results": [
    {
      "txid": "newest123...",
      "paymail": "alice@example.com",
      "type": "message",
      "context": "channel",
      "channel": "general",
      "content": "This is the newest message",
      "timestamp": 1748143200,
      "bapID": "alice-bap-id"
    },
    {
      "txid": "older456...",
      "tx": { "h": "older456..." },
      "MAP": [{
        "paymail": "bob@example.com",
        "type": "message",
        "context": "channel",
        "channel": "general",
        "bapID": "bob-bap-id"
      }],
      "B": [{
        "encoding": "utf-8",
        "Data": {
          "utf8": "This is an older message"
        }
      }],
      "timestamp": 1748143100
    }
  ],
  "signers": [
    {
      "idKey": "alice-id-key",
      "paymail": "alice@example.com"
    },
    {
      "idKey": "bob-id-key",
      "paymail": "bob@example.com"
    }
  ]
}
```

## Real-time Updates via EventSource

For messages delivered through the EventSource (`/social/s/$all/{query}`), ensure they follow Format 2 (BMAP) structure:

```json
{
  "type": "message",
  "data": [{
    "MAP": [{
      "type": "message",
      "context": "channel",
      "channel": "general",
      "paymail": "user@example.com",
      "bapID": "user-bap-id"
    }],
    "B": [{
      "encoding": "utf-8",
      "Data": { "utf8": "Real-time message content" }
    }],
    "timestamp": 1748143158,
    "tx": { "h": "txid123..." }
  }]
}
```

## Common Issues to Fix

1. **Remove wrapper fields**: Don't include `channel`, `page`, `limit`, `count` in the response
2. **Content field**: Make sure content is in `content` field`, not both - fixed
3. **Encoding**: Always include `encoding: "utf-8"` in B array objects
4. **Type field**: Always include `type: "message"` for regular messages
5. **Timestamp**: Ensure timestamp is a Unix timestamp (seconds since epoch)

## Testing Checklist

- [ ] Response has only `results` and optional `signers` at top level
- [ ] Messages are sorted newest first
- [ ] Each message has either `content` field`
- [ ] Each message has a timestamp
- [ ] Each message has `type: "message"`
- [ ] EventSource messages follow BMAP format
- [ ] No validation errors in frontend console

## Questions for Frontend

If you need to keep pagination info, we can modify the frontend to handle it. Let me know if you need:
- Pagination support
- Different message formats
- Additional metadata fields