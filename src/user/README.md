# User API

Base path: `/user`

## Register

**Request schema**

```json
{
  "email": "string",
  "password": "string (min 8 chars)",
  "name": "string (optional)"
}
```

**Response schema**

```json
{
  "accessToken": "string",
  "accessExpiresAt": "string (ISO date)",
  "refreshExpiresAt": "string (ISO date)",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

**Notes**

- Refresh token is set as an HttpOnly cookie named `refresh_token`.
- Register automatically logs the user in.

**curl**

```bash
curl -X POST "http://localhost:4000/user/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123","name":"Demo"}'
```

## Login

**Request schema**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response schema**

```json
{
  "accessToken": "string",
  "accessExpiresAt": "string (ISO date)",
  "refreshExpiresAt": "string (ISO date)",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

**Notes**

- Refresh token is set as an HttpOnly cookie named `refresh_token`.
- Client stores access token in memory and uses `/user/refresh` when needed.

**curl**

```bash
curl -X POST "http://localhost:4000/user/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'
```

## Refresh

**Request schema**

No body. Uses HttpOnly `refresh_token` cookie.

**Response schema**

```json
{
  "accessToken": "string",
  "accessExpiresAt": "string (ISO date)",
  "refreshExpiresAt": "string (ISO date)",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

**curl**

```bash
curl -X POST "http://localhost:4000/user/refresh" \
  --cookie "refresh_token=<refreshToken>"
```

## Logout

**Request schema**

No body. Uses HttpOnly `refresh_token` cookie.

**Response schema**

```json
{
  "success": "boolean"
}
```

**curl**

```bash
curl -X POST "http://localhost:4000/user/logout" \
  --cookie "refresh_token=<refreshToken>"
```

## Me (protected)

**Request schema**

No body. Requires `Authorization: Bearer <accessToken>`.

**Response schema**

```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

**curl**

```bash
curl -X GET "http://localhost:4000/user/me" \
  -H "Authorization: Bearer <accessToken>"
```

## Deactivate (protected)

**Request schema**

No body. Requires `Authorization: Bearer <accessToken>`.

**Response schema**

```json
{
  "success": "boolean"
}
```

**curl**

```bash
curl -X POST "http://localhost:4000/user/deactivate" \
  -H "Authorization: Bearer <accessToken>"
```

## Test (protected)

**Request schema**

No body. Requires `Authorization: Bearer <accessToken>`.

**Response schema**

Empty response body.

**curl**

```bash
curl -X GET "http://localhost:4000/user/test" \
  -H "Authorization: Bearer <accessToken>"
```
