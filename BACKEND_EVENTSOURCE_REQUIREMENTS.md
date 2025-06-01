# Backend EventSource (SSE) Endpoint Requirements

## Endpoint: `GET /social/s/$all/{base64_query}`

### Query Format
The base64-encoded query decodes to:
```json
{
  "v": 3,
  "q": {
    "find": {
      "MAP.type": {
        "$in": ["friend", "message", "like", "pin_channel"]
      }
    }
  }
}
```

### Expected EventSource Response Format

This is a Server-Sent Events (SSE) endpoint that should:
1. Set headers: `Content-Type: text/event-stream`
2. Keep connection alive with periodic heartbeats
3. Send real-time updates as they occur

### Event Data Structure

Each event should be sent as:
```
data: {"type":"message","data":[{...messageObject...}]}

```
(Note the blank line after data is required by SSE spec)

### Message Object Format by Type

#### 1. Message Type
```json
{
  "type": "message",
  "data": [{
    "tx": { "h": "transaction_hash" },
    "MAP": [{
      "app": "bitchatnitro.com",
      "type": "message",
      "paymail": "user@example.com",
      "context": "channel",      // or "bapID" for DMs
      "channel": "general",      // channel name
      "bapID": "recipient_bap_id" // for DMs
    }],
    "B": [{
      "encoding": "utf-8",
      "content": "Message content here"
      // OR
      "content": "Message content here"
    }],
    "AIP": [{
      "bapId": "sender_bap_id",
      "address": "sender_address"  // optional
    }],
    "timestamp": 1748143158,
    "blk": { "t": 1748143158 }  // optional
  }]
}
```

#### 2. Like/Reaction Type
```json
{
  "type": "like",
  "data": [{
    "tx": { "h": "reaction_tx_hash" },
    "MAP": [{
      "type": "like",
      "context": "tx",           // or "messageID"
      "tx": "target_message_tx", // what's being liked
      "messageID": "target_id",  // alternative target
      "emoji": "👍"              // the reaction emoji
    }],
    "AIP": [{
      "bapId": "reactor_bap_id"
    }],
    "timestamp": 1748143158
  }]
}
```

#### 3. Friend Request Type
```json
{
  "type": "friend",
  "data": [{
    "tx": { "h": "friend_request_tx" },
    "MAP": [{
      "type": "friend",
      "bapID": "recipient_bap_id",
      "publicKey": "optional_public_key"
    }],
    "AIP": [{
      "bapId": "requester_bap_id",
      "address": "requester_address"
    }],
    "timestamp": 1748143158
  }]
}
```

#### 4. Pin Channel Type
```json
{
  "type": "pin_channel",
  "data": [{
    "tx": { "h": "pin_tx_hash" },
    "MAP": [{
      "type": "pin_channel",
      "channel": "channel_name"
    }],
    "AIP": [{
      "bapId": "user_who_pinned"
    }],
    "timestamp": 1748143158
  }]
}
```

### Important Requirements

1. **Real-time**: Events should be pushed as soon as they occur
2. **Array Wrapper**: Each event's `data` field contains an array (even for single items)
3. **Consistent Structure**: Always include `tx`, `MAP`, and `timestamp`
4. **Optional AIP**: Include when available for author identification
5. **Content Flexibility**: Message content should be in `B[0].content`

### SSE Format Example

```
data: {"type":"message","data":[{"tx":{"h":"abc123"},"MAP":[{"type":"message","paymail":"user@example.com","context":"channel","channel":"general"}],"B":[{"encoding":"utf-8","content":"Hello world"}],"timestamp":1748143158}]}

data: {"type":"like","data":[{"tx":{"h":"def456"},"MAP":[{"type":"like","context":"tx","tx":"abc123","emoji":"❤️"}],"timestamp":1748143159}]}

```

### Heartbeat/Keep-Alive

Send periodic comments to keep connection alive:
```
: heartbeat

```

### Error Handling

If an error occurs, send:
```
event: error
data: {"error": "Error message here"}

```

### Testing Notes

1. The frontend expects the outer wrapper with `type` and `data` fields
2. The `data` field must be an array
3. Each item in the array should follow the BMAP transaction format
4. The frontend uses `data[0]` to access the first (usually only) item
5. All timestamps should be Unix timestamps (seconds since epoch)