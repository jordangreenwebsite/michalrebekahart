# Cloudflare domain redirects for Michal Rebekah Art

Prepared 14 November 2026. This is a set-up guide, **not a claim that any domain redirect has been created**.

## Before switching the primary domain

Current Astro canonical domain: `https://www.michalrebekahart.co.uk/`.

If you have purchased `michalrebekahart.com` and want it to be the permanent primary site, the safest sequence is:

1. In Cloudflare **Workers & Pages > [the exact Michal Rebekah Art project] > Custom domains**, add `michalrebekahart.com`. Verify DNS, HTTPS and that the real artwork website loads at `https://michalrebekahart.com/`.
2. Decide whether the new primary hostname is `michalrebekahart.com` or `www.michalrebekahart.com`. Use **one** consistent URL.
3. Before enabling redirects, update Astro canonical configuration in `astro.config.mjs`, `src/lib/legacy.mjs`, `src/layouts/DiscoveryLayout.astro`, both sitemap endpoints, `public/robots.txt` and any sitewide OG URLs and hard-coded internal references. Run CI and redeploy.
4. In the Cloudflare account dashboard, open **Bulk Redirects** and create a list, with a distinct source row per old hostname:

| Source URL (hostname) | Target URL | Code | Subpath matching | Preserve path suffix | Preserve query string |
| --- | --- | --- | --- | --- | --- |
| `michalrebekahart.co.uk` | `https://michalrebekahart.com` | 301 | Yes | Yes | Yes |
| `www.michalrebekahart.co.uk` | `https://michalrebekahart.com` | 301 | Yes | Yes | Yes |
| `<YOUR-EXACT-CLOUDFLARE-PAGES-PROJECT>.pages.dev` | `https://michalrebekahart.com` | 301 | Yes | Yes | Yes |

Choose **Include subdomains** only if you intentionally want every subdomain of that row redirected. It is usually unnecessary for the exact `www` and apex rows; do not redirect mail, app or other subdomains accidentally.

5. Create a **Bulk Redirect Rule** that enables that list; saving the list alone does not activate redirects.
6. Verify both the root and article paths in an incognito browser and with `curl -I`: `https://www.michalrebekahart.co.uk/`, `https://www.michalrebekahart.co.uk/artwork-guide/`, `https://<EXACT-PROJECT>.pages.dev/artwork-guide/`. These should redirect to the matching `.com` paths, not all to the homepage. Query parameters should survive where safe/appropriate.
7. Submit the **new** `.com` sitemap in Google Search Console, keep old domain verified, and use Google's Change of Address process where available. Track indexing during the move.

**Important:** the `.co.uk` and the source domain must be proxied through Cloudflare for its bulk redirects to apply. The `pages.dev` route is an account-level Cloudflare redirect and is not controlled by an Astro `public/_redirects` file.

## If you have not yet bought or configured the .com domain

Do **not** activate the rules. A permanent 301 to an unknown or unconfigured `.com` website would break visits and could damage indexation. Keep the current `.co.uk` canonical until the new site is reachable and verified.

## If keeping .co.uk as canonical

You can still redirect the exact `<project>.pages.dev` production hostname to `https://www.michalrebekahart.co.uk/`, using the identical bulk redirect options. Avoid wildcards that also redirect private branch preview domains unless that is intended.

## Official instructions

- https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/
- https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/create-dashboard/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/configuration/redirects/

Cloudflare Pages `_redirects` is for **paths within a Pages site**, not a general tool for domain-level redirects. Use zone/account redirect rules for entire domains.
