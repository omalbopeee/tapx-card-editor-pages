import './static-api.js?v=2dde10de963d';
import { DEFAULT_CARD, CONTACT_TYPES, PLATFORMS, clone, escapeHTML, photoURL, validateCard, applyEditingPolicy } from './model.js?v=2dde10de963d';
import { icon } from './icons.js?v=2dde10de963d';

const $ = selector => document.querySelector(selector);
const e = escapeHTML;
const SECTIONS = [
  { id: 'profile', label: 'Profile & photo', icon: 'user' },
  { id: 'contacts', label: 'Contact details', icon: 'phone' },
  { id: 'socials', label: 'Social media', icon: 'globe' },
  { id: 'background', label: 'Professional background', icon: 'briefcase' },
  { id: 'design', label: 'Design & wording', icon: 'palette' }
];
const PRESETS = [
  { name: 'Original forest', colors: ['#283e32', '#cfb77d', '#f5f3ee', '#fffefa', '#17221c', '#020503'] },
  { name: 'Midnight blue', colors: ['#263b58', '#b9cceb', '#f0f3f8', '#ffffff', '#18283f', '#090f19'] },
  { name: 'Warm burgundy', colors: ['#673c44', '#e0bd91', '#f6f0ed', '#fffaf6', '#352025', '#160c10'] }
];
const COLOURS = ['primary', 'accent', 'canvas', 'paper', 'heroStart', 'heroEnd'];
const DRAFT_KEY = 'tapx-card-studio-draft-v1:' + new URL('.', import.meta.url).pathname;
let draft, saved, savedAt, revision = 0, section = 'profile', saving = false, uploading = false, storageMode = 'local';
let errors = [], toastTimer, previewTimer, draftTimer, recoveredDraft;

function get(path) { return path.split('.').reduce((value, key) => value?.[key], draft); }
function set(path, value) { const keys = path.split('.'); const last = keys.pop(); const target = keys.reduce((value, key) => value[key], draft); target[last] = value; }
function dirty() { return draft && saved && JSON.stringify(draft) !== JSON.stringify(saved); }
function uid() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
function toast(message, type = 'check') { const el = $('#app-toast'); el.innerHTML = `${icon(type)}<span>${e(message)}</span>`; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4000); }

function field(path, label, { type = 'text', wide = false, help = '', placeholder = '', required = false, options, rows = 3 } = {}) {
  const id = `field-${path.replaceAll('.', '-')}`;
  const error = errors.find(error => error.path === path);
  const attributes = `id="${id}" data-path="${path}" ${error ? 'aria-invalid="true"' : ''} aria-describedby="${id}-help ${id}-error" ${required ? 'required' : ''}`;
  let input;
  if (type === 'textarea') input = `<textarea ${attributes} rows="${rows}" placeholder="${e(placeholder)}">${e(get(path))}</textarea>`;
  else if (options) input = `<select ${attributes}>${Object.entries(options).map(([key, value]) => `<option value="${e(key)}" ${get(path) === key ? 'selected' : ''}>${e(value)}</option>`).join('')}</select>`;
  else input = `<input ${attributes} type="${type}" value="${e(get(path))}" placeholder="${e(placeholder)}" ${type === 'url' || type === 'email' ? 'spellcheck="false"' : ''}>`;
  return `<div class="field ${wide ? 'wide' : ''}"><label for="${id}">${e(label)}${required ? '<span class="required-mark">*</span>' : ''}</label>${input}<small class="field-help" id="${id}-help" ${help ? '' : 'hidden'}>${e(help)}</small><small class="field-error" id="${id}-error" ${error ? '' : 'hidden'}>${e(error?.message)}</small></div>`;
}
function toggle(path, label = 'Visible', hiddenLabel = '') { return `<label class="toggle-wrap"><input type="checkbox" data-path="${path}" ${get(path) ? 'checked' : ''} aria-label="${e(hiddenLabel || label)}"><span>${e(label)}</span></label>`; }
function heading(number, title, description, tag = '') { return `<div class="section-header"><div><div class="section-heading-line"><span class="section-number">${number}</span><h2>${e(title)}</h2></div><p>${e(description)}</p></div>${tag ? `<span class="small-tag">${e(tag)}</span>` : ''}</div>`; }
function controls(path, index, count, label) {
  return `<div class="entry-controls"><button class="icon-button move-up" type="button" data-move="${path}" data-index="${index}" data-direction="-1" ${index === 0 ? 'disabled' : ''} aria-label="Move ${e(label)} up">${icon('chevron')}</button><button class="icon-button move-down" type="button" data-move="${path}" data-index="${index}" data-direction="1" ${index === count - 1 ? 'disabled' : ''} aria-label="Move ${e(label)} down">${icon('chevron')}</button><button class="icon-button remove" type="button" data-remove="${path}" data-index="${index}" aria-label="Remove ${e(label)}">${icon('trash')}</button></div>`;
}
function addButton(path, label) { return `<button class="add-entry" type="button" data-add="${path}">${icon('plus')}${e(label)}</button>`; }
function nextButton() { const next = SECTIONS[SECTIONS.findIndex(s => s.id === section) + 1]; return next ? `<div class="section-next"><button class="text-button" type="button" data-section="${next.id}">Next: ${e(next.label)} ${icon('arrow')}</button></div>` : ''; }

function profilePanel() {
  const p = draft.profile;
  return `<section class="form-card">${heading('01', 'Profile & photo', 'Introduce yourself. Make your first impression feel like you.', 'THE ESSENTIALS')}
    <div class="photo-editor">${photoURL(p.photo) ? `<img id="photo-thumbnail" class="photo-avatar" src="${e(photoURL(p.photo))}" alt="Current profile photo">` : `<div class="photo-avatar photo-placeholder">${icon('user')}</div>`}<div class="photo-copy"><strong>Your profile photo</strong><p>JPG, PNG or WebP. Up to 10 MB.</p><div class="photo-buttons"><button class="button secondary" type="button" data-command="upload-photo">${icon('upload')}${p.photo ? 'Change photo' : 'Upload photo'}</button>${p.photo ? '<button class="text-button" type="button" data-command="remove-photo">Remove</button>' : ''}</div></div></div>
    <input type="file" id="photo-file" accept="image/jpeg,image/png,image/webp" hidden>
    <div class="form-grid">${field('profile.firstName', 'First name', { required: true })}${field('profile.lastName', 'Last name')}${field('profile.role', 'Job title', { placeholder: 'e.g. Junior Executive' })}${field('profile.department', 'Department / specialisation', { placeholder: 'e.g. Procurement (RM)' })}${field('profile.company', 'Company / organisation', { wide: true })}</div>
    </section>${nextButton()}`;
}
function contactsPanel() {
  return `<section class="form-card">${heading('02', 'Contact details', 'Update the button labels and the details your visitors will use.', '3 CONTACT BUTTONS')}
    ${draft.contacts.map((contact, index) => `<div class="entry-card"><div class="entry-header">${icon(contact.type)}<strong>${e(DEFAULT_CARD.contacts[index].label)}</strong></div><div class="form-grid">${field(`contacts.${index}.label`, 'Button label', { required: true })}${field(`contacts.${index}.value`, CONTACT_TYPES[contact.type], { type: contact.type === 'email' ? 'email' : 'tel', required: true, placeholder: contact.type === 'email' ? 'name@example.com' : '+94 71 627 8399', help: contact.type === 'whatsapp' ? 'Include the country code. This number opens a WhatsApp chat.' : contact.type === 'phone' ? 'Include the country code.' : '' })}</div></div>`).join('')}
    </section><section class="form-card">${heading('↳', 'My website', 'Add a website button alongside your contact details.')}<div class="visibility-row"><div><strong>Show “My website” button</strong><p>Send visitors to your personal or business website.</p></div>${toggle('website.enabled', '', 'Show My website button')}</div>${draft.website.enabled ? `<div class="subsection">${field('website.url', 'Website link', { type: 'url', required: true, placeholder: 'https://yourwebsite.com', help: 'The button will say “My website”.' })}</div>` : ''}</section>${nextButton()}`;
}
function socialsPanel() {
  return `<section class="form-card">${heading('03', 'Social media', 'Give your connections somewhere to go next.', `${draft.socials.length} LINKS`)}
    ${draft.socials.map((social, index) => `<div class="entry-card"><div class="entry-header">${icon(social.platform)}<strong>${e(social.label || PLATFORMS[social.platform])}</strong>${toggle(`socials.${index}.visible`, 'Show', `Show ${social.label || 'social link'} on the card`)}${controls('socials', index, draft.socials.length, social.label || 'social link')}</div><div class="form-grid">${field(`socials.${index}.platform`, 'Platform', { options: PLATFORMS })}${field(`socials.${index}.label`, 'Display name')}${field(`socials.${index}.url`, 'Profile link', { type: 'url', wide: true, placeholder: 'https://', help: 'Paste the full link to your profile.' })}${field(`socials.${index}.description`, 'Short description', { wide: true, placeholder: 'e.g. Professional connections' })}</div></div>`).join('')}
    ${!draft.socials.length ? '<div class="empty-state">Start with a platform you use.<br>You can add as many as you need.</div>' : ''}${addButton('socials', 'Add social link')}</section><div class="tip-card">${icon('eye')}<p><strong>Try it in the preview.</strong><br>Click “${e(draft.wording.findOnline)}” on your card to see your social links, just as visitors will.</p></div>${nextButton()}`;
}
function backgroundPanel() {
  const b = draft.background;
  return `<section class="form-card">${heading('04', 'Professional background', 'The experience, education and interests behind your introduction.')}${field('background.bio', 'About me', { type: 'textarea', placeholder: 'Tell your story in a few sentences.' })}</section>
    <section class="form-card">${heading('↳', 'Education', 'Your qualifications and the places you learned.')}${b.education.map((item, i) => `<div class="entry-card"><div class="entry-header"><strong>${e(item.school || 'New education')}</strong>${controls('background.education', i, b.education.length, 'education')}</div><div class="form-grid">${field(`background.education.${i}.school`, 'School / university', { wide: true, required: true })}${field(`background.education.${i}.qualification`, 'Degree / qualification', { wide: true })}${field(`background.education.${i}.period`, 'Years', { wide: true, placeholder: 'e.g. 2023 – 2028' })}</div></div>`).join('')}${!b.education.length ? '<div class="empty-state">Add a school, university or qualification.</div>' : ''}${addButton('background.education', 'Add education')}</section>
    <section class="form-card">${heading('↳', 'Experience', 'Add the work and roles that shaped your career.')}${b.experience.map((item, i) => `<div class="entry-card"><div class="entry-header"><strong>${e(item.role || 'New experience')}</strong>${controls('background.experience', i, b.experience.length, 'experience')}</div><div class="form-grid">${field(`background.experience.${i}.role`, 'Role / position', { required: true })}${field(`background.experience.${i}.company`, 'Company')}${field(`background.experience.${i}.period`, 'Dates', { wide: true, placeholder: 'e.g. 2025 – Present' })}${field(`background.experience.${i}.description`, 'Description', { type: 'textarea', wide: true, placeholder: 'What did you do or achieve?' })}</div></div>`).join('')}${!b.experience.length ? '<div class="empty-state">A new chapter? Add your experience here.</div>' : ''}${addButton('background.experience', 'Add experience')}</section>
    <section class="form-card">${heading('↳', 'Interests & skills', 'The things you know. The things you’re curious about.')}<div class="skill-grid">${b.skills.map((skill, i) => `<div class="skill-field ${errors.some(err => err.path === `background.skills.${i}`) ? 'invalid' : ''}"><input data-path="background.skills.${i}" value="${e(skill)}" aria-label="Skill ${i + 1}" maxlength="200" placeholder="Name a skill"><button type="button" data-remove="background.skills" data-index="${i}" aria-label="Remove ${e(skill || 'skill')}">${icon('close')}</button></div>`).join('')}</div>${addButton('background.skills', 'Add interest or skill')}</section>${nextButton()}`;
}
const WORDING_GROUPS = [
  ['Your introduction', [['heroEyebrow', 'Hero tagline'], ['greeting', 'Greeting'], ['photoLabel', 'Photo button label'], ['introEyebrow', 'Introduction caption'], ['introHeading', 'Introduction heading', 'textarea'], ['introDescription', 'Introduction description'], ['saveContact', 'Save contact button']]],
  ['Social media', [['findOnline', 'Social links button'], ['socialEyebrow', 'Social dialog caption'], ['socialHeading', 'Social dialog heading'], ['socialDescription', 'Social dialog description']]],
  ['Professional background', [['backgroundLabel', 'Background button'], ['backgroundEyebrow', 'Background dialog caption'], ['backgroundHeading', 'Background dialog heading'], ['aboutHeading', 'About heading'], ['educationHeading', 'Education heading'], ['experienceHeading', 'Experience heading'], ['skillsHeading', 'Skills heading']]],
  ['Share your card', [['shareHeading', 'Share dialog heading'], ['shareDescription', 'Share dialog description'], ['shareWhatsApp', 'WhatsApp share label'], ['cardLinkLabel', 'Card link label'], ['copyLabel', 'Copy link button']]]
];
function designPanel() {
  const labels = ['Button colour', 'Accent colour', 'Page background', 'Card background', 'Hero start', 'Hero end'];
  const visibility = [
    ['showPhoto', 'Profile photo', 'Show your portrait on the card.'], ['showSocial', 'Social media', 'Show the social links button and dialog.'],
    ['showBackground', 'Professional background', 'Show your education, experience, bio and skills.'],
    ['showIntroOnMobile', 'Mobile introduction', 'Also show the introduction heading on smaller screens.']
  ];
  return `<section class="form-card">${heading('05', 'Look & feel', 'Keep the original style, or give your card a different feel.')}<div class="preset-grid">${PRESETS.map((preset, index) => `<button class="preset ${COLOURS.every((key, i) => draft.design[key] === preset.colors[i]) ? 'active' : ''}" type="button" data-preset="${index}"><span class="preset-colors">${preset.colors.slice(0, 3).map(color => `<i style="background:${color}"></i>`).join('')}</span>${e(preset.name)}</button>`).join('')}</div><div class="form-grid">${COLOURS.map((key, i) => `<div class="field"><label for="colour-${key}">${labels[i]}</label><div class="colour-field"><input type="color" data-path="design.${key}" id="colour-${key}" value="${draft.design[key]}"><span id="colour-value-${key}">${draft.design[key].toUpperCase()}</span></div></div>`).join('')}</div></section>
    <section class="form-card">${heading('↳', 'What’s on your card', 'Choose which parts of your story to share.')} ${visibility.map(([key, label, description]) => `<div class="visibility-row"><div><strong>${e(label)}</strong><p>${e(description)}</p></div>${toggle(`design.${key}`, '', label)}</div>`).join('')}</section>
    <section class="form-card">${heading('↳', 'Make every word your own', 'Edit all the headings, button labels and supporting text.')} ${WORDING_GROUPS.map(([title, fields]) => `<div class="wording-group"><h3>${e(title)}</h3><div class="form-grid">${fields.map(([key, label, type]) => field(`wording.${key}`, label, { type: type || 'text', wide: type === 'textarea' || ['introDescription', 'socialDescription', 'shareDescription', 'footerTagline'].includes(key) })).join('')}</div></div>`).join('')}</section>`;
}

function renderNav() { $('#section-nav').innerHTML = SECTIONS.map(s => `<button class="nav-item ${s.id === section ? 'active' : ''}" type="button" data-section="${s.id}" ${s.id === section ? 'aria-current="page"' : ''}>${icon(s.icon)}${e(s.label)}</button>`).join(''); }
function renderPanel() {
  if (!draft) return;
  const renderer = { profile: profilePanel, contacts: contactsPanel, socials: socialsPanel, background: backgroundPanel, design: designPanel };
  $('#panel').innerHTML = renderer[section]();
  renderNav(); updateState();
}
function showSection(id, { scroll = true } = {}) {
  if (!SECTIONS.some(s => s.id === id)) return;
  section = id; renderPanel();
  if (scroll) $('#editor').scrollIntoView({ block: 'start', behavior: 'smooth' });
}
function updateState() {
  const isDirty = dirty();
  const status = $('#save-status');
  status.className = `save-status ${isDirty ? 'dirty' : ''}`;
  status.innerHTML = `<i></i>${saving ? 'Saving…' : uploading ? 'Preparing photo…' : isDirty ? 'Unsaved changes' : 'All changes saved'}`;
  $('#save-button').disabled = !isDirty || saving || uploading;
  const canViewSaved = Boolean(savedAt) && !isDirty && !saving && !uploading;
  $('#view-saved-card-button').hidden = !canViewSaved;
  $('#save-button').hidden = canViewSaved;
  $('#preview-save-button').disabled = !isDirty || saving || uploading;
  $('#discard-button').disabled = !isDirty || saving || uploading;
  $('#reset-button').disabled = saving || uploading || JSON.stringify(draft) === JSON.stringify(DEFAULT_CARD);
  $('#save-button').querySelector('span:last-child').textContent = saving ? 'Saving…' : 'Save changes';
  const name = [draft.profile.firstName, draft.profile.lastName].map(s => s?.trim()?.[0] || '').join('').toUpperCase();
  $('#owner-avatar').textContent = name || 'ME';
  $('#owner-avatar').title = `${draft.profile.firstName} ${draft.profile.lastName}`.trim();
  const destination = storageMode === 'cloud' ? 'Saved online' : storageMode === 'browser' ? 'In this browser' : 'On this computer';
  $('#saved-at').textContent = savedAt ? `Last saved ${new Date(savedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${destination}` : storageMode === 'cloud' ? 'Your card is saved securely online.' : storageMode === 'browser' ? 'Your card is saved only in this browser.' : 'Your card is saved on this computer.';
  $('#workspace-mode').textContent = storageMode === 'cloud' ? 'Online workspace' : storageMode === 'browser' ? 'Browser workspace' : 'Local workspace';
  $('#storage-notice').hidden = storageMode !== 'browser';
  $('.draft-label').classList.toggle('is-saved', !isDirty);
  $('.draft-label').innerHTML = `<i></i>${isDirty ? 'Unsaved draft preview' : 'Saved card preview'}`;
}
function sendPreview(frame) { if (frame?.contentWindow && draft) frame.contentWindow.postMessage({ type: 'tapx:render', card: clone(draft) }, location.origin); }
function refreshPreviews() { sendPreview($('#live-frame')); if ($('#preview-dialog').open) sendPreview($('#full-frame')); }
function stashDraft() {
  try {
    if (dirty()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ card: draft, revision, updatedAt: new Date().toISOString() }));
    else localStorage.removeItem(DRAFT_KEY);
  } catch { /* Saving to disk remains available if browser draft storage is full. */ }
}
function changed({ render = false } = {}) {
  updateState();
  if (render) renderPanel();
  clearTimeout(previewTimer); previewTimer = setTimeout(refreshPreviews, 80);
  clearTimeout(draftTimer); draftTimer = setTimeout(stashDraft, 350);
}
function showError(message) { $('#error-banner').textContent = message; $('#error-banner').hidden = false; }
function clearErrors() { errors = []; $('#error-banner').hidden = true; }
function goToErrors() {
  const first = errors[0];
  const group = first.path.split('.')[0];
  section = group === 'wording' || group === 'design' ? 'design' : group === 'website' ? 'contacts' : group === 'profile' ? 'profile' : group === 'background' ? 'background' : group;
  if (!SECTIONS.some(s => s.id === section)) section = 'profile';
  renderPanel();
  const field = document.querySelector(`[data-path="${first.path}"]`);
  field?.focus(); field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  showError(`${errors.length === 1 ? 'One detail needs attention' : `${errors.length} details need attention`}. ${first.message}`);
}
async function saveCard() {
  if (!draft || saving || uploading || !dirty()) return;
  clearErrors(); errors = validateCard(draft);
  if (errors.length) { $('#preview-dialog').close(); goToErrors(); return; }
  saving = true; updateState();
  // Keep a snapshot: edits made while this request is in flight stay unsaved.
  const submitted = clone(draft);
  try {
    const response = await fetch('/api/card', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card: submitted, revision }) });
    const record = await response.json();
    if (!response.ok) {
      if (record.errors) { errors = record.errors; $('#preview-dialog').close(); goToErrors(); }
      throw new Error(record.error || 'Your changes could not be saved. Please try again.');
    }
    saved = clone(record.card); revision = record.revision; savedAt = record.savedAt;
    stashDraft();
    toast(dirty() ? 'Saved. Your newest edits are still in the draft.' : 'Your card is saved. Looking good.');
    if (!dirty()) $('#preview-dialog').close();
  } catch (error) {
    showError(error.message || 'Could not reach the dashboard. Check the server window and try again.');
    toast('Could not save. Your edits are still here.', 'info');
  } finally { saving = false; updateState(); }
}
function openPreview() { if (!draft) return; refreshPreviews(); $('#preview-dialog').showModal(); sendPreview($('#full-frame')); }
function focusAdded(path, index) {
  requestAnimationFrame(() => {
    const target = document.querySelector(`[data-path="${path}.${index}"]`) || document.querySelector(`[data-path^="${path}.${index}."]:not([type="checkbox"])`);
    target?.focus(); target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}
function addEntry(path) {
  if (!['socials', 'background.education', 'background.experience', 'background.skills'].includes(path)) return;
  const max = path === 'background.skills' ? 80 : path.startsWith('background.') ? 40 : 30;
  const array = get(path);
  if (array.length >= max) return toast(`You can add up to ${max} entries.`, 'info');
  const templates = {
    socials: { id: uid(), platform: 'website', label: 'Website', url: '', description: '', visible: true },
    'background.education': { id: uid(), school: '', qualification: '', period: '' },
    'background.experience': { id: uid(), role: '', company: '', period: '', description: '' },
    'background.skills': ''
  };
  array.push(templates[path]); changed({ render: true }); focusAdded(path, array.length - 1);
}
async function uploadPhoto(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast('Choose a JPG, PNG or WebP image.', 'info');
  if (file.size > 10 * 1024 * 1024) return toast('Choose a photo smaller than 10 MB.', 'info');
  uploading = true; updateState();
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    draft.profile.photo = canvas.toDataURL('image/jpeg', .9); draft.design.showPhoto = true;
    if (!draft.profile.photoAlt || draft.profile.photoAlt === saved.profile.photoAlt) draft.profile.photoAlt = `Portrait of ${draft.profile.firstName} ${draft.profile.lastName}`.trim();
    changed({ render: true }); toast('Photo added to your draft. Preview it before saving.');
  } catch { toast('That photo could not be opened. Try another image.', 'info'); }
  finally { URL.revokeObjectURL(url); uploading = false; updateState(); }
}
document.addEventListener('input', event => {
  const input = event.target.closest('[data-path]');
  if (!input || !draft || input.tagName === 'SELECT' || input.type === 'checkbox') return;
  set(input.dataset.path, input.value);
  if (input.type === 'color') { $(`#colour-value-${input.dataset.path.split('.')[1]}`).textContent = input.value.toUpperCase(); document.querySelectorAll('.preset.active').forEach(el => el.classList.remove('active')); }
  if (input.getAttribute('aria-invalid') === 'true') { input.removeAttribute('aria-invalid'); const errorEl = document.getElementById(`${input.id}-error`); if (errorEl) errorEl.hidden = true; errors = errors.filter(error => error.path !== input.dataset.path); }
  changed();
});
document.addEventListener('change', event => {
  const input = event.target;
  if (input.id === 'photo-file') return uploadPhoto(input.files[0]);
  if (!input.dataset.path || !draft) return;
  const path = input.dataset.path;
  if (input.type === 'checkbox') { set(path, input.checked); changed({ render: path === 'website.enabled' }); }
  if (input.tagName === 'SELECT') {
    const old = get(path); set(path, input.value);
    if (path.endsWith('.type')) {
      const base = path.slice(0, -5);
      const defaultLabels = { phone: 'Call', whatsapp: 'WhatsApp', email: 'Email', website: 'Website' };
      if (get(`${base}.label`) === defaultLabels[old]) set(`${base}.label`, defaultLabels[input.value]);
      // A previous number is reusable when switching between call and WhatsApp.
      if (!['phone', 'whatsapp'].includes(old) || !['phone', 'whatsapp'].includes(input.value)) set(`${base}.value`, '');
    }
    if (path.endsWith('.platform')) {
      const base = path.slice(0, -9);
      if (get(`${base}.label`) === PLATFORMS[old]) set(`${base}.label`, PLATFORMS[input.value]);
    }
    changed({ render: true });
  }
});
document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.section) { if (draft) showSection(button.dataset.section); return; }
  if (!draft) return;
  if (button.dataset.add) return addEntry(button.dataset.add);
  if (button.dataset.remove && button.dataset.remove !== 'contacts') { get(button.dataset.remove).splice(Number(button.dataset.index), 1); clearErrors(); changed({ render: true }); return; }
  if (button.dataset.move) {
    if (button.dataset.move === 'contacts') return;
    const array = get(button.dataset.move); const from = Number(button.dataset.index); const to = from + Number(button.dataset.direction);
    if (to >= 0 && to < array.length) { [array[from], array[to]] = [array[to], array[from]]; clearErrors(); changed({ render: true }); }
    return;
  }
  if (button.dataset.preset) { COLOURS.forEach((key, i) => { draft.design[key] = PRESETS[Number(button.dataset.preset)].colors[i]; }); changed({ render: true }); return; }
  if (button.dataset.device) {
    $('.large-preview-canvas').classList.toggle('desktop', button.dataset.device === 'desktop');
    document.querySelectorAll('[data-device]').forEach(el => { const active = el === button; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); }); return;
  }
  const command = button.dataset.command;
  if (command === 'upload-photo') $('#photo-file').click();
  if (command === 'remove-photo') { draft.profile.photo = ''; draft.design.showPhoto = false; changed({ render: true }); }
  if (command === 'close-preview') $('#preview-dialog').close();
  if (command === 'cancel-discard') $('#discard-dialog').close();
  if (command === 'cancel-reset') $('#reset-dialog').close();
  if (command === 'confirm-reset') { draft = clone(DEFAULT_CARD); clearErrors(); $('#reset-dialog').close(); renderPanel(); refreshPreviews(); stashDraft(); toast('Original card restored to your draft. Preview and save when ready.'); }
  if (command === 'confirm-discard') { draft = clone(saved); clearErrors(); $('#discard-dialog').close(); renderPanel(); refreshPreviews(); stashDraft(); toast('Restored your saved card.'); }
  if (command === 'restore-draft' && recoveredDraft) { draft = clone(recoveredDraft.card); clearErrors(); $('#recovery-banner').hidden = true; recoveredDraft = null; renderPanel(); changed(); toast('Your unfinished edit is back.'); }
  if (command === 'dismiss-draft') { $('#recovery-banner').hidden = true; recoveredDraft = null; try { localStorage.removeItem(DRAFT_KEY); } catch {} }
});
$('#save-button').addEventListener('click', saveCard);
$('#preview-save-button').addEventListener('click', saveCard);
$('#preview-button').addEventListener('click', openPreview);
$('#expand-preview').addEventListener('click', openPreview);
$('#discard-button').addEventListener('click', () => $('#discard-dialog').showModal());
$('#reset-button').addEventListener('click', () => $('#reset-dialog').showModal());
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveCard(); } });
window.addEventListener('beforeunload', event => { if (dirty()) { stashDraft(); event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'tapx:ready') return;
  const frame = [$('#live-frame'), $('#full-frame')].find(frame => frame.contentWindow === event.source);
  sendPreview(frame);
});
for (const frame of [$('#live-frame'), $('#full-frame')]) frame.addEventListener('load', () => sendPreview(frame));

hydrateIcons(); renderNav();
async function initialise() {
  try {
    const response = await fetch('/api/card'); const record = await response.json();
    if (!response.ok) throw new Error(record.error || 'Could not load your card.');
    const issues = validateCard(record.card);
    if (issues.length) throw new Error('The saved card could not be read. Restore your data backup and restart the dashboard.');
    draft = applyEditingPolicy(record.card); saved = clone(draft); revision = record.revision; savedAt = record.savedAt; storageMode = record.storage || 'local';
    renderPanel(); refreshPreviews();
    try { const recovered = JSON.parse(localStorage.getItem(DRAFT_KEY)); if (recovered?.card) recovered.card = applyEditingPolicy(recovered.card); if (recovered?.card && !validateCard(recovered.card, { allowIncomplete: true }).length && JSON.stringify(recovered.card) !== JSON.stringify(saved)) { recoveredDraft = recovered; $('#recovery-banner').hidden = false; } } catch {}
  } catch (error) {
    const help = ['127.0.0.1', 'localhost'].includes(location.hostname) ? 'Open start-dashboard.cmd and reload this page.' : 'Reload the page or try again in a moment.';
    $('#panel').innerHTML = `<div class="form-card"><h2>Your card is taking a little longer.</h2><p class="field-help">${e(error.message)} ${help}</p><button class="button secondary" type="button" id="retry-load">Try again</button></div>`;
    $('#retry-load').addEventListener('click', initialise);
    $('#save-status').className = 'save-status error'; $('#save-status').innerHTML = '<i></i>Not connected';
  }
}
initialise();
