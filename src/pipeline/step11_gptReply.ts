// src/pipeline/step11_gptReply.ts
// --------------------------------------------------------------
// Step 11 — GPT_REPLY
// Generates a ≤55-character empathic response using:
//   1) local Ollama LLM  (see services/openai.ts)
//   2) mock fallback if Ollama fails
// --------------------------------------------------------------
import { PipelineContext, LogEntry } from '../types';
import { generateGPTResponse } from '../services/openai';

export async function step11_gptReply(
  context: Partial<PipelineContext>
): Promise<{ context: Partial<PipelineContext>; log: LogEntry }> {
  /* sanity-check required inputs */
  if (
    !context.parsed ||
    !context.profile ||
    context.carry_in === undefined ||
    context.emotion_flip === undefined
  ) {
    throw new Error(
      'parsed, profile, carry_in, and emotion_flip are required for GPT reply'
    );
  }

  const { parsed, profile, carry_in, emotion_flip } = context;

  /* -------------------------------------------
     Call generateGPTResponse (local → mock)
  ------------------------------------------- */
  const { response: response_text, tokens: gptTokens, cost: gptCost, type: gptType } = await generateGPTResponse(
    parsed,
    profile,
    carry_in,
    emotion_flip
  );

  /* -------------------------------------------
     Update cost tracking
  ------------------------------------------- */
  const prevCosts = context.costs || {
    embedding_tokens: 0,
    embedding_cost: 0,
    embedding_type: 'mock' as const,
    gpt_tokens: 0,
    gpt_cost: 0,
    gpt_type: 'mock' as const,
    total_tokens: 0,
    total_cost: 0
  };

  const updatedContext: Partial<PipelineContext> = {
    ...context,
    response_text,
    costs: {
      ...prevCosts,
      gpt_tokens: gptTokens,
      gpt_cost: gptCost,
      gpt_type: gptType,
      total_tokens: prevCosts.total_tokens + gptTokens,
      total_cost: prevCosts.total_cost + gptCost
    }
  };

  /* -------------------------------------------
     Build log entry
  ------------------------------------------- */
  const costDisplay = gptType === 'mock' ? 'MOCK' : `$${gptCost.toFixed(4)}`;
  const log: LogEntry = {
    tag: 'GPT_REPLY',
    input: `vibes=[${parsed.vibe.join(
      ', '
    )}], carry_in=${carry_in}, emotion_flip=${emotion_flip}, entry_count=${
      profile.entry_count
    }`,
    output: `response_text="${response_text}" (${response_text.length} chars)`,
    note: `[${gptType.toUpperCase()}] Generated empathic response, cost: ${costDisplay}`
  };

  return { context: updatedContext, log };
}
