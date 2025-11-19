// ui.js - DOM rendering & helpers
const ui = (function(){
  const el = id => document.getElementById(id);
  function setText(id, txt){ const e = el(id); if(e) e.textContent = txt; }
  function wcToIcon(n){
    const map = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',80:'🌦️',81:'🌧️',95:'⛈️',99:'⛈️'};
    return map[n]||'❓';
  }
  function wcToLabel(n){ const map = {0:'Cerah',1:'Hampir cerah',2:'Berawan sebagian',3:'Berawan'}; return map[n]||'Tidak tersedia'; }

  function renderHero(name, data, units='metric'){
    if(!data) return;
    setText('locName', name);
    setText('updateTime', `Update: ${new Date().toLocaleString('id-ID')}`);
    const temp = Math.round(data.hourly.temperature_2m[0]);
    setText('tempNow', `${temp}°${units==='metric'?'C':'F'}`);
    const wc = data.hourly.weathercode[0];
    setText('condNow', wcToLabel(wc));
    setText('weatherIcon', wcToIcon(wc));
    setText('statFeels', `Feels: ${Math.round(data.hourly.apparent_temperature[0])}°`);
    setText('statWind', `Wind: ${Math.round(data.hourly.windspeed_10m[0])} km/h`);
    setText('statHum', `Humidity: ${Math.round(data.hourly.relativehumidity_2m[0])}%`);
    document.getElementById('rawJson').textContent = JSON.stringify(data, null, 2);
  }

  function renderDaily(data){
    if(!data) return;
    const list = document.getElementById('dailyList'); list.innerHTML='';
    for(let i=0;i<data.daily.time.length;i++){
      const day = data.daily.time[i];
      const tmax = data.daily.temperature_2m_max[i];
      const tmin = data.daily.temperature_2m_min[i];
      const wc = data.daily.weathercode[i];
      const div = document.createElement('div'); div.className='day';
      const dt = new Date(day);
      const weekday = dt.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
      div.innerHTML = `<div class="date">${weekday}</div><div style="font-size:28px;margin-top:6px">${wcToIcon(wc)}</div><div class="temp">${Math.round(tmax)}° / ${Math.round(tmin)}°</div><div class="meta" style="margin-top:6px">${wcToLabel(wc)}</div>`;
      list.appendChild(div);
    }
    // mini7
    const mini = document.getElementById('mini7'); mini.innerHTML='';
    for(let i=0;i<data.daily.time.length;i++){
      const dt = new Date(data.daily.time[i]); const wk = dt.toLocaleDateString('id-ID',{weekday:'short'});
      const wc = data.daily.weathercode[i];
      const tmax = data.daily.temperature_2m_max[i]; const tmin = data.daily.temperature_2m_min[i];
      const block = document.createElement('div'); block.style.display='inline-block'; block.style.marginRight='8px';
      block.innerHTML = `<div style="background:#fff;padding:8px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.04);min-width:110px;text-align:center"><div style="font-weight:700">${wk}</div><div style="font-size:20px;margin-top:6px">${wcToIcon(wc)}</div><div style="margin-top:6px">${Math.round(tmax)}° / ${Math.round(tmin)}°</div></div>`;
      mini.appendChild(block);
    }
  }

  function renderHourlyChart(data){
    if(!data) return;
    const labels = data.hourly.time.slice(0,24).map(t=>t.replace('T',' '));
    const temps = data.hourly.temperature_2m.slice(0,24);
    const prec = data.hourly.precipitation.slice(0,24);
    const ctx = document.getElementById('hourChart').getContext('2d');
    createOrUpdateHourChart(ctx, labels, temps, prec);
  }

  function renderSunMoon(data){
    if(!data) return;
    const sunrise = data.daily.sunrise[0], sunset = data.daily.sunset[0];
    document.getElementById('sunmoon').innerHTML = `<div class="meta">Sunrise: ${sunrise} • Sunset: ${sunset}</div>`;
  }

  function renderActivity(data){
    if(!data) return;
    const temp = data.hourly.temperature_2m[0]; const prec = data.hourly.precipitation[0];
    let adv = '';
    if(prec>1) adv += '<div>Hujan diperkirakan — bawa payung.</div>';
    if(temp>=33) adv += '<div>Cuaca panas — hidrasi & pakai pelindung.</div>';
    if(!adv) adv = '<div>Cuaca aman untuk aktivitas luar.</div>';
    document.getElementById('activityAdvice').innerHTML = adv;
    document.getElementById('tips').innerHTML = adv;
  }

  return {renderHero, renderDaily, renderHourlyChart, renderSunMoon, renderActivity};
})();
