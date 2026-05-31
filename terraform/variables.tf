variable "aws_region" {
  description = "AWS Region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "services" {
  description = "List of microservices to create ECR repos for"
  type        = list(string)
  default     = [
    "frontend",
    "product-service",
    "cart-service",
    "search-service",
    "payment-service",
    "email-service"
  ]
}

variable "project_name" {
  description = "Prefix for the ECR repositories"
  type        = string
  default     = "ecomerrce2"
}
