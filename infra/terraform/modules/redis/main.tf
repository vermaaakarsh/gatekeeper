# ----------------------------------------
# Redis Subnet Group
# ----------------------------------------

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-redis-subnet-group"
  }
}

# ----------------------------------------
# Redis Security Group
# ----------------------------------------

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis-sg"
  description = "Security group for Redis"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.project_name}-redis-sg"
  }
}

# Allow inbound Redis only from ECS
resource "aws_security_group_rule" "redis_inbound_from_ecs" {
  type                     = "ingress"
  security_group_id        = aws_security_group.redis.id
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = var.ecs_sg_id
}

# Allow outbound (default allow all)
resource "aws_security_group_rule" "redis_outbound_all" {
  type              = "egress"
  security_group_id = aws_security_group.redis.id

  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = ["0.0.0.0/0"]
}

# ----------------------------------------
# Redis Cluster (Single Node)
# ----------------------------------------

resource "aws_elasticache_cluster" "this" {
  cluster_id           = "${var.project_name}-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"

  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [aws_security_group.redis.id]

  port = 6379

  tags = {
    Name = "${var.project_name}-redis"
  }
}
