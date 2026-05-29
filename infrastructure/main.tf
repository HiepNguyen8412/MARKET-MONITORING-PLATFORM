provider "aws" {
  region = "ap-southeast-1"
}

# ---------------------------------------------------------
# VPC Network Configuration
# ---------------------------------------------------------
resource "aws_vpc" "market_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "MarketVPC"
  }
}

resource "aws_internet_gateway" "market_igw" {
  vpc_id = aws_vpc.market_vpc.id
  tags = {
    Name = "MarketIGW"
  }
}

resource "aws_subnet" "market_public_subnet_1" {
  vpc_id                  = aws_vpc.market_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "ap-southeast-1a"
  tags = {
    Name = "MarketPublicSubnet1"
  }
}

resource "aws_subnet" "market_public_subnet_2" {
  vpc_id                  = aws_vpc.market_vpc.id
  cidr_block              = "10.0.2.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "ap-southeast-1b"
  tags = {
    Name = "MarketPublicSubnet2"
  }
}

resource "aws_route_table" "market_public_rt" {
  vpc_id = aws_vpc.market_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.market_igw.id
  }
}

resource "aws_route_table_association" "market_rta_1" {
  subnet_id      = aws_subnet.market_public_subnet_1.id
  route_table_id = aws_route_table.market_public_rt.id
}

resource "aws_route_table_association" "market_rta_2" {
  subnet_id      = aws_subnet.market_public_subnet_2.id
  route_table_id = aws_route_table.market_public_rt.id
}

# Security Groups
resource "aws_security_group" "rds_sg" {
  name        = "market_rds_sg"
  description = "Allow inbound PostgreSQL traffic"
  vpc_id      = aws_vpc.market_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Allow from within VPC
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_sg" {
  name        = "market_ecs_sg"
  description = "Allow web traffic to ECS tasks"
  vpc_id      = aws_vpc.market_vpc.id

  ingress {
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Expose backend to ALB/World
  }

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # ML-service internal traffic
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ---------------------------------------------------------
# Managed Database (RDS PostgreSQL)
# ---------------------------------------------------------
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "market_rds_subnet_group"
  subnet_ids = [aws_subnet.market_public_subnet_1.id, aws_subnet.market_public_subnet_2.id]
}

resource "aws_db_instance" "market_db" {
  identifier             = "market-postgres"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "market_db"
  username               = "postgres"
  password               = "supersecretpassword123!" # Ideally fetched from secrets manager
  skip_final_snapshot    = true
  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
}

# ---------------------------------------------------------
# CaaS Cluster (ECS Fargate)
# ---------------------------------------------------------
resource "aws_ecs_cluster" "market_cluster" {
  name = "market-monitoring-cluster"
}

# Note: Task definitions and services would be added here to deploy 
# the specific backend and ml-service containers to the ECS cluster.
