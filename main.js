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
    if (el) {
      el.remove();
      // Also remove from DOM completely
      const scripts = document.querySelectorAll(`script[id="${id}"]`);
      scripts.forEach(s => s.remove());
    }
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
    
    // Remove existing script with same ID first
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
    
    const s = document.createElement('script');
    s.src = url + '?v=' + Date.now(); // Add cache buster
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
  if (section === 'current') {
    // Setup modal event listeners
    const allowBtn = bodyEl.querySelector('#allowLocationBtn');
    const denyBtn = bodyEl.querySelector('#denyLocationBtn');
    const modal = bodyEl.querySelector('#locationModal');
    
    if (allowBtn) {
      allowBtn.addEventListener('click', () => {
        if (modal) modal.hidden = true;
        const infoMsg = document.getElementById('infoMessage');
        if (infoMsg) infoMsg.textContent = 'Detecting your location…';
        
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (infoMsg) infoMsg.textContent = 'Showing weather for your current location.';
            if (typeof fetchWeatherByCoords === 'function') {
              fetchWeatherByCoords(coords.latitude, coords.longitude);
            }
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              if (infoMsg) infoMsg.textContent = 'Location permission denied. Please search manually or allow location in browser settings.';
            } else {
              if (infoMsg) infoMsg.textContent = 'Unable to detect your location. Please search manually.';
            }
          }
        );
      });
    }
    
    if (denyBtn) {
      denyBtn.addEventListener('click', () => {
        if (modal) modal.hidden = true;
        const infoMsg = document.getElementById('infoMessage');
        if (infoMsg) infoMsg.textContent = 'You can search for a city manually or click "Use my location" anytime.';
      });
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
  if (section === 'current') {
    // Check location permission and show modal if needed
    setTimeout(() => {
      const modal = document.getElementById('locationModal');
      if (!modal) return;
      
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            // Already granted, call init function
            if (typeof initAutoLocationWeather === 'function') {
              try { initAutoLocationWeather(); } catch (e) { /* noop */ }
            }
          } else if (result.state === 'prompt') {
            // Show modal
            modal.hidden = false;
          } else {
            // Denied
            const infoMsg = document.getElementById('infoMessage');
            if (infoMsg) infoMsg.textContent = 'Location permission blocked. Allow it in site settings.';
          }
        }).catch(() => {
          // Fallback: show modal
          modal.hidden = false;
        });
      } else {
        // No permissions API, show modal
        modal.hidden = false;
      }
    }, 100);
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