import type { APIRoute } from 'astro';
import { siteConfig } from '@/site.config';

export function getRobotsTxt(sitemapUrl: URL): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl.href}\n`;
}

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL(
    'sitemap-index.xml',
    site ?? new URL(siteConfig.siteUrl),
  );

  return new Response(getRobotsTxt(sitemapUrl), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
