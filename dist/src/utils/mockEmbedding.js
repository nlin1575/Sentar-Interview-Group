"use strict";
// Mock embedding generation for testing
// In production, this would be replaced with actual MiniLM model
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMockEmbedding = generateMockEmbedding;
exports.calculateEmbeddingCost = calculateEmbeddingCost;
function generateMockEmbedding(text, dimensions = 384) {
    // Create a deterministic but pseudo-random embedding based on text content
    const seed = hashString(text);
    const rng = createSeededRandom(seed);
    const embedding = new Array(dimensions);
    for (let i = 0; i < dimensions; i++) {
        embedding[i] = (rng() - 0.5) * 2; // Range: -1 to 1
    }
    // Normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
}
// Simple hash function for string to create deterministic seed
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
// Seeded random number generator for deterministic results
function createSeededRandom(seed) {
    let state = seed;
    return function () {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}
// Mock cost calculation for embedding generation
function calculateEmbeddingCost(text) {
    // Mock cost: $0 (we don't count mock costs toward total)
    return 0;
}
//# sourceMappingURL=mockEmbedding.js.map