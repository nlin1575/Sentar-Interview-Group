// Cosine similarity calculation for embeddings

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// Calculate maximum cosine similarity between a vector and an array of vectors
export function maxCosineSimilarity(target: number[], vectors: number[][]): number {
  if (vectors.length === 0) {
    return 0;
  }

  return Math.max(...vectors.map(vector => cosineSimilarity(target, vector)));
}

// Check if two arrays have any overlapping elements
export function hasOverlap<T>(arr1: T[], arr2: T[]): boolean {
  return arr1.some(item => arr2.includes(item));
}