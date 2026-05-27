Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "C:\Users\gpedroli\secom-atlas\glpi-sync.bat" & Chr(34), 0
Set WshShell = Nothing