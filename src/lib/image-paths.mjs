// Stable URLs shared by the generated Astro pages and build-time Sharp pipeline.
// Original image files remain untouched, and full-resolution lightbox links still
// lead to the original works.
export function artworkThumb(src) {
  const m = String(src).match(/^\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([A-Za-z0-9_-]+)\.(?:jpg|jpeg|png)$/i);
  if (!m) return src;
  return '/images/artwork/' + m[1] + '-' + m[2] + '-' + m[3] + '.webp';
}
export function landingHero(slug) {
  return '/images/landing/' + String(slug).replace(/[^a-z0-9-]/g,'') + '.webp';
}
