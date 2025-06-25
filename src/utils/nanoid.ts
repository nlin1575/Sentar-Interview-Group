// Simple ID generation utility
// Using a basic implementation instead of external nanoid dependency

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function generateId(length: number = 21): string {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

// Generate a timestamp-based ID for better sorting
export function generateTimestampId(): string {
  const timestamp = Date.now().toString(36);
  const random = generateId(8);
  return `${timestamp}-${random}`;
}