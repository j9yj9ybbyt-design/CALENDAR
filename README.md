# Smart Calendar Web 2.0 — GitHub Pages

**Web app statica pubblicabile su GitHub Pages**, senza Python, Node.js, npm, terminale o computer sempre acceso per l'utilizzo.

## Funzioni

- Importazione di uno o più PDF da PC e smartphone.
- Lettura PDF **nel browser dell'utente** con PDF.js; riconoscimento basato su testo e coordinate delle colonne.
- Parsing di calendari didattici esportati da Excel, incluso il caso del corso sicurezza con titolo del modulo che invade il campo dell'argomento.
- Data, ora, titolo, materia, docente, aula, piano, categoria, note, editabilità completa.
- Anno cercato nel PDF; se non presente, l'app richiede un anno da indicare manualmente.
- Deduplicazione, verifica sovrapposizioni e avvisi su dati incompleti.
- Archivio locale nel **browser** tramite IndexedDB, disponibile anche dopo riapertura del sito sullo stesso browser.
- Esportazione PDF professionale multipagina con sezioni per categoria; file ICS; backup JSON.
- Ripristino backup JSON per trasferire un calendario da un dispositivo a un altro.
- Layout responsive per computer e telefono.

## Istruzioni: pubblicazione su GitHub (anche senza usare la riga di comando)

1. Accedi a https://github.com e crea un repository, ad esempio **smart-calendar-web**.
2. Per GitHub Pages gratuito, puoi usare un repository **pubblico**. **Non inserire PDF originali, password, segreti, archivi privati o backup con dati personali nel repository.**
3. Apri la repository, scegli **Add file → Upload files**. Carica **il contenuto della cartella** contenuta in questo ZIP mantenendo le sottocartelle `js` e `tests`, e includendo il file `.nojekyll`. In alternativa usa GitHub Desktop per caricare i file.
4. Premi **Commit changes**.
5. Apri **Settings → Pages → Build and deployment**. Seleziona **Deploy from a branch**, quindi **main** e **/(root)**; salva.
6. Quando la pubblicazione è completa, il sito comparirà a un indirizzo simile a `https://TUO-UTENTE.github.io/smart-calendar-web/`.
7. Apri il link dal telefono anche in 4G/5G. Sul telefono puoi usare **Condividi → Aggiungi alla schermata Home**.

L'applicazione utilizza percorsi relativi, quindi funziona anche nel sottopercorso di una repository GitHub Pages, non solo nella radice del dominio.

### IMPORTANTISSIMO: cosa significa “online”

**Online è il software, non i tuoi calendari.** Il codice HTML/CSS/JavaScript è ospitato su GitHub Pages; i PDF vengono letti in memoria sul dispositivo. Il database dei calendari è **IndexedDB locale** ed è diverso per ogni browser/dispositivo.

- Se elabori un calendario dal telefono, puoi salvarlo e riaprirlo sul telefono, anche se il PC è spento.
- Per visualizzare sul telefono un calendario creato sul PC, devi **esportare il backup JSON dal PC e importarlo dal telefono**. Non c'è sincronizzazione automatica in questa versione.
- Cancellando i dati del browser o utilizzando navigazione privata, potresti perdere i calendari salvati. Fai regolarmente backup JSON.
- Il sito pubblico non è protetto da autenticazione: **chiunque può aprire l'app, ma non accede ai calendari privati salvati nel browser di un altro utente**.
- Le librerie PDF.js, jsPDF e jspdf-autotable sono distribuite tramite CDN, quindi occorre che tali siti siano raggiungibili per elaborare ed esportare i PDF; **i PDF dell'utente non vengono trasmessi alle CDN**.
- PDF scansionati (sole immagini), cifrati o con strutture atipiche potrebbero non essere leggibili correttamente. L'OCR non è presente; l'app avvisa se non estrae appuntamenti. **Verifica il calendario prima di usarlo.**

### Miglioramento futuro: sincronizzazione sicura fra dispositivi

Per sincronizzare automaticamente gli stessi calendari su PC e smartphone serve un servizio esterno con autenticazione (ad esempio un database sicuro con backend API e accesso privato). GitHub Pages **non esegue Python** e non ha un database persistente. Per una versione cloud valutare un frontend GitHub Pages più API protette (Supabase, Cloudflare Workers/D1, o altro), separando dati privati dal repository pubblico.

## Struttura del progetto

```
index.html             interfaccia desktop/mobile
style.css              stile responsive
icon.svg               icona
js/parser.js           estrazione delle righe e classificazione
js/pdf-reader.js       lettura PDF.js nel browser
js/exporters.js        PDF, ICS, backup JSON
js/storage.js          database locale IndexedDB
js/app.js              logica applicativa e UI
.nojekyll              disabilita Jekyll in GitHub Pages
tests/parser.test.mjs  test automatici del parser e ICS
```

## Verifica dei test (facoltativa, solo per sviluppatori)

Richiede Node.js **solo per eseguire i test, non per usare o pubblicare il sito**:

```
node --test tests/*.test.mjs
```

La logica di estrazione è stata verificata in sviluppo contro i PDF di esempio del 2–6 novembre e il documento di sicurezza, usando l'estrazione di testo e delle coordinate del PDF. È necessario verificare la lettura completa su GitHub Pages anche nel browser e con altri PDF reali, perché il comportamento dei PDF può variare.

## Nota tecnica sull'affidabilità

Questa versione NON include un backend Python, riconoscimento OCR, login o sincronizzazione cloud. Non è una pubblicazione del vecchio progetto Windows: è una nuova implementazione completamente client-side. Non archivia i file PDF originali, ma i dati delle lezioni estratte e i metadati dei file.

L'uso avviene senza caricare i documenti su server di elaborazione: non inserire documenti riservati nella repository GitHub, nel sito o in un eventuale sistema di issues pubblico.
