import { PipelineContext, LogEntry } from '../types';
import { generateEmbedding, isOpenAIAvailable } from '../services/openai';

/**
 * Step 02: EMBEDDING
 * Create n-dimensional MiniLM vector (or mock)
 * Input: raw_text → Output: embedding[n]
 */
export async function step02_embedding(context: Partial<PipelineContext>): Promise<{ context: Partial<PipelineContext>, log: LogEntry }> {
  if (!context.raw_text) {
    throw new Error('raw_text is required for embedding generation');
  }

  // Generate embedding using OpenAI API or fallback to mock
  const { embedding, cost } = await generateEmbedding(context.raw_text);

  // Update context
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    embedding,
    costs: {
      embedding_cost: cost,
      gpt_cost: 0,
      total_cost: cost
    }
  };

  // Create log entry
  const apiType = isOpenAIAvailable ? 'OpenAI API' : 'MOCK';
  const log: LogEntry = {
    tag: 'EMBEDDING',
    input: `raw_text="${context.raw_text.substring(0, 30)}${context.raw_text.length > 30 ? '...' : ''}"`,
    output: `embedding[${embedding.length}] (first 3: [${embedding.slice(0, 3).map(n => n.toFixed(4)).join(', ')}...])`,
    note: `[${apiType}] Generated ${embedding.length}D embedding, cost: $${cost.toFixed(4)}`
  };

  return { context: updatedContext, log };
}