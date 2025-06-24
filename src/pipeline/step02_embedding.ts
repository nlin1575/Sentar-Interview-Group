import { RawText, Embedding } from '../types';
import { execFileSync } from 'child_process';
import path from 'path';

const script = path.resolve(__dirname, '../../python/embed.py');

export function embed(rawText: RawText): Embedding {
  // Call the Python script, pipe text to stdin, get JSON back
  const vecJson = execFileSync(script, { input: rawText, encoding: 'utf8' });
  const embedding: Embedding = JSON.parse(vecJson);   // 384 numbers

  console.log(
    `[EMBEDDING] input=<${rawText}> | output=[${embedding.length}] | note=MiniLM-L6-v2 (py)`
  );

  return embedding;
}