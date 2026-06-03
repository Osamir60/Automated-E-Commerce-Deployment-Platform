terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    http = {
      source  = "hashicorp/http"
      version = "~> 3.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Fetch the current AWS Account ID dynamically
data "aws_caller_identity" "current" {}

# ========================================================
# ECR Configuration
# ========================================================
resource "aws_ecr_repository" "repos" {
  for_each             = toset(var.services)
  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ========================================================
# Security Group for RDS (Allow external connection)
# ========================================================
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow inbound PostgreSQL traffic"

  ingress {
    description      = "PostgreSQL access from anywhere"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"] # For production, restrict this to your IP!
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}

# ========================================================
# RDS PostgreSQL Database (Cheap / Free Tier Eligible)
# ========================================================
resource "aws_db_instance" "ecom_db" {
  identifier             = "${var.project_name}-db"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t3.micro" # Cheapest available class
  allocated_storage      = 20            # Free tier eligible storage size
  
  db_name                = "ecom"
  username               = "postgres"
  password               = "admin123456" # In a real project, use AWS Secrets Manager
  
  publicly_accessible    = true          # Allow external connections if testing from local
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true          # Allows terraform destroy without prompt
  
  tags = {
    Name = "${var.project_name}-rds"
  }
}

# ========================================================
# S3 Bucket for Product Images
# ========================================================
resource "aws_s3_bucket" "image_bucket" {
  bucket_prefix = "${var.project_name}-images-"
  force_destroy = true # Allows terraform destroy even if bucket has files
}

# Allow public access to bucket objects
resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.image_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.image_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.image_bucket.arn}/*"
      }
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.public_access]
}

# Enable CORS so frontend can load images without issues
resource "aws_s3_bucket_cors_configuration" "cors" {
  bucket = aws_s3_bucket.image_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}

# Outputs to use in backend .env
output "database_url" {
  description = "The URL for connecting to the PostgreSQL database"
  value       = "postgres://${aws_db_instance.ecom_db.username}:${aws_db_instance.ecom_db.password}@${aws_db_instance.ecom_db.endpoint}/${aws_db_instance.ecom_db.db_name}"
  sensitive   = true
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket for product images"
  value       = aws_s3_bucket.image_bucket.bucket
}
