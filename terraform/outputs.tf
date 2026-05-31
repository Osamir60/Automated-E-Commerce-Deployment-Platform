output "ecr_repository_urls" {
  description = "The URLs of all created ECR repositories"
  value       = { for repo in aws_ecr_repository.repos : repo.name => repo.repository_url }
}

output "aws_account_id" {
  description = "The AWS Account ID detected and used"
  value       = data.aws_caller_identity.current.account_id
}
