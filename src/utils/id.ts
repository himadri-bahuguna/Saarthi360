// ============================================================
// ID Generator Utility
// ============================================================

let counter = 0;

export function generateId(prefix: string): string {
  counter++;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${counter}-${random}`;
}

export function generateStableId(prefix: string, seed: string): string {
  // Creates a deterministic-ish ID from a seed (used for deduplication)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${prefix}-${Math.abs(hash).toString(36)}`;
}
