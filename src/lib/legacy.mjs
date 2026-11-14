// Phase-one exact visual preservation: compile exported HTML as an Astro static route.
// The original export is retained as the comparison source. The extra Astro pages
// are written natively; see design.md for the phase-two component extraction plan.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { artwork, describeImage } from '../data/artwork.mjs';
import { renderSiteHeader } from '../data/site-nav.mjs';

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
const contactForm = `<form id="rebekah-contact-form" class="art-native-form" action="/api/contact" method="post">
  <div class="art-native-field">
    <label class="art-native-label" for="art-name">Your name *</label>
    <input class="art-native-input" id="art-name" name="name" autocomplete="name" maxlength="120" required>
  </div>
  <div class="art-native-field">
    <label class="art-native-label" for="art-email">Your email *</label>
    <input class="art-native-input" id="art-email" name="email" type="email" autocomplete="email" maxlength="254" required>
  </div>
  <div class="art-native-field">
    <label class="art-native-label" for="art-category">What are you enquiring about?</label>
    <select class="art-native-input" id="art-category" name="category">
      <option value="general">A general enquiry</option>
      <option value="original_artwork">An original painting</option>
      <option value="personalised_painting">A personalised painting</option>
      <option value="childrens_book">Children's book illustration</option>
      <option value="business_artwork">Artwork for a business or shared space</option>
      <option value="other">Something else</option>
    </select>
  </div>
  <div class="art-native-field">
    <label class="art-native-label" for="art-message">Tell me a little about your idea *</label>
    <textarea class="art-native-input" id="art-message" name="message" maxlength="5000" minlength="15" rows="6" required></textarea>
  </div>
  <div class="art-honeypot" aria-hidden="true">
    <label for="art-website">Leave this field empty</label>
    <input id="art-website" name="website" tabindex="-1" autocomplete="off">
  </div>
  <button type="submit" class="art-native-submit">Send message</button>
  <p class="art-form-status" id="art-form-status" role="status" aria-live="polite"></p>
  <p class="art-form-small">Your name, email and message are used to reply to your enquiry. See our <a href="/privacy-policy/">privacy policy</a>.</p>
</form>
<script>
  (function () {
    const form=document.getElementById('rebekah-contact-form');
    const status=document.getElementById('art-form-status');
    if(!form||!status)return;
    form.addEventListener('submit',async function(e) {
      e.preventDefault();
      const button=form.querySelector('button[type="submit"]');
      button.disabled=true;
      status.textContent='Sending your message...';
      try {
        const response=await fetch('/api/contact',{method:'POST',body:new FormData(form)});
        const result=await response.json();
        status.textContent=result.message||(response.ok?'Message received.':'Please try again or use the email link below.');
        if(response.ok&&result.ok){form.reset();status.setAttribute('data-sent','true');}
        else {
          status.removeAttribute('data-sent');
          if(response.status===503) {
            const data=new FormData(form);
            const subject='Artwork enquiry from ' + data.get('name');
            const body='Name: ' + data.get('name') + '\\nEmail: ' + data.get('email') +
              '\\n\\n' + data.get('message');
            const link=document.createElement('a');
            link.href='mailto:michalrebekahart@gmail.com?subject='
              + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            link.textContent='Open your email app with your message ready';
            link.style.display='block';
            link.style.marginTop='12px';
            status.appendChild(link);
          }
        }
      } catch {
        status.textContent='The form could not connect. Please use the email or WhatsApp link below.';
      } finally {
        button.disabled=false;
      }
    });
  })();
</script>`;

const extraCSS = `<style>
.art-discover-footer{background:#F7F5F3;text-align:center;padding:14px 16px;font:14px Inter,sans-serif}
.art-discover-footer a{color:#436c6b;text-decoration:underline;text-underline-offset:4px}

.art-native-form{display:grid;gap:20px;font:15px Inter,sans-serif}
.art-native-field{display:flex;flex-direction:column;gap:8px;min-width:0}
.art-native-label{color:#2B2B2B;font-weight:500}
.art-native-input{display:block;width:100%;border:0;border-bottom:1px solid #a3b7b4;background:transparent;padding:12px 4px 13px;color:#2B2B2B;font:inherit;border-radius:0}
.art-native-input:focus{outline:2px solid #7B9B9A;outline-offset:3px}
.art-native-submit{cursor:pointer;width:fit-content;border:0;background:#7B9B9A;color:white;padding:14px 30px;font:600 15px Inter,sans-serif}
.art-native-submit:hover{background:#547976}.art-native-submit:disabled{opacity:.65;cursor:wait}
.art-honeypot{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}.art-form-status{font-weight:600;min-height:1.5em}.art-form-status[data-sent=true]{color:#2f6a55}.art-form-small{font-size:13px;line-height:1.6}.art-description-link{text-align:center;margin:8px auto 20px;font:14px Inter,sans-serif}.art-description-link a{color:#406b69;text-decoration:underline;text-underline-offset:4px}
@media (max-width:479px){.breakdance .bde-section-27-100 .bde-heading-27-216{width:min(330px,calc(100vw - 36px));max-width:100%;overflow-wrap:normal}}
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
  html = html.replace('</head>', '<link rel="stylesheet" href="/site-nav.css"><script defer src="/site-nav.js"></script></head>');
  html = html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/i, renderSiteHeader(route));
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
      '<p>When you submit an enquiry, the information you provide (your name, email address, enquiry type and message) is sent securely through the website and delivered to us by Resend. Where our Prunus Media lead-management integration is enabled, the same enquiry is also recorded securely in our internal business system so that we can respond and manage the enquiry. We use this information for the enquiry and any related correspondence, not unrelated marketing.</p><p>You can also contact us by email or WhatsApp using the details on the contact page.</p><hr>'
    );
  }
  // A valid alt attribute is required on every image, with empty alt reserved for decoration.
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\bsrc=["']([^"']+)/i)?.[1] || '';
    const checked = describeImage(src);
    const alt = checked || (/\balt\s*=/i.test(tag)
      ? tag.match(/\balt=["']([^"']*)/i)?.[1] || ''
      : imageFallback(src, route));
    return /\balt\s*=/i.test(tag)
      ? tag.replace(/\balt=["'][^"']*["']/i, 'alt="' + escapeAttr(alt) + '"')
      : tag.replace(/\s*\/?\s*>$/, ' alt="' + escapeAttr(alt) + '">');
  });
  // Give the original gallery lightbox readable captions without changing photo order.
  if (route === '/') {
    html = html.replace(/<a\b[^>]*\bee-gallery-item--image[^>]*>/g, tag => {
      const href = tag.match(/\bhref=["']([^"']+)/i)?.[1] || '';
      const item = artwork.find(x => href.split('/').pop().startsWith(x.id));
      if (!item) return tag;
      return tag.replace(/data-sub-html="[^"]*"/,
        'data-sub-html="' + escapeAttr('<p>' + item.caption + '</p>') + '"')
        .replace(/>$/, ' aria-label="Open painting: ' + escapeAttr(item.alt) + '">');
    });
    html = html.replace(/(<h2\b[^>]*>\s*Family\s*<\/h2>)/i,
      '$1<p class="art-description-link"><a href="/artwork-guide/">Browse the paintings with descriptions</a></p>');
  }
  if (!/<h1\b/i.test(html)) {
    html = html.replace(/(<body\b[^>]*>)/i, '$1<h1 class="sr-only-art">Michal Rebekah Art</h1>');
  }
  if (route === '/contact/') {
    // The exported Breakdance form sends to WP admin-ajax.php and cannot work on static Astro.
    html = html.replace(/<form id="contact-form118"[\s\S]*?<\/form>/i, contactForm);
  }
  html = html.replace('</footer>',
    '<div class="art-discover-footer"><a href="/artwork-and-commissions/">Explore original artwork &amp; commission ideas</a> &nbsp; | &nbsp; <a href="/artwork-guide/">Artwork descriptions</a></div></footer>');
  return html;
}
