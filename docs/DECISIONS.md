
# Architectural Decisions – Gatekeeper

This document records major architectural decisions and their rationale.

---

## 1. Redis + Lua for Rate Limiting

**Decision**: Use Redis Lua scripts for rate limiting  
**Reason**: Guarantees atomicity under concurrency  
**Alternatives Considered**:
- In-process counters (rejected: race conditions)
- Database-backed limits (rejected: latency)

---

## 2. Fail-Closed Semantics

**Decision**: Reject requests when dependencies fail  
**Reason**: Silent allowance is worse than rejection

---

## 3. Stateless Service Design

**Decision**: Keep Gatekeeper stateless  
**Reason**: Enables horizontal scaling and simple recovery

---

## 4. Externalized Redis

**Decision**: Do not bundle Redis  
**Reason**: Supports managed Redis and flexible deployment

---

## 5. Minimal Test Surface

**Decision**: Focus on integration tests with real Redis  
**Reason**: Mocking Redis hides real failure modes

---

## 6. No Embedded Orchestration

**Decision**: Avoid Docker Compose in production  
**Reason**: Keep runtime agnostic to orchestration platform

---

## 7. Summary

These decisions prioritize correctness, clarity, and long-term maintainability
over short-term convenience.
