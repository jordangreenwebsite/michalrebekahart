// Phase-one exact visual preservation: compile exported HTML as an Astro static route.
// The original export is retained as the comparison source. The extra Astro pages
// are written natively; see design.md for the phase-two component extraction plan.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'https://www.michalrebekahart.co.uk';
const known = {
  '/': { title: 'Watercolour & Oil Artist in Cirencester | Michal Rebekah Art' },
  '/our-story/': { title: 'Meet Michal Rebekah | Watercolour & Oil Artist in the Cotswolds' },
  '/journal/': { title: 'Artist Journal | Paintings, Places & Stories | Michal Rebekah Art',
    desc: 'Notes from Mikie’s studio in the Cotswolds: original artwork, paintings displayed in Cirencester and the stories behind her watercolours and children’s book illustrations.' },
  '/commissions/': { title: 'Personalised Watercolour & Oil Art Commissions | Michal Rebekah Art' },
  '/contact/': { title: 'Contact Michal Rebekah Art | Painting & Book Enquiries' },
  '/privacy-policy/': { title: 'Privacy Policy | Michal Rebekah Art',
    desc: 'How Michal Rebekah Art handles contact enquiries, your information and website privacy.' }
};
const escapeAttr = s => String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const imageFallback = (src, route) => {
  if (/story-logo/i.test(src)) return 'Michal Rebekah Art illustrated logo';
  if (route === '/our-story/') return 'Photograph from Michal Rebekah’s personal artist story';
  if (route === '/journal/') return 'Photograph from the Michal Rebekah Art studio journal';
  if (route === '/commissions/') return 'Example from Michal Rebekah’s artwork and illustration portfolio';
  if (route === '/') return 'Original work from Michal Rebekah’s watercolour and oil painting collection';
  return ''; // Meaningless/decorative imagery: intentionally empty alt.
};
function meta(name, content, property = false) {
  return '<meta ' + (property ? 'property' : 'name') + '="' + name + '" content="' + escapeAttr(content) + '">';
}
const contactForm = `<form id="rebekah-mail-form" class="rebekah-mail-form">
  <p>Tell me a little about the painting, book or idea you have in mind.</p>
  <label for="art-contact-name">Your name</label>
  <input id="art-contact-name" name="name" required autocomplete="name">
  <label for="art-contact-email">Your email</label>
  <input id="art-contact-email" type="email" name="email" required autocomplete="email">
  <label for="art-contact-idea">What would you like to ask?</label>
  <textarea id="art-contact-idea" name="message" rows="5" required></textarea>
  <button type="submit">Prepare my enquiry</button>
  <p class="rebekah-note">This opens your email app with your message ready. Nothing is sent until you press Send there. You can also use the email or WhatsApp links below.</p>
</form>
<script>
  document.getElementById('rebekah-mail-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = 'Name: ' + d.get('name') + '\\nEmail: ' + d.get('email') + '\\n\\n' + d.get('message');
    location.href = 'mailto:michalrebekahart@gmail.com?subject='
      + encodeURIComponent('Artwork enquiry from ' + d.get('name')) + '&body=' + encodeURIComponent(body);
  });
</script>`;
const extraCSS = `<style>
.art-discover-footer{background:#F7F5F3;text-align:center;padding:14px 16px;font:14px Inter,sans-serif}
.art-discover-footer a{color:#436c6b;text-decoration:underline;text-underline-offset:4px}
.rebekah-mail-form{display:grid;gap:12px;font:16px Inter,sans-serif}
.rebekah-mail-form label{font-weight:600}
.rebekah-mail-form input,.rebekah-mail-form textarea{width:100%;padding:13px;border:1px solid #a7b9b8;border-radius:4px;background:#fff;font:inherit}
.rebekah-mail-form button{border:0;padding:15px 18px;background:#7B9B9A;color:#fff;cursor:pointer;font:600 16px Inter,sans-serif}
.rebekah-mail-form .rebekah-note{font-size:13px;line-height:1.6}
.sr-only-art{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style>`;
export function legacyHtml(route) {
  const config = known[route];
  if (!config) throw new Error('Unknown legacy route: ' + route);
  const file = route === '/' ? 'index.html' : join(route.slice(1), 'index.html');
  let html = readFileSync(join(process.cwd(), file), 'utf8');
  const canonical = ROOT + route;
  html = html.replace(/<html lang="en-US"/, '<html lang="en-GB"');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeAttr(config.title) + '</title>');
  html = html.replace(/<link rel="canonical"[^>]*>/i, '<link rel="canonical" href="' + canonical + '">');
  html = html.replace(/href="\/home\/?"/g, 'href="/"').replace(/href="\/news-blog\/?"/g, 'href="/journal/"');
  if (config.desc) {
    const tag = meta('description', config.desc);
    html = /<meta name="description"/i.test(html)
      ? html.replace(/<meta name="description"[^>]*>/i, tag)
      : html.replace('</head>', tag + '</head>');
  }
  const title = config.title;
  const description = config.desc || html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || 'Original watercolour and oil artwork from the Cotswolds.';
  const headExtras = [
    meta('og:title', title, true), meta('og:description', description, true),
    meta('og:url', canonical, true),
    meta('twitter:card', 'summary_large_image'),
    meta('twitter:title', title), meta('twitter:description', description),
    extraCSS
  ].join('\n');
  html = html.replace('</head>', headExtras + '</head>');
  const studioSchema = {
    '@context':'https://schema.org', '@type':'ProfessionalService',
    '@id':ROOT + '/#studio', name:'Michal Rebekah Art', url:ROOT + '/',
    telephone:'+447586768679', email:'michalrebekahart@gmail.com',
    sameAs:['https://www.instagram.com/michalrebekahart/'],
    areaServed:['Cirencester','Cotswolds','Gloucestershire','Swindon','Cheltenham','Bath'],
    founder:{'@type':'Person',name:'Michal Rebekah',url:ROOT + '/our-story/'},
    description:'Original watercolour and oil artwork, with occasional personalised commissions.'
  };
  html = html.replace('</head>', '<script type="application/ld+json">' + JSON.stringify(studioSchema) + '</script></head>');
  if (route === '/commissions/') {
    html = html.replaceAll('Personliased', 'Personalised')
      .replaceAll('personlised', 'personalised')
      .replaceAll('Commisions', 'Commissions');
  }
  if (route === '/journal/') html = html.replaceAll('peice', 'piece');
  if (route === '/privacy-policy/') {
    html = html.replace(
      /<p data-start="1069"[\s\S]*?<hr data-start="1414"[^>]*>/,
      '<p>The enquiry form on this static website prepares an email in your own email application. The site does not send the message or store its contents when you prepare it. If you choose to send the email, your email provider and ours will process it so we can reply.</p><p>You can also contact us through the published WhatsApp link.</p><hr>'
    );
  }
  // A valid alt attribute is required on every image, with empty alt reserved for decoration.
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\balt\s*=/i.test(tag)) return tag;
    const src = tag.match(/\bsrc=["']([^"']+)/i)?.[1] || '';
    return tag.replace(/\s*\/?\s*>$/, ' alt="' + escapeAttr(imageFallback(src,route)) + '">');
  });
  if (!/<h1\b/i.test(html)) {
    html = html.replace(/(<body\b[^>]*>)/i, '$1<h1 class="sr-only-art">Michal Rebekah Art</h1>');
  }
  if (route === '/contact/') {
    // The exported Breakdance form sends to WP admin-ajax.php and cannot work on static Astro.
    html = html.replace(/<form id="contact-form118"[\s\S]*?<\/form>/i, contactForm);
  }
  html = html.replace('</footer>',
    '<div class="art-discover-footer"><a href="/artwork-and-commissions/">Explore original artwork &amp; commission ideas</a></div></footer>');
  return html;
}
