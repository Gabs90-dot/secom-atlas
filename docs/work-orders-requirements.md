# Work Orders / Rapporti Intervento

## Obiettivo

ATLAS deve gestire rapporti di intervento (bolle) collegati ai ticket.

Ogni ticket può avere una sola bolla attiva.

## Bolla aperta

* generata automaticamente all'apertura ticket
* stato: draft
* mostra "Intervento non chiuso"
* contiene dati cliente
* contiene sede
* contiene tecnico
* contiene codice impianto
* contiene oggetto intervento
* contiene checklist precompilata

## Note interne

* non visibili al cliente
* utilizzate dal personale Secom
* non stampate nel PDF

## Attività

* visibili al cliente
* stampate nel PDF
* possono essere multiple

## Materiali

* elenco materiali forniti o sostituiti
* quantità
* descrizione

## Chiusura ticket

Alla chiusura:

* la bolla viene congelata
* viene generato il PDF definitivo
* viene assegnato numero rapporto
* il PDF resta storicizzato

## Template iniziali

1. Manutenzione straordinaria
2. Materiale fornito/sostituito
3. Installazione
4. Riparazione
5. Generico
