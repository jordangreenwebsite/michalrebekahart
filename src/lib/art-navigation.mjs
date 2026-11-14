// Shared navigation lists for the original and newly built Astro pages.
// Grouping preserves the original artist-led portfolio and keeps the main header calm.
import { areaPages, themePages } from '../data/discovery.mjs';

export const navigationGroups = [
  {
    title: 'Explore the work',
    links: [
      { label:'All artwork & commissions', href:'/artwork-and-commissions/' },
      { label:'Browse the paintings', href:'/artwork-guide/' },
      { label:'Commission a painting', href:'/commissions/' },
      { label:'Artwork for shared spaces', href:'/art-for-businesses/' }
    ]
  },
  {
    title: 'Paintings & ideas',
    links: themePages.map(page => ({
      label:page.title.split('|')[0].trim(), href:'/'+page.slug+'/'
    }))
  },
  {
    title:'Around the Cotswolds',
    links: areaPages.map(page => ({
      label:'Art for '+page.place, href:'/'+page.slug+'/'
    }))
  },
  {
    title:'About the artist',
    links:[
      {label:'My story',href:'/our-story/'},
      {label:'Journal',href:'/journal/'},
      {label:'Contact',href:'/contact/'},
      {label:'Privacy',href:'/privacy-policy/'}
    ]
  }
];

export const safeAttr = input => String(input)
  .replaceAll('&','&amp;')
  .replaceAll('"','&quot;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;');

export function legacyExploreNav(){
  const sections = navigationGroups.map(group =>
    '<section class="art-nav-group" aria-label="'+safeAttr(group.title)+'">'
    + '<strong class="art-nav-heading">'+safeAttr(group.title)+'</strong>'
    + group.links.map(link => '<a href="'+safeAttr(link.href)+'">'+safeAttr(link.label)+'</a>').join('')
    + '</section>'
  ).join('');
  return '<li class="breakdance-menu-item art-explore-item">'
    + '<details class="art-explore-details">'
    + '<summary class="art-explore-summary">Explore art</summary>'
    + '<div class="art-explore-panel">'+sections+'</div>'
    + '</details></li>';
}
