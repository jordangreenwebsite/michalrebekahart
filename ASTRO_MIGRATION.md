# Astro migration and launch checklist

## Source and scope
The original site is a WordPress/Breakdance static export held in this repository; **do not delete or overwrite it**. Its CSS, images and page markup are the visual comparison source. See [design.md](./design.md) and [Business OS design library](https://github.com/jordangreenwebsite/business-os/blob/main/design-library/INDEX.md).

## Build
- Node 22+; `npm install`; `npm run build`; output `dist/`.
- Cloudflare Pages: framework preset Astro, build command `npm run build`, output folder `dist`, root `/`.
- Astro renders the original home, story, commissions, journal, contact and privacy HTML while keeping their local image/CSS assets. The 20 new discovery pages are native Astro, in `src/data/discovery.mjs`, `src/pages/[slug].astro` and `src/pages/artwork-and-commissions.astro`.
- Only real assets referenced in existing HTML/CSS are copied; WordPress PHP is not deployed.
- Keep `www.michalrebekahart.co.uk` as canonical, preserve legacy URLs and 301 redirect `/home/` and `/news-blog/`.
- New sitemap `/sitemap.xml` with existing and additional pages; `/robots.txt` references it.
- Existing contact form depended on WordPress admin-ajax.php. Astro replaces it with a **mailto composer**, not an automatic backend submission. It explicitly opens the visitor's own email application; test this flow on desktop and mobile. Existing visible WhatsApp and email links remain.

## Publication gate (not yet complete)
- [ ] `npm run build` passes on a clean checkout and the CI check is green.
- [ ] Capture live-original versus branch-preview screenshots at desktop 1440px, tablet 768px and mobile 375px. Compare header/motion, images/crops, hero, whitespace, gallery/lightbox, page lengths, typography, contact and footer.
- [ ] Open every original gallery collection and mobile menu on the preview. Resolve remaining WordPress-specific JS references before replacing production.
- [ ] Verify enquiries end-to-end: actual email composer and WhatsApp link on mobile/desktop, and that the privacy policy describes these correctly.
- [ ] Check every artwork image visually and replace the current conservative fallback alt descriptions with subject-accurate alt text; decorative art only gets empty alt.
- [ ] Check `sitemap.xml`, `robots.txt`, canonicals, redirects, Open Graph previews and the 26 page outputs.
- [ ] Check that a service area or studio visit is never invented, and that commissions remain limited and personally confirmed.
- [ ] Confirm Cloudflare production domain settings (www and apex), then merge and deploy only after preview QA.
- [ ] After deployment submit `https://www.michalrebekahart.co.uk/sitemap.xml` in Google Search Console, inspect core pages, and monitor impressions, indexed pages and real enquiries over 4–8 weeks. Zero traffic reported by audit is not a substitute for actual Search Console figures.
- [ ] Phase two: replace preserved Breakdance markup with discrete native Astro components once screenshot parity is proven; do not trade away artwork presentation for framework purity.

## Editorial note
Eight regional and eleven intent pages plus one overview have been drafted separately. Regional pages explain the Cirencester base and do not pretend there is a Swindon, Bath or Cheltenham studio. Use search impressions and real enquiries to decide whether to keep, rewrite or prune weaker pages.
