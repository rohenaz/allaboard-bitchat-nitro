# BMAP API Expected Response Structures

Based on the frontend code expectations and curl testing:

## /channels endpoint
Current response (minimal):
```json
[
  { "channel": "nitro" },
  { "channel": "test" }
]
```

Expected response (based on Channel interface):
```json
[
  {
    "channel": "nitro",
    "last_message": "Latest message content",
    "last_message_time": 1748143158,
    "messages": 1234,
    "creator": "satchmo@handcash.io"
  }
]
```

## /channels/:channelId/messages endpoint
Current response structure:
```json
{
  "channel": "test",
  "page": 1,
  "limit": 100,
  "count": 1506,
  "results": [...messages array...],
  "signers": []
}
```

Expected by frontend (MessageResponse interface):
```json
{
  "results": [...messages array...],
  "signers": [
    {
      "idKey": "string",
      "paymail": "string",
      "logo": "string (optional)",
      "isFriend": "boolean (optional)"
    }
  ]
}
```

## /identities endpoint
Current response has validation errors expecting:
- Each identity object should have `_id` field (currently has `idKey`)
- The `identity` field is a JSON string that needs to be parsed

Expected structure:
```json
[
  {
    "_id": "string (currently missing, using idKey)",
    "idKey": "string",
    "addresses": [...],
    "identity": {
      "alternateName": "string",
      "description": "string",
      "image": "string",
      "paymail": "string"
    },
    "block": 123456,
    "timestamp": 1234567890
  }
]
```

## Message Structure (BmapTx)
Messages in results arrays should have:
```json
{
  "tx": { "h": "transaction hash" },
  "_id": "optional string",
  "MAP": [{
    "cmd": "SET (optional)",
    "app": "bitchatnitro.com",
    "type": "message",
    "paymail": "sender@example.com",
    "context": "channel",
    "channel": "test",
    "messageID": "optional",
    "encrypted": "optional",
    "bapID": "optional",
    "emoji": "optional for reactions"
  }],
  "B": [{
    "content": "message content (optional)",
    "content-type": "text/plain (optional)",
    "encoding": "utf-8",
    "content": "message content"
  }],
  "timestamp": 1234567890,
  "blk": {
    "i": 123456,
    "t": 1234567890,
    "h": "block hash (optional)"
  }
}
```

## Event Stream Message Format
When messages come through the event stream:
```json
{
  "type": "message",
  "data": [{
    "_id": "message id",
    "tx": { "h": "transaction hash" },
    "B": [{ 
      "content": "hello?",
      "content-type": "text/plain",
      "encoding": "utf-8"
    }],
    "MAP": [{
      "cmd": "SET",
      "app": "bitchatnitro.com",
      "type": "message",
      "paymail": "Anonymous@yours.org",
      "context": "channel",
      "channel": "test"
    }],
    "blk": { "i": 0, "t": 0, "h": "" },
    "timestamp": 1748143158
  }]
}
```

## Validation Issues Found

1. **Encoding field**: Sometimes missing, expected to be "utf-8" string
2. **Identity field**: API returns object but validation expects different structure
3. **Channel metadata**: /channels endpoint missing required fields
4. **Message wrapper**: Some endpoints wrap results differently than expected

## Recommendations

1. Standardize response wrapper: `{ results: [...], signers: [...] }`
2. Ensure all encoding fields are present as "utf-8"
3. Add missing channel metadata fields
4. Consider making more fields optional in validation schema
5. Document exact field requirements in OpenAPI/Swagger spec