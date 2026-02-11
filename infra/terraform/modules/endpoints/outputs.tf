output "s3_endpoint_id" {
  value = aws_vpc_endpoint.s3.id
}

output "ecr_api_endpoint_id" {
  value = aws_vpc_endpoint.ecr_api.id
}

output "ecr_dkr_endpoint_id" {
  value = aws_vpc_endpoint.ecr_dkr.id
}

output "logs_endpoint_id" {
  value = aws_vpc_endpoint.logs.id
}
