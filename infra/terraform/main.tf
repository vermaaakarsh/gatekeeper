terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# --------------------------------------------------
# Networking Module
# --------------------------------------------------

module "networking" {
  source = "./modules/networking"

  project_name         = var.project_name
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# --------------------------------------------------
# Security Module
# --------------------------------------------------

module "security" {
  source = "./modules/security"

  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  app_port     = var.app_port
}

# --------------------------------------------------
# ALB Module
# --------------------------------------------------

module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  vpc_id            = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  alb_sg_id         = module.security.alb_sg_id
  app_port          = var.app_port
  health_check_path = var.health_check_path
  certificate_arn   = var.certificate_arn
}

# --------------------------------------------------
# VPC Endpoints Module
# --------------------------------------------------

module "endpoints" {
  source = "./modules/endpoints"

  project_name           = var.project_name
  vpc_id                 = module.networking.vpc_id
  private_subnet_ids     = module.networking.private_subnet_ids
  private_route_table_id = module.networking.private_route_table_id
  ecs_sg_id              = module.security.ecs_sg_id
  region                 = var.region
}


module "ecs" {
  source = "./modules/ecs"

  container_secrets = [
    {
      name      = "REDIS_URL"
      valueFrom = "${module.secrets.runtime_config_secret_arn}:REDIS_URL::"
    },
    {
      name      = "PORT"
      valueFrom = "${module.secrets.runtime_config_secret_arn}:PORT::"
    },
    {
      name      = "NODE_ENV"
      valueFrom = "${module.secrets.runtime_config_secret_arn}:NODE_ENV::"
    },
    {
      name      = "ADMIN_SECRET"
      valueFrom = "${module.secrets.app_secrets_secret_arn}:ADMIN_SECRET::"
    }
  ]

  project_name       = var.project_name
  region             = var.region
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  ecs_sg_id          = module.security.ecs_sg_id
  target_group_arn   = module.alb.target_group_arn
  app_port           = var.app_port
}


module "redis" {
  source = "./modules/redis"

  project_name       = var.project_name
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  ecs_sg_id          = module.security.ecs_sg_id
}

module "secrets" {
  source = "./modules/secrets"

  project_name   = var.project_name
  app_port       = var.app_port
  environment    = var.environment
  redis_endpoint = module.redis.redis_endpoint
}


