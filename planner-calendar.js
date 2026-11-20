(() => {
'use strict';
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !Number.isNaN(d.getTime())&&iso(d)===s;}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dateAt(start,offset){if(!validDate(start))throw new Error('Invalid calendar date');const d=new Date(start+'T12:00:00');d.setDate(d.getDate()+offset);return iso(d);}
function cleanDay(d){return {id:typeof d?.id==='string'?d.id:'',portion:['original','1','2','3','4','5','6','8','10','12','batch:0.25','batch:0.5','batch:1.5','batch:2'].includes(String(d?.portion))?String(d.portion):'original',note:typeof d?.note==='string'?d.note.slice(0,300):''};}
function create(start,defaults,saved,legacy){
const s={version:2,week:start,calendar:{},checked:[],extraWeeks:{}};
if(saved?.version===2&&saved.calendar&&typeof saved.calendar==='object'){
 s.week=validDate(saved.week)?saved.week:start;
 for(const [date,day] of Object.entries(saved.calendar))if(validDate(date))s.calendar[date]=cleanDay(day);
 s.checked=Array.isArray(saved.checked)?saved.checked.filter(x=>typeof x==='string'):[];
 if(saved.extraWeeks&&typeof saved.extraWeeks==='object')for(const [date,text] of Object.entries(saved.extraWeeks))if(validDate(date)&&typeof text==='string')s.extraWeeks[date]=text;
}else if(legacy&&Array.isArray(legacy.days)&&legacy.days.length===7){
 s.week=validDate(legacy.week)?legacy.week:start;
 legacy.days.forEach((day,i)=>s.calendar[dateAt(s.week,i)]=cleanDay(day));
 s.extraWeeks[s.week]=typeof legacy.extras==='string'?legacy.extras:'';
 s.checked=(Array.isArray(legacy.checked)?legacy.checked:[]).filter(x=>typeof x==='string').map(x=>/^\d\|/.test(x)?x.replace(/^([0-6])\|/,(_,i)=>dateAt(s.week,Number(i))+'|'):x.startsWith('extra|')?s.week+'|'+x:x);
}else defaults.forEach((id,i)=>s.calendar[dateAt(start,i)]=cleanDay({id,portion:'original'}));
return s;
}
function view(s){return {days:Array.from({length:7},(_,i)=>cleanDay(s.calendar[dateAt(s.week,i)])),extras:s.extraWeeks[s.week]||''};}
function stash(s,days,extras){days.forEach((d,i)=>s.calendar[dateAt(s.week,i)]=cleanDay(d));s.extraWeeks[s.week]=extras;}
function snapshot(s){return {version:2,week:s.week,calendar:s.calendar,checked:s.checked,extraWeeks:s.extraWeeks};}
window.coreysCalendar={validDate,dateAt,create,view,stash,snapshot};
})();
