export const DEFAULT_CARD = {
  version: 1,
  profile: {
    firstName: 'Ovin', lastName: 'Bopage',
    role: 'Junior Executive', department: 'Procurement (RM)',
    company: 'Hemas Consumer Brand',
    photo: './assets/ovin.jpg', photoAlt: 'Ovin Bopage wearing a navy suit',
    photoPosition: 50, cardUrl: 'https://card.ovin.bopage.tapx.lk/'
  },
  contacts: [
    { id: 'call', type: 'phone', label: 'Call', value: '+94716278399', visible: true },
    { id: 'whatsapp', type: 'whatsapp', label: 'WhatsApp', value: '+94716278399', visible: true },
    { id: 'email', type: 'email', label: 'Email', value: 'Ovinb.consumer@hemas.com', visible: true }
  ],
  website: { enabled: false, url: '' },
  socials: [
    { id: 'linkedin', platform: 'linkedin', label: 'LinkedIn', description: 'Professional connections', url: 'https://www.linkedin.com/in/ovin-bopage-71206228b/', visible: true },
    { id: 'instagram', platform: 'instagram', label: 'Instagram', description: 'A more personal side', url: 'https://www.instagram.com/___bopeeeee___?psln=eW9sajF6dHQ5NXo5', visible: true },
    { id: 'facebook', platform: 'facebook', label: 'Facebook', description: 'Keep in touch', url: 'https://www.facebook.com/share/1MCj8sFe2b/?mibextid=wwXIfr', visible: true }
  ],
  background: {
    bio: '',
    education: [
      { id: 'university', school: 'Ocean University of Sri Lanka', qualification: 'Maritime Transportation & Logistics Management', period: '2023 – 2028' },
      { id: 'college', school: 'Rahula College', qualification: '', period: '' }
    ],
    experience: [],
    skills: ['Procurement', 'Supply Chain Management', 'Logistics Management', 'Data Analysis', 'Analytical Skills', 'Team Leadership', 'Community Development']
  },
  design: {
    primary: '#283e32', accent: '#cfb77d', canvas: '#f5f3ee', paper: '#fffefa',
    heroStart: '#17221c', heroEnd: '#020503',
    showPhoto: true, showSocial: true, showBackground: true, showFooter: true, showIntroOnMobile: false
  },
  wording: {
    brandLabel: 'Digital card', heroEyebrow: 'A CONNECTION THAT COUNTS', greeting: "Hello, I'm",
    photoLabel: 'View photo', introEyebrow: 'LET’S CONNECT',
    introHeading: 'Good connections.\nNew possibilities.', introDescription: 'My contact details, all in one place.',
    saveContact: 'Save my contact', findOnline: 'Find me online',
    socialEyebrow: 'STAY IN TOUCH', socialHeading: 'Beyond the introduction.',
    socialDescription: 'Connect with Ovin on your favourite platform.',
    backgroundLabel: 'Professional background', backgroundEyebrow: 'A LITTLE MORE ABOUT ME',
    backgroundHeading: 'Professional background', aboutHeading: 'About me',
    educationHeading: 'Education', experienceHeading: 'Experience', skillsHeading: 'Areas of interest & skills',
    shareButton: 'Share profile', shareHeading: 'Share this connection.',
    shareDescription: 'Copy this card’s link and send it to someone.', shareWhatsApp: 'Share via WhatsApp',
    cardLinkLabel: 'Card link', copyLabel: 'Copy link',
    footerTagline: 'One tap. A lasting connection.', poweredBy: 'Powered by', brandName: 'TapX', brandUrl: 'https://tapx.lk/'
  }
};

export const CONTACT_TYPES = { phone: 'Phone number', whatsapp: 'WhatsApp', email: 'Email address' };
export const PLATFORMS = { linkedin: 'LinkedIn', instagram: 'Instagram', facebook: 'Facebook', x: 'X / Twitter', youtube: 'YouTube', tiktok: 'TikTok', github: 'GitHub', website: 'Website', other: 'Other link' };
export const clone = value => structuredClone(value);
export const LOCKED_WORDING = ['brandLabel', 'shareButton', 'footerTagline', 'poweredBy', 'brandName', 'brandUrl'];
export function applyEditingPolicy(value) {
  const card = clone(value);
  if (!card || typeof card !== 'object' || Array.isArray(card)) return card;
  if (card.profile && typeof card.profile === 'object' && !Array.isArray(card.profile)) card.profile.cardUrl = DEFAULT_CARD.profile.cardUrl;
  if (!Object.hasOwn(card, 'website')) card.website = clone(DEFAULT_CARD.website);
  if (card.wording && typeof card.wording === 'object' && !Array.isArray(card.wording)) {
    for (const key of LOCKED_WORDING) card.wording[key] = DEFAULT_CARD.wording[key];
  }
  if (card.design && typeof card.design === 'object' && !Array.isArray(card.design)) card.design.showFooter = true;
  if (Array.isArray(card.contacts)) {
    card.contacts = DEFAULT_CARD.contacts.map(original => {
      const entry = card.contacts.find(contact => contact?.type === original.type);
      return { ...clone(original), label: typeof entry?.label === 'string' ? entry.label : original.label, value: typeof entry?.value === 'string' ? entry.value : original.value };
    });
  }
  return card;
}
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeURL = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
export function photoURL(value) {
  return value === './assets/ovin.jpg' || /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value ?? '') ? value : '';
}
export function contactURL(contact) {
  const v = String(contact.value ?? '').trim();
  if (contact.type === 'phone') return `tel:${v.replace(/[^+\d]/g, '')}`;
  if (contact.type === 'whatsapp') return `https://wa.me/${v.replace(/\D/g, '')}`;
  if (contact.type === 'email') return `mailto:${encodeURIComponent(v).replace(/%40/g, '@')}`;
  return '';
}
export function makeVCard(card) {
  const esc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r/g, '');
  const p = card.profile;
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${esc(p.lastName)};${esc(p.firstName)};;;`, `FN:${esc(`${p.firstName} ${p.lastName}`.trim())}`, `ORG:${esc(p.company)}`, `TITLE:${esc([p.role, p.department].filter(Boolean).join(' – '))}`];
  for (const c of card.contacts.filter(c => c.visible && c.value)) {
    if (c.type === 'phone') lines.push(`TEL;TYPE=CELL:${esc(c.value)}`);
    if (c.type === 'email') lines.push(`EMAIL;TYPE=INTERNET:${esc(c.value)}`);
  }
  if (safeURL(p.cardUrl)) lines.push(`URL:${esc(p.cardUrl)}`);
  if (card.website?.enabled && safeURL(card.website.url)) lines.push(`URL:${esc(card.website.url)}`);
  for (const s of card.socials.filter(s => s.visible && safeURL(s.url))) lines.push(`X-SOCIALPROFILE;TYPE=${s.platform}:${esc(s.url)}`);
  if (card.background.bio) lines.push(`NOTE:${esc(card.background.bio)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function validateCard(card, { allowIncomplete = false } = {}) {
  const errors = [];
  const error = (path, message) => errors.push({ path, message });
  if (!card || typeof card !== 'object' || Array.isArray(card)) return [{ path: '', message: 'Choose a valid card backup.' }];
  const text = (value, path, max = 1000) => { if (typeof value !== 'string' || value.length > max) error(path, `Use text with no more than ${max} characters.`); };
  for (const section of ['profile', 'background', 'design', 'wording', 'website']) {
    if (!card[section] || typeof card[section] !== 'object' || Array.isArray(card[section])) error(section, `The ${section} section is missing.`);
  }
  if (errors.length) return errors;
  for (const key of Object.keys(DEFAULT_CARD.profile).filter(k => k !== 'photoPosition')) text(card.profile[key], `profile.${key}`, key === 'photo' ? 6_000_000 : 1000);
  if (!allowIncomplete && (typeof card.profile.firstName !== 'string' || !card.profile.firstName.trim())) error('profile.firstName', 'Enter a first name.');
  if (card.profile.photo && !photoURL(card.profile.photo)) error('profile.photo', 'Upload a JPG, PNG or WebP photo.');
  if (!Number.isFinite(card.profile.photoPosition) || card.profile.photoPosition < 0 || card.profile.photoPosition > 100) error('profile.photoPosition', 'Choose a photo position from 0 to 100.');
  if (card.profile.cardUrl !== DEFAULT_CARD.profile.cardUrl) error('profile.cardUrl', 'The card link is managed by TapX and cannot be changed.');
  if (typeof card.website.enabled !== 'boolean') error('website.enabled', 'Choose whether to show your website button.');
  text(card.website.url, 'website.url', 2000);
  if (!allowIncomplete && card.website.enabled && !safeURL(card.website.url)) error('website.url', 'Enter a complete http:// or https:// website link.');
  for (const [key, sample] of Object.entries(DEFAULT_CARD.design)) {
    if (typeof sample === 'boolean' ? typeof card.design[key] !== 'boolean' : !/^#[0-9a-f]{6}$/i.test(card.design[key] ?? '')) error(`design.${key}`, 'Choose a valid colour or visibility setting.');
  }
  for (const key of Object.keys(DEFAULT_CARD.wording)) text(card.wording[key], `wording.${key}`, 2000);
  for (const key of LOCKED_WORDING) if (card.wording[key] !== DEFAULT_CARD.wording[key]) error(`wording.${key}`, 'This TapX label or branding is fixed.');
  if (card.design.showFooter !== true) error('design.showFooter', 'The TapX footer must stay visible.');
  if (!allowIncomplete && card.wording.brandUrl && !safeURL(card.wording.brandUrl)) error('wording.brandUrl', 'Enter a complete http:// or https:// brand link.');
  const list = (value, path, max) => {
    if (!Array.isArray(value) || value.length > max) { error(path, `Use no more than ${max} entries.`); return []; }
    return value;
  };
  if (!Array.isArray(card.contacts) || card.contacts.length !== DEFAULT_CARD.contacts.length) error('contacts', 'Keep the Call, WhatsApp and Email buttons. Only their labels and contact details can be changed.');
  for (const [i, c] of list(card.contacts, 'contacts', 30).entries()) {
    if (!c || typeof c !== 'object') { error(`contacts.${i}`, 'Invalid contact entry.'); continue; }
    for (const key of ['id', 'type', 'label', 'value']) text(c[key], `contacts.${i}.${key}`);
    if (!Object.hasOwn(CONTACT_TYPES, c.type)) error(`contacts.${i}.type`, 'Choose a contact type.');
    if (typeof c.visible !== 'boolean') error(`contacts.${i}.visible`, 'Choose a visibility setting.');
    const fixed = DEFAULT_CARD.contacts[i];
    if (!fixed || c.id !== fixed.id || c.type !== fixed.type || c.visible !== true) error(`contacts.${i}`, 'Contact button type, order and visibility are fixed.');
    if (!allowIncomplete && (typeof c.label !== 'string' || !c.label.trim())) error(`contacts.${i}.label`, 'Enter a button label.');
    if (!allowIncomplete && (typeof c.value !== 'string' || !c.value.trim())) error(`contacts.${i}.value`, 'Enter the phone number or email address for this button.');
    if (!allowIncomplete && c.value && ['phone', 'whatsapp'].includes(c.type) && !/^\+?[\d ()\-.]{5,30}$/.test(c.value)) error(`contacts.${i}.value`, 'Enter a phone number with country code, for example +94716278399.');
    if (!allowIncomplete && c.value && c.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value)) error(`contacts.${i}.value`, 'Enter a valid email address.');
  }
  for (const [i, s] of list(card.socials, 'socials', 30).entries()) {
    if (!s || typeof s !== 'object') { error(`socials.${i}`, 'Invalid social link.'); continue; }
    for (const key of ['id', 'platform', 'label', 'description', 'url']) text(s[key], `socials.${i}.${key}`);
    if (!Object.hasOwn(PLATFORMS, s.platform)) error(`socials.${i}.platform`, 'Choose a social platform.');
    if (typeof s.visible !== 'boolean') error(`socials.${i}.visible`, 'Choose a visibility setting.');
    if (!allowIncomplete && (s.visible || s.url) && !safeURL(s.url)) error(`socials.${i}.url`, 'Enter a complete http:// or https:// link, or hide this empty entry.');
  }
  text(card.background.bio, 'background.bio', 5000);
  for (const kind of ['education', 'experience']) {
    const keys = kind === 'education' ? ['id', 'school', 'qualification', 'period'] : ['id', 'role', 'company', 'period', 'description'];
    for (const [i, item] of list(card.background[kind], `background.${kind}`, 40).entries()) {
      if (!item || typeof item !== 'object') { error(`background.${kind}.${i}`, 'Invalid background entry.'); continue; }
      for (const key of keys) text(item[key], `background.${kind}.${i}.${key}`, 5000);
      const titleKey = kind === 'education' ? 'school' : 'role';
      if (!allowIncomplete && (typeof item[titleKey] !== 'string' || !item[titleKey].trim())) error(`background.${kind}.${i}.${titleKey}`, `Enter ${kind === 'education' ? 'an institution' : 'a role'}, or remove this entry.`);
    }
  }
  for (const [i, skill] of list(card.background.skills, 'background.skills', 80).entries()) {
    text(skill, `background.skills.${i}`, 200);
    if (!allowIncomplete && typeof skill === 'string' && !skill.trim()) error(`background.skills.${i}`, 'Enter a skill, or remove this entry.');
  }
  return errors;
}
