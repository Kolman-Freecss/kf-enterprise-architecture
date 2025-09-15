export interface MCPServer {
  name: string;
  version: string;
  description: string;
  capabilities: MCPCapabilities;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}

export interface MCPCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  logging?: boolean;
  experimental?: Record<string, boolean>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: MCPToolHandler;
  metadata?: MCPToolMetadata;
}

export interface MCPToolHandler {
  (input: any, context: MCPContext): Promise<MCPToolResult>;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: MCPError;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    confidence?: number;
  };
}

export interface MCPToolMetadata {
  category: string;
  tags: string[];
  costEstimate: number;
  averageExecutionTime: number;
  reliability: number;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  handler: MCPResourceHandler;
}

export interface MCPResourceHandler {
  (uri: string, context: MCPContext): Promise<MCPResourceResult>;
}

export interface MCPResourceResult {
  content: string | Buffer;
  mimeType: string;
  metadata?: Record<string, any>;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments: MCPPromptArgument[];
  handler: MCPPromptHandler;
}

export interface MCPPromptArgument {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface MCPPromptHandler {
  (args: Record<string, any>, context: MCPContext): Promise<MCPPromptResult>;
}

export interface MCPPromptResult {
  messages: MCPMessage[];
  metadata?: Record<string, any>;
}

export interface MCPMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MCPContent[];
  metadata?: Record<string, any>;
}

export interface MCPContent {
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
  tool_use_id?: string;
  tool_name?: string;
  input?: any;
  content?: string;
  is_error?: boolean;
}

export interface MCPContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  capabilities: MCPCapabilities;
  metadata: Record<string, any>;
}

export interface MCPError {
  code: MCPErrorCode;
  message: string;
  data?: any;
}

export enum MCPErrorCode {
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  TOOL_ERROR = -32000,
  RESOURCE_NOT_FOUND = -32001,
  PERMISSION_DENIED = -32002,
  RATE_LIMITED = -32003,
  TIMEOUT = -32004
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: any[];
  description?: string;
  example?: any;
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: MCPError;
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  mcpServers: MCPServerConfig[];
  orchestration: OrchestrationConfig;
  monitoring: MonitoringConfig;
}

export interface MCPServerConfig {
  name: string;
  endpoint: string;
  authentication?: {
    type: 'bearer' | 'api_key' | 'basic';
    credentials: Record<string, string>;
  };
  retryPolicy: RetryPolicy;
  timeout: number;
}

export interface OrchestrationConfig {
  strategy: 'sequential' | 'parallel' | 'conditional';
  errorHandling: 'fail_fast' | 'continue' | 'retry';
  fallback?: string[];
  conditions?: OrchestrationCondition[];
}

export interface OrchestrationCondition {
  when: string;
  then: string[];
  else?: string[];
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableLogging: boolean;
  sampleRate: number;
  alerting: AlertingConfig;
}

export interface AlertingConfig {
  errorRate: number;
  latency: number;
  successRate: number;
  webhooks: string[];
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: MCPErrorCode[];
}

export interface AgentExecution {
  id: string;
  agentId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  input: any;
  output?: any;
  error?: MCPError;
  steps: ExecutionStep[];
  metadata: Record<string, any>;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionStep {
  stepId: string;
  toolName: string;
  serverName: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  input: any;
  output?: any;
  error?: MCPError;
  retryCount: number;
}

export interface AgentMetrics {
  agentId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  averageCost: number;
  lastExecution: Date;
  errorRate: number;
  toolUsage: Record<string, number>;
}