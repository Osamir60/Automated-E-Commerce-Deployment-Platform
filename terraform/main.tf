# One ECR repository per microservice. Names must match the
# ECR_REPOSITORY: ecomerrce2-${{ matrix.service }}
# convention used in .github/workflows/deploy.yml
resource "aws_ecr_repository" "services" {
  for_each = toset(var.services)

  name                 = "${var.ecr_prefix}-${each.value}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project = var.project_name
  }
}

# Cost-saving: only keep the last 5 images per repository
resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}
