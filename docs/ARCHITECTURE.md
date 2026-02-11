# Architecture

## 1. Request Flow

Client  
↓  
ALB (Layer 7 routing)  
↓  
ECS Fargate Task  
↓  
Redis  
↓  
Lua Script (atomic rate limiter)

---

## 2. Rate Limiting Implementation

Gatekeeper uses Redis Lua scripting for atomicity.

Why Lua?

Because naive rate limiting using:

- GET
- INCR
- EXPIRE

can cause race conditions under concurrency.

The Lua script ensures:

- Increment + expiration logic is atomic
- Accurate window handling
- No double increments
- Correct behavior under burst traffic

---

## 3. Failure Behavior

If Redis is unreachable:

- Requests are rejected
- System fails closed

This prevents accidental unlimited access.

---

## 4. Deployment Architecture

Public Subnets:

- ALB

Private Subnets:

- ECS tasks

VPC Interface Endpoints:

- ECR API
- ECR Docker
- CloudWatch Logs

No NAT gateway.

ECS tasks have no public IP.
