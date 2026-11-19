import { entries } from '../data/discovery.mjs';
const site = 'https://www.michalrebekahart.com';
const stable = ['', 'our-story', 'journal', 'commissions', 'contact', 'privacy-policy', 'journal/choosing-between-watercolour-and-oil-paintings', 'artwork-and-commissions', 'artwork-guide', 'art-for-businesses'];
export const GET = () => {
  const urls = [...new Set([...stable, ...entries.map(entry => entry.slug)])];
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map(path => '<url><loc>' + site + '/' + (path ? path + '/' : '') + '</loc></url>').join('\n')
    + '\n</urlset>';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
