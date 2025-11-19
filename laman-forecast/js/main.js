// main.js - orchestrator
(async function(){
  // state
  let state = {lat:-6.2, lon:106.816666, name:'Jakarta, Indonesia', units:'metric', data:null, radarFrames:[], radarIndex:0, radarPlaying:false};

  // helpers
  const el = id => document.getElementById(id);

  // init map
  initMap('map', state.lat, state.lon);

  async function loadAll(){
    try{
      el('updateTime').textContent = 'Memuat data...';
      const data = await api.fetchForecast(state.lat, state.lon);
      state.data = data;
      ui.renderHero(state.name, data, state.units);
      ui.renderDaily(data);
      ui.renderHourlyChart(data);
      ui.renderSunMoon(data);
      ui.renderActivity(data);
      // set map
      setMapCenter(state.lat, state.lon, state.name);
      // radar frames
      const frames = await api.loadRadarFrames();
      state.radarFrames = frames;
      if(frames.length>0){
        state.radarIndex = frames.length-1;
        el('radarSlider').max = frames.length-1;
        el('radarSlider').value = frames.length-1;
        // show latest
        showRadarOnMap(frames[state.radarIndex]);
      }
      el('rawJson').textContent = JSON.stringify(data, null, 2);
    }catch(e){
      console.error(e);
      alert('Gagal memuat data: '+e.message);
    }
  }

  // search
  el('searchBtn').addEventListener('click', async ()=>{
    const q = el('searchInput').value.trim(); if(!q) return alert('Masukkan lokasi');
    try{
      const g = await api.geocode(q);
      state.lat = g.lat; state.lon = g.lon; state.name = g.name;
      await loadAll();
    }catch(e){ alert(e.message); }
  });

  el('locBtn').addEventListener('click', ()=>{
    if(!navigator.geolocation) return alert('Geolocation tidak tersedia');
    navigator.geolocation.getCurrentPosition(async pos=>{
      state.lat = pos.coords.latitude; state.lon = pos.coords.longitude; state.name = 'Lokasimu';
      await loadAll();
    }, err=>alert('Gagal ambil lokasi: '+err.message));
  });

  // tabs
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.tab;
      document.querySelectorAll('.panel-item').forEach(p=>p.hidden=true);
      const pan = document.getElementById('panel-'+t);
      if(pan) pan.hidden=false;
    });
  });
  // default show current
  document.querySelectorAll('.panel-item').forEach(p=>p.hidden=true);
  document.getElementById('panel-current').hidden=false;

  // radar play/pause
  let radarTimer = null;
  el('radarPlay').addEventListener('click', ()=>{
    if(state.radarPlaying){ // pause
      state.radarPlaying = false; el('radarPlay').textContent='Play'; clearInterval(radarTimer);
    } else {
      state.radarPlaying = true; el('radarPlay').textContent='Pause';
      radarTimer = setInterval(()=> {
        state.radarIndex++;
        if(state.radarIndex >= state.radarFrames.length) state.radarIndex = 0;
        el('radarSlider').value = state.radarIndex;
        showRadarOnMap(state.radarFrames[state.radarIndex]);
        el('radarFrameTime').textContent = new Date(state.radarFrames[state.radarIndex].time*1000).toLocaleString('id-ID');
      }, 800);
    }
  });
  el('radarSlider').addEventListener('input', ()=> {
    const idx = parseInt(el('radarSlider').value);
    state.radarIndex = idx;
    if(state.radarFrames[idx]) showRadarOnMap(state.radarFrames[idx]);
    el('radarFrameTime').textContent = state.radarFrames[idx]? new Date(state.radarFrames[idx].time*1000).toLocaleString('id-ID') : '';
  });

  el('toggleRadar').addEventListener('click', ()=> {
    if(window._radarTile){ try{ setMapCenter(state.lat, state.lon, state.name); _mainMap.removeLayer(window._radarTile); window._radarTile=null; el('toggleRadar').textContent='Toggle Radar'; }catch(e){} }
    else { if(state.radarFrames.length) { showRadarOnMap(state.radarFrames[state.radarIndex]); el('toggleRadar').textContent='Hide Radar'; } }
  });

  el('copyRaw').addEventListener('click', ()=> {
    if(!state.data) return alert('Belum ada data'); navigator.clipboard.writeText(JSON.stringify(state.data,null,2)).then(()=>alert('Raw JSON disalin'));
  });

  // compare
  el('compareBtn').addEventListener('click', async ()=>{
    const q = el('compareInput').value.trim(); if(!q) return;
    try{
      const g = await api.geocode(q);
      const d = await api.fetchForecast(g.lat, g.lon);
      el('compareResult').innerHTML = `<div class="meta">Perbandingan: ${state.name} vs ${g.name}</div>
        <div style="margin-top:8px">Saat ini: ${Math.round(state.data.hourly.temperature_2m[0])}° vs ${Math.round(d.hourly.temperature_2m[0])}°</div>`;
    }catch(e){ alert('Banding gagal: '+e.message); }
  });

  // init
  await loadAll();
})();