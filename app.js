'use strict';
/* TempThreads — screens follow the Claude Design canvas; data is live.
   Weather: Open-Meteo. Hotels: OpenStreetMap (Overpass). Maps: Google Maps.
   Profile, comfort learning and style weights live in this browser's localStorage. */

// ---------- storage ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('tt2:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('tt2:' + k, JSON.stringify(v)); } catch (e) { /* blocked or full */ } },
  del(k) { try { localStorage.removeItem('tt2:' + k); } catch (e) {} }
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- wardrobe ----------
const IMG = {
  street: 'assets/look-street.jpg', classic: 'assets/look-classic.jpg', knit: 'assets/knit.jpg', coat: 'assets/wool-coat.jpg',
  brown: 'assets/brown-puffer.jpg', puffer: 'assets/puffer.jpg', boots: 'assets/boots.jpg'
};
// n name · s short noun · slot · shape · c colour · cn colour name · m material
const G = {
  'tee-white': { n: 'White tee', s: 'tee', slot: 'base', shape: 'tee', c: '#F2F0EA', cn: 'white', m: 'Cotton' },
  'linen': { n: 'Linen shirt', s: 'shirt', slot: 'base', shape: 'shirt', c: '#E8DCC4', cn: 'sand', m: 'Linen' },
  'oxford': { n: 'Oxford shirt', s: 'shirt', slot: 'base', shape: 'shirt', c: '#9DB8E0', cn: 'pale blue', m: 'Cotton' },
  'merino': { n: 'Merino long-sleeve', s: 'base layer', slot: 'base', shape: 'long', c: '#7A8C74', cn: 'sage', m: 'Wool / Merino', wool: 1 },
  'knit': { n: 'Cashmere knit', s: 'knit', slot: 'mid', shape: 'long', c: '#D8C8AE', cn: 'oat', m: 'Cashmere' },
  'hoodie': { n: 'Grey hoodie', s: 'hoodie', slot: 'mid', shape: 'long', c: '#A7AAB0', cn: 'grey', m: 'Cotton jersey' },
  'fleece': { n: 'Fleece', s: 'fleece', slot: 'mid', shape: 'jacket', c: '#B5523B', cn: 'rust', m: 'Fleece' },
  'utility': { n: 'Utility jacket', s: 'jacket', slot: 'outer', shape: 'jacket', c: '#D9C7A4', cn: 'stone', m: 'Cotton canvas' },
  'shell': { n: 'Rain shell', s: 'shell', slot: 'outer', shape: 'jacket', c: '#2F8A7A', cn: 'teal', m: 'Waterproof', rain: 1 },
  'navycoat': { n: 'Navy wool coat', s: 'coat', slot: 'outer', shape: 'coat', c: '#22325E', cn: 'navy', m: 'Wool', wool: 1 },
  'coat': { n: 'Double-breasted coat', s: 'coat', slot: 'outer', shape: 'coat', c: '#2A3550', cn: 'navy', m: 'Wool', wool: 1 },
  'trench': { n: 'Trench coat', s: 'trench', slot: 'outer', shape: 'coat', c: '#C2A272', cn: 'camel', m: 'Gabardine', rain: 1 },
  'brownpuffer': { n: 'Quilted puffer', s: 'puffer', slot: 'outer', shape: 'puffer', c: '#8A6A4F', cn: 'tan', m: 'Down' },
  'puffer': { n: 'Down puffer', s: 'puffer', slot: 'outer', shape: 'puffer', c: '#1D2A44', cn: 'midnight', m: 'Down' },
  'chinos': { n: 'Chinos', s: 'chinos', slot: 'bottom', shape: 'trousers', c: '#BFA67F', cn: 'khaki', m: 'Cotton' },
  'jeans': { n: 'Dark jeans', s: 'jeans', slot: 'bottom', shape: 'trousers', c: '#2D3E5E', cn: 'indigo', m: 'Denim' },
  'wooltr': { n: 'Pleated trousers', s: 'trousers', slot: 'bottom', shape: 'trousers', c: '#D2C4AC', cn: 'stone', m: 'Wool', wool: 1 },
  'shorts': { n: 'Shorts', s: 'shorts', slot: 'bottom', shape: 'shorts', c: '#C8B897', cn: 'sand', m: 'Cotton' },
  'sneakers': { n: 'Sneakers', s: 'sneakers', slot: 'shoes', shape: 'sneaker', c: '#E9E2D2', cn: 'off-white', m: 'Leather' },
  'boots': { n: 'Leather boots', s: 'boots', slot: 'shoes', shape: 'boot', c: '#6B4428', cn: 'brown', m: 'Leather', rain: 1 },
  'loafers': { n: 'Loafers', s: 'loafers', slot: 'shoes', shape: 'sneaker', c: '#5A3A26', cn: 'brown', m: 'Leather' },
  'beanie': { n: 'Beanie', s: 'beanie', slot: 'extra', shape: 'beanie', c: '#15171C', cn: 'black', m: 'Wool' },
  'scarf': { n: 'Wool scarf', s: 'scarf', slot: 'extra', shape: 'scarf', c: '#B08C3E', cn: 'mustard', m: 'Wool', wool: 1 }
};
const SHAPES = {
  tee: '<path d="M17 8 7 14l4 8 5-2v20h16V20l5 2 4-8-10-6c-1 3-4 5-7 5s-6-2-7-5z"/>',
  shirt: '<path d="M17 8 7 13 5 36h6l2-15v21h22V21l2 15h6l-2-23-10-5-7 6z"/><path class="l" d="M24 14v28M17 8l7 6 7-6"/>',
  long: '<path d="M17 8 7 13 5 36h6l2-15v21h22V21l2 15h6l-2-23-10-5c-1 3-4 5-7 5s-6-2-7-5z"/>',
  jacket: '<path d="M17 7 7 12 5 37h6l2-15v21h22V22l2 15h6l-2-25-10-5-7 7z"/><path class="l" d="M24 14v29M15 30h5M28 30h5"/>',
  coat: '<path d="M17 5 7 10 5 36h6l2-14v24h22V22l2 14h6l-2-26-10-5-7 8z"/><path class="l" d="M24 13v33"/>',
  puffer: '<path d="M16 7 6 12 4 36h7l2-14v20h22V22l2 14h7l-2-24-10-5c-1 3-4 5-8 5s-7-2-8-5z"/><path class="l" d="M13 20h22M13 27h22M13 34h22M24 12v30"/>',
  trousers: '<path d="M13 6h22l2 36h-8l-5-24-5 24h-8z"/><path class="l" d="M13 11h22"/>',
  shorts: '<path d="M12 12h24l2 20h-9l-5-10-5 10h-9z"/><path class="l" d="M12 17h24"/>',
  sneaker: '<path d="M5 31c0-6 2-10 4-12h8l4 6c4 2 12 3 16 4 4 1 6 3 6 6v2H5z"/><path class="l" d="M5 33h38"/>',
  boot: '<path d="M12 6h13v20c6 2 14 3 16 7v6H12z"/><path class="l" d="M12 35h29"/>',
  beanie: '<path d="M10 31c0-9 6-16 14-16s14 7 14 16z"/><path d="M8 31h32v7H8z"/><circle cx="24" cy="12" r="3.5"/>',
  scarf: '<path d="M9 11h30v8h-9v20h-9V19H9z"/><path class="l" d="M21 34h9M21 38v4M25 38v4M29 38v4"/>'
};
const garment = (id) => `<svg class="g" viewBox="0 0 48 48" aria-hidden="true"><g fill="${G[id].c}">${SHAPES[G[id].shape]}</g></svg>`;

// min/max = comfortable PERSONAL feels-like range, °C. Looks with `img` make up the swipe deck (as on the canvas).
const LOOKS = [
  { id: 'street', n: 'Street Utility', tags: ['casual', 'minimal'], min: 8, max: 14, img: 'street', p: ['utility', 'hoodie', 'chinos', 'sneakers', 'beanie'] },
  { id: 'classic', n: 'Classic Casual', tags: ['smart', 'minimal'], min: 4, max: 12, img: 'classic', p: ['navycoat', 'knit', 'oxford', 'wooltr', 'boots'] },
  { id: 'autumn', n: 'Autumn Puffer', tags: ['outdoor', 'casual'], min: 0, max: 8, img: 'brown', p: ['brownpuffer', 'merino', 'jeans', 'boots'] },
  { id: 'winter', n: 'Deep Winter', tags: ['street', 'outdoor'], min: -8, max: 3, img: 'puffer', p: ['puffer', 'fleece', 'merino', 'wooltr', 'boots', 'beanie'] },
  { id: 'city', n: 'City Coat', tags: ['smart', 'classic'], min: 2, max: 10, img: 'coat', p: ['coat', 'oxford', 'wooltr', 'loafers', 'scarf'] },
  { id: 'knit', n: 'Light Knit', tags: ['minimal', 'casual'], min: 12, max: 18, img: 'knit', p: ['knit', 'tee-white', 'chinos', 'sneakers'] },
  { id: 'shell', n: 'Shell & Knit', tags: ['outdoor', 'minimal'], min: 6, max: 14, rain: 1, p: ['shell', 'knit', 'merino', 'jeans', 'boots'] },
  { id: 'trench', n: 'Trench Office', tags: ['smart', 'classic'], min: 7, max: 15, rain: 1, p: ['trench', 'knit', 'oxford', 'wooltr', 'loafers'] },
  { id: 'oxford', n: 'Oxford & Chinos', tags: ['smart', 'minimal'], min: 15, max: 23, p: ['oxford', 'chinos', 'loafers'] },
  { id: 'weekend', n: 'Weekend Tee', tags: ['casual', 'minimal'], min: 18, max: 30, p: ['tee-white', 'jeans', 'sneakers'] },
  { id: 'linen', n: 'Summer Linen', tags: ['minimal', 'smart'], min: 22, max: 35, p: ['linen', 'shorts', 'loafers'] }
];
const DECK = LOOKS.filter((l) => l.img && l.id !== 'knit');
const TAGS = { casual: 'Casual', minimal: 'Minimal', smart: 'Smart', street: 'Street', outdoor: 'Outdoor', classic: 'Classic' };

const DESTS = [
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lon: 12.5683 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lon: -21.9426 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3874, lon: 2.1686 },
  { name: 'Marrakesh', country: 'Morocco', lat: 31.6295, lon: -7.9811 },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.006 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 }
];
// Shown when the OpenStreetMap hotel servers are busy.
const KNOWN_HOTELS = {
  Copenhagen: [['Hotel d’Angleterre', 'Kongens Nytorv'], ['Nimb Hotel', 'Tivoli Gardens'], ['Hotel Sanders', 'Nyhavn']],
  Lisbon: [['Bairro Alto Hotel', 'Chiado'], ['Memmo Alfama', 'Alfama'], ['Pestana Palace', 'Alcântara']],
  Paris: [['Le Meurice', '1st arrondissement'], ['Hôtel Plaza Athénée', 'Avenue Montaigne'], ['Le Pavillon de la Reine', 'Le Marais']],
  'Reykjavík': [['Hotel Borg', 'Austurvöllur square'], ['Reykjavik Marina', 'Old Harbour'], ['Hotel Holt', 'Þingholt']]
};

// ---------- state ----------
const S = {
  user: store.get('user', null),
  account: store.get('account', null),
  place: store.get('place', { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 }),
  unit: store.get('unit', 'C'),
  comfort: store.get('comfort', { offset: 0, n: 0, history: [], trail: [0] }),
  weights: store.get('weights', {}),
  ratings: store.get('ratings', {}),
  prefs: Object.assign({ gloves: true, transit: true, wool: false, alert: true }, store.get('prefs', {})),
  worn: store.get('worn', {}),
  trip: store.get('trip', { place: DESTS[0], days: 5 }),
  packed: store.get('packed', {}),
  wx: null, wxErr: '',
  tripWx: null, tripErr: '', tripLoading: false,
  destTemps: null,
  hotels: null, hotelsFor: '', hotelsState: 'idle',
  weekSel: 0, layerSel: null, swatch: 0, sheet: null, anim: false, checkMsg: '', signup: !store.get('account', null), howOpen: false
};
const save = (...keys) => keys.forEach((k) => store.set(k, S[k]));

// ---------- helpers ----------
const toU = (c) => S.unit === 'F' ? c * 9 / 5 + 32 : c;
const fmtT = (c) => Math.round(toU(c)) + '°';
const fmtD = (d) => { const v = S.unit === 'F' ? d * 9 / 5 : d; const r = Math.round(v * 2) / 2; return (r > 0 ? '+' : '') + r.toFixed(1) + '°'; };
const dateKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const dShort = (iso) => new Date(iso + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
const dLabel = (iso, i) => i === 0 ? 'Today' : new Date(iso + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short' });
const dFull = (iso) => new Date(iso + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
const placeLabel = (p) => p.name + (p.country ? ', ' + p.country : '');
function cond(code) {
  if (code === 0) return { k: 'sun', t: 'Clear' };
  if (code <= 2) return { k: 'partly', t: 'Partly sunny' };
  if (code === 3) return { k: 'cloudy', t: 'Cloudy' };
  if (code === 45 || code === 48) return { k: 'cloudy', t: 'Foggy' };
  if (code >= 51 && code <= 57) return { k: 'rain', t: 'Drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { k: 'rain', t: 'Rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { k: 'snow', t: 'Snow' };
  if (code >= 95) return { k: 'rain', t: 'Thunderstorms' };
  return { k: 'cloudy', t: 'Cloudy' };
}
const dayFeels = (d) => (d.fhi * 2 + d.flo) / 3;
const personal = (f) => f - S.comfort.offset;          // positive offset = runs cold
const layersFor = (f) => f >= 20 ? 1 : f >= 10 ? 2 : 3;

function score(look, fy, rain) {
  const mid = (look.min + look.max) / 2;
  let s = (fy >= look.min && fy <= look.max) ? 10 - Math.abs(fy - mid) / 3 : -Math.min(Math.abs(fy - look.min), Math.abs(fy - look.max)) * 2;
  if (rain >= 50) s += (look.rain || look.p.includes('boots')) ? 3 : -4;
  s += look.tags.reduce((a, t) => a + (S.weights[t] || 0), 0) * 1.2;
  if (S.ratings[look.id] === 1) s += 2;
  if (S.ratings[look.id] === -1) s -= 4;
  if (S.prefs.wool && look.p.some((id) => G[id].wool)) s -= 3;
  if (look.img) s += 1.5; // prefer fully photographed outfits when the fit is close
  return s;
}
const ranked = (fy, rain) => [...LOOKS].sort((a, b) => score(b, fy, rain) - score(a, fy, rain));
const bestFor = (d) => ranked(personal(dayFeels(d)), d.rain)[0];
const piecesText = (l) => l.p.map((id, i) => i ? G[id].n.toLowerCase() : G[id].n).join(' · ');
const rangeText = (l) => fmtT(l.min).replace('°', '') + '–' + fmtT(l.max) + (S.unit === 'F' ? 'F' : 'C');

// comfort learning: each check-in nudges the offset; steps shrink as check-ins build up (floor 0.25)
function learn(c, f) {
  const delta = f === 'cold' ? 1.5 : f === 'warm' ? -1.5 : 0;
  const step = Math.max(0.25, 1 / (c.n + 1));
  const offset = Math.max(-4, Math.min(4, c.offset + step * delta));
  return { offset, n: c.n + 1, history: c.history.concat([f]).slice(-10), trail: c.trail.concat([offset]).slice(-20) };
}

// ---------- APIs ----------
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
async function getForecast(p, force) {
  const key = 'wx:' + p.lat.toFixed(2) + ',' + p.lon.toFixed(2);
  const cached = store.get(key, null);
  if (!force && cached && Date.now() - cached.at < 60 * 60 * 1000) return cached;
  const url = `${FORECAST}?latitude=${p.lat}&longitude=${p.lon}`
    + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,wind_speed_10m_max'
    + '&timezone=auto&forecast_days=7';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('weather ' + r.status);
    const j = await r.json(), d = j.daily;
    const data = {
      at: Date.now(),
      current: { t: j.current.temperature_2m, feels: j.current.apparent_temperature, code: j.current.weather_code, wind: j.current.wind_speed_10m },
      days: d.time.map((date, i) => ({ date, hi: d.temperature_2m_max[i], lo: d.temperature_2m_min[i], fhi: d.apparent_temperature_max[i], flo: d.apparent_temperature_min[i], rain: d.precipitation_probability_max[i] ?? 0, wind: d.wind_speed_10m_max[i], code: d.weather_code[i] }))
    };
    store.set(key, data);
    return data;
  } catch (e) {
    if (cached) return Object.assign({}, cached, { stale: true });
    throw e;
  }
}
async function getDestTemps() {
  const cached = store.get('dest-temps2', null);
  if (cached && Date.now() - cached.at < 60 * 60 * 1000) return cached.list;
  const r = await fetch(`${FORECAST}?latitude=${DESTS.map((d) => d.lat).join(',')}&longitude=${DESTS.map((d) => d.lon).join(',')}&current=temperature_2m,weather_code&timezone=auto`);
  if (!r.ok) throw new Error('weather ' + r.status);
  const j = await r.json();
  const list = (Array.isArray(j) ? j : [j]).map((x) => ({ t: x.current.temperature_2m, code: x.current.weather_code }));
  store.set('dest-temps2', { at: Date.now(), list });
  return list;
}
async function geocode(q) {
  const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=' + encodeURIComponent(q));
  if (!r.ok) throw new Error('search ' + r.status);
  const j = await r.json();
  return (j.results || []).map((x) => ({ name: x.name, country: x.country || '', region: x.admin1 || '', lat: x.latitude, lon: x.longitude }));
}
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
async function getHotels(p) {
  const key = 'hotels:' + p.lat.toFixed(2) + ',' + p.lon.toFixed(2);
  const cached = store.get(key, null);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return cached.list;
  const q = `[out:json][timeout:20];nwr["tourism"="hotel"]["name"](around:2500,${p.lat},${p.lon});out center tags 60;`;
  let lastErr;
  for (const ep of OVERPASS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const r = await fetch(ep, { method: 'POST', signal: ctrl.signal, body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      clearTimeout(timer);
      if (!r.ok) throw new Error('hotels ' + r.status);
      const j = await r.json();
      const list = j.elements.map((e) => {
        const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
        return { name: e.tags.name, stars: parseFloat(e.tags.stars) || 0, km: distKm(p.lat, p.lon, lat, lon), website: e.tags.website || '', street: e.tags['addr:street'] || '' };
      }).filter((h) => h.name)
        .sort((a, b) => (b.stars - a.stars) || ((b.website ? 1 : 0) - (a.website ? 1 : 0)) || (a.km - b.km))
        .slice(0, 5);
      store.set(key, { at: Date.now(), list });
      return list;
    } catch (e) { clearTimeout(timer); lastErr = e; }
  }
  throw lastErr;
}
function distKm(a, b, c, d) {
  const R = 6371, t = (x) => x * Math.PI / 180, dLat = t(c - a), dLon = t(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const gmaps = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const gmapsEmbed = (p) => 'https://www.google.com/maps?output=embed&z=12&q=' + encodeURIComponent(placeLabel(p));

// ---------- loading ----------
async function loadHome(force) {
  S.wxErr = ''; render();
  try { S.wx = await getForecast(S.place, force); } catch (e) { S.wxErr = 'Could not load the weather. Check your connection and try again.'; }
  recordWorn(); render();
}
async function loadTrip() {
  const p = S.trip.place;
  S.tripLoading = true; S.tripErr = ''; render();
  try { S.tripWx = await getForecast(p); } catch (e) { S.tripErr = 'Could not load the forecast for ' + p.name + '.'; S.tripWx = null; }
  S.tripLoading = false; render();
  loadHotels();
}
async function loadHotels() {
  const p = S.trip.place, id = placeLabel(p);
  if (S.hotelsFor === id && S.hotelsState !== 'failed') return;
  S.hotelsFor = id; S.hotelsState = 'loading'; S.hotels = null; render();
  try { const list = await getHotels(p); if (S.hotelsFor === id) { S.hotels = list; S.hotelsState = 'ok'; } }
  catch (e) { if (S.hotelsFor === id) S.hotelsState = 'failed'; }
  render();
}
async function loadDestTemps() {
  if (S.destTemps) return;
  try { S.destTemps = await getDestTemps(); render(); } catch (e) { /* the list works without temperatures */ }
}
function recordWorn() {
  if (!S.wx) return;
  const k = dateKey(), d = S.wx.days[0];
  if (S.worn[k] && S.worn[k].chosen) return;
  const look = bestFor(d);
  S.worn[k] = Object.assign({}, S.worn[k], { id: look.id, feels: Math.round(dayFeels(d)), place: S.place.name });
  const keys = Object.keys(S.worn).sort();
  while (keys.length > 30) delete S.worn[keys.shift()];
  save('worn');
}

// ---------- icons ----------
function wxIcon(k, size) {
  const sun = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#E9A92B"/>`;
  const rays = '<path d="M14 3v3M14 22v3M3 14h3M22 14h3M6.2 6.2l2 2M19.8 19.8l2 2M6.2 21.8l2-2M19.8 8.2l2-2" stroke="#E9A92B" stroke-width="2" stroke-linecap="round"/>';
  const cloud = '<path d="M7 22h14a5.5 5.5 0 0 0 0-11 7 7 0 0 0-13.4-1.5A6 6 0 0 0 7 22z" fill="#DCE3EF" stroke="#7B869A" stroke-width="1.4"/>';
  const smallCloud = '<path d="M7 18h14a5 5 0 0 0 0-10 6.5 6.5 0 0 0-12.4-1.4A5.6 5.6 0 0 0 7 18z" fill="#DCE3EF" stroke="#7B869A" stroke-width="1.4"/>';
  const m = {
    sun: sun(14, 14, 6) + rays,
    partly: sun(11, 10, 5) + '<path d="M8 23h13a5 5 0 0 0 0-10 6.5 6.5 0 0 0-12.4-1.4A5.6 5.6 0 0 0 8 23z" fill="#DCE3EF" stroke="#7B869A" stroke-width="1.4"/>',
    cloudy: cloud,
    rain: smallCloud + '<path d="M10 21l-1.5 4M15 21l-1.5 4M20 21l-1.5 4" stroke="#1F4FD8" stroke-width="2" stroke-linecap="round"/>',
    snow: smallCloud + '<g fill="#1F4FD8"><circle cx="10" cy="23" r="1.6"/><circle cx="15" cy="25" r="1.6"/><circle cx="20" cy="23" r="1.6"/></g>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true">${m[k] || m.cloudy}</svg>`;
}
function heroIcon(k) {
  const m = {
    sun: '<circle cx="30" cy="30" r="11" fill="#FFD27A"/><g stroke="#FFD27A" stroke-width="3" stroke-linecap="round"><path d="M30 8v5M30 47v5M8 30h5M47 30h5M14.4 14.4l3.6 3.6M42 42l3.6 3.6M14.4 45.6l3.6-3.6M42 18l3.6-3.6"/></g>',
    partly: '<circle cx="24" cy="20" r="8" fill="#FFD27A"/><path d="M16 46h26a9 9 0 0 0 0-18 12 12 0 0 0-23-3 10 10 0 0 0-3 21z" fill="#FFFFFF" fill-opacity="0.92"/>',
    cloudy: '<path d="M14 46h28a10 10 0 0 0 0-20 13 13 0 0 0-25-3 11 11 0 0 0-3 23z" fill="#FFFFFF" fill-opacity="0.92"/>',
    rain: '<path d="M14 40h28a10 10 0 0 0 0-20 13 13 0 0 0-25-3 11 11 0 0 0-3 23z" fill="#FFFFFF" fill-opacity="0.92"/><g stroke="#BFD0FF" stroke-width="3" stroke-linecap="round"><path d="M20 46l-2 6M30 46l-2 6M40 46l-2 6"/></g>',
    snow: '<path d="M14 40h28a10 10 0 0 0 0-20 13 13 0 0 0-25-3 11 11 0 0 0-3 23z" fill="#FFFFFF" fill-opacity="0.92"/><g fill="#FFFFFF"><circle cx="20" cy="49" r="2.4"/><circle cx="30" cy="52" r="2.4"/><circle cx="40" cy="49" r="2.4"/></g>'
  };
  return `<svg width="54" height="54" viewBox="0 0 60 60" aria-hidden="true">${m[k] || m.cloudy}</svg>`;
}
const I = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  outfit: '<path d="M10 6a2 2 0 1 1 2 2v1.5l8.6 6.2a1.5 1.5 0 0 1-.9 2.3H4.3a1.5 1.5 0 0 1-.9-2.3L12 9.5"/>',
  week: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 16l9 5 9-5"/>',
  travel: '<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 20v1M15 20v1"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>'
};
const ic = (k, size = 20, sw = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
const HEART = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4z"/></svg>';
const media = (l, alt = '') => l.img ? `<img src="${IMG[l.img]}" alt="${esc(alt)}">` : `<div class="board">${l.p.slice(0, 4).map(garment).join('')}</div>`;

let toastT;
function toast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); }

// ---------- chrome ----------
function header() {
  const ini = (S.user.name || '?').slice(0, 2).toUpperCase();
  return `<header class="top"><img class="logo" src="assets/logo-ink.png" alt="TempThreads">
    <div class="top-right"><button class="pill" data-act="open-sheet" data-mode="home" aria-label="Change location">${ic('pin', 14, 2.2)}<span>${esc(S.place.name)}</span></button><a class="avatar" href="#profile" aria-label="Your profile">${esc(ini)}</a></div></header>`;
}
function tabs(cur) {
  return `<nav class="tabs" aria-label="Sections">${[['today', 'Today'], ['outfit', 'Outfit'], ['week', '7-Day'], ['layers', 'Layers'], ['travel', 'Travel']]
    .map(([k, l]) => `<a href="#${k}" ${cur === k ? 'aria-current="page"' : ''}><span class="ic">${ic(k)}</span>${l}</a>`).join('')}</nav>`;
}
function wxGate() {
  if (S.wx) return '';
  if (S.wxErr) return `<div class="notice err">${esc(S.wxErr)}<br><button class="btn out" data-act="reload" style="margin-top:8px">Try again</button></div>`;
  return '<div class="skeleton" style="height:180px" aria-label="Loading the weather"></div>';
}

// ---------- Login ----------
function vLogin() {
  const up = S.signup;
  return `<div class="login">
    <svg class="login-rain" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g stroke="#7FA0F0" stroke-width="2" stroke-linecap="round"><path d="M40 30l-4 12M96 70l-4 12M150 20l-4 12M220 54l-4 12M290 26l-4 12M346 72l-4 12M64 140l-4 12M330 150l-4 12M120 200l-4 12M270 210l-4 12M30 230l-4 12M360 240l-4 12"/></g></svg>
    <div class="login-hero"><img src="assets/logo-white.png" alt="TempThreads"><span>Dress for the forecast.</span></div>
    <form class="sheet-login" data-form="login" aria-label="${up ? 'Create your account' : 'Welcome back'}">
      <div><h1 class="h1">${up ? 'Create your account' : 'Welcome back'}</h1><p class="soft" style="margin-top:4px;font-size:14px">${up ? 'Two minutes to set up, then the app learns as you go.' : 'Sign in to see today’s outfit for your weather.'}</p></div>
      ${up ? '<div class="field"><label for="tt-name">First name</label><input id="tt-name" name="name" autocomplete="given-name" required maxlength="40"></div>' : ''}
      <div class="field"><label for="tt-email">Email</label><input id="tt-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required value="${esc(!up && S.account ? S.account.email : '')}"></div>
      <div class="field"><div class="between"><label for="tt-pass">Password</label><button type="button" class="top-link" style="min-height:0;font-size:12px" data-act="forgot">Forgot password?</button></div><input id="tt-pass" name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="At least 8 characters" minlength="8" required></div>
      <button class="btn dark" type="submit">${up ? 'Create account' : 'Sign in'}</button>
      <div class="or"><span></span>or<span></span></div>
      <div class="social"><button type="button" data-act="social">Continue with Apple</button><button type="button" data-act="social">Continue with Google</button></div>
      <button type="button" class="switch-mode" data-act="toggle-signup">${up ? 'Already have an account?' : 'New to TempThreads?'} <b>${up ? 'Sign in' : 'Create an account'}</b></button>
    </form>
  </div>`;
}

// ---------- Today ----------
function vToday() {
  const gate = wxGate(); if (gate) return gate;
  const w = S.wx, d = w.days[0], c = cond(w.current.code), fy = personal(dayFeels(d)), L = layersFor(fy);
  const title = c.t + (w.current.wind >= 20 || d.wind >= 25 ? ', breezy' : '');
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yk = dateKey(y), yw = S.worn[yk], yLook = yw && LOOKS.find((l) => l.id === yw.id);
  const left = DECK.filter((l) => S.ratings[l.id] == null).sort((a, b) => score(b, fy, d.rain) - score(a, fy, d.rain));
  const rated = DECK.length - left.length;
  const prof = Object.entries(S.weights).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const cur = left[0], next = left[1];
  return `
  <section class="wx" aria-label="Weather now">
    <div class="wx-row"><div class="wx-temp">${fmtT(w.current.t)}</div><div class="stack" style="gap:2px"><div class="wx-title">${title}</div><div class="wx-sub">${dShort(d.date)} ${new Date(d.date + 'T12:00').toLocaleDateString('en-GB', { month: 'short' })} · High ${fmtT(d.hi)} · Low ${fmtT(d.lo)}</div></div>${heroIcon(c.k)}</div>
    <div class="wx-stats"><div><b>${fmtT(w.current.feels)}</b><span>Feels like</span></div><div><b>${Math.round(w.current.wind)} km/h</b><span>Wind</span></div><div><b>${L} layer${L > 1 ? 's' : ''}</b><span>Needed</span></div></div>
  </section>
  ${yLook && !yw.rated ? `<section class="card p14 stack" style="gap:10px" aria-label="Check-in">
    <div class="stack" style="gap:2px"><span class="h2">How did yesterday feel?</span><span class="soft" style="font-size:13px">${esc(dLabel(yk, 1))} · ${esc(yLook.n)} · felt like ${fmtT(yw.feels)}</span></div>
    <div class="feel-btns"><button class="f-cold" data-act="feel" data-f="cold" data-day="${yk}">Too cold</button><button class="f-right" data-act="feel" data-f="right" data-day="${yk}">Just right</button><button class="f-warm" data-act="feel" data-f="warm" data-day="${yk}">Too warm</button></div>
  </section>` : ''}
  <div class="between" style="align-items:flex-end"><div><h1 class="h1">Find your style</h1><p class="soft" style="margin-top:4px;font-size:14px">Swipe right on looks you would wear.</p></div><span class="mono soft" style="font-size:12px;white-space:nowrap">${cur ? rated + 1 : DECK.length} of ${DECK.length}</span></div>
  ${cur ? `
  <div class="deck" id="deck">
    ${next ? `<div class="card-back" aria-hidden="true"><img src="${IMG[next.img]}" alt=""></div>` : ''}
    <article class="swipe" data-id="${cur.id}" tabindex="0" aria-label="${esc(cur.n)}. Use the arrow keys or the buttons below to rate">
      <div class="photo"><img src="${IMG[cur.img]}" alt="${esc(cur.n)}"><div class="photo-tags">${cur.tags.map((t) => `<span>${TAGS[t]}</span>`).join('')}</div><span class="stamp like">LIKE</span><span class="stamp nope">NOPE</span></div>
      <div class="meta"><div class="between"><span class="look-name">${esc(cur.n)}</span><span class="range">${rangeText(cur)}</span></div><span class="soft" style="font-size:13px">${esc(piecesText(cur))}</span></div>
    </article>
  </div>
  <div class="deck-actions"><button class="round no" data-act="rate" data-v="-1" aria-label="Not for me">${ic('x', 24, 2.6)}</button><button class="round yes" data-act="rate" data-v="1" aria-label="I would wear this">${HEART}</button></div>`
    : `<div class="done-box"><span class="h2" style="font-size:20px">Your style is set</span><span class="soft" style="font-size:14px">Daily picks now lean toward what you liked.</span><button class="btn dark" style="width:auto;height:44px;padding:0 20px;border-radius:12px;font-size:14px;margin-top:6px" data-act="reset-style">Rate again</button></div>`}
  <section class="card r18 taste" aria-label="Your taste"><span class="eyebrow">Your taste so far</span>
    ${prof.length ? `<div class="chips">${prof.map(([t, v]) => `<span class="chip-sky">${TAGS[t]} <small>×${v}</small></span>`).join('')}</div>` : '<span class="soft" style="font-size:13px">Like a few looks and your styles show up here.</span>'}
  </section>`;
}

// ---------- Outfit ----------
function lookParts(l) {
  const by = (slot) => l.p.map((id) => G[id]).find((g) => g.slot === slot);
  return { base: by('base'), mid: by('mid'), outer: by('outer'), bottom: by('bottom'), shoes: by('shoes') };
}
function bullets(l, d) {
  const g = lookParts(l), out = [];
  if (g.outer && (g.mid || g.base)) out.push(`${g.outer.n} over a ${(g.mid || g.base).n.toLowerCase()}`);
  else if (g.mid) out.push(`${g.mid.n} over a ${g.base ? g.base.n.toLowerCase() : 'tee'}`);
  else out.push(`${g.base.n} with ${g.bottom.n.toLowerCase()}`);
  const names = [...new Set(l.p.map((id) => G[id].cn))].slice(0, 3);
  out.push('Palette: ' + names.join(', '));
  if (g.shoes) out.push(g.shoes.s === 'boots' ? (d.rain >= 40 ? 'Leather boots for damp pavements' : 'Leather boots for cold ground') : g.shoes.s === 'loafers' ? 'Loafers to smarten it up' : 'Sneakers for walking days');
  return out;
}
function palette(l) {
  const seen = new Set(), list = [];
  ['outer', 'mid', 'bottom', 'shoes', 'base'].forEach((slot) => l.p.forEach((id) => {
    const g = G[id];
    if (g.slot === slot && !seen.has(g.cn) && list.length < 4) { seen.add(g.cn); list.push({ hex: g.c, name: cap(g.cn) + ' · the ' + g.s }); }
  }));
  return list;
}
function vOutfit() {
  const gate = wxGate(); if (gate) return gate;
  const w = S.wx, d = w.days[0], fy = personal(dayFeels(d)), list = ranked(fy, d.rain);
  const k = dateKey(), chosenId = S.worn[k] && S.worn[k].chosen ? S.worn[k].id : null;
  const look = chosenId ? LOOKS.find((l) => l.id === chosenId) : list[0];
  const L = layersFor(fy);
  const pal = palette(look), sw = Math.min(S.swatch, pal.length - 1);
  const mats = [...new Set(look.p.map((id) => G[id].m))].slice(0, 3);
  if (lookParts(look).outer && d.wind >= 20) mats.push('Wind-resistant');
  const alts = list.filter((l) => l.id !== look.id).slice(0, 2);
  const c = cond(w.current.code);
  return `
  <div style="display:flex;align-items:center;gap:8px;font-size:14px" class="soft"><span class="mono" style="font-weight:700;font-size:22px;color:var(--ink)">${Math.round(w.current.t)}°</span><span>/ ${Math.round(w.current.t * 9 / 5 + 32)}°F in ${esc(S.place.name)} · ${c.t}${d.wind >= 20 ? ' and breezy' : ''}</span></div>
  <article class="card r24 clip">
    <div class="pick-grid">${media(look, look.n)}
      <div class="pick-text"><span class="eyebrow" style="color:var(--cobalt)">${chosenId ? 'Your outfit today' : 'Today\'s pick'}</span><h1>${esc(look.n)}</h1>
        <ul>${bullets(look, d).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <span class="chip sky" style="align-self:flex-start;font-weight:700">${L} layer${L > 1 ? 's' : ''} · ${rangeText(look)}</span>
      </div>
    </div>
    <img class="strip" src="${IMG.boots}" alt="Brown leather boots and beige suede sneakers">
    <div style="padding:12px 14px" class="chips">${mats.map((m) => `<span class="chip line">${esc(m)}</span>`).join('')}</div>
  </article>
  <section class="card r18" style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px" aria-label="Palette">
    <div class="stack" style="gap:2px"><span style="font:700 15px var(--display)">Palette</span><span class="soft" style="font-size:13px">${esc(pal[sw].name)}</span></div>
    <div style="display:flex;gap:6px">${pal.map((p, i) => `<button class="swatch" data-act="swatch" data-i="${i}" aria-label="${esc(p.name)}" style="background:${p.hex};box-shadow:${i === sw ? '0 0 0 2px #15171C' : '0 0 0 1px #D8CDBB'}"></button>`).join('')}</div>
  </section>
  <section class="stack" style="gap:8px" aria-label="Swap a piece"><h2 class="h2">Swap a piece</h2>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">${alts.map((l) => `<button class="tile" data-act="wear" data-id="${l.id}">${l.img ? `<img src="${IMG[l.img]}" alt="">` : `<div class="board">${l.p.slice(0, 4).map(garment).join('')}</div>`}<span class="tile-text"><b>${esc(l.n)}</b><span>${(l.min + l.max) / 2 < (look.min + look.max) / 2 ? 'Lighter' : 'Warmer'} · ${rangeText(l)}</span></span></button>`).join('')}</div>
  </section>
  ${S.prefs.gloves && fy < 8 ? '<div class="notice info">Cold hands: add gloves today.</div>' : ''}
  <button class="btn ${chosenId === look.id ? 'green' : ''}" data-act="wear" data-id="${look.id}">${chosenId === look.id ? 'Saved as today’s outfit' : 'Wear this today'}</button>`;
}

// ---------- 7-Day ----------
function dayNote(d, look) {
  const fy = personal(dayFeels(d));
  if (d.rain >= 50 && d.wind >= 25) return `Wet and windy. ${look.n} with a waterproof outer, and boots.`;
  if (d.rain >= 50) return `Rain is likely (${d.rain}%). ${look.n} keeps you dry; take boots.`;
  if (fy < 5) return `Cold, feeling close to ${fmtT(fy)} for you. Switch to ${look.n}.`;
  if (d.wind >= 25) return `Breezy all day. ${look.n} blocks the wind.`;
  return `Dry and ${fy >= 15 ? 'mild' : 'cool'}. ${look.n} is enough.`;
}
function vWeek() {
  const gate = wxGate(); if (gate) return gate;
  const ds = S.wx.days, mn = Math.min(...ds.map((d) => d.lo)), mx = Math.max(...ds.map((d) => d.hi)), span = Math.max(1, mx - mn);
  const sel = ds[S.weekSel] || ds[0], selLook = bestFor(sel);
  const coldI = ds.reduce((a, d, i) => dayFeels(d) < dayFeels(ds[a]) ? i : a, 0);
  const wet = ds.map((d, i) => d.rain >= 50 ? new Date(d.date + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long' }) : null).filter(Boolean);
  const insightT = coldI > 0 && dayFeels(ds[coldI]) < dayFeels(ds[0]) - 2 ? 'Cooling into ' + new Date(ds[coldI].date + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long' }) : 'A steady week';
  const insightB = (wet.length ? 'Rain on ' + wet.slice(0, 3).join(' and ') + '. Keep a waterproof shell by the door and swap sneakers for boots.' : 'No day above a 50% chance of rain, so the shell can stay home.');
  return `
  <div class="between"><h1 class="h1">7-Day</h1><span class="mono soft" style="font-size:12px">${dShort(ds[0].date).split(' ')[1]}–${dShort(ds[6].date).split(' ')[1]} ${new Date(ds[6].date + 'T12:00').toLocaleDateString('en-GB', { month: 'short' })} · °${S.unit}</span></div>
  <section class="card clip rows" aria-label="Forecast">${ds.map((d, i) => {
    const c = cond(d.code);
    return `<button class="day" data-act="week" data-i="${i}" aria-pressed="${i === S.weekSel}"><b>${dLabel(d.date, i)}</b>${wxIcon(c.k, 28)}
      <span class="stack" style="gap:5px;min-width:0"><span class="temps"><span class="lo">${fmtT(d.lo)}</span><span class="track"><i style="left:${(d.lo - mn) / span * 100}%;width:${Math.max(4, (d.hi - d.lo) / span * 100)}%"></i></span><span class="hi">${fmtT(d.hi)}</span></span>
      <span class="day-line">${c.t} · wear ${esc(bestFor(d).n)}</span></span></button>`;
  }).join('')}</section>
  <section class="sel-card" aria-label="Selected day">${media(selLook, selLook.n)}
    <div class="sel-text"><span class="eyebrow" style="color:#A9B9F2">${dFull(sel.date)}</span><span style="font:700 18px var(--display)">${esc(selLook.n)}</span><span style="font-size:13px;line-height:1.4;color:#D9D3C7">${esc(dayNote(sel, selLook))}</span><span class="mono" style="font-size:12px;color:#A9B9F2">Rain ${sel.rain}% · Wind ${Math.round(sel.wind)} km/h</span></div>
  </section>
  <section class="insight" aria-label="Weather insight"><span style="font:700 15px var(--display);color:var(--cobalt-dk)">${insightT}</span><span style="font-size:13px;color:var(--sky-ink)">${insightB}</span></section>`;
}

// ---------- Layers ----------
function vLayers() {
  const gate = wxGate(); if (gate) return gate;
  const d = S.wx.days[0], fy = personal(dayFeels(d)), auto = layersFor(fy), sel = S.layerSel || auto;
  const ROWS = {
    1: [['Base', 'Cotton tee or light knit', 'One breathable layer. Linen if it tops 24°.']],
    2: [['Base', 'Tee or long-sleeve', 'Cotton is fine while it stays dry.'], ['Outer', 'Hoodie under a utility jacket', 'Easy to take off when the afternoon warms up.']],
    3: [['Base', 'Merino or a crisp tee', 'Merino keeps you warm if you get caught in rain.'], ['Mid', 'Cashmere or wool knit', 'Traps warm air without bulk.'], ['Outer', 'Wool coat, windproof', `Today’s ${Math.round(d.wind)} km/h wind takes a few degrees off.`]]
  };
  const opts = [[1, 'knit', S.unit === 'F' ? '68°F and up' : '20°C and up'], [2, 'street', S.unit === 'F' ? '50–67°F' : '10–19°C'], [3, 'classic', S.unit === 'F' ? 'below 50°F' : 'below 10°C']];
  return `
  <div><h1 class="h1">How many layers do I need?</h1><p class="soft" style="margin-top:6px;font-size:14px">Today feels like <span class="mono" style="font-weight:700;color:var(--ink)">${fmtT(fy)}${S.unit}</span> to you in ${esc(S.place.name)}, so ${auto} layer${auto > 1 ? 's' : ''}.</p></div>
  <div class="layer-opts" role="group" aria-label="Layer count">${opts.map(([n, img, r]) => `<button class="layer" data-act="layer" data-n="${n}" aria-pressed="${n === sel}"><img src="${IMG[img]}" alt=""><b>${n} layer${n > 1 ? 's' : ''}</b><span>${r}</span></button>`).join('')}</div>
  <section class="card clip rows" aria-label="What to wear">${ROWS[sel].map(([s, i, w]) => `<div class="lrow"><span class="slot">${s}</span><span class="stack" style="gap:1px"><span style="font:700 15px var(--display)">${i}</span><span class="soft" style="font-size:13px">${w}</span></span></div>`).join('')}</section>
  <section class="stack" style="gap:8px" aria-label="Materials"><h2 class="h2">Picking the right materials</h2>
    <div class="card clip rows">${[['Wool / Merino', '#7A8C74', 'warm, even when damp', 'any'], ['Cashmere', '#D8C8AE', 'light, soft, very warm', S.unit === 'F' ? '41–59°' : '5–15°'], ['Down', '#22325E', 'warmest per gram', S.unit === 'F' ? '<41°' : '<5°'], ['Cotton / Linen', '#E9E2D2', 'breathable, cold when wet', S.unit === 'F' ? '68°+' : '20°+']]
      .map(([n, c, s, r]) => `<div class="mrow"><span class="dot" style="background:${c};${c === '#E9E2D2' ? 'border:1px solid #C9BCA6' : ''}"></span><span style="flex:1;min-width:0"><b>${n}</b> <span class="soft" style="font-size:13px">${s}</span></span><span class="mono" style="font-size:12px;color:var(--cobalt)">${r}</span></div>`).join('')}</div>
  </section>`;
}

// ---------- Travel ----------
function packing(days) {
  const n = days.length;
  const lo = Math.round(Math.min(...days.map((d) => personal(d.flo)))), hi = Math.round(Math.max(...days.map((d) => d.hi)));
  const rainy = days.filter((d) => d.rain >= 50).length, snow = days.some((d) => cond(d.code).k === 'snow');
  const it = [];
  const add = (key, name, qty, why) => it.push({ key, name, qty, why });
  add('tees', 'T-shirts', Math.ceil(n * 0.7), 'Rewear the rest');
  if (lo < 12) add('merino', 'Merino long-sleeves', Math.max(1, Math.ceil(n / 3)), `Base layer for ${fmtT(lo)} mornings`);
  if (hi >= 18) add('shirt', 'Linen or oxford shirt', Math.max(1, Math.ceil(n / 4)), `Highs reach ${fmtT(hi)}`);
  if (lo < 16) add('knit', S.prefs.wool ? 'Cashmere knit or fleece' : 'Knit or fleece', n > 4 ? 2 : 1, 'Mid layer for cool mornings');
  if (lo < 4) add('puffer', 'Down puffer', 1, `Feels as low as ${fmtT(lo)} to you`);
  else if (lo < 12) add('coat', 'Coat or trench', 1, 'Warm outer for evenings');
  if (rainy || snow) add('shell', 'Rain shell', 1, `${rainy} wet day${rainy === 1 ? '' : 's'} in the forecast`);
  add('trousers', 'Trousers or jeans', Math.ceil(n / 3) + 1, 'Dark colours hide wear');
  if (hi >= 22) add('shorts', 'Shorts', 2, `Warm afternoons up to ${fmtT(hi)}`);
  add('shoes', rainy || snow || lo < 4 ? 'Water-resistant boots' : 'Walking sneakers', 1, rainy ? 'Wet streets' : 'For walking days');
  if (lo < 5 || (S.prefs.gloves && lo < 8)) add('hat', 'Beanie, scarf & gloves', 1, `Lows of ${fmtT(lo)} for you`);
  if (rainy >= 2) add('umbrella', 'Compact umbrella', 1, 'Rain on more than one day');
  if (hi >= 20) add('sun', 'Sunglasses & SPF', 1, 'Bright, warm days');
  return { lo, hi, rainy, items: it };
}
function vTravel() {
  const p = S.trip.place, n = S.trip.days, pid = placeLabel(p);
  const destHtml = DESTS.map((d, i) => {
    const t = S.destTemps && S.destTemps[i], on = d.name === p.name && d.country === p.country;
    return `<button class="dest" data-act="dest" data-i="${i}" aria-pressed="${on}"><b>${esc(d.name)}</b><span class="soft" style="font-size:12px">${esc(d.country)}</span><span class="mono" style="font-size:13px;margin-top:4px">${t ? fmtT(t.t) + ' · ' + cond(t.code).t : '…'}</span></button>`;
  }).join('');
  let chips = '', pack = '';
  if (S.tripWx) {
    const days = S.tripWx.days.slice(0, n), P = packing(days), pk = S.packed[pid] || {};
    const done = P.items.filter((i) => pk[i.key]).length;
    const last = days[n - 1];
    chips = `<div class="chips"><span class="chip">${dShort(days[0].date)} – ${dShort(last.date)} ${new Date(last.date + 'T12:00').toLocaleDateString('en-GB', { month: 'short' })}</span><span class="chip mono">${fmtT(Math.min(...days.map((d) => d.lo)))} to ${fmtT(P.hi)}${S.unit}</span><span class="chip sky">${P.rainy} rainy day${P.rainy === 1 ? '' : 's'}</span></div>`;
    pack = `
    <section class="stack" style="gap:8px" aria-label="Packing list">
      <div class="between"><h2 class="h2">Packing list</h2><span class="mono soft" style="font-size:12px">${done} of ${P.items.length} packed</span></div>
      <div class="progress" aria-hidden="true"><i style="width:${P.items.length ? done / P.items.length * 100 : 0}%"></i></div>
      <div class="card clip rows">${P.items.map((i) => `<label class="pack ${pk[i.key] ? 'done' : ''}"><input type="checkbox" data-act="pack" data-key="${i.key}" ${pk[i.key] ? 'checked' : ''}><span class="stack" style="flex:1;min-width:0"><b style="font-size:14px">${esc(i.name)}</b><span class="soft" style="font-size:12px">${esc(i.why)}</span></span><span class="qty">×${i.qty}</span></label>`).join('')}</div>
    </section>
    <button class="btn" data-act="pack-all" data-all="${done === P.items.length}">${done === P.items.length ? 'All packed. Have a good trip' : 'Mark everything packed'}</button>`;
  } else if (S.tripErr) pack = `<div class="notice err">${esc(S.tripErr)}<br><button class="btn out" data-act="trip-reload" style="margin-top:8px">Try again</button></div>`;
  else pack = '<div class="skeleton" style="height:260px"></div>';

  let hotels = '', src = 'From OpenStreetMap';
  const known = KNOWN_HOTELS[p.name];
  const row = (name, sub) => `<div class="hotel"><span class="ic">${ic('bed', 18)}</span><span class="stack" style="flex:1;min-width:0"><b style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</b><span class="soft" style="font-size:12px">${esc(sub)}</span></span><a href="${gmaps(name + ', ' + p.name)}" target="_blank" rel="noopener" aria-label="Open ${esc(name)} in Google Maps">Map</a></div>`;
  if (S.hotelsState === 'loading') hotels = '<div class="skeleton" style="height:150px"></div>';
  else if (S.hotelsState === 'ok' && S.hotels.length) hotels = `<div class="card clip rows">${S.hotels.map((h) => row(h.name, (h.stars ? '★'.repeat(Math.min(5, Math.round(h.stars))) + ' · ' : '') + h.km.toFixed(1) + ' km from centre' + (h.street ? ' · ' + h.street : ''))).join('')}</div>`;
  else if (known) { src = 'Well-known picks'; hotels = `<div class="card clip rows">${known.map((h) => row(h[0], h[1])).join('')}</div>`; }
  else hotels = `<div class="notice info">No hotel list for ${esc(p.name)} right now. <a href="${gmaps('hotels in ' + pid)}" target="_blank" rel="noopener">Search hotels on Google Maps</a>.</div>`;

  return `
  <div class="between" style="align-items:center"><h1 class="h1">Plan your trip</h1><button class="pill" data-act="open-sheet" data-mode="trip">Search a city</button></div>
  <div class="dests" role="group" aria-label="Destinations">${destHtml}</div>
  <section class="card p14 stack" style="gap:10px" aria-label="Trip details">
    <div class="stack"><span class="eyebrow">Destination</span><span style="font:700 18px var(--display)">${esc(pid)}</span></div>
    <div class="seg" role="group" aria-label="Trip length">${[3, 5, 7].map((k) => `<button data-act="trip-days" data-n="${k}" aria-pressed="${k === n}">${k} days</button>`).join('')}</div>
    ${chips}
  </section>
  <section class="card clip" aria-label="Map">
    <iframe class="map" title="Google Map of ${esc(pid)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${gmapsEmbed(p)}"></iframe>
    <div style="padding:12px;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn out" href="${gmaps(pid)}" target="_blank" rel="noopener">${ic('ext', 15, 2.2)}Open in Google Maps</a>
      <a class="btn out" href="${gmaps('hotels in ' + pid)}" target="_blank" rel="noopener">${ic('bed', 15, 2.2)}Hotels on the map</a>
    </div>
  </section>
  <section class="stack" style="gap:8px" aria-label="Where to stay">
    <div class="between"><h2 class="h2">Where to stay</h2><span class="soft" style="font-size:11px">${src}</span></div>
    <div class="ad"><span class="ic">${ic('bed', 22)}</span><span class="stack" style="gap:2px"><span class="eyebrow">Sponsored · ad slot</span><b>Partner hotel in ${esc(p.name)}</b><span class="soft" style="font-size:12px">A booking partner’s offer appears here once one is connected.</span></span></div>
    ${hotels}
  </section>
  ${pack}`;
}

// ---------- Profile ----------
function vProfile() {
  const c = S.comfort, o = c.offset, abs = Math.round(Math.abs(S.unit === 'F' ? o * 9 / 5 : o) * 2) / 2;
  const trail = c.trail.length > 1 ? c.trail : [0, 0], step = 310 / (trail.length - 1);
  const spark = trail.map((v, i) => Math.round(i * step) + ',' + Math.round(28 - v * 6)).join(' ');
  const DOT = { cold: ['#1F4FD8', 'C', 'Too cold'], right: ['#1E8A5A', '✓', 'Just right'], warm: ['#B8651A', 'W', 'Too warm'] };
  const y = new Date(); y.setDate(y.getDate() - 1);
  let ck = dateKey(y), cw = S.worn[ck], q = 'How did yesterday feel?';
  if (!cw) { ck = dateKey(); cw = S.worn[ck]; q = 'How does today feel?'; }
  const cLook = cw && LOOKS.find((l) => l.id === cw.id);
  const top = Object.entries(S.weights).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const prefs = [['gloves', 'Cold hands', 'Suggest gloves when it feels below ' + fmtT(8)], ['transit', 'Warm on public transport', 'Favour layers you can take off'], ['wool', 'Wool itches', 'Swap wool for cotton or cashmere'], ['alert', 'Morning outfit alert', 'Remind me at 07:30']];
  const fy = S.wx ? personal(dayFeels(S.wx.days[0])) : null;
  const updated = S.wx ? new Date(S.wx.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '–';
  const since = S.user.since ? new Date(S.user.since).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '';
  return `
  <section style="display:flex;align-items:center;gap:14px" aria-label="Account">
    <span class="avatar" style="width:60px;height:60px;font:800 20px var(--display)">${esc(S.user.name.slice(0, 2).toUpperCase())}</span>
    <div class="stack" style="gap:2px;min-width:0"><span style="font:800 22px/1.1 var(--display);letter-spacing:-.01em">${esc(S.user.name)}</span><span class="soft" style="font-size:13px">${esc(S.place.name)}${since ? ' · member since ' + since : ''}</span>
      ${top.length ? `<span class="chips" style="gap:4px;margin-top:4px">${top.map(([t, v]) => `<span class="chip sky" style="font-size:11px;padding:2px 8px">${TAGS[t]} ×${v}</span>`).join('')}</span>` : ''}</div>
  </section>
  <section class="comfort" aria-label="Comfort profile">
    <div class="between" style="align-items:flex-start"><div class="stack" style="gap:2px"><span class="eyebrow" style="color:#A9B9F2">Your comfort profile</span><span style="font:800 24px/1.1 var(--display)">${c.n === 0 ? 'Still learning' : abs < 0.5 ? 'You run about average' : 'You run ' + abs + '° ' + (o > 0 ? 'cold' : 'warm')}</span></div><span class="mono" style="font-weight:700;font-size:22px;color:#A9B9F2">${fmtD(o)}</span></div>
    <div class="stack" style="gap:6px"><div class="gauge"><span class="mid"></span><span class="knob" style="left:${(o + 4) / 8 * 100}%"></span></div><div style="display:flex;justify-content:space-between;font-size:11px;color:#B8B2A6"><span>Runs warm</span><span>Average</span><span>Runs cold</span></div></div>
    <svg width="100%" height="56" viewBox="0 0 310 56" preserveAspectRatio="none" role="img" aria-label="How your comfort offset changed over your check-ins"><line x1="0" y1="28" x2="310" y2="28" stroke="#3A3F4E" stroke-width="1" stroke-dasharray="3 4"/><polyline points="${spark}" fill="none" stroke="#7FA0F0" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
    <span style="font-size:13px;line-height:1.45;color:#D9D3C7">${fy == null ? 'Your forecast is loading.' : `Today feels like ${fmtT(dayFeels(S.wx.days[0]))} in ${esc(S.place.name)}. For you that is about ${fmtT(fy)}, so we pick ${layersFor(fy)} layer${layersFor(fy) > 1 ? 's' : ''}${S.prefs.gloves && fy < 8 ? ' and gloves' : ''}.`}</span>
    <span class="mono" style="font-size:11px;color:#A9B9F2">${c.n} check-in${c.n === 1 ? '' : 's'} · confidence ${Math.min(95, c.n * 10)}%</span>
  </section>
  <section class="card p14 stack" style="gap:10px" aria-label="Daily check-in">
    <div class="stack" style="gap:2px"><span class="h2">${q}</span><span class="soft" style="font-size:13px">${cLook ? `${dLabel(ck, ck === dateKey() ? 0 : 1)} · ${esc(cLook.n)} · felt like ${fmtT(cw.feels)}` : 'Open Today first so we know what you wore.'}</span></div>
    <div class="feel-btns"><button class="f-cold" data-act="feel" data-f="cold" data-day="${ck}">Too cold</button><button class="f-right" data-act="feel" data-f="right" data-day="${ck}">Just right</button><button class="f-warm" data-act="feel" data-f="warm" data-day="${ck}">Too warm</button></div>
    ${S.checkMsg ? `<span style="font-size:13px;font-weight:600">${esc(S.checkMsg)}</span>` : ''}
    <div class="hist"><span class="eyebrow" style="margin-right:4px">Last 10</span>${c.history.map((f) => `<i title="${DOT[f][2]}" style="background:${DOT[f][0]}">${DOT[f][1]}</i>`).join('') || '<span class="soft" style="font-size:12px">No check-ins yet</span>'}</div>
    <span class="soft" style="font-size:11px">C too cold · ✓ just right · W too warm</span>
  </section>
  <section class="stack" style="gap:8px" aria-label="Comfort settings"><h2 class="h2">What you've told us</h2>
    <div class="card clip rows">${prefs.map(([k, t, s]) => `<div class="switch-row"><span class="stack" style="flex:1;min-width:0"><b style="font-size:14px">${t}</b><span class="soft" style="font-size:12px">${s}</span></span><button class="switch" data-act="pref" data-k="${k}" aria-pressed="${!!S.prefs[k]}" aria-label="${t}"><span></span></button></div>`).join('')}</div>
  </section>
  <section class="card p14 stack" style="gap:10px" aria-label="Weather source">
    <div class="between" style="align-items:center"><span class="h2">Live weather</span><span style="display:flex;align-items:center;gap:6px;font:700 12px var(--body);color:${S.wx && !S.wx.stale ? 'var(--good-ink)' : 'var(--warm-ink)'}"><span style="width:8px;height:8px;border-radius:50%;background:${S.wx && !S.wx.stale ? 'var(--good)' : 'var(--warm)'}"></span>${S.wx && !S.wx.stale ? 'Connected' : 'Offline copy'}</span></div>
    <div class="kv"><span class="soft">Source</span><span style="font-weight:600">Open-Meteo forecast API</span><span class="soft">Location</span><span style="font-weight:600">${esc(placeLabel(S.place))}</span><span class="soft">Updated</span><span class="mono">${updated}</span></div>
    <div class="seg" role="group" aria-label="Units"><button data-act="unit" data-u="C" aria-pressed="${S.unit === 'C'}">°C</button><button data-act="unit" data-u="F" aria-pressed="${S.unit === 'F'}">°F</button></div>
    <button class="top-link" style="justify-content:flex-start" data-act="how" aria-expanded="${S.howOpen}">How your picks are calculated</button>
    ${S.howOpen ? `<p class="soft" style="font-size:13px;line-height:1.5">We take the forecast's feels-like temperature, subtract your comfort offset (${fmtD(o)}), and pick the look whose range fits, boosted by the styles you liked and by rain readiness. Each check-in moves your offset by up to 1.5°, in smaller steps as check-ins add up.</p>` : ''}
  </section>`;
}

// ---------- location sheet ----------
function vSheet() {
  const sh = S.sheet;
  return `<div class="scrim" data-act="close-sheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="${sh.mode === 'trip' ? 'Choose a destination' : 'Choose your location'}" data-stop>
    <div class="between" style="align-items:center"><h2 class="h2" style="font-size:18px">${sh.mode === 'trip' ? 'Where are you going?' : 'Where are you?'}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Close">${ic('x', 18)}</button></div>
    <form class="search" data-form="search" style="display:flex;gap:8px"><label for="q" style="position:absolute;left:-9999px">City</label><input id="q" name="q" placeholder="Search a city" value="${esc(sh.q || '')}" autocomplete="off"><button class="btn" type="submit" style="width:auto;height:48px;padding:0 16px;font-size:14px;border-radius:12px">Search</button></form>
    ${sh.mode === 'home' ? `<button class="btn out" data-act="locate" style="width:100%">${ic('locate', 16)} Use my current location</button>` : ''}
    ${sh.loading ? '<div class="skeleton" style="height:100px"></div>' : ''}
    ${sh.err ? `<div class="notice err">${esc(sh.err)}</div>` : ''}
    ${sh.results ? (sh.results.length ? `<div class="card clip rows">${sh.results.map((r, i) => `<button class="result" data-act="pick-place" data-i="${i}"><span><b>${esc(r.name)}</b><br><span class="soft" style="font-size:12px">${esc([r.region, r.country].filter(Boolean).join(', '))}</span></span>${ic('pin', 16)}</button>`).join('')}</div>` : '<p class="soft">No places found. Try another spelling.</p>') : ''}
  </div></div>`;
}

// ---------- render ----------
const ROUTES = { today: vToday, outfit: vOutfit, week: vWeek, layers: vLayers, travel: vTravel, profile: vProfile };
const route = () => { const r = location.hash.slice(1); return ROUTES[r] ? r : 'today'; };
function render() {
  const app = document.getElementById('app');
  if (!S.user) { app.innerHTML = vLogin(); return; }
  const r = route();
  const head = r === 'profile'
    ? `<header class="top"><a class="back" href="#today" aria-label="Back to Today">${ic('back', 22, 2.2)}</a><span class="top-title">Profile</span><button class="top-link" data-act="signout">Sign out</button></header>`
    : header();
  app.innerHTML = head + `<main class="${r === 'today' ? 'g16' : ''}">${ROUTES[r]()}</main>` + tabs(r) + (S.sheet ? vSheet() : '');
  wireDeck();
}

// ---------- swipe ----------
function wireDeck() {
  const card = document.querySelector('#deck .swipe');
  if (!card) return;
  let sx = 0, dx = 0, drag = false;
  card.addEventListener('pointerdown', (e) => { drag = true; sx = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
  card.addEventListener('pointermove', (e) => {
    if (!drag) return; dx = e.clientX - sx;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    card.style.setProperty('--like', Math.max(0, Math.min(1, dx / 90)));
    card.style.setProperty('--nope', Math.max(0, Math.min(1, -dx / 90)));
  });
  const end = () => {
    if (!drag) return; drag = false;
    if (dx > 90) rate(1); else if (dx < -90) rate(-1);
    else { card.style.transition = ''; card.style.transform = ''; card.style.setProperty('--like', 0); card.style.setProperty('--nope', 0); }
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
  card.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') rate(1); if (e.key === 'ArrowLeft') rate(-1); });
}
function rate(v) {
  const card = document.querySelector('#deck .swipe');
  if (!card || S.anim) return;
  S.anim = true;
  const look = LOOKS.find((l) => l.id === card.dataset.id);
  card.style.transition = 'transform .28s ease, opacity .28s ease';
  card.style.setProperty(v > 0 ? '--like' : '--nope', 1);
  card.style.transform = `translateX(${v > 0 ? 130 : -130}%) rotate(${v > 0 ? 16 : -16}deg)`;
  card.style.opacity = '0';
  setTimeout(() => {
    S.ratings[look.id] = v;
    look.tags.forEach((t) => { S.weights[t] = Math.round(((S.weights[t] || 0) + (v > 0 ? 1 : -0.5)) * 10) / 10; });
    save('ratings', 'weights');
    S.anim = false;
    render();
    document.querySelector('#deck .swipe')?.focus({ preventScroll: true });
  }, 300);
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.classList.contains('scrim') && e.target.closest('[data-stop]')) return;
  const a = el.dataset.act;
  if (a === 'rate') rate(+el.dataset.v);
  else if (a === 'reset-style') { DECK.forEach((l) => delete S.ratings[l.id]); S.weights = {}; save('ratings', 'weights'); render(); }
  else if (a === 'reload') { S.wx = null; loadHome(true); }
  else if (a === 'feel') {
    const before = S.comfort.offset;
    S.comfort = learn(S.comfort, el.dataset.f);
    if (S.worn[el.dataset.day]) S.worn[el.dataset.day].rated = el.dataset.f;
    save('comfort', 'worn');
    const diff = S.comfort.offset - before;
    S.checkMsg = el.dataset.f === 'right' ? `Noted. Your profile holds at ${fmtD(S.comfort.offset)} and gets more certain.` : `Adjusted by ${fmtD(diff)}. Tomorrow’s pick will be ${diff > 0 ? 'warmer' : 'lighter'}.`;
    toast(S.checkMsg); render();
  }
  else if (a === 'wear') {
    const k = dateKey();
    S.worn[k] = Object.assign({}, S.worn[k], { id: el.dataset.id, chosen: true, feels: Math.round(dayFeels(S.wx.days[0])), place: S.place.name });
    S.swatch = 0; save('worn'); render(); window.scrollTo(0, 0);
  }
  else if (a === 'swatch') { S.swatch = +el.dataset.i; render(); }
  else if (a === 'week') { S.weekSel = +el.dataset.i; render(); }
  else if (a === 'layer') { S.layerSel = +el.dataset.n; render(); }
  else if (a === 'dest') setTrip(DESTS[+el.dataset.i]);
  else if (a === 'trip-days') { S.trip.days = +el.dataset.n; save('trip'); render(); }
  else if (a === 'trip-reload') loadTrip();
  else if (a === 'pack-all') {
    const id = placeLabel(S.trip.place), all = el.dataset.all === 'true', m = {};
    if (!all) packing(S.tripWx.days.slice(0, S.trip.days)).items.forEach((i) => { m[i.key] = true; });
    S.packed[id] = m; save('packed'); render();
  }
  else if (a === 'pref') { S.prefs[el.dataset.k] = !S.prefs[el.dataset.k]; save('prefs'); recordWorn(); render(); }
  else if (a === 'unit') { S.unit = el.dataset.u; save('unit'); render(); }
  else if (a === 'how') { S.howOpen = !S.howOpen; render(); }
  else if (a === 'signout') { S.user = null; store.del('user'); S.signup = false; location.hash = ''; render(); }
  else if (a === 'toggle-signup') { S.signup = !S.signup; render(); }
  else if (a === 'forgot') toast('This prototype keeps no passwords, so there is nothing to reset.');
  else if (a === 'social') toast('Apple and Google sign-in need a sign-in service. Use your email for now.');
  else if (a === 'open-sheet') { S.sheet = { mode: el.dataset.mode, q: '', results: null }; render(); document.getElementById('q')?.focus(); }
  else if (a === 'close-sheet') { S.sheet = null; render(); }
  else if (a === 'pick-place') choosePlace(S.sheet.results[+el.dataset.i]);
  else if (a === 'locate') {
    if (!navigator.geolocation) { S.sheet.err = 'This browser cannot share your location. Search for your city instead.'; render(); return; }
    S.sheet.loading = true; render();
    navigator.geolocation.getCurrentPosition(
      (pos) => choosePlace({ name: 'My location', country: '', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => { S.sheet.loading = false; S.sheet.err = 'Location access was blocked. Search for your city instead.'; render(); },
      { timeout: 10000 }
    );
  }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.act !== 'pack') return;
  const id = placeLabel(S.trip.place);
  S.packed[id] = Object.assign({}, S.packed[id], { [el.dataset.key]: el.checked });
  save('packed'); render();
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, fd = new FormData(f);
  if (f.dataset.form === 'login') {
    const email = String(fd.get('email') || '').trim();
    if (!email) return;
    let name = String(fd.get('name') || '').trim();
    if (!name) name = S.account && S.account.email === email ? S.account.name : cap(email.split('@')[0].split(/[._-]/)[0]);
    const since = S.account && S.account.email === email && S.account.since ? S.account.since : Date.now();
    S.user = { name, email, since };
    S.account = S.user;
    save('user', 'account');
    location.hash = '#today';
    render(); loadHome(); loadDestTemps();
  } else if (f.dataset.form === 'search') {
    const q = String(fd.get('q') || '').trim(); if (!q) return;
    Object.assign(S.sheet, { q, loading: true, err: '', results: null }); render();
    try { S.sheet.results = await geocode(q); } catch (err) { S.sheet.err = 'Search failed. Check your connection and try again.'; }
    if (S.sheet) { S.sheet.loading = false; render(); }
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.sheet) { S.sheet = null; render(); } });

function choosePlace(r) {
  const p = { name: r.name, country: r.country, lat: r.lat, lon: r.lon };
  const mode = S.sheet.mode; S.sheet = null;
  if (mode === 'trip') setTrip(p);
  else { S.place = p; save('place'); S.wx = null; loadHome(); }
}
function setTrip(p) {
  S.trip.place = p; save('trip');
  S.tripWx = null; S.hotels = null; S.hotelsFor = '';
  loadTrip();
}
window.addEventListener('hashchange', () => {
  render(); window.scrollTo(0, 0);
  if (route() === 'travel') { loadDestTemps(); if (!S.tripWx && !S.tripLoading) loadTrip(); }
});

// ---------- boot ----------
render();
if (S.user) {
  loadHome();
  if (route() === 'travel') { loadDestTemps(); loadTrip(); }
}
