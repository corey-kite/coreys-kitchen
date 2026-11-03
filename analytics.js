/* Set only after Corey supplies his verified GoatCounter site address. */
(() => {
  const endpoint = window.coreysAnalyticsEndpoint;
  if (!endpoint || !/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(endpoint)) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  const queue=[];
  let ready=false;
  const send=hit=>{if(ready && typeof window.goatcounter?.count==='function') window.goatcounter.count(hit); else if(queue.length<100) queue.push(hit);};
  window.goatcounter={no_onload:true};
  window.coreysTrackRecipe=r=>{if(!r || !/^recipe-\d+$/.test(r.id))return;send({path:'/coreys-kitchen/recipes/'+r.id,title:r.title});};
  const script=document.createElement('script');
  script.src='https://gc.zgo.at/count.js';script.async=true;script.dataset.goatcounter=endpoint;
  script.onload=()=>{if(typeof window.goatcounter?.count!=='function'){queue.length=0;return;}ready=true;send({path:'/coreys-kitchen/',title:'Corey’s Kitchen'});while(queue.length)send(queue.shift());};
  script.onerror=()=>{queue.length=0;};
  document.head.appendChild(script);
})();
