variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used for naming VPC / EKS / IAM resources"
  type        = string
  default     = "ecomerrce2"
}

# Must match the ECR_REPOSITORY prefix used in .github/workflows/deploy.yml
# (ECR_REPOSITORY: ecomerrce2-${{ matrix.service }})
variable "ecr_prefix" {
  description = "Prefix used for ECR repository names, must match the CI/CD workflow"
  type        = string
  default     = "ecomerrce2"
}

variable "services" {
  description = "Microservices that get their own ECR repository"
  type        = list(string)
  default = [
    "frontend",
    "product-service",
    "cart-service",
    "payment-service",
    "search-service",
    "email-service"
  ]
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (ALB / NAT)"
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (EKS nodes)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "azs" {
  description = "Availability zones to spread subnets across"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "ecom-eks"
}

variable "kubernetes_version" {
  description = "EKS control plane Kubernetes version"
  type        = string
  default     = "1.36"
}

# Kept intentionally small (1 node, t3.small) to minimize cost while learning/testing.
variable "node_instance_type" {
  description = "EC2 instance type for the EKS managed node group"
  type        = string
  default     = "t3.small"
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 2
}

# ---------- RDS variables (append to variables.tf) ----------

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "ecom"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Master password for RDS (matches kubernetes/secrets.yaml default — change both together if you update this)"
  type        = string
  default     = "admin123456"
  sensitive   = true
}

