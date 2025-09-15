variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Networking variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT gateway for private subnets"
  type        = bool
  default     = true
}

# Storage variables
variable "bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "intelligent-document-processing"
}

variable "document_retention_days" {
  description = "Number of days to retain documents"
  type        = number
  default     = 365
}

# ECS variables
variable "api_image_uri" {
  description = "URI of the API container image"
  type        = string
}

variable "agent_image_uri" {
  description = "URI of the agent container image"
  type        = string
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

# Database variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "document_processing"
}

variable "db_master_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

# Redis variables
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 1
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

# AI/ML variables
variable "bedrock_region" {
  description = "AWS Bedrock region"
  type        = string
  default     = "us-east-1"
}

variable "bedrock_model_id" {
  description = "Default Bedrock model ID"
  type        = string
  default     = "anthropic.claude-3-sonnet-20240229-v1:0"
}

variable "vector_db_provider" {
  description = "Vector database provider (pinecone, chromadb)"
  type        = string
  default     = "pinecone"
  validation {
    condition     = contains(["pinecone", "chromadb"], var.vector_db_provider)
    error_message = "Vector DB provider must be either 'pinecone' or 'chromadb'."
  }
}

variable "pinecone_index_name" {
  description = "Pinecone index name"
  type        = string
  default     = "document-vectors"
}

# Security variables
variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

# API Gateway variables
variable "api_throttle_rate" {
  description = "API Gateway throttle rate (requests per second)"
  type        = number
  default     = 100
}

variable "api_throttle_burst" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 200
}

variable "enable_api_key" {
  description = "Enable API key requirement"
  type        = bool
  default     = true
}

# WAF variables
variable "enable_rate_limiting" {
  description = "Enable WAF rate limiting"
  type        = bool
  default     = true
}

variable "enable_geo_blocking" {
  description = "Enable WAF geo blocking"
  type        = bool
  default     = false
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}

# Monitoring variables
variable "alert_email" {
  description = "Email address for alerts"
  type        = string
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  default     = ""
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"
  validation {
    condition     = contains(["debug", "info", "warn", "error"], var.log_level)
    error_message = "Log level must be one of: debug, info, warn, error."
  }
}

# Cost optimization variables
variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 1000
}

variable "cost_alert_threshold" {
  description = "Cost alert threshold percentage"
  type        = number
  default     = 80
}

# Feature flags
variable "enable_debug_mode" {
  description = "Enable debug mode"
  type        = bool
  default     = false
}

variable "enable_performance_monitoring" {
  description = "Enable detailed performance monitoring"
  type        = bool
  default     = true
}

variable "enable_audit_logging" {
  description = "Enable audit logging"
  type        = bool
  default     = true
}

# Scaling variables
variable "auto_scaling_enabled" {
  description = "Enable auto scaling for ECS services"
  type        = bool
  default     = true
}

variable "min_capacity" {
  description = "Minimum capacity for auto scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum capacity for auto scaling"
  type        = number
  default     = 10
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "target_memory_utilization" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 80
}

# Backup and disaster recovery
variable "enable_cross_region_backup" {
  description = "Enable cross-region backup"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "Backup region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "rpo_hours" {
  description = "Recovery Point Objective in hours"
  type        = number
  default     = 24
}

variable "rto_hours" {
  description = "Recovery Time Objective in hours"
  type        = number
  default     = 4
}