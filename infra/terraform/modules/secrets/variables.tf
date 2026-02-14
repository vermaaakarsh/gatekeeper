variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "redis_endpoint" {
  description = "Redis primary endpoint"
  type        = string
}

variable "app_port" {
  description = "Application port"
  type        = string
}
