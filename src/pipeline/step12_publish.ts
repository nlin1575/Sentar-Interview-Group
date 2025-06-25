import { PipelineContext, LogEntry, PipelineResult } from '../types';

/**
 * Step 12: PUBLISH
 * Package {entryId, response_text, carry_in}
 * Input: entry_id, response_text, carry_in, profile → Output: final result
 */
export function step12_publish(context: Partial<PipelineContext>): { context: Partial<PipelineContext>, log: LogEntry, result: PipelineResult } {
  if (!context.entry_id || !context.response_text || context.carry_in === undefined || !context.profile || !context.start_time || !context.costs) {
    throw new Error('entry_id, response_text, carry_in, profile, start_time, and costs are required for publishing');
  }

  const execution_time = Date.now() - context.start_time;

  // Package final result
  const result: PipelineResult = {
    entryId: context.entry_id,
    response_text: context.response_text,
    carry_in: context.carry_in,
    updated_profile: context.profile,
    execution_time,
    total_cost: context.costs.total_cost
  };

  // Update context (no changes needed for publish step)
  const updatedContext: Partial<PipelineContext> = context;

  // Create log entry
  const log: LogEntry = {
    tag: 'PUBLISH',
    input: `entryId="${context.entry_id}", response_text="${context.response_text}", carry_in=${context.carry_in}`,
    output: `final_result packaged`,
    note: `Pipeline complete: ${execution_time}ms, $${context.costs.total_cost.toFixed(4)} total cost`
  };

  return { context: updatedContext, log, result };
}