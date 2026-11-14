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

## Optional privacy-friendly conversion analytics

If you want an aggregate count of delivered form enquiries, add a Cloudflare Analytics Engine binding named `ART_ANALYTICS` with dataset `michal_rebekah_art_events`. The form handler writes one event after a successful provider acceptance. It writes no name, email, message, browser identifier or IP address. Without the binding the form works normally but no Cloudflare conversion event is stored. Search Console impressions and clicks still require Search Console access; this binding does not provide them.

## Connecting art enquiries to the Prunus Media backend

The form now uses Resend for email delivery and can optionally mirror the accepted enquiry to Prunus with an HMAC-signed webhook. Set `PRUNUS_LEADS_WEBHOOK_URL` and `PRUNUS_LEADS_WEBHOOK_SECRET` in Cloudflare after creating the receiving endpoint in Prunus. Email continues to work when the webhook is not connected. See [PRUNUS_BACKEND_HANDOFF.md](./PRUNUS_BACKEND_HANDOFF.md) for the exact payload, signature checks and tests. This is not a claim that an endpoint has already been created or connected.

## Cloudflare variable names already present (14 November 2026)

The Cloudflare Pages screenshot shows `RESEND_API_KEY`, `QUOTE_FROM_EMAIL`, `QUOTE_TO_EMAIL`, and `PORTAL_INGEST_TOKEN` already configured. The contact function now supports both `QUOTE_FROM_EMAIL` / `QUOTE_TO_EMAIL` and `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL`. A comma, semicolon or line break in `QUOTE_TO_EMAIL` separates recipient addresses; remove any erroneous addresses before sending.

No new names are needed for Resend if these variables are set in the **Production** environment and the sending domain is verified by Resend. `PORTAL_INGEST_TOKEN` is **not** automatically compatible with the signed `PRUNUS_LEADS_WEBHOOK_SECRET` integration: do not reuse or expose it without confirming the real portal API contract. Optional Prunus syncing still requires the authenticated URL and matching signing secret documented in `PRUNUS_BACKEND_HANDOFF.md`.

Do not claim real email delivery or Cloudflare production publication until the live endpoint has been tested.
