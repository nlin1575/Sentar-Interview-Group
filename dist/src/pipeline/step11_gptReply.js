"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step11_gptReply = step11_gptReply;
const openai_1 = require("../services/openai");
async function step11_gptReply(context) {
    /* sanity-check required inputs */
    if (!context.parsed ||
        !context.profile ||
        context.carry_in === undefined ||
        context.emotion_flip === undefined) {
        throw new Error('parsed, profile, carry_in, and emotion_flip are required for GPT reply');
    }
    const { parsed, profile, carry_in, emotion_flip } = context;
    /* -------------------------------------------
       Call generateGPTResponse (local → mock)
    ------------------------------------------- */
    const { response: response_text, tokens: gptTokens, cost: gptCost, type: gptType } = await (0, openai_1.generateGPTResponse)(parsed, profile, carry_in, emotion_flip);
    /* -------------------------------------------
       Update cost tracking
    ------------------------------------------- */
    const prevCosts = context.costs || {
        embedding_tokens: 0,
        embedding_cost: 0,
        embedding_type: 'mock',
        parsing_tokens: 0,
        parsing_cost: 0,
        parsing_type: 'mock',
        gpt_tokens: 0,
        gpt_cost: 0,
        gpt_type: 'mock',
        total_tokens: 0,
        total_cost: 0
    };
    const updatedContext = {
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
    const log = {
        tag: 'GPT_REPLY',
        input: `vibes=[${parsed.vibe.join(', ')}], carry_in=${carry_in}, emotion_flip=${emotion_flip}, entry_count=${profile.entry_count}`,
        output: `response_text="${response_text}" (${response_text.length} chars)`,
        note: `[${gptType.toUpperCase()}] Generated empathic response, cost: ${costDisplay}`
    };
    return { context: updatedContext, log };
}
//# sourceMappingURL=step11_gptReply.js.map