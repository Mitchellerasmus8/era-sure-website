/**
 * Reports which site-config values are still placeholders.
 *
 * Groundwork for ARCHI §22 #5 — the guard that stops placeholder data reaching
 * production. It only reports today, because every field is currently a
 * placeholder; a pre-launch feature turns the report into a build failure.
 *
 * Two sentinel forms exist, and both must be caught — see `src/site.config.ts`.
 */

export const TODO_CLIENT = 'TODO_CLIENT';

function isInvalidUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/\.$/, '');

    return hostname === 'invalid' || hostname.endsWith('.invalid');
  } catch {
    return false;
  }
}

export function isPlaceholder(value: unknown): boolean {
  return (
    value === TODO_CLIENT || (typeof value === 'string' && isInvalidUrl(value))
  );
}

function walk(
  value: unknown,
  path: string,
  ancestors: WeakSet<object>,
): string[] {
  if (isPlaceholder(value)) {
    return path ? [path] : [];
  }

  if (value === null || typeof value !== 'object' || ancestors.has(value)) {
    return [];
  }

  ancestors.add(value);

  const paths = Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => walk(child, path ? `${path}.${key}` : key, ancestors),
  );

  ancestors.delete(value);

  return paths;
}

export function findPlaceholders(config: unknown): string[] {
  return walk(config, '', new WeakSet<object>());
}
