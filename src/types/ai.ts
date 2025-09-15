export interface ModelConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  seed?: number;
}

export interface ModelResponse {
  content: string;
  usage: TokenUsage;
  metadata: {
    modelId: string;
    duration: number;
    finishReason: string;
    [key: string]: any;
  };
}

export interface StreamingResponse {
  stream: AsyncGenerator<string>;
  metadata: {
    modelId: string;
    startTime: number;
    [key: string]: any;
  };
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface SageMakerConfig {
  contentType?: string;
  accept?: string;
  customAttributes?: string;
  targetModel?: string;
  targetVariant?: string;
  inferenceId?: string;
}

export interface SageMakerResponse {
  body: any;
  contentType?: string;
  customAttributes?: string;
  invokedProductionVariant?: string;
  metadata: {
    endpointName: string;
    duration: number;
    timestamp: Date;
  };
}

export interface AIProvider {
  name: string;
  type: 'bedrock' | 'sagemaker' | 'openai' | 'custom';
  config: ProviderConfig;
  capabilities: AICapabilities;
}

export interface ProviderConfig {
  region?: string;
  endpoint?: string;
  apiKey?: string;
  modelDefaults?: ModelConfig;
  retryPolicy?: RetryPolicy;
  circuitBreaker?: CircuitBreakerConfig;
}

export interface AICapabilities {
  textGeneration: boolean;
  textEmbedding: boolean;
  imageGeneration: boolean;
  imageAnalysis: boolean;
  audioTranscription: boolean;
  multimodal: boolean;
  streaming: boolean;
  fineTuning: boolean;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryableStatusCodes: number[];
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
  dimensions?: number;
  normalize?: boolean;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage: TokenUsage;
  metadata: {
    model: string;
    dimensions: number;
    duration: number;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | MultimodalContent[];
  name?: string;
  functionCall?: FunctionCall;
}

export interface MultimodalContent {
  type: 'text' | 'image' | 'audio' | 'video';
  text?: string;
  imageUrl?: string;
  imageData?: {
    data: string;
    mimeType: string;
  };
  audioData?: {
    data: string;
    mimeType: string;
  };
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  config?: ModelConfig;
  tools?: Tool[];
  toolChoice?: 'auto' | 'none' | string;
}

export interface ChatResponse {
  message: ChatMessage;
  usage: TokenUsage;
  metadata: {
    model: string;
    duration: number;
    finishReason: string;
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ModelMetrics {
  modelId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalTokensUsed: number;
  totalCost: number;
  errorRate: number;
  lastRequestTime: Date;
}

export interface ModelUsageStats {
  period: 'hour' | 'day' | 'week' | 'month';
  startTime: Date;
  endTime: Date;
  requestCount: number;
  tokenUsage: TokenUsage;
  cost: number;
  averageLatency: number;
  errorCount: number;
  breakdown: {
    byModel: Record<string, ModelMetrics>;
    byEndpoint: Record<string, ModelMetrics>;
    byUser?: Record<string, ModelMetrics>;
  };
}

export interface AIServiceHealth {
  provider: string;
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  errorRate?: number;
  lastCheck: Date;
  details?: {
    region?: string;
    endpoint?: string;
    version?: string;
    capabilities?: string[];
  };
}

export interface ModelSelection {
  task: AITask;
  requirements: ModelRequirements;
  candidates: ModelCandidate[];
  recommended: string;
  reasoning: string;
}

export enum AITask {
  TEXT_GENERATION = 'text_generation',
  TEXT_CLASSIFICATION = 'text_classification',
  TEXT_EMBEDDING = 'text_embedding',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  ENTITY_EXTRACTION = 'entity_extraction',
  SUMMARIZATION = 'summarization',
  TRANSLATION = 'translation',
  QUESTION_ANSWERING = 'question_answering',
  IMAGE_ANALYSIS = 'image_analysis',
  OCR = 'ocr',
  AUDIO_TRANSCRIPTION = 'audio_transcription'
}

export interface ModelRequirements {
  maxLatency?: number;
  maxCost?: number;
  minAccuracy?: number;
  languages?: string[];
  contextLength?: number;
  outputFormat?: string;
  customRequirements?: Record<string, any>;
}

export interface ModelCandidate {
  modelId: string;
  provider: string;
  score: number;
  metrics: {
    latency: number;
    cost: number;
    accuracy: number;
    contextLength: number;
  };
  pros: string[];
  cons: string[];
}

export interface AIOrchestrationPlan {
  id: string;
  name: string;
  description: string;
  steps: OrchestrationStep[];
  dependencies: StepDependency[];
  errorHandling: ErrorHandlingStrategy;
  monitoring: MonitoringConfig;
}

export interface OrchestrationStep {
  id: string;
  name: string;
  type: 'ai_model' | 'data_processing' | 'validation' | 'notification';
  config: any;
  timeout: number;
  retryPolicy: RetryPolicy;
  fallback?: string;
}

export interface StepDependency {
  stepId: string;
  dependsOn: string[];
  condition?: string;
}

export interface ErrorHandlingStrategy {
  onFailure: 'abort' | 'continue' | 'retry' | 'fallback';
  maxRetries: number;
  fallbackPlan?: string;
  notificationTargets: string[];
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableLogging: boolean;
  alertingRules: AlertingRule[];
}

export interface AlertingRule {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
}

export interface CostOptimization {
  enabled: boolean;
  strategies: CostStrategy[];
  budgetLimits: BudgetLimit[];
  recommendations: CostRecommendation[];
}

export interface CostStrategy {
  name: string;
  type: 'caching' | 'batching' | 'model_selection' | 'load_balancing';
  config: any;
  expectedSavings: number;
}

export interface BudgetLimit {
  period: 'daily' | 'weekly' | 'monthly';
  limit: number;
  warningThreshold: number;
  actions: BudgetAction[];
}

export interface BudgetAction {
  type: 'throttle' | 'fallback' | 'notification' | 'shutdown';
  config: any;
}

export interface CostRecommendation {
  type: string;
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: number;
}