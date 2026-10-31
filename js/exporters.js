import {CATEGORIES,validDate} from './parser.js';
const itDate=(s,long=false)=>new Date(s+'T12:00:00').toLocaleDateString('it-IT',long?{weekday:'long',day:'numeric',month:'long',year:'numeric'}:{weekday:'short',day:'numeric',month:'short'});
const safeFilename=s=>(s||'smart-calendar').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,75);
function asBlob(blob,name){const u=URL.createObjectURL(blob),link=document.createElement('a');link.href=u;link.download=name;link.style.display='none';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),30_000);}
export function saveJson(project){asBlob(new Blob([JSON.stringify({format:'smart-calendar-web-backup',version:2,project},null,2)],{type:'application/json'}),safeFilename(project.name)+'_backup.json');}
const esc=s=>String(s??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const fold=s=>{let parts=[],current='';for(const ch of s){if(new TextEncoder().encode(current+ch).length>73){parts.push(current);current=' '+ch;}else current+=ch;}parts.push(current);return parts.join('\r\n');};
export function makeIcs(events,name='Smart Calendar'){const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Smart Calendar Web//IT','CALSCALE:GREGORIAN','METHOD:PUBLISH',`X-WR-CALNAME:${esc(name)}`];
for(const e of events){if(!validDate(e.date)||!/^\d\d:\d\d$/.test(e.start)||!/^\d\d:\d\d$/.test(e.end))continue;const day=e.date.replaceAll('-','');const title=e.subject?`${e.title} - ${e.subject}`:e.title;const parts=[e.category,e.subject&&`Argomento: ${e.subject}`,e.teacher&&`Docente: ${e.teacher}`,e.room&&e.room!=='Non indicata'&&`Aula: ${e.room}`,e.floor&&`Piano: ${e.floor}`,e.notes].filter(Boolean);
lines.push('BEGIN:VEVENT',`UID:${e.id?.replace(/[^a-zA-Z0-9-]/g,'')||Math.random().toString(36).slice(2)}@smartcalendar.local`,`DTSTAMP:${stamp}`,`DTSTART:${day}T${e.start.replace(':','')}00`,`DTEND:${day}T${e.end.replace(':','')}00`,`SUMMARY:${esc(title)}`,`DESCRIPTION:${esc(parts.join('\n'))}`,`LOCATION:${esc([e.room==='Non indicata'?'':e.room,e.floor,e.location].filter(Boolean).join(' - '))}`,`CATEGORIES:${esc(e.category)}`,'END:VEVENT');}
lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';}
export function saveIcs(events,name){asBlob(new Blob([makeIcs(events,name)],{type:'text/calendar;charset=utf-8'}),safeFilename(name)+'.ics');}
function colorFor(cat){return {'Lezione ordinaria':[39,104,188],'Corso sicurezza':[167,113,53],'Laboratorio':[99,74,169],'Esame':[193,63,74],'Verifica':[185,93,67],'Orientamento':[25,138,131],'Attività trasversale':[78,123,171]}[cat]||[84,106,132];}
export function makePdf(events,name){const jsPDF=globalThis.jspdf?.jsPDF;if(!jsPDF)throw new Error('Libreria PDF non caricata. Verifica la connessione a Internet e riprova.');const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});if(typeof doc.autoTable!=='function')throw new Error('Libreria per le tabelle PDF non disponibile.');
const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();const margins=18;doc.setFillColor(22,47,81);doc.rect(0,0,w,47,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(19);doc.text('SMART CALENDAR',margins,23);doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text(name||'Calendario delle attività formative',margins,33,{maxWidth:w-35});
let y=59;const ordered=[...new Set([...CATEGORIES,...events.map(e=>e.category)])].filter(c=>events.some(e=>e.category===c));if(!ordered.length){doc.setTextColor(60,70,90);doc.text('Nessuna lezione da esportare.',margins,y);return doc.output('blob');}
for(const [index,cat] of ordered.entries()){const rows=events.filter(e=>e.category===cat).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));if(y>h-58){doc.addPage();y=20;}const rgb=colorFor(cat);doc.setTextColor(...rgb);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(`${index+1}. ${cat.toLocaleUpperCase('it-IT')}`,margins,y);y+=6;
const body=rows.map(e=>[`${itDate(e.date)}\n${e.start}-${e.end}`,`${e.title}\n${e.subject||''}${e.notes?'\n'+e.notes:''}`,e.teacher||'Non indicato',[e.room||'Non indicata',e.floor].filter(Boolean).join(' · ')]);
doc.autoTable({startY:y,head:[['DATA E ORARIO','ATTIVITÀ / ARGOMENTO','DOCENTE','AULA']],body,margin:{left:margins,right:margins,top:18,bottom:18},tableWidth:w-margins*2,theme:'grid',styles:{font:'helvetica',fontSize:8.5,cellPadding:3.2,lineColor:[216,226,236],lineWidth:.13,textColor:[37,55,76],overflow:'linebreak',valign:'top'},headStyles:{fillColor:[235,242,250],textColor:[36,57,80],fontStyle:'bold',fontSize:7.5},alternateRowStyles:{fillColor:[250,252,254]},columnStyles:{0:{cellWidth:35,fontStyle:'bold'},1:{cellWidth:75},2:{cellWidth:36},3:{cellWidth:28}},didDrawPage:()=>{}});y=doc.lastAutoTable.finalY+16;}
const total=doc.internal.getNumberOfPages();for(let n=1;n<=total;n++){doc.setPage(n);doc.setDrawColor(218,229,240);doc.line(margins,h-14,w-margins,h-14);doc.setFontSize(8);doc.setTextColor(119,136,157);doc.text('Smart Calendar Web · calendario delle attività formative',margins,h-9);doc.text(`${n} / ${total}`,w-margins,h-9,{align:'right'});}return doc.output('blob');}
export function savePdf(events,name){asBlob(makePdf(events,name),safeFilename(name)+'.pdf');}

// PDF di riserva indipendente da librerie CDN: crea un vero PDF A4 scaricabile
// anche quando jsPDF o autoTable sono bloccati dal browser/ad blocker.
function nativePdf(events,name){
 const W=595,H=842, M=36, bottom=50, pages=[];
 const palette={'Lezione ordinaria':[.16,.36,.67],'Corso sicurezza':[.64,.38,.12]};
 const charWidth=(c,size)=>size*(c===' '?0.26:/[ilI1.,:;!|]/.test(c)?0.25:/[MW@]/.test(c)?0.76:0.51);
 const wrap=(text,width,size=9)=>{const lines=[];for(const source of String(text??'').split(/\r?\n/)){let line='';for(const word of source.split(/\s+/)){if(!word)continue;const next=line?line+' '+word:word;const measure=t=>[...t].reduce((n,c)=>n+charWidth(c,size),0);if(measure(next)>width&&line){lines.push(line);line=word;}else line=next;while(measure(line)>width){let stop=1;while(stop<line.length&&measure(line.slice(0,stop+1))<=width)stop++;lines.push(line.slice(0,stop));line=line.slice(stop);}}lines.push(line);}return lines.length?lines:[''];};
 const escaped=s=>String(s??'').replace(/[\\()]/g,'\\$&').replace(/\u2013|\u2014/g,'-').replace(/\u2022/g,'*').replace(/\u2019/g,"'").replace(/\u20ac/g,'EUR').replace(/[^\x20-\x7e\u00a0-\u00ff]/g,'?');
 const pdfTxt=(s,x,y,size=9,bold=false,color=[.15,.24,.36])=>`BT /${bold?'F2':'F1'} ${size} Tf ${color.join(' ')} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${escaped(s)}) Tj ET\n`;
 const rect=(x,y,w,h,rgb)=>`${rgb.join(' ')} rg ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f\n`;
 let current='',y=0,pageNum=0;
 const page=()=>{if(current)pages.push(current);pageNum++;current=rect(0,H-62,W,62,[.09,.20,.33])+pdfTxt('SMART CALENDAR',M,H-32,19,true,[1,1,1])+pdfTxt(name||'Calendario delle attivita formative',M,H-48,10,false,[1,1,1]);y=H-89;};
 const newline=()=>{if(y<bottom+45)page();};
 page();
 const groups=[...new Set([...CATEGORIES,...events.map(e=>e.category)])].filter(c=>events.some(e=>e.category===c));
 const widths=[105,227,121,70], lefts=[M,M+105,M+332,M+453];
 const tableHead=()=>{if(y<bottom+35)page();current+=rect(M,y-26,W-2*M,26,[.92,.95,.98]);for(const [i,t] of ['DATA / ORA','ATTIVITA / ARGOMENTO','DOCENTE','AULA'].entries())current+=pdfTxt(t,lefts[i]+5,y-17,8,true);y-=28;};
 for(const [g,cat] of groups.entries()){
  if(y<bottom+85)page();const rgb=palette[cat]||[.25,.43,.65];current+=pdfTxt(`${g+1}. ${cat.toUpperCase()}`,M,y,13,true,rgb);y-=14;tableHead();
  const rows=events.filter(e=>e.category===cat).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
  for(const e of rows){
   const cells=[`${itDate(e.date)}\n${e.start} - ${e.end}`,`${e.title}\n${e.subject||''}${e.notes?'\n'+e.notes:''}`,e.teacher||'Non indicato',[e.room||'Non indicata',e.floor].filter(Boolean).join(' - ')];
   const columns=cells.map((txt,i)=>wrap(txt,widths[i]-11,8.6));const lines=Math.max(...columns.map(x=>x.length));const height=Math.max(32,lines*12+10);
   if(y-height<bottom){page();current+=pdfTxt(`${g+1}. ${cat.toUpperCase()} (continua)`,M,y,11,true,rgb);y-=13;tableHead();}
   current+=rect(M,y-height,W-2*M,height,[.995,.997,1]);current+='0.86 0.90 0.94 RG 0.4 w '+`${M} ${(y-height).toFixed(1)} ${W-2*M} ${height.toFixed(1)} re S\n`;
   columns.forEach((ls,i)=>ls.forEach((t,k)=>{current+=pdfTxt(t,lefts[i]+5,y-13-k*12,8.6,i===0&&k===0)}));y-=height;
  }y-=22;
 }
 pages.push(current);
 const objs=[null,`<< /Type /Catalog /Pages 2 0 R >>`,`<< /Type /Pages /Kids [${pages.map((_,i)=>`${6+i*2} 0 R`).join(' ')}] /Count ${pages.length} >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`,`<< /Producer (Smart Calendar Web) >>`];
 for(let i=0;i<pages.length;i++){
  const pid=6+i*2,cid=pid+1;const footer=pdfTxt('Smart Calendar Web - Calendario formativo',M,24,8,false,[.44,.49,.58])+pdfTxt(`${i+1} / ${pages.length}`,W-63,24,8,false,[.44,.49,.58]);const content=pages[i]+footer;
  objs[pid]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cid} 0 R >>`;
  objs[cid]=`<< /Length ${content.length} >>\nstream\n${content}endstream`;
 }
 let body='%PDF-1.4\n',offsets=[0];for(let i=1;i<objs.length;i++){offsets[i]=body.length;body+=`${i} 0 obj\n${objs[i]}\nendobj\n`;}const xref=body.length;body+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;for(let i=1;i<objs.length;i++)body+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;body+=`trailer\n<< /Root 1 0 R /Size ${objs.length} >>\nstartxref\n${xref}\n%%EOF`;
 const bytes=new Uint8Array(body.length);for(let i=0;i<body.length;i++)bytes[i]=body.charCodeAt(i)&255;
 return new Blob([bytes],{type:'application/pdf'});
}
// Sovrascrive soltanto il download; gli export JSON/ICS restano invariati.
export function savePdfSafe(events,name){let blob;try{blob=makePdf(events,name);}catch(error){console.warn('jsPDF non disponibile, utilizzo il generatore PDF integrato:',error);blob=nativePdf(events,name);}asBlob(blob,safeFilename(name)+'.pdf');}
