output "ecr_repository_urls" {
  description = "The URLs of all created ECR repositories"
  value       = { for repo in aws_ecr_repository.repos : repo.name => repo.repository_url }
}

output "aws_account_id" {
  description = "The AWS Account ID detected and used"
  value       = data.aws_caller_identity.current.account_id
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = aws_eks_cluster.eks.name
}

output "eks_cluster_endpoint" {
  description = "The endpoint of the EKS cluster"
  value       = aws_eks_cluster.eks.endpoint
}

output "eks_kubeconfig_command" {
  description = "Command to configure kubectl to connect to the EKS cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.eks.name}"
}
