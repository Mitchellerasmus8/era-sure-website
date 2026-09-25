type SluggedEntry = {
  id?: string;
  data: {
    slug: string;
    name?: string;
  };
};

function entryLabel(entry: SluggedEntry, index: number): string {
  return entry.id ?? entry.data.name ?? `entry at index ${index}`;
}

export function assertUniqueSlugs<T extends SluggedEntry>(
  entries: readonly T[],
): void {
  const holdersBySlug = new Map<string, string[]>();

  entries.forEach((entry, index) => {
    const holders = holdersBySlug.get(entry.data.slug) ?? [];
    holders.push(entryLabel(entry, index));
    holdersBySlug.set(entry.data.slug, holders);
  });

  const duplicates = [...holdersBySlug.entries()].filter(
    ([, holders]) => holders.length > 1,
  );

  if (duplicates.length === 0) {
    return;
  }

  const details = duplicates
    .map(([slug, holders]) => `"${slug}" held by ${holders.join(' and ')}`)
    .join('; ');

  throw new Error(`Duplicate product slug: ${details}.`);
}
