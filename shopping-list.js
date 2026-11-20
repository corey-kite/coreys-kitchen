(() => {
'use strict';
const categories=['Produce','Meat & seafood','Dairy & eggs','Bakery & bread','Canned & jarred goods','Pasta, rice & grains','Baking & spices','Oils, sauces & condiments','Frozen foods','Other & supplies'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).toLowerCase().replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g,c=>({'¼':'1/4','½':'1/2','¾':'3/4','⅓':'1/3','⅔':'2/3','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'}[c])).replace(/\s+/g,' ').trim();
function department(text){const s=norm(text);
 if(/\b(frozen|ice cream)\b/.test(s))return 'Frozen foods';
 if(/\b(canned|can |cans |jar |jars |broth|stock|beans|tomato paste|tomato sauce|tomatoes.*(?:diced|crushed)|salsa|pickl|olives|artichoke hearts|soup)\b/.test(s))return 'Canned & jarred goods';
 if(/\b(flour|sugar|powder|paprika|cumin|cayenne|salt|pepper flakes|black pepper|white pepper|seasoning|spice|cinnamon|turmeric|dried|vanilla extract|gelatin|yeast|baking|cornstarch|honey|cocoa|chocolate)\b/.test(s))return 'Baking & spices';
 if(/\b(oil|sauce|dressing|vinegar|mayonnaise|mustard|ketchup|sriracha|soy sauce)\b/.test(s))return 'Oils, sauces & condiments';
 if(/\b(cheese|milk|cream|butter|yogurt|eggs?|mozzarella|cheddar|parmesan|crema)\b/.test(s))return 'Dairy & eggs';
 if(/\b(chicken|beef|pork|turkey|bacon|sausage|shrimp|crawfish|salmon|tuna|fish|meat)\b/.test(s))return 'Meat & seafood';
 if(/\b(bread|buns?|rolls?|tortillas?|bagels?|panko|breadcrumbs?|crackers)\b/.test(s))return 'Bakery & bread';
 if(/\b(pasta|macaroni|spaghetti|noodles|rice|ziti|oats|orzo|quinoa)\b/.test(s))return 'Pasta, rice & grains';
 if(/\b(onions?|garlic|potatoes|potato|carrots?|celery|tomatoes|tomato|peppers?|jalape|poblano|tomatillo|lettuce|greens|spinach|kale|parsley|cilantro|coriander leaves|basil|rosemary|thyme|lemon|lime|apples?|berries|avocado|ginger|asparagus|cabbage|corn|mushrooms|zucchini|cucumber)\b/.test(s))return 'Produce';
 return 'Other & supplies';
}
// Combine only identical ingredient descriptions in the same measuring unit.
// Package sizes, alternatives, ranges and compound amounts stay explicit.
function parse(text){const s=norm(text),m=s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s+(cups?|tablespoons?|teaspoons?|pounds?|ounces?)\s+(.+)$/);if(!m||/\b(or|plus)\b|[()]/.test(m[3])||/^\d/.test(m[3]))return null;const q=m[1].split(' ').reduce((a,x)=>a+(x.includes('/')?x.split('/').map(Number).reduce((a,b)=>a/b):Number(x)),0);return{q,unit:m[2].replace(/s$/,''),name:m[3]};}
function collect(batches){const map=new Map();Object.values(batches).forEach(batch=>batch.items.forEach(text=>{const parsed=parse(text),key=parsed?`sum|${parsed.unit}|${parsed.name}`:'line|'+norm(text);let item=map.get(key);if(!item){item={key,text,sources:[],quantity:0,count:0,parsed,department:department(text)};map.set(key,item);}item.count++;if(parsed)item.quantity+=parsed.q;if(!item.sources.includes(batch.title))item.sources.push(batch.title);}));return [...map.values()].map(item=>{if(item.parsed){const p=item.parsed,f=window.coreysScale.format(item.quantity);item.text=`${f} ${p.unit}${item.quantity<=1?'':'s'} ${p.name}`;}else if(item.count>1)item.text+=` (listed ${item.count} times; amounts shown are per use)`;return item;});}
// Shopping names describe the product; recipe amounts remain visible for reference.
function purchase(text){const s=norm(text);if(/\bsoup\b/.test(s))return genericPurchase(text);const rules=[
 [/\belbow macaroni\b/,'Elbow macaroni','Choose boxed pasta or bulk elbow macaroni.'],
 [/\bspaghetti\b/,'Spaghetti','Choose a box or bulk pasta.'],
 [/\b(?:panko|breadcrumbs?|bread crumbs)\b/,'Breadcrumbs','Choose the breadcrumb style listed below.'],
 [/\b(?:ground|minced) beef\b/,'Ground beef','Choose a package or ask at the meat counter; match the total weight below.'],
 [/\b(?:ground|minced) chicken\b/,'Ground chicken','Choose a package with enough for the recipe amounts below.'],
 [/\b(?:ground|minced) turkey\b/,'Ground turkey','Choose a package with enough for the recipe amounts below.'],
 [/\b(?:chicken broth|chicken stock)\b/,'Chicken broth or stock','Choose cartons or cans; check the total volume needed below.'],
 [/\b(?:beef broth|beef stock)\b/,'Beef broth or stock','Choose cartons or cans; check the total volume needed below.'],
 [/\b(?:canned|can |cans ).*chicken|chicken.*\b(?:can|canned)\b/,'Canned chicken','Check the can size and number needed below.'],
 [/\b(?:raw )?chicken wing/,'Chicken wings','Choose flats and drumettes; check the count below.'],
 [/\bmozzarella\b/,'Mozzarella cheese','Choose shredded cheese or a block to shred.'],
 [/\bcheddar\b/,'Cheddar cheese','Choose shredded cheese or a block to shred.'],
 [/\bparmesan\b/,'Parmesan cheese','Choose grated Parmesan or a block to grate.'],
 [/\bcream cheese\b/,'Cream cheese','Choose a block or tub that matches the recipe.'],
 [/\bsour cream\b/,'Sour cream','Choose a tub with enough for the amounts below.'],
 [/\bgreek yogurt\b/,'Plain Greek yogurt','Choose a tub; check the required style and amount below.'],
 [/\b(?:evaporated|condensed|coconut|almond|oat) milk\b/,null,'Choose the milk type listed below; check the package volume.'],
 [/\bmilk\b/,'Milk','Choose your preferred carton size, with enough for the amounts below.'],
 [/\bbutter\b/,'Butter','Choose a package; check salted or unsalted in the recipe below.'],
 [/\begg(?:s)?\b/,'Eggs','Choose a carton; check the size and number below.'],
 [/\ball.purpose flour\b/,'All-purpose flour','Choose a bag or buy from the bulk bins.'],
 [/\bself.rising flour\b/,'Self-rising flour','Choose a bag labeled self-rising.'],
 [/\bgarlic powder\b/,'Garlic powder','Choose a spice jar or bulk seasoning.'],
 [/\bonion powder\b/,'Onion powder','Choose a spice jar or bulk seasoning.'],
 [/\bpaprika\b/,'Paprika','Choose the variety listed below, such as smoked or regular.'],
 [/\bcayenne\b/,'Cayenne pepper','Choose a spice jar or bulk seasoning.'],
 [/\bblack pepper\b/,'Black pepper','Choose ground pepper or peppercorns as required below.'],
 [/\bsalt\b/,'Salt','Choose the salt type listed below.'],
 [/\b(?:zip.top|ziploc) bag\b/,'Gallon-size zip-top bags','Choose a box if you do not already have one.'],
 [/\blemon zest\b/,'Lemons for zest','Buy fresh lemons, or use zest you already have.'],
 [/\blime zest\b/,'Limes for zest','Buy fresh limes, or use zest you already have.'],
 [/\bwater\b/,'Water','Use drinking water you already have; buy bottled water only if needed.'],
 [/\bgarlic\b/,'Garlic','Buy bulbs or prepared minced garlic as specified below.'],
 [/\bgreen onions?|scallions?\b/,'Green onions','Choose a bunch with enough for the amounts below.'],
 [/\bonions?\b/,'Onions','Buy loose or bagged; check the type and amount below.'],
 [/\bpotatoes|potato\b/,'Potatoes','Buy loose, bagged, or bulk; check the size and amount below.'],
 [/\bbacon\b/,'Bacon','Choose a package with enough slices for the amounts below.']
 ];
 // Keep alternatives and product-defining varieties distinct; never suggest a guessed weight.
 if(/\bor\b/.test(s)&&!s.includes('canola or vegetable oil'))return genericPurchase(text);
 for(const [pattern,title,hint] of rules){if(pattern.test(s)){const name=title||genericPurchase(text).title;return{title:name,hint};}}
 return genericPurchase(text);
}
function genericPurchase(text){let title=String(text).replace(/\([^)]*\)/g,'').replace(/^(?:optional\s*:\s*)?(?:(?:about|scant|up to)\s+)?/i,'').replace(/^(?:\d+(?:\s+\d+\/\d+|\/\d+|\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\s*(?:–|—|-|to)\s*(?:\d+(?:\/\d+)?))?\s*/,'').replace(/^(?:(?:cups?|tablespoons?|teaspoons?|tbsp\.?|tsp\.?|pounds?|lbs?\.?|ounces?|oz\.?|grams?|g|milliliters?|ml|cans?|jars?|slices?|cloves?|stalks?|sprigs?)\b\s*)/i,'').replace(/^(?:(?:finely|coarsely|freshly)\s+)?(?:shredded|grated|chopped|diced|minced|ground)\s+/i,'').split(/,| — /)[0].trim();if(!title)title=String(text);title=title.charAt(0).toUpperCase()+title.slice(1);return{title,hint:'Choose a package or bulk amount that covers the recipe needs below.'};}
function buyItems(batches,removed=[],departments={}){const map=new Map();collect(batches).forEach(item=>{const buy=purchase(item.text),key='buy|'+norm(buy.title);if(removed.includes(item.key)||removed.includes(key))return;let row=map.get(key);if(!row){row={key,title:buy.title,hint:buy.hint,requirements:[],sources:[],rawKeys:[],department:item.department};map.set(key,row);}row.requirements.push(item.text);row.rawKeys.push(item.key);item.sources.forEach(s=>{if(!row.sources.includes(s))row.sources.push(s);});if(categories.includes(departments[key]))row.department=departments[key];});return [...map.values()].map(x=>({...x,text:x.requirements.join('; ')}));}

window.coreysShoppingModel={department,collect,parse,purchase,buyItems};
const root=document.createElement('section');root.id='shopping-list';root.className='shopping-list';root.setAttribute('aria-labelledby','sl-heading');root.setAttribute('role','main');root.hidden=true;
root.innerHTML=`<a class="sl-back" href="#shopping-shortcut">Back to kitchen</a><span class="eyebrow">READY FOR THE GROCERY AISLE</span><h2 id="sl-heading" tabindex="-1">Your shopping list</h2><p>Add ingredients from any recipe or your weekly planner. Shop by product name, with buying suggestions and the exact recipe amounts underneath. Choose packages large enough for those amounts; package sizes vary.</p><p class="sl-local">Saved in this browser on this device. For another phone or offline shopping, download the PDF or phone list.</p><div class="sl-tools"><button type="button" id="sl-print">Print / PDF</button><button type="button" id="sl-phone">Save phone list</button><button type="button" id="sl-share">Share / copy list</button><button type="button" id="sl-clear">Clear list</button><label><input id="sl-hide" type="checkbox">Hide checked items</label></div><form id="sl-add"><label for="sl-manual">Add an extra item</label><div><input id="sl-manual" maxlength="300" placeholder="e.g., 2 apples or paper towels" required><select id="sl-department" aria-label="Grocery section"><option value="">Choose section automatically</option>${categories.map(x=>`<option>${esc(x)}</option>`).join('')}</select><button type="submit">Add item</button></div></form><p id="sl-status" role="status"></p><div id="sl-confirm" hidden>Clear all shopping items? <button type="button" id="sl-clear-yes">Yes, clear list</button> <button type="button" id="sl-clear-no">Keep list</button></div><div id="sl-items"></div><textarea id="sl-copy" aria-label="Shopping list to copy" hidden readonly></textarea>`;
const shortcut=document.createElement('section');shortcut.id='shopping-shortcut';shortcut.className='sl-shortcut';shortcut.setAttribute('aria-labelledby','sl-shortcut-heading');shortcut.innerHTML='<div><h2 id="sl-shortcut-heading">Your shopping list</h2><p id="sl-shortcut-count" aria-live="polite">Your saved groceries, ready when you are.</p></div><a class="sl-open-button" href="#shopping-list">Open shopping list</a>';document.getElementById('meal-planner').after(shortcut);document.body.append(root);
const storageKey='coreys-shopping-list-v1'+(window.coreysCloud?.userId?'-'+window.coreysCloud.userId:'');
let state={batches:{},checked:[],removed:[],departments:{},hide:false},storageOK=true;
try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved&&saved.batches&&typeof saved.batches==='object'&&!Array.isArray(saved.batches)){state.batches=Object.fromEntries(Object.entries(saved.batches).filter(([,b])=>b&&typeof b.title==='string'&&Array.isArray(b.items)&&b.items.every(x=>typeof x==='string')));for(const k of ['checked','removed'])if(Array.isArray(saved[k]))state[k]=saved[k].filter(x=>typeof x==='string');if(saved.departments&&typeof saved.departments==='object')state.departments=saved.departments;state.hide=!!saved.hide;}}catch{storageOK=false;}
const $=id=>document.getElementById(id);
function items(){return buyItems(state.batches,state.removed,state.departments);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{storageOK=false;}}
function message(text){$('sl-status').textContent=text+(storageOK?'':' This browser cannot save your changes. Download or copy your list before closing.');}
function textList(){let text='COREY’S KITCHEN — SHOPPING LIST\n\n';const all=items().filter(x=>!state.checked.includes(x.key));text+='Unchecked items only. Confirm package sizes and amounts before buying.\n\n';categories.forEach(c=>{const group=all.filter(x=>x.department===c);if(!group.length)return;text+=c.toUpperCase()+'\n'+group.map(x=>'[ ] '+x.title+'\n    '+x.hint+'\n    Recipe needs: '+x.requirements.join('; ')).join('\n\n')+'\n\n';});return text+(all.length?'':'Nothing left to buy.\n');}
function render(){const all=items(),needed=all.filter(x=>!state.checked.includes(x.key)).length;const rows=state.hide?all.filter(x=>!state.checked.includes(x.key)):all;$('sl-hide').checked=state.hide;message(`${needed} item${needed===1?'':'s'} left to buy · ${all.length} total`);$('sl-shortcut-count').textContent=all.length?`${needed} item${needed===1?'':'s'} left to buy · ${all.length} total`:'Add items from a recipe or the weekly planner.';
$('sl-items').innerHTML=categories.map(c=>{const group=rows.filter(x=>x.department===c).sort((a,b)=>a.title.localeCompare(b.title));return group.length?`<section class="sl-group"><h3>${esc(c)} <span>${group.length}</span></h3><ul>${group.map(x=>`<li class="${state.checked.includes(x.key)?'sl-done':''}"><label><input type="checkbox" data-sl-check="${esc(x.key)}" ${state.checked.includes(x.key)?'checked':''}><span><strong>${esc(x.title)}</strong><span class="sl-buy-hint">${esc(x.hint)}</span><small class="sl-amount">Recipe needs: ${esc(x.requirements.join('; '))}</small></span></label><details><summary>Details</summary><p>For: ${esc(x.sources.join('; '))}</p><label>Grocery section<select data-sl-dept="${esc(x.key)}">${categories.map(c=>`<option ${c===x.department?'selected':''}>${esc(c)}</option>`).join('')}</select></label><button type="button" data-sl-remove="${esc(x.key)}">Remove item</button></details></li>`).join('')}</ul></section>`:'';}).join('')||`<p class="sl-empty">${all.length?'All done! Uncheck “Hide checked items” to see your list.':'Your list is empty. Open a recipe and tap “Add to shopping list,” or use “Create shopping list” in the meal planner.'}</p>`;
for(const id of ['sl-print','sl-phone','sl-share','sl-clear'])$(id).disabled=!all.length;
}
function routeShopping(){const active=location.hash==='#shopping-list';root.hidden=!active;if(active){document.body.dataset.shoppingView='true';window.scrollTo(0,0);$('sl-heading').focus({preventScroll:true});}else{delete document.body.dataset.shoppingView;}}
function open(){if(document.getElementById('recipe-dialog')?.open&&typeof closeRecipe==='function')closeRecipe();location.hash='shopping-list';routeShopping();}
window.addEventListener('hashchange',routeShopping);
function replaceBatches(ids,batches){const before=new Map(items().map(x=>[x.key,x.text]));ids.forEach(id=>delete state.batches[id]);const imported=new Set();let total=0;batches.forEach(batch=>{const clean={title:String(batch.title),items:batch.items.map(String).map(x=>x.trim()).filter(Boolean)};if(!clean.items.length)return;state.batches[batch.id]=clean;total+=clean.items.length;buyItems({[batch.id]:clean}).forEach(x=>imported.add(x.key));collect({[batch.id]:clean}).forEach(x=>imported.add(x.key));});state.removed=state.removed.filter(k=>!imported.has(k));const after=new Map(items().map(x=>[x.key,x.text]));state.checked=state.checked.filter(k=>after.has(k)&&before.get(k)===after.get(k));save();render();return total;}
function addBatch(batch){return replaceBatches([batch.id],[batch]);}
function addRecipe({recipeId,title,items}){const ids=Object.keys(state.batches).filter(id=>id==='recipe:'+recipeId||id.startsWith('ingredient:'+recipeId+':'));return replaceBatches(ids,items.map((text,index)=>({id:'ingredient:'+recipeId+':'+index,title,items:[text]})));}
function addIngredient({recipeId,title,text,index}){const oldId='recipe:'+recipeId,old=state.batches[oldId];if(old){old.items.forEach((line,i)=>{state.batches['ingredient:'+recipeId+':'+i]={title:old.title,items:[line]};});delete state.batches[oldId];}return addBatch({id:'ingredient:'+recipeId+':'+index,title,items:[text]});}
window.coreysShopping={addBatch,replaceBatches,addIngredient,addRecipe,open};
root.addEventListener('change',e=>{const t=e.target;if(t.id==='sl-hide')state.hide=t.checked;else if(t.hasAttribute('data-sl-check')){state.checked=state.checked.filter(k=>k!==t.dataset.slCheck);if(t.checked)state.checked.push(t.dataset.slCheck);}else if(t.hasAttribute('data-sl-dept'))state.departments[t.dataset.slDept]=t.value;else return;save();render();});
$('sl-add').onsubmit=e=>{e.preventDefault();const text=$('sl-manual').value.trim();if(!text)return;const id='manual:'+Date.now()+':'+Math.random().toString(36).slice(2);addBatch({id,title:'Extra items',items:[text]});const k=buyItems({[id]:state.batches[id]})[0].key;if($('sl-department').value)state.departments[k]=$('sl-department').value;$('sl-manual').value='';save();render();$('sl-manual').focus();};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
root.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-sl-remove')){state.removed.push(b.dataset.slRemove);save();render();message('Item removed. Add its recipe again to bring it back.');}
if(b.id==='sl-clear')$('sl-confirm').hidden=false;if(b.id==='sl-clear-no')$('sl-confirm').hidden=true;if(b.id==='sl-clear-yes'){state={batches:{},checked:[],removed:[],departments:{},hide:false};$('sl-confirm').hidden=true;save();render();}
if(b.id==='sl-print')window.coreysPrintPlanner(textList(),'shopping-list',{title:'Printable shopping list',backLabel:'Back to shopping list',filename:'Coreys-Kitchen-Shopping-List.pdf',returnFocus:'sl-print'});
if(b.id==='sl-share'){const text=textList();try{if(navigator.share){await navigator.share({title:'Corey’s Kitchen shopping list',text});message('Shopping list shared.');}else{await navigator.clipboard.writeText(text);message('Shopping list copied. Paste it into a text or notes app.');}}catch(err){if(err.name==='AbortError')return;$('sl-copy').hidden=false;$('sl-copy').value=text;$('sl-copy').focus();$('sl-copy').select();message('Select and copy the shopping list below.');}}
if(b.id==='sl-phone'){const all=items().filter(x=>!state.checked.includes(x.key));const content=categories.map(c=>{const group=all.filter(x=>x.department===c);return group.length?`<section><h2>${esc(c)}</h2>${group.map(x=>`<label><input type="checkbox"><span><strong>${esc(x.title)}</strong><small>${esc(x.hint)}</small><small>Recipe needs: ${esc(x.requirements.join('; '))}</small></span></label>`).join('')}</section>`:'';}).join('');const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Corey’s Kitchen shopping list</title><style>body{font:18px/1.5 system-ui;max-width:750px;margin:auto;padding:20px;color:#172f22;background:#fff}h1{font-size:28px}h2{font-size:21px;border-bottom:2px solid #244c35;padding:8px 0}label{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #ddd;break-inside:avoid}input{width:24px;height:24px;flex-shrink:0;margin-top:2px}input:checked+span{text-decoration:line-through;color:#777}small{display:block;color:#555}@media print{body{font-size:12pt}label{padding:6px 0}}</style><h1>Corey’s Kitchen shopping list</h1><p>Check items as you shop. This downloaded copy works offline. Checkmarks may reset when you close the file.</p><small>Saved ${esc(new Date().toLocaleDateString())}. Confirm package sizes and amounts.</small>${content||'<p>Nothing left to buy.</p>'}</html>`;download(new Blob([html],{type:'text/html'}),'Coreys-Kitchen-Phone-Shopping-List.html');message('Phone list downloaded. Open it from Downloads to shop offline, or use Print / PDF if your phone cannot open HTML files.');}
});
// Keep existing checkmarks when upgrading the saved list to product names.
state.checked=items().filter(x=>state.checked.includes(x.key)||x.rawKeys.every(k=>state.checked.includes(k))).map(x=>x.key);save();render();routeShopping();
})();
