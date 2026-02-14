variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "alb_sg_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "app_port" {
  description = "Application port"
  type        = number
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener"
  type        = string
}

