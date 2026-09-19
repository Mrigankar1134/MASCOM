/** Tiny class joiner, no runtime dependency, handles conditionals and nulls. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
