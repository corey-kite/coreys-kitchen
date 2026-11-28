(() => {
'use strict';
const body=document.body;
const copyLink=document.getElementById('copy-public-link');if(copyLink)document.querySelector('footer')?.append(copyLink);
function route(){const hash=location.hash;let view=hash==='#meal-planner'?'calendar':hash==='#recipes'||hash==='#favorites'?'recipes':hash==='#shopping-list'?'shopping':'home';if(hash.startsWith('#recipe-'))view=body.dataset.kitchenView||'recipes';body.dataset.kitchenView=view;document.querySelectorAll('header nav a').forEach(a=>{const active=(view==='home'&&a.hash==='#home')||(view==='calendar'&&a.hash==='#meal-planner')||(view==='recipes'&&a.hash==='#recipes')||(view==='shopping'&&a.hash==='#shopping-list');if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});if(!hash.startsWith('#recipe-'))window.scrollTo(0,0);}
// Handle in-page navigation directly, including embedded/mobile browsers and
// repeated taps on the current hash. Keep the URL local if a host sets a base URL.
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');
  if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const hash=link.getAttribute('href');
  if(!['#','#home','#recipes','#meal-planner','#shopping-list','#favorites'].includes(hash))return;
  event.preventDefault();
  event.stopPropagation();
  const next=hash==='#'?'#home':hash;
  if(location.hash!==next)history.pushState(null,'',location.pathname+location.search+next);
  route();
  // Notify shopping-list and other existing hash-based views immediately.
  window.dispatchEvent(new Event('hashchange'));
},true);
window.addEventListener('popstate',route);
window.addEventListener('hashchange',route);
document.getElementById('nav-favorites').addEventListener('click',()=>{history.replaceState(null,'','#favorites');body.dataset.kitchenView='recipes';route();},true);
window.addEventListener('keydown',e=>{if(e.key==='/'&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){history.replaceState(null,'','#recipes');route();}},true);
window.addEventListener('coreys:ready',()=>{if(location.hash==='#favorites')window.coreysFavoriteState?.showFavorites();});
route();
})();