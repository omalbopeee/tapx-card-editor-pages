import { applyEditingPolicy, escapeHTML } from './model.js';

export async function createStandaloneHTML(card, readAsset) {
  const exported = applyEditingPolicy(card);
  if (exported.profile.photo === './assets/ovin.jpg') exported.profile.photo = `data:image/jpeg;base64,${await readAsset('assets/ovin.jpg', true)}`;
  let css = await readAsset('assets/original-card.css');
  for (const weight of [400, 600, 750]) css = css.replaceAll(`manrope-${weight}.woff2`, `data:font/woff2;base64,${await readAsset(`assets/manrope-${weight}.woff2`, true)}`);
  css += await readAsset('card-extra.css');
  const model = (await readAsset('model.js')).replaceAll(/^export /gm, '');
  const icons = (await readAsset('icons.js')).replaceAll(/^export /gm, '');
  const renderer = (await readAsset('card.js')).replaceAll(/^import[^\n]+\n/gm, '');
  const embedded = JSON.stringify(exported).replaceAll('<', '\\u003c');
  const title = escapeHTML(`${exported.profile.firstName} ${exported.profile.lastName} | Digital Business Card`);
  const description = escapeHTML([exported.profile.role, exported.profile.department, exported.profile.company].filter(Boolean).join(' · '));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${exported.design.canvas}"><title>${title}</title><meta name="description" content="${description}"><style>${css}</style></head><body><div id="card-root"></div><script>window.EXPORTED_CARD=${embedded};</script><script type="module">${model}\n${icons}\n${renderer}</script></body></html>`;
}
