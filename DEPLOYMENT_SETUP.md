# Cloudflare Pages launch configuration

**Current status:** Astro branch prepared and GitHub CI tested. A Cloudflare account connection, verified email sender, authenticated live deployment and real-message test **cannot be confirmed from this repository alone**. Do not mark the production release complete until these steps pass.

## Project build settings
- GitHub repo: `jordangreenwebsite/michalrebekahart`
- Preview branch: `astro-exact-rebuild-seo-2026-11-14`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 22 or newer
- Canonical domain: `www.michalrebekahart.co.uk`
- Expected new URLs include `/artwork-guide/` and `/art-for-businesses/`.
- A `functions/api/contact.js` function handles server-side messages. `public/_routes.json` limits function invocations to `/api/*`.

## Set up email delivery
1. In [Resend](https://resend.com) add and verify `michalrebekahart.co.uk` as a sending domain (requires the DNS records shown by Resend). Do not use Gmail as the sending domain without verification.
2. In Cloudflare Pages > Settings > Variables and Secrets for **Production and Preview**, set:
   - `RESEND_API_KEY`: secret API token from Resend
   - `CONTACT_FROM_EMAIL`: verified sender, for example `Michal Rebekah Art <hello@michalrebekahart.co.uk>` only after verification
   - `CONTACT_TO_EMAIL`: `michalrebekahart@gmail.com`
3. Redploy the preview after saving. Open `/contact/`; submit a test. Confirm inbox arrival, subject, reply-to and visible success. Confirm invalid messages produce correct errors.
4. Enable Cloudflare rate limiting / bot protection for POST requests to `/api/contact`; a hidden honeypot, message limits and same-origin checks are already in the function.
5. Update email privacy and data-retention arrangements to reflect actual provider and usage.

## Releasing safely
- Compare screenshots and test native site in branch preview. Do not assume the original Breakdance lightbox and sticky mobile menu are identical until browser checks pass.
- Keep original export in GitHub for reference and rollback.
- Only then merge the PR into `main` and verify the public domain returns the new guide, sitemap, functional forms and correct assets.
- If Cloudflare's Git integration is not enabled or its build settings are still for the old static export, updating `main` will not automatically deploy Astro; configure it first.
- Run the Prunus Media audit and Google Search Console inspection afterwards.

## Metrics
See `SEO_MEASUREMENT.md`; use real Search Console and inbox figures. Merely adding 20 pages is not a traffic guarantee.
