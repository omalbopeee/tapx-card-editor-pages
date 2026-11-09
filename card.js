import './static-api.js';
import { escapeHTML, safeURL, photoURL, contactURL, makeVCard, applyEditingPolicy } from './model.js';
import { icon } from './icons.js';

const root = document.getElementById('card-root');
const isPreview = !window.EXPORTED_CARD && new URLSearchParams(location.search).has('preview');
let currentCard, toastTimer;
const e = escapeHTML;
const lines = value => e(value).replaceAll('\n', '<br>');
const buttonClose = label => `<button class="round close" type="button" aria-label="${e(label)}" autofocus>${icon('close')}</button>`;
const dialogHead = (eyebrow, title, id) => `<div class="dialog-head"><div>${eyebrow ? `<span class="eyebrow">${e(eyebrow)}</span>` : ''}<h2 id="${id}">${e(title)}</h2></div>${buttonClose('Close dialog')}</div>`;

function renderCard(card) {
  card = applyEditingPolicy(card);
  const openDialog = root.querySelector('dialog[open]')?.id;
  currentCard = card;
  const { profile: p, wording: w, design: d, background: b } = card;
  const name = `${p.firstName} ${p.lastName}`.trim();
  const contacts = card.contacts.filter(c => c.visible && c.value && contactURL(c));
  const socials = card.socials.filter(s => s.visible && safeURL(s.url));
  const photo = photoURL(p.photo);
  document.title = `${name} | Digital Business Card`;
  const style = document.documentElement.style;
  for (const [key, value] of Object.entries({ '--green': d.primary, '--gold': d.accent, '--canvas': d.canvas, '--paper': d.paper, '--hero-start': d.heroStart, '--hero-end': d.heroEnd })) {
    if (/^#[a-f\d]{6}$/i.test(value)) style.setProperty(key, value);
  }
  style.setProperty('--photo-position', `${Number(p.photoPosition) || 0}%`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', d.canvas);
  root.innerHTML = `
    <a class="skip" href="#contact">Skip to contact</a>
    <main class="stage ${d.showIntroOnMobile ? 'show-mobile-intro' : ''}">
      <div class="masthead"><div class="digital-card-brand">${icon('nfc')}<span>${e(w.brandLabel)}</span></div><button class="share-profile" type="button" data-dialog="share" aria-label="${e(w.shareButton)}: ${e(name)}">${icon('share')}<span>${e(w.shareButton)}</span></button></div>
      <article class="card" aria-labelledby="profile-name">
        <header class="hero ${!d.showPhoto || !photo ? 'no-photo' : ''}">
          <div class="hero-top"><span class="eyebrow">${e(w.heroEyebrow)}</span></div>
          ${d.showPhoto && photo ? `<button class="portrait" type="button" data-dialog="photo" aria-haspopup="dialog" aria-label="${e(w.photoLabel)}: ${e(name)}"><img src="${e(photo)}" alt="${e(p.photoAlt)}" width="400" height="400" fetchpriority="high"><span class="photo-hint">${icon('zoom')}${e(w.photoLabel)}</span></button>` : ''}
          <div class="identity"><span class="hello">${e(w.greeting)}</span><h1 id="profile-name">${e(p.firstName)}${p.lastName ? `<br><span>${e(p.lastName)}</span>` : ''}<b>.</b></h1><div class="gold-line"></div><p class="role">${e(p.role)}${p.department ? `<br><strong>${e(p.department)}</strong>` : ''}</p><p class="company">${e(p.company)}</p></div>
        </header>
        <section class="content" id="contact" tabindex="-1" aria-label="Contact ${e(name)}">
          <div class="intro"><span class="eyebrow">${e(w.introEyebrow)}</span><h2>${lines(w.introHeading)}</h2><p>${e(w.introDescription)}</p></div>
          <button class="save" type="button" data-action="vcard">${icon('add')}<span>${e(w.saveContact)}</span>${icon('download')}</button>
          ${contacts.length ? `<div class="actions" role="group" aria-label="Get in touch">${contacts.map(c => `<a class="${c.type === 'whatsapp' ? 'wa' : ''}" href="${e(contactURL(c))}" ${['website', 'whatsapp'].includes(c.type) ? 'target="_blank" rel="noopener noreferrer"' : ''}>${icon(c.type)}<span>${e(c.label)}</span></a>`).join('')}</div>` : ''}
          ${card.website.enabled && safeURL(card.website.url) ? `<a class="website-button" href="${e(safeURL(card.website.url))}" target="_blank" rel="noopener noreferrer">${icon('globe')}<span>My website</span>${icon('external')}</a>` : ''}
          ${d.showSocial && socials.length ? `<button class="social-tile" type="button" data-dialog="social" aria-haspopup="dialog"><span class="social-icons">${socials.slice(0, 3).map(s => icon(s.platform, s.platform)).join('')}</span><span class="social-copy"><strong>${e(w.findOnline)}</strong><small>${e(socials.map(s => s.label).join(' · '))}</small></span>${icon('chevron')}</button>` : ''}
          ${d.showBackground ? `<button class="background-button" type="button" data-dialog="background" aria-haspopup="dialog"><span>${e(w.backgroundLabel)}</span>${icon('chevron')}</button>` : ''}
        </section>
      </article>
      ${d.showFooter ? `<footer><span>${e(w.footerTagline)}</span><a href="${e(safeURL(w.brandUrl) || '#')}" target="_blank" rel="noopener noreferrer">${e(w.poweredBy)} <strong>${e(w.brandName)}</strong>${icon('external')}</a></footer>` : ''}
    </main>
    <dialog id="social" aria-labelledby="social-title">${dialogHead(w.socialEyebrow, w.socialHeading, 'social-title')}<p class="dialog-sub">${e(w.socialDescription)}</p><div class="social-links">${socials.map(s => `<a href="${e(safeURL(s.url))}" target="_blank" rel="noopener noreferrer"><span class="platform ${e(s.platform)}">${icon(s.platform)}</span><span><strong>${e(s.label)}</strong><small>${e(s.description)}</small></span>${icon('external')}</a>`).join('')}</div></dialog>
    <dialog id="background" aria-labelledby="background-title">${dialogHead(w.backgroundEyebrow, w.backgroundHeading, 'background-title')}<div class="about-body">
      ${b.bio ? `<h3>${e(w.aboutHeading)}</h3><p class="multiline">${e(b.bio)}</p>` : ''}
      ${b.education.length ? `<h3>${e(w.educationHeading)}</h3>${b.education.map(item => `<p><strong>${e(item.school)}</strong>${item.qualification ? `<br>${e(item.qualification)}` : ''}${item.period ? `<br><span>${e(item.period)}</span>` : ''}</p>`).join('')}` : ''}
      ${b.experience.length ? `<h3>${e(w.experienceHeading)}</h3>${b.experience.map(item => `<p><strong>${e(item.role)}</strong>${item.company ? `<br>${e(item.company)}` : ''}${item.period ? `<br>${e(item.period)}` : ''}${item.description ? `<br><span class="multiline">${e(item.description)}</span>` : ''}</p>`).join('')}` : ''}
      ${b.skills.length ? `<h3>${e(w.skillsHeading)}</h3><div class="tags">${b.skills.filter(Boolean).map(skill => `<span>${e(skill)}</span>`).join('')}</div>` : ''}
    </div></dialog>
    ${photo ? `<dialog id="photo" aria-label="${e(name)} portrait">${buttonClose('Close portrait')}<img src="${e(photo)}" alt="${e(p.photoAlt)}" width="400" height="400"></dialog>` : ''}
    <dialog id="share" aria-labelledby="share-title">${dialogHead('', w.shareHeading, 'share-title')}<p class="dialog-sub">${e(w.shareDescription)}</p><a class="share-whatsapp" href="https://wa.me/?text=${encodeURIComponent(safeURL(p.cardUrl) || location.href)}" target="_blank" rel="noopener noreferrer">${e(w.shareWhatsApp)} ${icon('whatsapp')}</a><label for="share-url">${e(w.cardLinkLabel)}</label><input id="share-url" type="url" readonly value="${e(safeURL(p.cardUrl) || location.href)}"><button class="save copy" type="button" data-action="copy">${icon('copy')}<span>${e(w.copyLabel)}</span></button></dialog>
    <div id="toast" role="status" aria-live="polite"></div>`;
  if (openDialog) document.getElementById(openDialog)?.showModal();
}

function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}
root.addEventListener('click', async event => {
  const trigger = event.target.closest('[data-dialog]');
  if (trigger) document.getElementById(trigger.dataset.dialog)?.showModal();
  if (event.target.closest('.close')) event.target.closest('dialog')?.close();
  if (event.target.tagName === 'DIALOG') {
    const bounds = event.target.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close();
  }
  if (event.target.closest('[data-action="vcard"]')) {
    const url = URL.createObjectURL(new Blob([makeVCard(currentCard)], { type: 'text/vcard;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `${currentCard.profile.firstName}-${currentCard.profile.lastName}.vcf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (event.target.closest('[data-action="copy"]')) {
    const input = document.getElementById('share-url');
    try { await navigator.clipboard.writeText(input.value); notify('Card link copied'); } catch { input.focus(); input.select(); notify('Select and copy the card link'); }
  }
});

if (isPreview) {
  window.addEventListener('message', event => {
    if (event.source === parent && event.origin === location.origin && event.data?.type === 'tapx:render') renderCard(event.data.card);
  });
  parent.postMessage({ type: 'tapx:ready' }, location.origin);
} else if (window.EXPORTED_CARD) {
  renderCard(window.EXPORTED_CARD);
} else {
  fetch('/api/card').then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(record => renderCard(record.card)).catch(() => { root.innerHTML = '<p class="card-loading">Your card could not be loaded. Start the dashboard server and try again.</p>'; });
}
