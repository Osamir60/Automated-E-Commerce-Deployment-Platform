terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Fetch the current AWS Account ID dynamically
data "aws_caller_identity" "current" {}

# Create an ECR repository for each service
resource "aws_ecr_repository" "repos" {
  for_each             = toset(var.services)
  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Automated script to tag and push local Docker images to ECR
resource "null_resource" "docker_push" {
  depends_on = [aws_ecr_repository.repos]

  triggers = {
    # This ensures the push runs on every 'terraform apply'
    always_run = "${timestamp()}"
  }

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command = <<EOT
      $ErrorActionPreference = 'Stop'
      
      Write-Host "Logging into AWS ECR..."
      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com
      
      %{ for svc in var.services }
      Write-Host "========================================"
      Write-Host "Processing ${svc}..."
      
      $LOCAL_IMAGE = "${var.project_name}-${svc}:latest"
      $REMOTE_IMAGE = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.project_name}-${svc}:latest"
      
      Write-Host "Tagging: $LOCAL_IMAGE -> $REMOTE_IMAGE"
      docker tag $LOCAL_IMAGE $REMOTE_IMAGE
      
      Write-Host "Pushing to ECR..."
      docker push $REMOTE_IMAGE
      %{ endfor }
      
      Write-Host "All images pushed successfully!"
    EOT
  }
}
