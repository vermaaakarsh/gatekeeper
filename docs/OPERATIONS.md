
# Operations Guide – Gatekeeper

## 1. Purpose
This document describes how Gatekeeper is expected to be run, monitored,
and operated in production environments.

---

## 2. Startup Requirements

Required environment variables:
- `PORT`
- `REDIS_URL`
- `ADMIN_SECRET`

Startup will fail if Redis is unavailable.

---

## 3. Health & Monitoring

### Health Endpoint
- `GET /health`
- Indicates process liveness only

### Metrics Endpoint
- `GET /metrics`
- Prometheus-compatible counters

---

## 4. Logging

- Structured JSON logs
- Request IDs included
- Rate-limit decisions logged

Logs are intended for centralized aggregation.

---

## 5. Scaling Model

- Gatekeeper instances are stateless
- Horizontal scaling is supported
- Redis coordinates shared state

---

## 6. Failure Modes

| Failure | Behavior |
|------|--------|
| Redis unavailable | Requests rejected |
| Instance crash | Traffic rerouted |
| High traffic | Rate limits enforced |

---

## 7. Shutdown Behavior

- Graceful shutdown on SIGTERM/SIGINT
- HTTP server stops accepting new requests
- Redis connections closed cleanly

---

## 8. Backup & Recovery

- Redis persistence is external
- Gatekeeper stores no durable state

---

## 9. Summary

Gatekeeper is designed to be operationally boring: predictable startup,
explicit failure, and simple horizontal scaling.
