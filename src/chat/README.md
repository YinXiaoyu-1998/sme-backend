# Chat API

Base path: `/chat`

## Get History

**Request schema**

Query parameter: `fileId` (string).

**Response schema**

```json
[
  {
    "id": "string",
    "content": "string",
    "role": "string",
    "createdAt": "string (ISO date)",
    "chatId": "string | null",
    "fileId": "string | null",
    "userId": "string",
    "generatedFiles": [
      {
        "id": "string",
        "fileType": "string",
        "mimeType": "string",
        "filename": "string",
        "path": "string",
        "url": "string",
        "size": "number",
        "metadata": "object | null",
        "createdAt": "string (ISO date)",
        "updatedAt": "string (ISO date)"
      }
    ]
  }
]
```

**curl**

```bash
curl -X GET "http://localhost:4000/chat/history?fileId=<fileId>"
```

## Chat

**Request schema**

```json
{
  "message": "string",
  "fileId": "string (optional)",
  "userId": "string"
}
```

**Response schema**

```json
{
  "answer": "string",
  "generatedFiles": [
    {
      "id": "string",
      "fileType": "string",
      "mimeType": "string",
      "filename": "string",
      "path": "string",
      "url": "string",
      "size": "number"
    }
  ]
}
```

**curl**

```bash
curl -X POST "http://localhost:4000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","fileId":"<fileId>","userId":"<userId>"}'
```
