#!/usr/bin/env python3
"""Patch non distruttiva per Smart Calendar Web 3.0: avvisi dismissibili e sincronizzati.
Eseguire dalla cartella della repository: py applica_avvisi.py
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
APP = ROOT / 'js' / 'app.js'
CSS = ROOT / 'style.css'
MARKER = '// SMART_CALENDAR_DISMISSIBLE_WARNINGS_V1'

WARNING_CODE = r'''// SMART_CALENDAR_DISMISSIBLE_WARNINGS_V1
const WARNING_PREVIEW_LIMIT = 12;
function warningEntries(){
  if(!working)return [];
  const source=(working.warnings||[]).map((message,i)=>({
    key:'document:'+i+':'+message, message:String(message), type:'warning'
  }));
  const validated=audit(working.events).map(issue=>({
    key:'event:'+issue.id+':'+issue.type+':'+issue.message,
    message:String(issue.message), type:issue.type
  }));
  return [...source,...validated];
}
function isAcknowledgedVerification(e){
  const key='event:'+e.id+':warning:Verificare estrazione: '+e.title;
  return (working?.dismissedWarnings||[]).includes(key);
}
function renderWarnings(){
  if(!working)return;
  const all=warningEntries();
  const dismissed=new Set(working.dismissedWarnings||[]);
  const visible=all.filter(item=>item.type==='error'||!dismissed.has(item.key));
  const hiddenCount=all.filter(item=>item.type!=='error'&&dismissed.has(item.key)).length;
  const hideable=visible.filter(item=>item.type!=='error').length;
  const total=all.length;
  const heading=total ? `<div class="warning-head"><strong>Segnalazioni: ${visible.length} da vedere${hiddenCount?' · '+hiddenCount+' nascoste':''}</strong><div class="warning-actions">${hideable?'<button type="button" data-warning-action="hide-all">Nascondi avvisi</button>':''}${hiddenCount?'<button type="button" data-warning-action="restore">Ripristina avvisi</button>':''}</div></div>` : '';
  const rows=visible.slice(0,WARNING_PREVIEW_LIMIT).map(item=>
    `<div class="alert ${item.type==='error'?'error':item.type==='info'?'info':''} warning-entry"><span>${item.type==='error'?'⛔':'⚠'} ${html(item.message)}</span>${item.type==='error'?'':`<button type="button" class="warning-close" aria-label="Nascondi segnalazione" title="Nascondi questo avviso" data-warning-action="hide-one" data-warning-key="${html(item.key)}">×</button>`}</div>`
  ).join('');
  const remainder=visible.length>WARNING_PREVIEW_LIMIT?`<p class="warning-more">Altri ${visible.length-WARNING_PREVIEW_LIMIT} avvisi non mostrati. Puoi nasconderli tutti oppure correggere i dati.</p>`:'';
  $('alerts').innerHTML=heading+rows+remainder;
  // Gli avvisi facoltativi possono essere nascosti; le validazioni di esportazione restano attive.
  $('downloadPdf').disabled=!working.events.some(isExportable);
  $('downloadIcs').disabled=!working.events.some(isExportable);
}
async function handleWarningClick(e){
  const btn=e.target.closest('button[data-warning-action]');
  if(!btn||!working)return;
  const action=btn.dataset.warningAction;
  const entries=warningEntries();
  let hidden=new Set(working.dismissedWarnings||[]);
  if(action==='hide-one'){
    const key=btn.dataset.warningKey;
    if(entries.some(item=>item.key===key&&item.type!=='error'))hidden.add(key);
  }else if(action==='hide-all'){
    for(const item of entries)if(item.type!=='error')hidden.add(item.key);
  }else if(action==='restore'){
    hidden.clear();
  }else return;
  working.dismissedWarnings=[...hidden];
  // persist() salva il progetto su Supabase, quando si è collegati all'account,
  // oppure nell'archivio locale. La preferenza segue quindi lo stesso calendario.
  await persist();
  renderRows();
}
'''

STYLE_CODE = r'''
/* SMART_CALENDAR_DISMISSIBLE_WARNINGS_V1 */
.warning-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#f3f7fc;border:1px solid #e4ebf5;border-radius:9px;padding:10px 14px;font-size:12px;color:#566c86}
.warning-actions{display:flex;gap:8px;flex-wrap:wrap}
.warning-actions button{border:1px solid #cbdaf0;border-radius:7px;background:#fff;color:#2c639f;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}
.warning-entry{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;line-height:1.5}
.warning-entry>span{min-width:0;flex:1;overflow-wrap:anywhere}
.warning-entry.info{background:#f7faff;color:#637b95;border-color:#e0eafb}
.warning-close{flex:0 0 auto;line-height:1;border:none;background:transparent;color:inherit;font-size:22px;cursor:pointer;padding:0 2px;opacity:.8}
.warning-close:hover{opacity:1}
.warning-more{font-size:11px;color:#71859d;margin:0;padding:5px 8px}
'''


def main():
    if not APP.exists() or not CSS.exists():
        print('ERRORE: metti questo file nella cartella CALENDAR, accanto a index.html e style.css.')
        print('Attesi:', APP, 'e', CSS)
        return 1
    app = APP.read_text(encoding='utf-8')
    css = CSS.read_text(encoding='utf-8')
    if MARKER in app:
        print('La modifica agli avvisi è già presente. Nessun file modificato.')
        return 0

    # La versione 3.0 ha renderWarnings in una singola riga; usa un pattern specifico.
    pattern = re.compile(r'^function renderWarnings\(\)\{[^\r\n]*\}\s*$', re.MULTILINE)
    matches = list(pattern.finditer(app))
    if len(matches) != 1:
        print('ERRORE: versione di app.js diversa da quella prevista. Non ho modificato nulla.')
        print('Funzioni renderWarnings compatibili trovate:', len(matches))
        return 2
    if "e.confidence==='da verificare'?' · ⚠ verifica':''" not in app:
        print('ERRORE: codice delle righe diverso dalla versione attesa. Nessun file modificato.')
        return 2
    anchor = 'bind();bindAccount();refreshArchive();'
    if app.count(anchor) != 1:
        print('ERRORE: avvio app non riconosciuto. Nessun file modificato.')
        return 2

    app = pattern.sub(lambda m: WARNING_CODE.rstrip('\n'), app, count=1)
    app = app.replace("e.confidence==='da verificare'?' · ⚠ verifica':''",
                      "e.confidence==='da verificare'&&!isAcknowledgedVerification(e)?' · ⚠ verifica':''")
    app = app.replace(anchor,
        "$('alerts').addEventListener('click',e=>{handleWarningClick(e).catch(err=>toast('Impossibile salvare gli avvisi: '+err.message,true));});\n"+anchor)
    css = css + ('\n' + STYLE_CODE if 'SMART_CALENDAR_DISMISSIBLE_WARNINGS_V1' not in css else '')
    APP.write_text(app, encoding='utf-8')
    CSS.write_text(css, encoding='utf-8')
    print('OK: pulsante ×, Nascondi avvisi e Ripristina avvisi aggiunti.')
    print('Preferenze salvate nel progetto (anche su Supabase con account collegato).')
    print('Ora esegui Commit + Sync Changes in VS Code.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
