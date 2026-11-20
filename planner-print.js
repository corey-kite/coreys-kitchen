/* Printable planner and offline PDF export; no plan data leaves this browser. */
(() => {
'use strict';
const ascii=s=>String(s).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/·/g,' | ').replace(/½/g,'1/2').replace(/¼/g,'1/4').replace(/¾/g,'3/4').replace(/⅓/g,'1/3').replace(/⅔/g,'2/3').replace(/⅛/g,'1/8').replace(/⅜/g,'3/8').replace(/⅝/g,'5/8').replace(/⅞/g,'7/8').normalize('NFKD').replace(/[^\x20-\x7E\n]/g,'');
function pdf(text){
 const lines=ascii(text).split('\n').flatMap(line=>{const out=[];while(line.length>88){let at=line.lastIndexOf(' ',88);if(at<1)at=88;out.push(line.slice(0,at));line=line.slice(at).trimStart();}out.push(line);return out;});
 const pages=[];for(let i=0;i<lines.length;i+=55)pages.push(lines.slice(i,i+55));
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'];
 const kids=[];
 pages.forEach((page,i)=>{const id=objects.length+1;kids.push(`${id} 0 R`);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${id+1} 0 R >>`);const safe=s=>s.replace(/[\\()]/g,'\\$&');const stream='BT /F1 10 Tf 13 TL 40 750 Td\n'+page.map(s=>`(${safe(s)}) Tj T*`).join('\n')+`\nET\nBT /F1 9 Tf 40 25 Td (Page ${i+1} of ${pages.length}) Tj ET\n`;objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);});
 objects[1]=`<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(' ')}] >>`;
 let output='%PDF-1.4\n',offsets=[0];objects.forEach((obj,i)=>{offsets.push(output.length);output+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const xref=output.length;output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return new Blob([output],{type:'application/pdf'});
}
window.coreysPlannerPdf=pdf;
window.coreysPrintPlanner=(text,week)=>{
 document.getElementById('mp-print-view')?.remove();
 const panel=document.createElement('section');panel.id='mp-print-view';panel.setAttribute('aria-label','Printable meal planner');
 const toolbar=document.createElement('div');toolbar.className='mp-print-tools';
 const back=document.createElement('button');back.type='button';back.textContent='Back to planner';
 const print=document.createElement('button');print.type='button';print.textContent='Print / Save as PDF';
 const download=document.createElement('a');download.textContent='Download PDF';download.download=`Coreys-Kitchen-Planner-${week}.pdf`;const url=URL.createObjectURL(pdf(text));download.href=url;
 const help=document.createElement('p');help.textContent='If printing does not open in your phone app, tap Download PDF. Open the downloaded file to print or share it.';
 const content=document.createElement('pre');content.textContent=text;
 toolbar.append(back,print,download,help);panel.append(toolbar,content);document.body.append(panel);
 const previousY=window.scrollY;document.body.dataset.plannerPreview='true';window.scrollTo(0,0);
 back.onclick=()=>{delete document.body.dataset.plannerPreview;panel.remove();URL.revokeObjectURL(url);window.scrollTo(0,previousY);document.getElementById('mp-print')?.focus({preventScroll:true});};
 print.onclick=()=>{try{window.print();}catch{help.textContent='Printing is unavailable here. Tap Download PDF, then open the file to print or share it.';}};
 back.focus();
};
})();
