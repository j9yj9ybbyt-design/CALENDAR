/* Smart Calendar Web: deterministic, browser-side parser. No AI or remote upload. */
export const CATEGORIES = ['Lezione ordinaria','Corso sicurezza','Laboratorio','Esame','Verifica','Orientamento','Attività trasversale','Altro'];
export const MONTHS = {gen:1,feb:2,mar:3,apr:4,mag:5,giu:6,lug:7,ago:8,set:9,ott:10,nov:11,dic:12};
const MONTH_WORDS = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const TIME_RX = /\b([01]?\d|2[0-3])\s*[,.:]\s*([0-5]\d)\s*[-–—]\s*([01]?\d|2[0-3])\s*[,.:]\s*([0-5]\d)\b/;
const SHORT_DATE_RX = /\b(\d{1,2})\s*[-/]\s*(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)(?:\w*)\b/i;
const FULL_DATE_RX = /\b(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(20\d\d)\b/;
const FIRST_NAMES = new Set(['andrea','enrico','marco','silvana','annalisa','luca','maria','giulia','francesca','francesco','paolo','antonio','giovanni','stefano','federico','alessandro','alessandra','roberto','davide','simone','sara','elena','michele','matteo','lorenzo','chiara','fabio','giuseppe','valentina','elisa','daniele','filippo','claudia','riccardo','lucia','anna','massimo','carlo']);
export const clean = s => String(s ?? '').replace(/\s+/g,' ').trim();
export const normalized = s => clean(s).toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function classify(...parts){const s=normalized(parts.join(' '));if(/sicurezza|rischio alto|formazione (generale|specifica) dei lavoratori/.test(s))return 'Corso sicurezza'; if(s.includes('laboratorio'))return 'Laboratorio';if(s.includes('esame'))return 'Esame';if(s.includes('verifica'))return 'Verifica';if(s.includes('orientamento'))return 'Orientamento';if(s.includes('competenze trasversali'))return 'Attività trasversale';return 'Lezione ordinaria';}
export function validDate(s){if(!/^20\d\d-\d\d-\d\d$/.test(s||''))return false;const d=new Date(s+'T12:00:00');return !Number.isNaN(+d)&&d.getFullYear()===Number(s.slice(0,4))&&d.getMonth()+1===Number(s.slice(5,7))&&d.getDate()===Number(s.slice(8,10));}
export function parseTime(s){const m=clean(s).match(TIME_RX); if(!m)return null;const t=[`${m[1].padStart(2,'0')}:${m[2]}`,`${m[3].padStart(2,'0')}:${m[4]}`];return t[0]<t[1]?t:null;}
export function parseDate(s,year){let m=clean(s).match(FULL_DATE_RX);if(m)return iso(+m[3],+m[2],+m[1]);m=clean(s).match(SHORT_DATE_RX);if(m&&year)return iso(year,MONTHS[m[2].slice(0,3).toLowerCase()],+m[1]);m=normalized(s).match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(20\d\d)\b/);if(m)return iso(+m[3],MONTH_WORDS.indexOf(m[2])+1,+m[1]);return null;}
function iso(y,m,d){let s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return validDate(s)?s:null;}
export function detectYear(text){const specific=clean(text).match(/\b(?:calendario|smart automation|anno|attivit[aà])[^\n]{0,80}?\b(20\d{2})\b/i);if(specific)return +specific[1];const matches=[...text.matchAll(/\b20\d\d\b/g)].map(m=>+m[0]).filter(y=>y>=2020&&y<=2099);return matches[0]||null;}
export function reorderTeacher(value){const p=clean(value).split(' ');if(p.length>=2&&FIRST_NAMES.has(normalized(p[p.length-1]))&&!FIRST_NAMES.has(normalized(p[0])))return `${p.pop()} ${p.join(' ')}`;return p.join(' ');}
export function splitRoom(v){const s=clean(v).replace(/\s*·\s*/g,' ');if(!s||/^(non indicat[oa]|-)$/i.test(s))return ['Non indicata',''];let m=s.match(/^([A-Z]\d{1,3}|L\d{1,3}|[A-Z]+\d+)(?:\s*[-–]?\s*(PT|P\.?T\.?|piano terra|\d+[°º]\s*(?:P|piano)))?/i);if(!m)return [s,''];let floor=clean(m[2]);if(/^(PT|P\.?T\.?|piano terra)$/i.test(floor))floor='Piano terra';else if(/\d+/.test(floor))floor=(floor.match(/\d+/)||[''])[0]+'° piano';return [m[1],floor];}
export function makeEvent(data){return {id:data.id||`evt-${globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)}`,date:data.date||'',start:data.start||'',end:data.end||'',title:clean(data.title),subject:clean(data.subject),teacher:clean(data.teacher),room:clean(data.room)||'Non indicata',floor:data.floor||'',location:data.location||'',category:data.category||classify(data.title,data.subject),notes:data.notes||'',source:data.source||'',confidence:data.confidence||'alta'};}
export const eventKey = e=>[e.date,e.start,e.end,normalized(e.title),normalized(e.subject)].join('|');
export function deduplicate(events){const keys=new Set();return events.filter(e=>{let k=eventKey(e);if(keys.has(k))return false;keys.add(k);return true;});}
export function audit(events){const issues=[];for(const e of events){if(!validDate(e.date)||!/^\d\d:\d\d$/.test(e.start)||!/^\d\d:\d\d$/.test(e.end)||e.end<=e.start)issues.push({id:e.id,type:'error',message:`Data/orario non valido: ${e.title}`});if(!e.teacher)issues.push({id:e.id,type:'warning',message:`Docente mancante: ${e.title}`});if(!e.room||e.room==='Non indicata')issues.push({id:e.id,type:'info',message:`Aula non indicata: ${e.title}`});if(e.confidence==='da verificare')issues.push({id:e.id,type:'warning',message:`Verificare estrazione: ${e.title}`});}
for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++){const a=events[i],b=events[j];if(a.date!==b.date)continue;if(eventKey(a)===eventKey(b))issues.push({id:b.id,type:'warning',message:'Possibile duplicato'});else if(a.start<b.end&&b.start<a.end)issues.push({id:a.id,type:'warning',message:`Sovrapposizione: ${a.start} e ${b.start} del ${a.date}`});}return issues;}
function lineText(items){let s='';let prev=null;for(const w of items){if(prev!==null&&w.x-prev>0.35)s+=' ';s+=w.str;prev=w.x+w.width;}return clean(s);}
function groupLines(items){const lines=[];for(const t of [...items].filter(t=>clean(t.str)).sort((a,b)=>a.y-b.y||a.x-b.x)){let g=lines.findLast(v=>Math.abs(v.y-t.y)<Math.max(2.1,Math.min(4,t.height*.48||2.5)));if(!g){g={y:t.y,items:[]};lines.push(g);}g.items.push(t);}return lines.sort((a,b)=>a.y-b.y).map(g=>({...g,items:g.items.sort((a,b)=>a.x-b.x),text:lineText(g.items)}));}
function segment(line,a,b){return lineText(line.items.filter(w=>w.x>=a&&w.x<b));}
// The "Docenti" column is frequently *not* aligned with its header: PDF text
// extraction yields glyph anchors, not Excel cell boundaries. Derive flexible
// bounds from adjacent column headers, then verify names against right-side text.
function spreadsheetLayout(lines,pageWidth){
  const row=lines.find(l=>{const x=normalized(l.text);return x.includes('orario')&&x.includes('data')&&x.includes('titolo')&&x.includes('materia');});
  if(!row)return null;
  const head={};
  for(const t of row.items){
    const n=normalized(t.str);
    for(const key of ['orario','data','mod','titolo','materia','a','docenti','docente','insegnante','i/e','sede','aula'])if(n===key)head[key]=t.x;
  }
  if(!('data'in head)||!('titolo'in head)||!('materia'in head))return null;
  const teacherX=head.docenti??head.docente??head.insegnante;
  const anchors=Object.entries(head).filter(([k])=>!['docenti','docente','insegnante'].includes(k)).map(([,x])=>x).sort((a,b)=>a-b);
  const prev=teacherX===undefined?null:[...anchors].reverse().find(x=>x<teacherX);
  const next=teacherX===undefined?null:anchors.find(x=>x>teacherX);
  const mode=head['i/e']??pageWidth*.92;
  const roomHeader=head.sede??head.aula??pageWidth*.94;
  const teacherStart=teacherX===undefined?(head.a!==undefined?head.a+5:pageWidth*.80)
    :(prev===undefined?Math.max(head.materia+10,teacherX-28):prev+Math.min(7,Math.max(3,(teacherX-prev)*.12)));
  const teacherEnd=teacherX===undefined?mode-5:(next===undefined?pageWidth+1:next-4);
  // If room is left of teacher (some course exports), do not assume the
  // teacher belongs to the room merely because of a fixed column index.
  const priorRoom=[...anchors].filter(x=>x<roomHeader).at(-1);
  const roomStart=priorRoom===undefined?roomHeader-18:priorRoom+8;
  return {headerY:row.y,time:[0,head.data-4],date:[head.data-4,head.mod??head.titolo-30],
    title:[(head.mod??head.titolo-100)+14,head.titolo+.57*(head.materia-head.titolo)],
    subject:[head.titolo+.57*(head.materia-head.titolo),(head.a??(teacherX??pageWidth*.82)-15)-5],
    teacher:[teacherStart,teacherEnd],room:[roomStart,pageWidth+1],
    module:[(head.mod??head.titolo-100),head.titolo],fallbackTeacher:teacherX??pageWidth*.84,
    teacherEnd,roomHeader,pageWidth};
}
// Teachers are names (including multi-word surnames such as "Da Re"), not the
// numeric training-hour column, I/E status, or an aula such as "A7 1° P".
function teacherNameFromRight(line,layout){
  const minimumX=layout.subject[1]+1;
  const items=line.items.filter(t=>t.x>=minimumX).sort((a,b)=>a.x-b.x);
  const fragments=[];
  for(const item of items){
    let v=clean(item.str).replace(/^\d+(?:[,.:]\d+)?\s+(?=[A-Za-zÀ-ÿ])/,'');
    if(!v||/^\d+(?:[,.:]\d+)?$/.test(v))continue;
    if(/^(?:i|e|i\/e|p\.?t\.?|piano\s+terra|\d+[°º]?\s*p(?:iano)?\.?|(?:[A-Z]{1,3}\d{1,3})(?:\s+.*)?)$/i.test(v))continue;
    if(/^(?:sede|aula|docente|docenti)$/i.test(v))continue;
    if(/\b(?:formazione|sicurezza|lavoratori|rischio|competenze|meccatronici|meccanica|elettronica)\b/i.test(v))continue;
    if(!/^[A-ZÀ-Ý][\p{L}'’.-]*(?:\s+[A-ZÀ-Ý][\p{L}'’.-]*)*$/u.test(v))continue;
    fragments.push(v);
  }
  const candidate=clean(fragments.join(' '));
  const pieces=candidate.split(' ').filter(Boolean);
  if(pieces.length<2||pieces.length>6||pieces.every(w=>w.length<=2))return '';
  return reorderTeacher(candidate);
}
function chooseTeacher(line,layout,teacherRaw,roomRaw){
  const candidate=teacherNameFromRight(line,layout);
  const raw=clean(teacherRaw).replace(/^\d+\s+/,'');
  // Prefer a complete name recovered from the entire right side of the row.
  // This also repairs cases where "Da Re" lands under a different PDF column.
  if(candidate&&(!raw||candidate.split(' ').length>raw.split(' ').length||raw!==candidate))return candidate;
  return reorderTeacher(raw);
}
function safetyTopic(t,s){const combined=clean(`${t} ${s}`).replace(/LAVORO(?=Formazione)/ig,'LAVORO ');let m=combined.match(/formazione\s+(generale|specifica)\s+dei\s+lavoratori/i);if(!m)return null;const extra=clean(combined.slice(m.index+m[0].length)).replace(/^[-– ]+/,'');const header=clean(combined.slice(0,m.index)).replace(/^\d+\s*/,'');if(!/salute\s+e\s+sicurezza/i.test(header)&&!/rischio\s+alto/i.test(extra))return null;return {title:m[0][0].toUpperCase()+m[0].slice(1).toLowerCase(),subject:extra,notes:header.replace(/\bLAVORO\b/i,'lavoro')};}
function pickRoom(s){if(!s)return 'Non indicata';return s.replace(/^\b\d+\s+(?=[A-Z]\d)/,'').trim()||'Non indicata';}
function spreadsheetEvents(lines,layout,year,source){
  const events=[];
  for(const line of lines){
    if(line.y<=layout.headerY+3)continue;
    const rawTime=segment(line,...layout.time),dateRaw=segment(line,...layout.date);
    const time=parseTime(rawTime),date=parseDate(dateRaw,year);
    if(!time||!date){
      if(events.length&&line.y-events[events.length-1]._y<24){
        const sub=segment(line,...layout.subject);
        if(sub&&!/^[-\d]+$/.test(sub))events[events.length-1].subject=clean(events[events.length-1].subject+' '+sub);
        // Some PDF exporters put the teacher on a second visual line.
        const teacher=teacherNameFromRight(line,layout);
        if(teacher&&!events[events.length-1].teacher)events[events.length-1].teacher=teacher;
      }
      continue;
    }
    const tt=segment(line,...layout.title);
    const subj=segment(line,...layout.subject);
    const special=safetyTopic(tt,subj);
    const rawTeacher=segment(line,...layout.teacher);
    const roomRaw=segment(line,...layout.room);
    const teacher=chooseTeacher(line,layout,rawTeacher,roomRaw);
    let [room,floor]=splitRoom(pickRoom(roomRaw));
    // A teacher placed in the last column may be misread as "sede".
    if(teacher&&room!=='Non indicata'&&!/^([A-Z]{1,3}\d{1,3}|PT|piano\s+terra)/i.test(room)){
      if(normalized(room).includes(normalized(teacher))||normalized(teacher).includes(normalized(room))){room='Non indicata';floor='';}
    }
    const title=special?.title||tt||subj;
    const topic=special?.subject??subj;
    if(!title)continue;
    const category=classify(title,topic,tt);
    const confidence=teacher&&(room!=='Non indicata'||category==='Corso sicurezza')?'alta':'da verificare';
    const e=makeEvent({date,start:time[0],end:time[1],title,subject:topic,teacher,room,floor,
      category,notes:special?.notes||'',source,confidence});
    e._y=line.y;
    events.push(e);
  }
  return events.map(e=>{delete e._y;return e;});
}
function portraitEvents(lines,year,source){
 const events=[];let current=null,section='Lezione ordinaria',month=11,lastY=-1;
 let titleLeft=166,teacherLeft=367,roomLeft=458;
 for(const l of lines){
  const text=l.text,norm=normalized(text);
  if(norm.includes('orario')&&norm.includes('docente')&&norm.includes('aula')){
    for(const it of l.items){const key=normalized(it.str);if(key==='attivita')titleLeft=it.x;if(key==='docente')teacherLeft=it.x;if(key==='aula')roomLeft=it.x;}
    current=null;continue;
  }
  if(/\b\d{1,2}\s*[-–]\s*\d{1,2}\s+novembre\s+20\d\d/i.test(text))month=11;
  if(/\b\d{1,2}\s*[-–]\s*\d{1,2}\s+dicembre\s+20\d\d/i.test(text))month=12;
  if(/\bcorso sicurezza\b/i.test(text)&&!parseTime(text)&&text.length<90){section='Corso sicurezza';current=null;continue;}
  if(/\blezioni ordinarie\b/i.test(text)){section='Lezione ordinaria';current=null;continue;}
  const m=text.match(/\b(lun|mar|mer|gio|ven|sab|dom)\s+(\d{1,2})(?:\s+(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic))?\s*[·.\-]?\s*([01]?\d[,.:][0-5]\d\s*[-–—]\s*[01]?\d[,.:][0-5]\d)/i);
  if(m){const mth=m[3]?MONTHS[m[3].toLowerCase()]:month;const date=iso(year,mth,+m[2]),time=parseTime(m[4]);if(date&&time){current=makeEvent({date,start:time[0],end:time[1],title:'',category:section,source,confidence:'da verificare'});events.push(current);lastY=l.y;}
  } else if(!current||l.y-lastY>65||/nessuna lezione|non sono specificate|^\s*\d+\.\s+(lezioni|corso)/i.test(text))continue;
  if(!current)continue;
  const title=segment(l,titleLeft-1,teacherLeft-2),teacher=segment(l,teacherLeft-1,roomLeft-1),room=segment(l,roomLeft-1,10000);
  if(title){if(!current.title)current.title=title;
    else if(/^[a-zàèéìòù]/.test(title)||(/\b(ed|e|di|dei|della|sistemi)\s*$/i.test(current.title)&&!current.subject))current.title=clean(current.title+' '+title);
    else current.subject=clean(current.subject+' '+title);
  }
  if(teacher)current.teacher=clean(current.teacher+' '+teacher);
  if(room){const [r,f]=splitRoom(room);current.room=r;current.floor=f;}
  lastY=l.y;
 }
 return events.filter(e=>e.title).map(e=>({...e,category:classify(e.title,e.subject,e.category),confidence:e.teacher?'alta':'da verificare'}));
}
export function parsePages(pages,source,yearOverride=null){const warnings=[];const text=pages.map(p=>p.items.map(i=>i.str).join(' ')).join('\n');const year=detectYear(text)||yearOverride;if(!year)return {events:[],warnings:['Anno non riconosciuto: inseriscilo e ripeti l’analisi.'],needsYear:true};let all=[];for(const page of pages){const lines=groupLines(page.items);const layout=spreadsheetLayout(lines,page.width);let events=layout?spreadsheetEvents(lines,layout,year,source):portraitEvents(lines,year,source);all.push(...events);if(!events.length)warnings.push(`Pagina ${pages.indexOf(page)+1}: nessuna lezione riconosciuta; verifica il PDF.`);}
const before=all.length;all=deduplicate(all);if(before!==all.length)warnings.push(`${before-all.length} duplicati eliminati.`);if(!all.length)warnings.push('Nessuna lezione estratta. Il PDF potrebbe essere una scansione oppure un formato non riconosciuto.');if(all.some(e=>e.confidence==='da verificare'))warnings.push('Alcuni campi non sono stati riconosciuti con certezza: controlla l’anteprima.');return {events:all.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)),warnings,needsYear:false};}
