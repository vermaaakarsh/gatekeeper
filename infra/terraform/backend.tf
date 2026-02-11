terraform {
  required_version = ">= 1.6.0"

  backend "s3" {
    bucket       = "gatekeeper-terraform-state-058264153265"
    key          = "ecs/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
