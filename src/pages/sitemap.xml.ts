import { entries } from '../data/discovery.mjs';
const site = 'https://www.michalrebekahart.co.uk';
const stable = ['', 'our-story', 'journal', 'commissions', 'contact', 'privacy-policy', 'artwork-and-commissions'];
export const GET = () => {
  const urls = [...stable, ...entries.map(entry => entry.slug)];
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map(path => '<url><loc>' + site + '/' + (path ? path + '/' : '') + '</loc></url>').join('\n')
    + '\n</urlset>';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
