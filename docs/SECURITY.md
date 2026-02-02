
# Security Model & Hardening – Gatekeeper

## 1. Purpose
This document describes the security assumptions, threat model, and
hardening decisions for Gatekeeper. It clarifies what the system protects,
what it does not, and why.

---

## 2. Trust Boundaries

### Untrusted Inputs
- All HTTP requests
- Request headers (including API keys)
- Request bodies

### Trusted Components
- Redis
- Redis Lua scripts
- Gatekeeper process
- Deployment environment secrets

---

## 3. Authentication & Authorization

### Admin Authentication
- Header: `X-Admin-Secret`
- Single shared secret
- Full administrative access

**Risk**: Compromise grants full control  
**Mitigation**: Secret rotation, environment isolation

### Client Authentication
- Header: `X-API-Key`
- Keys stored and validated in Redis
- Disabled keys are rejected

---

## 4. Rate Limiting as a Security Control

Rate limiting protects against:
- Abuse
- Credential stuffing
- Accidental overload

Atomic enforcement using Redis Lua prevents bypass under concurrency.

---

## 5. Fail-Closed Behavior

If Redis or the rate limiter is unavailable:
- Requests are rejected
- No traffic is allowed by default

This avoids silent security failures.

---

## 6. Secrets Handling

- Secrets are provided via environment variables
- No secrets are logged
- No secrets are hardcoded

---

## 7. Denial of Service Considerations

- Rate limits bound request volume
- Redis is the only shared bottleneck
- No unbounded in-memory structures exist

---

## 8. Non-Goals

Gatekeeper intentionally does not:
- Encrypt traffic (TLS is delegated to infrastructure)
- Perform user authentication
- Inspect request payloads
- Provide IP-based filtering

---

## 9. Security Review Checklist

- [ ] Redis access restricted
- [ ] Admin secret rotated regularly
- [ ] Metrics endpoint protected if needed
- [ ] Logs monitored for anomalies

---

## 10. Summary

Gatekeeper follows a minimal, explicit security model focused on correctness,
clarity, and predictable failure behavior.
