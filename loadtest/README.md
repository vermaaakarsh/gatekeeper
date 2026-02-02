
# Gatekeeper Load Tests

This directory contains **optional load tests** used to validate
Gatekeeper’s rate limiting behavior under high concurrency.

These tests are **not** part of normal CI and must be run manually.

---

## Purpose

The primary goal is to verify that:

- Rate limits are enforced **atomically**
- Concurrent requests do **not** exceed configured limits
- Redis Lua prevents race conditions under load

---

## Prerequisites

- Gatekeeper running locally or in a test environment
- Redis reachable by Gatekeeper
- `k6` installed locally

---

## Example Setup

Create a constrained API key to make failures obvious:

```bash
curl -X POST http://localhost:3002/admin/api-keys \
  -H "X-Admin-Secret: <SECURE_ADMIN_SECRET_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "limit": 10, "window": 10, "burst": 0 }'
```

Copy the returned API key.

---

## Run the Load Test

```bash
API_KEY=<your-api-key> k6 run loadtest/rate-limit.k6.js
```

Optional overrides:

```bash
VUS=100 DURATION=30s API_KEY=<your-api-key> k6 run loadtest/rate-limit.k6.js
```

---

## Expected Results

- Majority of requests return `429 Too Many Requests`
- Total allowed requests never exceed the configured limit
- No `5xx` responses
- No Redis or Lua errors in logs

---

## Warning

These tests intentionally generate high load and **must not**
be run against production systems.
