'use strict';
/* TempThreads prototype: live weather from Open-Meteo, hotels from OpenStreetMap,
   maps from Google Maps. Profile, comfort learning and style weights live in localStorage. */

// ---------- storage ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('tt2:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('tt2:' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
  del(k) { try { localStorage.removeItem('tt2:' + k); } catch (e) {} }
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- data ----------
const IMG = {
  street: 'assets/look-street.jpg', classic: 'assets/look-classic.jpg', knit: 'assets/knit.jpg',
  coat: 'assets/wool-coat.jpg', brown: 'assets/brown-puffer.jpg', puffer: 'assets/puffer.jpg'
};
const G = {
  'tee-white': { n: 'White tee', slot: 'base', shape: 'tee', c: '#F2F0EA' },
  'linen': { n: 'Linen shirt', slot: 'base', shape: 'shirt', c: '#E8DCC4' },
  'oxford': { n: 'Oxford shirt', slot: 'base', shape: 'shirt', c: '#9DB8E0' },
  'merino': { n: 'Merino long-sleeve', slot: 'base', shape: 'long', c: '#7A8C74', wool: 1 },
  'knit': { n: 'Cashmere knit', slot: 'mid', shape: 'long', c: '#D8C8AE' },
  'hoodie': { n: 'Grey hoodie', slot: 'mid', shape: 'long', c: '#A7AAB0' },
  'fleece': { n: 'Fleece', slot: 'mid', shape: 'jacket', c: '#B5523B' },
  'utility': { n: 'Utility jacket', slot: 'outer', shape: 'jacket', c: '#D9C7A4' },
  'shell': { n: 'Rain shell', slot: 'outer', shape: 'jacket', c: '#2F8A7A', rain: 1 },
  'navycoat': { n: 'Navy wool coat', slot: 'outer', shape: 'coat', c: '#22325E', wool: 1 },
  'coat': { n: 'Double-breasted coat', slot: 'outer', shape: 'coat', c: '#2A3550', wool: 1 },
  'trench': { n: 'Trench coat', slot: 'outer', shape: 'coat', c: '#C2A272', rain: 1 },
  'brownpuffer': { n: 'Quilted puffer', slot: 'outer', shape: 'puffer', c: '#8A6A4F' },
  'puffer': { n: 'Down puffer', slot: 'outer', shape: 'puffer', c: '#1D2A44' },
  'chinos': { n: 'Chinos', slot: 'bottom', shape: 'trousers', c: '#BFA67F' },
  'jeans': { n: 'Dark jeans', slot: 'bottom', shape: 'trousers', c: '#2D3E5E' },
  'wooltr': { n: 'Wool trousers', slot: 'bottom', shape: 'trousers', c: '#D2C4AC', wool: 1 },
  'shorts': { n: 'Shorts', slot: 'bottom', shape: 'shorts', c: '#C8B897' },
  'sneakers': { n: 'Sneakers', slot: 'shoes', shape: 'sneaker', c: '#E9E2D2' },
  'boots': { n: 'Leather boots', slot: 'shoes', shape: 'boot', c: '#6B4428', rain: 1 },
  'loafers': { n: 'Loafers', slot: 'shoes', shape: 'sneaker', c: '#5A3A26' },
  'beanie': { n: 'Beanie', slot: 'extra', shape: 'beanie', c: '#15171C' },
  'scarf': { n: 'Wool scarf', slot: 'extra', shape: 'scarf', c: '#B08C3E', wool: 1 }
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

// min/max = comfortable range of PERSONAL feels-like temperature (°C)
const LOOKS = [
  { id: 'linen', n: 'Summer Linen', tags: ['minimal', 'smart'], min: 22, max: 35, p: ['linen', 'shorts', 'loafers'] },
  { id: 'weekend', n: 'Weekend Tee', tags: ['casual', 'minimal'], min: 18, max: 30, p: ['tee-white', 'jeans', 'sneakers'] },
  { id: 'oxford', n: 'Oxford & Chinos', tags: ['smart', 'minimal'], min: 15, max: 23, p: ['oxford', 'chinos', 'loafers'] },
  { id: 'knit', n: 'Light Knit', tags: ['minimal', 'casual'], min: 12, max: 18, img: 'knit', p: ['tee-white', 'knit', 'chinos', 'sneakers'] },
  { id: 'street', n: 'Street Utility', tags: ['casual', 'street'], min: 8, max: 14, img: 'street', p: ['hoodie', 'utility', 'chinos', 'sneakers', 'beanie'] },
  { id: 'shell', n: 'Shell & Knit', tags: ['outdoor', 'minimal'], min: 6, max: 14, rain: 1, p: ['merino', 'knit', 'shell', 'jeans', 'boots'] },
  { id: 'trench', n: 'Trench Office', tags: ['smart'], min: 7, max: 15, rain: 1, p: ['oxford', 'knit', 'trench', 'wooltr', 'loafers'] },
  { id: 'classic', n: 'Classic Casual', tags: ['smart', 'minimal'], min: 4, max: 12, img: 'classic', p: ['oxford', 'knit', 'navycoat', 'wooltr', 'boots'] },
  { id: 'hiker', n: 'Merino Trail', tags: ['outdoor', 'sporty'], min: 2, max: 11, rain: 1, p: ['merino', 'fleece', 'shell', 'chinos', 'boots'] },
  { id: 'city', n: 'City Coat', tags: ['smart', 'street'], min: 1, max: 9, img: 'coat', p: ['merino', 'knit', 'coat', 'wooltr', 'boots', 'scarf'] },
  { id: 'autumn', n: 'Autumn Puffer', tags: ['outdoor', 'casual'], min: 0, max: 8, img: 'brown', p: ['merino', 'brownpuffer', 'jeans', 'boots'] },
  { id: 'winter', n: 'Deep Winter', tags: ['outdoor', 'street'], min: -15, max: 2, img: 'puffer', p: ['merino', 'fleece', 'puffer', 'wooltr', 'boots', 'beanie', 'scarf'] }
];
const TAGS = { casual: 'Casual', minimal: 'Minimal', smart: 'Smart', street: 'Street', outdoor: 'Outdoor', sporty: 'Sporty' };
const DESTS = [
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lon: 12.5683 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3874, lon: 2.1686 },
  { name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lon: -21.9426 },
  { name: 'Marrakesh', country: 'Morocco', lat: 31.6295, lon: -7.9811 },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.006 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 }
];

// ---------- state ----------
const S = {
  user: store.get('user', null),
  place: store.get('place', { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 }),
  unit: store.get('unit', 'C'),
  comfort: store.get('comfort', { offset: 0, n: 0, history: [], trail: [0] }),
  weights: store.get('weights', {}),
  ratings: store.get('ratings', {}),
  prefs: store.get('prefs', { gloves: true, transit: true, wool: false }),
  worn: store.get('worn', {}),
  trip: store.get('trip', { place: DESTS[0], days: 5 }),
  packed: store.get('packed', {}),
  wx: null, wxErr: '', wxLoading: false,
  tripWx: null, tripErr: '', tripLoading: false,
  destTemps: null,
  hotels: null, hotelsFor: '', hotelsState: 'idle',
  weekOpen: 0, layerSel: null, sheet: null, anim: false, checkMsg: ''
};
const save = (...keys) => keys.forEach((k) => store.set(k, S[k]));

// ---------- helpers ----------
const fmtT = (c) => Math.round(S.unit === 'F' ? c * 9 / 5 + 32 : c) + '°';
const fmtD = (d) => { const v = S.unit === 'F' ? d * 9 / 5 : d; const r = Math.round(v * 2) / 2; return (r > 0 ? '+' : '') + r.toFixed(1) + '°'; };
const dateKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const dayLabel = (iso, i) => i === 0 ? 'Today' : new Date(iso + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short' });
const dayFull = (iso) => new Date(iso + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
const placeLabel = (p) => p.name + (p.country ? ', ' + p.country : '');
function cond(code) {
  if (code === 0) return { k: 'sun', t: 'Clear' };
  if (code <= 2) return { k: 'partly', t: 'Partly cloudy' };
  if (code === 3) return { k: 'cloudy', t: 'Overcast' };
  if (code === 45 || code === 48) return { k: 'cloudy', t: 'Fog' };
  if (code >= 51 && code <= 57) return { k: 'rain', t: 'Drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { k: 'rain', t: 'Rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { k: 'snow', t: 'Snow' };
  if (code >= 95) return { k: 'rain', t: 'Thunderstorms' };
  return { k: 'cloudy', t: 'Cloudy' };
}
const dayFeels = (d) => (d.fhi * 2 + d.flo) / 3;           // daytime-weighted feels-like
const personal = (feels) => feels - S.comfort.offset;      // positive offset = runs cold
const layersFor = (f) => f >= 20 ? 1 : f >= 10 ? 2 : 3;

function score(look, feelsYou, rain) {
  const mid = (look.min + look.max) / 2;
  let s = (feelsYou >= look.min && feelsYou <= look.max) ? 10 - Math.abs(feelsYou - mid) / 3
    : -Math.min(Math.abs(feelsYou - look.min), Math.abs(feelsYou - look.max)) * 2;
  if (rain >= 50) s += (look.rain || look.p.includes('boots')) ? 3 : -4;
  s += look.tags.reduce((a, t) => a + (S.weights[t] || 0), 0) * 1.2;
  if (S.ratings[look.id] === 1) s += 2;
  if (S.ratings[look.id] === -1) s -= 4;
  if (S.prefs.wool && look.p.some((id) => G[id].wool)) s -= 3;
  return s;
}
const ranked = (feelsYou, rain) => [...LOOKS].sort((a, b) => score(b, feelsYou, rain) - score(a, feelsYou, rain));
const bestFor = (d) => ranked(personal(dayFeels(d)), d.rain)[0];

// Comfort learning: each check-in nudges the offset; the step shrinks as evidence builds (floor 0.25).
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
    if (!r.ok) throw new Error('The weather service answered ' + r.status);
    const j = await r.json();
    const d = j.daily;
    const data = {
      at: Date.now(), tz: j.timezone,
      current: { t: j.current.temperature_2m, feels: j.current.apparent_temperature, code: j.current.weather_code, wind: j.current.wind_speed_10m },
      days: d.time.map((date, i) => ({
        date, hi: d.temperature_2m_max[i], lo: d.temperature_2m_min[i], fhi: d.apparent_temperature_max[i], flo: d.apparent_temperature_min[i],
        rain: d.precipitation_probability_max[i] ?? 0, wind: d.wind_speed_10m_max[i], code: d.weather_code[i]
      }))
    };
    store.set(key, data);
    return data;
  } catch (e) {
    if (cached) return Object.assign({}, cached, { stale: true });
    throw e;
  }
}
async function getDestTemps() {
  const cached = store.get('dest-temps', null);
  if (cached && Date.now() - cached.at < 60 * 60 * 1000) return cached.list;
  const url = `${FORECAST}?latitude=${DESTS.map((d) => d.lat).join(',')}&longitude=${DESTS.map((d) => d.lon).join(',')}&current=temperature_2m,weather_code&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('weather ' + r.status);
  const j = await r.json();
  const list = (Array.isArray(j) ? j : [j]).map((x) => ({ t: x.current.temperature_2m, code: x.current.weather_code }));
  store.set('dest-temps', { at: Date.now(), list });
  return list;
}
async function geocode(q) {
  const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=' + encodeURIComponent(q));
  if (!r.ok) throw new Error('search ' + r.status);
  const j = await r.json();
  return (j.results || []).map((x) => ({ name: x.name, country: x.country || '', region: x.admin1 || '', lat: x.latitude, lon: x.longitude }));
}
// Hotels from OpenStreetMap via Overpass. Public servers are often busy, so try two and cache for a day.
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
        const km = distKm(p.lat, p.lon, lat, lon);
        const stars = parseFloat(e.tags.stars) || 0;
        return { name: e.tags.name, stars, km, website: e.tags.website || e.tags['contact:website'] || '', street: e.tags['addr:street'] || '' };
      }).filter((h) => h.name)
        .sort((a, b) => (b.stars - a.stars) || ((b.website ? 1 : 0) - (a.website ? 1 : 0)) || (a.km - b.km))
        .slice(0, 6);
      store.set(key, { at: Date.now(), list });
      return list;
    } catch (e) { clearTimeout(timer); lastErr = e; }
  }
  throw lastErr;
}
function distKm(a, b, c, d) {
  const R = 6371, toR = (x) => x * Math.PI / 180;
  const dLat = toR(c - a), dLon = toR(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const gmapsSearch = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const gmapsEmbed = (p) => 'https://www.google.com/maps?output=embed&z=12&q=' + encodeURIComponent(placeLabel(p));

// ---------- loading ----------
async function loadHome(force) {
  S.wxLoading = true; S.wxErr = ''; render();
  try { S.wx = await getForecast(S.place, force); }
  catch (e) { S.wxErr = 'Could not load the weather. Check your connection and try again.'; }
  S.wxLoading = false;
  recordWorn();
  render();
}
async function loadTrip() {
  const p = S.trip.place;
  S.tripLoading = true; S.tripErr = ''; render();
  try { S.tripWx = await getForecast(p); }
  catch (e) { S.tripErr = 'Could not load the forecast for ' + p.name + '.'; S.tripWx = null; }
  S.tripLoading = false;
  render();
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
  try { S.destTemps = await getDestTemps(); render(); } catch (e) { /* list still works without temperatures */ }
}
// Remember what today's pick was, so tomorrow's check-in can ask about it.
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
function wxIcon(k, size = 56) {
  const sun = '<circle cx="22" cy="22" r="8" fill="#FFD27A"/><g stroke="#FFD27A" stroke-width="2.5" stroke-linecap="round"><path d="M22 6v4M22 34v4M6 22h4M34 22h4M10.7 10.7l2.8 2.8M30.5 30.5l2.8 2.8M10.7 33.3l2.8-2.8M30.5 13.5l2.8-2.8"/></g>';
  const cloud = (x, y, f = '#FFFFFF') => `<path transform="translate(${x} ${y})" d="M16 42h24a8 8 0 0 0 0-16 11 11 0 0 0-21-3 9 9 0 0 0-3 19z" fill="${f}" fill-opacity=".95" stroke="#7B869A" stroke-width="1.5"/>`;
  const m = {
    sun: `<g transform="translate(8 8)">${sun}</g>`,
    partly: `<g transform="translate(0 -4)">${sun}</g>${cloud(4, 6, '#EEF2F8')}`,
    cloudy: cloud(2, 2, '#EEF2F8'),
    rain: `${cloud(2, -4, '#EEF2F8')}<g stroke="#1F4FD8" stroke-width="2.5" stroke-linecap="round"><path d="M22 44l-2 6M32 44l-2 6M42 44l-2 6"/></g>`,
    snow: `${cloud(2, -4, '#EEF2F8')}<g fill="#1F4FD8"><circle cx="22" cy="48" r="2.2"/><circle cx="32" cy="51" r="2.2"/><circle cx="42" cy="48" r="2.2"/></g>`
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 60 60" aria-hidden="true">${m[k] || m.cloudy}</svg>`;
}
const I = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  outfit: '<path d="M10 6a2 2 0 1 1 2 2v1.5l8.6 6.2a1.5 1.5 0 0 1-.9 2.3H4.3a1.5 1.5 0 0 1-.9-2.3L12 9.5"/>',
  week: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 16l9 5 9-5"/>',
  travel: '<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 20v1M15 20v1"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4z"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',
  refresh: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
};
const ic = (k, size = 20, fill) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;

const lookMedia = (l, cls = '') => l.img
  ? `<img class="${cls}" src="${IMG[l.img]}" alt="${esc(l.n)}">`
  : `<div class="board ${cls}">${l.p.slice(0, 6).map(garment).join('')}</div>`;
const tagChips = (l) => l.tags.map((t) => `<span class="chip">${TAGS[t]}</span>`).join('');

let toastT;
function toast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); }

// ---------- views ----------
function vLogin() {
  const drops = [8, 20, 33, 47, 60, 72, 86, 94].map((x, i) => `<span class="drop" style="left:${x}%;animation-delay:${(i * 0.37) % 1.3}s"></span>`).join('');
  return `<div class="login">
    <div class="login-hero">${drops}<img src="assets/logo-white.png" alt="TempThreads"><span style="position:relative;font-weight:600">Dress for the forecast.</span></div>
    <form class="login-sheet" data-form="login">
      <div><h1 class="h1">Welcome</h1><p class="muted" style="margin-top:4px;font-size:14px">Set up your profile to get outfits for your weather.</p></div>
      <div class="field"><label for="li-name">First name</label><input id="li-name" name="name" autocomplete="given-name" required maxlength="40"></div>
      <div class="field"><label for="li-email">Email</label><input id="li-email" name="email" type="email" autocomplete="email" required></div>
      <button class="btn dark" type="submit">Continue</button>
      <p class="muted" style="font-size:12px">This prototype keeps your profile in this browser only. Real accounts need a sign-in service.</p>
    </form>
  </div>`;
}

function header() {
  const initials = (S.user.name || '?').slice(0, 2).toUpperCase();
  return `<header class="top">
    <img class="logo" src="assets/logo-ink.png" alt="TempThreads">
    <button class="pill" data-act="open-sheet" data-mode="home" aria-label="Change location">${ic('pin', 14)}<span>${esc(S.place.name)}</span></button>
    <a class="avatar" href="#profile" aria-label="Your profile">${esc(initials)}</a>
  </header>`;
}
function tabs(cur) {
  return `<nav class="tabs" aria-label="Sections">${[['today', 'Today'], ['outfit', 'Outfit'], ['week', '7-Day'], ['layers', 'Layers'], ['travel', 'Travel']]
    .map(([k, l]) => `<a href="#${k}" ${cur === k ? 'aria-current="page"' : ''}><span class="ic">${ic(k)}</span>${l}</a>`).join('')}</nav>`;
}
function wxStatus() {
  if (S.wx) return '';
  if (!S.wxErr) return `<div class="skeleton" style="height:170px" aria-label="Loading the weather"></div>`;
  return `<div class="notice err">${esc(S.wxErr)} <button class="btn small ghost" data-act="reload" style="margin-top:8px">Try again</button></div>`;
  return '';
}

function vToday() {
  const st = wxStatus(); if (st) return st;
  const w = S.wx, d = w.days[0], c = cond(w.current.code), feelsYou = personal(dayFeels(d)), L = layersFor(feelsYou);
  const updated = new Date(w.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yk = dateKey(y), yw = S.worn[yk];
  const yLook = yw && LOOKS.find((l) => l.id === yw.id);
  const deck = LOOKS.filter((l) => S.ratings[l.id] == null).sort((a, b) => score(b, feelsYou, d.rain) - score(a, feelsYou, d.rain));
  const prof = Object.entries(S.weights).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return `
  <section class="wx" aria-label="Weather now">
    <div class="wx-row">
      <div class="wx-temp">${fmtT(w.current.t)}</div>
      <div><div class="wx-cond">${c.t}</div><div class="wx-sub">High ${fmtT(d.hi)} · Low ${fmtT(d.lo)}</div></div>
      <span class="wx-icon">${wxIcon(c.k)}</span>
    </div>
    <div class="wx-stats">
      <div><b>${fmtT(w.current.feels)}</b><span>Feels like</span></div>
      <div><b>${fmtT(feelsYou)}</b><span>Feels to you</span></div>
      <div><b>${L} layer${L > 1 ? 's' : ''}</b><span>Needed</span></div>
    </div>
    <div class="wx-note"><span>Rain ${d.rain}% · Wind ${Math.round(w.current.wind)} km/h</span><span>${w.stale ? 'Offline copy from ' : 'Live · '}${updated}</span></div>
  </section>

  ${yLook && !yw.rated ? `<section class="card pad" style="display:flex;flex-direction:column;gap:10px" aria-label="Check-in">
    <div><h2 class="h2">How did yesterday feel?</h2><p class="muted" style="font-size:13px">${esc(yLook.n)} · felt like ${fmtT(yw.feels)} in ${esc(yw.place)}</p></div>
    <div class="feel-btns"><button class="f-cold" data-act="feel" data-f="cold" data-day="${yk}">Too cold</button><button class="f-right" data-act="feel" data-f="right" data-day="${yk}">Just right</button><button class="f-warm" data-act="feel" data-f="warm" data-day="${yk}">Too warm</button></div>
  </section>` : ''}

  <div class="row-head"><div><h1 class="h1">Find your style</h1><p class="muted" style="font-size:14px;margin-top:4px">Swipe right on looks you would wear.</p></div><span class="mono muted" style="font-size:12px">${LOOKS.length - deck.length} of ${LOOKS.length}</span></div>
  ${deck.length ? `
  <div class="deck" id="deck">
    ${deck.slice(0, 2).reverse().map((l, i, arr) => {
      const top = i === arr.length - 1;
      return `<article class="swipe ${top ? 'top' : 'next'}" data-id="${l.id}" ${top ? `tabindex="0" aria-label="${esc(l.n)}. Use the arrow keys or the buttons to rate"` : 'aria-hidden="true"'}>
        <div class="media">${lookMedia(l)}<div class="tags">${l.tags.map((t) => `<span>${TAGS[t]}</span>`).join('')}</div><span class="stamp like">LIKE</span><span class="stamp nope">NOPE</span></div>
        <div class="meta"><div class="row-head"><b style="font:700 19px var(--display)">${esc(l.n)}</b><span class="mono muted" style="font-size:12px">${fmtT(l.min)}–${fmtT(l.max)}</span></div><span class="muted" style="font-size:13px">${l.p.map((id) => G[id].n).join(' · ')}</span></div>
      </article>`;
    }).join('')}
  </div>
  <div class="deck-actions"><button class="round no" data-act="rate" data-v="-1" aria-label="Not for me">${ic('x', 24)}</button><button class="round yes" data-act="rate" data-v="1" aria-label="I would wear this">${ic('heart', 24, 1)}</button></div>`
    : `<div class="card pad" style="text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center"><b class="h2">Your style is set</b><span class="muted" style="font-size:14px">Picks now lean toward what you liked.</span><button class="btn small dark" data-act="reset-style">Rate again</button></div>`}
  <section class="card pad" aria-label="Your taste" style="display:flex;flex-direction:column;gap:8px">
    <span class="eyebrow">Your taste so far</span>
    ${prof.length ? `<div class="chips">${prof.map(([t, v]) => `<span class="chip sky">${TAGS[t]} <span class="mono" style="font-size:11px">×${v}</span></span>`).join('')}</div>` : '<span class="muted" style="font-size:13px">Like a few looks and your styles show up here.</span>'}
  </section>`;
}

function whyText(look, d) {
  const fy = personal(dayFeels(d)), off = S.comfort.offset;
  const bits = [`it suits ${fmtT(look.min)}–${fmtT(look.max)}, and today feels like ${fmtT(fy)} to you`];
  if (Math.abs(off) >= 0.5) bits.push(`we've adjusted ${fmtD(off)} because you run ${off > 0 ? 'cold' : 'warm'}`);
  if (d.rain >= 50 && (look.rain || look.p.includes('boots'))) bits.push('it handles the rain');
  const liked = look.tags.filter((t) => (S.weights[t] || 0) > 0).map((t) => TAGS[t]);
  if (liked.length) bits.push(`it matches your taste for ${liked.join(' and ')}`);
  return 'Picked because ' + bits.join(', ') + '.';
}
function vOutfit() {
  const st = wxStatus(); if (st) return st;
  const d = S.wx.days[0], fy = personal(dayFeels(d)), list = ranked(fy, d.rain);
  const k = dateKey(), chosenId = S.worn[k] && S.worn[k].chosen ? S.worn[k].id : null;
  const look = chosenId ? LOOKS.find((l) => l.id === chosenId) : list[0];
  const L = layersFor(fy);
  const extras = [];
  if (S.prefs.gloves && fy < 8) extras.push('Gloves, for cold hands');
  if (S.prefs.transit && L >= 2) extras.push('Keep the mid layer easy to take off on transport');
  if (d.rain >= 50 && !look.p.includes('shell') && !look.p.includes('trench')) extras.push('Umbrella, ' + d.rain + '% chance of rain');
  return `
  <div class="row-head"><div><span class="eyebrow" style="color:var(--cobalt)">${chosenId ? 'Your outfit today' : 'Today\'s pick'}</span><h1 class="h1">${esc(look.n)}</h1></div><span class="chip sky">${L} layer${L > 1 ? 's' : ''}</span></div>
  <article class="card pick">
    <div class="pick-media">${lookMedia(look)}<div class="pad" style="display:flex;flex-direction:column;gap:10px">
      <div class="chips">${tagChips(look)}${look.rain ? '<span class="chip sky">Rain-ready</span>' : ''}</div>
      <p style="font-size:13px;line-height:1.45">${whyText(look, d)}</p>
      <span class="mono muted" style="font-size:12px">${esc(S.place.name)} · feels ${fmtT(dayFeels(d))}</span>
    </div></div>
    <div class="pad"><div class="pieces">${look.p.map((id) => `<div class="piece">${garment(id)}<b>${G[id].n}</b><span>${G[id].slot}</span></div>`).join('')}</div></div>
  </article>
  ${extras.length ? `<div class="notice info">${extras.map(esc).join('<br>')}</div>` : ''}
  <button class="btn" data-act="wear" data-id="${look.id}">${chosenId === look.id ? 'Saved as today\'s outfit' : 'Wear this today'}</button>
  <section style="display:flex;flex-direction:column;gap:8px"><h2 class="h2">Other good options</h2>
    <div class="card list">${list.filter((l) => l.id !== look.id).slice(0, 3).map((l) => `
      <button class="result" data-act="wear" data-id="${l.id}"><span style="display:flex;flex-direction:column;gap:2px"><b>${esc(l.n)}</b><span class="muted" style="font-size:12px">${l.p.map((id) => G[id].n).join(' · ')}</span></span><span class="mono muted" style="font-size:12px;white-space:nowrap">${fmtT(l.min)}–${fmtT(l.max)}</span></button>`).join('')}</div>
  </section>`;
}

function vWeek() {
  const st = wxStatus(); if (st) return st;
  const ds = S.wx.days, mn = Math.min(...ds.map((d) => d.lo)), mx = Math.max(...ds.map((d) => d.hi)), span = Math.max(1, mx - mn);
  const wet = ds.filter((d) => d.rain >= 50).map((d, i) => dayLabel(d.date, ds.indexOf(d)));
  const coldest = ds.reduce((a, b) => dayFeels(b) < dayFeels(a) ? b : a);
  return `
  <div class="row-head"><h1 class="h1">7-Day</h1><span class="mono muted" style="font-size:12px">${esc(S.place.name)}</span></div>
  <section class="card list" style="overflow:hidden" aria-label="Forecast">${ds.map((d, i) => {
    const c = cond(d.code), look = bestFor(d), open = S.weekOpen === i;
    return `<div><button class="day" data-act="week-open" data-i="${i}" aria-expanded="${open}">
      <b style="font:700 14px var(--display)">${dayLabel(d.date, i)}</b>${wxIcon(c.k, 30)}
      <span style="display:flex;flex-direction:column;gap:5px;min-width:0">
        <span style="display:flex;align-items:center;gap:8px"><span class="mono muted" style="font-size:13px;width:30px;text-align:right">${fmtT(d.lo)}</span><span class="bar"><i style="left:${(d.lo - mn) / span * 100}%;width:${Math.max(4, (d.hi - d.lo) / span * 100)}%"></i></span><b class="mono" style="font-size:13px;width:30px">${fmtT(d.hi)}</b></span>
        <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.t}${d.rain >= 50 ? ' · ' + d.rain + '% rain' : ''} · wear ${esc(look.n)}</span>
      </span></button>
      ${open ? `<div class="day-detail">${look.img ? `<img src="${IMG[look.img]}" alt="">` : `<div class="board" style="width:72px;height:90px;padding:4px;grid-template-columns:1fr 1fr;border-radius:12px;background:var(--paper)">${look.p.slice(0, 4).map(garment).join('')}</div>`}
        <div style="display:flex;flex-direction:column;gap:3px;min-width:0"><span class="eyebrow" style="color:var(--cobalt)">${dayFull(d.date)}</span><b style="font:700 16px var(--display)">${esc(look.n)}</b><span style="font-size:13px">${look.p.map((id) => G[id].n).join(' · ')}</span><span class="mono muted" style="font-size:12px">Feels ${fmtT(dayFeels(d))}, to you ${fmtT(personal(dayFeels(d)))} · wind ${Math.round(d.wind)} km/h</span></div></div>` : ''}
    </div>`;
  }).join('')}</section>
  <div class="notice info"><b>This week:</b> coldest is ${dayLabel(coldest.date, ds.indexOf(coldest))} at ${fmtT(dayFeels(coldest))} feels-like. ${wet.length ? 'Rain likely on ' + wet.join(', ') + ', so keep a shell by the door.' : 'No day above a 50% chance of rain.'}</div>`;
}

function vLayers() {
  const st = wxStatus(); if (st) return st;
  const d = S.wx.days[0], fy = personal(dayFeels(d)), auto = layersFor(fy), sel = S.layerSel || auto;
  const ROWS = {
    1: [['Base', 'Cotton tee or linen shirt', 'One breathable layer. Linen above 24°.']],
    2: [['Base', 'Tee or long-sleeve', 'Cotton is fine while it stays dry.'], ['Outer', 'Knit, hoodie or light jacket', 'Easy to take off when it warms up.']],
    3: [['Base', 'Merino or a crisp shirt', 'Merino stays warm even if you get caught in rain.'], ['Mid', 'Cashmere or wool knit', 'Traps warm air without bulk.'], ['Outer', 'Coat or puffer, windproof', `Wind today reaches ${Math.round(d.wind)} km/h.`]]
  };
  const opts = [[1, 'knit', '20° and up'], [2, 'street', '10–19°'], [3, 'classic', 'below 10°']];
  return `
  <div><h1 class="h1">How many layers do I need?</h1><p class="muted" style="font-size:14px;margin-top:6px">It feels like <b class="mono" style="color:var(--ink)">${fmtT(fy)}</b> to you in ${esc(S.place.name)} today, so ${auto} layer${auto > 1 ? 's' : ''}.</p></div>
  <div class="layer-opts" role="group" aria-label="Layer count">${opts.map(([n, img, r]) => `<button class="layer" data-act="layer" data-n="${n}" aria-pressed="${n === sel}"><img src="${IMG[img]}" alt=""><b style="font:700 15px var(--display)">${n} layer${n > 1 ? 's' : ''}</b><span class="mono" style="font-size:11px;opacity:.85">${S.unit === 'F' ? ['68°F+', '50–67°F', 'below 50°F'][n - 1] : r + 'C'}</span></button>`).join('')}</div>
  <section class="card list">${ROWS[sel].map(([s, i, w]) => `<div class="switch-row" style="align-items:flex-start"><span class="eyebrow" style="width:54px;color:var(--cobalt);padding-top:2px">${s}</span><span style="display:flex;flex-direction:column"><b>${i}</b><span class="muted" style="font-size:13px">${w}</span></span></div>`).join('')}</section>
  <section style="display:flex;flex-direction:column;gap:8px"><h2 class="h2">Picking the right materials</h2>
    <div class="card list">${[['Wool / Merino', '#7A8C74', 'warm, even when damp', 'any'], ['Cashmere', '#D8C8AE', 'light, soft, very warm', '5–15°'], ['Down', '#22325E', 'warmest per gram', '<5°'], ['Waterproof shell', '#2F8A7A', 'no warmth alone, layer it', 'rain'], ['Cotton / Linen', '#E9E2D2', 'breathable, cold when wet', '20°+']]
      .map(([n, c, s, r]) => `<div class="switch-row"><span style="width:12px;height:12px;border-radius:50%;background:${c};border:1px solid var(--line-2);flex:none"></span><span style="flex:1"><b>${n}</b> <span class="muted" style="font-size:13px">${s}</span></span><span class="mono" style="font-size:12px;color:var(--cobalt)">${r}</span></div>`).join('')}</div>
  </section>`;
}

function packing(days) {
  const n = days.length;
  const lo = Math.min(...days.map((d) => personal(d.flo))), hi = Math.max(...days.map((d) => d.hi));
  const rainy = days.filter((d) => d.rain >= 50).length, snow = days.some((d) => cond(d.code).k === 'snow');
  const it = [];
  const add = (key, name, qty, why) => it.push({ key, name, qty, why });
  add('tees', 'T-shirts', Math.ceil(n * 0.7), 'Rewear the rest');
  if (lo < 12) add('merino', 'Merino long-sleeves', Math.max(1, Math.ceil(n / 3)), `Feels as low as ${fmtT(lo)} to you`);
  if (hi >= 18) add('shirt', 'Linen or oxford shirt', Math.max(1, Math.ceil(n / 4)), `Highs reach ${fmtT(hi)}`);
  add('bottoms', 'Trousers or jeans', Math.ceil(n / 3) + 1, 'Dark colours hide wear');
  if (hi >= 22) add('shorts', 'Shorts', 2, `Warm afternoons up to ${fmtT(hi)}`);
  add('under', 'Underwear & socks', n + 1, 'One per day plus a spare');
  if (lo < 16) add('mid', S.prefs.wool ? 'Cashmere knit or fleece' : 'Knit or fleece', n > 4 ? 2 : 1, 'Mid layer for cool mornings');
  if (lo < 4) add('puffer', 'Down puffer', 1, `Feels below ${fmtT(4)} to you`);
  else if (lo < 12) add('coat', 'Coat or trench', 1, 'Warm outer for evenings');
  if (rainy || snow) add('shell', 'Waterproof shell', 1, `${rainy} wet day${rainy === 1 ? '' : 's'} in the forecast`);
  add('sneakers', 'Comfortable sneakers', 1, 'For walking days');
  if (rainy || snow || lo < 4) add('boots', 'Water-resistant boots', 1, snow ? 'Snow expected' : 'Wet or cold ground');
  if (rainy >= 2) add('umbrella', 'Compact umbrella', 1, 'Rain on more than one day');
  if (lo < 5 || (S.prefs.gloves && lo < 8)) add('hat', S.prefs.gloves ? 'Beanie, scarf & gloves' : 'Beanie & scarf', 1, 'Head and hands lose heat fast');
  if (hi >= 20) add('sun', 'Sunglasses & SPF', 1, 'Bright, warm days');
  return { lo, hi, rainy, items: it };
}
function vTravel() {
  const p = S.trip.place, n = S.trip.days, pid = placeLabel(p);
  const listHtml = `<div class="dest-scroll" role="group" aria-label="Destinations">${DESTS.map((d, i) => {
    const t = S.destTemps && S.destTemps[i];
    const on = d.name === p.name && d.country === p.country;
    return `<button class="dest" data-act="dest" data-i="${i}" aria-pressed="${on}"><b>${esc(d.name)}</b><span class="muted" style="font-size:12px">${esc(d.country)}</span><span class="mono" style="font-size:13px;margin-top:4px">${t ? fmtT(t.t) + ' · ' + cond(t.code).t : '…'}</span></button>`;
  }).join('')}</div>`;
  let body = '';
  if (S.tripLoading && !S.tripWx) body = '<div class="skeleton" style="height:240px"></div>';
  else if (S.tripErr) body = `<div class="notice err">${esc(S.tripErr)} <button class="btn small ghost" data-act="trip-reload" style="margin-top:8px">Try again</button></div>`;
  else if (S.tripWx) {
    const days = S.tripWx.days.slice(0, n), P = packing(days), packed = S.packed[pid] || {};
    const done = P.items.filter((i) => packed[i.key]).length;
    body = `
    <div class="chips"><span class="chip">${dayFull(days[0].date)} – ${dayFull(days[n - 1].date)}</span><span class="chip mono">${fmtT(Math.min(...days.map((d) => d.lo)))} to ${fmtT(P.hi)}</span><span class="chip sky">${P.rainy} rainy day${P.rainy === 1 ? '' : 's'}</span></div>
    <section style="display:flex;flex-direction:column;gap:8px"><div class="row-head"><h2 class="h2">Packing list</h2><span class="mono muted" style="font-size:12px">${done} of ${P.items.length} packed</span></div>
      <div class="progress" aria-hidden="true"><i style="width:${P.items.length ? done / P.items.length * 100 : 0}%"></i></div>
      <div class="card list">${P.items.map((i) => `<label class="pack ${packed[i.key] ? 'done' : ''}"><input type="checkbox" data-act="pack" data-key="${i.key}" ${packed[i.key] ? 'checked' : ''}><span style="flex:1;display:flex;flex-direction:column"><b style="font-size:14px">${esc(i.name)}</b><span class="muted" style="font-size:12px">${esc(i.why)}</span></span><b class="mono" style="color:var(--cobalt)">×${i.qty}</b></label>`).join('')}</div>
    </section>
    <section style="display:flex;flex-direction:column;gap:8px"><h2 class="h2">Outfit for each day</h2>
      <div class="card list">${days.map((d, i) => { const l = bestFor(d); return `<div class="switch-row">${wxIcon(cond(d.code).k, 28)}<span style="flex:1;min-width:0;display:flex;flex-direction:column"><b>${dayLabel(d.date, i)} · ${esc(l.n)}</b><span class="muted" style="font-size:12px">${fmtT(d.lo)}–${fmtT(d.hi)}${d.rain >= 50 ? ' · ' + d.rain + '% rain' : ''}</span></span></div>`; }).join('')}</div>
    </section>`;
  }
  let hotels = '';
  if (S.hotelsState === 'loading') hotels = '<div class="skeleton" style="height:120px"></div>';
  else if (S.hotelsState === 'ok' && S.hotels.length) hotels = `<div class="card list">${S.hotels.map((h) => `
      <div class="hotel"><span class="ic">${ic('bed', 20)}</span><span style="flex:1;min-width:0;display:flex;flex-direction:column"><b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.name)}</b><span class="muted" style="font-size:12px">${h.stars ? '★'.repeat(Math.min(5, Math.round(h.stars))) + ' · ' : ''}${h.km.toFixed(1)} km from centre${h.street ? ' · ' + esc(h.street) : ''}</span></span>
      <a class="btn small ghost" href="${gmapsSearch(h.name + ', ' + p.name)}" target="_blank" rel="noopener" aria-label="Open ${esc(h.name)} in Google Maps">Map</a></div>`).join('')}</div>`;
  else hotels = `<div class="notice info">${S.hotelsState === 'ok' ? 'No hotels are listed on OpenStreetMap near the centre.' : 'The hotel directory is busy right now.'} <a href="${gmapsSearch('hotels in ' + pid)}" target="_blank" rel="noopener">Search hotels on Google Maps</a>${S.hotelsState === 'failed' ? ' or <button class="btn small ghost" data-act="hotels-retry" style="height:32px;margin-left:4px">try again</button>' : ''}</div>`;
  return `
  <div class="row-head"><h1 class="h1">Plan your trip</h1><button class="pill" data-act="open-sheet" data-mode="trip">${ic('pin', 14)}<span>Search</span></button></div>
  ${listHtml}
  <section class="card pad" style="display:flex;flex-direction:column;gap:12px">
    <div class="row-head"><div><span class="eyebrow">Destination</span><h2 class="h2">${esc(pid)}</h2></div></div>
    <div class="seg" role="group" aria-label="Trip length">${[3, 5, 7].map((k) => `<button data-act="trip-days" data-n="${k}" aria-pressed="${k === n}">${k} days</button>`).join('')}</div>
  </section>
  <section class="card" style="overflow:hidden" aria-label="Map of ${esc(p.name)}">
    <iframe class="map" title="Google Map of ${esc(pid)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${gmapsEmbed(p)}"></iframe>
    <div class="pad" style="display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn small ghost" href="${gmapsSearch(pid)}" target="_blank" rel="noopener">${ic('ext', 16)} Open in Google Maps</a>
      <a class="btn small ghost" href="${gmapsSearch('hotels in ' + pid)}" target="_blank" rel="noopener">${ic('bed', 16)} Hotels on the map</a>
    </div>
  </section>
  ${body}
  <section style="display:flex;flex-direction:column;gap:8px"><div class="row-head"><h2 class="h2">Where to stay</h2><span class="muted" style="font-size:11px">OpenStreetMap</span></div>
    <div class="ad" aria-label="Advertisement slot"><span class="ic" style="width:44px;height:44px;border-radius:12px;background:var(--ink);color:var(--cream);display:flex;align-items:center;justify-content:center;flex:none">${ic('bed', 22)}</span>
      <span style="display:flex;flex-direction:column;gap:2px"><span class="eyebrow">Sponsored · ad slot</span><b>Partner hotel in ${esc(p.name)}</b><span class="muted" style="font-size:12px">A booking partner's offer appears here once one is connected.</span></span></div>
    ${hotels}
  </section>`;
}

function vProfile() {
  const c = S.comfort, o = c.offset, abs = Math.round(Math.abs(S.unit === 'F' ? o * 9 / 5 : o) * 2) / 2;
  const trail = c.trail.length > 1 ? c.trail : [0, 0];
  const step = 300 / (trail.length - 1);
  const spark = trail.map((v, i) => Math.round(i * step) + ',' + Math.round(28 - v * 6)).join(' ');
  const DOT = { cold: ['#1F4FD8', 'C', 'Too cold'], right: ['#1E8A5A', '✓', 'Just right'], warm: ['#B8651A', 'W', 'Too warm'] };
  const tk = dateKey(), tw = S.worn[tk], tLook = tw && LOOKS.find((l) => l.id === tw.id);
  const prefs = [['gloves', 'Cold hands', 'Suggest gloves when it feels below ' + fmtT(8)], ['transit', 'Warm on public transport', 'Favour layers you can take off'], ['wool', 'Wool itches', 'Avoid wool pieces in picks']];
  const updated = S.wx ? new Date(S.wx.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '–';
  return `
  <section style="display:flex;align-items:center;gap:14px">
    <span class="avatar" style="width:60px;height:60px;font-size:20px">${esc(S.user.name.slice(0, 2).toUpperCase())}</span>
    <div style="min-width:0"><h1 class="h1" style="font-size:24px">${esc(S.user.name)}</h1><p class="muted" style="font-size:13px;overflow:hidden;text-overflow:ellipsis">${esc(S.user.email)} · ${esc(S.place.name)}</p></div>
  </section>
  <section class="comfort" aria-label="Comfort profile">
    <div class="row-head"><div><span class="eyebrow" style="color:#A9B9F2">Your comfort profile</span><div style="font:800 24px/1.1 var(--display)">${c.n === 0 ? 'Still learning' : abs < 0.5 ? 'You run about average' : 'You run ' + abs + '° ' + (o > 0 ? 'cold' : 'warm')}</div></div><b class="mono" style="font-size:22px;color:#A9B9F2">${fmtD(o)}</b></div>
    <div><div class="gauge"><span class="mid"></span><span class="dot" style="left:${(o + 4) / 8 * 100}%"></span></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#B8B2A6;margin-top:6px"><span>Runs warm</span><span>Average</span><span>Runs cold</span></div></div>
    <svg width="100%" height="56" viewBox="0 0 300 56" preserveAspectRatio="none" role="img" aria-label="Comfort offset over your check-ins"><line x1="0" y1="28" x2="300" y2="28" stroke="#3A3F4E" stroke-dasharray="3 4"/><polyline points="${spark}" fill="none" stroke="#7FA0F0" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
    <span style="font-size:13px;color:#D9D3C7">${c.n === 0 ? 'Tell us how your outfits feel and every pick adjusts to you.' : `Every forecast is shifted ${fmtD(-o)} for you before we pick an outfit.`}</span>
    <span class="mono" style="font-size:11px;color:#A9B9F2">${c.n} check-in${c.n === 1 ? '' : 's'} · confidence ${Math.min(95, c.n * 10)}%</span>
  </section>
  <section class="card pad" style="display:flex;flex-direction:column;gap:10px" aria-label="Check-in">
    <div><h2 class="h2">How does today's outfit feel?</h2><p class="muted" style="font-size:13px">${tLook ? esc(tLook.n) + ' · feels like ' + fmtT(tw.feels) + ' in ' + esc(tw.place) : 'Open Today first so we know what you are wearing.'}</p></div>
    <div class="feel-btns"><button class="f-cold" data-act="feel" data-f="cold" data-day="${tk}">Too cold</button><button class="f-right" data-act="feel" data-f="right" data-day="${tk}">Just right</button><button class="f-warm" data-act="feel" data-f="warm" data-day="${tk}">Too warm</button></div>
    ${S.checkMsg ? `<b style="font-size:13px">${esc(S.checkMsg)}</b>` : ''}
    ${c.history.length ? `<div class="dots"><span class="eyebrow" style="width:auto;height:auto;color:var(--ink-soft);margin-right:4px">Last ${c.history.length}</span>${c.history.map((f) => `<span title="${DOT[f][2]}" style="background:${DOT[f][0]}">${DOT[f][1]}</span>`).join('')}</div>` : ''}
  </section>
  <section style="display:flex;flex-direction:column;gap:8px"><h2 class="h2">What you've told us</h2>
    <div class="card list">${prefs.map(([k, t, s]) => `<div class="switch-row"><span style="flex:1;display:flex;flex-direction:column"><b style="font-size:14px">${t}</b><span class="muted" style="font-size:12px">${s}</span></span><button class="switch" data-act="pref" data-k="${k}" aria-pressed="${!!S.prefs[k]}" aria-label="${t}"><span></span></button></div>`).join('')}</div>
  </section>
  <section class="card pad" style="display:flex;flex-direction:column;gap:10px" aria-label="Weather source">
    <div class="row-head"><h2 class="h2">Live weather</h2><span style="font-size:12px;font-weight:700;color:${S.wx && !S.wx.stale ? 'var(--good-ink)' : 'var(--warm-ink)'}">${S.wx && !S.wx.stale ? '● Connected' : '● Offline copy'}</span></div>
    <div style="display:grid;grid-template-columns:90px minmax(0,1fr);row-gap:6px;font-size:13px"><span class="muted">Source</span><span><a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> forecast API</span><span class="muted">Location</span><span>${esc(placeLabel(S.place))}</span><span class="muted">Updated</span><span class="mono">${updated}</span></div>
    <div class="seg" role="group" aria-label="Units"><button data-act="unit" data-u="C" aria-pressed="${S.unit === 'C'}">°C</button><button data-act="unit" data-u="F" aria-pressed="${S.unit === 'F'}">°F</button></div>
    <button class="btn small ghost" data-act="reload">${ic('refresh', 16)} Refresh weather</button>
  </section>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small ghost" data-act="reset-comfort">Reset comfort learning</button><button class="btn small ghost" data-act="signout">Sign out</button></div>`;
}

function vSheet() {
  const sh = S.sheet;
  return `<div class="scrim" data-act="close-sheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="${sh.mode === 'trip' ? 'Choose a destination' : 'Choose your location'}" data-stop>
    <div class="row-head"><h2 class="h2">${sh.mode === 'trip' ? 'Where are you going?' : 'Where are you?'}</h2><button class="round" style="width:40px;height:40px;box-shadow:none" data-act="close-sheet" aria-label="Close">${ic('x', 18)}</button></div>
    <form class="search" data-form="search" style="display:flex;gap:8px"><label for="q" style="position:absolute;left:-9999px">City</label><input id="q" name="q" placeholder="Search a city" value="${esc(sh.q || '')}" autocomplete="off"><button class="btn small" type="submit" style="height:48px">Search</button></form>
    ${sh.mode === 'home' ? `<button class="btn small ghost" data-act="locate">${ic('locate', 16)} Use my current location</button>` : ''}
    ${sh.loading ? '<div class="skeleton" style="height:100px"></div>' : ''}
    ${sh.err ? `<div class="notice err">${esc(sh.err)}</div>` : ''}
    ${sh.results ? (sh.results.length ? `<div class="card list" style="overflow:hidden">${sh.results.map((r, i) => `<button class="result" data-act="pick-place" data-i="${i}"><span><b>${esc(r.name)}</b><br><span class="muted" style="font-size:12px">${esc([r.region, r.country].filter(Boolean).join(', '))}</span></span>${ic('pin', 16)}</button>`).join('')}</div>` : '<p class="muted">No places found. Try another spelling.</p>') : ''}
  </div></div>`;
}

// ---------- render ----------
const ROUTES = { today: vToday, outfit: vOutfit, week: vWeek, layers: vLayers, travel: vTravel, profile: vProfile };
function route() { const r = location.hash.slice(1); return ROUTES[r] ? r : 'today'; }
function render() {
  const app = document.getElementById('app');
  if (!S.user) { app.innerHTML = vLogin(); return; }
  const r = route();
  app.innerHTML = header() + `<main id="main">${ROUTES[r]()}</main>` + tabs(r) + (S.sheet ? vSheet() : '');
  wireDeck();
}

// ---------- swipe deck ----------
function wireDeck() {
  const card = document.querySelector('#deck .swipe.top');
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
  const card = document.querySelector('#deck .swipe.top');
  if (!card || S.anim) return;
  S.anim = true;
  const look = LOOKS.find((l) => l.id === card.dataset.id);
  card.style.transition = 'transform .28s ease, opacity .28s ease';
  card.style.setProperty(v > 0 ? '--like' : '--nope', 1);
  card.style.transform = `translateX(${v > 0 ? 140 : -140}%) rotate(${v > 0 ? 18 : -18}deg)`;
  card.style.opacity = '0';
  setTimeout(() => {
    S.ratings[look.id] = v;
    look.tags.forEach((t) => { S.weights[t] = Math.round(((S.weights[t] || 0) + (v > 0 ? 1 : -0.5)) * 10) / 10; });
    save('ratings', 'weights');
    S.anim = false;
    render();
    document.querySelector('#deck .swipe.top')?.focus({ preventScroll: true });
    toast(v > 0 ? `Liked ${look.n}. More ${look.tags.map((t) => TAGS[t]).join(' & ')} picks ahead.` : `Skipped ${look.n}.`);
  }, 280);
}

// ---------- events ----------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.classList.contains('scrim') && e.target.closest('[data-stop]')) return; // click inside the sheet
  const a = el.dataset.act;
  if (a === 'rate') rate(+el.dataset.v);
  else if (a === 'reset-style') { S.ratings = {}; S.weights = {}; save('ratings', 'weights'); render(); }
  else if (a === 'reload') { S.wx = null; loadHome(true); }
  else if (a === 'feel') {
    const day = el.dataset.day, f = el.dataset.f, before = S.comfort.offset;
    S.comfort = learn(S.comfort, f);
    if (S.worn[day]) S.worn[day].rated = f;
    save('comfort', 'worn');
    const diff = S.comfort.offset - before;
    S.checkMsg = f === 'right' ? `Noted. Your profile holds at ${fmtD(S.comfort.offset)} and gets more certain.` : `Adjusted by ${fmtD(diff)}. Your next picks will be ${diff > 0 ? 'warmer' : 'lighter'}.`;
    toast(S.checkMsg);
    render();
  }
  else if (a === 'wear') {
    S.worn[dateKey()] = Object.assign({}, S.worn[dateKey()], { id: el.dataset.id, chosen: true, feels: Math.round(dayFeels(S.wx.days[0])), place: S.place.name });
    save('worn'); render(); toast('Saved as today\'s outfit.');
  }
  else if (a === 'week-open') { const i = +el.dataset.i; S.weekOpen = S.weekOpen === i ? -1 : i; render(); }
  else if (a === 'layer') { S.layerSel = +el.dataset.n; render(); }
  else if (a === 'dest') { setTrip(DESTS[+el.dataset.i]); }
  else if (a === 'trip-days') { S.trip.days = +el.dataset.n; save('trip'); render(); }
  else if (a === 'trip-reload') loadTrip();
  else if (a === 'hotels-retry') { S.hotelsFor = ''; loadHotels(); }
  else if (a === 'pref') { S.prefs[el.dataset.k] = !S.prefs[el.dataset.k]; save('prefs'); recordWorn(); render(); }
  else if (a === 'unit') { S.unit = el.dataset.u; save('unit'); render(); }
  else if (a === 'reset-comfort') { S.comfort = { offset: 0, n: 0, history: [], trail: [0] }; S.checkMsg = ''; save('comfort'); render(); toast('Comfort learning reset.'); }
  else if (a === 'signout') { S.user = null; store.del('user'); location.hash = ''; render(); }
  else if (a === 'open-sheet') { S.sheet = { mode: el.dataset.mode, q: '', results: null }; render(); document.getElementById('q')?.focus(); }
  else if (a === 'close-sheet') { if (e.target.closest('[data-stop]') && el.classList.contains('scrim')) return; S.sheet = null; render(); }
  else if (a === 'pick-place') { const r = S.sheet.results[+el.dataset.i]; choosePlace(r); }
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
  if (el.dataset.act === 'pack') {
    const id = placeLabel(S.trip.place);
    S.packed[id] = S.packed[id] || {};
    S.packed[id][el.dataset.key] = el.checked;
    save('packed'); render();
  }
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (f.dataset.form === 'login') {
    const fd = new FormData(f);
    const name = String(fd.get('name') || '').trim(), email = String(fd.get('email') || '').trim();
    if (!name || !email) return;
    S.user = { name, email }; save('user');
    location.hash = '#today';
    render(); loadHome(); loadDestTemps();
  } else if (f.dataset.form === 'search') {
    const q = String(new FormData(f).get('q') || '').trim(); if (!q) return;
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
