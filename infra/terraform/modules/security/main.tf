# ----------------------------------------
# ALB Security Group
# ----------------------------------------

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

# Allow HTTP from anywhere
resource "aws_security_group_rule" "alb_inbound_http" {
  type              = "ingress"
  security_group_id = aws_security_group.alb.id

  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

# Allow HTTPS from anywhere
resource "aws_security_group_rule" "alb_inbound_https" {
  type              = "ingress"
  security_group_id = aws_security_group.alb.id

  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}


# Allow all outbound from ALB
resource "aws_security_group_rule" "alb_outbound_all" {
  type              = "egress"
  security_group_id = aws_security_group.alb.id

  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = ["0.0.0.0/0"]
}

# ----------------------------------------
# ECS Security Group
# ----------------------------------------

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.project_name}-ecs-sg"
  }
}

# Allow traffic from ALB only to application port
resource "aws_security_group_rule" "ecs_inbound_from_alb" {
  type                     = "ingress"
  security_group_id        = aws_security_group.ecs.id
  from_port                = var.app_port
  to_port                  = var.app_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
}

# Allow ECS to talk to interface endpoints (self reference on 443)
resource "aws_security_group_rule" "ecs_inbound_self_https" {
  type              = "ingress"
  security_group_id = aws_security_group.ecs.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  self              = true
}

# Allow full outbound
# Required for:
# - DNS resolution
# - ECR pulls
# - CloudWatch logs
# - AWS metadata
# - VPC endpoints
resource "aws_security_group_rule" "ecs_outbound_all" {
  type              = "egress"
  security_group_id = aws_security_group.ecs.id

  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = ["0.0.0.0/0"]
}
