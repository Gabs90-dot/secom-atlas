@echo off
cd /d C:\Users\gpedroli\secom-atlas

if not defined ATLAS_CRON_SECRET (
  echo ERRORE: variabile ambiente ATLAS_CRON_SECRET mancante.
  exit /b 1
)

curl -X POST "http://localhost:3000/api/admin/glpi-auto-sync?limit=25&offset=0" -H "x-atlas-cron-secret: %ATLAS_CRON_SECRET%"

exit /b %ERRORLEVEL%
