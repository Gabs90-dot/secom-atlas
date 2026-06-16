# Sync GLPI Architecture

# Stato attuale

# 

# ATLAS sincronizza dati da GLPI tramite route API e servizi dedicati.

# 

# Sono presenti:

# 

# glpi-sync-db

# glpi-sync-entities

# glpi-import/batch

# glpi-auto-sync

# script glpi-sync.bat

# wrapper glpi-sync-hidden.vbs

# Problema

# 

# La sync non deve dipendere da avvio manuale su PC locale.

# 

# Un CRM enterprise deve sincronizzarsi lato server.

# 

# Obiettivo

# 

# Creare una sync affidabile, monitorabile e sicura.

# 

# Requisiti

# sync automatica server-side

# log visibile in ATLAS

# ultimo sync riuscito

# ultimo sync fallito

# messaggio errore

# batch controllati

# retry

# timeout gestiti

# protezione con auth/secret

# niente fallback tenantId non controllati nel lungo periodo

# Stato futuro

# 

# ATLAS deve avere un pannello "Sync GLPI" con:

# 

# stato sync

# bottone forza sync

# storico run

# numero ticket importati

# numero errori

# durata

# ultimo offset

# log sintetico

