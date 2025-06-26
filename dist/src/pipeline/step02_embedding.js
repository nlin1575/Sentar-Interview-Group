"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step02_embedding = step02_embedding;
const openai_1 = require("../services/openai");
/**
 * Step 02: EMBEDDING
 * Create n-dimensional MiniLM vector (or mock)
 * Input: raw_text → Output: embedding[n]
 */
async function step02_embedding(context) {
    if (!context.raw_text) {
        throw new Error('raw_text is required for embedding generation');
    }
    // Generate embedding using OpenAI API or fallback to mock
    const { embedding, tokens, cost, type } = await (0, openai_1.generateEmbedding)(context.raw_text);
    // Update context
    const updatedContext = {
        ...context,
        embedding,
        costs: {
            embedding_tokens: tokens,
            embedding_cost: cost,
            embedding_type: type,
            parsing_tokens: 0,
            parsing_cost: 0,
            parsing_type: 'mock',
            gpt_tokens: 0,
            gpt_cost: 0,
            gpt_type: 'mock',
            total_tokens: tokens,
            total_cost: cost
        }
    };
    // Create log entry
    const costDisplay = type === 'mock' ? 'MOCK' : `$${cost.toFixed(4)}`;
    const log = {
        tag: 'EMBEDDING',
        input: `raw_text="${context.raw_text.substring(0, 30)}${context.raw_text.length > 30 ? '...' : ''}"`,
        output: `embedding[${embedding.length}] (first 3: [${embedding.slice(0, 3).map(n => n.toFixed(4)).join(', ')}...])`,
        note: `[${type.toUpperCase()}] Generated ${embedding.length}D embedding, cost: ${costDisplay}`
    };
    return { context: updatedContext, log };
}
//# sourceMappingURL=step02_embedding.js.map