variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "app_port" {
  description = "Application container port"
  type        = number
}
