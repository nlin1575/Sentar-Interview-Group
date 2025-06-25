import { PipelineContext, LogEntry } from '../types';
import { generateGPTResponse, isOpenAIAvailable } from '../services/openai';

/**
 * Step 11: GPT_REPLY
 * Generate ≤ 55-char empathic response
 * Input: parsed, profile, carry_in, emotion_flip → Output: response_text
 */
export async function step11_gptReply(context: Partial<PipelineContext>): Promise<{ context: Partial<PipelineContext>, log: LogEntry }> {
  if (!context.parsed || !context.profile || context.carry_in === undefined || context.emotion_flip === undefined) {
    throw new Error('parsed, profile, carry_in, and emotion_flip are required for GPT reply');
  }

  const { parsed, profile, carry_in, emotion_flip } = context;

  // Generate empathetic response using OpenAI API or fallback to mock
  const { response: response_text, cost: gptCost } = await generateGPTResponse(parsed, profile, carry_in, emotion_flip);

  // Update context with costs
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    response_text,
    costs: {
      ...context.costs!,
      gpt_cost: gptCost,
      total_cost: context.costs!.total_cost + gptCost
    }
  };

  // Create log entry
  const apiType = isOpenAIAvailable ? 'OpenAI API' : 'MOCK';
  const log: LogEntry = {
    tag: 'GPT_REPLY',
    input: `vibes=[${parsed.vibe.join(', ')}], carry_in=${carry_in}, emotion_flip=${emotion_flip}, entry_count=${profile.entry_count}`,
    output: `response_text="${response_text}" (${response_text.length} chars)`,
    note: `[${apiType}] Generated empathic response, cost: $${gptCost.toFixed(4)}`
  };

  return { context: updatedContext, log };
}