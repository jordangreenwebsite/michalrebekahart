# Michal Rebekah Art — design.md

> Design capture and faithful Astro migration specification. Captured 14 November 2026.
> **Original design:** https://www.michalrebekahart.co.uk/
> **Project:** https://github.com/jordangreenwebsite/michalrebekahart
> **Source:** the existing WordPress / Breakdance static export in this repository. This is the visual source of truth; do not replace it with a generic studio template.

## Creative character

Quiet, personal, nostalgic and painterly. The site is a portfolio for **Michal (Mikie) Rebekah**, not a sales funnel. The main imagery and authentic story carry the design. The work concerns family, couples, childhood, places, friendship and serenity. Original art is created in watercolour and oils, with limited personalised painting commissions and developing children's-book illustrations. No loud badges, emojis, artificial urgency, bright SaaS gradients, numbering of sections, fabricated customer praise, or false claims that every artwork is for sale.

## Exact existing visual tokens

| Token | Source value | Use |
| --- | --- | --- |
| Body background | `#F7F5F3` | Warm paper-like page canvas |
| Main text / headings | `#2B2B2B` | Quiet, legible charcoal |
| Muted accent | `#7B9B9A` | Buttons, muted surfaces and links |
| Display face | `Playfair Display` | Elegant editorial H1/H2 |
| Body face | `Inter` | Simple, unobtrusive body and UI |
| Secondary font available | `Lato` | Used in existing font setup; preserve where present |
| Base font size | `16px` | Body text |
| Type scale | `1.25` ratio | Existing heading hierarchy |

The export contains authoritative Breakdance CSS, especially `wp-content/uploads/breakdance/css/global-settings.css`, `post-27.css`, `post-19.css`, and the page-specific CSS files. These define exact spacings, section layouts, gallery behaviour, menu motion, buttons and responsive breakpoints. Do not eyeball replacements when source styles exist.

## Existing page / visual inventory

- **/**: full-screen artistic introduction, 'Michal Rebekah Art', 'Watercolour Artist in the Cotswolds', introductory painting/story, masonry/gallery-like collections 'Family', 'Couples', 'Childhood', 'Places', 'Friendship & Serenity'. Multiple genuine original artworks from 2026 March / April uploads.
- **/our-story/**: 'My Story'. Personal story of growing up on a farm in **Newent, Gloucestershire**, discovering art, family memories, travel and children's-book illustration. Preserve the actual photographs and first-person storytelling.
- **/journal/**: 'A Day in Cirencester' and 'A Day in the Studio', paintings displayed at **Coffee at Odd Socks** and work begun on `Pip and the Big Wide World`; preserve as journal entries, not fake commercial case studies.
- **/commissions/**: limited custom paintings and personalised children's storybooks. Preserve the limited-availability and personal tone. Correct spelling in human-visible copy when convenient, without changing composition or offerings.
- **/contact/**: enquiry form and contact details, original text and layout. Canonical email: `michalrebekahart@gmail.com`; published WhatsApp/phone: `07586 768679`; official Instagram: https://www.instagram.com/michalrebekahart/.
- **/privacy-policy/**: legal page with existing substantive terms; preserve. Update form handling description if processing changes.

## Navigation / footer

Original visible navigation: Home, My story, Journal, contact, Commissions & Children's Books, Enquire. Header uses a square illustrated logo at `/wp-content/uploads/2026/01/story-Logo-150x150.png`. Mobile uses a collapse/off-canvas menu. Footer includes art-line contact CTA, Home/My Story/Contact, privacy, WhatsApp and Prunus Media credit. Keep these patterns; add a **small, understated** 'Explore' or 'Artwork & Commissions' link to introduce SEO content without filling the primary navigation with 20 keyword links.

## Photography and artwork preservation

All art assets already appear in the repository's `wp-content/uploads/` tree. Original export references images such as:
- `/wp-content/uploads/2026/03/IMG_6425-768x1024.jpeg`
- `/wp-content/uploads/2026/03/IMG_6437-scaled-e1774258439484-768x1024.jpeg`
- `/wp-content/uploads/2026/04/IMG_7363-768x1024.jpg`
- `/wp-content/uploads/2026/04/IMG_6881-768x1024.jpeg`
- `/wp-content/uploads/2026/04/IMG_6901-768x1024.jpeg`
- `/wp-content/uploads/2026/04/IMG_2592-482x1024.jpg`
- `/wp-content/uploads/2026/01/story-Logo.png`

Retain original artwork, orientation, crop, sequence and gallery interactivity. Do not replace it with stock/AI art. Do not describe or name the subject of a particular work unless visually checked. Local images should have useful, factual alt text; decorative assets should be `alt=""`.

## Layout fidelity / Astro strategy

Phase 1 is a **safe visual-preservation migration**: render the existing exported HTML through Astro static routes, retain local Breakdance CSS and assets during the move, and fix SEO and broken backend integrations. New discovery/service pages are genuinely native Astro. Phase 2, following screenshot comparison, should refactor the legacy markup into discrete reusable Astro components *without visual drift*. The presence of old classes in phase 1 is intentional preservation, not a claim that Breakdance was fully eliminated.

Target mobile/desktop match: hero cropping, logo size, header transparency and sticky motion, section spacing, font metrics, image arrangement, gallery lightboxes, original CTA proportions, footer. Validate widths 375, 768 and 1440px before publishing and confirm the enquiries really deliver.

## SEO without diluting identity

Baseline audit, 14 Nov 2026: overall **83**, SEO **77**, accessibility **70**, PageSpeed **94**, LCP **1.71 s**, CLS **0**. Issues: 1/7 page missing H1, 3/7 missing meta description, 82/99 images missing `alt` attribute, no valid `robots.txt`, 1/7 incomplete OG/Twitter. Maintain canonical `https://www.michalrebekahart.co.uk/` (www version), clean internal links and 301 redirects if paths change. Publish accurate `Person`, `Organization` and `Service` structured data with known social profile and phone; avoid invented postal addresses, open hours, gallery visits, prices or testimonials.

Build **intent-led** landing pages about watercolour, oil, meaningful family paintings, couples, childhood, pet commissions and personalised children's books, plus **substantive and distinct** area pages for Cirencester, Swindon, Cheltenham, Bath, Gloucester and genuine surrounding areas. Say 'based in Cirencester' only for Cirencester; other towns are places from which people can enquire, not claimed business locations. Avoid near-identical location page patterns. For internal links, prioritise user tasks and regional relevance, not keyword repetition. Assess search impressions/enquiries before expanding further.

## Conversion / measurement

Contact should work without WordPress AJAX. Verify actual email delivery (or configure first-party server-side form action with consent and spam protection). Keep WhatsApp and mailto as reliable options. Install Search Console and sitemap submission; track page impressions, indexed URLs, commission enquiries and gallery/Instagram referrals. No fabricated guarantees about traffic.

## Preserve / do not change

- Artist identity, delicate writing voice, original images, gallery sequence and actual life story.
- Existing URL paths, canonical www host and authentic contact details.
- Do not add false location-specific studios, services, stock levels or opening hours.
- No emojis, visual numbering, noisy decorative icon sets or artificial commercial headings.
