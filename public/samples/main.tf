terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
}
provider "aws" {
  region                      = "eu-west-1"
  access_key                  = "sample"
  secret_key                  = "sample"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
}

variable "db_password" {
  type      = string
  sensitive = true
  default   = "sample-only-not-a-real-password"
}

resource "aws_security_group" "web" {
  name        = "shop-web"
  description = "Shop web servers"
  vpc_id      = "vpc-0a1b2c3d4e5f60718"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

# New in this change: SSH open to the whole internet.
resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_instance" "web" {
  count                  = 2
  ami                    = "ami-0c1bc246476a5572b"
  instance_type          = "t3.medium"
  subnet_id              = "subnet-0f1e2d3c4b5a69788"
  vpc_security_group_ids = [aws_security_group.web.id]
  tags                   = { Name = "shop-web-${count.index}" }
}

resource "aws_db_instance" "orders" {
  identifier          = "shop-orders"
  engine              = "postgres"
  engine_version      = "16.4"
  instance_class      = "db.t4g.medium"
  allocated_storage   = 50
  storage_encrypted   = true
  username            = "shop"
  password            = var.db_password
  skip_final_snapshot = true
}

resource "aws_iam_role" "app" {
  name = "shop-app"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "app" {
  name = "shop-app-s3"
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "s3:*", Resource = "*" }]
  })
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/shop/app"
  retention_in_days = 7
}

resource "aws_sns_topic" "alerts" {
  name = "shop-alerts"
}
