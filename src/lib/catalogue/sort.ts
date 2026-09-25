type SortableEntry = {
  data: {
    crossSectionMm2: number;
    name: string;
  };
};

/**
 * Orders the catalogue the way a trade buyer scans it: by conductor size, then
 * by name.
 *
 * Takes and returns collection entries rather than bare product data, so the
 * whole pipeline — filter, assert, sort — is entry-in/entry-out and a caller
 * never has to destructure mid-way and lose the entry it still needs to render.
 */
export function sortProducts<T extends SortableEntry>(
  entries: readonly T[],
): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const sizeDifference =
        left.entry.data.crossSectionMm2 - right.entry.data.crossSectionMm2;

      if (sizeDifference !== 0) {
        return sizeDifference;
      }

      const nameDifference = left.entry.data.name.localeCompare(
        right.entry.data.name,
      );

      // Index tiebreak keeps equal entries in source order deterministically.
      return nameDifference !== 0 ? nameDifference : left.index - right.index;
    })
    .map(({ entry }) => entry);
}
