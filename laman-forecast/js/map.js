// map.js - Leaflet init + radar overlay helpers
let _mainMap = null;
let _radarLayerGroup = null;
let _radarTile = null;

function initMap(container='map', lat=-6.2, lon=106.816666){
  _mainMap = L.map(container, {zoomControl:true}).setView([lat, lon], 8);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attribution:'Esri'}).addTo(_mainMap);
  _radarLayerGroup = L.layerGroup().addTo(_mainMap);
}

function setMapCenter(lat, lon, name){
  if(!_mainMap) return;
  _mainMap.setView([lat, lon], 8);
  L.marker([lat, lon]).addTo(_mainMap).bindPopup(name||'Lokasi').openPopup();
}

function showRadarOnMap(frame){
  if(!_mainMap) return;
  // remove old
  if(_radarTile) { try{ _mainMap.removeLayer(_radarTile); }catch(e){} _radarTile = null; }
  const url = `https://tilecache.rainviewer.com/v2/radar/${frame.time}/256/{z}/{x}/{y}/2/1_1.png`;
  _radarTile = L.tileLayer(url, {opacity:0.6});
  _radarTile.addTo(_mainMap);
}
