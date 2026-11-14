# Redirect .co.uk and Cloudflare Pages URLs to the .com domain

Updated 14 November 2026.

**Requested destination:** `https://www.michalrebekahart.com/` (confirm this exact hostname before publishing any redirect).

**Do not activate yet:** the current repository and all 28 page canonical URLs use `https://www.michalrebekahart.co.uk/`. I have not confirmed the .com domain is registered, connected to the Cloudflare Pages project, serving the site, or presenting a valid HTTPS certificate. Redirecting first could lead every existing visitor to a broken destination. Do not remove the .co.uk domain after redirecting; it must keep valid DNS/TLS to receive requests.

## Step A: Make the .com host live on the existing Cloudflare Pages project

1. In the Cloudflare dashboard open **Workers & Pages** and choose the Michal Rebekah Art Pages project.
2. Select **Custom domains**, then **Set up a domain**. Add `www.michalrebekahart.com`.
3. Set up `michalrebekahart.com` as a Cloudflare zone with the supplied nameservers if it is not one already. Add the apex domain and, if desired, redirect that apex to the preferred www address.
4. Wait for the domain to show **Active** and verify HTTPS, homepage, artwork guide, contact page and a location page at the .com address.
5. If Cloudflare Pages is connected to this GitHub repository, its build settings should use **npm run build**, directory **dist**, production branch **main**.

Reference: https://developers.cloudflare.com/pages/configuration/custom-domains/

## Step B: Update the canonical site URL in GitHub, then deploy that commit

These are the actual files where the old domain currently occurs:
- `astro.config.mjs` (Astro `site`)
- `src/lib/legacy.mjs` (the ROOT constant and business markup)
- `src/layouts/DiscoveryLayout.astro` (site and structured data)
- `src/pages/sitemap.xml.ts`
- `src/pages/image-sitemap.xml.ts`
- `public/robots.txt`
- `functions/api/contact.js` (source URL and any hardcoded enquiry URL, only after backend validation)
- `functions/api/prunus-leads.js` (source URL in signed lead event)
- `tests/browser-qa.mjs` (expected canonicals)
- Any manually authored JSON-LD, Open Graph, internal absolute URLs and metadata.

Do a repository-wide find for `michalrebekahart.co.uk` and update the required public-facing site references. Do **not** blindly rewrite historic documents, customer email addresses, verified Resend sender domains or source-domain redirect rules. Use the new domain for the robots sitemap declaration, both sitemap files, page canonicals, structured data, social previews and internal absolute links. Verify output after build. Keep the existing page URL paths unchanged.

## Step C: Cloudflare Bulk Redirects, preserving full paths

Dashboard: **Rules > Bulk Redirects** (at the account level). Create a list `michal-art-to-com` and a Bulk Redirect Rule that uses it. Add each relevant source hostname with target `https://www.michalrebekahart.com`:

| Source | Target | Redirect code |
| --- | --- | --- |
| `https://michalrebekahart.co.uk` | `https://www.michalrebekahart.com` | 301 |
| `https://www.michalrebekahart.co.uk` | `https://www.michalrebekahart.com` | 301 |
| `https://<your-actual-project>.pages.dev` | `https://www.michalrebekahart.com` | 301 |

For **each** row enable **Subpath matching**, **Preserve path suffix** and **Preserve query string**. Source values must be the actual hostnames in Cloudflare, not the illustrative placeholder. This sends, for example, `/artist-in-cirencester/?utm_source=old` to the **same path and query** under the .com host. Include subdomains for the .pages.dev source only if you intentionally want to redirect branch/preview URLs too; otherwise keep previews accessible for testing. Ensure each redirect source DNS resolves through Cloudflare/proxied where needed. Never create a rule that redirects the destination back to itself.

Reference: https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/
Reference: https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/reference/parameters/

## Step D: Test, monitor and update Google

- Use a browser in private mode or `curl -I` on the old home and several deep URLs. Each should return HTTP **301** with the corresponding new .com URL in the `Location` header, not redirect multiple times or loop.
- Visit the destination .com URLs directly and verify HTTP 200, artwork images and form submission. Check that `/api/contact` is not accidentally redirected or blocked on the preferred host.
- Submit the new XML sitemap and image sitemap in Google Search Console, verify both domains as properties and use the [Change of Address tool](https://support.google.com/webmasters/answer/9370220) if the migration applies and the tool offers it.
- Retain the .co.uk and old domain redirects for at least a year, preferably indefinitely.
- Check impressions, indexed pages and search performance for both domains; expect rankings/traffic to fluctuate during a site move.

## Specific Cloudflare Pages warning

The `public/_redirects` file in the Astro project covers **path redirects served by this Pages deployment**, not account-wide cross-host redirects. It should retain `/home/`, `/news-blog/` and `/sitemap_index.xml` mappings; Cloudflare Bulk Redirects is the correct mechanism for the .co.uk / .pages.dev hostnames. If the original .co.uk zone sits outside Cloudflare, transfer its DNS or configure equivalent host redirects with the domain provider.

**Deployment status:** GitHub commits alone do not prove the Cloudflare project ran, and the Resend secrets and Prunus backend webhook must still be tested in the Cloudflare account.
