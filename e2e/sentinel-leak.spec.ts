import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { TODO_CLIENT } from '@/lib/config/placeholders';

const DIST_DIRECTORY = fileURLToPath(new URL('../dist/', import.meta.url));

async function findHtmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = `${directory}/${entry.name}`;

      if (entry.isDirectory()) {
        return findHtmlFiles(path);
      }

      return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
    }),
  );

  return files.flat();
}

test('built HTML contains no client sentinels', async () => {
  const htmlFiles = await findHtmlFiles(DIST_DIRECTORY);

  expect(htmlFiles).not.toHaveLength(0);

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const sentinelIndex = html.indexOf(TODO_CLIENT);

    if (sentinelIndex !== -1) {
      const excerptStart = Math.max(0, sentinelIndex - 120);
      const excerptEnd = Math.min(html.length, sentinelIndex + 120);
      const excerpt = html.slice(excerptStart, excerptEnd);

      throw new Error(
        `Sentinel found in ${file}. Surrounding excerpt: ${excerpt}`,
      );
    }
  }
});
