(() => {
'use strict';
const vulgar={'¼':'1/4','½':'1/2','¾':'3/4','⅓':'1/3','⅔':'2/3','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8','⅙':'1/6','⅚':'5/6'};
const normalize=s=>String(s).replace(/(\d)([¼½¾⅓⅔⅛⅜⅝⅞⅙⅚])/g,'$1 $2').replace(/[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚]/g,c=>vulgar[c]);
const num='(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d*\\.\\d+|\\d+)';
const qty=`${num}(?:\\s*(?:–|—|-|to)\\s*${num})?`;
const value=s=>s.trim().split(/\s+/).reduce((a,x)=>a+(x.includes('/')?x.split('/').map(Number).reduce((a,b)=>a/b):Number(x)),0);
function format(n){if(n===0)return'0';for(const d of [1,2,3,4,6,8,9,12,16,24,32]){const m=Math.round(n*d);if(m>0&&Math.abs(m/d-n)<0.002){const w=Math.floor(m/d),r=m%d;return r?`${w?w+' ':''}${r}/${d}`:String(w);}}return String(Number(n.toFixed(n<.1?4:3)));}
function multiply(q,f){return q.split(/\s*(?:–|—|-|to)\s*/).map(x=>format(value(x)*f)).join('–');}
const units='(?:fluid ounces?|fl\\.? oz\\.?|tablespoons?|teaspoons?|tbsp\\.?|tsp\\.?|cups?|pounds?|lbs?\\.?|ounces?|oz\\.?|grams?|kilograms?|millilit(?:er|re)s?|lit(?:er|re)s?|gallons?|quarts?|pints?|mL|kg|g|sticks?|cans?|boxes?|box|packets?|packages?|eggs?|egg yolks?|cloves?|lemons?|limes?|onions?|potatoes|potato|peppers?|tortillas?|bagels?|buns?|muffins?|bars?|slices?|sprigs?|leaves|breasts?|thighs?|carrots?|stalks?|strips?|rolls?|husks?)';
const mods='(?:(?:large|small|medium|whole|dried|beaten|packed|rounded|generous|skinless|boneless|chicken|corn|fresh|sweet|red|green|grape|bay|cinnamon)\\s+){0,4}';
const endHeading=/^(directions|instructions|method|steps|notes|source|sources|tips|equipment|nutrition|storage)\s*:?$/i;
function bounds(lines){let a=lines.findIndex(s=>/^ingredients\s*:?$/i.test(s));if(a<0){if(/^Yield: (?:1 full day|3 breakfast choices)/.test(lines[0]||'')){const b=lines.findIndex(s=>/^(Planning Note|Breakfast Notes)$/.test(s));return[1,b<0?lines.length:b];}return[-1,-1];}let b=lines.findIndex((s,i)=>i>a&&endHeading.test(s));return[a+1,b<0?lines.length:b];}
function scaleIngredient(raw,f){if(f===1)return raw;let s=normalize(raw).replace(/\bOne\b/g,'1').replace(/\bTwo\b/g,'2');const held=[];const keep=t=>`⟦${held.push(t)-1}⟧`;
// Container sizes and fat percentages describe products; they are not ingredient quantities.
s=s.replace(/(\b(?:cans?|bottles?|cartons?|packages?|packets?)\s*)(\([^)]*\))/gi,(_,p,t)=>p+keep(t));
s=s.replace(/\([^)]*\)/g,t=>/\b(?:original|per original batch)\b/i.test(t)?'':(/^\(\s*\d+(?:\.\d+)?\s*[-–]\s*(?:ounce|oz|pound|lb|gram|g|fluid)/i.test(t)||/\b(?:net weight|can size|package size|carton|bottle|pack)\b/i.test(t))?keep(t):t);
s=s.replace(/\b\d+\s*%|\b80\/20\b/g,keep);
// Fold compound weights into one usable measurement before scaling.
s=s.replace(new RegExp(`(${num})\\s+pounds?\\s+(${num})\\s+ounces?`,'gi'),(_,a,b)=>`${format(value(a)*16+value(b))} ounces`);
const replaceQ=q=>keep(multiply(q,f));
// Every numeric ingredient starts with its amount, even when its unit is a food noun.
s=s.replace(new RegExp(`^((?:(?:about|scant|optional|up to)\\s*:?\\s*)*)(${qty})(?![\\d/.%])`,'i'),(_,p,q)=>p+replaceQ(q));
// Additional measured amounts cover alternatives, combined spoon measures and equivalent weights.
s=s.replace(new RegExp(`(^|[^\\w⟦/])(${qty})\\s+(${mods}${units})(?=\\b|\\s|$)`,'gi'),(_,p,q,u)=>p+replaceQ(q)+' '+u);
// Tiny quantity annotation for salt added to taste is an increment, not a batch amount.
if(/added .* at a time/i.test(raw))return raw;
s=s.replace(/⟦(\d+)⟧/g,(_,i)=>held[Number(i)]).replace(/\s{2,}/g,' ').trim();
s=s.replace(/\b1 (cups|tablespoons|teaspoons|pounds|ounces|grams|gallons|quarts|pints|cans|eggs|cloves|slices)\b/g,(_,u)=>'1 '+u.slice(0,-1));
if(/\begg(?:s| yolk)?\b/i.test(raw)&&!/(?:egg noodles|eggplant|egg-free)/i.test(raw)&&f!==Math.round(f))s+=' — beat and measure any fractional egg';
return s;
}
const overrides={'recipe-187':{base:6,unit:'servings',note:'One filled sandwich per serving.'},'recipe-1':{base:1,unit:'days',note:'All meals and snacks scale together.'},'recipe-2':{base:1,unit:'sets of breakfast options',note:'Each breakfast option scales separately; choose one option per meal.'},'recipe-198':{base:4,unit:'servings',note:'Original yield is about 3–4 servings; scaling uses 4.'},'recipe-197':{base:3,unit:'servings',note:'Original yield is about 2–3 servings; scaling uses 3.'},'recipe-70':{base:4,unit:'servings',note:'Original yield is about 3–4 servings; scaling uses 4.'}};
function info(r){if(overrides[r.id])return overrides[r.id];const top=normalize(r.lines.slice(0,3).join(' | '));let m=top.match(/(?:serves|servings?:|yield:)\s*(?:about\s*)?(\d+(?:\.\d+)?)(?:\s*(?:–|-|to)\s*(\d+))?\s*(?:generous\s+)?(?:servings?|people)?\b/i);
// Require an explicit serving unit after Yield, rather than treating cups or loaves as people.
const explicit=top.match(/(?:about\s+)?(\d+(?:\.\d+)?)(?:\s*(?:–|-|to)\s*(\d+))?\s+(?:generous |side |snack\/side |main-dish )?servings?\b/i)||top.match(/\bServes\s+(\d+(?:\.\d+)?)(?:\s*(?:–|-|to)\s*(\d+))?\b/i);
if(explicit)return{base:Number(explicit[2]||explicit[1]),unit:'servings',note:explicit[2]?'Scaling uses the upper end of the original serving range.':''};
const pieces=top.replace(/\([^)]*\)/g,'').match(/(\d+)(?:\s*(?:–|-|to)\s*(\d+))?\s+(?:(?:small|medium|thin|generous|generously filled|cheese|hearty) )*(bagels?|muffins?|tamales?|bars?|bites?|balls?|popper halves|flatbreads?|tortillas?|sandwiches|patties|bowls?|drinks?|slices?)\b/i);
if(pieces)return{base:Number(pieces[2]||pieces[1]),unit:pieces[3],note:pieces[2]?'Scaling uses the upper end of the original yield range.':''};
return{base:1,unit:'batches',note:'This recipe has no clear serving count. Scale by batch size instead.'};}
function selection(r,amount){const i=info(r);if(amount==='original')return{factor:1,...i};if(String(amount).startsWith('batch:'))return{...i,factor:Number(String(amount).slice(6))};return{...i,factor:Number(amount)/i.base};}
function lines(r,amount){if(amount==='original')return r.lines;const {factor}=selection(r,amount);if(!(factor>0))return r.lines;const[a,b]=bounds(r.lines);return r.lines.map((s,i)=>i>=a&&i<b?scaleIngredient(s,factor):s);}
function note(r,amount){const i=info(r),x=selection(r,amount);return `Original yield: ${i.base} ${i.unit}. ${i.note} `+(amount==='original'?'Choose an amount to scale the ingredient list.':`Ingredients multiplied by ${format(x.factor)}. Fractional cans mean part of the stated can size; beat and measure fractional eggs. Use the scaled ingredient list when the original directions mention an amount. Cooking time, temperature, pan size and oil depth do not scale automatically.`);}
function options(r){const i=info(r);return[{value:'original',label:'Original batch'},...[.25,.5,1.5,2].map(n=>({value:'batch:'+n,label:format(n)+' × original batch'})),...(i.unit==='batches'?[]:[1,2,3,4,5,6,8,10,12].map(n=>({value:String(n),label:n+' '+(i.unit==='servings'?(n===1?'person':'people'):i.unit)})))];}
window.coreysScale={info,lines,note,options,ingredients:ls=>{const[a,b]=bounds(ls);return a<0?[]:ls.slice(a,b);},scaleIngredient,format};
})();
