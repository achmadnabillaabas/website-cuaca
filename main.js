const sections = {
  home: {
    html: 'sections/laman-home/index.html',
    styles: [],
    scripts: ['sections/laman-home/script.js'],
    remove: ['.navbar']
  },
  current: {
    html: 'sections/laman-current/index.html',
    styles: ['sections/laman-current/style.css'],
    scripts: ['sections/laman-current/script.js']
  },
  forecast: {
    html: 'sections/laman-forecast/forecast.html',
    styles: [
      'sections/laman-forecast/css/style.css',
      'sections/laman-forecast/css/forecast.css',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    ],
    scripts: [
      'https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.min.js',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
      'sections/laman-forecast/js/api.js',
      'sections/laman-forecast/js/map.js',
      'sections/laman-forecast/js/charts.js',
      'sections/laman-forecast/js/ui.js',
      'sections/laman-forecast/js/main.js'
    ]
  },
  about: {
    html: 'sections/about/index.html',
    styles: ['sections/about/style.css'],
    scripts: []
  }
};

const app = document.getElementById('app');
let currentAssets = { styles: [], scripts: [] };

function clearAssets() {
  currentAssets.styles.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  currentAssets.scripts.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  currentAssets = { styles: [], scripts: [] };
}

function idFor(prefix, url) {
  return prefix + btoa(url).replace(/=/g, '');
}

function injectStyles(urls) {
  urls.forEach(url => {
    const id = idFor('dyn-style-', url);
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.id = id;
    document.head.appendChild(link);
    currentAssets.styles.push(id);
  });
}

function injectScripts(urls) {
  return Promise.all(urls.map(url => new Promise((resolve, reject) => {
    const id = idFor('dyn-script-', url);
    if (document.getElementById(id)) return resolve();
    const s = document.createElement('script');
    s.src = url;
    s.id = id;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Gagal memuat skrip: ' + url));
    document.body.appendChild(s);
    currentAssets.scripts.push(id);
  })));
}

async function fetchBody(url) {
  const html = await fetch(url).then(r => r.text());
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const body = tmp.querySelector('body');
  return body || tmp;
}

function postProcess(section, bodyEl) {
  if (section === 'home') {
    const navbar = bodyEl.querySelector('.navbar');
    if (navbar) navbar.remove();
    bodyEl.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.includes('../current/index.html')) {
        a.removeAttribute('href');
        a.addEventListener('click', e => { e.preventDefault(); loadSection('current'); });
      } else if (href.includes('../forecast/index.html')) {
        a.removeAttribute('href');
        a.addEventListener('click', e => { e.preventDefault(); loadSection('forecast'); });
      } else if (href.includes('../about/index.html')) {
        a.removeAttribute('href');
        a.addEventListener('click', e => { e.preventDefault(); loadSection('about'); });
      }
    });
  }
  if (section === 'about') {
    const btn = bodyEl.querySelector('#about-back-home');
    if (btn) {
      btn.addEventListener('click', e => { e.preventDefault(); loadSection('home'); });
    }
  }
}

async function loadSection(section) {
  const conf = sections[section];
  if (!conf) return;
  clearAssets();
  injectStyles(conf.styles || []);
  let bodyEl;
  try {
    bodyEl = await fetchBody(conf.html);
  } catch (e) {
    const tpl = document.getElementById('tpl-' + section);
    const wrap = document.createElement('div');
    if (tpl) wrap.appendChild(tpl.content.cloneNode(true));
    bodyEl = wrap;
  }
  postProcess(section, bodyEl);
  app.innerHTML = bodyEl.innerHTML;
  if (conf.scripts && conf.scripts.length) {
    await injectScripts(conf.scripts);
  }
  if (section === 'current' && typeof initAutoLocationWeather === 'function') {
    try { initAutoLocationWeather(); } catch (e) { /* noop */ }
  }
  setActiveNav(section);
}

function setActiveNav(section) {
  document.querySelectorAll('.main-nav__btn').forEach(btn => {
    const sec = btn.getAttribute('data-section');
    if (sec) {
      if (sec === section) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

function initNav() {
  document.querySelectorAll('.main-nav__btn').forEach(btn => {
    const sec = btn.getAttribute('data-section');
    if (!sec) return;
    btn.addEventListener('click', () => loadSection(sec));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  loadSection('home');
});