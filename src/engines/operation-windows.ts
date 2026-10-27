import type { ActiveCrop, OperationWindow, WeatherData, WeatherWindows } from '../types/index.js';
function make(type:OperationWindow['type'], h:WeatherData['hourly'][number], crop?:ActiveCrop):OperationWindow {
  const rain=h.precipitationProbability, wind=h.windSpeed, temp=h.temperature;
  let score=100; const reasons:string[]=[]; const reasonsBn:string[]=[];
  if(rain>60){score-=50;reasons.push(`Rain probability ${rain}%`);reasonsBn.push(`বৃষ্টির সম্ভাবনা ${rain}%`)} else if(rain>30){score-=20;reasons.push(`Rain probability ${rain}%`);reasonsBn.push(`বৃষ্টির সম্ভাবনা ${rain}%`)}
  if(wind>15){score-=35;reasons.push(`Wind ${wind} km/h`);reasonsBn.push(`বাতাস ${wind} কিমি/ঘণ্টা`)} else if(wind>10){score-=15;reasons.push(`Moderate wind ${wind} km/h`);reasonsBn.push(`মাঝারি বাতাস ${wind} কিমি/ঘণ্টা`)}
  if(type==='spray' && rain<30 && wind<10){reasons.push('Low rain and wind support spray operations');reasonsBn.push('কম বৃষ্টি ও বাতাস স্প্রে কাজের জন্য সহায়ক')}
  if(type==='field_access' && rain>50) score-=20;
  const stage=crop?.config.growthStages.find(x=>x.id===crop.currentStage);
  if(stage && temp>stage.heatStressThreshold){score-=10;reasons.push(`Temperature ${temp}°C is above crop-stage threshold`);reasonsBn.push(`তাপমাত্রা ${temp}°C ফসলের পর্যায়ের সীমার ওপরে`)}
  score=Math.max(0,Math.min(100,Math.round(score)));
  const end=new Date(new Date(h.time).getTime()+3600000).toISOString();
  return {type,start:h.time,end,score,suitable:score>=70,reasons,reasonsBn,confidence:.65};
}
export function calculateOperationWindows(weather:WeatherData,crops:ActiveCrop[]=[]):WeatherWindows{
 const out={spray:[],irrigation:[],fertilizer:[],planting:[],harvest:[],fieldAccess:[]} as WeatherWindows;
 for(const h of weather.hourly.slice(0,48)) for(const type of Object.keys(out) as Array<keyof typeof out>){ const w=make(type==='fieldAccess'?'field_access':type,h,crops[0]); if(w.suitable) out[type].push(w); }
 return out;
}
