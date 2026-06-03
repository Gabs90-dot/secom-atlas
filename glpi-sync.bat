@echo off
cd /d C:\Users\gpedroli\secom-atlas

curl -X POST "http://localhost:3000/api/admin/glpi-auto-sync?limit=500&offset=0"

exit
