/**
 * Generate a unique ID using crypto.randomUUID()
 * Wrapper for consistency across the codebase
 */
export function generateId(): string {
  return crypto.randomUUID();
}
