# ATLAS — Modulo Piani Operativi V1

## Obiettivo

Creare una sezione generica **Centrale Operativa > Piani** per gestire accordi contrattuali e operativi annuali senza hardcodare Carabinieri, RFI, Polizia Locale o altri clienti nel codice.

Il modulo deve sostituire progressivamente Excel tipo:

- ordinarie Carabinieri divise per semestre;
- straordinarie Carabinieri a totale annuo;
- Aule SEPA RFI da completare entro l’anno;
- Polizia di Stato con numero limitato di interventi annui;
- Polizia Locale con scadenze e assistenze variabili.

---

## Posizionamento UI

Menu consigliato:

```text
Centrale Operativa
└── Piani
```

Non creare una voce “Carabinieri”: sarebbe rigida e sbagliata. Il modulo deve creare piani configurabili.

---

## Tipi di piano

### 1. Piano a contatore

Serve quando conta solo il numero totale di interventi.

Esempi:

- Straordinarie Carabinieri 2026: 150 annue.
- Polizia di Stato 2026: 10 annue.

Campi principali:

- totale previsto;
- servizio collegato: ordinaria / straordinaria / SEPA / custom;
- periodo: annuale;
- modalità scalaggio.

---

### 2. Piano a sedi obbligatorie

Serve quando esiste una lista precisa di sedi da coprire.

Esempi:

- Ordinarie Carabinieri 2026.
- Polizia Locale con elenco sedi.
- Aule SEPA RFI se gestite per aula/sede.

Ogni riga/sede ha stato proprio:

- da fare;
- pianificata;
- aperta;
- effettuata;
- saltata;
- fuori ambito.

---

### 3. Piano misto

Serve quando c’è sia un totale annuo sia un elenco sedi o scadenze.

Esempi:

- Polizia Locale con semestre, scadenza variabile e tipo assistenza variabile.
- Contratti con attività minime e interventi extra.

---

## Regola più importante

Non salvare un semplice campo `residuo = residuo - 1`.

Il contatore deve essere calcolato da righe/eventi:

```text
ticket collegato
bolla/work order collegato
data pianificata
data chiusura
stato consumo
```

Così, se un ticket viene annullato, non si rompe il piano: si annulla la riga consumo.

---

## Stati consigliati

### Stato piano

```text
draft
active
paused
archived
```

### Stato item/sede

```text
todo
planned
open
completed
skipped
out_of_scope
```

### Stato consumo

```text
planned
open
completed
cancelled
manual
```

---

## Modalità di scalaggio

Ogni piano deve poter scegliere quando scalare:

```text
ticket_created
ticket_planned
ticket_closed
work_order_closed
manual_date
manual
```

Default consigliato per ATLAS:

```text
Apertura/Pianificazione = impegnato
Chiusura bolla = effettuato
```

Quindi in UI mostrare sempre almeno due numeri:

- **impegnati**: planned + open;
- **effettuati**: completed.

---

## Esempi di configurazione

### Ordinarie Carabinieri 2026

```text
Titolo: Ordinarie Carabinieri 2026
Cliente: Carabinieri
Tipo piano: site_list
Servizio: ordinaria
Regola tempo: semester_50_50
Totale previsto: numero sedi
Primo semestre: metà sedi
Secondo semestre: metà sedi
Scala: work_order_closed
```

### Straordinarie Carabinieri 2026

```text
Titolo: Straordinarie Carabinieri 2026
Cliente: Carabinieri
Tipo piano: counter
Servizio: straordinaria
Regola tempo: annual
Totale previsto: 150
Scala: ticket_closed o work_order_closed
```

### Aule SEPA RFI 2026

```text
Titolo: Aule SEPA RFI 2026
Cliente: RFI
Tipo piano: site_list o mixed
Servizio: sepa/custom
Regola tempo: single_deadline
Scadenza: 31/12/2026
Scala: manual_date o work_order_closed
```

### Polizia di Stato 2026

```text
Titolo: Polizia di Stato 2026
Cliente: Polizia di Stato
Tipo piano: counter
Servizio: custom
Totale previsto: 10
Regola tempo: annual
Scala: work_order_closed
```

### Polizia Locale 2026

```text
Titolo: Polizia Locale 2026
Cliente: Polizia Locale
Tipo piano: mixed
Servizio: custom
Regola tempo: semester_custom o multiple_deadlines
Scadenze: variabili
Scala: manual_date o work_order_closed
```

---

## Schermata lista piani

Colonne:

```text
Titolo
Cliente / Entità
Anno
Tipo
Regola tempo
Target
Impegnati
Effettuati
Residui
Stato
Azioni
```

Azioni:

```text
Apri piano
Modifica
Archivia
Duplica per nuovo anno
```

---

## Schermata dettaglio piano

Header KPI:

```text
Totale previsto
Impegnati
Effettuati
Residui
Scaduti
Non agganciati
```

Per semestrali:

```text
1° semestre: target / impegnati / effettuati / residui
2° semestre: target / impegnati / effettuati / residui
```

Filtri:

```text
Regione
Cliente
Sede
Semestre
Stato
Tipo servizio
Data da/a
Solo da fare
Solo pianificate
Solo effettuate
Solo non agganciate
```

Ordinamenti:

```text
Alfabetico
Regione
Scadenza
Effettuazione
Criticità
```

---

## Integrazione con Apri Chiamata

Quando viene aperta una chiamata, ATLAS deve cercare piani compatibili:

```text
cliente / contratto / entità
tipo chiamata: ordinaria/straordinaria/custom
anno corrente
sede, se il piano è a sedi
```

Se trova un piano compatibile, mostra box:

```text
Piano collegato: Ordinarie Carabinieri 2026
Stato sede: Da fare
Semestre: 1° semestre
```

Se non trova piano:

```text
Nessun piano collegato
```

Se trova più piani:

```text
Seleziona piano da scalare
```

---

## Integrazione con Registro Ticket

Badge consigliati:

```text
Piano: Ordinarie CC 2026
Scala piano: sì
Bolla richiesta
```

Warning:

```text
Ticket ordinario non agganciato a nessun piano
```

---

## Integrazione con Bolla / Work Orders

Quando una bolla viene chiusa:

1. Se ticket collegato a un piano, creare/aggiornare consumption a `completed`.
2. Se piano a sedi, aggiornare item a `completed`.
3. Salvare `work_order_id` e `completed_date`.

Questo è il momento più affidabile per considerare un intervento realmente effettuato.

---

## Roadmap incrementale

### V1 — Base solida

- Tabelle DB.
- Menu `Centrale Operativa > Piani`.
- Lista piani.
- Crea piano.
- Dettaglio piano read-only/edit leggero.
- Aggiunta manuale righe/sedi.
- Filtri base.

### V2 — Collegamento manuale ticket

- Da dettaglio ticket: collega a piano.
- Da piano: associa ticket esistente.
- Consumo manuale.

### V3 — Aggancio automatico da Apri Chiamata

- Se cliente + tipo chiamata + sede combaciano, suggerire piano.
- Per piani a contatore, creare consumo su ticket.
- Per piani a sedi, agganciare item.

### V4 — Chiusura bolla aggiorna piano

- Work order chiuso => consumo completed.
- Item sede completed.

### V5 — Suggerimenti geografici

- In calendario/centrale: mostra residui per regione.
- Esempio: “Campania: 8 ordinarie CC residue”.

---

## Rischi

1. **Hardcoding cliente**: vietato. Tutto deve essere configurabile.
2. **Contatore fragile**: non usare decrementi diretti; usare consumptions.
3. **Anagrafiche sporche**: molte sedi possono non avere `site_id`; tenere sempre `site_name` testuale.
4. **Doppio conteggio**: vincolo unico `plan_id + ticket_id` nella tabella consumptions.
5. **Sovrapposizione con Work Orders**: il piano non sostituisce la bolla; la bolla certifica l’effettuazione.
6. **Sovrapposizione annuale**: prevedere duplicazione piano per nuovo anno.

---

## Decisione prodotto

La feature deve chiamarsi genericamente:

```text
Piani
```

Non:

```text
Ordinarie Carabinieri
```

Perché deve gestire clienti e accordi diversi, variabili di anno in anno.
