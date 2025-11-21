// charts.js - Chart.js helpers
let _hourChart = null;
function createOrUpdateHourChart(ctx, labels, temps, prec){
  if(!_hourChart){
    _hourChart = new Chart(ctx, {
      type:'line',
      data:{labels, datasets:[
        {label:'Temperature (°C)', data:temps, yAxisID:'y', tension:0.3, pointRadius:3, borderWidth:2, fill:true, backgroundColor:'rgba(157,192,139,0.18)', borderColor:'#609966'},
        {label:'Precip (mm)', data:prec, type:'bar', yAxisID:'y2', backgroundColor:'rgba(96,153,102,0.28)'}
      ]},
      options:{
        responsive:true,
        interaction:{mode:'index',intersect:false},
        plugins:{legend:{display:false}},
        scales:{x:{display:true}, y:{position:'left'}, y2:{position:'right',grid:{display:false}}}
      }
    });
  } else {
    _hourChart.data.labels = labels;
    _hourChart.data.datasets[0].data = temps;
    _hourChart.data.datasets[1].data = prec;
    _hourChart.update();
  }
}
