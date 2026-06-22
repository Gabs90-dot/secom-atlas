# ATLAS CRM — MASTER CONTEXT

**Ultimo aggiornamento:** 22 giugno 2026  
**Proprietario operativo:** Gabriele “Gabs” Pedroli  
**Azienda:** SECOM S.r.l.  
**Percorso locale:** `C:\Users\gpedroli\secom-atlas`

---

## 1. Scopo del documento

Questo file è la fonte di contesto principale del progetto ATLAS CRM dentro ChatGPT Projects.

Serve a evitare la dispersione tra chat diverse e a mantenere continuità su:

- visione del prodotto;
- architettura;
- stato reale dello sviluppo;
- regole operative;
- priorità;
- problemi noti;
- prossimi interventi.

Le decisioni più recenti prevalgono su eventuali informazioni storiche o contraddittorie presenti in vecchie conversazioni.

---

## 2. Visione del prodotto

ATLAS nasce come web app CRM operativa interna sviluppata per SECOM S.r.l., ma la direzione approvata è trasformarla in una piattaforma neutra e white-label riutilizzabile da altre aziende.

L’obiettivo è sostituire progressivamente strumenti frammentati, ridurre la dipendenza operativa da GLPI per SECOM e rendere GLPI un’integrazione opzionale per tenant. I nuovi tenant devono poter partire nativamente con ATLAS senza GLPI.

ATLAS deve diventare il centro operativo per:

- clienti e sedi;
- contatti;
- ticket e interventi;
- attività Webvime;
- pianificazione;
- calendario;
- To Do;
- contratti;
- asset;
- magazzino;
- budget;
- manuali e documentazione;
- download tecnici;
- portale clienti;
- analisi operative;
- utenti, ruoli e permessi;
- Copilot operativo in linguaggio naturale.

Il prodotto deve essere professionale, mobile-first, multi-tenant, sicuro, scalabile e realmente utilizzabile da tecnici, dispatcher, amministratori e clienti.

---

## 3. Stack tecnico

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- integrazione GLPI REST/MySQL
- Vercel
- GitHub
- PWA/web app responsive

Repository locale:

```text
C:\Users\gpedroli\secom-atlas
```

Build:

```cmd
cd C:\Users\gpedroli\secom-atlas
npm.cmd run build
```

Sviluppo:

```cmd
cd C:\Users\gpedroli\secom-atlas
npm.cmd run dev
```

Deploy abituale:

```cmd
cd C:\Users\gpedroli\secom-atlas
npm.cmd run build
git add .
git commit -m "atlas deploy update"
git push
```

Se Vercel è collegato al branch `main`, il push avvia automaticamente il deploy.

---

## 4. Regole operative

### Modifiche al codice

Quando Gabs carica un file da correggere:

- correggere direttamente il file;
- restituire il file completo;
- non creare canvas;
- non dare istruzioni lunghe se la modifica può essere applicata direttamente;
- aggiungere solo i comandi essenziali di build o deploy.

Quando la modifica è manuale:

- usare istruzioni precise;
- indicare “cerca con Ctrl+F”;
- mostrare esattamente cosa sostituire;
- evitare indicazioni vaghe.

### Build

Ogni sequenza deve partire da:

```cmd
cd C:\Users\gpedroli\secom-atlas
```

### Codex

Non suggerire Codex automaticamente, salvo richiesta esplicita di Gabs.

Quando viene preparato un prompt per Codex:

- specificare sempre il livello di ragionamento;
- evitare prompt inutilmente lunghi;
- dividere i lavori grossi in blocchi;
- chiedere sempre build, TypeScript check e `git diff --check`;
- chiedere nessun commit e nessun push;
- non affidare più moduli critici insieme senza audit.

### Principio generale

Prima si protegge:

1. sicurezza;
2. integrità dei dati;
3. logica business;
4. desktop esistente;
5. mobile;
6. estetica.

---

## 5. Ruoli e permessi

Ruoli principali:

- `super_admin`
- `admin`
- `manager`
- `dispatcher`
- `tecnico`
- `commerciale`
- `cliente_admin`
- `cliente_user`

Esiste una foundation multi-tenant attiva.

L’autenticazione reale Supabase è attiva.

Il sistema IAM/User Management Center è attivo.

Il ruolo supremo non deve essere eliminabile accidentalmente.

I ruoli cliente devono vedere soltanto dati e funzioni appartenenti al proprio cliente/tenant.

Non devono esistere bypass mobile o differenze di permesso tra desktop e mobile.

---

## 6. Moduli principali

- Home
- Clienti
- Contatti
- Webvime
- Centrale Operativa
- Piani
- Apri Chiamata
- To Do List
- Calendario
- Registro Ticket
- Manuali
- Portale Clienti
- Analisi
- Insight AI
- Timeline / Activity
- Contratti
- Budget
- Magazzino
- Asset e Sistemi
- Mappa
- Download
- Utenti
- Import GLPI
- Design Lab / tema Executive

---

## 7. Architettura generale

L’app usa App Router.

Storicamente gran parte della logica era concentrata in `app/page.tsx`, ma sono stati eseguiti diversi refactor per estrarre helper SLA, tipi clienti, export helper, layout, navigazione, shell mobile e desktop, renderer dei moduli e componenti Executive.

File rilevanti:

```text
app/page.tsx
components/atlas/layout/AtlasAppFrame.tsx
components/atlas/layout/AtlasWorkspaceContent.tsx
components/atlas/layout/AtlasModuleRenderer.tsx
components/atlas/layout/AtlasHeader.tsx
components/atlas/layout/AtlasSidebar.tsx
components/atlas/layout/atlasNavigation.tsx
components/atlas/layout/useAtlasShellMode.ts
components/atlas/MobileBottomNav.tsx
components/atlas/MobileMoreMenu.tsx
components/atlas-executive/
```

---

## 8. Sicurezza e isolamento dati

Sono stati effettuati interventi su:

- autenticazione delle route;
- route GLPI;
- creazione ticket;
- work orders/PDF;
- cancellazione GLPI;
- tenant isolation;
- ruoli cliente;
- data minimization;
- separazione dati tra tenant.

Helper server importante:

```text
lib/server/requireAtlasUser.ts
```

Gestisce token Supabase, tenant attivo, `tenant_users`, ruoli consentiti, utenti legacy autorizzati e restrizioni server-side.

Le route sensibili devono usare controllo server-side, non solo UI.

Nessuna modifica futura deve indebolire auth, tenant isolation, role checks, customer scope o data minimization.

---

## 9. Integrazione GLPI

ATLAS integra GLPI per storico ticket, creazione ticket, follow-up, soluzioni, timeline, sincronizzazione e import dati.

Import storico:

- circa 23.000 ticket;
- batch consigliato da 500;
- endpoint `/search/Ticket`;
- campo GLPI 80 usato per entity path;
- parser per entity, region, site, city e `glpi_entity_path`.

Il mapping `customer_id` è stato parzialmente risolto.

È stata preparata la tabella:

```text
customer_aliases
```

per migliorare il matching.

Strategia attuale:

- lo storico GLPI è utile ma non deve bloccare il completamento del prodotto;
- ATLAS può essere popolato progressivamente con anagrafiche corrette;
- la qualità operativa futura è più importante della perfezione dello storico.

Sync automatico:

```text
/api/admin/glpi-auto-sync
```

con doppia guardia Bearer token o `x-atlas-cron-secret`.

### White-label e GLPI opzionale

È stata approvata la trasformazione di ATLAS in piattaforma neutra/white-label.

Foundation implementata:

```text
lib/tenantConfig.ts
lib/server/tenantConfig.ts
lib/tenant.ts
supabase/migrations/20260622143000_add_tenant_white_label_config.sql
```

La configurazione tenant include branding, contatti, colori, tema, `ticket_provider` e `glpi_enabled`.

Comportamento previsto dalla migration:

- tenant già esistenti: `ticket_provider = 'glpi'`, `glpi_enabled = true`;
- tenant futuri: default `ticket_provider = 'atlas'`, `glpi_enabled = false`;
- fallback applicativo legacy: GLPI resta temporaneamente attivo se lo schema non è ancora migrato;
- fallback branding: neutro ATLAS, senza dati SECOM.

La migration non deve contenere hardcode SECOM e non va eseguita automaticamente.

Blocco route server-side implementato tramite:

```text
lib/server/glpiTenantGuard.ts
```

Route protette:

```text
/api/glpi/create-ticket
/api/admin/glpi-delete-ticket
/api/admin/glpi-sync-db
/api/admin/glpi-auto-sync
/api/admin/glpi-sync-entities
/api/admin/glpi-import/batch
/api/admin/glpi-add-followup
```

Per tenant ATLAS-native o con `glpi_enabled = false`, le route GLPI rispondono `403` con codice `glpi_disabled`. Il controllo è server-side e usa il tenant autenticato. La doppia guardia cron resta preservata.

### Creazione ticket provider-aware

Blocco 3A implementato senza migration aggiuntiva:

```text
app/api/tickets/create/route.ts
app/page.tsx
```

Comportamento dichiarato:

- provider `glpi`: crea il ticket ATLAS e poi esegue il flusso GLPI esistente;
- provider `atlas` o `glpi_enabled = false`: crea direttamente il ticket nella tabella `tickets`;
- `tenant_id` deriva esclusivamente dall’utente autenticato;
- campi `glpi_*` null per ticket nativi;
- validazione server-side di tenant, ruolo e customer/site/entity scope;
- nessuna chiamata GLPI per tenant ATLAS-native.

Verifiche Codex dichiarate verdi per foundation, route guard e creazione provider-aware:

```cmd
npm.cmd run build
npx.cmd tsc --noEmit
git diff --check
```

Rischi residui:

- UI e testi possono ancora mostrare riferimenti GLPI ai tenant ATLAS-native;
- Registro Ticket, PDF, Copilot e dashboard non sono ancora completamente provider-aware;
- serve smoke test reale di creazione ticket sia su tenant GLPI sia su tenant ATLAS-native;
- verificare idempotenza e comportamento in caso di errore GLPI dopo la creazione del ticket ATLAS.

---

## 10. Registro Ticket

Il Registro Ticket comprende filtri, export CSV, timeline, follow-up, soluzione, apertura dettaglio, stato, date operative, GLPI/ATLAS, cancellazione autorizzata e bolle/interventi.

Richieste principali:

- ordinamento cronologico;
- orario apertura;
- allegati;
- vista enterprise;
- mobile professionale;
- niente scroll annidati;
- niente header sticky sovrapposti;
- azioni raggiungibili.

### Stato attuale mobile

Codex ha dichiarato completato un intervento limitato al file:

```text
components/atlas/TicketRegistry.tsx
```

Intervento dichiarato sotto `lg`:

- vista mobile/tablet più naturale;
- nessun header sticky interno;
- rimozione di `max-h`/`min-h` e dello scroll verticale annidato dalla lista;
- paginazione e CTA non sticky su mobile;
- dettaglio ticket con altezza massima basata sulla viewport e supporto safe-area;
- ricerca sempre visibile;
- filtri secondari nel pannello “Filtri” con contatore;
- pulsante “Azzera filtri”;
- azione primaria “Apri dettaglio” sempre visibile;
- azioni secondarie nel pannello “Azioni”.

Le card dichiarate continuano a mostrare ID, cliente, sede, descrizione, stato, urgenza, tecnico, apertura e scadenza/chiusura prevista quando disponibili.

Desktop dichiarato invariato, con condizioni legate a `variant === "mobile"`.

Verifiche Codex dichiarate verdi:

```cmd
npm.cmd run build
npx.cmd tsc --noEmit
git diff --check
```

Rischio residuo dichiarato: follow-up, timeline e bolla restano raggiungibili tramite “Apri dettaglio”/workspace e richiedono smoke test reale su mobile.

**Stato di revisione ChatGPT:** report coerente con architettura e roadmap, ma il file o il diff non sono stati ancora ispezionati direttamente. Commit autorizzabile solo dopo controllo del diff/file e smoke test rapido; deploy soltanto dopo smoke test positivo.

---

## 11. Piani operativi

File principale:

```text
components/atlas/OperationalPlansCenter.tsx
```

Problema originario:

- tabella con `min-w-[960px]`;
- uso mobile basato su scroll orizzontale.

Intervento mobile completato localmente:

- sotto `lg`: card mobile/tablet;
- da `lg`: tabella desktop invariata;
- filtri full-width;
- pulsante “Azzera filtri”;
- azioni “Pianifica”, “Aperta”, “Fatta”, “Salta”;
- stessi handler esistenti;
- indicatore scadenza superata;
- nessuna modifica a API, Supabase, auth o GLPI.

Verifiche Codex dichiarate verdi:

```cmd
npm.cmd run build
npx.cmd tsc --noEmit
git diff --check
```

Commit/deploy di questo blocco: **da verificare**.

---

## 12. Mobile shell e navigazione

Audit mobile completato in modalità read-only.

Problemi principali trovati:

- doppio rendering mobile/desktop;
- dashboard Executive duplicata;
- tre liste hardcoded diverse per la navigazione;
- tab mancanti da mobile;
- shell ibrida a 768 px;
- safe-area assente;
- sessione/logout poco raggiungibili;
- scroll annidati;
- sticky header sovrapposti;
- modali grandi;
- tabelle desktop inutilizzabili su smartphone.

### Primo blocco mobile implementato

File creato:

```text
components/atlas/layout/useAtlasShellMode.ts
```

Soluzione:

- sotto `lg`: shell mobile/tablet;
- da `lg`: shell desktop;
- branch reale, non semplice CSS hide;
- niente doppio mounting di componenti stateful;
- niente seconda ExecutiveDashboard;
- navigazione derivata da una configurazione unica;
- bottom nav primaria;
- menu Altro completo;
- sessione mobile;
- supporto safe-area;
- ruoli e permessi invariati.

Funzioni di navigazione:

```text
createAtlasTabGroups()
getMobilePrimaryTabs()
getMobileMoreTabGroups()
getAuthorizedAtlasTabGroups()
```

Verifiche Codex dichiarate verdi:

```cmd
npm.cmd run build
npx.cmd tsc --noEmit
git diff --check
```

Commit/deploy di questo blocco: **da verificare**.

---

## 13. Roadmap mobile approvata

Ordine corretto:

1. shell, header e navigazione;
2. Piani;
3. Registro Ticket;
4. Webvime;
5. To Do;
6. scroll e sticky;
7. form e modali;
8. Calendario;
9. Mappa;
10. Portale Cliente;
11. dashboard Classic;
12. dashboard Executive;
13. test responsive completi.

Viewport minimi:

- 360×800
- 375×812
- 390×844
- 430×932
- 768×1024
- desktop da 1024 px

Obiettivi:

- nessuno scroll orizzontale involontario;
- nessuna azione irraggiungibile;
- target touch adeguati;
- nessun contenuto coperto dalla bottom navigation;
- modali entro viewport;
- stessa logica permessi desktop/mobile;
- niente doppio mounting;
- desktop invariato.

---

## 14. Download Center

È stato creato un modulo Download separato dai Manuali.

File principali:

```text
app/api/downloads/route.ts
app/api/downloads/[id]/download/route.ts
lib/downloadLibrary.ts
components/atlas/DownloadCenter.tsx
supabase/migrations/20260619170000_create_download_library.sql
```

Migration eseguita con successo su Supabase.

Risorse create:

- tabella Download;
- bucket privato `atlas-downloads`.

Il modulo gestisce firmware, driver, software, configurazioni, file tecnici, versioni, metadata e download autorizzato.

Il bucket deve restare privato.

---

## 15. Copilot operativo

È stato implementato un Copilot operativo read-only.

File principali:

```text
app/api/copilot/query/route.ts
lib/server/copilot/catalog.ts
lib/server/copilot/llmAdapter.ts
components/atlas-executive/ExecutiveCopilotPanel.tsx
```

Funzioni supportate:

- ricerca cliente/sede;
- conteggio ticket;
- ticket aperti;
- urgenti;
- non assegnati;
- rischio SLA;
- carico tecnico;
- calendario tecnico;
- ultimo intervento;
- sedi senza intervento;
- statistiche operative.

Sicurezza:

- `requireAtlasUser`;
- filtro tenant;
- solo ruoli interni;
- nessun SQL libero;
- nessuna mutation;
- rate limit;
- timeout route.

Variabili opzionali:

```text
ATLAS_COPILOT_LLM_API_KEY
ATLAS_COPILOT_LLM_MODEL
ATLAS_COPILOT_LLM_ENDPOINT
```

Senza LLM esterno funziona in modalità deterministica/euristica.

Commit confermato:

```text
68f3ed8 — implement operational atlas copilot
```

Questo commit includeva anche Download e modifiche correlate.

---

## 16. Tema Classic ed Executive

ATLAS ha tema Classic e tema Executive / Design Lab.

Componenti Executive principali:

```text
ExecutiveShell
ExecutiveSidebar
ExecutiveHeader
ExecutiveDashboard
ExecutiveAnalytics
ExecutiveWebvime
ExecutiveMetricCard
ExecutiveGlassCard
ExecutiveCommandBar
ExecutiveCopilotPanel
ExecutiveRiskRadar
ExecutiveNetworkMap
ExecutiveSignalFeed
```

Problemi storici già affrontati:

- glow verticale anomalo;
- backdrop blur;
- dashboard duplicata;
- navigazione;
- apertura ticket;
- logo cliccabile;
- refresh errato;
- widget;
- DnD;
- sidebar;
- tab attivi.

Problemi UI recenti:

- pannello notifiche: corretto con portal nel `body`, sfondo opaco, nessun blur del background, posizione sotto la campanella e viewport-safe in Classic/Executive;
- avatar Executive: bug aperto, mostra iniziali hardcoded `GP` anche ad altri utenti; deve usare foto dell’utente autenticato o fallback neutro/inziali dinamiche.

Scelta stabile finale sul glow:

- niente BorderGlow dinamico sui widget principali;
- bordi hover semplici;
- background più solido;
- stabilità prima dell’effetto grafico.

---

## 17. Logo, Home e scroll

Il logo SECOM è cliccabile.

Comportamento:

- utente interno → Home;
- ruolo cliente → Portale Cliente se Home non è disponibile.

File coinvolti:

```text
AtlasSidebar.tsx
ExecutiveSidebar.tsx
```

Problema scroll risolto:

- cambiando modulo, la pagina manteneva la posizione precedente;
- la correzione è in `AtlasAppFrame.tsx`;
- il cambio di tab o vista mobile riporta la pagina in alto.

---

## 18. Footer istituzionale

Nella sidebar è stato aggiunto un footer professionale.

Contenuti:

```text
ATLAS
Operational Management Platform
Developed by SECOM S.r.l.
Versione · Ambiente
© SECOM S.r.l.
```

Pannelli:

- Supporto
- Privacy
- Informazioni

### Supporto

```text
SECOM S.r.l.
Via Monte Cervino, 5
00071 Pomezia (RM) – Italia
Tel. +39 06 9146000
assistenza@secomitalia.com
www.secomitalia.com
```

### Informazioni societarie

```text
Codice SDI: SUBM70N
```

### Privacy

- accesso riservato;
- trattamento dati per finalità operative, tecniche e amministrative;
- rispetto di ruoli e permessi;
- divieto di consultazione o diffusione non pertinente;
- rinvio alla documentazione privacy aziendale vigente.

---

## 19. Portale Clienti

Il Portale Clienti è attivo.

Funzioni:

- codici di registrazione;
- inviti;
- pending;
- attivazione;
- utenti cliente;
- separazione dati.

Problemi residui:

- entità non sempre visibili;
- ricerca globale;
- calendario;
- clienti cliccabili;
- funzioni admin da mobile;
- esperienza mobile da rifinire.

Il customer scope non deve mai essere indebolito.

---

## 20. Bolle di lavoro e PDF

ATLAS deve generare bolle/interventi PDF dinamici.

Requisiti:

- logo SECOM a sinistra;
- dati aziendali al centro;
- logo Kiwa a destra;
- loghi non tagliati;
- margini sicuri;
- documento A4 professionale;
- struttura dinamica;
- attività;
- materiali solo quando pertinenti;
- stato aperto/chiuso;
- manutenzione/straordinaria;
- firma e dati intervento.

La bolla non deve essere un’immagine statica.

---

## 21. Manuali, Magazzino e stock

Manuali/Operatività:

- titolo;
- descrizione;
- note;
- data;
- settore;
- allegati;
- apertura inline.

Il modulo Download resta separato dai Manuali.

Magazzino:

- articoli;
- stock;
- quantità;
- nuovo articolo.

È stata valutata una futura sincronizzazione con Excel/Google Drive, ma è in standby.

Non implementare sincronizzazioni automatiche senza decisione esplicita.

---

## 22. Problemi e rischi aperti

### Mobile

- Registro Ticket: smoke test e revisione diretta del file/diff ancora da completare;
- Webvime;
- To Do;
- modali grandi;
- Calendario;
- Mappa;
- Portale Cliente;
- dashboard Executive stretta;
- test tablet;
- smoke reale su dispositivi.

### Dati

- customer matching storico GLPI;
- ticket senza `customer_id`;
- alias clienti;
- pulizia clienti root;
- doppioni;
- clienti senza root.

### UX

- desktop professionale;
- mobile coerente;
- modali;
- tabelle;
- sticky;
- overflow;
- azioni raggiungibili;
- avatar utente Executive/Classic/mobile da rendere dinamico, senza `GP` hardcoded.

### White-label / provider ticket

- migration white-label da confermare/applicare sull’ambiente Supabase;
- smoke test tenant GLPI e tenant ATLAS-native;
- UI da rendere provider-aware;
- branding SECOM ancora hardcoded in sidebar, footer, PDF e alcuni componenti;
- verificare idempotenza del flusso ticket ATLAS → GLPI in caso di errore esterno.

### Architettura

- continuare decomposizione controllata di `page.tsx`;
- evitare nuovi mega-componenti;
- mantenere centralizzate navigazione, permessi e shell;
- non duplicare logica tra Classic, Executive e mobile.

---

## 23. Priorità operative attuali

1. consolidare e smoke-testare il blocco 3A di creazione ticket provider-aware;
2. verificare se la migration white-label è stata applicata e controllare il tenant SECOM come `glpi / true`;
3. testare creazione ticket su tenant GLPI e tenant ATLAS-native, inclusi errori GLPI e rischio duplicati;
4. rendere la UI provider-aware: nascondere import, sync, riferimenti e azioni GLPI ai tenant ATLAS-native;
5. correggere avatar utente `GP` hardcoded in Executive/Classic/mobile;
6. centralizzare branding neutro in login, sidebar, footer, header e PDF;
7. rendere Registro Ticket, TicketWorkspace, PDF, Copilot e dashboard pienamente provider-aware;
8. riprendere roadmap mobile: Webvime, To Do, modali, Calendario, Portale Cliente e Mappa;
9. test completo Classic/Executive e ruoli cliente;
10. pulizia dati clienti e affidabilità sync GLPI.

---

## 24. Definizione di “finito”

ATLAS non è finito solo perché compila.

È pronto quando:

- build stabile;
- auth stabile;
- tenant isolation verificata;
- ruoli corretti;
- nessun dato cliente esposto;
- desktop professionale;
- mobile realmente utilizzabile;
- nessuna azione critica nascosta;
- ticket operativi;
- clienti/sedi/asset coerenti;
- bolle affidabili;
- sync GLPI controllabile;
- log errori gestibile;
- deploy continuo;
- manuale operativo minimo;
- backup e recovery definiti;
- test sui ruoli principali.

---

## 25. Istruzioni per le future chat

Quando una nuova chat ATLAS viene aperta:

1. leggere questo documento;
2. chiedere soltanto i file necessari;
3. non ricostruire il contesto da zero;
4. non proporre redesign generici;
5. non toccare più moduli insieme senza motivo;
6. proteggere desktop, permessi e dati;
7. mantenere il mobile sotto `lg` e il desktop da `lg`;
8. restituire file completi quando vengono caricati;
9. indicare sempre build e deploy;
10. dichiarare chiaramente ciò che è confermato e ciò che è ancora da verificare.

---

## 26. Stato immediato da cui ripartire

La foundation white-label, i guard server-side GLPI e la creazione ticket provider-aware sono stati implementati da Codex con build, TypeScript e `git diff --check` dichiarati verdi.

Stato attuale del blocco 3A:

- nuova route `app/api/tickets/create/route.ts`;
- `app/page.tsx` usa la route provider-aware per Apri Chiamata e creazione da Calendario;
- tenant GLPI mantiene il flusso esistente;
- tenant ATLAS-native crea ticket senza GLPI;
- il diff di `app/page.tsx` contiene anche modifiche precedenti, quindi il commit va consolidato con attenzione;
- nessun deploy va autorizzato prima di smoke test su entrambi i provider.

Prossimo intervento consigliato:

1. audit breve del diff corrente e conferma migration;
2. smoke test del flusso ticket GLPI;
3. smoke test con tenant `atlas / false`;
4. blocco 3B UI provider-aware;
5. fix avatar `GP` hardcoded.

Questo documento va aggiornato dopo ogni blocco strutturale importante.
