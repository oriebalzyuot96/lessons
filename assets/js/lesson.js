// Scene-by-scene lesson stage, F = m·a sandbox, mole conversion map and quizzes. No trackers, no network.
import { setPose, preload } from './orieb-g-card.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
document.documentElement.classList.add('js');

// every inline Orieb G starts from its baked pose
document.querySelectorAll('.og-card').forEach(preload);


/* ───────── stage ───────── */
const stage = document.querySelector('[data-stage]');
if (stage) {
  const scenes = [...stage.querySelectorAll('.scene')];
  const og = stage.querySelector('.teacher .og-card');
  const bubble = stage.querySelector('.teacher .bubble');
  const dots = stage.querySelector('.dots');
  const prev = stage.querySelector('[data-prev]'), next = stage.querySelector('[data-next]');
  const counter = stage.querySelector('.counter');
  const toggle = stage.querySelector('[data-all]');
  let cur = -1;
  scenes.forEach((sc, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.textContent = String(i + 1);
    b.setAttribute('aria-label', `المشهد ${i + 1}: ${sc.querySelector('h2').textContent}`);
    b.addEventListener('click', () => go(i, true));
    li.append(b); dots.append(li);
  });
  const dotBtns = [...dots.querySelectorAll('button')];
  function go(i, fromUser) {
    i = Math.max(0, Math.min(scenes.length - 1, i));
    if (i === cur) return;
    if (cur >= 0) { scenes[cur].classList.remove('is-current'); dotBtns[cur].removeAttribute('aria-current'); dotBtns[cur].classList.add('seen'); }
    cur = i;
    const sc = scenes[i];
    void sc.offsetWidth;
    sc.classList.add('is-current');
    dotBtns[i].setAttribute('aria-current', 'step');
    const say = sc.querySelector('.say').textContent.trim();
    bubble.textContent = say;
    setPose(og, sc.dataset.pose || 'explaining');
    prev.disabled = i === 0; next.disabled = i === scenes.length - 1;
    counter.textContent = `المشهد ${i + 1} من ${scenes.length}`;
    if (fromUser) {
      history.replaceState(null, '', '#' + sc.id);
      const top = stage.getBoundingClientRect().top;
      if (top < 0) stage.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  prev.addEventListener('click', () => go(cur - 1, true));
  next.addEventListener('click', () => go(cur + 1, true));
  stage.addEventListener('keydown', e => {
    if (e.target.closest('input,select,textarea')) return;
    const rtl = getComputedStyle(stage).direction === 'rtl';
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) { go(cur + 1, true); e.preventDefault(); }
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { go(cur - 1, true); e.preventDefault(); }
    else if (e.key === 'Home' && e.target.closest('.stage-nav')) { go(0, true); e.preventDefault(); }
    else if (e.key === 'End' && e.target.closest('.stage-nav')) { go(scenes.length - 1, true); e.preventDefault(); }
  });
  toggle.addEventListener('click', () => {
    const all = stage.classList.toggle('show-all');
    toggle.setAttribute('aria-pressed', String(all));
    toggle.textContent = all ? 'عرض المشاهد واحداً واحداً' : 'عرض الدرس كاملاً';
    scenes.forEach(s => s.classList.toggle('is-current', all || s === scenes[cur]));
  });
  const fromHash = scenes.findIndex(s => '#' + s.id === location.hash);
  go(fromHash >= 0 ? fromHash : 0, false);
}

/* ───────── number formatting ───────── */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const trim = s => s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
export function num(x, dp = 2) { return trim(x.toFixed(dp)); }
export function sci(x, sig = 4) {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 5) return trim(x.toPrecision(sig));
  let m = x / 10 ** e, ee = e;
  m = Number(m.toPrecision(sig)); if (Math.abs(m) >= 10) { m /= 10; ee += 1; }
  return `${trim(m.toFixed(sig - 1))} × 10${String(ee).split('').map(c => SUP[c]).join('')}`;
}

/* ───────── F = m·a sandbox ───────── */
document.querySelectorAll('[data-sandbox]').forEach(box => {
  const G = 9.8, MU = 0.2, PX_PER_M = 44, TRACK_M = 10;
  const F = box.querySelector('[name=force]'), M = box.querySelector('[name=mass]'), R = box.querySelector('[name=rough]');
  const out = n => box.querySelector(`[data-out=${n}]`);
  const block = box.querySelector('.sb-block'), fArrow = box.querySelector('.sb-f'), frArrow = box.querySelector('.sb-fr');
  const fLab = box.querySelector('.sb-fl'), frLab = box.querySelector('.sb-frl');
  let a = 0, t0 = performance.now(), raf;
  function update() {
    const f = +F.value, m = +M.value, rough = R.checked;
    const fric = rough ? MU * m * G : 0;
    const moving = f > fric;
    const net = moving ? f - fric : 0;
    a = net / m;
    out('f').textContent = `${f} N`; out('m').textContent = `${num(m, 1)} kg`;
    out('fr').textContent = rough ? `${num(moving ? fric : f, 2)} N` : '0 N';
    out('net').textContent = `${num(net, 2)} N`;
    out('a').textContent = `${num(a, 2)} m/s²`;
    out('v').textContent = `${num(a * 2, 2)} m/s`;
    box.querySelector('.msg').textContent = !rough ? 'سطح أملس: القوة المحصلة تساوي القوة المؤثرة.'
      : moving ? `الاحتكاك الحركي f = μ m g = 0.2 × ${num(m, 1)} × 9.8 = ${num(fric, 2)} N، فالمحصلة F − f.`
      : `القوة ${f} N لا تتغلب على الاحتكاك (${num(fric, 2)} N): يبقى الصندوق ساكناً، والاحتكاك السكوني يساوي ${f} N فالمحصلة صفر.`;
    const fl = Math.max(0, f * 2), frl = rough ? (moving ? fric : f) * 2 : 0;
    fArrow.setAttribute('x2', 150 + fl); fArrow.style.display = f ? '' : 'none'; fLab.setAttribute('x', 160 + fl); fLab.textContent = `F = ${f} N`;
    frArrow.setAttribute('x2', 110 - frl); frArrow.style.display = frl ? '' : 'none'; frLab.setAttribute('x', 100 - frl); frLab.textContent = frl ? `f = ${num(frl / 2, 1)} N` : '';
    const scale = 0.7 + Math.min(m, 20) / 20 * 0.6;
    block.querySelector('rect').setAttribute('transform', `translate(130 180) scale(${num(scale, 3)}) translate(-30 -60)`);
    t0 = performance.now();
    if (reduce.matches) place(0);
  }
  function place(x) { box.querySelector('.sb-move').setAttribute('transform', `translate(${num(x, 1)} 0)`); }
  function tick(now) {
    const t = (now - t0) / 1000, d = 0.5 * a * t * t;
    if (d > TRACK_M || t > 6) t0 = now;
    place(Math.min(d, TRACK_M) * PX_PER_M);
    raf = requestAnimationFrame(tick);
  }
  [F, M, R].forEach(el => el.addEventListener('input', update));
  box.querySelector('[data-restart]').addEventListener('click', () => { t0 = performance.now(); });
  update();
  if (!reduce.matches) raf = requestAnimationFrame(tick);
});

/* ───────── mole conversion map ───────── */
document.querySelectorAll('[data-molemap]').forEach(box => {
  const NA = 6.022e23;
  const sub = box.querySelector('[name=substance]'), unit = box.querySelector('[name=unit]'), val = box.querySelector('[name=value]');
  const node = k => box.querySelector(`[data-node=${k}]`), arrow = k => box.querySelector(`[data-arrow=${k}]`);
  const steps = box.querySelector('.mm-steps');
  function update() {
    const opt = sub.selectedOptions[0], M = +opt.dataset.m, f = opt.dataset.f, kind = opt.dataset.kind;
    let v = parseFloat(val.value);
    box.querySelectorAll('.on').forEach(e => e.classList.remove('on'));
    box.querySelector('[data-out=M]').textContent = `${M} g/mol`;
    if (!(v > 0)) { ['m', 'n', 'N'].forEach(k => node(k).querySelector('b').textContent = '—'); steps.innerHTML = '<li>أدخل عدداً موجباً.</li>'; return; }
    let m, n, N; const L = [];
    const E = s => `<span class="eq">${s}</span>`;
    if (unit.value === 'g') {
      m = v; n = m / M; N = n * NA;
      arrow('mn').classList.add('on'); arrow('nN').classList.add('on');
      L.push(`عدد المولات: ${E(`n = m ÷ M = ${sci(m)} ÷ ${M} = ${sci(n)} mol`)}`);
      L.push(`عدد ${kind}: ${E(`N = n × N<sub>A</sub> = ${sci(n)} × 6.022 × 10²³ = ${sci(N)}`)}`);
    } else if (unit.value === 'mol') {
      n = v; m = n * M; N = n * NA;
      arrow('nm').classList.add('on'); arrow('nN').classList.add('on');
      L.push(`الكتلة: ${E(`m = n × M = ${sci(n)} × ${M} = ${sci(m)} g`)}`);
      L.push(`عدد ${kind}: ${E(`N = n × N<sub>A</sub> = ${sci(n)} × 6.022 × 10²³ = ${sci(N)}`)}`);
    } else {
      N = v * 1e23; n = N / NA; m = n * M;
      arrow('Nn').classList.add('on'); arrow('nm').classList.add('on');
      L.push(`عدد المولات: ${E(`n = N ÷ N<sub>A</sub> = ${sci(N)} ÷ (6.022 × 10²³) = ${sci(n)} mol`)}`);
      L.push(`الكتلة: ${E(`m = n × M = ${sci(n)} × ${M} = ${sci(m)} g`)}`);
    }
    node('m').querySelector('b').textContent = `${sci(m)} g`;
    node('n').querySelector('b').textContent = `${sci(n)} mol`;
    node('N').querySelector('b').textContent = sci(N);
    node({ g: 'm', mol: 'n', p: 'N' }[unit.value]).classList.add('on');
    steps.innerHTML = L.map(s => `<li>${s}</li>`).join('') + `<li>المادة: <span class="eq">${f}</span>، وجسيماتها ${kind}.</li>`;
  }
  [sub, unit, val].forEach(el => el.addEventListener('input', update));
  update();
});

/* ───────── quiz ───────── */
document.querySelectorAll('[data-quiz]').forEach(quiz => {
  const qs = [...quiz.querySelectorAll('.qs > li')];
  const og = quiz.querySelector('.quiz-side .og-card'), bubble = quiz.querySelector('.quiz-side .bubble');
  const score = quiz.querySelector('.score');
  const intro = bubble.textContent;
  let right = 0, done = 0;
  const show = () => { score.textContent = `النتيجة: ${right} من ${qs.length}` + (done < qs.length ? ` (أُجيب عن ${done})` : ''); };
  qs.forEach(li => {
    const opts = [...li.querySelectorAll('.opt')], fb = li.querySelector('.fb');
    opts.forEach(b => b.addEventListener('click', () => {
      const ok = b.hasAttribute('data-ok');
      opts.forEach(o => { o.disabled = true; if (o.hasAttribute('data-ok')) o.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      b.setAttribute('aria-pressed', 'true');
      fb.hidden = false; fb.className = 'fb ' + (ok ? 'ok' : 'no');
      fb.querySelector('.verdict').textContent = ok ? 'إجابة صحيحة!' : 'ليست هذه الإجابة الصحيحة. الإجابة الصحيحة مظلّلة بالأخضر.';
      done++; if (ok) right++; show();
      const line = done === qs.length
        ? (right >= Math.ceil(qs.length * 0.8) ? `رائع! ${right} من ${qs.length}. أنت جاهز للدرس التالي.` : `أنهيت الاختبار: ${right} من ${qs.length}. راجع المشاهد ثم أعد المحاولة، ستتحسن!`)
        : ok ? 'أحسنت! إجابة صحيحة.' : 'لا بأس، اقرأ التفسير وحاول في السؤال التالي.';
      bubble.textContent = line;
      setPose(og, ok ? 'happy' : 'encouraging');
      fb.setAttribute('tabindex', '-1'); fb.focus({ preventScroll: false });
    }));
  });
  quiz.querySelector('[data-reset]').addEventListener('click', () => {
    qs.forEach(li => { li.querySelectorAll('.opt').forEach(o => { o.disabled = false; o.classList.remove('right', 'wrong'); o.removeAttribute('aria-pressed'); }); li.querySelector('.fb').hidden = true; });
    right = 0; done = 0; show(); bubble.textContent = intro; setPose(og, 'thinking');
    qs[0].querySelector('.opt').focus();
  });
  show();
});

/* ───────── landing: Orieb G introduces herself ───────── */
document.querySelectorAll('[data-og-cycle]').forEach(box => {
  const og = box.querySelector('.og-card'), bubble = box.querySelector('.bubble');
  const lines = [...box.querySelectorAll('template[data-line]')].map(t => ({ pose: t.dataset.line, text: t.content.textContent.trim() }));
  if (!lines.length || reduce.matches) return;
  let i = 0, timer;
  const step = () => { i = (i + 1) % lines.length; bubble.textContent = lines[i].text; setPose(og, lines[i].pose); timer = setTimeout(step, 6500); };
  timer = setTimeout(step, 6500);
  box.addEventListener('mouseenter', () => clearTimeout(timer));
  box.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(step, 3000); });
});
