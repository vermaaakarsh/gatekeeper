
# Gatekeeper Architecture & Design Document

## 1. Overview
Gatekeeper is a standalone infrastructure service that provides API key
management and rate limiting with strong correctness guarantees under
concurrency. It is designed to be deployed independently and consumed by
other systems via HTTP.

---

## 2. Design Goals
- Correctness under concurrency
- Fail-closed behavior
- Environment-driven configuration
- Production parity across environments

---

## 3. Architecture
Client → Gatekeeper API → Redis → Lua Script

- Node.js handles HTTP, auth, logging, metrics
- Redis stores shared state
- Lua enforces atomic rate limits

---

## 4. Why Redis + Lua
Lua scripts execute atomically inside Redis, eliminating race conditions
that occur with JS-only implementations under concurrent load.

---

## 5. Rate Limiting Model
Token bucket with:
- limit
- window
- burst

All invariants are enforced inside Redis.

---

## 6. API Key Lifecycle
Keys can be created, disabled, and rotated.
Rotation invalidates the old key while preserving limits.

---

## 7. Authentication
- Admin: X-Admin-Secret
- Client: X-API-Key

---

## 8. Observability
- Structured logs
- Prometheus metrics
- Health endpoint

---

## 9. Error Model
Consistent error shape with code, message, and optional details.

---

## 10. Docker & Runtime
- Immutable images
- External Redis
- No orchestration assumptions

---

## 11. Testing Strategy
- Unit tests for pure logic
- Integration tests with real Redis
- Load tests with k6 (external)

---

## 12. CI/CD Readiness
Tests spin up dependencies automatically and require no manual setup.

---

## 13. Non-Goals
Gatekeeper does not act as an API gateway or user auth system.

---

## 14. Future Work
- Per-route limits
- Tiered plans
- Tracing

---

## 15. Summary
Gatekeeper is infrastructure-focused, correctness-first, and safe to
depend on in production.
