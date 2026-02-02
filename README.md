# Gatekeeper

Gatekeeper is a Redis-backed, API-key–based rate limiting service designed to run
as an independent microservice.

It provides:
- per-API-key rate limits
- fail-closed behavior
- predictable errors
- Prometheus-style metrics
- production-grade shutdown and observability

---

## Features

- Token bucket rate limiting
- Per-API-key configurable limits
- API key rotation and disabling
- Redis fail-closed semantics
- Structured JSON logs
- `/metrics` endpoint
- Docker-first development

---

## Running Locally

```bash
docker-compose up --build
```

Service runs on:

```
http://localhost:3002
```

---

## Health Check

```http
GET /health
```

Response:
```json
{ "status": "ok" }
```

---

## Creating an API Key (Admin)

```http
POST /admin/api-keys
X-Admin-Secret: <ADMIN_SECRET>
```

Optional body:
```json
{
  "limit": 100,
  "window": 60,
  "burst": 20
}
```

---

## Rate Limit Check

```http
POST /v1/limit/check
X-API-Key: sk_...
```

### Success (200)
```json
{ "allowed": true }
```

Headers:
```
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

### Blocked (429)
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after_seconds": 12
  }
}
```

---

## Disabling an API Key

```http
POST /admin/api-keys/{key}/disable
X-Admin-Secret: <ADMIN_SECRET>
```

---

## Rotating an API Key

```http
POST /admin/api-keys/{key}/rotate
X-Admin-Secret: <ADMIN_SECRET>
```

Returns:
- new API key
- disables old key

---

## Metrics

```http
GET /metrics
```

Prometheus-compatible metrics:
- total requests
- allowed requests
- blocked requests
- auth failures
- backend errors

---

## Failure Semantics

- Redis unavailable → requests fail closed
- No hanging requests
- Explicit error codes
- Graceful shutdown on SIGTERM

---

## Environment Variables

| Name | Description |
|---|---|
| `PORT` | API port |
| `REDIS_URL` | Redis connection URL |
| `ADMIN_SECRET` | Admin authentication secret |
| `LOG_LEVEL` | Log level of the environment |

---

## License

MIT
