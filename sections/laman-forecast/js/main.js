// main.js - orchestrator
(async function(){
  console.log('=== MAIN.JS LOADED ===');
  
  // Check dependencies
  if(typeof api === 'undefined') {
    console.error('API module not loaded!');
    alert('Error: API module tidak ter-load. Refresh halaman.');
    return;
  }
  if(typeof ui === 'undefined') {
    console.error('UI module not loaded!');
    alert('Error: UI module tidak ter-load. Refresh halaman.');
    return;
  }
  
  console.log('All dependencies loaded successfully');
  
  // state
  let state = {lat:-6.2, lon:106.816666, name:'Jakarta, Indonesia', units:'metric', data:null, radarFrames:[], radarIndex:0, radarPlaying:false};

  // helpers
  const el = id => document.getElementById(id);

  // init map
  if(typeof initMap === 'function'){
    try{
      initMap('map', state.lat, state.lon);
    }catch(e){
      console.warn('Map initialization failed:', e);
    }
  }

  async function loadAll(){
    try{
      console.log('Loading data for:', state.name, state.lat, state.lon);
      el('updateTime').textContent = 'Memuat data...';
      
      const data = await api.fetchForecast(state.lat, state.lon);
      console.log('Data loaded successfully');
      
      state.data = data;
      ui.renderHero(state.name, data, state.units);
      ui.renderHourlyPreview(data);
      ui.renderWeatherCards(data, state.units);
      ui.render10DayForecast(data, state.units);
      ui.renderDaily(data);
      ui.renderHourlyChart(data);
      ui.renderSunMoon(data);
      ui.renderActivity(data);
      
      // set map
      if(typeof setMapCenter === 'function') setMapCenter(state.lat, state.lon, state.name);
      
      // update map location name
      const mapLocationNameEl = el('mapLocationName');
      if(mapLocationNameEl) mapLocationNameEl.textContent = state.name;
      
      // radar frames
      try{
        const frames = await api.loadRadarFrames();
        state.radarFrames = frames;
        if(frames.length>0){
          state.radarIndex = frames.length-1;
          const sliderEl = el('radarSlider');
          if(sliderEl){
            sliderEl.max = frames.length-1;
            sliderEl.value = frames.length-1;
          }
          // show latest
          if(typeof showRadarOnMap === 'function') showRadarOnMap(frames[state.radarIndex]);
        }
      }catch(radarErr){
        console.warn('Radar frames failed to load:', radarErr);
      }
      
      const rawJsonEl = el('rawJson');
      if(rawJsonEl) rawJsonEl.textContent = JSON.stringify(data, null, 2);
      
      console.log('All data loaded successfully');
    }catch(e){
      console.error('LoadAll error:', e);
      el('updateTime').textContent = 'Error memuat data';
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
      state.lat = pos.coords.latitude; 
      state.lon = pos.coords.longitude; 
      state.name = 'Lokasimu';
      await loadAll();
    }, err=>alert('Gagal ambil lokasi: '+err.message));
  });

  // Weather card interactions
  const precipCard = el('precipCard');
  if(precipCard){
    precipCard.addEventListener('click', ()=>{
      alert('Klik pada kartu Presipitasi - Fitur peta radar akan ditampilkan di sini');
    });
  }



  // Unit toggle
  const unitToggle = el('unitToggle');
  if(unitToggle){
    unitToggle.addEventListener('change', async ()=> {
      state.units = unitToggle.value;
      // Re-render with new units
      if(state.data){
        ui.renderHero(state.name, state.data, state.units);
        ui.renderWeatherCards(state.data, state.units);
        ui.render10DayForecast(state.data, state.units);
      }
    });
  }

  // init
  await loadAll();
})();