import {
  SageMakerClient,
  DescribeEndpointCommand,
  DescribeModelCommand,
  ListEndpointsCommand
} from '@aws-sdk/client-sagemaker';
import {
  SageMakerRuntimeClient,
  InvokeEndpointCommand
} from '@aws-sdk/client-sagemaker-runtime';
import { logger } from '@/utils/logger';
import { SageMakerConfig, SageMakerResponse } from '@/types/ai';

export class SageMakerService {
  private readonly client: SageMakerClient;
  private readonly runtimeClient: SageMakerRuntimeClient;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';

    this.client = new SageMakerClient({
      region: this.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });

    this.runtimeClient = new SageMakerRuntimeClient({
      region: this.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });
  }

  async invokeEndpoint(
    endpointName: string,
    payload: any,
    config: SageMakerConfig = {}
  ): Promise<SageMakerResponse> {
    const startTime = Date.now();

    try {
      const command = new InvokeEndpointCommand({
        EndpointName: endpointName,
        Body: JSON.stringify(payload),
        ContentType: config.contentType || 'application/json',
        Accept: config.accept || 'application/json',
        CustomAttributes: config.customAttributes,
        TargetModel: config.targetModel,
        TargetVariant: config.targetVariant,
        InferenceId: config.inferenceId
      });

      const response = await this.runtimeClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.Body));

      const duration = Date.now() - startTime;

      logger.info('SageMaker endpoint invocation completed', {
        endpointName,
        duration,
        customAttributes: config.customAttributes,
        contentLength: response.Body?.length
      });

      return {
        body: responseBody,
        contentType: response.ContentType,
        customAttributes: response.CustomAttributes,
        invokedProductionVariant: response.InvokedProductionVariant,
        metadata: {
          endpointName,
          duration,
          timestamp: new Date()
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('SageMaker endpoint invocation failed', {
        endpointName,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
      throw error;
    }
  }

  async classifyDocument(
    documentContent: string,
    endpointName?: string
  ): Promise<{ classification: string; confidence: number; metadata: any }> {
    const endpoint = endpointName || process.env.SAGEMAKER_DOCUMENT_CLASSIFIER_ENDPOINT;

    if (!endpoint) {
      throw new Error('Document classifier endpoint not configured');
    }

    try {
      const payload = {
        instances: [{
          text: documentContent,
          max_length: 512
        }]
      };

      const response = await this.invokeEndpoint(endpoint, payload);
      const predictions = response.body.predictions?.[0];

      return {
        classification: predictions?.predicted_label || 'unknown',
        confidence: predictions?.confidence || 0,
        metadata: {
          scores: predictions?.scores || {},
          processingTime: response.metadata.duration
        }
      };
    } catch (error) {
      logger.error('Document classification failed', {
        endpointName: endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async extractEntities(
    text: string,
    endpointName?: string
  ): Promise<Array<{ entity: string; type: string; confidence: number; start: number; end: number }>> {
    const endpoint = endpointName || process.env.SAGEMAKER_NER_ENDPOINT;

    if (!endpoint) {
      throw new Error('Named Entity Recognition endpoint not configured');
    }

    try {
      const payload = {
        instances: [{
          text,
          return_offsets: true
        }]
      };

      const response = await this.invokeEndpoint(endpoint, payload);
      const entities = response.body.predictions?.[0]?.entities || [];

      return entities.map((entity: any) => ({
        entity: entity.text,
        type: entity.label,
        confidence: entity.confidence,
        start: entity.start,
        end: entity.end
      }));
    } catch (error) {
      logger.error('Entity extraction failed', {
        endpointName: endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async generateEmbeddings(
    texts: string[],
    endpointName?: string
  ): Promise<number[][]> {
    const endpoint = endpointName || process.env.SAGEMAKER_EMBEDDING_ENDPOINT;

    if (!endpoint) {
      throw new Error('Embedding endpoint not configured');
    }

    try {
      const payload = {
        instances: texts.map(text => ({ text }))
      };

      const response = await this.invokeEndpoint(endpoint, payload);
      return response.body.predictions || [];
    } catch (error) {
      logger.error('Embedding generation failed', {
        endpointName: endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async analyzemSentiment(
    text: string,
    endpointName?: string
  ): Promise<{ sentiment: string; confidence: number; scores: Record<string, number> }> {
    const endpoint = endpointName || process.env.SAGEMAKER_SENTIMENT_ENDPOINT;

    if (!endpoint) {
      throw new Error('Sentiment analysis endpoint not configured');
    }

    try {
      const payload = {
        instances: [{
          text,
          return_all_scores: true
        }]
      };

      const response = await this.invokeEndpoint(endpoint, payload);
      const prediction = response.body.predictions?.[0];

      return {
        sentiment: prediction?.predicted_label || 'neutral',
        confidence: prediction?.confidence || 0,
        scores: prediction?.scores || {}
      };
    } catch (error) {
      logger.error('Sentiment analysis failed', {
        endpointName: endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async describeEndpoint(endpointName: string) {
    try {
      const command = new DescribeEndpointCommand({
        EndpointName: endpointName
      });

      const response = await this.client.send(command);
      return {
        endpointName: response.EndpointName,
        endpointArn: response.EndpointArn,
        endpointStatus: response.EndpointStatus,
        creationTime: response.CreationTime,
        lastModifiedTime: response.LastModifiedTime,
        productionVariants: response.ProductionVariants,
        dataCaptureConfig: response.DataCaptureConfig
      };
    } catch (error) {
      logger.error('Failed to describe endpoint', {
        endpointName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async listEndpoints(): Promise<Array<{ name: string; status: string; creationTime: Date }>> {
    try {
      const command = new ListEndpointsCommand({
        StatusEquals: 'InService',
        MaxResults: 100
      });

      const response = await this.client.send(command);

      return (response.Endpoints || []).map(endpoint => ({
        name: endpoint.EndpointName!,
        status: endpoint.EndpointStatus!,
        creationTime: endpoint.CreationTime!
      }));
    } catch (error) {
      logger.error('Failed to list endpoints', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getEndpointHealth(endpointName: string): Promise<{
    isHealthy: boolean;
    status: string;
    lastCheck: Date;
    responseTime?: number;
  }> {
    try {
      const startTime = Date.now();
      const endpointInfo = await this.describeEndpoint(endpointName);
      const responseTime = Date.now() - startTime;

      const isHealthy = endpointInfo.endpointStatus === 'InService';

      return {
        isHealthy,
        status: endpointInfo.endpointStatus!,
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      logger.error('Health check failed', {
        endpointName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isHealthy: false,
        status: 'Error',
        lastCheck: new Date()
      };
    }
  }

  async performBatchInference(
    endpointName: string,
    inputs: any[],
    batchSize: number = 10
  ): Promise<any[]> {
    const results: any[] = [];

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);

      try {
        const response = await this.invokeEndpoint(endpointName, {
          instances: batch
        });

        results.push(...(response.body.predictions || []));
      } catch (error) {
        logger.error('Batch inference failed', {
          endpointName,
          batchIndex: Math.floor(i / batchSize),
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        results.push(...batch.map(() => ({ error: 'Processing failed' })));
      }
    }

    return results;
  }
}