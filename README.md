# Gatekeeper API

Gatekeeper is a **production‑grade API key management and rate‑limiting service**
built with **Node.js, Redis, and Redis Lua**.
It is docker and Jenkins backed.  
It is designed to run as an **independent infrastructure service** that other
products can rely on safely.

---

## ✨ What Problem Does Gatekeeper Solve?

> “I need to protect my APIs with API keys and rate limits that are **correct under concurrency**, observable, and reliable in production.”

Gatekeeper provides:

- Secure API key issuance and lifecycle management
- Atomic, race‑free rate limiting using Redis Lua
- Clear error responses and HTTP‑standard headers
- First‑class observability (logs + metrics)
- A clean separation between **build‑time** and **run‑time** concerns

---

## 🧠 Key Design Principles

- **Fail‑closed by default**  
  If Redis is unavailable, requests are rejected instead of silently allowed.

- **Atomic correctness**  
  Rate limiting is enforced inside Redis using Lua scripts to avoid race conditions.

- **Immutable production artifacts**  
  The Docker image does not depend on Redis at build time.

- **Dev ≠ Prod**  
  Docker Compose is used only for local development, never in production.

---

## 🏗 Architecture Overview

Clients → Gatekeeper API (Node.js) → Redis → Redis Lua Script

---

## 🚀 Features

### API Key Management

- Create API keys (admin‑only)
- Disable API keys
- Rotate API keys
- Per‑key rate limit configuration

### Rate Limiting

- Token bucket algorithm
- Burst support
- Atomic enforcement using Redis Lua
- Standard headers:
  - X‑RateLimit‑Limit
  - X‑RateLimit‑Remaining
  - X‑RateLimit‑Reset
  - Retry‑After

### Observability

- Structured JSON logs
- Prometheus‑style metrics
- Health endpoint

---

## 🔐 Authentication

### Admin Authentication

X‑Admin‑Secret: <ADMIN_SECRET>

### Client Authentication

X‑API‑Key: <API_KEY>

---

## 📡 API Endpoints (Summary)

GET /health  
GET /metrics  
POST /admin/api-keys  
POST /admin/api-keys/:key/disable  
POST /admin/api-keys/:key/rotate  
POST /v1/limit/check

Swagger UI available at `/docs`.

---

## 🐳 Running in Production

```bash
docker build -t gatekeeper:prod .

docker network create gatekeeper-net

docker run -d --name redis --network gatekeeper-net redis:7-alpine

docker run --rm \
  --network gatekeeper-net \
  -p 3002:3002 \
  -e PORT=3002 \
  -e REDIS_URL=redis://redis:6379 \
  -e ADMIN_SECRET=<SECURE_ADMIN_SECRET_KEY> \
  gatekeeper:prod
```

---

## 📈 Metrics

- gatekeeper_requests_total
- gatekeeper_requests_allowed
- gatekeeper_requests_blocked
- gatekeeper_auth_failures
- gatekeeper_rate_limiter_errors

---

## 🧩 Why Redis Lua?

Redis Lua guarantees **atomic execution**, preventing race conditions under
concurrent load.

---

## 🧑‍💻 License

MIT
