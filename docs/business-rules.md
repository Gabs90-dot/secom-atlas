# Business Rules

## Ticket

- un ticket può avere un solo cliente
- un ticket può avere una sola sede
- un ticket può avere una sola bolla attiva

## Bolle

- una bolla aperta non ha numero rapporto
- una bolla chiusa genera numero rapporto
- le note interne non vengono stampate

## Contratti

- un cliente può avere più contratti
- una sede può ereditare il contratto del cliente root

## Tecnici

- un tecnico può chiudere solo ticket assegnati
- un tecnico non può cancellare ticket

## Portale Cliente

- cliente_user vede solo la propria sede
- cliente_admin vede tutte le sedi del cliente