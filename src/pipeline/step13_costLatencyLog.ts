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
  const {
    embedding_tokens, embedding_cost, embedding_type,
    parsing_tokens, parsing_cost, parsing_type,
    gpt_tokens, gpt_cost, gpt_type,
    total_tokens, total_cost
  } = context.costs;

  // Calculate performance metrics
  const latency_seconds = execution_time / 1000;
  const memory_usage_mb = process.memoryUsage().heapUsed / 1024 / 1024;

  // Performance assessment based on p95 latency scale
  let performance_grade = 'EXCELLENT';
  let performance_points = 15;

  if (latency_seconds > 5) {
    performance_grade = 'POOR';
    performance_points = 5; // >5s → 5 pts
  } else if (latency_seconds > 3) {
    performance_grade = 'GOOD';
    performance_points = 10; // 3-5s → 10 pts
  } else {
    performance_grade = 'EXCELLENT';
    performance_points = 15; // p95 ≤3s → 15 pts
  }

  // Cost assessment based on dollar amount per entry
  let cost_grade = 'EXCELLENT';
  let cost_points = 10;

  if (total_cost >= 0.005) {
    cost_grade = 'POOR';
    cost_points = 0; // >$0.005 → 0 pts
  } else if (total_cost >= 0.002) {
    cost_grade = 'FAIR';
    cost_points = 5; // $0.002-0.005 → 5 pts
  } else {
    cost_grade = 'EXCELLENT';
    cost_points = 10; // <$0.002 (or MOCK) → 10 pts
  }

  // Format cost display - show dollar amount or "MOCK" label
  const formatCost = (cost: number, type: string) => {
    return type === 'mock' ? 'MOCK' : `$${cost.toFixed(4)}`;
  };

  const totalCostDisplay = (embedding_type === 'mock' && parsing_type === 'mock' && gpt_type === 'mock') ? 'MOCK' : `$${total_cost.toFixed(4)}`;

  // Update context (no changes needed)
  const updatedContext: Partial<PipelineContext> = context;

  // Create detailed log entry
  const log: LogEntry = {
    tag: 'COST_LATENCY_LOG',
    input: `execution_time=${execution_time}ms, total_cost=${totalCostDisplay}`,
    output: `performance_grade=${performance_grade}, cost_grade=${cost_grade}`,
    note: `Wall-Clock: ${latency_seconds.toFixed(3)}s | Costs: embedding=${formatCost(embedding_cost, embedding_type)}, parsing=${formatCost(parsing_cost, parsing_type)}, gpt=${formatCost(gpt_cost, gpt_type)} | Memory: ${memory_usage_mb.toFixed(1)}MB`
  };

  // Also log to console for visibility
  console.log('\n=== PIPELINE PERFORMANCE SUMMARY ===');
  console.log(`⏱️  Wall-Clock Time: ${latency_seconds.toFixed(3)}s (${performance_grade} - ${performance_points} pts)`);
  console.log(`💰 Total Cost: ${totalCostDisplay} (${cost_grade} - ${cost_points} pts)`);
  console.log(`   - Embedding: ${formatCost(embedding_cost, embedding_type)} (${embedding_type})`);
  console.log(`   - Parsing: ${formatCost(parsing_cost, parsing_type)} (${parsing_type})`);
  console.log(`   - GPT: ${formatCost(gpt_cost, gpt_type)} (${gpt_type})`);
  console.log(`🧠 Memory Usage: ${memory_usage_mb.toFixed(1)}MB`);
  console.log('=====================================\n');

  return { context: updatedContext, log };
}