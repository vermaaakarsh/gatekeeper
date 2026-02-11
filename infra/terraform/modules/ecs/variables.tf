variable "project_name" {
  description = "Project name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "ecs_sg_id" {
  description = "ECS security group ID"
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "app_port" {
  description = "Container port"
  type        = number
}

variable "desired_count" {
  description = "Number of tasks"
  type        = number
  default     = 2
}

variable "container_secrets" {
  description = "Environment variables for ECS container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}
