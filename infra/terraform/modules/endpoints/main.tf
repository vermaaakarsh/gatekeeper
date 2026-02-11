# ----------------------------------------
# S3 Gateway Endpoint (FREE)
# ----------------------------------------

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [var.private_route_table_id]

  tags = {
    Name = "${var.project_name}-s3-endpoint"
  }
}

# ----------------------------------------
# ECR API Endpoint
# ----------------------------------------

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [var.ecs_sg_id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ecr-api-endpoint"
  }
}

# ----------------------------------------
# ECR Docker Endpoint
# ----------------------------------------

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [var.ecs_sg_id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ecr-dkr-endpoint"
  }
}

# ----------------------------------------
# CloudWatch Logs Endpoint
# ----------------------------------------

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [var.ecs_sg_id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-logs-endpoint"
  }
}
