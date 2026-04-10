variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name — used as prefix for all resource names"
  type        = string
  default     = "truck-shipping"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ─── Database ──────────────────────────────────────────────────────────────

variable "db_instance_class" {
  description = "RDS instance class (e.g. db.t3.micro, db.t3.small)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "truckship"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "truckship"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password (min 8 chars)"
  type        = string
  sensitive   = true
}

# ─── Redis ─────────────────────────────────────────────────────────────────

variable "redis_node_type" {
  description = "ElastiCache Redis node type (e.g. cache.t3.micro)"
  type        = string
  default     = "cache.t3.micro"
}

# ─── ECS – api-gateway ─────────────────────────────────────────────────────

variable "api_gateway_cpu" {
  description = "Fargate CPU units for api-gateway (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "api_gateway_memory" {
  description = "Fargate memory (MB) for api-gateway"
  type        = number
  default     = 1024
}

variable "api_gateway_desired_count" {
  description = "Desired task count for api-gateway service"
  type        = number
  default     = 2
}

# ─── ECS – web ─────────────────────────────────────────────────────────────

variable "web_cpu" {
  description = "Fargate CPU units for web (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256
}

variable "web_memory" {
  description = "Fargate memory (MB) for web"
  type        = number
  default     = 512
}

variable "web_desired_count" {
  description = "Desired task count for web service"
  type        = number
  default     = 2
}

# ─── Secrets ───────────────────────────────────────────────────────────────

variable "jwt_secret" {
  description = "JWT signing secret (min 32 chars)"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key (sk_live_... or sk_test_...)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook endpoint signing secret (whsec_...)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "s3_bucket_name" {
  description = "S3 bucket name for document storage"
  type        = string
  default     = ""
}
