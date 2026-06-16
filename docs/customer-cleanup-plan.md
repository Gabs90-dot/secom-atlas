# \# customer-cleanup-plan.md

# 

# \# Customer Cleanup Plan

# 

# \## Problema

# 

# La base clienti importata da GLPI può contenere:

# 

# \* clienti duplicati

# \* entità figlie non agganciate correttamente

# \* root mancanti

# \* nomi sporchi

# \* alias incompleti

# \* ticket senza customer\_id

# \* risultati di ricerca imprecisi

# 

# Questo rende il CRM meno affidabile.

# 

# \## Obiettivo

# 

# ATLAS deve distinguere chiaramente:

# 

# \* Cliente root

# \* Entità/sede

# \* Alias di ricerca

# \* Ticket collegati

# \* Contratti collegati

# 

# Esempio corretto:

# 

# Root:

# CARABINIERI

# 

# Entità:

# COMANDO PROVINCIALE ROMA

# 

# Sede:

# COMPAGNIA CARABINIERI ROMA TRASTEVERE

# 

# \## Regole

# 

# La ricerca "provinciale roma" deve trovare Roma, non Bologna, Imola o risultati casuali.

# 

# La ricerca deve dare priorità a:

# 

# 1\. match esatto

# 2\. città

# 3\. provincia

# 4\. entità padre

# 5\. alias certificati

# 6\. storico ticket

# 

# \## Tabelle coinvolte

# 

# \* customers

# \* customer\_entities

# \* customer\_aliases

# \* tickets

# \* customer\_contract\_links

# \* contract\_profiles

# 

# \## Strategia

# 

# 1\. Analizzare clienti senza customer\_id.

# 2\. Creare alias manuali per i casi più frequenti.

# 3\. Collegare ticket orfani.

# 4\. Unificare doppioni.

# 5\. Separare root da sedi operative.

# 6\. Migliorare la ricerca globale.

# 7\. Aggiungere UI per gestire customer\_aliases.

# 

# \## Casi critici

# 

# \* Carabinieri

# \* Polizia

# \* Guardia di Finanza

# \* Questure

# \* Comandi Provinciali

# \* Compagnie

# \* Stazioni

# \* Reparti speciali

# 

# \## Obiettivo tecnico

# 

# Ridurre progressivamente:

# 

# ```sql

# select count(\*) from tickets where source='glpi' and customer\_id is null;

# ```

# 

# Aumentare:

# 

# ```sql

# select count(\*) from tickets where source='glpi' and customer\_id is not null;

# ```

# 

