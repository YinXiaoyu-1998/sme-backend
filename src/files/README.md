# Files API

Base path: `/files`

## Upload Files

**Request schema**

Multipart form-data with field name `files` (up to 10 files) and `userId`.

Supported MIME types:
- `application/pdf`
- `text/csv`
- `application/csv`
- `application/vnd.ms-excel`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Response schema**

```json
{
  "count": "number",
  "files": [
    {
      "id": "string",
      "userId": "string",
      "originalName": "string",
      "filename": "string",
      "path": "string",
      "size": "number",
      "mimeType": "string",
      "status": "string"
    }
  ]
}
```

**curl**

```bash
curl -X POST "http://localhost:4000/files/upload" \
  -F "userId=<userId>" \
  -F "files=@/path/to/file.pdf"
```

## List Files

**Request schema**

Query parameter: `userId` (string).

**Response schema**

```json
{
  "count": "number",
  "files": [
    {
      "id": "string",
      "userId": "string",
      "originalName": "string",
      "filename": "string",
      "path": "string",
      "size": "number",
      "mimeType": "string",
      "status": "string"
    }
  ]
}
```

**curl**

```bash
curl -X GET "http://localhost:4000/files/list?userId=<userId>"
```
