variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 Instance type"
  type        = string
  default     = "t3.micro"
}

variable "jwt_secret" {
  description = "JWT Secret for backend authentication"
  type        = string
  sensitive   = true
}

variable "api_key" {
  description = "Judge0 API Key for code execution"
  type        = string
  sensitive   = true
}
