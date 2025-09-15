import {
  BedrockClient,
  ListFoundationModelsCommand,
  GetFoundationModelCommand
} from '@aws-sdk/client-bedrock';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand
} from '@aws-sdk/client-bedrock-runtime';
import { logger } from '@/utils/logger';
import { ModelConfig, ModelResponse, StreamingResponse } from '@/types/ai';

export class BedrockService {
  private readonly client: BedrockClient;
  private readonly runtimeClient: BedrockRuntimeClient;
  private readonly region: string;

  constructor() {
    this.region = process.env.BEDROCK_REGION || 'us-east-1';

    this.client = new BedrockClient({
      region: this.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });

    this.runtimeClient = new BedrockRuntimeClient({
      region: this.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });
  }

  async invokeModel(
    modelId: string,
    prompt: string,
    config: ModelConfig = {}
  ): Promise<ModelResponse> {
    const startTime = Date.now();

    try {
      const payload = this.buildPayload(modelId, prompt, config);

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(payload),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.runtimeClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      const duration = Date.now() - startTime;

      logger.info('Bedrock model invocation completed', {
        modelId,
        duration,
        inputTokens: this.getInputTokenCount(payload),
        outputTokens: this.getOutputTokenCount(responseBody)
      });

      return {
        content: this.extractContent(modelId, responseBody),
        usage: {
          inputTokens: this.getInputTokenCount(payload),
          outputTokens: this.getOutputTokenCount(responseBody),
          totalTokens: this.getInputTokenCount(payload) + this.getOutputTokenCount(responseBody)
        },
        metadata: {
          modelId,
          duration,
          finishReason: this.getFinishReason(responseBody)
        }
      };
    } catch (error) {
      logger.error('Bedrock model invocation failed', {
        modelId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  async invokeModelStream(
    modelId: string,
    prompt: string,
    config: ModelConfig = {}
  ): Promise<StreamingResponse> {
    try {
      const payload = this.buildPayload(modelId, prompt, config);

      const command = new InvokeModelWithResponseStreamCommand({
        modelId,
        body: JSON.stringify(payload),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.runtimeClient.send(command);

      if (!response.body) {
        throw new Error('No response body received from streaming invocation');
      }

      return {
        stream: this.createAsyncIterator(response.body),
        metadata: {
          modelId,
          startTime: Date.now()
        }
      };
    } catch (error) {
      logger.error('Bedrock streaming invocation failed', {
        modelId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async listFoundationModels(): Promise<Array<{ modelId: string; modelName: string; provider: string }>> {
    try {
      const command = new ListFoundationModelsCommand({});
      const response = await this.client.send(command);

      return (response.modelSummaries || []).map(model => ({
        modelId: model.modelId!,
        modelName: model.modelName!,
        provider: model.providerName!
      }));
    } catch (error) {
      logger.error('Failed to list foundation models', { error });
      throw error;
    }
  }

  async getModelInfo(modelId: string) {
    try {
      const command = new GetFoundationModelCommand({ modelIdentifier: modelId });
      const response = await this.client.send(command);
      return response.modelDetails;
    } catch (error) {
      logger.error('Failed to get model info', { modelId, error });
      throw error;
    }
  }

  private buildPayload(modelId: string, prompt: string, config: ModelConfig): any {
    const provider = this.getProvider(modelId);

    switch (provider) {
      case 'anthropic':
        return {
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens || 4000,
          temperature: config.temperature || 0.7,
          top_p: config.topP || 0.9,
          anthropic_version: 'bedrock-2023-05-31'
        };

      case 'amazon':
        return {
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: config.maxTokens || 4000,
            temperature: config.temperature || 0.7,
            topP: config.topP || 0.9,
            stopSequences: config.stopSequences || []
          }
        };

      case 'ai21':
        return {
          prompt,
          maxTokens: config.maxTokens || 4000,
          temperature: config.temperature || 0.7,
          topP: config.topP || 0.9,
          stopSequences: config.stopSequences || []
        };

      case 'cohere':
        return {
          prompt,
          max_tokens: config.maxTokens || 4000,
          temperature: config.temperature || 0.7,
          p: config.topP || 0.9,
          stop_sequences: config.stopSequences || []
        };

      default:
        throw new Error(`Unsupported model provider: ${provider}`);
    }
  }

  private extractContent(modelId: string, responseBody: any): string {
    const provider = this.getProvider(modelId);

    switch (provider) {
      case 'anthropic':
        return responseBody.content?.[0]?.text || '';
      case 'amazon':
        return responseBody.results?.[0]?.outputText || '';
      case 'ai21':
        return responseBody.completions?.[0]?.data?.text || '';
      case 'cohere':
        return responseBody.generations?.[0]?.text || '';
      default:
        return responseBody.text || responseBody.content || '';
    }
  }

  private getInputTokenCount(payload: any): number {
    return Math.ceil(JSON.stringify(payload).length / 4);
  }

  private getOutputTokenCount(responseBody: any): number {
    const content = Object.values(responseBody).join(' ');
    return Math.ceil(content.length / 4);
  }

  private getFinishReason(responseBody: any): string {
    return responseBody.stop_reason || responseBody.finishReason || 'complete';
  }

  private getProvider(modelId: string): string {
    if (modelId.includes('anthropic')) return 'anthropic';
    if (modelId.includes('amazon')) return 'amazon';
    if (modelId.includes('ai21')) return 'ai21';
    if (modelId.includes('cohere')) return 'cohere';
    if (modelId.includes('meta')) return 'meta';
    return 'unknown';
  }

  private async* createAsyncIterator(stream: any): AsyncGenerator<string> {
    for await (const chunk of stream) {
      if (chunk.chunk?.bytes) {
        const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
        const content = this.extractStreamContent(chunkData);
        if (content) {
          yield content;
        }
      }
    }
  }

  private extractStreamContent(chunkData: any): string {
    if (chunkData.type === 'content_block_delta') {
      return chunkData.delta?.text || '';
    }
    if (chunkData.outputText) {
      return chunkData.outputText;
    }
    return '';
  }
}