// api.js - data fetching & caching (Open-Meteo + Nominatim + RainViewer)
const api = (function(){
  const cache = {};
  function cacheKey(k){ return k; }
  function ttl(ms){ return Date.now()+ms; }

  async function geocode(q){
    const parts = q.split(',').map(s=>s.trim());
    if(parts.length===2 && !isNaN(parts[0]) && !isNaN(parts[1])){
      return {lat:parseFloat(parts[0]), lon:parseFloat(parts[1]), name: `${parts[0]},${parts[1]}`};
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
    const res = await fetch(url,{headers:{'Accept':'application/json'}}).then(r=>r.json());
    if(res && res.length) return {lat:parseFloat(res[0].lat), lon:parseFloat(res[0].lon), name: res[0].display_name};
    throw new Error('Lokasi tidak ditemukan');
  }

  async function fetchForecast(lat, lon){
    const key = cacheKey(`f_${lat}_${lon}`);
    if(cache[key] && cache[key].expires > Date.now()) return cache[key].data;
    const hourly = ['temperature_2m','apparent_temperature','precipitation','weathercode','windspeed_10m','relativehumidity_2m'].join(',');
    const daily = ['weathercode','temperature_2m_max','temperature_2m_min','sunrise','sunset','precipitation_sum'].join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${hourly}&daily=${daily}&timezone=auto`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Gagal mengambil data cuaca');
    const js = await res.json();
    cache[key] = {data: js, expires: ttl(1000*60*7)}; // cache 7 minutes
    return js;
  }

  async function loadRadarFrames(){
    const url = 'https://api.rainviewer.com/public/maps.json';
    const res = await fetch(url).then(r=>r.json());
    const frames = (res.radar && res.radar.past)? res.radar.past.slice() : [];
    if(res.radar && res.radar.now) frames.push(res.radar.now);
    return frames;
  }

  return {geocode, fetchForecast, loadRadarFrames};
})();
