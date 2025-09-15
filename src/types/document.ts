export interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  content: DocumentContent;
  analysis: DocumentAnalysis;
  compliance: ComplianceResult;
}

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

export interface DocumentMetadata {
  classification: DocumentClassification;
  extractedMetadata: Record<string, any>;
  processingHistory: ProcessingStep[];
  tags: string[];
  confidenceScore: number;
}

export enum DocumentClassification {
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  REPORT = 'report',
  EMAIL = 'email',
  PRESENTATION = 'presentation',
  SPREADSHEET = 'spreadsheet',
  IMAGE = 'image',
  OTHER = 'other'
}

export interface DocumentContent {
  extractedText: string;
  tables: TableData[];
  images: ImageData[];
  structuredData: Record<string, any>;
  embeddings: number[];
}

export interface TableData {
  id: string;
  headers: string[];
  rows: string[][];
  metadata: {
    pageNumber?: number;
    position: BoundingBox;
    confidence: number;
  };
}

export interface ImageData {
  id: string;
  url: string;
  description?: string;
  metadata: {
    pageNumber?: number;
    position: BoundingBox;
    ocrText?: string;
  };
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentAnalysis {
  sentiment: SentimentAnalysis;
  entities: EntityExtraction[];
  keyPhrases: string[];
  summary: string;
  topics: Topic[];
  language: string;
  readabilityScore: number;
}

export interface SentimentAnalysis {
  overall: SentimentScore;
  sentences: SentimentScore[];
}

export interface SentimentScore {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  score: number;
}

export interface EntityExtraction {
  text: string;
  type: EntityType;
  confidence: number;
  startOffset: number;
  endOffset: number;
  linkedData?: Record<string, any>;
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  MONEY = 'money',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  CUSTOM = 'custom'
}

export interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
}

export interface ComplianceResult {
  overallStatus: ComplianceStatus;
  checks: ComplianceCheck[];
  piiDetection: PIIDetectionResult;
  riskScore: number;
  recommendations: string[];
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  NEEDS_REVIEW = 'needs_review',
  UNKNOWN = 'unknown'
}

export interface ComplianceCheck {
  ruleId: string;
  ruleName: string;
  status: ComplianceStatus;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PIIDetectionResult {
  detected: boolean;
  entities: PIIEntity[];
  confidence: number;
  maskedContent?: string;
}

export interface PIIEntity {
  type: PIIType;
  text: string;
  confidence: number;
  startOffset: number;
  endOffset: number;
}

export enum PIIType {
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  NAME = 'name',
  DATE_OF_BIRTH = 'date_of_birth',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license'
}

export interface ProcessingStep {
  stepName: string;
  timestamp: Date;
  duration: number;
  status: 'success' | 'failure' | 'warning';
  details: Record<string, any>;
  agentId?: string;
}

export interface DocumentQuery {
  query: string;
  filters?: DocumentFilters;
  limit?: number;
  offset?: number;
  includeContent?: boolean;
}

export interface DocumentFilters {
  classification?: DocumentClassification[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  status?: DocumentStatus[];
  minConfidence?: number;
}

export interface DocumentSearchResult {
  documents: Document[];
  total: number;
  searchMetadata: {
    query: string;
    processingTime: number;
    similarityThreshold: number;
  };
}