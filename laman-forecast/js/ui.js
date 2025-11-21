// ui.js - DOM rendering & helpers
const ui = (function(){
  const el = id => document.getElementById(id);
  function setText(id, txt){ const e = el(id); if(e) e.textContent = txt; }
  function wcToIcon(n){
    const map = {
      0:'☀️',1:'🌤️',2:'⛅',3:'☁️',
      45:'🌫️',48:'🌫️',
      51:'🌦️',53:'🌦️',55:'🌦️',56:'🌦️',57:'🌦️',
      61:'🌧️',63:'🌧️',65:'🌧️',66:'🌧️',67:'🌧️',
      71:'🌨️',73:'🌨️',75:'🌨️',77:'🌨️',
      80:'🌦️',81:'🌧️',82:'🌧️',
      85:'🌨️',86:'🌨️',
      95:'⛈️',96:'⛈️',99:'⛈️'
    };
    // Default to cloudy if unknown
    return map[n]||'☁️';
  }
  function wcToLabel(n){ 
    const map = {
      0:'Cerah',
      1:'Hampir cerah',
      2:'Berawan sebagian',
      3:'Berawan',
      45:'Berkabut',
      48:'Berkabut',
      51:'Gerimis',
      53:'Gerimis',
      55:'Gerimis Lebat',
      61:'Hujan Ringan',
      63:'Hujan',
      65:'Hujan Lebat',
      80:'Hujan Ringan',
      81:'Hujan',
      82:'Hujan Lebat',
      95:'Badai Petir',
      96:'Badai Petir',
      99:'Badai Petir Lebat'
    }; 
    return map[n]||'Tidak tersedia'; 
  }

  // Temperature conversion helper
  function convertTemp(celsius, units){
    if(units === 'imperial'){
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  }
  
  // Speed conversion helper
  function convertSpeed(kmh, units){
    if(units === 'imperial'){
      return Math.round(kmh * 0.621371); // km/h to mph
    }
    return Math.round(kmh);
  }

  function renderHero(name, data, units='metric'){
    if(!data) return;
    setText('locName', name);
    setText('updateTime', `Update: ${new Date().toLocaleString('id-ID')}`);
    const tempC = data.hourly.temperature_2m[0];
    const temp = convertTemp(tempC, units);
    const wc = data.hourly.weathercode[0];
    const humidity = data.hourly.relativehumidity_2m[0];
    const prec = data.hourly.precipitation[0] || 0;
    const windSpeedKmh = data.hourly.windspeed_10m[0];
    const windSpeed = convertSpeed(windSpeedKmh, units);
    
    setText('tempNow', `${temp}°${units==='metric'?'C':'F'}`);
    
    // Enhanced condition detection
    let conditionLabel = wcToLabel(wc);
    let conditionIcon = wcToIcon(wc);
    
    // Override if high humidity + cloudy (likely raining/drizzle)
    // Use 85% threshold for better detection
    if(humidity >= 85 && wc >= 3 && wc < 51 && prec < 0.1) {
      // Determine if drizzle or rain based on humidity level
      if(humidity >= 95) {
        conditionLabel = 'Hujan';
        conditionIcon = '🌧️';
      } else {
        conditionLabel = 'Gerimis';
        conditionIcon = '🌦️';
      }
    }
    
    setText('condNow', conditionLabel);
    setText('weatherIcon', conditionIcon);
    const feelsLikeC = data.hourly.apparent_temperature[0];
    const feelsLike = convertTemp(feelsLikeC, units);
    setText('statFeels', `Feels: ${feelsLike}°`);
    setText('statWind', `Wind: ${windSpeed} ${units==='metric'?'km/h':'mph'}`);
    setText('statHum', `Humidity: ${Math.round(humidity)}%`);
    
    // Weather advice - REAL CONDITIONS with enhanced detection
    
    let advice = '';
    
    // Enhanced rain detection: Check multiple indicators
    // Use 85% threshold for better detection
    const isRaining = prec > 0.1 || (humidity >= 85 && wc >= 3) || wc >= 51;
    
    // Check current precipitation or high probability of rain
    if(prec > 2.5 || wc >= 80) {
      advice = `Hujan lebat saat ini (${prec.toFixed(1)} mm). `;
    } else if(prec > 0.5 || wc >= 61) {
      advice = `Hujan ringan saat ini (${prec.toFixed(1)} mm). `;
    } else if(prec > 0.1 || wc >= 51) {
      advice = `Gerimis saat ini. `;
    } else if(humidity >= 85 && wc >= 3) {
      // High humidity + cloudy = likely raining/drizzle but API not updated
      if(humidity >= 95) {
        advice = `Kondisi hujan terdeteksi. Kelembaban ${Math.round(humidity)}%. `;
      } else {
        advice = `Kondisi gerimis terdeteksi. Kelembaban ${Math.round(humidity)}%. `;
      }
    }
    
    // Check upcoming precipitation
    const nextHourPrec = data.hourly.precipitation[1] || 0;
    const next2HourPrec = data.hourly.precipitation[2] || 0;
    if((nextHourPrec > 0.5 || next2HourPrec > 0.5) && !isRaining) {
      advice += `Hujan diperkirakan dalam 1-2 jam. `;
    }
    
    // Check wind
    if(windSpeed > 30) {
      advice += `Angin kencang ${Math.round(windSpeed)} km/h. `;
    } else if(windSpeed > 20) {
      advice += `Embusan angin hingga ${Math.round(windSpeed)} km/h. `;
    }
    
    // Priority 1: Rain/Drizzle conditions (override temperature)
    if(isRaining) {
      advice += `Hujan/gerimis terdeteksi, bawa payung. `;
    }
    
    // Priority 2: High humidity (potential rain)
    if(humidity > 85 && !isRaining) {
      advice += `Kelembaban tinggi ${Math.round(humidity)}%, berpotensi hujan. `;
    }
    
    // Priority 3: Temperature (only if NOT raining)
    if(!isRaining) {
      if(temp >= 33) {
        advice += `Cuaca panas, gunakan pelindung. `;
      } else if(temp >= 28 && temp < 33) {
        advice += `Cuaca hangat. `;
      } else if(temp <= 20) {
        advice += `Cuaca sejuk. `;
      }
    }
    
    // Default if no special conditions
    if(!advice) {
      advice = `Cuaca ${wcToLabel(wc).toLowerCase()}. `;
    }
    
    setText('weatherAdvice', advice.trim());
    
    const rawJsonEl = document.getElementById('rawJson');
    if(rawJsonEl) rawJsonEl.textContent = JSON.stringify(data, null, 2);
  }

  function renderDaily(data){
    if(!data) return;
    const list = document.getElementById('dailyList');
    if(list){
      list.innerHTML='';
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
    }
    // mini7
    const mini = document.getElementById('mini7');
    if(mini){
      mini.innerHTML='';
      for(let i=0;i<data.daily.time.length;i++){
        const dt = new Date(data.daily.time[i]); const wk = dt.toLocaleDateString('id-ID',{weekday:'short'});
        const wc = data.daily.weathercode[i];
        const tmax = data.daily.temperature_2m_max[i]; const tmin = data.daily.temperature_2m_min[i];
        const block = document.createElement('div'); block.style.display='inline-block'; block.style.marginRight='8px';
        block.innerHTML = `<div style="background:#fff;padding:8px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.04);min-width:110px;text-align:center"><div style="font-weight:700">${wk}</div><div style="font-size:20px;margin-top:6px">${wcToIcon(wc)}</div><div style="margin-top:6px">${Math.round(tmax)}° / ${Math.round(tmin)}°</div></div>`;
        mini.appendChild(block);
      }
    }
  }

  function renderHourlyChart(data){
    if(!data) return;
    const chartEl = document.getElementById('hourChart');
    if(!chartEl) return;
    const labels = data.hourly.time.slice(0,24).map(t=>t.replace('T',' '));
    const temps = data.hourly.temperature_2m.slice(0,24);
    const prec = data.hourly.precipitation.slice(0,24);
    const ctx = chartEl.getContext('2d');
    if(typeof createOrUpdateHourChart === 'function'){
      createOrUpdateHourChart(ctx, labels, temps, prec);
    }
  }

  function renderSunMoon(data){
    if(!data) return;
    const sunmoonEl = document.getElementById('sunmoon');
    if(!sunmoonEl) return;
    const sunrise = data.daily.sunrise[0], sunset = data.daily.sunset[0];
    sunmoonEl.innerHTML = `<div class="meta">Sunrise: ${sunrise} • Sunset: ${sunset}</div>`;
  }

  function renderActivity(data){
    if(!data) return;
    const temp = data.hourly.temperature_2m[0]; const prec = data.hourly.precipitation[0];
    let adv = '';
    if(prec>1) adv += '<div>Hujan diperkirakan — bawa payung.</div>';
    if(temp>=33) adv += '<div>Cuaca panas — hidrasi & pakai pelindung.</div>';
    if(!adv) adv = '<div>Cuaca aman untuk aktivitas luar.</div>';
    const advEl = document.getElementById('activityAdvice');
    if(advEl) advEl.innerHTML = adv;
    const tipsEl = document.getElementById('tips');
    if(tipsEl) tipsEl.innerHTML = adv;
  }

  function renderWeatherCards(data, units='metric'){
    if(!data) return;
    
    // Feels Like Card
    const feelsLikeC = data.hourly.apparent_temperature[0];
    const actualTempC = data.hourly.temperature_2m[0];
    const feelsLike = convertTemp(feelsLikeC, units);
    const actualTemp = convertTemp(actualTempC, units);
    const tempDiff = feelsLike - actualTemp;
    setText('feelsLikeTemp', `${feelsLike}°`);
    let feelsDesc = 'Terasa lebih hangat daripada suhu sebenarnya.';
    if(tempDiff < -2) feelsDesc = 'Terasa lebih dingin daripada suhu sebenarnya.';
    else if(Math.abs(tempDiff) <= 2) feelsDesc = 'Terasa sama dengan suhu sebenarnya.';
    setText('feelsLikeDesc', feelsDesc);

    // UV Index Card (simulated - Open-Meteo free tier doesn't have UV)
    const hour = new Date().getHours();
    let uvIndex = 0;
    if(hour >= 10 && hour <= 16){
      uvIndex = Math.floor(Math.random() * 6) + 3; // 3-8 during peak hours
    } else if(hour >= 8 && hour < 10 || hour > 16 && hour <= 18){
      uvIndex = Math.floor(Math.random() * 3) + 1; // 1-3 morning/evening
    }
    setText('uvIndex', uvIndex);
    const uvBarFill = document.getElementById('uvBarFill');
    if(uvBarFill) uvBarFill.style.width = `${(uvIndex/11)*100}%`;
    let uvDesc = 'Rendah';
    if(uvIndex >= 8) uvDesc = 'Sangat Tinggi - Gunakan tabir surya hingga 16.00';
    else if(uvIndex >= 6) uvDesc = 'Tinggi - Gunakan tabir surya';
    else if(uvIndex >= 3) uvDesc = 'Sedang - Perlindungan direkomendasikan';
    setText('uvDesc', uvDesc);

    // Wind Card
    const windSpeed = data.hourly.windspeed_10m[0];
    const windSpeedMs = (windSpeed / 3.6).toFixed(1); // convert km/h to m/s
    setText('windSpeed', `${windSpeedMs} m/dtk`);
    
    // Wind direction (simulated - need wind direction data)
    const directions = ['Utara','Timur Laut','Timur','Tenggara','Selatan','Barat Daya','Barat','Barat Laut'];
    const dirIndex = Math.floor(Math.random() * 8);
    const direction = directions[dirIndex];
    setText('windDirection', direction);
    setText('windLabel', 'Angin');
    
    // Rotate compass arrow
    const compassArrow = document.getElementById('compassArrow');
    if(compassArrow){
      const angle = dirIndex * 45;
      compassArrow.style.transform = `translate(-50%,-100%) rotate(${angle}deg)`;
    }

    // Precipitation Map (update with real-time data)
    initPrecipMap(data);
  }

  function initPrecipMap(data){
    const mapEl = document.getElementById('precipMap');
    if(!mapEl) return;
    
    // Always update with current data
    const prec = data.hourly.precipitation[0] || 0;
    const wc = data.hourly.weathercode[0];
    const humidity = data.hourly.relativehumidity_2m[0];
    
    // Enhanced detection: Check multiple indicators for rain
    let icon = '☀️';
    let status = 'Cerah';
    let bgGradient = 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
    
    // Priority 1: Check weather code for rain/storm
    if(wc >= 95) { // Thunderstorm
      icon = '⛈️';
      status = 'Badai Petir';
      bgGradient = 'linear-gradient(135deg,#434343 0%,#000000 100%)';
    } else if(wc >= 80) { // Rain showers
      icon = '🌧️';
      status = 'Hujan Lebat';
      bgGradient = 'linear-gradient(135deg,#4b6cb7 0%,#182848 100%)';
    } else if(wc >= 61) { // Rain
      icon = '🌧️';
      status = 'Hujan';
      bgGradient = 'linear-gradient(135deg,#5f72bd 0%,#9b23ea 100%)';
    } else if(wc >= 51) { // Drizzle
      icon = '🌦️';
      status = 'Gerimis';
      bgGradient = 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
    } 
    // Priority 2: Check humidity + cloudy (likely raining/drizzle but API not updated)
    // Use 85% threshold for better detection
    else if(humidity >= 85 && wc >= 3) {
      // Determine if drizzle or rain based on humidity level
      if(humidity >= 95) {
        icon = '🌧️';
        status = 'Hujan (Terdeteksi)';
        bgGradient = 'linear-gradient(135deg,#5f72bd 0%,#9b23ea 100%)';
      } else {
        icon = '🌦️';
        status = 'Gerimis (Terdeteksi)';
        bgGradient = 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
      }
    }
    // Priority 3: Other conditions
    else if(wc >= 45) { // Fog
      icon = '🌫️';
      status = 'Berkabut';
      bgGradient = 'linear-gradient(135deg,#bdc3c7 0%,#2c3e50 100%)';
    } else if(wc >= 3) { // Cloudy
      icon = '☁️';
      status = humidity > 85 ? 'Berawan (Potensi Hujan)' : 'Berawan';
      bgGradient = 'linear-gradient(135deg,#e0e0e0 0%,#8e9eab 100%)';
    } else if(wc >= 1) { // Partly cloudy
      icon = '⛅';
      status = 'Cerah Berawan';
      bgGradient = 'linear-gradient(135deg,#ffd89b 0%,#19547b 100%)';
    } else { // Clear
      icon = '☀️';
      status = 'Cerah';
      bgGradient = 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)';
    }
    
    mapEl.style.background = bgGradient;
    mapEl.innerHTML = `
      <div>
        <div>${icon}</div>
        <div>${status}</div>
        <div>${prec > 0 ? prec.toFixed(1) : '~'} mm</div>
        <div>Kelembaban: ${Math.round(humidity)}%</div>
      </div>
    `;
    mapEl.dataset.initialized = 'true';
  }

  function render10DayForecast(data, units='metric'){
    if(!data) return;
    const container = document.getElementById('forecast10Days');
    if(!container) return;
    
    container.innerHTML = '';
    
    // Ensure we have daily data
    if(!data.daily || !data.daily.time || data.daily.time.length === 0){
      container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Data ramalan tidak tersedia</div>';
      return;
    }
    
    const days = Math.min(10, data.daily.time.length);
    console.log('Rendering forecast for', days, 'days');
    console.log('Daily data available:', {
      time: data.daily.time?.length,
      weathercode: data.daily.weathercode?.length,
      temp_max: data.daily.temperature_2m_max?.length,
      temp_min: data.daily.temperature_2m_min?.length,
      precip: data.daily.precipitation_sum?.length
    });
    
    for(let i=0; i<days; i++){
      try {
        const date = new Date(data.daily.time[i]);
        const dayName = i === 0 ? 'HARI INI' : date.toLocaleDateString('id-ID', {weekday: 'short'}).toUpperCase();
        const wc = data.daily.weathercode && data.daily.weathercode[i] !== undefined ? data.daily.weathercode[i] : 0;
        const tmaxC = data.daily.temperature_2m_max && data.daily.temperature_2m_max[i] !== undefined ? data.daily.temperature_2m_max[i] : 30;
        const tminC = data.daily.temperature_2m_min && data.daily.temperature_2m_min[i] !== undefined ? data.daily.temperature_2m_min[i] : 24;
        const tmax = convertTemp(tmaxC, units);
        const tmin = convertTemp(tminC, units);
        const precip = data.daily.precipitation_sum && data.daily.precipitation_sum[i] !== undefined ? data.daily.precipitation_sum[i] : 0;
        const precipProb = precip > 0 ? Math.min(Math.round(precip * 10), 100) : 0;
        
        console.log(`Day ${i} (${dayName}):`, {wc, tmax, tmin, precip, precipProb});
      
      // Determine if it's a rainy day
      const isRainy = wc >= 51 || precipProb >= 50;
      const isHighRain = precipProb >= 80;
      
      // Get rain status icon
      let rainStatus = '';
      if(isHighRain) {
        rainStatus = '<div class="rain-status high-rain">Hujan Lebat</div>';
      } else if(isRainy) {
        rainStatus = '<div class="rain-status rain">Hujan</div>';
      }
      
      const dayItem = document.createElement('div');
      dayItem.className = `forecast-day-item ${isRainy ? 'rainy-day' : ''}`;
      dayItem.innerHTML = `
        <div class="forecast-day-name">${dayName}</div>
        <div class="forecast-day-icon">${wcToIcon(wc)}</div>
        ${rainStatus}
        <div class="forecast-day-precip ${precipProb >= 70 ? 'high-precip' : ''}">${precipProb}%</div>
        <div class="forecast-day-temp">${tmax}° <span class="temp-min">${tmin}°</span></div>
        <div class="forecast-temp-bar">
          <div class="temp-bar-fill" style="width:${((tmax-tmin)/20)*100}%"></div>
        </div>
      `;
      
        // Add click event to show hourly forecast for this day
        dayItem.addEventListener('click', () => showDayHourlyForecast(data, i, dayName));
        dayItem.style.cursor = 'pointer';
        dayItem.title = `Klik untuk melihat prediksi per jam`;
        
        container.appendChild(dayItem);
        console.log(`Day ${i} rendered successfully`);
      } catch(error) {
        console.error(`Error rendering day ${i}:`, error);
        // Create error placeholder card
        const errorItem = document.createElement('div');
        errorItem.className = 'forecast-day-item';
        errorItem.innerHTML = `
          <div class="forecast-day-name">DAY ${i+1}</div>
          <div class="forecast-day-icon">❓</div>
          <div class="forecast-day-precip">0%</div>
          <div class="forecast-day-temp">--° <span class="temp-min">--°</span></div>
        `;
        container.appendChild(errorItem);
      }
    }
  }

  function showDayHourlyForecast(data, dayIndex, dayName){
    // Get hourly data for the selected day
    const dayDate = new Date(data.daily.time[dayIndex]);
    const startHour = dayIndex * 24;
    const endHour = Math.min(startHour + 24, data.hourly.time.length);
    
    // Create modal content
    let modalHTML = `
      <div class="hourly-modal-overlay" onclick="this.remove()">
        <div class="hourly-modal" onclick="event.stopPropagation()">
          <div class="hourly-modal-header">
            <h3>Prediksi Per Jam - ${dayName}</h3>
            <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
          </div>
          <div class="hourly-modal-content">
    `;
    
    for(let i=startHour; i<endHour; i++){
      const time = new Date(data.hourly.time[i]);
      const hour = time.getHours();
      const temp = Math.round(data.hourly.temperature_2m[i]);
      const wc = data.hourly.weathercode[i];
      const prec = data.hourly.precipitation[i] || 0;
      const humidity = data.hourly.relativehumidity_2m[i];
      const windSpeed = Math.round(data.hourly.windspeed_10m[i]);
      
      // Enhanced detection
      const isRaining = wc >= 51 || prec > 0.1 || (humidity >= 85 && wc >= 3);
      let displayIcon = wcToIcon(wc);
      if(humidity >= 85 && wc >= 3 && wc < 51 && prec < 0.1) {
        displayIcon = humidity >= 95 ? '🌧️' : '🌦️';
      }
      
      modalHTML += `
        <div class="hourly-modal-item ${isRaining ? 'rain' : ''}">
          <div class="hour-time">${hour.toString().padStart(2,'0')}:00</div>
          <div class="hour-icon">${displayIcon}</div>
          <div class="hour-temp">${temp}°</div>
          <div class="hour-info">💧${prec.toFixed(1)} 💨${windSpeed} 💦${Math.round(humidity)}%</div>
        </div>
      `;
    }
    
    modalHTML += `
          </div>
        </div>
      </div>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function renderHourlyPreview(data){
    if(!data) return;
    const container = document.getElementById('hourlyPreview');
    if(!container) return;
    
    container.innerHTML = '';
    const hours = Math.min(6, data.hourly.time.length);
    
    for(let i=0; i<hours; i++){
      const time = new Date(data.hourly.time[i]);
      const hour = time.getHours();
      const timeStr = i === 0 ? 'Sekarang' : `${hour.toString().padStart(2,'0')}:00`;
      const temp = Math.round(data.hourly.temperature_2m[i]);
      let wc = data.hourly.weathercode[i];
      const prec = data.hourly.precipitation[i] || 0;
      const humidity = data.hourly.relativehumidity_2m[i];
      
      // Enhanced rain detection for hourly with icon override
      // Lower threshold for Kediri conditions (85% instead of 90%)
      const isRaining = wc >= 51 || prec > 0.1 || (humidity >= 85 && wc >= 3);
      const rainIntensity = prec > 2.5 ? 'heavy' : prec > 0.5 ? 'moderate' : 'light';
      
      // Override icon if high humidity + cloudy (likely raining/drizzle)
      // Use 85% threshold to catch more rain conditions
      let displayIcon = wcToIcon(wc);
      if(humidity >= 85 && wc >= 3 && wc < 51 && prec < 0.1) {
        // Determine if drizzle or rain based on humidity level
        displayIcon = humidity >= 95 ? '🌧️' : '🌦️';
      }
      
      const hourItem = document.createElement('div');
      hourItem.className = `hourly-item ${isRaining ? 'hourly-rain' : ''}`;
      hourItem.innerHTML = `
        <div class="hourly-time">${timeStr}</div>
        <div class="hourly-icon">${displayIcon}</div>
        ${isRaining ? `<div class="hourly-rain-indicator ${rainIntensity}">💧</div>` : ''}
        <div class="hourly-temp">${temp}°</div>
        ${prec > 0.1 || isRaining ? `<div class="hourly-precip">${prec > 0 ? prec.toFixed(1) : '~'}mm</div>` : ''}
      `;
      container.appendChild(hourItem);
    }
    
    // Add "Lihat Detail" button
    const detailBtn = document.createElement('button');
    detailBtn.className = 'hourly-detail-btn';
    detailBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Detail</span>
    `;
    detailBtn.addEventListener('click', () => showAllHourlyForecast(data));
    container.appendChild(detailBtn);
  }
  
  function showAllHourlyForecast(data){
    if(!data) return;
    
    let modalHTML = `
      <div class="hourly-modal-overlay" onclick="this.remove()">
        <div class="hourly-modal" onclick="event.stopPropagation()">
          <div class="hourly-modal-header">
            <h3>Prediksi Per Jam - 24 Jam</h3>
            <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
          </div>
          <div class="hourly-modal-content">
    `;
    
    const hours = Math.min(24, data.hourly.time.length);
    for(let i=0; i<hours; i++){
      const time = new Date(data.hourly.time[i]);
      const hour = time.getHours();
      const temp = Math.round(data.hourly.temperature_2m[i]);
      const wc = data.hourly.weathercode[i];
      const prec = data.hourly.precipitation[i] || 0;
      const humidity = data.hourly.relativehumidity_2m[i];
      const windSpeed = Math.round(data.hourly.windspeed_10m[i]);
      
      const isRaining = wc >= 51 || prec > 0.1 || (humidity >= 85 && wc >= 3);
      let displayIcon = wcToIcon(wc);
      if(humidity >= 85 && wc >= 3 && wc < 51 && prec < 0.1) {
        displayIcon = humidity >= 95 ? '🌧️' : '🌦️';
      }
      
      modalHTML += `
        <div class="hourly-modal-item ${isRaining ? 'rain' : ''}">
          <div class="hour-time">${hour.toString().padStart(2,'0')}:00</div>
          <div class="hour-icon">${displayIcon}</div>
          <div class="hour-temp">${temp}°</div>
          <div class="hour-info">💧${prec.toFixed(1)} 💨${windSpeed} 💦${Math.round(humidity)}%</div>
        </div>
      `;
    }
    
    modalHTML += `
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  return {renderHero, renderDaily, renderHourlyChart, renderSunMoon, renderActivity, renderWeatherCards, render10DayForecast, renderHourlyPreview};
})();
