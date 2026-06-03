# ========================================================
# VPC for EKS
# ========================================================
resource "aws_vpc" "eks_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                = "${var.project_name}-vpc"
    "kubernetes.io/cluster/ecom-eks" = "shared"
  }
}

# ========================================================
# Internet Gateway
# ========================================================
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.eks_vpc.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# ========================================================
# Subnets
# ========================================================
# Public Subnets (For Load Balancers and NAT Gateway)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name                                = "${var.project_name}-public-1"
    "kubernetes.io/cluster/ecom-eks" = "shared"
    "kubernetes.io/role/elb"            = "1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name                                = "${var.project_name}-public-2"
    "kubernetes.io/cluster/ecom-eks" = "shared"
    "kubernetes.io/role/elb"            = "1"
  }
}

# Private Subnets (For EKS Worker Nodes)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.eks_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name                                = "${var.project_name}-private-1"
    "kubernetes.io/cluster/ecom-eks" = "shared"
    "kubernetes.io/role/internal-elb"   = "1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.eks_vpc.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name                                = "${var.project_name}-private-2"
    "kubernetes.io/cluster/ecom-eks" = "shared"
    "kubernetes.io/role/internal-elb"   = "1"
  }
}

# ========================================================
# NAT Gateway (Cost Optimized: 1 NAT Gateway instead of 2)
# ========================================================
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id # Deploy in public subnet

  tags = {
    Name = "${var.project_name}-nat-gw"
  }

  depends_on = [aws_internet_gateway.igw]
}

# ========================================================
# Route Tables & Routing
# ========================================================
# Public Route Table (Direct route to Internet via IGW)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.eks_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Private Route Table (Route to Internet via NAT Gateway)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.eks_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "${var.project_name}-private-rt"
  }
}

# ========================================================
# Route Table Associations
# ========================================================
# Public Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Private Associations
resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}
