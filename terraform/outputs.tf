output "aws_account_id" {
  description = "AWS account ID, used to replace <YOUR_AWS_ACCOUNT_ID> in kubernetes/*/deployment.yaml"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  value = var.aws_region
}

output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "eks_cluster_name" {
  value = aws_eks_cluster.this.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.this.endpoint
}

output "eks_cluster_certificate_authority" {
  value     = aws_eks_cluster.this.certificate_authority[0].data
  sensitive = true
}

output "eks_oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.eks.arn
}

output "ecr_repository_urls" {
description = "Map of service name -> ECR repository URL"
value       = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}

output "update_kubeconfig_command" {
  value = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.this.name}"
}

# ---------- RDS outputs (append to outputs.tf) ----------

output "rds_endpoint" {
  description = "Full RDS endpoint (host:port) — use the host part before ':' in DATABASE_URL"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_database_url" {
  description = "Ready-to-use DATABASE_URL for kubernetes/secrets.yaml"
  value       = "postgres://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}"
  sensitive   = true
}

