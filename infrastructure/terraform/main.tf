terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "intelligent-document-processing-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "intelligent-document-processing"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "ai-team"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name

  common_tags = {
    Project     = "intelligent-document-processing"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# S3 Buckets for document storage
module "storage" {
  source = "./modules/storage"

  environment    = var.environment
  bucket_prefix  = var.bucket_prefix
  retention_days = var.document_retention_days

  tags = local.common_tags
}

# VPC and networking
module "networking" {
  source = "./modules/networking"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = var.enable_nat_gateway

  tags = local.common_tags
}

# Security groups and IAM roles
module "security" {
  source = "./modules/security"

  environment = var.environment
  vpc_id      = module.networking.vpc_id

  tags = local.common_tags
}

# Application Load Balancer
module "load_balancer" {
  source = "./modules/load_balancer"

  environment = var.environment
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.public_subnet_ids
  security_group_ids = [module.security.alb_security_group_id]

  tags = local.common_tags
}

# ECS Cluster for containerized services
module "ecs" {
  source = "./modules/ecs"

  environment        = var.environment
  vpc_id            = module.networking.vpc_id
  subnet_ids        = module.networking.private_subnet_ids
  security_group_ids = [module.security.ecs_security_group_id]
  target_group_arn  = module.load_balancer.target_group_arn

  # Task definitions
  api_image_uri     = var.api_image_uri
  agent_image_uri   = var.agent_image_uri
  desired_count     = var.ecs_desired_count

  # Environment variables
  environment_vars = {
    AWS_REGION                    = local.region
    S3_BUCKET_NAME               = module.storage.documents_bucket_name
    BEDROCK_REGION               = var.bedrock_region
    BEDROCK_MODEL_ID             = var.bedrock_model_id
    VECTOR_DB_PROVIDER           = var.vector_db_provider
    PINECONE_INDEX_NAME          = var.pinecone_index_name
    DATABASE_URL                 = module.database.connection_string
    REDIS_URL                    = module.cache.redis_url
    JWT_SECRET                   = var.jwt_secret
    LOG_LEVEL                    = var.log_level
  }

  tags = local.common_tags

  depends_on = [
    module.networking,
    module.security,
    module.database,
    module.cache
  ]
}

# RDS PostgreSQL for structured data
module "database" {
  source = "./modules/database"

  environment           = var.environment
  vpc_id               = module.networking.vpc_id
  subnet_ids           = module.networking.private_subnet_ids
  security_group_ids   = [module.security.rds_security_group_id]

  # Database configuration
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  database_name        = var.database_name
  master_username      = var.db_master_username
  master_password      = var.db_master_password
  backup_retention     = var.db_backup_retention
  multi_az            = var.environment == "production"

  tags = local.common_tags
}

# ElastiCache Redis for caching and job queues
module "cache" {
  source = "./modules/cache"

  environment        = var.environment
  vpc_id            = module.networking.vpc_id
  subnet_ids        = module.networking.private_subnet_ids
  security_group_ids = [module.security.redis_security_group_id]

  # Redis configuration
  node_type         = var.redis_node_type
  num_cache_nodes   = var.redis_num_nodes
  engine_version    = var.redis_engine_version

  tags = local.common_tags
}

# Lambda functions for serverless processing
module "lambda" {
  source = "./modules/lambda"

  environment = var.environment
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.private_subnet_ids
  security_group_ids = [module.security.lambda_security_group_id]

  # S3 bucket for triggers
  documents_bucket_name = module.storage.documents_bucket_name
  documents_bucket_arn  = module.storage.documents_bucket_arn

  # Environment variables
  environment_vars = {
    AWS_REGION         = local.region
    BEDROCK_REGION     = var.bedrock_region
    BEDROCK_MODEL_ID   = var.bedrock_model_id
    DATABASE_URL       = module.database.connection_string
    REDIS_URL          = module.cache.redis_url
  }

  tags = local.common_tags

  depends_on = [
    module.storage,
    module.database,
    module.cache
  ]
}

# CloudWatch monitoring and logging
module "monitoring" {
  source = "./modules/monitoring"

  environment = var.environment

  # Resources to monitor
  ecs_cluster_name     = module.ecs.cluster_name
  ecs_service_name     = module.ecs.service_name
  rds_instance_id      = module.database.instance_id
  redis_cluster_id     = module.cache.cluster_id
  lambda_function_names = module.lambda.function_names

  # Alerting configuration
  sns_topic_arn = module.alerting.sns_topic_arn

  tags = local.common_tags
}

# SNS and alerting
module "alerting" {
  source = "./modules/alerting"

  environment = var.environment

  # Notification endpoints
  alert_email         = var.alert_email
  slack_webhook_url   = var.slack_webhook_url

  tags = local.common_tags
}

# API Gateway for external access
module "api_gateway" {
  source = "./modules/api_gateway"

  environment = var.environment

  # Integration with ECS
  vpc_link_target_arns = [module.load_balancer.target_group_arn]
  load_balancer_dns    = module.load_balancer.dns_name

  # API configuration
  api_throttle_rate   = var.api_throttle_rate
  api_throttle_burst  = var.api_throttle_burst
  enable_api_key      = var.enable_api_key

  tags = local.common_tags
}

# WAF for web application security
module "waf" {
  source = "./modules/waf"

  environment = var.environment

  # Resources to protect
  alb_arn          = module.load_balancer.arn
  api_gateway_arn  = module.api_gateway.stage_arn

  # Security rules
  enable_rate_limiting = var.enable_rate_limiting
  enable_geo_blocking  = var.enable_geo_blocking
  blocked_countries    = var.blocked_countries

  tags = local.common_tags
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = module.load_balancer.dns_name
}

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = module.api_gateway.api_url
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.cache.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the documents S3 bucket"
  value       = module.storage.documents_bucket_name
}