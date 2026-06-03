$ecr = "183631346881.dkr.ecr.us-east-1.amazonaws.com"
$images = @("frontend", "product-service", "cart-service", "search-service", "payment-service", "email-service")

Write-Host "Building new Docker images..."
docker compose build

Write-Host "Tagging and Pushing to ECR..."
foreach ($img in $images) {
    docker tag "ecomerrce2-${img}:latest" "${ecr}/ecomerrce2-${img}:latest"
    docker push "${ecr}/ecomerrce2-${img}:latest"
}

Write-Host "Done! Now go to your EC2 server and run: sudo kubectl delete pods --all"
