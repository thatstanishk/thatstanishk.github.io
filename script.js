(() => {
'use strict';
const C = window.CONFIG || {};
const SITE = C.site || 'thatstanishk.wordpress.com';
const CITY = C.city || { name: 'Local', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' };
const F = 'ID,title,excerpt,content,date,URL,featured_image,post_thumbnail,categories';
const API = `https://public-api.wordpress.com/rest/v1.1/sites/${SITE}/posts/?number=100&fields=${F}`;
const MUSIC_FILE = '';   // e.g. 'music.mp3' to use your own track
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(pointer: coarse)').matches;
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const root = document.documentElement;
let posts = [], urlMap = new Map(), query = '', showAll = false, LED = [];
const live = {};
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plain = html => new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim();
const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
const ym = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const sized = u => (/wordpress\.com|wp\.com/.test(u) && !u.includes('?')) ? u + '?w=1000' : u;
const short = t => t.length > 32 ? t.slice(0, 31) + '…' : t;
const norm = u => u.replace(/^https?:\/\//, '').split(/[?#]/)[0].replace(/\/$/, '');
const rx = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ap = s => String(s).replace(/[\u2018\u2019]/g, "'");
const J = u => fetch(u, { signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

/* ---------- pixel sprites ---------- */
const PAL = { k: 'var(--ink)', w: 'var(--surface)', r: 'var(--accent)', W: '#ffffff' };
const SPR = {
  butterfly: ['.kkk.....kkk.', 'kwwwk.k.kwwwk', 'kwrrwkkkwrrwk', 'kwwwwkkkwwwwk', '.kwwkkkkkwwk.', '..kkk.k.kkk..', '.kwwk.k.kwwk.', '..kk..k..kk..'],
  sparkle: ['....k....', '....k....', '...kkk...', 'kkkkrkkkk', '...kkk...', '....k....', '....k....'],
  heart: ['..kk.kk..', '.krrkrrk.', 'krrrrrrrk', 'krrrrrrrk', '.krrrrrk.', '..krrrk..', '...krk...', '....k....'],
  arrow: ['k........', 'kk.......', 'kWk......', 'kWWk.....', 'kWWWk....', 'kWWWWk...', 'kWWWWWk..', 'kWWWkkkk.', 'kWkWk....', 'kk.kWk...', 'k..kWk...', '....kk...']
};
function sprite(name, scale = 1, over = {}) {
  const map = SPR[name], pal = { ...PAL, ...over }, w = map[0].length, h = map.length;
  let r = '';
  map.forEach((row, y) => { for (let x = 0; x < w; x++) { const c = row[x]; if (c !== '.' && pal[c]) r += `<rect x="${x}" y="${y}" width="1" height="1" style="fill:${pal[c]}"/>`; } });
  const size = scale > 1 ? ` width="${w * scale}" height="${h * scale}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${size} shape-rendering="crispEdges">${r}</svg>`;
}
function setCursors() {
  const mk = (over, fb) => `url("data:image/svg+xml,${encodeURIComponent(sprite('arrow', 2, over))}") 0 0, ${fb}`;
  root.style.setProperty('--cursor', mk({ k: '#141413', W: '#ffffff' }, 'auto'));
  root.style.setProperty('--cursor-hand', mk({ k: '#141413', W: '#E8B4B0' }, 'pointer'));
}
function butterflies() {
  $('#sprites').innerHTML = [[16, 50, 0, 52], [58, 64, -26, 40]]
    .map(([t, d, dl, w]) => `<div class="bf" style="--t:${t}%;--dur:${d}s;--dl:${dl}s;width:${w}px"><div class="flap">${sprite('butterfly')}</div></div>`).join('');
}

/* ---------- AUDIO (synthesised, no files) ---------- */
const A = { ctx: null, master: null, on: false, bus: null, lp: null, dl: null, timer: 0, next: 0, bar: 0, el: null, lastHover: 0 };
function actx() {
  if (!A.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    A.ctx = new AC(); A.master = A.ctx.createGain(); A.master.gain.value = .9; A.master.connect(A.ctx.destination);
  }
  if (A.ctx.state === 'suspended') A.ctx.resume();
  return A.ctx;
}
const hz = m => 440 * 2 ** ((m - 69) / 12);
function tone(f, { t = 0, d = .1, type = 'square', v = .05, to = 0 } = {}) {
  if (!A.on) return; const c = actx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), s = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, s);
  if (to) o.frequency.exponentialRampToValueAtTime(to, s + d);
  g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(.0001, s + d);
  o.connect(g); g.connect(A.master); o.start(s); o.stop(s + d + .02);
}
const SFX = {
  tap: () => { tone(520, { d: .06, v: .04 }); tone(780, { t: .05, d: .08, v: .03 }); },
  hover: () => tone(1500, { d: .025, type: 'triangle', v: .012 }),
  open: () => [392, 523, 659].forEach((f, i) => tone(f, { t: i * .06, d: .13, v: .035 })),
  toggle: () => { tone(440, { d: .07 }); tone(660, { t: .07, d: .1 }); }
};
const sfx = n => { if (A.on && SFX[n]) SFX[n](); };
const BAR = 6;
const PROG = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 66]];
const PENT = [69, 72, 74, 76, 79, 81];
function playBar(t) {
  const c = A.ctx, ch = PROG[A.bar % PROG.length];
  ch.forEach(m => [-5, 5].forEach(det => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = hz(m); o.detune.value = det;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + 2); g.gain.linearRampToValueAtTime(0, t + BAR + 1.5);
    o.connect(g); g.connect(A.lp); o.start(t); o.stop(t + BAR + 1.6);
  }));
  const ob = c.createOscillator(), gb = c.createGain();
  ob.type = 'sine'; ob.frequency.value = hz(ch[0] - 12);
  gb.gain.setValueAtTime(0, t); gb.gain.linearRampToValueAtTime(.12, t + .6); gb.gain.linearRampToValueAtTime(0, t + BAR + .8);
  ob.connect(gb); gb.connect(A.bus); ob.start(t); ob.stop(t + BAR + .9);
  for (let i = 0; i < 4; i++) {
    if (Math.random() > .75) continue;
    const s = t + i * (BAR / 4) + Math.random() * .2, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = hz(PENT[Math.random() * PENT.length | 0]);
    g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.07, s + .01); g.gain.exponentialRampToValueAtTime(.0001, s + 1.6);
    o.connect(g); g.connect(A.bus); g.connect(A.dl); o.start(s); o.stop(s + 1.7);
  }
}
function musicStart() {
  if (MUSIC_FILE) {
    if (!A.el) { A.el = new Audio(MUSIC_FILE); A.el.loop = true; A.el.volume = .45; }
    A.el.play().catch(() => {}); return;
  }
  const c = actx(); if (!c || A.bus) return;
  const bus = c.createGain(); bus.gain.setValueAtTime(0, c.currentTime); bus.gain.linearRampToValueAtTime(.55, c.currentTime + 3);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
  const dl = c.createDelay(2); dl.delayTime.value = .5;
  const fb = c.createGain(); fb.gain.value = .38; const wet = c.createGain(); wet.gain.value = .6;
  dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(bus); lp.connect(bus); bus.connect(A.master);
  Object.assign(A, { bus, lp, dl, next: c.currentTime + .1, bar: 0 });
  const pump = () => { while (A.next < c.currentTime + 2) { playBar(A.next); A.next += BAR; A.bar++; } };
  pump(); A.timer = setInterval(pump, 500);
}
function musicStop() {
  if (A.el) A.el.pause();
  if (!A.bus) return;
  const c = A.ctx, b = A.bus; clearInterval(A.timer); A.bus = null;
  b.gain.cancelScheduledValues(c.currentTime); b.gain.setValueAtTime(b.gain.value, c.currentTime); b.gain.linearRampToValueAtTime(0, c.currentTime + .8);
  setTimeout(() => b.disconnect(), 1000);
}
function setSound(on) {
  A.on = on;
  const b = $('#snd'); b.textContent = on ? '♪ Sound on' : '♪ Sound off'; b.setAttribute('aria-pressed', String(on));
  if (on) { actx(); musicStart(); SFX.toggle(); } else musicStop();
}
document.addEventListener('visibilitychange', () => {
  if (!A.ctx || !A.on) return;
  if (document.hidden) { A.ctx.suspend(); if (A.el) A.el.pause(); }
  else { A.ctx.resume(); if (A.el) A.el.play().catch(() => {}); }
});

/* ---------- HAPTICS ---------- */
let hapOn = store.get('hap') !== 'off', sw = null;
const PAT = { tap: 12, open: [14, 40, 22], toggle: [8, 30, 8] };
function iosTick() {
  if (!sw) {
    sw = document.createElement('label'); sw.setAttribute('aria-hidden', 'true');
    sw.style.cssText = 'position:fixed;left:-9999px;opacity:0;pointer-events:none';
    sw.innerHTML = '<input type="checkbox" switch>'; document.body.appendChild(sw);
  }
  sw.click();
}
function buzz(kind = 'tap') {
  if (!hapOn || !COARSE) return;
  if (navigator.vibrate) { navigator.vibrate(PAT[kind]); return; }
  try { iosTick(); if (kind === 'open') setTimeout(iosTick, 80); } catch {}
}
const hb = $('#hap');
hb.hidden = !COARSE;
const paintHap = () => { hb.textContent = hapOn ? 'Haptics on' : 'Haptics off'; };
paintHap();
hb.addEventListener('click', () => { hapOn = !hapOn; store.set('hap', hapOn ? 'on' : 'off'); paintHap(); if (hapOn) buzz('toggle'); });

const TARGET = 'a,button,.card,.row,.chip,.btn';
document.addEventListener('click', e => {
  const t = e.target.closest(TARGET); if (!t || t.closest('#gate,#snd')) return;
  if (t.classList.contains('card-link') || t.classList.contains('row')) { sfx('open'); buzz('open'); } else { sfx('tap'); buzz('tap'); }
});
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return;
  const t = e.target.closest(TARGET); if (!t || t.contains(e.relatedTarget)) return;
  const n = performance.now(); if (n - A.lastHover < 70) return; A.lastHover = n; sfx('hover');
});
$('#snd').addEventListener('click', () => { setSound(!A.on); buzz('toggle'); });

/* ---------- entrance gate ---------- */
const gate = $('#gate');
function enter(withSound) {
  try { sessionStorage.setItem('gate', '1'); } catch {}
  setSound(withSound); buzz('open');
  gate.classList.add('out'); setTimeout(() => { gate.hidden = true; }, 550);
}
$('#gateArt').innerHTML = sprite('butterfly');
$('#gOn').addEventListener('click', () => enter(true));
$('#gOff').addEventListener('click', () => enter(false));
let seen = false; try { seen = !!sessionStorage.getItem('gate'); } catch {}
if (seen) { gate.hidden = true; setSound(false); } else { setSound(false); $('#gOn').focus(); }

/* ---------- socials ---------- */
function socialLinks() {
  const out = [];
  Object.entries(C.social || {}).forEach(([k, v]) => { if (v) out.push([k, k === 'Email' && !/^mailto:/.test(v) ? 'mailto:' + v : v]); });
  out.push(['Subscribe', `https://${SITE}`], ['RSS', `https://${SITE}/feed/`]);
  return out;
}

/* ---------- full-screen menu ---------- */
const menu = $('#menu'), menuBtn = $('#menuBtn');
function openMenu() {
  const M = [
    ['#/', 'Home', 'The latest dispatches'],
    ['#/archive', 'Writing', `${posts.length || ''} dispatches, numbered`],
    ['#/about', 'About', 'Who writes this, and from where'],
    ['#/transparency', 'Transparency', 'Where I stand on the companies I write about'],
    ['#/social', 'Social', 'Where else to find me']
  ];
  $('#menuList').innerHTML = M.map(([h, t, d], i) => `<a href="${h}"><span class="mn">0${i + 1}</span><span class="mt">${t}</span><span class="md">${esc(d)}</span></a>`).join('');
  $('#menuFoot').innerHTML = socialLinks().map(([k, h]) => `<a class="btn small" href="${esc(h)}" target="_blank" rel="noopener">${esc(k)} ↗</a>`).join('');
  menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open'));
  menuBtn.setAttribute('aria-expanded', 'true'); $('#menuClose').focus();
}
function closeMenu() {
  if (menu.hidden) return;
  menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');
  setTimeout(() => { menu.hidden = true; }, 300);
}
menuBtn.addEventListener('click', openMenu);
$('#menuClose').addEventListener('click', closeMenu);
menu.addEventListener('click', e => { if (e.target.closest('#menuList a')) closeMenu(); });
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!gate.hidden) enter(false); else closeMenu();
});

/* ---------- click burst ---------- */
const cv = $('#fx'), ctx = cv.getContext('2d');
let parts = [], raf = 0;
const fxc = () => root.dataset.theme === 'day' ? ['#9E2A2B', '#6E6D68', '#141413'] : ['#E0705F', '#9A978E', '#EDEBE4'];
const fit = () => { cv.width = innerWidth; cv.height = innerHeight; };
fit(); addEventListener('resize', fit);
function loop() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--;
    ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.c;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
  }
  ctx.globalAlpha = 1;
  raf = parts.length ? requestAnimationFrame(loop) : 0;
}
const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
let lastT = 0;
addEventListener('pointermove', e => {
  if (REDUCED || e.pointerType !== 'mouse') return;
  const t = performance.now(); if (t - lastT < 40) return; lastT = t;
  const Cs = fxc();
  parts.push({ x: e.clientX + Math.random() * 8 - 4, y: e.clientY + Math.random() * 8 - 4, vx: Math.random() - .5, vy: Math.random() * 1.2, g: .04, s: 4, c: Cs[Math.random() * 3 | 0], life: 22, max: 22 });
  kick();
});
addEventListener('click', e => {
  if (REDUCED) return;
  const Cs = fxc();
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, s = Math.random() * 3.5 + 1, life = 36 + Math.random() * 18 | 0;
    parts.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, g: .16, s: 4, c: Cs[i % 3], life, max: life });
  }
  kick();
});

/* ---------- card tilt ---------- */
app.addEventListener('pointermove', e => {
  if (REDUCED || e.pointerType !== 'mouse') return;
  const c = e.target.closest('.card'); if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--rx', ((e.clientX - r.left) / r.width - .5) * 6 + 'deg');
  c.style.setProperty('--ry', -((e.clientY - r.top) / r.height - .5) * 6 + 'deg');
});
app.addEventListener('pointerout', e => {
  const c = e.target.closest && e.target.closest('.card');
  if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); }
});

/* ---------- scroll progress + reveal ---------- */
const bar = $('#progress');
addEventListener('scroll', () => {
  const m = root.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${m > 0 ? scrollY / m : 0})`;
}, { passive: true });
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { const el = e.target; setTimeout(() => el.classList.add('in'), (el._i || 0) % 4 * 90); io.unobserve(el); }
}), { threshold: .08 });
const observe = r => r.querySelectorAll('.reveal:not(.in)').forEach((el, i) => { el._i = i; io.observe(el); });

/* ---------- typewriter ---------- */
function typer(el, lines) {
  if (!el) return;
  if (REDUCED) { el.textContent = lines[0]; return; }
  let i = 0, j = 0, del = false;
  (function tick() {
    if (!el.isConnected) return;
    const s = lines[i];
    el.textContent = s.slice(0, j);
    if (!del && j === s.length) { del = true; return setTimeout(tick, 1800); }
    if (del && j === 0) { del = false; i = (i + 1) % lines.length; }
    j += del ? -1 : 1;
    setTimeout(tick, del ? 22 : 55);
  })();
}

/* ---------- LIVE DATA: clocks, weather, markets, ticker ---------- */
function tickClock() {
  const d = new Date();
  $('#tbDate').textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: CITY.tz });
  $('#tbTime').textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: CITY.tz });
  document.querySelectorAll('[data-tz]').forEach(el => {
    try {
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: el.dataset.tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' }).formatToParts(d);
      const g = t => (p.find(x => x.type === t) || {}).value || '';
      el.querySelector('.ck-t').textContent = `${g('hour')}:${g('minute')}`;
      el.querySelector('.ck-z').textContent = g('timeZoneName');
    } catch {}
  });
}
const wmo = c => c === 0 ? 'Clear' : c <= 2 ? 'Partly cloudy' : c === 3 ? 'Overcast' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Showers' : c <= 86 ? 'Snow showers' : 'Thunderstorm';
const aqiWord = a => a <= 50 ? 'Good' : a <= 100 ? 'Moderate' : a <= 150 ? 'Poor for sensitive groups' : a <= 200 ? 'Unhealthy' : a <= 300 ? 'Very unhealthy' : 'Hazardous';
function moon() {
  const syn = 29.530588853, age = (((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % syn + syn) % syn;
  return ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'][Math.floor(age / syn * 8 + .5) % 8];
}
function paintTicker() {
  const p = [], r = live.fx;
  if (live.wx) p.push(`<span class="tk">${esc(CITY.name)}</span>${live.wx.t}°C ${esc(live.wx.d)}`);
  if (live.sun) p.push(`Sunrise ${live.sun[0]} · Sunset ${live.sun[1]}`);
  if (live.aqi != null) p.push(`Air quality AQI ${live.aqi} ${aqiWord(live.aqi)}`);
  if (r && r.INR) {
    p.push(`<span class="tk">USD/INR</span>${r.INR.toFixed(2)}`);
    if (r.EUR) p.push(`<span class="tk">EUR/INR</span>${(r.INR / r.EUR).toFixed(2)}`);
    if (r.GBP) p.push(`<span class="tk">GBP/INR</span>${(r.INR / r.GBP).toFixed(2)}`);
  }
  if (live.btc) {
    const ch = live.btc.usd_24h_change || 0;
    p.push(`<span class="tk">BTC</span>$${Math.round(live.btc.usd).toLocaleString('en-US')} ${ch < 0 ? '▼' : '▲'} ${Math.abs(ch).toFixed(1)}%`);
  }
  p.push(`Moon: ${moon()}`);
  if (posts[0]) {
    const days = Math.max(0, Math.floor((Date.now() - posts[0].date) / 864e5));
    p.push(`<span class="tk">Latest</span>${esc(posts[0].title)}`);
    p.push(`${posts.length} dispatches since ${Math.min(...posts.map(x => x.date.getFullYear()))} · last one ${days} days ago`);
  }
  const unit = p.join('<i>◆</i>') + '<i>◆</i>';
  const t = $('#ticker'); t.innerHTML = unit.repeat(2) + unit.repeat(2);
  t.style.animationDuration = Math.max(50, t.textContent.length * .05) + 's';
}
async function loadLive() {
  const { lat, lon } = CITY;
  await Promise.allSettled([
    J(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=1`)
      .then(d => { live.wx = { t: Math.round(d.current.temperature_2m), d: wmo(d.current.weather_code) }; live.sun = [d.daily.sunrise[0].slice(11, 16), d.daily.sunset[0].slice(11, 16)]; }),
    J(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)
      .then(d => { if (d.current && d.current.us_aqi != null) live.aqi = Math.round(d.current.us_aqi); }),
    J('https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR,EUR,GBP').then(d => { live.fx = d.rates; }),
    J('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true').then(d => { live.btc = d.bitcoin; })
  ]);
  $('#tbWx').textContent = live.wx ? `${CITY.name} ${live.wx.t}°C · ${live.wx.d}` : CITY.name;
  paintTicker();
}

/* ---------- data ---------- */
function normalize(p) {
  const text = plain(p.content);
  return {
    id: p.ID,
    title: plain(p.title) || 'Untitled',
    excerpt: plain(p.excerpt).replace(/Continue reading.*$/i, '').trim(),
    content: p.content || '', text,
    date: new Date(p.date), url: p.URL,
    img: (p.post_thumbnail && p.post_thumbnail.URL) || p.featured_image || '',
    cats: Object.keys(p.categories || {}).filter(c => c.toLowerCase() !== 'uncategorized'),
    mins: Math.max(1, Math.round(text.split(/\s+/).length / 200))
  };
}
function clean(html) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  d.querySelectorAll('script,style,object,embed').forEach(n => n.remove());
  d.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name)) n.removeAttribute(a.name); }));
  d.querySelectorAll('a[href]').forEach(a => { if (!a.getAttribute('href').startsWith('#')) { a.target = '_blank'; a.rel = 'noopener'; } });
  d.querySelectorAll('img').forEach(i => { i.loading = 'lazy'; });
  return d.body.innerHTML;
}
const catCounts = () => {
  const m = new Map();
  posts.forEach(p => p.cats.forEach(c => m.set(c, (m.get(c) || 0) + 1)));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

/* ---------- TRANSPARENCY ENGINE ---------- */
const REL = {
  employer: ['Current employer', 'I work for this company.'],
  former: ['Former employer', 'I used to work for this company.'],
  alumni: ['Alma mater', 'I studied here.'],
  volunteer: ['Past role', 'I held an unpaid or student role here.'],
  holding: ['Financial interest', 'I hold shares or another financial stake.'],
  customer: ['Customer', 'I am a customer or user of this company.'],
  family: ['Close connection', 'A family member or close friend works for or invests in it.'],
  none: ['No relationship', 'I have checked: no financial or personal relationship.'],
  other: ['Other', 'See note.']
};
const SUFFIX = /\b(?:[A-Z][\w&'-]*\s+){1,3}(?:Inc|Ltd|Limited|Corp|Corporation|LLC|plc|PLC|Holdings|Group)\b\.?/g;
function buildLedger() {
  LED = (C.ledger || []).map(e => ({ ...e, re: new RegExp('\\b(?:' + [e.name, ...(e.aliases || [])].filter(Boolean).map(s => rx(ap(s))).join('|') + ')(?!\\w)', 'g') }));
}
function analyse(p) {
  const hay = ap(p.title + '\n' + p.text);
  p.hits = LED.map(e => ({ e, n: (hay.match(e.re) || []).length })).filter(x => x.n);
  const un = new Set();
  for (const m of hay.matchAll(SUFFIX)) {
    const nm = m[0].replace(/^(The|A|An|In|Of|And|But|At|On|By|For|With|To)\s+/, '').replace(/\.$/, '').trim();
    if (nm && !LED.some(e => nm.match(e.re))) un.add(nm);
  }
  p.unlisted = [...un].slice(0, 6);
}
const relOf = e => REL[e.type] || REL.other;
function disclosure(p) {
  let h = `<section class="disc" id="disc"><div class="disc-head"><span class="px">Transparency</span><span class="auto">Auto-generated for this article</span></div>`;
  if (p.hits.length) {
    h += '<ul class="disc-list">' + p.hits.map(({ e, n }) => {
      const r = relOf(e);
      return `<li><div class="disc-name">${esc(e.name)}<small>named ${n}×</small></div>
        <div><b>${esc(r[0])}.</b> ${esc(e.note || r[1])}</div>
        ${e.stance ? `<div class="disc-stance">${esc(e.stance)}</div>` : ''}
        <div class="disc-asof">On record since ${esc(e.since || 'n/a')}</div></li>`;
    }).join('') + '</ul>';
  } else h += '<p>No company in my disclosure ledger is named in this piece.</p>';
  if (p.unlisted.length) h += `<p><b>Also named, not in my ledger:</b> ${p.unlisted.map(esc).join(', ')}. No declaration is on file for these. Read that as "unchecked", not "none".</p>`;
  if ((C.standing || []).length) h += '<ul class="disc-stand">' + C.standing.map(s => `<li>${esc(s)}</li>`).join('') + '</ul>';
  return h + `<p class="disc-foot">Ledger reviewed ${esc(C.ledgerUpdated || 'n/a')} · <a href="#/transparency">How this works</a></p></section>`;
}

/* ---------- views ---------- */
const badge = c => `<span class="badge">${esc(c)}</span>`;
function thumb(p, i) {
  return p.img
    ? `<div class="thumb"><img loading="lazy" alt="" src="${esc(sized(p.img))}"></div>`
    : `<div class="thumb ph">${sprite(['butterfly', 'sparkle', 'heart'][i % 3])}</div>`;
}
function card(p, i, cls = '') {
  return `<article class="card reveal ${cls}">
    <a class="card-link" href="#/post/${p.id}" aria-label="${esc(p.title)}"></a>
    ${thumb(p, i)}
    <div class="body">
      <div class="badges">${p.cats.map(badge).join('')}</div>
      <h3>${esc(p.title)}</h3>
      <p class="ex">${esc(p.excerpt)}</p>
      <p class="meta">${fmt(p.date)} · ${p.mins} min read</p>
    </div></article>`;
}
const rowHtml = p => `<a class="row" href="#/post/${p.id}"><span class="no">${String(p.no).padStart(2, '0')}</span><time>${ym(p.date)}</time><span class="ttl">${esc(p.title)}</span><span class="cat">${esc(p.cats[0] || '')}</span></a>`;

function renderIndex(cat) {
  const q = query.trim().toLowerCase();
  const list = posts.filter(p => (!cat || p.cats.includes(cat)) && (!q || (p.title + ' ' + p.excerpt).toLowerCase().includes(q)));
  const box = $('#results');
  if (!list.length) { box.innerHTML = '<div class="empty">No results<br><small>Try another word</small></div>'; return; }
  const lim = (!q && !cat && !showAll) ? 10 : list.length;
  let html = '', yr = '';
  list.slice(0, lim).forEach(p => {
    const y = p.date.getFullYear();
    if (y !== yr) { html += `<h3 class="yr">${y}</h3>`; yr = y; }
    html += rowHtml(p);
  });
  box.innerHTML = `<div class="idx">${html}</div>` + (lim < list.length ? `<button class="btn" id="more" type="button">Show all ${list.length} ↓</button>` : '');
  const more = $('#more'); if (more) more.addEventListener('click', () => { showAll = true; renderIndex(cat); });
}
function renderHome(cat) {
  document.title = cat ? `${cat} · Tanishk's Blog` : "Tanishk's Blog";
  let top = '';
  if (!cat) {
    top = `<div class="banner">
      <div class="banner-copy">
        <p class="kick">Kumar Tanishk · Bengaluru</p>
        <h1>Reports,<br>explainers &amp;<br>opinion.</h1>
        <div class="typer" id="typer"></div>
      </div>
      <div class="banner-art" aria-hidden="true">
        <span class="spr" style="top:6%;right:8%;width:96px">${sprite('butterfly')}</span>
        <span class="spr" style="bottom:8%;right:46%;width:30px;animation-delay:-1.5s">${sprite('sparkle')}</span>
        <span class="spr" style="top:48%;right:2%;width:22px;animation-delay:-3s">${sprite('sparkle')}</span>
      </div></div>`;
    if (posts.length) {
      const [lead, ...rest] = posts;
      top += `<h2 class="section-title">In focus</h2>${card(lead, 0, 'lead')}`;
      if (rest.length) top += `<h2 class="section-title">Latest dispatches</h2><div class="grid">${rest.slice(0, 6).map((p, i) => card(p, i + 1)).join('')}</div>`;
    }
  }
  app.innerHTML = `<section class="wrap">${top}
    <h2 class="section-title" id="index">${cat ? esc(cat) : 'Writing index'}</h2>
    <div class="chips">
      <a class="chip ${!cat ? 'on' : ''}" href="#/">All (${posts.length})</a>
      ${catCounts().map(([c, n]) => `<a class="chip ${c === cat ? 'on' : ''}" href="#/cat/${encodeURIComponent(c)}">${esc(c)} (${n})</a>`).join('')}
    </div>
    <input id="q" class="search" type="search" placeholder="SEARCH THE INDEX…" value="${esc(query)}" autocomplete="off">
    <div id="results"></div></section>`;
  $('#q').addEventListener('input', e => { query = e.target.value; renderIndex(cat); });
  renderIndex(cat);
  typer($('#typer'), ['Reportage from the ground.', 'Explainers on how politics works.', 'Opinion, argued in full.']);
}
function renderPost(id) {
  const i = posts.findIndex(p => p.id === id);
  if (i < 0) return renderHome(null);
  const p = posts[i], older = posts[i + 1], newer = posts[i - 1];
  document.title = `${p.title} · Tanishk's Blog`;
  const hero = p.img && !p.content.includes(p.img.split('?')[0]);
  const dtxt = `${p.hits.length ? p.hits.length + ' on record' : 'none on record'}${p.unlisted.length ? ' · ' + p.unlisted.length + ' unchecked' : ''}`;
  app.innerHTML = `<article class="post">
    <a class="btn small" href="#/">◄ Back</a>
    <div class="badges" style="margin-top:1.2rem">${p.cats.map(badge).join('')}</div>
    <h1>${esc(p.title)}</h1>
    <p class="meta"><span>${fmt(p.date)} · ${p.mins} min read · № ${p.no}</span><button class="chipbtn" type="button" data-go="#disc">Disclosures: ${dtxt}</button></p>
    ${hero ? `<div class="thumb"><img alt="" src="${esc(sized(p.img))}"></div>` : ''}
    <div class="prose">${clean(p.content)}</div>
    <div class="endmark" aria-hidden="true">${sprite('sparkle')}</div>
    ${disclosure(p)}
    <div class="pager">
      ${older ? `<a class="btn small" href="#/post/${older.id}">◄ ${esc(short(older.title))}</a>` : '<span></span>'}
      ${newer ? `<a class="btn small" href="#/post/${newer.id}">${esc(short(newer.title))} ►</a>` : '<span></span>'}
    </div>
    <p class="orig"><a href="${esc(p.url)}" target="_blank" rel="noopener">View original on WordPress ↗</a></p>
  </article>`;
}

/* ----- About (from config.js) ----- */
const tlRows = list => (list || []).map((t, i) => `<div class="tl-i"><span class="no">${String(i + 1).padStart(2, '0')}</span><time>${esc(t.when)}</time>
  <div class="tb"><div class="r">${esc(t.role)}</div><div class="o">${esc(t.org)}</div>${t.note ? `<p class="n">${esc(t.note)}</p>` : ''}</div></div>`).join('');
function renderAbout() {
  document.title = "About · Tanishk's Blog";
  const A = C.about || {};
  const first = posts.length ? Math.min(...posts.map(p => p.date.getFullYear())) : '';
  app.innerHTML = `<section class="page"><p class="kick">About</p><h1>${esc(A.name || 'About')}</h1><p class="role">${esc(A.role || '')}</p>
    <div class="about"><div>
      ${(A.intro || []).map((t, i) => `<p class="${i ? '' : 'lede'}">${esc(t)}</p>`).join('')}
      <h2 class="sub">Where I've worked</h2><div class="tl">${tlRows(A.timeline)}</div>
      <h2 class="sub">Education</h2><div class="tl">${tlRows(A.education)}</div>
      ${(A.skills || []).length ? `<h2 class="sub">Skills</h2><div class="skills">${A.skills.map(s => `<span class="pill">${esc(s)}</span>`).join('')}</div>` : ''}
    </div>
    <aside>
      <figure class="portrait"><img src="${esc(C.portrait || 'portrait.png')}" alt="Portrait of ${esc(A.name || 'the author')}" onerror="this.closest('figure').remove()"></figure>
      <dl class="facts">
        <div><dt>Based in</dt><dd>${esc(CITY.name)}, India</dd></div>
        <div><dt>Day job</dt><dd>Reuters</dd></div>
        <div><dt>Writing here since</dt><dd>${first}</dd></div>
        <div><dt>Dispatches</dt><dd>${posts.length}</dd></div>
        <div><dt>Sections</dt><dd>${esc(catCounts().map(c => c[0]).join(', ') || 'n/a')}</dd></div>
        ${A.languages ? `<div><dt>Languages</dt><dd>${esc(A.languages)}</dd></div>` : ''}
      </dl>
    </aside></div></section>`;
}
function renderSocial() {
  document.title = "Social · Tanishk's Blog";
  const links = socialLinks().map(([k, h]) => `<a class="lr" href="${esc(h)}" target="_blank" rel="noopener"><b>${esc(k)}</b><small>${esc(h.replace(/^mailto:|^https?:\/\//, ''))}</small><span>↗</span></a>`).join('');
  app.innerHTML = `<section class="page"><p class="kick">Social</p><h1>Find me elsewhere.</h1><p class="role">Links open in a new tab</p><div>${links}</div></section>`;
}
function renderTransparency() {
  document.title = "Transparency · Tanishk's Blog";
  const withD = posts.filter(p => p.hits.length).length;
  const rows = LED.length ? LED.map(e => {
    const r = relOf(e), arts = posts.filter(p => p.hits.some(h => h.e === e));
    return `<tr><td>${esc(e.name)}</td><td><span class="pill">${esc(r[0])}</span></td><td>${esc(e.note || r[1])}${e.stance ? `<br><em>${esc(e.stance)}</em>` : ''}</td><td>${esc(e.since || '')}</td><td>${arts.length ? arts.map(p => `<a href="#/post/${p.id}">№${p.no}</a>`).join('') : '<span class="meta">none yet</span>'}</td></tr>`;
  }).join('') : '<tr><td colspan="5">The ledger is empty. Add entries in config.js.</td></tr>';
  const by = posts.map(p => `<a class="ba" href="#/post/${p.id}"><span class="no">№${p.no}</span><span class="bt">${esc(p.title)}</span><span class="bc">${
    p.hits.map(h => `<span class="pill">${esc(h.e.name)} · ${esc(relOf(h.e)[0])}</span>`).join('') +
    p.unlisted.map(n => `<span class="pill un">${esc(n)} · unchecked</span>`).join('') ||
    '<span class="meta">No companies detected</span>'}</span></a>`).join('');
  app.innerHTML = `<section class="page"><p class="kick">Transparency</p><h1>Where I stand.</h1>
    <p class="lede">Writing is more honest when readers know where the writer stands. This page is my public record of my relationships with the companies I write about. It updates itself every time I publish.</p>
    <h2 class="sub">How it works</h2>
    <ol class="steps">
      <li>I keep a public ledger of companies I work for, used to work for, hold a stake in, or am otherwise connected to.</li>
      <li>Every article is scanned for those names. A disclosure is attached to it automatically, and it appears on the article page.</li>
      <li>Company-style names that are <em>not</em> in my ledger are flagged "unchecked", so silence is never presented as a clean bill of health.</li>
    </ol>
    ${(C.standing || []).length ? `<h2 class="sub">Standing statements</h2><ul class="steps">${C.standing.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    <h2 class="sub">The ledger · reviewed ${esc(C.ledgerUpdated || 'n/a')}</h2>
    <div class="tblw"><table class="tbl"><thead><tr><th>Company</th><th>Relationship</th><th>Note</th><th>Since</th><th>Articles</th></tr></thead><tbody>${rows}</tbody></table></div>
    <h2 class="sub">By article · ${withD} of ${posts.length} name a company on the ledger</h2>
    <div>${by}</div></section>`;
}

/* ---------- footer ---------- */
function buildFooter() {
  const ck = (C.clocks || []).map(c => `<div class="ck" data-tz="${esc(c.tz)}"><span>${esc(c.label)}</span><span class="ck-t"></span><span class="ck-z"></span></div>`).join('');
  const so = socialLinks().map(([k, h]) => `<a class="lk" href="${esc(h)}" target="_blank" rel="noopener">${esc(k)} ↗</a>`).join('');
  $('#foot').innerHTML = `<div class="wrap"><div class="foot-grid">
    <div><h4>Tanishk's Blog</h4><p class="foot-p">Reports, explainers and political opinion from Bengaluru.</p><a class="btn small" href="https://${SITE}" target="_blank" rel="noopener">Subscribe ↗</a></div>
    <div><h4>Elsewhere</h4>${so}</div>
    <div><h4>Local time</h4>${ck}</div>
    <div><h4>Read</h4><a class="lk" href="#/archive">Writing index</a><a class="lk" href="#/about">About</a><a class="lk" href="#/transparency">Transparency ledger</a></div>
  </div>
  <div class="foot-end"><div class="endmark" id="orn" aria-hidden="true"></div>
    © ${new Date().getFullYear()} Tanishk's Blog · Writing lives on WordPress.com<br>Weather &amp; air quality: Open-Meteo · FX: ECB via Frankfurter · BTC: CoinGecko</div></div>`;
  $('#orn').innerHTML = sprite('sparkle');
}

/* ---------- content clicks ---------- */
app.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { const t = $(g.dataset.go); if (t) t.scrollIntoView({ behavior: 'smooth' }); return; }
  const a = e.target.closest('.prose a'); if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#')) { e.preventDefault(); const t = document.getElementById(href.slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth' }); return; }
  const id = urlMap.get(norm(a.href));
  if (id) { e.preventDefault(); location.hash = `#/post/${id}`; }
});

/* ---------- router with pixel-wipe ---------- */
function render() {
  const h = decodeURIComponent(location.hash.slice(1)) || '/';
  let m, anchor = null;
  if ((m = h.match(/^\/post\/(\d+)/))) renderPost(+m[1]);
  else if ((m = h.match(/^\/cat\/(.+)/))) renderHome(m[1]);
  else if (h === '/about') renderAbout();
  else if (h === '/transparency') renderTransparency();
  else if (h === '/social') renderSocial();
  else { renderHome(null); if (h === '/archive') anchor = '#index'; }
  const cur = /^\/(about|transparency|social|archive)$/.test(h) ? '#' + h : '#/';
  document.querySelectorAll('.nav a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === cur));
  observe(app);
  if (anchor && $(anchor)) $(anchor).scrollIntoView(); else scrollTo({ top: 0, behavior: 'instant' });
}
const wipe = $('#wipe'); let wipeT = 0;
wipe.addEventListener('animationend', () => wipe.classList.remove('run'));
function route() {
  closeMenu();
  clearTimeout(wipeT);
  if (REDUCED) return render();
  wipe.classList.remove('run'); void wipe.offsetWidth; wipe.classList.add('run');
  wipeT = setTimeout(render, 260);
}
addEventListener('hashchange', route);

/* ---------- theme: DARK by default ---------- */
function setTheme(night) {
  if (night) delete root.dataset.theme; else root.dataset.theme = 'day';
  store.set('theme', night ? 'night' : 'day');
  $('#theme').textContent = night ? 'Light ◑' : 'Dark ◐';
  const mt = $('meta[name="theme-color"]'); if (mt) mt.content = night ? '#0F0F0E' : '#F4F2EC';
}
setTheme(store.get('theme') !== 'day');
$('#theme').addEventListener('click', () => setTheme(root.dataset.theme === 'day'));

/* ---------- init ---------- */
(async function init() {
  buildLedger(); buildFooter(); setCursors(); butterflies();
  tickClock(); setInterval(tickClock, 1000);
  paintTicker();
  app.innerHTML = '<div class="loader">Loading<div class="bar"><i></i></div>Please wait…</div>';
  loadLive(); setInterval(loadLive, 10 * 60 * 1000);
  try {
    const j = await J(API);
    if (!Array.isArray(j.posts)) throw new Error('No posts array');
    posts = j.posts.map(normalize).sort((a, b) => b.date - a.date);
    posts.forEach((p, i) => { p.no = posts.length - i; analyse(p); });
    urlMap = new Map(posts.map(p => [norm(p.url), p.id]));
  } catch (err) {
    console.error('Feed failed:', err);
    app.innerHTML = `<div class="empty">Could not load posts<br><small>Read them at <a href="https://${SITE}">${SITE}</a></small></div>`;
    return;
  }
  paintTicker();
  render();
})();
})();