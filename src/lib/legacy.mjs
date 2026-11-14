// Phase-one exact visual preservation: compile exported HTML as an Astro static route.
// The original export is retained as the comparison source. The extra Astro pages
// are written natively; see design.md for the phase-two component extraction plan.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { artwork, describeImage } from '../data/artwork.mjs';
import { renderSiteHeader } from '../data/site-nav.mjs';
import { artworkThumb } from './image-paths.mjs';

const ROOT = 'https://www.michalrebekahart.com';
const known = {
  '/': { title: 'Watercolour & Oil Artist in Cirencester | Michal Rebekah Art' },
  '/our-story/': { title: 'Meet Michal Rebekah | Cotswolds Watercolour Artist' },
  '/journal/': { title: 'Artist Journal | Paintings & Studio Notes | Michal Rebekah',
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
const contactForm = `<form id="rebekah-contact-form" class="art-native-form mra-contact-form" action="/api/contact" method="post">
  <div class="mra-contact-intro">
    <p class="mra-contact-eyebrow">A note from the studio</p>
    <h3>Tell me a little about your idea.</h3>
    <p>Perhaps you've seen a painting you love, or there's a memory you'd like to keep in a more personal way. You don't need to have it all worked out before getting in touch.</p>
    <p>I'd love to hear what you have in mind.</p>
    <div class="mra-contact-other">
      <span>Prefer to write directly?</span>
      <a href="mailto:michalrebekahart@gmail.com">michalrebekahart@gmail.com</a>
      <a href="https://wa.me/447586768679">Or send me a WhatsApp message</a>
    </div>
  </div>
  <div class="mra-contact-fields">
    <p class="mra-contact-form-heading">Your enquiry</p>
    <div class="mra-contact-pair">
      <div class="art-native-field">
        <label class="art-native-label" for="art-name">Your name <span aria-hidden="true">*</span></label>
        <input class="art-native-input" id="art-name" name="name" autocomplete="name" maxlength="120" placeholder="Your name" required>
      </div>
      <div class="art-native-field">
        <label class="art-native-label" for="art-email">Email address <span aria-hidden="true">*</span></label>
        <input class="art-native-input" id="art-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required>
      </div>
    </div>
    <div class="art-native-field">
      <label class="art-native-label" for="art-category">What can I help you with?</label>
      <select class="art-native-input mra-contact-select" id="art-category" name="category">
        <option value="general">Just a question</option>
        <option value="original_artwork">A painting I've seen</option>
        <option value="personalised_painting">A personalised painting</option>
        <option value="childrens_book">A children's book illustration</option>
        <option value="business_artwork">Artwork for a business or shared space</option>
        <option value="other">Something else</option>
      </select>
    </div>
    <div class="art-native-field">
      <label class="art-native-label" for="art-message">Tell me a little more <span aria-hidden="true">*</span></label>
      <textarea class="art-native-input mra-contact-message" id="art-message" name="message" maxlength="5000" minlength="15" rows="7" placeholder="What are you thinking of? Is there a particular painting or memory behind your idea?" required></textarea>
    </div>
    <div class="art-honeypot" aria-hidden="true">
      <label for="art-website">Leave this field empty</label>
      <input id="art-website" name="website" tabindex="-1" autocomplete="off">
    </div>
    <div class="mra-contact-actions">
      <button type="submit" class="art-native-submit"><span>Send my enquiry</span></button>
      <p class="art-form-small">Your details are used only to reply to your enquiry. <a href="/privacy-policy/">Privacy policy</a></p>
    </div>
    <p class="art-form-status" id="art-form-status" role="status" aria-live="polite"></p>
  </div>
</form>
<script>
  (function () {
    const form=document.getElementById('rebekah-contact-form');
    const status=document.getElementById('art-form-status');
    if(!form||!status)return;
    const button=form.querySelector('button[type="submit"]');
    const buttonLabel=button.querySelector('span');
    const originalLabel=buttonLabel.textContent;
    form.addEventListener('submit',async function(e) {
      e.preventDefault();
      if(button.disabled)return;
      button.disabled=true;
      button.classList.add('mra-sending');
      buttonLabel.textContent='Sending...';
      status.removeAttribute('data-sent');
      status.textContent='Sending your message...';
      try {
        const response=await fetch('/api/contact',{method:'POST',body:new FormData(form)});
        const result=await response.json();
        status.textContent=result.message||(response.ok?'Your message has been received.':'Please try again or email me directly.');
        if(response.ok&&result.ok){
          form.reset();
          status.setAttribute('data-sent','true');
        }else if(response.status===503){
          const data=new FormData(form);
          const subject='Artwork enquiry from '+data.get('name');
          const body='Name: '+data.get('name')+'\\nEmail: '+data.get('email')+'\\n\\n'+data.get('message');
          const link=document.createElement('a');
          link.href='mailto:michalrebekahart@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
          link.textContent='Open your email app with the message ready';
          status.appendChild(document.createTextNode(' '));
          status.appendChild(link);
        }
      }catch{
        status.textContent='The form could not connect. Please email me directly using the address shown here.';
      }finally{
        button.disabled=false;
        button.classList.remove('mra-sending');
        buttonLabel.textContent=originalLabel;
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
  // Remove WordPress metadata and RankMath structured data that belong to the
  // old domain. Astro provides one consistent canonical/OG/schema set instead.
  html = html.replace(/<script\b[^>]*class="rank-math-schema"[^>]*>[\s\S]*?<\/script>/gi,'');
  html = html.replace(/<meta\s+property="og:(?:title|description|url|site_name)"[^>]*>/gi,'');
  html = html.replace(/<meta\s+name="twitter:(?:title|description|card)"[^>]*>/gi,'');
  html = html.replace(/<meta\s+name="generator"[^>]*>/gi,'');
  html = html.replace(/<link\s+rel="alternate"[^>]*oembed[^>]*>/gi,'');
  // The new header and painting viewer no longer depend on WordPress's bulky
  // Awesome Menu or LightGallery presentation sheets.
  html = html.replace(/<link\s+rel="stylesheet"[^>]*href="[^"]*(?:awesome-menu\.css|lightgallery-bundle\.min\.css)[^"]*"[^>]*>/gi,'');
  html = html.replace(/<script\b[^>]*src="[^"]*(?:awesome-menu|lightgallery)[^"]*"[^>]*>\s*<\/script>/gi,'');
  // Preserve the site's exact font families but request only weights in use.
  const fontLink = '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&amp;family=Playfair+Display:wght@400;500;600&amp;family=Lato:wght@400;700&amp;display=swap">';
  html = html.replace(/<link\s+rel="stylesheet"\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"\s*>/i,fontLink);
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
  if (route === '/') {
    // CSS background photos are discovered late. The two high-priority preload
    // tags let the browser choose a small mobile or desktop asset immediately.
    const heroHead = '<link rel="preload" as="image" type="image/webp" '
      + 'href="/images/home-hero-mobile.webp" media="(max-width: 767px)" fetchpriority="high">'
      + '<link rel="preload" as="image" type="image/webp" '
      + 'href="/images/home-hero-desktop.webp" media="(min-width: 768px)" fetchpriority="high">'
      + '<style>.breakdance .bde-section-27-100{background-image:url(/images/home-hero-desktop.webp)!important}'
      + '@media(max-width:767px){.breakdance .bde-section-27-100{background-image:url(/images/home-hero-mobile.webp)!important}}</style>';
    html = html.replace('</head>',heroHead+'</head>');
  }

  html = html.replace('</head>', '<link rel="stylesheet" href="/art-experience.css"><script defer src="/art-experience.js"></script></head>');
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
    let result = /\balt\s*=/i.test(tag)
      ? tag.replace(/\balt=["'][^"']*["']/i, 'alt="' + escapeAttr(alt) + '"')
      : tag.replace(/\s*\/?\s*>$/, ' alt="' + escapeAttr(alt) + '">');
    if (/story-Logo/i.test(src)) {
      // The old markup told mobile browsers to fetch a 1500px+ logo for a 52px
      // header. Use the crisp 150px asset instead, without its giant srcset.
      result = result.replace(/\s+srcset=["'][^"']*["']/i,'')
        .replace(/\s+sizes=["'][^"']*["']/i,'');
    }
    if (route === '/' && src.includes('/2026/01/pexels-anete-lusina-')) {
      result = result.replace(/\bsrc=["'][^"']*["']/i,'src="/images/artist-at-easel.webp"')
        .replace(/\s+srcset=["'][^"']*["']/i,'')
        .replace(/\s+sizes=["'][^"']*["']/i,'');
      if (!/\bloading=/i.test(result)) result = result.replace(/>$/, ' loading="lazy" decoding="async">');
    } else if (route === '/' && artwork.some(item => src.split('/').pop().startsWith(item.id))) {
      result = result.replace(/\bsrc=["'][^"']*["']/i,'src="' + artworkThumb(src) + '"')
        .replace(/\s+srcset=["'][^"']*["']/i,'')
        .replace(/\s+sizes=["'][^"']*["']/i,'');
      if(!/\bdecoding=/i.test(result))result=result.replace(/>$/, ' decoding="async">');
    } else if (!/\bloading=/i.test(result) && !/story-Logo/i.test(src) && route !== '/') {
      result = result.replace(/>$/, ' loading="lazy" decoding="async">');
    }
    return result;
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
  if (route === '/') {
    // Preserve original painting image order and full-resolution links, then
    // give each card an understated visible label and caption.
    html = html.replace(/<a\b[^>]*class="[^"]*ee-gallery-item--image[^"]*"[^>]*>[\s\S]*?<\/a>/gi, full => {
      const src = full.match(/<img\b[^>]*\bsrc=["']([^"']+)/i)?.[1] || '';
      const art = artwork.find(item => src.split('/').pop().includes(item.id));
      if (!art) return full;
      const anchor = full.replace(/<a\b/, '<a data-mra-lightbox data-mra-title="' + escapeAttr(art.title) + '" data-mra-description="' + escapeAttr(art.caption) + '"');
      return '<article class="mra-painting-card mra-reveal">' + anchor
        + '<div class="mra-art-caption"><h3>' + escapeAttr(art.title)
        + '</h3><p>' + escapeAttr(art.caption) + '</p></div></article>';
    });
    html = html.replace(/\bee-gallery--caption-none\b/g,'ee-gallery--caption-none mra-curated-gallery');
  }
  if (!/<h1\b/i.test(html)) {
    html = html.replace(/(<body\b[^>]*>)/i, '$1<h1 class="sr-only-art">Michal Rebekah Art</h1>');
  }
  if (route === '/contact/') {
    // Keep the original composition, but replace the unfinished/generic
    // WordPress-era headings with Mikie's own quiet, first-person voice.
    html = html.replace(/(<h3 class="bde-heading-15-106 bde-heading">)[\s\S]*?(<\/h3>)/,
      '$1Whether it is an original painting, a personal commission or simply a question, you are very welcome to write to me.$2');
    html = html.replace(/(<h2 class="bde-heading-15-117 bde-heading">)[\s\S]*?(<\/h2>)/,
      '$1Send me a note$2');
    html = html.replace('</head>', '<link rel="stylesheet" href="/contact-form.css"></head>');
    // The exported Breakdance form sends to WP admin-ajax.php and cannot work on static Astro.
    html = html.replace(/<form id="contact-form118"[\s\S]*?<\/form>/i, contactForm);
  }
  html = html.replace('</footer>',
    '<div class="art-discover-footer"><a href="/artwork-and-commissions/">Explore original artwork &amp; commission ideas</a> &nbsp; | &nbsp; <a href="/artwork-guide/">Artwork descriptions</a></div></footer>');
  return html;
}
