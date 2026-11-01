import test from 'node:test';import assert from 'node:assert/strict';
import {parsePages,parseDate,parseTime,deduplicate,classify,audit,makeEvent} from '../js/parser.js';
import {makeIcs} from '../js/exporters.js';
const words=(rows,width=1000)=>({width,height:600,items:rows.flatMap(row=>row.parts.map(([x,str])=>({x,y:row.y,str,width:str.length*5,height:10})))});
function sample(){return [words([
{y:80,parts:[[20,'orario'],[105,'Data'],[164,'Mod'],[280,'Titolo'],[570,'Materia'],[704,'a'],[770,'Docenti'],[862,'I/E'],[910,'sede']]},
{y:110,parts:[[20,'13,30-17,30'],[105,'11-nov'],[164,'6'],[215,'FORMAZIONE IN MATERIA DI SALUTE E SICUREZZA NEI LUOGHI DI'],[511,'LAVOROFormazione generale dei lavoratori'],[704,'4'],[723,'Annalisa Da Re']]},
{y:149,parts:[[20,'08,30-12,30'],[105,'25-nov'],[164,'6'],[215,'FORMAZIONE IN MATERIA DI SALUTE E SICUREZZA NEI LUOGHI DI'],[511,'LAVOROFormazione specifica dei lavoratori'],[704,'4'],[723,'Annalisa Da Re']]},
{y:160,parts:[[537,'Imprese a rischio alto']]},
{y:189,parts:[[20,'13,30-17,30'],[105,'2-dic'],[164,'6'],[215,'FORMAZIONE IN MATERIA DI SALUTE E SICUREZZA NEI LUOGHI DI'],[511,'LAVOROFormazione specifica dei lavoratori'],[704,'4'],[723,'Annalisa Da Re']]},
{y:200,parts:[[537,'Imprese a rischio alto']]},
{y:230,parts:[[20,'13,30-17,30'],[105,'15-dic'],[164,'6'],[215,'FORMAZIONE IN MATERIA DI SALUTE E SICUREZZA NEI LUOGHI DI'],[511,'LAVOROFormazione specifica dei lavoratori'],[704,'4'],[723,'Annalisa Da Re']]},
{y:241,parts:[[537,'Imprese a rischio alto']]},
{y:450,parts:[[20,'SMART AUTOMATION - 2026']]},
])];}
test('Parsing degli orari italiani',()=>{assert.deepEqual(parseTime('14,00-17,00'),['14:00','17:00']);assert.deepEqual(parseTime('8:30–12:30'),['08:30','12:30']);assert.equal(parseTime('10:00-09:00'),null);});
test('Date e gestione anno',()=>{assert.equal(parseDate('2-nov',2026),'2026-11-02');assert.equal(parseDate('15-dic',2026),'2026-12-15');assert.equal(parseDate('31/02/2026',2026),null);assert.equal(parseDate('2-nov',null),null);});
test('Sicurezza PDF con testo sovrapposto e righe successive',()=>{const res=parsePages(sample(),'sicurezza.pdf');assert.equal(res.events.length,4);assert.deepEqual(res.events.map(e=>e.date),['2026-11-11','2026-11-25','2026-12-02','2026-12-15']);assert.equal(res.events[0].title,'Formazione generale dei lavoratori');assert.equal(res.events[1].subject,'Imprese a rischio alto');assert.ok(res.events.every(e=>e.teacher==='Annalisa Da Re'&&e.room==='Non indicata'&&e.category==='Corso sicurezza'));});
test('Anno mancante: non inventarlo',()=>{const pg=sample();pg[0].items=pg[0].items.filter(i=>!i.str.includes('2026'));const r=parsePages(pg,'sicurezza.pdf');assert.equal(r.needsYear,true);assert.equal(r.events.length,0);assert.equal(parsePages(pg,'sicurezza.pdf',2026).events.length,4);});
test('Deduplicazione e classificazione',()=>{const a=makeEvent({date:'2026-11-02',start:'14:00',end:'17:00',title:'Elettronica'});assert.equal(deduplicate([a,{...a,id:'new'}]).length,1);assert.equal(classify('Esame finale'),'Esame');assert.equal(classify('Laboratorio 3'),'Laboratorio');});
test('Conflitti: sovrapposizione',()=>{const a=makeEvent({date:'2026-11-02',start:'14:00',end:'17:00',title:'Materia 1'}),b=makeEvent({date:'2026-11-02',start:'15:00',end:'16:00',title:'Materia 2'});assert.ok(audit([a,b]).some(x=>x.message.includes('Sovrapposizione')));});
test('Esportazione ICS: stessi eventi e caratteri speciali',()=>{const events=parsePages(sample(),'sicurezza.pdf').events;let ics=makeIcs(events,'Prova, aula;');assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,4);assert.ok(ics.includes('DTSTART:20261215T133000'));assert.ok(ics.includes('Annalis'));assert.ok(ics.includes('X-WR-CALNAME:Prova\\, aula\\;'));});

test('Sicurezza: docente spostato nella colonna finale, aula non inventata',()=>{
 const pages=sample();
 for(const item of pages[0].items){if(item.str==='Annalisa Da Re')item.x=915;}
 const r=parsePages(pages,'sicurezza.pdf');
 assert.equal(r.events.length,4);
 assert.ok(r.events.every(e=>e.teacher==='Annalisa Da Re'&&e.room==='Non indicata'));
});

test('Sicurezza: docente diviso in frammenti fra colonne',()=>{
 const pages=sample();
 const items=pages[0].items;
 const idx=items.findIndex(x=>x.str==='Annalisa Da Re');
 items.splice(idx,1,{x:712,y:110,str:'4 Da',width:19,height:10},
   {x:772,y:110,str:'Re',width:11,height:10},
   {x:875,y:110,str:'Annalisa',width:44,height:10});
 const r=parsePages(pages,'sicurezza.pdf');
 assert.equal(r.events.length,4);
 assert.equal(r.events[0].teacher,'Annalisa Da Re');
 assert.equal(r.events[0].room,'Non indicata');
});

test('Sicurezza: docente nella riga immediatamente successiva',()=>{
 const pages=sample();
 const items=pages[0].items;
 const idx=items.findIndex(x=>x.str==='Annalisa Da Re');
 items.splice(idx,1);
 items.push({x:730,y:121,str:'Annalisa Da Re',width:62,height:10});
 const r=parsePages(pages,'sicurezza.pdf');
 assert.equal(r.events.length,4);
 assert.equal(r.events[0].teacher,'Annalisa Da Re');
});
