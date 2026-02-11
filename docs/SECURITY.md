# Security Model & Hardening -- Gatekeeper

## 1. Purpose

This document describes the security assumptions, threat model, and
hardening decisions for Gatekeeper.

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

Mitigation: Secret rotation and environment isolation.

### Client Authentication

- Header: `X-API-Key`
- Keys stored and validated in Redis
- Disabled keys are rejected

---

## 4. Rate Limiting as a Security Control

Protects against:

- Abuse
- Credential stuffing
- Accidental overload

Atomic enforcement using Redis Lua prevents concurrency bypass.

---

## 5. Fail-Closed Behavior

If Redis or the rate limiter is unavailable:

- Requests are rejected
- No traffic allowed by default

---

## 6. Secrets Handling

- Secrets stored in AWS Secrets Manager
- Injected into ECS via task definition `secrets` block
- No secrets in source code
- No secrets in Terraform state

---

## 7. Network Isolation

- ECS tasks run in private subnets
- No public IP assigned
- Only ALB is publicly accessible

---

## 8. IAM Least Privilege

ECS Execution Role permissions:

- Pull from ECR
- Write to CloudWatch Logs
- Read from Secrets Manager

---

## 9. Denial of Service Considerations

- Rate limits bound request volume
- Redis is the primary shared dependency
- No unbounded memory structures

---

## 10. Non-Goals

Gatekeeper intentionally does not:

- Terminate TLS (handled by infrastructure)
- Perform user authentication
- Inspect request payloads
- Provide IP-based filtering

---

## 11. Security Review Checklist

- [ ] Redis access restricted
- [ ] Admin secret rotated regularly
- [ ] Secrets stored only in Secrets Manager
- [ ] Logs monitored for anomalies

---

## 12. Summary

Gatekeeper follows a minimal, explicit security model focused on
correctness, clarity, and predictable failure behavior.
