output "alb_dns_name" {
  description = "Application load balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "vpc_id" {
  description = "VPC Id"
  value       = module.networking.vpc_id
}
