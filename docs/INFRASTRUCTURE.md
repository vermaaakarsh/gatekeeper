# Infrastructure

Provisioned entirely using Terraform.

## Module Structure

modules/

- networking
- security
- alb
- ecs
- endpoints

---

## Networking

- Custom VPC
- Public subnets (ALB)
- Private subnets (ECS)
- Route tables
- Internet Gateway
- No NAT Gateway

---

## VPC Endpoints

Interface endpoints:

- ECR API
- ECR Docker
- CloudWatch Logs

Gateway endpoint:

- S3

This allows private ECS tasks to pull images and send logs without internet access.

---

## Security Groups

ALB SG:

- Inbound: 80 from internet
- Outbound: all

ECS SG:

- Inbound: app port from ALB SG
- Outbound: all (required for AWS endpoints)

Endpoint SG:

- Inbound: 443 from ECS SG

---

## ECS Configuration

- Fargate launch type
- awsvpc networking mode
- Circuit breaker enabled
- Rolling deployment strategy
- Lifecycle ignore_changes on task_definition (CD separation)
