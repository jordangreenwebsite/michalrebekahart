// Shared accessible site navigation for the preserved pages and all native Astro pages.
import { areaPages, themePages } from './discovery.mjs';
const names = {
 'original-watercolour-paintings':'Watercolour paintings',
 'original-oil-paintings':'Oil paintings',
 'family-painting-commissions':'Family painting commissions',
 'couple-paintings':'Couples',
 'childhood-memory-paintings':'Childhood memories',
 'pet-painting-commissions':'Pets',
 'personalised-childrens-books':'Children’s books',
 'friendship-paintings':'Friendship & serenity',
 'artwork-inspired-by-places':'Places',
 'personalised-art-gifts':'Personalised art gifts',
 'how-to-commission-a-painting':'How to commission a painting'
};
const artLinks = [
 {href:'/artwork-and-commissions/',label:'All artwork & commissions'},
 {href:'/artwork-guide/',label:'Paintings with descriptions'},
 {href:'/commissions/',label:'Commission information'},
 ...themePages.map(page=>({href:'/'+page.slug+'/',label:names[page.slug]||page.eyebrow})),
 {href:'/art-for-businesses/',label:'Artwork for businesses'}
];
const areaLinks = areaPages.map(page=>({href:'/'+page.slug+'/',label:page.place}));
const topLinks = [
 {href:'/',label:'Home'},
 {href:'/our-story/',label:'My story'},
 {href:'/journal/',label:'Journal'},
 {href:'/contact/',label:'Contact'}
];
const escapeHtml = value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const link = (item,path,cls='mra-sub-link')=>
 '<a class="'+cls+'" href="'+item.href+'"'+(path===item.href?' aria-current="page"':'')+'>'+escapeHtml(item.label)+'</a>';
const group = (label,kind,items,path)=>
 '<details class="mra-menu-group" data-kind="'+kind+'"><summary>'+escapeHtml(label)+'<span class="mra-chevron" aria-hidden="true"></span></summary><div class="mra-submenu">'+items.map(item=>link(item,path)).join('')+'</div></details>';
export function renderSiteHeader(path='/') {
 const brand='<a class="mra-brand" href="/" aria-label="Michal Rebekah Art, home"><img src="/wp-content/uploads/2026/01/story-Logo-150x150.png" alt="" width="52" height="52"><span>Michal Rebekah Art</span></a>';
 const art=group('Artwork','artwork',artLinks,path);
 const areas=group('Areas','areas',areaLinks,path);
 return [
  '<header class="mra-site-header" data-mra-header><div class="mra-header-inner">',
  brand,
  '<nav class="mra-desktop-nav" aria-label="Main navigation">',
  link(topLinks[0],path,'mra-top-link'),
  link(topLinks[1],path,'mra-top-link'),
  art,areas,
  link(topLinks[2],path,'mra-top-link'),
  link(topLinks[3],path,'mra-top-link'),
  '</nav><div class="mra-header-actions">',
  '<a class="mra-enquire" href="/contact/">Enquire</a>',
  '<details class="mra-mobile-menu"><summary aria-label="Open menu"><span class="mra-menu-lines" aria-hidden="true"><i></i><i></i><i></i></span><span>Menu</span></summary>',
  '<nav class="mra-mobile-panel" aria-label="Mobile navigation">',
  topLinks.map(item=>link(item,path,'mra-top-link')).join(''),
  group('Artwork','artwork',artLinks,path),
  group('Areas','areas',areaLinks,path),
  '<a class="mra-mobile-enquire" href="/contact/">Enquire about a painting</a>',
  '</nav></details></div></div></header>'
 ].join('');
}
export const navigationDestinations = ['/',...topLinks.map(x=>x.href),...artLinks.map(x=>x.href),...areaLinks.map(x=>x.href)];
