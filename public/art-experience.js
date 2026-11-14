/* Michal Rebekah Art: unobtrusive gallery viewing and editorial entrance motion.
 * This is intentionally independent of WordPress/Breakdance and does not require
 * third-party cookies, animation libraries or a client-side framework. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const eligible = 'a[data-artwork-open]';
  let modal, picture, modalCategory, modalTitle, modalDescription, previous, next, close;
  let activeList = [];
  let activeIndex = 0;
  let returnFocus;

  const buildModal = () => {
    modal = document.createElement('dialog');
    modal.className = 'mra-lightbox';
    modal.setAttribute('aria-label', 'View painting');

    const frame = document.createElement('div');
    frame.className = 'mra-lightbox-frame';
    const bar = document.createElement('div');
    bar.className = 'mra-lightbox-toolbar';
    modalCategory = document.createElement('span');
    modalCategory.className = 'mra-lightbox-category';
    close = document.createElement('button');
    close.type = 'button';
    close.className = 'mra-lightbox-close';
    close.setAttribute('aria-label', 'Close painting');
    close.textContent = 'Close ×';
    bar.append(modalCategory, close);

    const body = document.createElement('div');
    body.className = 'mra-lightbox-body';
    previous = document.createElement('button');
    next = document.createElement('button');
    previous.type = next.type = 'button';
    previous.className = 'mra-lightbox-arrow mra-lightbox-prev';
    next.className = 'mra-lightbox-arrow mra-lightbox-next';
    previous.setAttribute('aria-label', 'Previous painting');
    next.setAttribute('aria-label', 'Next painting');
    previous.textContent = '‹';
    next.textContent = '›';
    const figure = document.createElement('figure');
    figure.className = 'mra-lightbox-figure';
    picture = document.createElement('img');
    picture.className = 'mra-lightbox-picture';
    picture.decoding = 'async';
    const caption = document.createElement('figcaption');
    caption.className = 'mra-lightbox-caption';
    modalTitle = document.createElement('strong');
    modalTitle.className = 'mra-lightbox-title';
    modalDescription = document.createElement('p');
    modalDescription.className = 'mra-lightbox-description';
    caption.append(modalTitle, modalDescription);
    figure.append(picture, caption);
    body.append(previous, figure, next);
    frame.append(bar, body);
    modal.append(frame);
    document.body.append(modal);

    close.addEventListener('click', () => modal.close());
    previous.addEventListener('click', () => render(activeIndex - 1));
    next.addEventListener('click', () => render(activeIndex + 1));
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.close();
    });
    modal.addEventListener('close', () => {
      document.documentElement.classList.remove('mra-lightbox-open');
      returnFocus?.focus({ preventScroll: true });
    });
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); render(activeIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); render(activeIndex + 1); }
    });
  };

  const render = (index) => {
    if (!activeList.length) return;
    activeIndex = (index + activeList.length) % activeList.length;
    const anchor = activeList[activeIndex];
    const src = anchor.getAttribute('href');
    picture.src = src;
    const detail = anchor.dataset.artDescription || anchor.querySelector('img')?.alt || '';
    const title = anchor.dataset.artTitle || 'An original painting';
    picture.alt = detail;
    modalCategory.textContent = anchor.dataset.artCategory || 'Michal Rebekah Art';
    modalTitle.textContent = title;
    modalDescription.textContent = detail === title ? '' : detail;
    previous.hidden = next.hidden = activeList.length < 2;
  };

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.(eligible);
    if (!anchor || event.defaultPrevented && !anchor.matches('.ee-gallery-item')) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!modal) buildModal();
    const gallery = anchor.closest('.ee-gallery, .artwork-guide-grid');
    activeList = gallery ? [...gallery.querySelectorAll(eligible)] : [anchor];
    activeIndex = Math.max(0, activeList.indexOf(anchor));
    returnFocus = anchor;
    render(activeIndex);
    document.documentElement.classList.add('mra-lightbox-open');
    modal.showModal();
    close.focus({preventScroll:true});
  }, true);

  const startMotion = () => {
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    // The image itself always remains visible. Animations begin as elements
    // enter the viewport; no element is hidden while waiting for JS.
    const selectors = [
      '.artwork-card',
      '.ee-gallery-item--image',
      '.art-hero > div',
      '.art-hero > figure',
      '.art-related',
      '.art-hub-collections',
      '.art-copy > h2',
      '.art-copy > p',
      '.quiet-panel',
      '.breakdance .bde-columns > .bde-column'
    ];
    const targets = [...document.querySelectorAll(selectors.join(','))];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const element = entry.target;
        const delay = Math.min(3, Number(element.dataset.artStagger || 0)) * 55;
        const motion = element.animate([
          { opacity: 0.55, transform: 'translate3d(0,14px,0)' },
          { opacity: 1, transform: 'translate3d(0,0,0)' }
        ], {
          duration: 590,
          easing: 'cubic-bezier(.22,1,.36,1)',
          delay,
          fill: 'both'
        });
        motion.finished.then(() => motion.cancel()).catch(() => {});
      }
    }, { rootMargin: '0px 0px -35px 0px', threshold: 0.12 });
    targets.forEach((element, index) => {
      element.dataset.artStagger = String(index % 4);
      observer.observe(element);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMotion, { once: true });
  } else startMotion();
})();
