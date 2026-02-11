# Architectural Decisions -- Gatekeeper

This document records major architectural decisions and their rationale.

---

## 1. Redis + Lua for Rate Limiting

**Decision**: Use Redis Lua scripts for rate limiting\
**Reason**: Guarantees atomicity under concurrency\
**Alternatives Considered**:

- In-process counters (rejected: race conditions)
- Database-backed limits (rejected: latency)

---

## 2. Fail-Closed Semantics

**Decision**: Reject requests when dependencies fail\
**Reason**: Silent allowance is worse than rejection

---

## 3. Stateless Service Design

**Decision**: Keep Gatekeeper stateless\
**Reason**: Enables horizontal scaling and simple recovery

---

## 4. Externalized Redis

**Decision**: Do not bundle Redis\
**Reason**: Supports managed Redis and flexible deployment

---

## 5. Minimal Test Surface

**Decision**: Focus on integration tests with real Redis\
**Reason**: Mocking Redis hides real failure modes

---

## 6. No Embedded Orchestration

**Decision**: Avoid Docker Compose in production\
**Reason**: Keep runtime agnostic to orchestration platform

---

## 7. Summary

These decisions prioritize correctness, clarity, and long-term
maintainability over short-term convenience.

---

## 8. Infrastructure as Code (Terraform Modules)

**Decision**: Provision all infrastructure using modular Terraform\
**Reason**: Ensures reproducibility, version control, and safe evolution
of infrastructure

Infrastructure modules:

- networking
- security
- alb
- ecs
- endpoints

---

## 9. Private ECS Deployment (No Public Containers)

**Decision**: Deploy ECS tasks in private subnets\
**Reason**: Prevent direct internet exposure of application containers

Only the Application Load Balancer resides in public subnets. ECS tasks
have no public IP and are accessible only through ALB.

---

## 10. VPC Interface Endpoints Instead of NAT Gateway

**Decision**: Use VPC endpoints for ECR and CloudWatch access\
**Reason**: Reduce cost and improve network isolation

Endpoints used:

- ECR API
- ECR Docker
- CloudWatch Logs
- S3 (Gateway)

---

## 11. Separation of CI, Infrastructure, and CD Pipelines

**Decision**: Split CI, Infra, and CD into distinct Jenkins pipelines\
**Reason**: Prevent infrastructure mutation during normal deployments

Flow:

- CI → Build & Push image
- Infra → Terraform plan/apply (manual approval)
- CD → Register new task definition & rolling deploy

---

## 12. ECS Circuit Breaker for Safe Deployments

**Decision**: Enable ECS deployment circuit breaker\
**Reason**: Automatically roll back failed task revisions

If new tasks fail health checks or crash, ECS restores the last stable
revision automatically.
