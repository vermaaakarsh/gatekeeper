# Gatekeeper

Gatekeeper is a **production-grade API key management and distributed
rate-limiting service** designed to operate as a standalone
infrastructure component in modern cloud environments.

It is not just middleware --- it is a fully deployable, horizontally
scalable system with Infrastructure as Code, CI/CD automation, private
networking, and security hardening built in.

---

## 🚀 What Gatekeeper Provides

Gatekeeper enables applications to delegate:

- 🔑 API key lifecycle management
- ⚡ Distributed atomic rate limiting
- 📊 Observability and structured logging
- ☁ Production-ready AWS deployment
- 🔐 Secure secret handling

It is built to demonstrate real-world backend + DevOps engineering
practices.

---

## 🔎 What Makes This Different?

Gatekeeper is intentionally designed beyond a simple Express middleware.

It demonstrates:

- ✅ Atomic rate limiting using **Redis Lua scripts**
- ✅ Fully modular **Terraform Infrastructure as Code**
- ✅ **Private ECS Fargate deployment** (no public containers)
- ✅ **VPC Endpoints instead of NAT Gateway**
- ✅ Secrets injection via **AWS Secrets Manager**
- ✅ Strict separation of **CI → Infra → CD pipelines**
- ✅ ECS deployment circuit breaker with automatic rollback
- ✅ Rolling deployments with zero-downtime strategy

This project focuses on correctness, production safety, and
architectural clarity.

---

## 🏗 High-Level System Architecture

    Internet
       ↓
    Application Load Balancer (Public Subnet)
       ↓
    ECS Fargate Tasks (Private Subnets, No Public IP)
       ↓
    Redis (Atomic Lua-based rate limiting)

### Infrastructure Characteristics

- ALB is the only publicly accessible component
- ECS tasks run in private subnets
- No public IPs assigned to containers
- No NAT Gateway required
- AWS service access via VPC Interface Endpoints

---

## ⚙ Core Functional Features

### 🔑 API Key Management

- Create API keys
- Enable / Disable keys
- Assign per-key rate limits
- Admin authentication layer (`X-Admin-Secret`)

### ⚡ Distributed Rate Limiting

Implemented using Redis Lua to ensure:

- Atomic increments
- Zero race conditions
- Accurate window resets
- Horizontal scalability
- Fail-closed semantics

If Redis becomes unavailable → requests are rejected.

Security is prioritized over silent allowance.

---

## 🏭 Deployment Architecture

Gatekeeper uses three fully separated Jenkins pipelines:

### 1️⃣ CI Pipeline

- Install dependencies
- Run tests
- Build Docker image
- Push to ECR

### 2️⃣ Infrastructure Pipeline

- Terraform plan
- Manual approval gate
- Terraform apply
- Remote state (S3 + DynamoDB locking)

Infrastructure changes are controlled and auditable.

### 3️⃣ CD Pipeline

- Fetch current ECS task definition
- Register new revision with updated image
- Trigger rolling deployment
- Wait for service stability
- Automatic rollback via ECS circuit breaker

Deployments are safe, traceable, and zero-downtime.

---

## 🔐 Secret Management

Secrets are stored in **AWS Secrets Manager**.

They are injected into ECS containers using the `secrets` block in the
task definition.

No secrets are stored in:

- Git repository
- Docker images
- Terraform state
- Jenkins configuration

This enforces clean separation of code and secrets.

---

## 📚 Project Documentation

Detailed documentation is available under the `docs/` directory:

- `ARCHITECTURE.md` -- System design and component overview\
- `INFRASTRUCTURE.md` -- Terraform structure and AWS resources\
- `CI-CD.md` -- Pipeline flow and deployment strategy\
- `SECURITY.md` -- Threat model and hardening decisions\
- `OPERATIONS.md` -- Deployment & operational guidelines\
- `DECISIONS.md` -- Architectural decision records

---

## 🧠 Why This Project Exists

Gatekeeper exists to demonstrate the intersection of:

- Backend Engineering
- Distributed Systems
- Infrastructure as Code
- Cloud Security
- DevOps Automation
- Production Deployment Strategy

It is designed as a portfolio-quality project that reflects real-world
production architecture decisions.

---

## 📌 Technology Stack

- Node.js
- Redis
- Lua
- Docker
- AWS ECS Fargate
- Application Load Balancer
- AWS Secrets Manager
- Terraform
- Jenkins

---

## 🛡 Design Philosophy

Gatekeeper prioritizes:

- Deterministic behavior
- Fail-closed safety
- Minimal surface area
- Explicit infrastructure boundaries
- Long-term maintainability

Correctness over convenience.

---

## 📄 License

This project is intended for educational and portfolio demonstration
purposes.
