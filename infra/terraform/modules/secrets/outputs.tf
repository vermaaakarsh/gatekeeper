
output "runtime_config_secret_arn" {
  description = "ARN of the runtime configuration secret (managed by Terraform)"
  value       = aws_secretsmanager_secret.runtime_config.arn
}


output "app_secrets_secret_arn" {
  description = "ARN of the manually managed app secrets secret"
  value       = data.aws_secretsmanager_secret.app_secrets.arn
}


output "runtime_config_secret_name" {
  description = "Name of the runtime configuration secret"
  value       = aws_secretsmanager_secret.runtime_config.name
}


output "app_secrets_secret_name" {
  description = "Name of the manually managed app secrets secret"
  value       = data.aws_secretsmanager_secret.app_secrets.name
}
