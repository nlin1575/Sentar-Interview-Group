import { PipelineContext, LogEntry } from '../types';

/**
 * Step 13: COST_LATENCY_LOG
 * Print mock cost + time used
 * Input: costs, start_time → Output: performance metrics
 */
export function step13_costLatencyLog(context: Partial<PipelineContext>): { context: Partial<PipelineContext>, log: LogEntry } {
  if (!context.start_time || !context.costs) {
    throw new Error('start_time and costs are required for cost/latency logging');
  }

  const execution_time = Date.now() - context.start_time;
  const { embedding_cost, gpt_cost, total_cost } = context.costs;

  // Calculate performance metrics
  const latency_seconds = execution_time / 1000;
  const memory_usage_mb = process.memoryUsage().heapUsed / 1024 / 1024;

  // Performance assessment
  let performance_grade = 'EXCELLENT';
  if (latency_seconds > 5) {
    performance_grade = 'POOR';
  } else if (latency_seconds > 3) {
    performance_grade = 'FAIR';
  } else if (latency_seconds > 1) {
    performance_grade = 'GOOD';
  }

  // Cost assessment
  let cost_grade = 'EXCELLENT';
  if (total_cost > 0.005) {
    cost_grade = 'POOR';
  } else if (total_cost > 0.002) {
    cost_grade = 'FAIR';
  }

  // Update context (no changes needed)
  const updatedContext: Partial<PipelineContext> = context;

  // Create detailed log entry
  const log: LogEntry = {
    tag: 'COST_LATENCY_LOG',
    input: `execution_time=${execution_time}ms, total_cost=$${total_cost.toFixed(4)}`,
    output: `performance_grade=${performance_grade}, cost_grade=${cost_grade}`,
    note: `Latency: ${latency_seconds.toFixed(3)}s | Costs: embedding=$${embedding_cost.toFixed(4)}, gpt=$${gpt_cost.toFixed(4)} | Memory: ${memory_usage_mb.toFixed(1)}MB`
  };

  // Also log to console for visibility
  console.log('\n=== PIPELINE PERFORMANCE SUMMARY ===');
  console.log(`⏱️  Execution Time: ${latency_seconds.toFixed(3)}s (${performance_grade})`);
  console.log(`💰 Total Cost: $${total_cost.toFixed(4)} (${cost_grade})`);
  console.log(`   - Embedding: $${embedding_cost.toFixed(4)}`);
  console.log(`   - GPT: $${gpt_cost.toFixed(4)}`);
  console.log(`🧠 Memory Usage: ${memory_usage_mb.toFixed(1)}MB`);
  console.log('=====================================\n');

  return { context: updatedContext, log };
}