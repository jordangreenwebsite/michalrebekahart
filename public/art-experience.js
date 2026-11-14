// Image experience shared by the homepage and the artwork guide.
// No tracking, no animation library, no unverified artwork titles.
(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = [
    ...document.querySelectorAll('.mra-reveal, .artwork-card, .art-hero, .art-hub-collections, .art-copy, .art-related')
  ];
  if (!reducedMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('mra-motion');
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('mra-visible');
        observer.unobserve(entry.target);
      });
    }, {rootMargin:'0px 0px 40px 0px',threshold:0.08});
    revealTargets.forEach(function(el,i) {
      // Do not hide the above-the-fold artwork or headline while JS and fonts
      // initialise. These are possible LCP candidates on slower phones.
      if (el.getBoundingClientRect().top < window.innerHeight * .92) return;
      el.classList.add('mra-reveal');
      el.style.setProperty('--mra-delay',String(Math.min(i%3,2)*85)+'ms');
      observer.observe(el);
    });
    // Keep entrance effects on content scrolled into view, not the critical
    // homepage hero. LCP should not wait for a 1-second fade animation.
  }

  const links=[...document.querySelectorAll('a[data-mra-lightbox]')];
  if (!links.length || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;

  const dialog=document.createElement('dialog');
  dialog.className='mra-lightbox';
  dialog.setAttribute('aria-label','Artwork viewer');
  dialog.innerHTML=[
    '<div class="mra-lightbox-inner">',
    '<div class="mra-lightbox-toolbar">',
    '<span class="mra-lightbox-eyebrow">Michal Rebekah Art</span>',
    '<button type="button" class="mra-lightbox-close" aria-label="Close enlarged painting">Close</button>',
    '</div>',
    '<div class="mra-lightbox-picture"><img alt=""></div>',
    '<div class="mra-lightbox-info"><div>',
    '<h2 class="mra-lightbox-title"></h2>',
    '<p class="mra-lightbox-description"></p>',
    '</div><span class="mra-lightbox-count" aria-live="polite"></span></div>',
    '<div class="mra-lightbox-nav">',
    '<button type="button" class="mra-lightbox-prev" aria-label="Previous painting">Previous</button>',
    '<button type="button" class="mra-lightbox-next" aria-label="Next painting">Next</button>',
    '</div>',
    '</div>'
  ].join('');
  document.body.appendChild(dialog);
  const photo=dialog.querySelector('.mra-lightbox-picture img');
  const heading=dialog.querySelector('.mra-lightbox-title');
  const description=dialog.querySelector('.mra-lightbox-description');
  const counter=dialog.querySelector('.mra-lightbox-count');
  const previous=dialog.querySelector('.mra-lightbox-prev');
  const next=dialog.querySelector('.mra-lightbox-next');
  const close=dialog.querySelector('.mra-lightbox-close');
  let index=-1,returnTo=null;
  function show(indexToShow) {
    index=Math.min(Math.max(indexToShow,0),links.length-1);
    const link=links[index];
    const source=link.getAttribute('href');
    const title=link.getAttribute('data-mra-title') || 'Painting from the collection';
    const note=link.getAttribute('data-mra-description') || '';
    photo.src=source;
    photo.alt=link.querySelector('img')?.getAttribute('alt') || title;
    heading.textContent=title;
    description.textContent=note;
    counter.textContent=(index+1)+' of '+links.length;
    previous.disabled=index===0;
    next.disabled=index===links.length-1;
  }
  function open(link) {
    returnTo=link;
    show(links.indexOf(link));
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('mra-viewing-art');
    close.focus({preventScroll:true});
  }
  function shut() {if(dialog.open)dialog.close();}
  document.addEventListener('click',function(event){
    const link=event.target?.closest?.('a[data-mra-lightbox]');
    if(!link)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(link);
  },true);
  close.addEventListener('click',shut);
  previous.addEventListener('click',function(){show(index-1);});
  next.addEventListener('click',function(){show(index+1);});
  dialog.addEventListener('click',function(event){if(event.target===dialog)shut();});
  dialog.addEventListener('keydown',function(event){
    if(event.key==='ArrowLeft'){event.preventDefault();show(index-1);}
    if(event.key==='ArrowRight'){event.preventDefault();show(index+1);}
  });
  dialog.addEventListener('close',function(){
    document.body.classList.remove('mra-viewing-art');
    if(returnTo&&returnTo.isConnected) returnTo.focus({preventScroll:true});
    returnTo=null;
  });
})();