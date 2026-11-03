(() => {
  'use strict';
  const PUBLIC = 'https://corey-kite.github.io/coreys-kitchen/';
  const CLOUD = 'https://coreys-kitchen.corey-r-kite.chatgpt.site/';
  const bridge = window.coreysFavoriteState;
  const validId = id => typeof id === 'string' && /^recipe-[1-9]\d{0,5}$/.test(id);
  const cleanIds = ids => [...new Set(Array.isArray(ids) ? ids.filter(validId) : [])].slice(0,500);
  const cloud = window.coreysCloud;
  const params = new URLSearchParams(location.search);
  const prefKey = 'coreys-prefer-synced-kitchen';
  const getStored = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const putStored = (key,value) => { try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value); } catch {} };
  const parse = value => { try { return JSON.parse(value); } catch { return null; } };
  const syncLink = document.getElementById('sync-favorites-link');


  function copyWebsiteButton() {
    const button=document.createElement('button');button.type='button';button.id='copy-public-link';button.className='copy-public-link';
    button.textContent='Copy website link';button.setAttribute('aria-label','Copy public website link');
    button.onclick=async()=>{
      try {
        await navigator.clipboard.writeText(PUBLIC);
        button.textContent='Public link copied!';
        if (typeof window.toast==='function') window.toast('Public homepage link copied. Ready to share.');
        setTimeout(()=>{button.textContent='Copy website link';},3500);
      } catch {
        const dialog=document.createElement('dialog');dialog.className='favorites-import-dialog public-link-dialog';
        const title=document.createElement('h2');title.textContent='Share Corey’s Kitchen';
        const note=document.createElement('p');note.textContent='Copy this public homepage link for Facebook or a message. Visitors can browse recipes without signing in.';
        const input=document.createElement('input');input.type='text';input.readOnly=true;input.value=PUBLIC;input.setAttribute('aria-label','Public website link');
        const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>{dialog.close();dialog.remove();};
        dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close();dialog.remove();});
        dialog.append(title,note,input,close);document.body.append(dialog);dialog.showModal();input.select();
      }
    };
    return button;
  }

  if (!cloud?.enabled) {
    if (params.has('local')) { putStored(prefKey,null); params.delete('local'); history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():'')+location.hash); }
    // A public visit must never navigate to the private sign-in area.
    putStored(prefKey,null);
    document.querySelector('header nav')?.append(copyWebsiteButton());
    if (syncLink) syncLink.addEventListener('click',() => {
      const url = new URL(CLOUD); url.searchParams.set('view','favorites');
      const ids = cleanIds(bridge?.getIds() ?? parse(getStored('coreys-favorites')));
      if (ids.length) url.searchParams.set('import',ids.join(','));
      syncLink.href = url.toString();
    });
    return;
  }

  const bar = document.createElement('section'); bar.className = 'favorites-sync-bar';
  bar.setAttribute('aria-label','Your private synced kitchen');
  const label = document.createElement('div');
  const heading = document.createElement('strong'); heading.textContent = 'Your private kitchen';
  const status = document.createElement('span'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite'); status.textContent = 'Connecting your favorites…';
  label.append(heading,status); bar.append(label);
  const actions = document.createElement('div'); actions.className = 'favorites-sync-actions'; bar.append(actions);
  actions.append(copyWebsiteButton());
  document.querySelector('header')?.after(bar);
  if (syncLink) { syncLink.textContent = 'Public recipe box ↗'; syncLink.href = cloud.publicUrl+'?local=1'; }
  const link = (text,href) => { const a=document.createElement('a');a.textContent=text;a.href=href;a.target='_top';return a; };
  if (!cloud.userId) {
    status.textContent = 'Sign in with the same ChatGPT account on your computer and phone.';
    actions.append(link('Sign in with ChatGPT',cloud.signInPath)); return;
  }
  const who = document.createElement('span'); who.className='favorites-account'; who.textContent=cloud.displayName;
  actions.append(who,link('Sign out',cloud.signOutPath));
  if (!bridge) { status.textContent='The recipe box is updating. Refresh in a moment to connect your favorites.'; return; }
  const retry = document.createElement('button'); retry.type='button';retry.textContent='Retry sync';retry.hidden=true;actions.append(retry);
  const prefix = 'coreys-favorite-change:'+cloud.userId+':';
  const pending = new Map();
  let remote = new Set(cleanIds(bridge.getIds())),busy=false,connected=false,requestNumber=0,appliedNumber=0,importShown=false;
  function readPending() {
    try { for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) {
      const item=parse(localStorage.getItem(key));
      if (item && validId(item.id) && typeof item.selected==='boolean' && typeof item.operationId==='string') pending.set(item.id,item);
    } } catch {}
  }
  readPending();
  function showState() {
    const ids = new Set(remote);
    for (const change of pending.values()) change.selected ? ids.add(change.id) : ids.delete(change.id);
    bridge.replace([...ids]);
  }
  function showStatus(message,error=false) { status.textContent=message;retry.hidden=!error; }
  function queue(id,selected) {
    const item={id,selected,operationId:crypto.randomUUID()};pending.set(id,item);
    putStored(prefix+id,JSON.stringify(item));showState();showStatus('Saving your favorites…');void flush();
  }
  async function request(changes) {
    const serial=++requestNumber;
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch('/api/favorites',{method:changes?'POST':'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:changes?{'Content-Type':'application/json'}:{},body:changes?JSON.stringify({changes}):undefined});
      const data=await response.json();
      if (response.status===401) throw new Error('Your session expired. Sign in again to finish syncing.');
      if (!response.ok || !Array.isArray(data.favorites)) throw new Error(data.error || 'Could not connect to your favorites.');
      if (serial>=appliedNumber) { remote=new Set(cleanIds(data.favorites));appliedNumber=serial; }
      connected=true;return data;
    } finally { clearTimeout(timer); }
  }
  async function flush() {
    if (busy) return;
    busy=true;
    try {
      if (!navigator.onLine) throw new Error('Offline. Your changes will sync when the connection returns.');
      if (!connected) await request();
      while (pending.size) {
        const changes=[...pending.values()].slice(0,20);const data=await request(changes);
        const acknowledged=new Set(data.acknowledged || []);
        for (const c of changes) if (acknowledged.has(c.operationId) && pending.get(c.id)?.operationId===c.operationId) {
          pending.delete(c.id);
          if (parse(getStored(prefix+c.id))?.operationId===c.operationId) putStored(prefix+c.id,null);
        }
        showState();
      }
      showState();showStatus('Favorites synced across your devices.');
      offerImport();
    } catch (error) {
      if (connected) showState();
      showStatus(pending.size ? 'Changes saved on this device; waiting to sync. '+(error.message || '') : (error.message || 'Could not connect. Please retry.'),true);
    } finally { busy=false; }
  }
  async function refresh() {
    if (busy || document.hidden) return;
    if (pending.size || !connected) { await flush(); return; }
    busy=true;
    try { await request();showState();showStatus('Favorites synced across your devices.');offerImport(); }
    catch (error) { showStatus(error.message || 'Could not refresh your favorites. Please retry.',true); }
    finally { busy=false; }
  }
  function clearImport() {
    const url=new URL(location.href);url.searchParams.delete('import');history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  function offerImport() {
    if (importShown) return;
    importShown=true;
    const fromLink=cleanIds((params.get('import')||'').split(','));
    const legacy=cleanIds(parse(getStored('coreys-favorites')));
    const ids=cleanIds([...fromLink,...legacy]).filter(id=>!remote.has(id));
    if (!ids.length) { clearImport();return; }
    const dialog=document.createElement('dialog');dialog.className='favorites-import-dialog';
    const title=document.createElement('h2');title.textContent='Bring your favorites along';
    const copy=document.createElement('p');copy.textContent='Add '+ids.length+' saved '+(ids.length===1?'recipe':'recipes')+' from your browser to your private kitchen? Anything already saved in your account will stay there.';
    const buttons=document.createElement('div');buttons.className='favorites-sync-actions';
    const add=document.createElement('button');add.type='button';add.textContent='Add my favorites';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='quiet';cancel.textContent='Keep them on this device';
    const dismiss=()=>{dialog.close();dialog.remove();clearImport();};
    cancel.onclick=dismiss;dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
    add.onclick=()=>{
      for (const id of ids) { const item={id,selected:true,operationId:crypto.randomUUID()};pending.set(id,item);putStored(prefix+id,JSON.stringify(item)); }
      dismiss();showState();showStatus('Importing your favorites…');void flush();
    };
    buttons.append(add,cancel);dialog.append(title,copy,buttons);document.body.append(dialog);dialog.showModal();
  }
  window.addEventListener('coreys:favorite-change',e=>{if (validId(e.detail?.id) && typeof e.detail.selected==='boolean') queue(e.detail.id,e.detail.selected);});
  window.addEventListener('storage',e=>{
    if (!e.key?.startsWith(prefix)) return;
    const id=e.key.slice(prefix.length),item=parse(e.newValue);
    if (item && validId(item.id) && item.id===id && typeof item.selected==='boolean') pending.set(id,item);else pending.delete(id);
    if (connected) showState();void refresh();
  });
  window.addEventListener('online',()=>void flush());
  document.addEventListener('visibilitychange',()=>{if (!document.hidden) void refresh();});
  retry.onclick=()=>void refresh();
  const showFavorites=()=>{if(params.get('view')==='favorites') bridge.showFavorites();};
  window.addEventListener('coreys:ready',showFavorites,{once:true});
  if (bridge.ready()) showFavorites();
  setInterval(()=>void refresh(),20000);
  void flush();
})();
