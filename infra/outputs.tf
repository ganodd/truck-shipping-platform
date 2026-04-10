output "alb_dns_name" {
  description = "ALB DNS name — set this as your NEXT_PUBLIC_API_URL base before building the Expo app"
  value       = aws_lb.main.dns_name
}

output "api_gateway_ecr_url" {
  description = "ECR repository URL for api-gateway — use in CI/CD docker push"
  value       = aws_ecr_repository.api_gateway.repository_url
}

output "web_ecr_url" {
  description = "ECR repository URL for web — use in CI/CD docker push"
  value       = aws_ecr_repository.web.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name — reference in deploy workflow"
  value       = aws_ecs_cluster.main.name
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL hostname (without port)"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "redis_primary_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "app_secret_arn" {
  description = "Secrets Manager ARN for app secrets — reference in ECS task definitions"
  value       = aws_secretsmanager_secret.app.arn
}
