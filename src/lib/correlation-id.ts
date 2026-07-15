/**
 * Reuses an existing correlation id (e.g. the `x-vercel-id` header) when present,
 * otherwise generates a fresh one. Lets structured logs across a server fn's
 * internal steps be tied together, and to an inbound request id when one exists.
 */
export function getOrCreateCorrelationId(existing: string | null | undefined): string {
  return existing && existing.length > 0 ? existing : crypto.randomUUID();
}
