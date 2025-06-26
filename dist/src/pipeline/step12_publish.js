"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step12_publish = step12_publish;
/**
 * Step 12: PUBLISH
 * Package {entryId, response_text, carry_in}
 * Input: entry_id, response_text, carry_in, profile → Output: final result
 */
function step12_publish(context) {
    if (!context.entry_id || !context.response_text || context.carry_in === undefined || !context.profile || !context.start_time || !context.costs) {
        throw new Error('entry_id, response_text, carry_in, profile, start_time, and costs are required for publishing');
    }
    const execution_time = Date.now() - context.start_time;
    // Package final result
    const result = {
        entryId: context.entry_id,
        response_text: context.response_text,
        carry_in: context.carry_in,
        updated_profile: context.profile,
        execution_time,
        total_tokens: context.costs.total_tokens,
        total_cost: context.costs.total_cost
    };
    // Update context (no changes needed for publish step)
    const updatedContext = context;
    // Create log entry
    const log = {
        tag: 'PUBLISH',
        input: `entryId="${context.entry_id}", response_text="${context.response_text}", carry_in=${context.carry_in}`,
        output: `final_result packaged`,
        note: `Pipeline complete: ${execution_time}ms, ${context.costs.total_tokens} tokens, $${context.costs.total_cost.toFixed(4)} total cost`
    };
    return { context: updatedContext, log, result };
}
//# sourceMappingURL=step12_publish.js.map