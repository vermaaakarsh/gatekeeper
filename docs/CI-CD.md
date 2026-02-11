# CI/CD

## CI Pipeline

Triggered on code changes.

Stages:

- Install dependencies
- Run tests
- Build Docker image
- Push to ECR

---

## Infrastructure Pipeline

Triggered only when infra/ changes.

Stages:

- Terraform init
- Terraform plan
- Manual approval
- Terraform apply

Purpose:
Separate infra changes from app deployments.

---

## CD Pipeline

Triggered after successful infra.

Stages:

- Resolve image tag
- Register new ECS task definition revision
- Update ECS service
- Wait for service stability

If tasks fail:
ECS circuit breaker automatically rolls back.
