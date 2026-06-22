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

ATLAS è una web app CRM operativa interna sviluppata per SECOM S.r.l.

L’obiettivo è sostituire progressivamente strumenti frammentati e ridurre la dipendenza operativa da GLPI, mantenendo comunque l’integrazione con GLPI dove necessaria.

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
- avatar;
- tab attivi.

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
- azioni raggiungibili.

### Architettura

- continuare decomposizione controllata di `page.tsx`;
- evitare nuovi mega-componenti;
- mantenere centralizzate navigazione, permessi e shell;
- non duplicare logica tra Classic, Executive e mobile.

---

## 23. Priorità operative attuali

1. revisionare il diff reale della foundation white-label / GLPI opzionale;
2. copiare `ATLAS_MASTER_CONTEXT.md` nella root del repository per renderlo leggibile da Codex;
3. commit separato della foundation solo dopo revisione del diff;
4. applicare e verificare la migration white-label prima di usare i nuovi campi in produzione;
5. blocco 2: applicare il flag GLPI alle route server e ai flussi operativi, preservando SECOM;
6. blocco 3: centralizzare branding in login, sidebar, footer e PDF;
7. continuare la roadmap mobile con Webvime;
8. To Do mobile;
9. modali viewport-safe;
10. Calendario;
11. Portale Cliente;
12. Mappa;
13. test completo Classic/Executive;
14. verifica ruoli cliente;
15. pulizia dati clienti e affidabilità sync GLPI per il tenant SECOM.

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

Il Registro Ticket mobile è stato corretto, ha superato build, TypeScript e `git diff --check`, ed è stato autorizzato per commit/deploy dopo smoke test. Il login è stato restilizzato in stile Executive mantenendo la struttura originaria e aggiungendo `DarkVeil` solo su desktop tramite la dipendenza `ogl`.

È stato inoltre completato da Codex un primo blocco di foundation white-label / GLPI opzionale. Codex dichiara build, TypeScript e `git diff --check` verdi, ma il diff reale non è ancora stato revisionato direttamente in ChatGPT.

Prossimo passo operativo:

- rendere `ATLAS_MASTER_CONTEXT.md` disponibile nella root del repository;
- revisionare i file e la migration della foundation white-label;
- autorizzare il commit della foundation solo dopo controllo del diff;
- applicare la migration separatamente e in modo controllato;
- procedere con il blocco 2 per proteggere route e flussi GLPI per tenant;
- mantenere SECOM con GLPI attivo di default fino alla migrazione completa.

Questo documento va aggiornato dopo ogni blocco strutturale importante.

---

## 27. Foundation white-label e GLPI opzionale

Obiettivo approvato:

- rendere ATLAS neutro e riutilizzabile per aziende diverse da SECOM;
- mantenere SECOM come tenant esistente con GLPI attivo;
- consentire ai nuovi tenant di partire con ticket nativi ATLAS e senza GLPI;
- centralizzare branding e configurazione aziendale per tenant;
- isolare progressivamente GLPI dietro feature flag e provider ticket.

### Audit Codex dichiarato

Hardcode SECOM principali individuati in:

```text
components/atlas/layout/AtlasSidebar.tsx
components/atlas/layout/AtlasSidebarLogo.tsx
components/atlas-executive/ExecutiveHeader.tsx
components/atlas/layout/atlasLogoImage.ts
app/api/work-orders/pdf-by-ticket/[ticketId]/route.ts
public/secom-logo.png.png
components/atlas/ContractsBoard.tsx
components/atlas/ContractProfilePanel.tsx
lib/atlasSlaContracts.ts
lib/atlasConstants.ts
lib/systemsCatalog.ts
```

Dipendenze GLPI principali individuate in:

```text
app/api/glpi/create-ticket
app/api/admin/glpi-delete-ticket
app/api/admin/glpi-sync-db
app/api/admin/glpi-auto-sync
app/api/admin/glpi-sync-entities
app/api/admin/glpi-import/batch
app/api/admin/glpi-add-followup
services/glpi.ts
services/glpiSyncEngine.ts
services/glpiHistoricalImport.ts
services/glpiEntitySyncEngine.ts
app/page.tsx
TicketRegistry
TicketWorkspace
CustomerCommandCenter
WebvimeBoard
OperationalPlansCenter
PDF bolle
Copilot catalog
```

Campi GLPI diffusi:

```text
glpi_ticket_id
glpi_entity_id
glpi_entity_path
glpi_raw
glpi_status
```

### File Codex dichiarati creati

```text
lib/tenantConfig.ts
lib/server/tenantConfig.ts
supabase/migrations/20260622143000_add_tenant_white_label_config.sql
```

File dichiarato modificato:

```text
lib/tenant.ts
```

### Configurazione prevista

La foundation tipizzata deve coprire almeno:

```text
productName
companyName
logoUrl
faviconUrl
supportEmail
supportPhone
website
address
legalInformation
privacyText / privacyUrl
primaryColor
accentColor
themePreset
ticketProvider: atlas | glpi
glpiEnabled
```

Default retrocompatibile dichiarato:

```text
ticket_provider = glpi
glpi_enabled = true
```

Il comportamento di fallback deve mantenere GLPI attivo per SECOM e branding neutro ATLAS quando la configurazione non è presente.

### Stato di verifica

Dichiarato da Codex:

```cmd
npm.cmd run build
npx.cmd tsc --noEmit
git diff --check
```

Esito dichiarato: verde.

Ancora da verificare direttamente:

- diff reale dei quattro file;
- schema e compatibilità della migration;
- assenza di bypass tenant nella lettura server della configurazione;
- semantica dei default per tenant esistenti e nuovi tenant;
- gestione di tenant senza riga di configurazione;
- assenza di regressioni su SECOM;
- strategia di applicazione della migration.

### Regola per i prossimi blocchi

Non eliminare GLPI. Isolarlo progressivamente dietro provider e feature flag. Le route GLPI devono essere protette server-side per tenant e non soltanto nascoste nella UI.
