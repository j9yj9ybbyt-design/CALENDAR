# Smart Calendar Web 3 — PDF + account sincronizzato

Smart Calendar Web funziona su GitHub Pages e può essere aperto da computer e telefono anche con il PC spento. Il parsing dei PDF è nel browser: i PDF originali **non** sono caricati su Supabase. Le lezioni salvate (titoli, date, docenti, aule, note) sono sincronizzate tramite Supabase se è configurato l'account; diversamente restano sul dispositivo. È sempre disponibile l'esportazione JSON per il backup.

## Pubblicazione e configurazione dell'account (una sola volta)

1. Apri https://supabase.com/ e crea un account e un **nuovo progetto**. Prendi nota della password di accesso al tuo account Supabase ma non inserirla nel codice.
2. Nel progetto apri **SQL Editor**; incolla il contenuto di `supabase_setup.sql` e premi **Run**. Questo crea la tabella `public.calendar_projects` con regole per far vedere ogni calendario soltanto al proprietario autenticato.
3. Nel pannello **Project Settings → API Keys** (la collocazione può variare) copia l'**Project URL** e la **publishable key** (oppure la precedente `anon` key). NON copiare la chiave `service_role`, una chiave `secret`, o password personali.
4. Apri `config.js` con VS Code, compila **solo** `supabaseUrl` e `supabaseAnonKey`. Esempio:

   ```js
   window.SMART_CALENDAR_CONFIG = {
     supabaseUrl: 'https://nomeprogetto.supabase.co',
     supabaseAnonKey: 'sb_publishable_...'
   };
   ```

   La chiave publishable/anon è destinata al browser e può essere pubblica; la protezione dei calendari dipende dalle regole SQL RLS e dall'accesso personale.
5. In **Authentication → Providers → Email** verifica che il login tramite email sia abilitato. Se la conferma dell'email è attiva, l'utente deve confermare l'indirizzo prima di accedere. In **Authentication → URL Configuration** inserisci come `Site URL` il sito GitHub Pages, per esempio `https://j9yj9ybbyt-design.github.io/CALENDAR/`, e aggiungi l'indirizzo completo alle **Redirect URLs**.
6. Pubblica i file su GitHub, conservando `index.html`, `config.js`, `style.css`, `supabase_setup.sql` e la cartella `js/` alla radice della repository. Da VS Code: salva con Ctrl+S → Source Control → Commit → Sync Changes. GitHub Pages deve essere impostato su `main` e `/(root)`.
7. Apri il sito sul PC, clicca **☁ Account → Crea account**, conferma l'email se richiesto, accedi. Fai lo stesso sul telefono con **la stessa email e password**. Ora i calendari nuovi appariranno su entrambi i dispositivi quando apri l'archivio / riapri il sito.

## Importare i calendari che esistevano prima dell'account

I calendari della versione 2 restano nel browser dove sono stati creati. Sul PC originale fai **☁ Account → Accedi → Importa calendari locali**: verranno **copiati** online, mantenendo gli originali in locale. Non cancellare la cache prima di avere verificato l'archivio dal telefono. Puoi anche usare i backup JSON dall'editor.

## Download PDF

In un progetto apri **Scarica PDF**. L'applicazione usa jsPDF, se disponibile, e passa automaticamente al generatore PDF integrato se la libreria non si carica. Il file include tutte le lezioni valide, ordinate per categoria e data. Se una o più lezioni hanno orari o date invalidi, il programma chiede conferma prima di esportare soltanto le lezioni corrette. Su iPhone, il PDF può comparire in File/Download del browser.

## Operatività e limiti

- Nessun Python, npm o .bat necessario per il sito. GitHub Pages ospita i file statici; Supabase ospita soltanto i dati sincronizzati e gli account.
- I calendari sincronizzati sono disponibili con l'account su PC, tablet e telefono. In caso di modifica contemporanea dello stesso calendario da dispositivi diversi, vale **l'ultimo salvataggio**: evitare l'editing simultaneo del medesimo progetto.
- Se non hai configurato Supabase o non accedi, i nuovi calendari restano locali. La modalità offline non sincronizza le modifiche finché non viene ripristinata la connessione; in modalità account, se un salvataggio fallisce, compare un errore e va riprovato. Esegui backup JSON periodici.
- Usare sempre HTTPS, password gestite dal provider e regole RLS per evitare che altri utenti possano leggere/modificare il tuo archivio. Non c'è crittografia applicativa aggiuntiva ai contenuti.
- I PDF scannerizzati senza testo richiedono OCR e non sono riconosciuti da questa versione.

## Test

Per i test del parser, se hai Node.js installato: `node --test tests/parser.test.mjs`. I test di interfaccia e download vanno eseguiti in un browser (non dal file HTML aperto tramite `file://`).
