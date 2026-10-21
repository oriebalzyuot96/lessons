// Orieb G (illustrated, approved art): six pose images shown inside a rounded lavender card.
// The art's lavender background is too close to the lavender blazer for a clean colour key, so the brand card
// keeps the original background instead of cutting her out. Poses cross-fade; a gentle breathing scale runs in CSS.
export const POSES = {
  explaining: 'waving', pointing: 'pointing', thinking: 'thinking', surprised: 'surprised', happy: 'happy', encouraging: 'encouraging',
};
export const POSE_NAMES = Object.keys(POSES);
export const POSE_LABELS_AR = { explaining: 'تشرح', pointing: 'تشير إلى السبورة', thinking: 'تفكّر', surprised: 'متفاجئة', happy: 'سعيدة', encouraging: 'تشجّع' };
const label = p => `المعلمة Orieb G ${POSE_LABELS_AR[p] || ''}`.trim();

// Static markup (build time). root = relative path to the site root; src(p) can override the image URL (films).
export function cardHTML(pose = 'explaining', { root = '{{ROOT}}', src } = {}) {
  const url = p => (src ? src(p) : `${root}assets/img/og/${p}.jpg`);
  return `<figure class="og-card" data-pose="${pose}" role="img" aria-label="${label(pose)}"><div class="og-fig">${POSE_NAMES.map(p =>
    p === pose ? `<img class="on" src="${url(p)}" data-pose="${p}" alt="" width="640" height="640" decoding="async">`
               : `<img data-src="${url(p)}" data-pose="${p}" alt="" width="640" height="640" decoding="async">`).join('')}</div></figure>`;
}

// Browser: cross-fade to another pose (images load on first use).
export function setPose(card, pose) {
  if (!card || !POSES[pose] || card.dataset.pose === pose) return;
  card.dataset.pose = pose;
  card.setAttribute('aria-label', label(pose));
  card.querySelectorAll('img').forEach(img => {
    const on = img.dataset.pose === pose;
    if (on && !img.getAttribute('src')) img.src = img.dataset.src;
    img.classList.toggle('on', on);
  });
}
// Warm the cache for the poses a page will use, after it has loaded.
export function preload(card) {
  if (!card) return;
  const go = () => card.querySelectorAll('img[data-src]').forEach(img => { if (!img.getAttribute('src')) img.src = img.dataset.src; });
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 }); else setTimeout(go, 1500);
}
