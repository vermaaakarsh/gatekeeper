# ----------------------------------------
# Runtime Config Secret (Terraform Managed)
# ----------------------------------------

resource "aws_secretsmanager_secret" "runtime_config" {
  name = "${var.project_name}/${var.environment}/runtime-config"

  tags = {
    Name = "${var.project_name}-runtime-config"
  }
}

resource "aws_secretsmanager_secret_version" "runtime_config" {
  secret_id = aws_secretsmanager_secret.runtime_config.id

  secret_string = jsonencode({
    REDIS_URL = "redis://${var.redis_endpoint}:6379"
    PORT      = var.app_port
    NODE_ENV  = var.environment
  })
}

# ----------------------------------------
# App Secrets (Manual – Only reference)
# ----------------------------------------

data "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}/${var.environment}/app-secrets"
}
