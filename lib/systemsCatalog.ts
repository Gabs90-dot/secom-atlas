export type SystemComponent = {
  id: string;
  name: string;
  code: string;
  category: string;
  parent: string;
  quantity: string;
  cost: number;
  imageSearchUrl: string;
};

export type SystemCatalog = {
  name: string;
  productName: string;
  totalCost: number;
  components: SystemComponent[];
};

export const systemsCatalog: SystemCatalog[] = [
  {
    "name": "SPIS",
    "productName": "SPIS",
    "totalCost": 17900.3,
    "components": [
      {
        "id": "SPIS-0001",
        "name": "Componenti Spis (Testa, Sedia)",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 2924.84,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Componenti+Spis+%28Testa%2C+Sedia%29"
      },
      {
        "id": "SPIS-0002",
        "name": "KIT TESTA SPIS",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 1245.99,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+TESTA+SPIS"
      },
      {
        "id": "SPIS-0003",
        "name": "Cavo; USB 2.0; USB A spina,USB B spina; nichelato; 0,5m; nero - AK-300105-005-S",
        "code": "AK-300105-005-S",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 1.29,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=AK-300105-005-S+Cavo%3B+USB+2.0%3B+USB+A+spina%2CUSB+B+spina%3B+nichelato%3B+0%2C5m%3B+nero"
      },
      {
        "id": "SPIS-0004",
        "name": "Cavo USB Full Body - 7050402CAB0009",
        "code": "7050402CAB0009",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 6.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0009+Cavo+USB+Full+Body"
      },
      {
        "id": "SPIS-0005",
        "name": "Connettore; DUALSLIM; Cat: 6; Posizione: 8p8c; angolari; 29mm - CP30752",
        "code": "CP30752",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 7.54,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=CP30752+Connettore%3B+DUALSLIM%3B+Cat%3A+6%3B+Posizione%3A+8p8c%3B+angolari%3B+29mm"
      },
      {
        "id": "SPIS-0006",
        "name": "Connettore; USB A presa,USB B presa; DUALSLIM; USB 2.0; dorato - CP30709NMB",
        "code": "CP30709NMB",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 8.51,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=CP30709NMB+Connettore%3B+USB+A+presa%2CUSB+B+presa%3B+DUALSLIM%3B+USB+2.0%3B+dorato"
      },
      {
        "id": "SPIS-0007",
        "name": "Dado; a farfalla; M5; 0,8; acciaio 5; Copertura: zinco; BN 213 - B5/BN213 - 1099582",
        "code": "1099582",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "12,00",
        "cost": 0.96,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1099582+Dado%3B+a+farfalla%3B+M5%3B+0%2C8%3B+acciaio+5%3B+Copertura%3A+zinco%3B+BN+213"
      },
      {
        "id": "SPIS-0008",
        "name": "Dado; esagonale; M3; 0,5; acciaio; Copertura: annerite; H: 2,4mm - B3/BN116 - 1089315",
        "code": "1089315",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1089315+Dado%3B+esagonale%3B+M3%3B+0%2C5%3B+acciaio%3B+Copertura%3A+annerite%3B+H%3A+2%2C4mm"
      },
      {
        "id": "SPIS-0009",
        "name": "Canotto distanziale; cilindrico; poliamide; Lungh: 5mm; Øest: 5mm - DR385/2.7X5",
        "code": "DR385/2.7X5",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.18,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=DR385%2F2.7X5+Canotto+distanziale%3B+cilindrico%3B+poliamide%3B+Lungh%3A+5mm%3B+%C3%98est%3A+5mm"
      },
      {
        "id": "SPIS-0010",
        "name": "Distanziali filettati; esagonale; poliamide; M2,5; M2,5 - FIX-TP2.5-15",
        "code": "FIX-TP2.5-15",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.18,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=FIX-TP2.5-15+Distanziali+filettati%3B+esagonale%3B+poliamide%3B+M2%2C5%3B+M2%2C5"
      },
      {
        "id": "SPIS-0011",
        "name": "Molle interne specchi Spis - 12010",
        "code": "12010",
        "category": "Altro",
        "parent": "",
        "quantity": "8,00",
        "cost": 45.84,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=12010+Molle+interne+specchi+Spis"
      },
      {
        "id": "SPIS-0012",
        "name": "Molle laterali specchi Spis - 11980",
        "code": "11980",
        "category": "Altro",
        "parent": "",
        "quantity": "4,00",
        "cost": 22.92,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=11980+Molle+laterali+specchi+Spis"
      },
      {
        "id": "SPIS-0013",
        "name": "Patch cord; U/UTP; 6a; OFC; PVC; nero; 1m; Copertura: dorato; Poli: : 8 - IBIBF",
        "code": "IBIBF",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 1.59,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=IBIBF+Patch+cord%3B+U%2FUTP%3B+6a%3B+OFC%3B+PVC%3B+nero%3B+1m%3B+Copertura%3A+dorato%3B+Poli%3A+%3A+8"
      },
      {
        "id": "SPIS-0014",
        "name": "Pellicola Adesiva Velluto nero PVC plastica vinile impermeabile - d-c-fix - 45 cm x 5m",
        "code": "45 cm x 5m",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 34.47,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=45+cm+x+5m+Pellicola+Adesiva+Velluto+nero+PVC+plastica+vinile+impermeabile"
      },
      {
        "id": "SPIS-0015",
        "name": "Rondella; rotonda; M5; D=12mm; h=1mm; acciaio INOX A4; - B5/BN84541 - 8030758",
        "code": "8030758",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "12,00",
        "cost": 0.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=8030758+Rondella%3B+rotonda%3B+M5%3B+D%3D12mm%3B+h%3D1mm%3B+acciaio+INOX+A4%3B"
      },
      {
        "id": "SPIS-0016",
        "name": "Specchio Spis 24 x 17,5 x 4 mm - 241754",
        "code": "241754",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "2,00",
        "cost": 9.4,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=241754+Specchio+Spis+24+x+17%2C5+x+4+mm"
      },
      {
        "id": "SPIS-0017",
        "name": "Vite; M5x50; 0,8; Testa: sferica; Phillips,a taglio; 1mm,PH2; zinco - B5X50/BN1435 - 1220217",
        "code": "1220217",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.52,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1220217+Vite%3B+M5x50%3B+0%2C8%3B+Testa%3A+sferica%3B+Phillips%2Ca+taglio%3B+1mm%2CPH2%3B+zinco"
      },
      {
        "id": "SPIS-0018",
        "name": "Vite; M6x25; 1; Testa: cilindrica; brugola; HEX 5mm; acciaio; zinco - B6X25/BN3 - 1004352",
        "code": "1004352",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.14,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1004352+Vite%3B+M6x25%3B+1%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+5mm%3B+acciaio%3B+zinco"
      },
      {
        "id": "SPIS-0019",
        "name": "Vetri Spis Float Trasparente 4 mm 33,6 x 28,5 - 3362854",
        "code": "3362854",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "2,00",
        "cost": 7.8,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=3362854+Vetri+Spis+Float+Trasparente+4+mm+33%2C6+x+28%2C5"
      },
      {
        "id": "SPIS-0020",
        "name": "Vite; con la flangia; M3x12; 0,5; Testa: sferica; brugola; HEX 2mm - B3X12/BN11252 - 2041995",
        "code": "2041995",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.16,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2041995+Vite%3B+con+la+flangia%3B+M3x12%3B+0%2C5%3B+Testa%3A+sferica%3B+brugola%3B+HEX+2mm"
      },
      {
        "id": "SPIS-0021",
        "name": "Cerniera per Ante senza Foro Incasso - B09HMN7P49",
        "code": "B09HMN7P49",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 26.54,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=B09HMN7P49+Cerniera+per+Ante+senza+Foro+Incasso"
      },
      {
        "id": "SPIS-0022",
        "name": "Rondella; dentata internamente,dentata esternamente; M3; BN 783 - B3/BN783 - 1278363",
        "code": "1278363",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "10,00",
        "cost": 0.3,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1278363+Rondella%3B+dentata+internamente%2Cdentata+esternamente%3B+M3%3B+BN+783"
      },
      {
        "id": "SPIS-0023",
        "name": "Raspberry Pi 5 4GB RAM - RP5-4GB",
        "code": "RP5-4GB",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 96.43,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=RP5-4GB+Raspberry+Pi+5+4GB+RAM"
      },
      {
        "id": "SPIS-0024",
        "name": "Raspberry Pi 5 RTC Battery - RP5-RTC",
        "code": "RP5-RTC",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.05,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=RP5-RTC+Raspberry+Pi+5+RTC+Battery"
      },
      {
        "id": "SPIS-0025",
        "name": "Raspberry Pi 5 Active Cooler - RP5-ACT-COOL",
        "code": "RP5-ACT-COOL",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.05,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=RP5-ACT-COOL+Raspberry+Pi+5+Active+Cooler"
      },
      {
        "id": "SPIS-0026",
        "name": "Micro Sd 64 GB Kingston",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 27.48,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Micro+Sd+64+GB+Kingston"
      },
      {
        "id": "SPIS-0027",
        "name": "SSCB - configurazione SPIS",
        "code": "configurazione SPIS",
        "category": "Software / configurazione",
        "parent": "",
        "quantity": "1,00",
        "cost": 88.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=configurazione+SPIS+SSCB"
      },
      {
        "id": "SPIS-0028",
        "name": "Dado; esagonale; M3; 0,5; acciaio; Copertura: zinco; H: 2,4mm; 5,5mm - B3/BN117 - 1874659",
        "code": "1874659",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "40,00",
        "cost": 4.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1874659+Dado%3B+esagonale%3B+M3%3B+0%2C5%3B+acciaio%3B+Copertura%3A+zinco%3B+H%3A+2%2C4mm%3B+5%2C5mm"
      },
      {
        "id": "SPIS-0029",
        "name": "Cavo lettera M - 7050402CAB0008",
        "code": "7050402CAB0008",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0008+Cavo+lettera+M"
      },
      {
        "id": "SPIS-0030",
        "name": "Cavo lettera H 3 uscite - 7050402CAB003A",
        "code": "7050402CAB003A",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 5.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB003A+Cavo+lettera+H+3+uscite"
      },
      {
        "id": "SPIS-0031",
        "name": "Cavo lettera L 3 uscite - 7050402CAB0003",
        "code": "7050402CAB0003",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 5.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0003+Cavo+lettera+L+3+uscite"
      },
      {
        "id": "SPIS-0032",
        "name": "Cavo lettera I - 7050402CAB006A",
        "code": "7050402CAB006A",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 5.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB006A+Cavo+lettera+I"
      },
      {
        "id": "SPIS-0033",
        "name": "Cavo lettera P (Alimentazione lampade gemme) 7050402CAB0002",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+lettera+P+%28Alimentazione+lampade+gemme%29+7050402CAB0002"
      },
      {
        "id": "SPIS-0034",
        "name": "Gemma 24 Volt - 4/8240",
        "code": "4/8240",
        "category": "Elettronica",
        "parent": "",
        "quantity": "2,00",
        "cost": 3.7,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=4%2F8240+Gemma+24+Volt"
      },
      {
        "id": "SPIS-0035",
        "name": "Cavo; USB 2.0; USB A spina,USB C spina; nichelato; 0,25m; PVC - COKBC",
        "code": "COKBC",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "2,00",
        "cost": 3.26,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=COKBC+Cavo%3B+USB+2.0%3B+USB+A+spina%2CUSB+C+spina%3B+nichelato%3B+0%2C25m%3B+PVC"
      },
      {
        "id": "SPIS-0036",
        "name": "Pannello Led Illuminatore Spis\\IdSysBox - H570",
        "code": "H570",
        "category": "Elettronica",
        "parent": "",
        "quantity": "4,00",
        "cost": 42.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=H570+Pannello+Led+Illuminatore+Spis%5CIdSysBox"
      },
      {
        "id": "SPIS-0037",
        "name": "Carpenteria Testa Spis (PENSILE PORTA FARI) - SCM-A000383",
        "code": "SCM-A000383",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 420.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=SCM-A000383+Carpenteria+Testa+Spis+%28PENSILE+PORTA+FARI%29"
      },
      {
        "id": "SPIS-0038",
        "name": "Vite; con la flangia; M4x16; 0,7; Testa: sferica; brugola; acciaio - B4X16/BN11252 - 2042061",
        "code": "2042061",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "42,00",
        "cost": 2.1,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042061+Vite%3B+con+la+flangia%3B+M4x16%3B+0%2C7%3B+Testa%3A+sferica%3B+brugola%3B+acciaio"
      },
      {
        "id": "SPIS-0039",
        "name": "Vite; M5x20; 0,8; Testa: cilindrica; brugola; HEX 4mm; acciaio - B5X20/BN272 - 1000411",
        "code": "1000411",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.16,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1000411+Vite%3B+M5x20%3B+0%2C8%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+4mm%3B+acciaio"
      },
      {
        "id": "SPIS-0040",
        "name": "Striscia led sottomento",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.8,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Striscia+led+sottomento"
      },
      {
        "id": "SPIS-0041",
        "name": "Profilo Piatto in Alluminio SLIM per Strisce LED - Anodizzato Nero",
        "code": "Anodizzato Nero",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 6.3,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Anodizzato+Nero+Profilo+Piatto+in+Alluminio+SLIM+per+Strisce+LED"
      },
      {
        "id": "SPIS-0042",
        "name": "Striscia led 16 punti (Striscia led sottomento) - 7050402CAB0006",
        "code": "7050402CAB0006",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0006+Striscia+led+16+punti+%28Striscia+led+sottomento%29"
      },
      {
        "id": "SPIS-0043",
        "name": "Vite; con la flangia; M4x12; 0,7; Testa: sferica; brugola; acciaio - B4X12/BN11252 - 2042053",
        "code": "2042053",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042053+Vite%3B+con+la+flangia%3B+M4x12%3B+0%2C7%3B+Testa%3A+sferica%3B+brugola%3B+acciaio"
      },
      {
        "id": "SPIS-0044",
        "name": "KIT CABLAGGIO SPIS",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 197.8,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+CABLAGGIO+SPIS"
      },
      {
        "id": "SPIS-0045",
        "name": "Cavo ABCD - 7050402CAB0001",
        "code": "7050402CAB0001",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 75.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0001+Cavo+ABCD"
      },
      {
        "id": "SPIS-0046",
        "name": "Cavo lettera P (Alimentazione lampade gemme) 7050402CAB0002",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+lettera+P+%28Alimentazione+lampade+gemme%29+7050402CAB0002"
      },
      {
        "id": "SPIS-0047",
        "name": "Cavo lettera L 3 uscite - 7050402CAB0003",
        "code": "7050402CAB0003",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 5.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0003+Cavo+lettera+L+3+uscite"
      },
      {
        "id": "SPIS-0048",
        "name": "Cavo lettera H 3 uscite - 7050402CAB003A",
        "code": "7050402CAB003A",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 5.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB003A+Cavo+lettera+H+3+uscite"
      },
      {
        "id": "SPIS-0049",
        "name": "Cavo prolunga potenziometro ONBC (Cavo Linak in CL) - 7050402CAB0004",
        "code": "7050402CAB0004",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 10.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0004+Cavo+prolunga+potenziometro+ONBC+%28Cavo+Linak+in+CL%29"
      },
      {
        "id": "SPIS-0050",
        "name": "Striscia led 7 punti (Striscia led sedia) - 7050402CAB0005",
        "code": "7050402CAB0005",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 7.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0005+Striscia+led+7+punti+%28Striscia+led+sedia%29"
      },
      {
        "id": "SPIS-0051",
        "name": "Cablaggio striscia led 7 punti - 7050402CAB005A",
        "code": "7050402CAB005A",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB005A+Cablaggio+striscia+led+7+punti"
      },
      {
        "id": "SPIS-0052",
        "name": "Striscia led 16 punti (Striscia led sottomento) - 7050402CAB0006",
        "code": "7050402CAB0006",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0006+Striscia+led+16+punti+%28Striscia+led+sottomento%29"
      },
      {
        "id": "SPIS-0053",
        "name": "Cavo lettera I - 7050402CAB006A",
        "code": "7050402CAB006A",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 5.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB006A+Cavo+lettera+I"
      },
      {
        "id": "SPIS-0054",
        "name": "Cablaggio striscia led 16 punti (Striscia led sottomento) - 7050402CAB006B",
        "code": "7050402CAB006B",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB006B+Cablaggio+striscia+led+16+punti+%28Striscia+led+sottomento%29"
      },
      {
        "id": "SPIS-0055",
        "name": "Striscia led 13 punti (Striscia led R) - 7050402CAB0007",
        "code": "7050402CAB0007",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0007+Striscia+led+13+punti+%28Striscia+led+R%29"
      },
      {
        "id": "SPIS-0056",
        "name": "Cablaggio striscia led 13 punti (Striscia led R) - 7050402CAB007A",
        "code": "7050402CAB007A",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB007A+Cablaggio+striscia+led+13+punti+%28Striscia+led+R%29"
      },
      {
        "id": "SPIS-0057",
        "name": "Cavo lettera M - 7050402CAB0008",
        "code": "7050402CAB0008",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0008+Cavo+lettera+M"
      },
      {
        "id": "SPIS-0058",
        "name": "Cavo USB Full Body - 7050402CAB0009",
        "code": "7050402CAB0009",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 6.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0009+Cavo+USB+Full+Body"
      },
      {
        "id": "SPIS-0059",
        "name": "Cavo J - O R S Cavo luci - 7050402CAB0010",
        "code": "7050402CAB0010",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 15.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0010+Cavo+J"
      },
      {
        "id": "SPIS-0060",
        "name": "Cavo Video - 7050402CAB0011",
        "code": "7050402CAB0011",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 7.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0011+Cavo+Video"
      },
      {
        "id": "SPIS-0061",
        "name": "Cavo potenziometro 20 cm - 7050402CAB012A",
        "code": "7050402CAB012A",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 6.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB012A+Cavo+potenziometro+20+cm"
      },
      {
        "id": "SPIS-0062",
        "name": "Saldature piastrino - 7050402CAB012B",
        "code": "7050402CAB012B",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 1.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB012B+Saldature+piastrino"
      },
      {
        "id": "SPIS-0063",
        "name": "Lavorazione gemme - 7050402CAB0013",
        "code": "7050402CAB0013",
        "category": "Manodopera / lavorazioni",
        "parent": "",
        "quantity": "2,00",
        "cost": 6.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0013+Lavorazione+gemme"
      },
      {
        "id": "SPIS-0064",
        "name": "Striscia led 13 punti (Striscia led S) - 7050402CAB0014",
        "code": "7050402CAB0014",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0014+Striscia+led+13+punti+%28Striscia+led+S%29"
      },
      {
        "id": "SPIS-0065",
        "name": "Cablaggio striscia led 13 punti (Striscia led S) 7050402CAB014A",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cablaggio+striscia+led+13+punti+%28Striscia+led+S%29+7050402CAB014A"
      },
      {
        "id": "SPIS-0066",
        "name": "Cablaggio motore Spis DM75 - 7050402CAB0016",
        "code": "7050402CAB0016",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 7.2,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0016+Cablaggio+motore+Spis+DM75"
      },
      {
        "id": "SPIS-0067",
        "name": "Supporto Fari Illuminatore",
        "code": "",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 136.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Supporto+Fari+Illuminatore"
      },
      {
        "id": "SPIS-0068",
        "name": "Vite; M6x12; 1; Testa: cilindrica; brugola; HEX 3mm; acciaio - B6X12/BN1206 - 1415662",
        "code": "1415662",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1415662+Vite%3B+M6x12%3B+1%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+3mm%3B+acciaio"
      },
      {
        "id": "SPIS-0069",
        "name": "Quadrotto adesivo 20x20 - TTP20X20-S/BK",
        "code": "TTP20X20-S/BK",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "10,00",
        "cost": 0.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=TTP20X20-S%2FBK+Quadrotto+adesivo+20x20"
      },
      {
        "id": "SPIS-0070",
        "name": "Fascetta autostringente; L: 100mm; W: 2,5mm; nero; poliamide; 80N - FIX-S-2.5X100/BK",
        "code": "FIX-S-2.5X100/BK",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "10,00",
        "cost": 0.1,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=FIX-S-2.5X100%2FBK+Fascetta+autostringente%3B+L%3A+100mm%3B+W%3A+2%2C5mm%3B+nero%3B+poliamide%3B+80N"
      },
      {
        "id": "SPIS-0071",
        "name": "KIT DISPLAY SPIS",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 137.03,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+DISPLAY+SPIS"
      },
      {
        "id": "SPIS-0072",
        "name": "Display 10.1inch QLED, Capacitive Touch - WS-20135",
        "code": "WS-20135",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 106.88,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=WS-20135+Display+10.1inch+QLED%2C+Capacitive+Touch"
      },
      {
        "id": "SPIS-0073",
        "name": "Supporto monitor SPIS - STAMPA 3D",
        "code": "STAMPA 3D",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=STAMPA+3D+Supporto+monitor+SPIS"
      },
      {
        "id": "SPIS-0074",
        "name": "Carpenteria Display Spis",
        "code": "",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Carpenteria+Display+Spis"
      },
      {
        "id": "SPIS-0075",
        "name": "Cablaggio Display Spis",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cablaggio+Display+Spis"
      },
      {
        "id": "SPIS-0076",
        "name": "Viti scocca IdBox & Display Spis",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "8,00",
        "cost": 0.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Viti+scocca+IdBox+%26+Display+Spis"
      },
      {
        "id": "SPIS-0077",
        "name": "KIT TLC Full Body",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 64.93,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+TLC+Full+Body"
      },
      {
        "id": "SPIS-0078",
        "name": "Pannello Led Illuminatore Spis\\IdSysBox - H570",
        "code": "H570",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 10.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=H570+Pannello+Led+Illuminatore+Spis%5CIdSysBox"
      },
      {
        "id": "SPIS-0079",
        "name": "Telecamera IdBox & Spis ST-IMX258-USB2.0",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 34.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Telecamera+IdBox+%26+Spis+ST-IMX258-USB2.0"
      },
      {
        "id": "SPIS-0080",
        "name": "Distanziali filettati; esagonale; poliamide; M2; Lungh: 5mm - FIX-HP2-5",
        "code": "FIX-HP2-5",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.2,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=FIX-HP2-5+Distanziali+filettati%3B+esagonale%3B+poliamide%3B+M2%3B+Lungh%3A+5mm"
      },
      {
        "id": "SPIS-0081",
        "name": "Rondella; rotonda; M2; D=5mm; h=0,3mm; poliamide; DIN 125A; BN 1074 - B2/BN1074 -",
        "code": "B2/BN1074 -",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "7,00",
        "cost": 0.14,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=B2%2FBN1074+-+Rondella%3B+rotonda%3B+M2%3B+D%3D5mm%3B+h%3D0%2C3mm%3B+poliamide%3B+DIN+125A%3B+BN+1074"
      },
      {
        "id": "SPIS-0082",
        "name": "Vite; M2x10; 0,4; Testa: cilindrica; brugola; HEX 1,5mm; DIN 912 - B2X10/BN610 - 1420593",
        "code": "1420593",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.18,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1420593+Vite%3B+M2x10%3B+0%2C4%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+1%2C5mm%3B+DIN+912"
      },
      {
        "id": "SPIS-0083",
        "name": "Diffusore fullbody upgrade SPIS - STAMPA 3D",
        "code": "STAMPA 3D",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=STAMPA+3D+Diffusore+fullbody+upgrade+SPIS"
      },
      {
        "id": "SPIS-0084",
        "name": "Supporto telecamera full body SPIS - STAMPA 3D",
        "code": "STAMPA 3D",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=STAMPA+3D+Supporto+telecamera+full+body+SPIS"
      },
      {
        "id": "SPIS-0085",
        "name": "Carpenteria Full Body",
        "code": "",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Carpenteria+Full+Body"
      },
      {
        "id": "SPIS-0086",
        "name": "KIT TLC Spis",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 216.55,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+TLC+Spis"
      },
      {
        "id": "SPIS-0087",
        "name": "Canotto distanziale; 4mm; cilindrico; ottone; nichel; Øint: 4,3mm - DR317/4.3X4",
        "code": "DR317/4.3X4",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.34,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=DR317%2F4.3X4+Canotto+distanziale%3B+4mm%3B+cilindrico%3B+ottone%3B+nichel%3B+%C3%98int%3A+4%2C3mm"
      },
      {
        "id": "SPIS-0088",
        "name": "Canotto distanziale; 8mm; cilindrico; ottone; nichel; Øint: 4,3mm - DR318/4.3X8",
        "code": "DR318/4.3X8",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.9,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=DR318%2F4.3X8+Canotto+distanziale%3B+8mm%3B+cilindrico%3B+ottone%3B+nichel%3B+%C3%98int%3A+4%2C3mm"
      },
      {
        "id": "SPIS-0089",
        "name": "Dado autobloccante; esagonale; M4; 0,7; acciaio inox - B4/BN637 - 1242385",
        "code": "1242385",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.03,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1242385+Dado+autobloccante%3B+esagonale%3B+M4%3B+0%2C7%3B+acciaio+inox"
      },
      {
        "id": "SPIS-0090",
        "name": "Dado; esagonale; M4; 0,7; ottone; 7mm - B4/BN504 - 1195131",
        "code": "1195131",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.05,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1195131+Dado%3B+esagonale%3B+M4%3B+0%2C7%3B+ottone%3B+7mm"
      },
      {
        "id": "SPIS-0091",
        "name": "Distanziali filettati; 80mm; Filetto int: M6; esagonale; acciaio - TFF-M6X80/DR129 - 129X80",
        "code": "129X80",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 2.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=129X80+Distanziali+filettati%3B+80mm%3B+Filetto+int%3A+M6%3B+esagonale%3B+acciaio"
      },
      {
        "id": "SPIS-0092",
        "name": "Distanziali filettati; 75mm; Filetto int: M4; esagonale; acciaio - TFF-M4X75/DR126 - 126X75",
        "code": "126X75",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 1.02,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=126X75+Distanziali+filettati%3B+75mm%3B+Filetto+int%3A+M4%3B+esagonale%3B+acciaio"
      },
      {
        "id": "SPIS-0093",
        "name": "Distanziali filettati; 14mm; Filetto int: M6; Filetto est: M6 - B6X14/BN3318 - 1070975",
        "code": "1070975",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.4,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1070975+Distanziali+filettati%3B+14mm%3B+Filetto+int%3A+M6%3B+Filetto+est%3A+M6"
      },
      {
        "id": "SPIS-0094",
        "name": "Kit Supporto Prisma 2.0 - STAMPA 3D",
        "code": "STAMPA 3D",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 2.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=STAMPA+3D+Kit+Supporto+Prisma+2.0"
      },
      {
        "id": "SPIS-0095",
        "name": "Prismi Retti 28X28X38mm +0/-0.5 angli +/-30 primi S/D 60/40 sup. lambda/2 - S.009056",
        "code": "S.009056",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "2,00",
        "cost": 120.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=S.009056+Prismi+Retti+28X28X38mm+%2B0%2F-0.5+angli+%2B%2F-30+primi+S%2FD+60%2F40+sup.+lambda%2F2"
      },
      {
        "id": "SPIS-0096",
        "name": "Raspberry Pi 5 Camera Cable Standard-Mini-500mm - SC1130",
        "code": "SC1130",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 2.56,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=SC1130+Raspberry+Pi+5+Camera+Cable+Standard-Mini-500mm"
      },
      {
        "id": "SPIS-0097",
        "name": "Raspberry Pi 5 Telephoto Lens for HQ Camera 16mm - RPI-CAM-16",
        "code": "RPI-CAM-16",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 40.49,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=RPI-CAM-16+Raspberry+Pi+5+Telephoto+Lens+for+HQ+Camera+16mm"
      },
      {
        "id": "SPIS-0098",
        "name": "Raspberry Pi High Quality Camera - RPI-CAM-HQ",
        "code": "RPI-CAM-HQ",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 40.49,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=RPI-CAM-HQ+Raspberry+Pi+High+Quality+Camera"
      },
      {
        "id": "SPIS-0099",
        "name": "Rondella; rotonda; M6; D=14mm; h=1,2mm; acciaio - B6/BN84541 - 8030774",
        "code": "8030774",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.08,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=8030774+Rondella%3B+rotonda%3B+M6%3B+D%3D14mm%3B+h%3D1%2C2mm%3B+acciaio"
      },
      {
        "id": "SPIS-0100",
        "name": "Rondella; rotonda; M4; D=9mm; h=0,8mm; poliamide - B4/BN1074 - 1404849",
        "code": "1404849",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.02,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1404849+Rondella%3B+rotonda%3B+M4%3B+D%3D9mm%3B+h%3D0%2C8mm%3B+poliamide"
      },
      {
        "id": "SPIS-0101",
        "name": "Vite; M4x60; Testa: cilindrica; Phillips; PH2; acciaio inox - B4X60/BN660 - 3059864",
        "code": "3059864",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.1,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=3059864+Vite%3B+M4x60%3B+Testa%3A+cilindrica%3B+Phillips%3B+PH2%3B+acciaio+inox"
      },
      {
        "id": "SPIS-0102",
        "name": "Vite; M4x8; 0,7; Testa: piana; brugola; HEX 2,5mm; acciaio; annerite - B4X8/BN20 - 1021273",
        "code": "1021273",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1021273+Vite%3B+M4x8%3B+0%2C7%3B+Testa%3A+piana%3B+brugola%3B+HEX+2%2C5mm%3B+acciaio%3B+annerite"
      },
      {
        "id": "SPIS-0103",
        "name": "Inserto Filettato per Plastica M3x5,7",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "6,00",
        "cost": 3.9,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Inserto+Filettato+per+Plastica+M3x5%2C7"
      },
      {
        "id": "SPIS-0104",
        "name": "Inserto Filettato per Plastica M4",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.54,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Inserto+Filettato+per+Plastica+M4"
      },
      {
        "id": "SPIS-0105",
        "name": "Vite; M6x16; 1; Testa: piana; brugola; HEX 4mm; acciaio inox A2 - B6X16/BN616 - 1235362",
        "code": "1235362",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1235362+Vite%3B+M6x16%3B+1%3B+Testa%3A+piana%3B+brugola%3B+HEX+4mm%3B+acciaio+inox+A2"
      },
      {
        "id": "SPIS-0106",
        "name": "KIT SEDIA SPIS",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 1145.28,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+SEDIA+SPIS"
      },
      {
        "id": "SPIS-0107",
        "name": "Antivibranti in gomma - DVC.2-30-22-20-M8-20-40 - 433956",
        "code": "433956",
        "category": "Altro",
        "parent": "",
        "quantity": "2,00",
        "cost": 5.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=433956+Antivibranti+in+gomma"
      },
      {
        "id": "SPIS-0108",
        "name": "Carpenteria Sedia SPIS - SCM-A000390",
        "code": "SCM-A000390",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 714.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=SCM-A000390+Carpenteria+Sedia+SPIS"
      },
      {
        "id": "SPIS-0109",
        "name": "Cavo motore Linak colonna alza\\abbassa 2,5 mt - 00914948-2500-B",
        "code": "00914948-2500-B",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 7.98,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=00914948-2500-B+Cavo+motore+Linak+colonna+alza%5Cabbassa+2%2C5+mt"
      },
      {
        "id": "SPIS-0110",
        "name": "Colonna sollevamento sedia Spis (Linak) BL141HA11300A",
        "code": "",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 189.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Colonna+sollevamento+sedia+Spis+%28Linak%29+BL141HA11300A"
      },
      {
        "id": "SPIS-0111",
        "name": "Cuscinetto Rotelle a Sfera Trasferimento - NAKUPENDA024131",
        "code": "NAKUPENDA024131",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 10.65,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=NAKUPENDA024131+Cuscinetto+Rotelle+a+Sfera+Trasferimento"
      },
      {
        "id": "SPIS-0112",
        "name": "Cuscinetto rotazione sedia SPIS - F6904-ZZ F61904",
        "code": "F6904-ZZ F61904",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "2,00",
        "cost": 11.7,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=F6904-ZZ+F61904+Cuscinetto+rotazione+sedia+SPIS"
      },
      {
        "id": "SPIS-0113",
        "name": "Dado; esagonale; M8; 1,25; acciaio; Copertura: zinco - B8/BN6866 - 1807781",
        "code": "1807781",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "6,00",
        "cost": 0.36,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1807781+Dado%3B+esagonale%3B+M8%3B+1%2C25%3B+acciaio%3B+Copertura%3A+zinco"
      },
      {
        "id": "SPIS-0114",
        "name": "Fermacavo cavo motore Linak colonna alza\\abbassa - 808040",
        "code": "808040",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=808040+Fermacavo+cavo+motore+Linak+colonna+alza%5Cabbassa"
      },
      {
        "id": "SPIS-0115",
        "name": "Distanziale in plastica sedia spis - STAMPA 3D",
        "code": "STAMPA 3D",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=STAMPA+3D+Distanziale+in+plastica+sedia+spis"
      },
      {
        "id": "SPIS-0116",
        "name": "Motore rotazione sedia SPIS - DM-7550WM555024026-223K",
        "code": "DM-7550WM555024026-223K",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 27.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=DM-7550WM555024026-223K+Motore+rotazione+sedia+SPIS"
      },
      {
        "id": "SPIS-0117",
        "name": "Guarnizione O-ring; caucciù NBR; Thk: 3,5mm; Øint: 8mm; nero - O-8X3.5-70-NBR",
        "code": "O-8X3.5-70-NBR",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "10,00",
        "cost": 1.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=O-8X3.5-70-NBR+Guarnizione+O-ring%3B+caucci%C3%B9+NBR%3B+Thk%3A+3%2C5mm%3B+%C3%98int%3A+8mm%3B+nero"
      },
      {
        "id": "SPIS-0118",
        "name": "PCB Potenziometro sedia SPIS - EP431",
        "code": "EP431",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 2.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=EP431+PCB+Potenziometro+sedia+SPIS"
      },
      {
        "id": "SPIS-0119",
        "name": "Pignone rotazione sedia SPIS - 2M-15T 8MM",
        "code": "2M-15T 8MM",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 10.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2M-15T+8MM+Pignone+rotazione+sedia+SPIS"
      },
      {
        "id": "SPIS-0120",
        "name": "Potenziometro: assiale; mono giro; 10kΩ - PE3010K",
        "code": "PE3010K",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 46.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=PE3010K+Potenziometro%3A+assiale%3B+mono+giro%3B+10k%CE%A9"
      },
      {
        "id": "SPIS-0121",
        "name": "Inserto lamelle rettangolare - ILR80x60",
        "code": "ILR80x60",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.36,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=ILR80x60+Inserto+lamelle+rettangolare"
      },
      {
        "id": "SPIS-0122",
        "name": "Rondella; rotonda; M8; D=14mm; h=1mm; acciaio; Copertura: oliato - B8X1/BN1976 - 3045431",
        "code": "3045431",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "6,00",
        "cost": 0.3,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=3045431+Rondella%3B+rotonda%3B+M8%3B+D%3D14mm%3B+h%3D1mm%3B+acciaio%3B+Copertura%3A+oliato"
      },
      {
        "id": "SPIS-0123",
        "name": "Rondella; rotonda; M4; D=9mm; h=0,8mm; presspan - B4/BN1076 - 1405098",
        "code": "1405098",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.2,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1405098+Rondella%3B+rotonda%3B+M4%3B+D%3D9mm%3B+h%3D0%2C8mm%3B+presspan"
      },
      {
        "id": "SPIS-0124",
        "name": "Seduta e schienale legno sedia SPIS - EOE6",
        "code": "EOE6",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 20.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=EOE6+Seduta+e+schienale+legno+sedia+SPIS"
      },
      {
        "id": "SPIS-0125",
        "name": "Vite; M4x10; 0,7; Testa: cilindrica; brugola; HEX 3mm; acciaio - B4X10/BN3 - 1003917",
        "code": "1003917",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "5,00",
        "cost": 0.15,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1003917+Vite%3B+M4x10%3B+0%2C7%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+3mm%3B+acciaio"
      },
      {
        "id": "SPIS-0126",
        "name": "Vite; con la flangia; M8x10; 1,25; Testa: sferica; brugola - B8X10/BN11252 - 2042231",
        "code": "2042231",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.22,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042231+Vite%3B+con+la+flangia%3B+M8x10%3B+1%2C25%3B+Testa%3A+sferica%3B+brugola"
      },
      {
        "id": "SPIS-0127",
        "name": "Vite; M8x30; 1,25; Testa: cilindrica; brugola; HEX 4mm; acciaio - B8X30/BN1206 - 1415778",
        "code": "1415778",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "6,00",
        "cost": 3.9,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1415778+Vite%3B+M8x30%3B+1%2C25%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+4mm%3B+acciaio"
      },
      {
        "id": "SPIS-0128",
        "name": "Vite; M5x6; 0,8; Testa: senza testa; brugola; acciaio inox A2 - B5X6/BN618 - 1236849",
        "code": "1236849",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1236849+Vite%3B+M5x6%3B+0%2C8%3B+Testa%3A+senza+testa%3B+brugola%3B+acciaio+inox+A2"
      },
      {
        "id": "SPIS-0129",
        "name": "Vite motore Linak colonna alza\\abbassa - 0002085",
        "code": "0002085",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "8,00",
        "cost": 7.2,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=0002085+Vite+motore+Linak+colonna+alza%5Cabbassa"
      },
      {
        "id": "SPIS-0130",
        "name": "Vite; con la flangia; M8x20; 1,25; Testa: sferica; brugola; HEX 5mm - B8X20/BN11252 - 2042274",
        "code": "2042274",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.64,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042274+Vite%3B+con+la+flangia%3B+M8x20%3B+1%2C25%3B+Testa%3A+sferica%3B+brugola%3B+HEX+5mm"
      },
      {
        "id": "SPIS-0131",
        "name": "Vite; con la flangia; M8x10; 1,25; Testa: sferica; brugola - B8X10/BN11252 - 2042231",
        "code": "2042231",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.44,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042231+Vite%3B+con+la+flangia%3B+M8x10%3B+1%2C25%3B+Testa%3A+sferica%3B+brugola"
      },
      {
        "id": "SPIS-0132",
        "name": "V-Tac VT-8109W Profilo Angolare in Alluminio Bianco per Strisce LED a Superficie con Copertura",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "0,35",
        "cost": 1.42,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=V-Tac+VT-8109W+Profilo+Angolare+in+Alluminio+Bianco+per+Strisce+LED+a+Superficie+con+Copertura"
      },
      {
        "id": "SPIS-0133",
        "name": "Cavo N collegamento Potenziometro Motore Sedia - 70504002CAB004",
        "code": "70504002CAB004",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 10.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=70504002CAB004+Cavo+N+collegamento+Potenziometro+Motore+Sedia"
      },
      {
        "id": "SPIS-0134",
        "name": "Striscia led 7 punti (Striscia led sedia) - 7050402CAB0005",
        "code": "7050402CAB0005",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "2,00",
        "cost": 15.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0005+Striscia+led+7+punti+%28Striscia+led+sedia%29"
      },
      {
        "id": "SPIS-0135",
        "name": "Montaggio sedia Spis",
        "code": "",
        "category": "Manodopera / lavorazioni",
        "parent": "",
        "quantity": "1,00",
        "cost": 55.65,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Montaggio+sedia+Spis"
      },
      {
        "id": "SPIS-0136",
        "name": "KIT CAVI SPIS",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 33.66,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+CAVI+SPIS"
      },
      {
        "id": "SPIS-0137",
        "name": "Cavo alimentazione spina SCHUKO\\VDE femmina 1,8mt",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "2,00",
        "cost": 4.76,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+alimentazione+spina+SCHUKO%5CVDE+femmina+1%2C8mt"
      },
      {
        "id": "SPIS-0138",
        "name": "Cavo prolunga VDE Maschio Femmina 1mt",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+prolunga+VDE+Maschio+Femmina+1mt"
      },
      {
        "id": "SPIS-0139",
        "name": "Cavo Lan 7 Mt",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 2.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+Lan+7+Mt"
      },
      {
        "id": "SPIS-0140",
        "name": "Cavo Lan 3 Mt",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 1.01,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+Lan+3+Mt"
      },
      {
        "id": "SPIS-0141",
        "name": "Prolunga USB 2mt",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 2.68,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Prolunga+USB+2mt"
      },
      {
        "id": "SPIS-0142",
        "name": "Cavo USB A B 5mt",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+USB+A+B+5mt"
      },
      {
        "id": "SPIS-0143",
        "name": "Cavo alimentazione spina Italia\\VDE femmina 3mt",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 6.57,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+alimentazione+spina+Italia%5CVDE+femmina+3mt"
      },
      {
        "id": "SPIS-0144",
        "name": "Cavo alimentazione spina Italia\\VDE femmina 1,8mt (SN319-3/10/1.8BK)",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "2,00",
        "cost": 9.86,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+alimentazione+spina+Italia%5CVDE+femmina+1%2C8mt+%28SN319-3%2F10%2F1.8BK%29"
      },
      {
        "id": "SPIS-0145",
        "name": "KIT SCATOLA ELETTRICA SPIS",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 17.56,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+SCATOLA+ELETTRICA+SPIS"
      },
      {
        "id": "SPIS-0146",
        "name": "Cassa: scatola di collegamento; X: 140mm; Y: 190mm; Z: 70mm; IP65 - PW-S-BOX406",
        "code": "PW-S-BOX406",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 7.09,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=PW-S-BOX406+Cassa%3A+scatola+di+collegamento%3B+X%3A+140mm%3B+Y%3A+190mm%3B+Z%3A+70mm%3B+IP65"
      },
      {
        "id": "SPIS-0147",
        "name": "Fascette; Øcappio: 15,9÷17,5mm; W: 13mm; acciaio; Øforo mont: 6,5mm - MPC-LKD1508",
        "code": "MPC-LKD1508",
        "category": "Altro",
        "parent": "",
        "quantity": "2,00",
        "cost": 1.98,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=MPC-LKD1508+Fascette%3B+%C3%98cappio%3A+15%2C9%C3%B717%2C5mm%3B+W%3A+13mm%3B+acciaio%3B+%C3%98foro+mont%3A+6%2C5mm"
      },
      {
        "id": "SPIS-0148",
        "name": "Fascette; Øcappio: 8mm; W: 12mm; acciaio; Øforo mont: 5,3mm; DL; W1 - MPC-LKD10812",
        "code": "MPC-LKD10812",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.47,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=MPC-LKD10812+Fascette%3B+%C3%98cappio%3A+8mm%3B+W%3A+12mm%3B+acciaio%3B+%C3%98foro+mont%3A+5%2C3mm%3B+DL%3B+W1"
      },
      {
        "id": "SPIS-0149",
        "name": "Fascetta autostringente; L: 150mm; W: 2,5mm; nero; polliamide; 80N - FIX-S-2.5X150/BK",
        "code": "FIX-S-2.5X150/BK",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "10,00",
        "cost": 0.1,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=FIX-S-2.5X150%2FBK+Fascetta+autostringente%3B+L%3A+150mm%3B+W%3A+2%2C5mm%3B+nero%3B+polliamide%3B+80N"
      },
      {
        "id": "SPIS-0150",
        "name": "Fascetta autostringente; L: 250mm; W: 4,8mm; nero; polliamide; 220N - BMN2548",
        "code": "BMN2548",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "10,00",
        "cost": 0.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=BMN2548+Fascetta+autostringente%3B+L%3A+250mm%3B+W%3A+4%2C8mm%3B+nero%3B+polliamide%3B+220N"
      },
      {
        "id": "SPIS-0151",
        "name": "Fascetta autostringente; L: 300mm; W: 4,8mm; nero; poliamide; 220N - BMN3048",
        "code": "BMN3048",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "10,00",
        "cost": 0.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=BMN3048+Fascetta+autostringente%3B+L%3A+300mm%3B+W%3A+4%2C8mm%3B+nero%3B+poliamide%3B+220N"
      },
      {
        "id": "SPIS-0152",
        "name": "Parallelepipedo magnetico 40 x 20 x 5 mm, tiene ca. 14 kg - Q-40-20-05-N",
        "code": "Q-40-20-05-N",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 6.36,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Q-40-20-05-N+Parallelepipedo+magnetico+40+x+20+x+5+mm%2C+tiene+ca.+14+kg"
      },
      {
        "id": "SPIS-0153",
        "name": "Vite; M4x60; Testa: cilindrica; Phillips; PH2; acciaio inox - B4X60/BN660 - 3059864",
        "code": "3059864",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "3,00",
        "cost": 0.3,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=3059864+Vite%3B+M4x60%3B+Testa%3A+cilindrica%3B+Phillips%3B+PH2%3B+acciaio+inox"
      },
      {
        "id": "SPIS-0154",
        "name": "Rondella; rotonda; M4; D=12mm; h=1mm; acciaio; (B4/BN729)",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "3,00",
        "cost": 0.03,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Rondella%3B+rotonda%3B+M4%3B+D%3D12mm%3B+h%3D1mm%3B+acciaio%3B+%28B4%2FBN729%29"
      },
      {
        "id": "SPIS-0155",
        "name": "Dado; esagonale; M4; 0,7; acciaio - B4/BN115 - 1089013",
        "code": "1089013",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "3,00",
        "cost": 0.03,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1089013+Dado%3B+esagonale%3B+M4%3B+0%2C7%3B+acciaio"
      },
      {
        "id": "SPIS-0156",
        "name": "KIT VITI SPIS & ACCESSORI",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 51.56,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+VITI+SPIS+%26+ACCESSORI"
      },
      {
        "id": "SPIS-0157",
        "name": "Vite; M8x70; 1,25; Testa: cilindrica; brugola - B8X70/BN613 - 1234404",
        "code": "1234404",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 2.32,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1234404+Vite%3B+M8x70%3B+1%2C25%3B+Testa%3A+cilindrica%3B+brugola"
      },
      {
        "id": "SPIS-0158",
        "name": "Rondella; rotonda; M8; D=15mm; h=1,6mm; acciaio inox B8/BN1414 - 1170252",
        "code": "1170252",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1170252+Rondella%3B+rotonda%3B+M8%3B+D%3D15mm%3B+h%3D1%2C6mm%3B+acciaio+inox+B8%2FBN1414"
      },
      {
        "id": "SPIS-0159",
        "name": "Dado; esagonale; M8; 1,25; acciaio - B8/BN117 - 1874772",
        "code": "1874772",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1874772+Dado%3B+esagonale%3B+M8%3B+1%2C25%3B+acciaio"
      },
      {
        "id": "SPIS-0160",
        "name": "Vite; con la flangia; M4x12; 0,7; Testa: sferica; brugola; acciaio - B4X12/BN11252 - 2042053",
        "code": "2042053",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "3,00",
        "cost": 0.18,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042053+Vite%3B+con+la+flangia%3B+M4x12%3B+0%2C7%3B+Testa%3A+sferica%3B+brugola%3B+acciaio"
      },
      {
        "id": "SPIS-0161",
        "name": "Vite; M5x14; 0,8; Testa: cilindrica - B5X14/BN3 - 1004093",
        "code": "1004093",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.16,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1004093+Vite%3B+M5x14%3B+0%2C8%3B+Testa%3A+cilindrica"
      },
      {
        "id": "SPIS-0162",
        "name": "Rondella; rotonda; M5; D=15mm; h=1,2mm; acciaio; Copertura: zinco - B5/BN729 - 1762273",
        "code": "1762273",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1762273+Rondella%3B+rotonda%3B+M5%3B+D%3D15mm%3B+h%3D1%2C2mm%3B+acciaio%3B+Copertura%3A+zinco"
      },
      {
        "id": "SPIS-0163",
        "name": "Vite; M6x75; 1; Testa: cilindrica; brugola; HEX 5mm; DIN 912 - B6X75/BN613",
        "code": "B6X75/BN613",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "3,00",
        "cost": 0.93,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=B6X75%2FBN613+Vite%3B+M6x75%3B+1%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+5mm%3B+DIN+912"
      },
      {
        "id": "SPIS-0164",
        "name": "Vite; M8x25; 1,25; Testa: cilindrica; brugola; HEX 6mm; DIN 912 - B8X25/BN610 - 1233440",
        "code": "1233440",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.64,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1233440+Vite%3B+M8x25%3B+1%2C25%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+6mm%3B+DIN+912"
      },
      {
        "id": "SPIS-0165",
        "name": "Rondella; rotonda; M8; D=15mm; h=1,6mm; acciaio inox B8/BN1414 - 1170252",
        "code": "1170252",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1170252+Rondella%3B+rotonda%3B+M8%3B+D%3D15mm%3B+h%3D1%2C6mm%3B+acciaio+inox+B8%2FBN1414"
      },
      {
        "id": "SPIS-0166",
        "name": "Vite grano; M8x16; senza testa; brugola HEX 4mm - B8X16/BN24 - 1026070",
        "code": "1026070",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "10,00",
        "cost": 0.7,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1026070+Vite+grano%3B+M8x16%3B+senza+testa%3B+brugola+HEX+4mm"
      },
      {
        "id": "SPIS-0167",
        "name": "Vite; M8x10; 1,25; Testa: senza testa; brugola; HEX 4mm; acciaio - B8X10/BN24 - 1026038",
        "code": "1026038",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.1,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1026038+Vite%3B+M8x10%3B+1%2C25%3B+Testa%3A+senza+testa%3B+brugola%3B+HEX+4mm%3B+acciaio"
      },
      {
        "id": "SPIS-0168",
        "name": "Vite; con la flangia; M4x16; 0,7; Testa: sferica; brugola; acciaio - B4X16/BN11252 - 2042061",
        "code": "2042061",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "8,00",
        "cost": 0.4,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042061+Vite%3B+con+la+flangia%3B+M4x16%3B+0%2C7%3B+Testa%3A+sferica%3B+brugola%3B+acciaio"
      },
      {
        "id": "SPIS-0169",
        "name": "Vite; M6x25; 1; Testa: cilindrica; brugola; HEX 5mm; acciaio; zinco - B6X25/BN3 - 1004352",
        "code": "1004352",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "6,00",
        "cost": 0.42,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1004352+Vite%3B+M6x25%3B+1%3B+Testa%3A+cilindrica%3B+brugola%3B+HEX+5mm%3B+acciaio%3B+zinco"
      },
      {
        "id": "SPIS-0170",
        "name": "Dado; esagonale; M6; 1; acciaio; Copertura: zinco; H: 5mm; 10mm - B6/BN117 - 1874748",
        "code": "1874748",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1874748+Dado%3B+esagonale%3B+M6%3B+1%3B+acciaio%3B+Copertura%3A+zinco%3B+H%3A+5mm%3B+10mm"
      },
      {
        "id": "SPIS-0171",
        "name": "Rondella; rotonda; M6; D=14mm; h=1,2mm; acciaio; Copertura: zinco - B6/BN84519 - 8024995",
        "code": "8024995",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "8,00",
        "cost": 0.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=8024995+Rondella%3B+rotonda%3B+M6%3B+D%3D14mm%3B+h%3D1%2C2mm%3B+acciaio%3B+Copertura%3A+zinco"
      },
      {
        "id": "SPIS-0172",
        "name": "Dado; a farfalla; M5; 0,8; acciaio 5; Copertura: zinco; BN 213 - B5/BN213 - 1099582",
        "code": "1099582",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.16,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1099582+Dado%3B+a+farfalla%3B+M5%3B+0%2C8%3B+acciaio+5%3B+Copertura%3A+zinco%3B+BN+213"
      },
      {
        "id": "SPIS-0173",
        "name": "Rondella; rotonda; M5; D=15mm; h=1,2mm; acciaio; Copertura: zinco - B5/BN729 - 1762273",
        "code": "1762273",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.06,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1762273+Rondella%3B+rotonda%3B+M5%3B+D%3D15mm%3B+h%3D1%2C2mm%3B+acciaio%3B+Copertura%3A+zinco"
      },
      {
        "id": "SPIS-0174",
        "name": "Vite; con la flangia; M6x20; 1; Testa: sferica; brugola; HEX 4mm - B6X20/BN11252 - 2042207",
        "code": "2042207",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.32,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042207+Vite%3B+con+la+flangia%3B+M6x20%3B+1%3B+Testa%3A+sferica%3B+brugola%3B+HEX+4mm"
      },
      {
        "id": "SPIS-0175",
        "name": "Dado; esagonale; M6; 1; acciaio; Copertura: zinco; H: 5mm; 10mm - B6/BN117 - 1874748",
        "code": "1874748",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "3,00",
        "cost": 0.06,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1874748+Dado%3B+esagonale%3B+M6%3B+1%3B+acciaio%3B+Copertura%3A+zinco%3B+H%3A+5mm%3B+10mm"
      },
      {
        "id": "SPIS-0176",
        "name": "Rondella; rotonda; M6; D=14mm; h=1,2mm; acciaio; Copertura: zinco - B6/BN84519 - 8024995",
        "code": "8024995",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "6,00",
        "cost": 0.18,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=8024995+Rondella%3B+rotonda%3B+M6%3B+D%3D14mm%3B+h%3D1%2C2mm%3B+acciaio%3B+Copertura%3A+zinco"
      },
      {
        "id": "SPIS-0177",
        "name": "Vite; con la flangia; M4x12; 0,7; Testa: sferica; brugola; acciaio - B4X12/BN11252 - 2042053",
        "code": "2042053",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2042053+Vite%3B+con+la+flangia%3B+M4x12%3B+0%2C7%3B+Testa%3A+sferica%3B+brugola%3B+acciaio"
      },
      {
        "id": "SPIS-0178",
        "name": "Vite; M6x25; 1; Testa: sferica; acciaio inox A2; DIN 603; 15mm - B6X25/BN645 - 1413333",
        "code": "1413333",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.11,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1413333+Vite%3B+M6x25%3B+1%3B+Testa%3A+sferica%3B+acciaio+inox+A2%3B+DIN+603%3B+15mm"
      },
      {
        "id": "SPIS-0179",
        "name": "Dado; esagonale; M6; 1; acciaio; Copertura: zinco; H: 5mm; 10mm - B6/BN117 - 1874748",
        "code": "1874748",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.02,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1874748+Dado%3B+esagonale%3B+M6%3B+1%3B+acciaio%3B+Copertura%3A+zinco%3B+H%3A+5mm%3B+10mm"
      },
      {
        "id": "SPIS-0180",
        "name": "Chiave apertura cassone PC",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Chiave+apertura+cassone+PC"
      },
      {
        "id": "SPIS-0181",
        "name": "Targhetta metallica con scritta SPIS\\IDENTISYSTEM",
        "code": "",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 6.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Targhetta+metallica+con+scritta+SPIS%5CIDENTISYSTEM"
      },
      {
        "id": "SPIS-0182",
        "name": "Staffa a omega montaggio cassone",
        "code": "",
        "category": "Manodopera / lavorazioni",
        "parent": "",
        "quantity": "2,00",
        "cost": 11.94,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Staffa+a+omega+montaggio+cassone"
      },
      {
        "id": "SPIS-0183",
        "name": "Staffa blocco controllo remoto",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 1.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Staffa+blocco+controllo+remoto"
      },
      {
        "id": "SPIS-0184",
        "name": "Adesivi scala metrica scrivania 100 cm",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 1.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Adesivi+scala+metrica+scrivania+100+cm"
      },
      {
        "id": "SPIS-0185",
        "name": "Adesivi scala metrica scrivania 50 cm",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 1.94,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Adesivi+scala+metrica+scrivania+50+cm"
      },
      {
        "id": "SPIS-0186",
        "name": "Etichetta adesiva resinata Secom",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 5.8,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Etichetta+adesiva+resinata+Secom"
      },
      {
        "id": "SPIS-0187",
        "name": "Etichetta adesiva resinata seriale",
        "code": "",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Etichetta+adesiva+resinata+seriale"
      },
      {
        "id": "SPIS-0188",
        "name": "Scheda Rete USB",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.83,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Scheda+Rete+USB"
      },
      {
        "id": "SPIS-0189",
        "name": "KIT STRISCE LED SFONDI SPIS",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 12.28,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=KIT+STRISCE+LED+SFONDI+SPIS"
      },
      {
        "id": "SPIS-0190",
        "name": "V-Tac VT-8109W Profilo Angolare in Alluminio Bianco per Strisce LED a Superficie con Copertura",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,30",
        "cost": 5.28,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=V-Tac+VT-8109W+Profilo+Angolare+in+Alluminio+Bianco+per+Strisce+LED+a+Superficie+con+Copertura"
      },
      {
        "id": "SPIS-0191",
        "name": "Striscia led 13 punti (Striscia led R) - 7050402CAB0007",
        "code": "7050402CAB0007",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0007+Striscia+led+13+punti+%28Striscia+led+R%29"
      },
      {
        "id": "SPIS-0192",
        "name": "Striscia led 13 punti (Striscia led S) - 7050402CAB0014",
        "code": "7050402CAB0014",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 3.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=7050402CAB0014+Striscia+led+13+punti+%28Striscia+led+S%29"
      },
      {
        "id": "SPIS-0193",
        "name": "Carpenterie Spis",
        "code": "",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 2000.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Carpenterie+Spis"
      },
      {
        "id": "SPIS-0194",
        "name": "Kit ROLL UP CON TELO",
        "code": "",
        "category": "Kit / assieme",
        "parent": "",
        "quantity": "1,00",
        "cost": 260.92,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+ROLL+UP+CON+TELO"
      },
      {
        "id": "SPIS-0195",
        "name": "Carpenteria ROLL UP SPIS",
        "code": "",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 130.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Carpenteria+ROLL+UP+SPIS"
      },
      {
        "id": "SPIS-0196",
        "name": "TELO ROLL UP",
        "code": "",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 130.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=TELO+ROLL+UP"
      },
      {
        "id": "SPIS-0197",
        "name": "Vite; M4x16; 0,7; Testa: piana; brugola; HEX 2,5mm; acciaio - B4X16/BN20 - 1021338",
        "code": "1021338",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1021338+Vite%3B+M4x16%3B+0%2C7%3B+Testa%3A+piana%3B+brugola%3B+HEX+2%2C5mm%3B+acciaio"
      },
      {
        "id": "SPIS-0198",
        "name": "Piedino autoadesivo; H: 6,5mm; nero; gomma; W: 20mm; L: 14mm - FIX-SF-201465",
        "code": "FIX-SF-201465",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.8,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=FIX-SF-201465+Piedino+autoadesivo%3B+H%3A+6%2C5mm%3B+nero%3B+gomma%3B+W%3A+20mm%3B+L%3A+14mm"
      },
      {
        "id": "SPIS-0199",
        "name": "PC Winblue I5",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 800.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=PC+Winblue+I5"
      },
      {
        "id": "SPIS-0200",
        "name": "Monitor Yashi 24\" - 10.1078",
        "code": "10.1078",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 55.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=10.1078+Monitor+Yashi+24%22"
      },
      {
        "id": "SPIS-0201",
        "name": "UPS Atlantis 1000VA - 42.950",
        "code": "42.950",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 48.86,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=42.950+UPS+Atlantis+1000VA"
      },
      {
        "id": "SPIS-0202",
        "name": "Stampante Lexmark M3350",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 1048.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Stampante+Lexmark+M3350"
      },
      {
        "id": "SPIS-0203",
        "name": "Quadro elettrico volante Secom - 8050402QBPSPIS",
        "code": "8050402QBPSPIS",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 160.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=8050402QBPSPIS+Quadro+elettrico+volante+Secom"
      },
      {
        "id": "SPIS-0204",
        "name": "Penisola Secom con scanner MS527",
        "code": "",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 597.4,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Penisola+Secom+con+scanner+MS527"
      },
      {
        "id": "SPIS-0205",
        "name": "Alimentatore 24 Volt 280 W Mean Well GST280A24-C6P",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 73.7,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Alimentatore+24+Volt+280+W+Mean+Well+GST280A24-C6P"
      },
      {
        "id": "SPIS-0206",
        "name": "Cavo alimentazione spina Italia\\VDE femmina 1,8mt (SN319-3/10/1.8BK)",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "1,00",
        "cost": 4.93,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+alimentazione+spina+Italia%5CVDE+femmina+1%2C8mt+%28SN319-3%2F10%2F1.8BK%29"
      },
      {
        "id": "SPIS-0207",
        "name": "Carpenteria Penisola ALS - SCM-A000418",
        "code": "SCM-A000418",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 302.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=SCM-A000418+Carpenteria+Penisola+ALS"
      },
      {
        "id": "SPIS-0208",
        "name": "SSCB - configurazione PENISOLA",
        "code": "configurazione PENISOLA",
        "category": "Software / configurazione",
        "parent": "",
        "quantity": "1,00",
        "cost": 58.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=configurazione+PENISOLA+SSCB"
      },
      {
        "id": "SPIS-0209",
        "name": "Cavo motore Linak 50 cm (Per penisola)",
        "code": "",
        "category": "Struttura / carpenteria",
        "parent": "",
        "quantity": "1,00",
        "cost": 2.35,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+motore+Linak+50+cm+%28Per+penisola%29"
      },
      {
        "id": "SPIS-0210",
        "name": "Pulsantiera comandi colonna sollevamento Linak",
        "code": "",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 9.63,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Pulsantiera+comandi+colonna+sollevamento+Linak"
      },
      {
        "id": "SPIS-0211",
        "name": "Colonna sollevamento Linak DL6",
        "code": "",
        "category": "Altro",
        "parent": "",
        "quantity": "1,00",
        "cost": 124.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Colonna+sollevamento+Linak+DL6"
      },
      {
        "id": "SPIS-0212",
        "name": "Piastra Scanner MS527",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 20.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Piastra+Scanner+MS527"
      },
      {
        "id": "SPIS-0213",
        "name": "Vite; per plastica; 4x16; Testa: sferica; Phillips; PH2; acciaio - B4X16/BN13578 - 2001659",
        "code": "2001659",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "7,00",
        "cost": 0.35,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=2001659+Vite%3B+per+plastica%3B+4x16%3B+Testa%3A+sferica%3B+Phillips%3B+PH2%3B+acciaio"
      },
      {
        "id": "SPIS-0214",
        "name": "Canotto distanziale; cilindrico; poliamide; Lungh: 5mm; Øest: 5mm - DR385/2.7X5",
        "code": "DR385/2.7X5",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.36,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=DR385%2F2.7X5+Canotto+distanziale%3B+cilindrico%3B+poliamide%3B+Lungh%3A+5mm%3B+%C3%98est%3A+5mm"
      },
      {
        "id": "SPIS-0215",
        "name": "Distanziali filettati; esagonale; poliamide; M2,5; M2,5 - FIX-TP2.5-15",
        "code": "FIX-TP2.5-15",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.72,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=FIX-TP2.5-15+Distanziali+filettati%3B+esagonale%3B+poliamide%3B+M2%2C5%3B+M2%2C5"
      },
      {
        "id": "SPIS-0216",
        "name": "Vite; M5x16; 0,8; Testa: esagonale; acciaio; zinco; DIN 933 - B5X16/BN56 - 1049232",
        "code": "1049232",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1049232+Vite%3B+M5x16%3B+0%2C8%3B+Testa%3A+esagonale%3B+acciaio%3B+zinco%3B+DIN+933"
      },
      {
        "id": "SPIS-0217",
        "name": "Rondella; rotonda; M5; D=12mm; h=1mm; acciaio INOX A4; - B5/BN84541 - 8030758",
        "code": "8030758",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "2,00",
        "cost": 0.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=8030758+Rondella%3B+rotonda%3B+M5%3B+D%3D12mm%3B+h%3D1mm%3B+acciaio+INOX+A4%3B"
      },
      {
        "id": "SPIS-0218",
        "name": "Vite; M6x10; 1; Testa: piana; brugola; HEX 4mm; acciaio; DIN 7991 - B6X10/BN20 - 1021613",
        "code": "1021613",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.2,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1021613+Vite%3B+M6x10%3B+1%3B+Testa%3A+piana%3B+brugola%3B+HEX+4mm%3B+acciaio%3B+DIN+7991"
      },
      {
        "id": "SPIS-0219",
        "name": "Vite; M6x16; 1; Testa: piana; brugola; HEX 4mm; acciaio inox A2 - B6X16/BN616 - 1235362",
        "code": "1235362",
        "category": "Meccanica / fissaggi",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=1235362+Vite%3B+M6x16%3B+1%3B+Testa%3A+piana%3B+brugola%3B+HEX+4mm%3B+acciaio+inox+A2"
      },
      {
        "id": "SPIS-0220",
        "name": "Dado; con la flangia; esagonale; M6; 1; acciai0o; 10mm; - B6/BN14476-1329324",
        "code": "B6/BN14476-1329324",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "4,00",
        "cost": 0.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=B6%2FBN14476-1329324+Dado%3B+con+la+flangia%3B+esagonale%3B+M6%3B+1%3B+acciai0o%3B+10mm%3B"
      },
      {
        "id": "SPIS-0221",
        "name": "Scanner Thales MS 527",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 3000.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Scanner+Thales+MS+527"
      },
      {
        "id": "SPIS-0222",
        "name": "Multipresa da 5 posti",
        "code": "",
        "category": "Cablaggi / connettori",
        "parent": "",
        "quantity": "2,00",
        "cost": 15.94,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Multipresa+da+5+posti"
      },
      {
        "id": "SPIS-0223",
        "name": "Software MySpis",
        "code": "",
        "category": "Software / configurazione",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Software+MySpis"
      },
      {
        "id": "SPIS-0224",
        "name": "Software Winlase EVO",
        "code": "",
        "category": "Software / configurazione",
        "parent": "",
        "quantity": "1,00",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Software+Winlase+EVO"
      },
      {
        "id": "SPIS-0225",
        "name": "Alimentatore 24 Volt 280 W Mean Well GST280A24-C6P",
        "code": "",
        "category": "Elettronica",
        "parent": "",
        "quantity": "1,00",
        "cost": 73.7,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Alimentatore+24+Volt+280+W+Mean+Well+GST280A24-C6P"
      }
    ]
  },
  {
    "name": "SMARTFAD",
    "productName": "Smartfad",
    "totalCost": 101.65,
    "components": [
      {
        "id": "SMART-001",
        "name": "Smartfad",
        "code": "",
        "category": "Prodotto finito",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 101.65,
        "imageSearchUrl": "https://polizia.altervista.org/immagini/smartfad.jpg"
      },
      {
        "id": "M337",
        "name": "Scheda Smartfad",
        "code": "M337",
        "category": "Elettronica",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 68.0,
        "imageSearchUrl": ""
      },
      {
        "id": "SMART-003",
        "name": "Cover Superiore e Inferiore SMARTFAD",
        "code": "",
        "category": "Scocca / plastiche",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 3.65,
        "imageSearchUrl": ""
      },
      {
        "id": "SMART-004",
        "name": "Tastierino adesivo SMARTFAD",
        "code": "",
        "category": "Interfaccia utente",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 10.55,
        "imageSearchUrl": ""
      },
      {
        "id": "SMART-005",
        "name": "Batteria Li-Ion 18650 3500mAh",
        "code": "",
        "category": "Alimentazione",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 5.92,
        "imageSearchUrl": "https://www.keeppower.com.cn/images/P1835J.jpg"
      },
      {
        "id": "SMART-006",
        "name": "Clip con adesivo SMARTFAD",
        "code": "",
        "category": "Accessori",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 1.97,
        "imageSearchUrl": ""
      },
      {
        "id": "SMART-007",
        "name": "Lente SMARTFAD",
        "code": "",
        "category": "Ottica",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 10.5,
        "imageSearchUrl": ""
      },
      {
        "id": "SMART-008",
        "name": "Cover lente superiore e inferiore SMARTFAD (STAMPA 3D)",
        "code": "",
        "category": "Scocca / plastiche",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": ""
      },
      {
        "id": "B3.5X6.5/BN994",
        "name": "Vite; 3,5x6,5; Testa: cilindrica; Phillips; PH2; acciaio; zinco",
        "code": "B3.5X6.5/BN994",
        "category": "Viteria",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 0.02,
        "imageSearchUrl": ""
      },
      {
        "id": "B3.5X9.5/BN994",
        "name": "Vite; 3,5x9,5; Testa: cilindrica; Phillips; PH2; acciaio; zinco",
        "code": "B3.5X9.5/BN994",
        "category": "Viteria",
        "parent": "Smartfad",
        "quantity": "",
        "cost": 0.07,
        "imageSearchUrl": ""
      }
    ]
  },
  {
    "name": "KIOSK",
    "productName": "SEEKS KIOSK",
    "totalCost": 5889.67,
    "components": [
      {
        "id": "SEEKS-001",
        "name": "SEEKS KIOSK",
        "code": "",
        "category": "Assieme / kit",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 4225.36,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=SEEKS%20KIOSK"
      },
      {
        "id": "SEEKS-002",
        "name": "IdBox A 2.0 - Plus",
        "code": "",
        "category": "Assieme / kit",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 1176.4,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=IdBox%20A%202.0%20-%20Plus"
      },
      {
        "id": "SEEKS-003",
        "name": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "code": "",
        "category": "Elettronica",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 463.78,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Gruppo%20ottico%20IdBox%202.0%20-%20RaspBerry"
      },
      {
        "id": "SEEKS-004",
        "name": "Raspberry Pi 5 4GB RAM - RP5-4GB",
        "code": "",
        "category": "Elettronica",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 96.43,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Raspberry%20Pi%205%204GB%20RAM"
      },
      {
        "id": "SEEKS-005",
        "name": "Raspberry Pi 5 Active Cooler - RP5-ACT-COOL",
        "code": "",
        "category": "Elettronica",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 4.05,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Raspberry%20Pi%205%20Active%20Cooler"
      },
      {
        "id": "SEEKS-006",
        "name": "Raspberry Pi 5 RTC Battery - RP5-RTC",
        "code": "",
        "category": "Elettronica",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 4.05,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Raspberry%20Pi%205%20RTC%20Battery"
      },
      {
        "id": "SEEKS-007",
        "name": "Scheda Audio - UPS Raspberry",
        "code": "",
        "category": "Elettronica",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 77.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Scheda%20Audio%20-%20UPS%20Raspberry"
      },
      {
        "id": "SEEKS-008",
        "name": "Telecamera IdBox & Spis ST-IMX258-USB2.0",
        "code": "",
        "category": "Cavi / connessioni",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 102.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Telecamera%20IdBox%20%26%20Spis%20ST-IMX258-USB2.0"
      },
      {
        "id": "SEEKS-009",
        "name": "EP414LCR LCD control IdBox 2.0 ESP32",
        "code": "",
        "category": "Elettronica",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 52.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=EP414LCR%20LCD%20control%20IdBox%202.0%20ESP32"
      },
      {
        "id": "SEEKS-010",
        "name": "LCD 3.2 4DLCD-32320240 (Display IdBox 2.0)",
        "code": "",
        "category": "Elettronica",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 67.11,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=LCD%203.2%204DLCD-32320240%20%28Display%20IdBox%202.0%29"
      },
      {
        "id": "SEEKS-011",
        "name": "EP414LCS LCD support IdBox 2.0",
        "code": "",
        "category": "Elettronica",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 31.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=EP414LCS%20LCD%20support%20IdBox%202.0"
      },
      {
        "id": "SEEKS-012",
        "name": "Parallelepipedo magnetico 30 x 12 x 4 mm, tiene ca. 6,8 kg - CS-Q-30-12-04-N",
        "code": "",
        "category": "Meccanica / struttura",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 10.92,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Parallelepipedo%20magnetico%2030%20x%2012%20x%204%20mm%2C%20tiene%20ca.%206%2C8%20kg"
      },
      {
        "id": "SEEKS-013",
        "name": "Maniglia FIX-HANU-48N",
        "code": "",
        "category": "Meccanica / struttura",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 4.44,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Maniglia%20FIX-HANU-48N"
      },
      {
        "id": "SEEKS-014",
        "name": "Vite; M4x16; 0,7; Testa: piana; brugola; HEX 2,5mm; acciaio - B4X16/BN20 - 1021338",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M4x16%3B%200%2C7%3B%20Testa%3A%20piana%3B%20brugola%3B%20HEX%202%2C5mm%3B%20acciaio%20-%20B4X16/BN20"
      },
      {
        "id": "SEEKS-015",
        "name": "Dado; esagonale; M4; 0,7; acciaio - B4/BN115 - 1089013",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Dado%3B%20esagonale%3B%20M4%3B%200%2C7%3B%20acciaio%20-%20B4/BN115"
      },
      {
        "id": "SEEKS-016",
        "name": "Dado; esagonale; M3; 0,5; poliamide; H: 2,4mm; 5,5mm; DIN 555 - B3/BN81 - 1400401",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.65,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Dado%3B%20esagonale%3B%20M3%3B%200%2C5%3B%20poliamide%3B%20H%3A%202%2C4mm%3B%205%2C5mm%3B%20DIN%20555%20-%20B3/BN81"
      },
      {
        "id": "SEEKS-017",
        "name": "Patch cord RJ45 30 cm - CQ9011S",
        "code": "",
        "category": "Cavi / connessioni",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 4.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Patch%20cord%20RJ45%2030%20cm"
      },
      {
        "id": "SEEKS-018",
        "name": "Patch cord; RJ45 spina,su entrambi il lati; U/UTP; 6a; filo; Cu - GOOBAY-74222",
        "code": "",
        "category": "Cavi / connessioni",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 1.66,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Patch%20cord%3B%20RJ45%20spina%2Csu%20entrambi%20il%20lati%3B%20U/UTP%3B%206a%3B%20filo%3B%20Cu"
      },
      {
        "id": "SEEKS-019",
        "name": "Cavo 30CM USB2.0 cable ST-IMX258-USB2.0",
        "code": "",
        "category": "Cavi / connessioni",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo%2030CM%20USB2.0%20cable%20ST-IMX258-USB2.0"
      },
      {
        "id": "SEEKS-020",
        "name": "Cavo 60CM USB2.0 cable ST-IMX258-USB2.0",
        "code": "",
        "category": "Cavi / connessioni",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 1.94,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo%2060CM%20USB2.0%20cable%20ST-IMX258-USB2.0"
      },
      {
        "id": "SEEKS-021",
        "name": "Vite; M3x12; 0,5; Testa: sferica; brugola; HEX 2mm; acciaio inox A2 - B3X12/BN1593 1348744",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.06,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M3x12%3B%200%2C5%3B%20Testa%3A%20sferica%3B%20brugola%3B%20HEX%202mm%3B%20acciaio%20inox%20A2"
      },
      {
        "id": "SEEKS-022",
        "name": "Vite; per plastica; 2,5x5; Testa: cilindrica; Torx® PLUS; 8IP - B2.5X5/BN20173 - 3304802",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.36,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20per%20plastica%3B%202%2C5x5%3B%20Testa%3A%20cilindrica%3B%20Torx%C2%AE%20PLUS%3B%208IP%20-%20B2.5X5/BN20173"
      },
      {
        "id": "SEEKS-023",
        "name": "Vite; M3x4; 0,5; Testa: cilindrica; a taglio; poliamide; DIN 85A - B3X4/BN1062 - 1401939",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M3x4%3B%200%2C5%3B%20Testa%3A%20cilindrica%3B%20a%20taglio%3B%20poliamide%3B%20DIN%2085A%20-%20B3X4/BN1062"
      },
      {
        "id": "SEEKS-024",
        "name": "Canotto distanziale; cilindrico; poliamide; Lungh: 5mm; Øest: 5mm - FIX-3-5",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.16,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Canotto%20distanziale%3B%20cilindrico%3B%20poliamide%3B%20Lungh%3A%205mm%3B%20%C3%98est%3A%205mm"
      },
      {
        "id": "SEEKS-025",
        "name": "Vite; M3x12; 0,5; Testa: sferica; brugola; HEX 2mm; acciaio inox A2 - B3X12/BN1593 1348744",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M3x12%3B%200%2C5%3B%20Testa%3A%20sferica%3B%20brugola%3B%20HEX%202mm%3B%20acciaio%20inox%20A2"
      },
      {
        "id": "SEEKS-026",
        "name": "Cavo alimentazione scheda UPS \\ Esp32 50 cm - 705402CVBOX004",
        "code": "",
        "category": "Cavi / connessioni",
        "parent": "Gruppo ottico IdBox 2.0 - RaspBerry",
        "quantity": "",
        "cost": 3.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo%20alimentazione%20scheda%20UPS%20%5C%20Esp32%2050%20cm"
      },
      {
        "id": "SEEKS-027",
        "name": "Metacrilato IDBox 2.0",
        "code": "",
        "category": "Meccanica / struttura",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 40.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Metacrilato%20IDBox%202.0"
      },
      {
        "id": "SEEKS-028",
        "name": "Carpenteria IdBox 2.0 - SCM-A000561",
        "code": "",
        "category": "Meccanica / struttura",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 535.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Carpenteria%20IdBox%202.0"
      },
      {
        "id": "SEEKS-029",
        "name": "Striscia Led K2-40-1920-24",
        "code": "",
        "category": "Meccanica / struttura",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 60.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Striscia%20Led%20K2-40-1920-24"
      },
      {
        "id": "SEEKS-030",
        "name": "Vite; M5x12; 0,8; Testa: cilindrica; brugola; HEX 3mm; acciaio - B5X12/BN1206 - 1415603",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 3.84,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M5x12%3B%200%2C8%3B%20Testa%3A%20cilindrica%3B%20brugola%3B%20HEX%203mm%3B%20acciaio%20-%20B5X12/BN1206"
      },
      {
        "id": "SEEKS-031",
        "name": "Distanziali filettati 60mmxM3 TFF-M3X60/DR125",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 1.28,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Distanziali%20filettati%2060mmxM3%20TFF-M3X60/DR125"
      },
      {
        "id": "SEEKS-032",
        "name": "Vite; M3x10; 0,5; Testa: cilindrica; brugola; HEX 1,5mm; acciaio - B3X10/BN1206 - 3555984",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 2.08,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M3x10%3B%200%2C5%3B%20Testa%3A%20cilindrica%3B%20brugola%3B%20HEX%201%2C5mm%3B%20acciaio%20-%20B3X10/BN1206"
      },
      {
        "id": "SEEKS-033",
        "name": "Dado; con la flangia; esagonale; M6; 1; acciai0o; 10mm; - B6/BN14476-1329324",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 0.84,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Dado%3B%20con%20la%20flangia%3B%20esagonale%3B%20M6%3B%201%3B%20acciai0o%3B%2010mm%3B"
      },
      {
        "id": "SEEKS-034",
        "name": "Altoparlante FR 58 - 8 Ohm",
        "code": "",
        "category": "Elettronica",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 5.21,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Altoparlante%20FR%2058%20-%208%20Ohm"
      },
      {
        "id": "SEEKS-035",
        "name": "Alimentatore 24 Volt 120 W Mean Well GST120A24-P1M",
        "code": "",
        "category": "Elettronica",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 39.8,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Alimentatore%2024%20Volt%20120%20W%20Mean%20Well%20GST120A24-P1M"
      },
      {
        "id": "SEEKS-036",
        "name": "Parallelepipedo magnetico 30 x 12 x 4 mm, tiene ca. 6,8 kg - CS-Q-30-12-04-N",
        "code": "",
        "category": "Meccanica / struttura",
        "parent": "IdBox A 2.0 - Plus",
        "quantity": "",
        "cost": 24.57,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Parallelepipedo%20magnetico%2030%20x%2012%20x%204%20mm%2C%20tiene%20ca.%206%2C8%20kg"
      },
      {
        "id": "SEEKS-037",
        "name": "Operazioni",
        "code": "",
        "category": "Manodopera",
        "parent": "Operazioni",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Operazioni"
      },
      {
        "id": "SEEKS-038",
        "name": "Assemblaggio - Secom S.r.l.",
        "code": "",
        "category": "Manodopera",
        "parent": "Operazioni",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Assemblaggio%20-%20Secom%20S.r.l."
      },
      {
        "id": "SEEKS-039",
        "name": "SEEKS Carpenterie parte mobile",
        "code": "",
        "category": "Altro",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 494.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=SEEKS%20Carpenterie%20parte%20mobile"
      },
      {
        "id": "SEEKS-040",
        "name": "Colonna sollevamento Linak DL6",
        "code": "",
        "category": "Meccanica / struttura",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 124.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Colonna%20sollevamento%20Linak%20DL6"
      },
      {
        "id": "SEEKS-041",
        "name": "Desko Penta Scanner 4X",
        "code": "",
        "category": "Elettronica",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 851.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Desko%20Penta%20Scanner%204X"
      },
      {
        "id": "SEEKS-042",
        "name": "Mini PC Intel i7-1360p, RAM da 64 GB DDR4-3200, SSD M.2, Scheda Grafica Integrata",
        "code": "",
        "category": "Elettronica",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 449.58,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Mini%20PC%20Intel%20i7-1360p%2C%20RAM%20da%2064%20GB%20DDR4-3200%2C%20SSD%20M.2%2C%20Scheda%20Grafica%20Integrata"
      },
      {
        "id": "SEEKS-043",
        "name": "Lettore impronte digitali Realscan S60 Xperix",
        "code": "",
        "category": "Elettronica",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 850.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Lettore%20impronte%20digitali%20Realscan%20S60%20Xperix"
      },
      {
        "id": "SEEKS-044",
        "name": "SSCB - configurazione KIOSK",
        "code": "",
        "category": "Altro",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 58.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=SSCB%20-%20configurazione%20KIOSK"
      },
      {
        "id": "SEEKS-045",
        "name": "Display 15.6inch Capacitive Touch Screen LCD, 1920×1080, HDMI, IPS, Various Systems Support - WS-18207",
        "code": "",
        "category": "Elettronica",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 143.39,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Display%2015.6inch%20Capacitive%20Touch%20Screen%20LCD%2C%201920%C3%971080%2C%20HDMI%2C%20IPS%2C%20Various%20Systems%20Support"
      },
      {
        "id": "SEEKS-046",
        "name": "Carpenteria gruppo luci SPIS - SCM-A000441",
        "code": "",
        "category": "Meccanica / struttura",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 50.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Carpenteria%20gruppo%20luci%20SPIS"
      },
      {
        "id": "SEEKS-047",
        "name": "Patch cord; Cavo: U/UTP; Cat: 5e; RJ45 spina,su entrambi il lati - DK-1512-050/BL",
        "code": "",
        "category": "Cavi / connessioni",
        "parent": "SEEKS KIOSK",
        "quantity": "",
        "cost": 4.26,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Patch%20cord%3B%20Cavo%3A%20U/UTP%3B%20Cat%3A%205e%3B%20RJ45%20spina%2Csu%20entrambi%20il%20lati"
      },
      {
        "id": "SEEKS-048",
        "name": "Kit viti SEEKS KIOSK",
        "code": "",
        "category": "Assieme / kit",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 24.13,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit%20viti%20SEEKS%20KIOSK"
      },
      {
        "id": "SEEKS-049",
        "name": "Dado; con la flangia; esagonale; M6; 1; acciai0o; 10mm; - B6/BN14476-1329324",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 1.44,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Dado%3B%20con%20la%20flangia%3B%20esagonale%3B%20M6%3B%201%3B%20acciai0o%3B%2010mm%3B"
      },
      {
        "id": "SEEKS-050",
        "name": "Vite; M6x10; 1; Testa: piana; brugola; HEX 4mm; acciaio; DIN 7991 - B6X10/BN20 - 1021613",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 0.2,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M6x10%3B%201%3B%20Testa%3A%20piana%3B%20brugola%3B%20HEX%204mm%3B%20acciaio%3B%20DIN%207991%20-%20B6X10/BN20"
      },
      {
        "id": "SEEKS-051",
        "name": "Vite; M5x16; 0,8; Testa: cilindrica; Torx®; TX15",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 9.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M5x16%3B%200%2C8%3B%20Testa%3A%20cilindrica%3B%20Torx%C2%AE%3B%20TX15"
      },
      {
        "id": "SEEKS-052",
        "name": "Vite; M5x16; 0,8; Testa: cilindrica; brugola; HEX 3mm; acciaio - B5X16/BN1206 - 1415611",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 3.48,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M5x16%3B%200%2C8%3B%20Testa%3A%20cilindrica%3B%20brugola%3B%20HEX%203mm%3B%20acciaio%20-%20B5X16/BN1206"
      },
      {
        "id": "SEEKS-053",
        "name": "Vite; con la flangia; M5x16; 0,8; Testa: sferica; brugola; HEX 3mm",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 0.3,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20con%20la%20flangia%3B%20M5x16%3B%200%2C8%3B%20Testa%3A%20sferica%3B%20brugola%3B%20HEX%203mm"
      },
      {
        "id": "SEEKS-054",
        "name": "Dado; esagonale; M5; 0,8; acciaio",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 0.07,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Dado%3B%20esagonale%3B%20M5%3B%200%2C8%3B%20acciaio"
      },
      {
        "id": "SEEKS-055",
        "name": "Vite; M5x14; 0,8; Testa: cilindrica - B5X14/BN3 - 1004093",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 0.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M5x14%3B%200%2C8%3B%20Testa%3A%20cilindrica%20-%20B5X14/BN3"
      },
      {
        "id": "SEEKS-056",
        "name": "Vite; M3x12; 0,5; Testa: sferica; brugola; HEX 2mm; acciaio inox A2 - B3X12/BN1593 1348744",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 0.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M3x12%3B%200%2C5%3B%20Testa%3A%20sferica%3B%20brugola%3B%20HEX%202mm%3B%20acciaio%20inox%20A2"
      },
      {
        "id": "SEEKS-057",
        "name": "Dado; esagonale; M3; 0,5; acciaio; Copertura: zinco; H: 2,4mm; 5,5mm - B3/BN117 - 1874659",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 0.4,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Dado%3B%20esagonale%3B%20M3%3B%200%2C5%3B%20acciaio%3B%20Copertura%3A%20zinco%3B%20H%3A%202%2C4mm%3B%205%2C5mm%20-%20B3/BN117"
      },
      {
        "id": "SEEKS-058",
        "name": "Vite; M4x20; 0,7; Testa: cilindrica; brugola; HEX 3mm",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 0.06,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M4x20%3B%200%2C7%3B%20Testa%3A%20cilindrica%3B%20brugola%3B%20HEX%203mm"
      },
      {
        "id": "SEEKS-059",
        "name": "Vite; M8x25; 1,25; Testa: cilindrica; brugola; HEX 6mm; DIN 912 - B8X25/BN610 - 1233440",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 0.32,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite%3B%20M8x25%3B%201%2C25%3B%20Testa%3A%20cilindrica%3B%20brugola%3B%20HEX%206mm%3B%20DIN%20912%20-%20B8X25/BN610"
      },
      {
        "id": "SEEKS-060",
        "name": "Piedino; rigido,con foro per cacciavite a croce,con mandirno",
        "code": "",
        "category": "Viteria / minuteria",
        "parent": "Kit viti SEEKS KIOSK",
        "quantity": "",
        "cost": 8.58,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Piedino%3B%20rigido%2Ccon%20foro%20per%20cacciavite%20a%20croce%2Ccon%20mandirno"
      }
    ]
  },
  {
    "name": "IDSYSBOX",
    "productName": "IdSysBox Tipo B",
    "totalCost": 249.05,
    "components": [
      {
        "id": "IDSYSB-001",
        "name": "IdSysBox Tipo B",
        "code": "",
        "category": "Altro",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 249.05,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=IdSysBox+Tipo+B"
      },
      {
        "id": "IDSYSB-002",
        "name": "Altoparlante FR 58 - 8 Ohm",
        "code": "",
        "category": "Elettronica",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 5.21,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Altoparlante+FR+58+-+8+Ohm"
      },
      {
        "id": "IDSYSB-003",
        "name": "Gommina scheda audio",
        "code": "",
        "category": "Elettronica",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Gommina+scheda+audio"
      },
      {
        "id": "IDSYSB-004",
        "name": "Calamaro Altoparlante STAMPA 3D",
        "code": "",
        "category": "Elettronica",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 1.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Calamaro+Altoparlante+STAMPA+3D"
      },
      {
        "id": "IDSYSB-005",
        "name": "Forchetta STAMPA 3D",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Forchetta+STAMPA+3D"
      },
      {
        "id": "IDSYSB-006",
        "name": "Braccio luci back",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 5.18,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Braccio+luci+back"
      },
      {
        "id": "IDSYSB-007",
        "name": "Braccio luci cover (Opalino)",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 15.56,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Braccio+luci+cover+%28Opalino%29"
      },
      {
        "id": "IDSYSB-008",
        "name": "Corpo desk back",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 6.11,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Corpo+desk+back"
      },
      {
        "id": "IDSYSB-009",
        "name": "Corpo desk cover",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 6.06,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Corpo+desk+cover"
      },
      {
        "id": "IDSYSB-010",
        "name": "Supporto TLC IdSysBox",
        "code": "",
        "category": "Altro",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 1.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Supporto+TLC+IdSysBox"
      },
      {
        "id": "IDSYSB-011",
        "name": "Cavo 30CM USB2.0 cable ST-IMX258-USB2.0",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+30CM+USB2.0+cable+ST-IMX258-USB2.0"
      },
      {
        "id": "IDSYSB-012",
        "name": "Cavo 60CM USB2.0 cable ST-IMX258-USB2.0",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+60CM+USB2.0+cable+ST-IMX258-USB2.0"
      },
      {
        "id": "IDSYSB-013",
        "name": "Cavo micro scheda audio",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+micro+scheda+audio"
      },
      {
        "id": "IDSYSB-014",
        "name": "Cavo 6 pin led IdSysBox B",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+6+pin+led+IdSysBox+B"
      },
      {
        "id": "IDSYSB-015",
        "name": "Cavo altoparlante IdSysBox B",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 1.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+altoparlante+IdSysBox+B"
      },
      {
        "id": "IDSYSB-016",
        "name": "Mirino Metatron IdSysBox B",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 12.7,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Mirino+Metatron+IdSysBox+B"
      },
      {
        "id": "IDSYSB-017",
        "name": "Scheda IdSysBox - Master",
        "code": "",
        "category": "Elettronica",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 53.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Scheda+IdSysBox+-+Master"
      },
      {
        "id": "IDSYSB-018",
        "name": "Pannello Led Illuminatore Spis\\IdSysBox - H570",
        "code": "",
        "category": "Elettronica",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 21.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Pannello+Led+Illuminatore+Spis%5CIdSysBox+-+H570"
      },
      {
        "id": "IDSYSB-019",
        "name": "Frizione braccio luci",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Frizione+braccio+luci"
      },
      {
        "id": "IDSYSB-020",
        "name": "Tappo plastica scocca in ABS",
        "code": "",
        "category": "Accessori / consumabili",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Tappo+plastica+scocca+in+ABS"
      },
      {
        "id": "IDSYSB-021",
        "name": "Telecamera IdBox & Spis ST-IMX258-USB2.0",
        "code": "",
        "category": "Elettronica",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 68.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Telecamera+IdBox+%26+Spis+ST-IMX258-USB2.0"
      },
      {
        "id": "IDSYSB-022",
        "name": "Scatola IdSysBox Tipo B",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 7.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Scatola+IdSysBox+Tipo+B"
      },
      {
        "id": "IDSYSB-023",
        "name": "Kit interno scatola IdSysBox Tipo B",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+interno+scatola+IdSysBox+Tipo+B"
      },
      {
        "id": "IDSYSB-024",
        "name": "Alimentatore Full Power 24 Volt",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Alimentatore+Full+Power+24+Volt"
      },
      {
        "id": "IDSYSB-025",
        "name": "Adattatore Alimentatore Full Power 24 Volt USA",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Adattatore+Alimentatore+Full+Power+24+Volt+USA"
      },
      {
        "id": "IDSYSB-026",
        "name": "Adattatore Alimentatore Full Power 24 Volt UK",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Adattatore+Alimentatore+Full+Power+24+Volt+UK"
      },
      {
        "id": "IDSYSB-027",
        "name": "Adattatore Alimentatore Full Power 24 Volt AUS",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Adattatore+Alimentatore+Full+Power+24+Volt+AUS"
      },
      {
        "id": "IDSYSB-028",
        "name": "Adattatore Alimentatore Full Power 24 Volt EUR",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Adattatore+Alimentatore+Full+Power+24+Volt+EUR"
      },
      {
        "id": "IDSYSB-029",
        "name": "Manuale IdSysBox",
        "code": "",
        "category": "Accessori / consumabili",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Manuale+IdSysBox"
      },
      {
        "id": "IDSYSB-030",
        "name": "Cavo USB A B 1,5 mt",
        "code": "",
        "category": "Cablaggio / alimentazione",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 1.45,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+USB+A+B+1%2C5+mt"
      },
      {
        "id": "IDSYSB-031",
        "name": "Morsa da scrivania IdSysBox B",
        "code": "",
        "category": "Meccanica / parti custom",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 20.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Morsa+da+scrivania+IdSysBox+B"
      },
      {
        "id": "IDSYSB-032",
        "name": "Nastro vinilico 3M™ 471 - 3M-471-19-33/WH",
        "code": "",
        "category": "Accessori / consumabili",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 10.92,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Nastro+vinilico+3M%E2%84%A2+471+-+3M-471-19-33%2FWH"
      },
      {
        "id": "IDSYSB-033",
        "name": "Etichetta senso di rotazione",
        "code": "",
        "category": "Accessori / consumabili",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Etichetta+senso+di+rotazione"
      },
      {
        "id": "IDSYSB-034",
        "name": "Viti scocca IdBox & Display Spis",
        "code": "",
        "category": "Viteria",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.75,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Viti+scocca+IdBox+%26+Display+Spis"
      },
      {
        "id": "IDSYSB-035",
        "name": "Etichetta seriale IdSysBox",
        "code": "",
        "category": "Accessori / consumabili",
        "parent": "IdSysBox Tipo B",
        "quantity": "",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Etichetta+seriale+IdSysBox"
      }
    ]
  },
  {
    "name": "BEESCO",
    "productName": "BEESCO",
    "totalCost": 13501.5,
    "components": [
      {
        "id": "BEE-001",
        "name": "BEESCO",
        "code": "",
        "category": "root",
        "parent": "BEESCO",
        "quantity": "1",
        "cost": 10091.49,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=BEESCO+product+photo"
      },
      {
        "id": "BEE-002",
        "name": "Kit Vetri BEESCO",
        "code": "",
        "category": "kit",
        "parent": "BEESCO",
        "quantity": "1",
        "cost": 1900.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+Vetri+product+photo"
      },
      {
        "id": "BEE-003",
        "name": "Kit plastiche BEESCO",
        "code": "",
        "category": "kit",
        "parent": "BEESCO",
        "quantity": "1",
        "cost": 335.91,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+plastiche+product+photo"
      },
      {
        "id": "BEE-004",
        "name": "Kit viti BEESCO",
        "code": "",
        "category": "kit",
        "parent": "Kit viti BEESCO",
        "quantity": "1",
        "cost": 63.44,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+viti+product+photo"
      },
      {
        "id": "BEE-005",
        "name": "Vite M6x16 testa cilindrica brugola HEX 5mm DIN 912 B6X16/BN610-1233351",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "128",
        "cost": 10.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M6x16+testa+cilindrica+brugola+HEX+5mm+DIN+912+B6X16%2FBN610-1233351+product+photo"
      },
      {
        "id": "BEE-006",
        "name": "Vite M4x30 testa cilindrica brugola HEX 3mm DIN 912 M4X30/D912-A2",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "12",
        "cost": 0.6,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M4x30+testa+cilindrica+brugola+HEX+3mm+DIN+912+M4X30%2FD912-A2+product+photo"
      },
      {
        "id": "BEE-007",
        "name": "Vite M4x10 testa cilindrica Torx TX10 B4X10/BN20146-3233668",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "32",
        "cost": 11.84,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M4x10+testa+cilindrica+Torx+TX10+B4X10%2FBN20146-3233668+product+photo"
      },
      {
        "id": "BEE-008",
        "name": "Vite M6x10 testa cilindrica Torx TX20 B6X10/BN20146",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "56",
        "cost": 25.76,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M6x10+testa+cilindrica+Torx+TX20+B6X10%2FBN20146+product+photo"
      },
      {
        "id": "BEE-009",
        "name": "Vite M6x35 testa cilindrica brugola HEX 5mm DIN 912 M6X35/D912-A4",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "24",
        "cost": 3.84,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M6x35+testa+cilindrica+brugola+HEX+5mm+DIN+912+M6X35%2FD912-A4+product+photo"
      },
      {
        "id": "BEE-010",
        "name": "Vite M6x30 testa cilindrica Torx TX30 B6X30/BN15857",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "16",
        "cost": 3.52,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M6x30+testa+cilindrica+Torx+TX30+B6X30%2FBN15857+product+photo"
      },
      {
        "id": "BEE-011",
        "name": "Vite M5x40 testa cilindrica brugola HEX 4mm M5X40/D912-A2",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "8",
        "cost": 0.72,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M5x40+testa+cilindrica+brugola+HEX+4mm+M5X40%2FD912-A2+product+photo"
      },
      {
        "id": "BEE-012",
        "name": "Vite M3x16 testa cilindrica brugola HEX 2.5mm B3X16/BN11-1011995",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "8",
        "cost": 1.2,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M3x16+testa+cilindrica+brugola+HEX+2.5mm+B3X16%2FBN11-1011995+product+photo"
      },
      {
        "id": "BEE-013",
        "name": "Vite M3x12 testa sferica brugola HEX 2mm acciaio inox A2 B3X12/BN1593 1348744",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "8",
        "cost": 0.08,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M3x12+testa+sferica+brugola+HEX+2mm+acciaio+inox+A2+B3X12%2FBN1593+1348744+product+photo"
      },
      {
        "id": "BEE-014",
        "name": "Dado esagonale M6 acciaio inox A2 H 5mm M6/D934-A2",
        "code": "",
        "category": "dado",
        "parent": "Kit viti BEESCO",
        "quantity": "16",
        "cost": 0.32,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Dado+esagonale+M6+acciaio+inox+A2+H+5mm+M6%2FD934-A2+product+photo"
      },
      {
        "id": "BEE-015",
        "name": "Vite M8x40 testa cilindrica brugola HEX 6mm M8X40/D912-A2",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "24",
        "cost": 4.8,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M8x40+testa+cilindrica+brugola+HEX+6mm+M8X40%2FD912-A2+product+photo"
      },
      {
        "id": "BEE-016",
        "name": "Canotto distanziale cilindrico poliamide 5mm Øest 5mm FIX-3-5",
        "code": "",
        "category": "distanziale",
        "parent": "Kit viti BEESCO",
        "quantity": "8",
        "cost": 0.32,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Canotto+distanziale+cilindrico+poliamide+5mm+%C3%98est+5mm+FIX-3-5+product+photo"
      },
      {
        "id": "BEE-017",
        "name": "Vite M6x50 testa esagonale acciaio inox A2 M6X50/D933-A2",
        "code": "",
        "category": "vite",
        "parent": "Kit viti BEESCO",
        "quantity": "2",
        "cost": 0.2,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M6x50+testa+esagonale+acciaio+inox+A2+M6X50%2FD933-A2+product+photo"
      },
      {
        "id": "BEE-018",
        "name": "kit schede BEESCO",
        "code": "",
        "category": "kit",
        "parent": "kit schede BEESCO",
        "quantity": "1",
        "cost": 130.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=kit+schede+product+photo"
      },
      {
        "id": "BEE-019",
        "name": "Scheda controllo varchi EP455V0.1",
        "code": "",
        "category": "elettronica",
        "parent": "kit schede BEESCO",
        "quantity": "2",
        "cost": 130.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Scheda+controllo+varchi+EP455V0.1+product+photo"
      },
      {
        "id": "BEE-020",
        "name": "Kit meccanica BEESCO",
        "code": "",
        "category": "kit",
        "parent": "BEESCO",
        "quantity": "1",
        "cost": 4800.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+meccanica+product+photo"
      },
      {
        "id": "BEE-021",
        "name": "Kit cablaggio BEESCO",
        "code": "",
        "category": "kit",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "1",
        "cost": 556.99,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+cablaggio+product+photo"
      },
      {
        "id": "BEE-022",
        "name": "Conduttore 3x24AWG filo a trefoli Cu schermato foglio Al-PET",
        "code": "",
        "category": "cavo",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "40",
        "cost": 112.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Conduttore+3x24AWG+filo+a+trefoli+Cu+schermato+foglio+Al-PET+product+photo"
      },
      {
        "id": "BEE-023",
        "name": "JST 2.0 PH 3 Pin Connettore Spina Micro JST PH 2.0 3-Pin Maschio con 150mm 22AWG Cavo e Femmina",
        "code": "",
        "category": "connettore",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "24",
        "cost": 9.12,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=JST+2.0+PH+3+Pin+Connettore+Spina+Micro+JST+PH+2.0+3-Pin+Maschio+con+150mm+22AWG+Cavo+e+Femmina+product+photo"
      },
      {
        "id": "BEE-024",
        "name": "Patch cord U/FTP Cat 6a RJ45 1m",
        "code": "",
        "category": "cavo rete",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "2",
        "cost": 5.58,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Patch+cord+U%2FFTP+Cat+6a+RJ45+1m+product+photo"
      },
      {
        "id": "BEE-025",
        "name": "Patch cord F/UTP Cat 6 RJ45 4m",
        "code": "",
        "category": "cavo rete",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "2",
        "cost": 22.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Patch+cord+F%2FUTP+Cat+6+RJ45+4m+product+photo"
      },
      {
        "id": "BEE-026",
        "name": "Serrafilo a guida Entrelec 600V guida DIN azzurro W 6mm",
        "code": "",
        "category": "morsetto",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "5",
        "cost": 24.7,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Serrafilo+a+guida+Entrelec+600V+guida+DIN+azzurro+W+6mm+product+photo"
      },
      {
        "id": "BEE-027",
        "name": "Serrafilo a guida Entrelec 600V guida DIN grigio W 6mm",
        "code": "",
        "category": "morsetto",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "5",
        "cost": 12.35,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Serrafilo+a+guida+Entrelec+600V+guida+DIN+grigio+W+6mm+product+photo"
      },
      {
        "id": "BEE-028",
        "name": "Coperchio finale Entrelec grigio scuro",
        "code": "",
        "category": "accessorio morsetto",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "4",
        "cost": 4.92,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Coperchio+finale+Entrelec+grigio+scuro+product+photo"
      },
      {
        "id": "BEE-029",
        "name": "StarTech.com Cavo USB-C a USB-A M/M 4mt",
        "code": "",
        "category": "cavo usb",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "2",
        "cost": 34.96,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=StarTech.com+Cavo+USB-C+a+USB-A+M%2FM+4mt+product+photo"
      },
      {
        "id": "BEE-030",
        "name": "Waveshare 4-Ch USB 3.2 Gen1 HUB",
        "code": "",
        "category": "hub usb",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "1",
        "cost": 23.52,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Waveshare+4-Ch+USB+3.2+Gen1+HUB+product+photo"
      },
      {
        "id": "BEE-031",
        "name": "Arotelicht 24V Striscia LED COB RGB 5m",
        "code": "",
        "category": "led",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "0.2",
        "cost": 6.37,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Arotelicht+24V+Striscia+LED+COB+RGB+5m+product+photo"
      },
      {
        "id": "BEE-032",
        "name": "10M RGBW 5pin Cavo Elettrico di Prolunga Calibro 22 5 Core con Connettori per Striscia LED RGBW B09T3V69G1",
        "code": "",
        "category": "cavo led",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "1",
        "cost": 9.99,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=10M+RGBW+5pin+Cavo+Elettrico+di+Prolunga+Calibro+22+5+Core+con+Connettori+per+Striscia+LED+RGBW+B09T3V69G1+product+photo"
      },
      {
        "id": "BEE-033",
        "name": "Conduttore altoparlanti 2x1.5mm2 filo a trefoli CCA",
        "code": "",
        "category": "cavo audio",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "0.15",
        "cost": 5.4,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Conduttore+altoparlanti+2x1.5mm2+filo+a+trefoli+CCA+product+photo"
      },
      {
        "id": "BEE-034",
        "name": "Sensore fotoelettrico portata 200-1500mm analogici 50mA GP2Y0A02YK0F",
        "code": "",
        "category": "sensore",
        "parent": "Kit cablaggio BEESCO",
        "quantity": "24",
        "cost": 286.08,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Sensore+fotoelettrico+portata+200-1500mm+analogici+50mA+GP2Y0A02YK0F+product+photo"
      },
      {
        "id": "BEE-035",
        "name": "Kit motori BEESCO",
        "code": "",
        "category": "kit",
        "parent": "Kit motori BEESCO",
        "quantity": "1",
        "cost": 1950.72,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+motori+product+photo"
      },
      {
        "id": "BEE-036",
        "name": "Motore BEESCO",
        "code": "",
        "category": "motore",
        "parent": "Kit motori BEESCO",
        "quantity": "4",
        "cost": 1449.4,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Motore+product+photo"
      },
      {
        "id": "BEE-037",
        "name": "Driver BEESCO",
        "code": "",
        "category": "driver motore",
        "parent": "Kit motori BEESCO",
        "quantity": "4",
        "cost": 501.32,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Driver+product+photo"
      },
      {
        "id": "BEE-038",
        "name": "eGate BEESCO",
        "code": "",
        "category": "root",
        "parent": "eGate BEESCO",
        "quantity": "1",
        "cost": 354.43,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=eGate+product+photo"
      },
      {
        "id": "BEE-039",
        "name": "Kit schede eGate",
        "code": "",
        "category": "kit",
        "parent": "eGate BEESCO",
        "quantity": "1",
        "cost": 319.01,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+schede+eGate+product+photo"
      },
      {
        "id": "BEE-040",
        "name": "Scheda Audio - UPS Raspberry",
        "code": "",
        "category": "scheda",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 77.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Scheda+Audio+-+UPS+Raspberry+product+photo"
      },
      {
        "id": "BEE-041",
        "name": "Raspberry Pi 5 4GB RAM RP5-4GB",
        "code": "",
        "category": "single board computer",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 96.43,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Raspberry+Pi+5+4GB+RAM+RP5-4GB+product+photo"
      },
      {
        "id": "BEE-042",
        "name": "Raspberry Pi 5 Active Cooler RP5-ACT-COOL",
        "code": "",
        "category": "cooler",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 4.05,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Raspberry+Pi+5+Active+Cooler+RP5-ACT-COOL+product+photo"
      },
      {
        "id": "BEE-043",
        "name": "Raspberry Pi 5 RTC Battery RP5-RTC",
        "code": "",
        "category": "batteria rtc",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 4.05,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Raspberry+Pi+5+RTC+Battery+RP5-RTC+product+photo"
      },
      {
        "id": "BEE-044",
        "name": "LCD 3.2 4DLCD-32320240 Display IdBox 2.0",
        "code": "",
        "category": "display",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 22.37,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=LCD+3.2+4DLCD-32320240+Display+IdBox+2.0+product+photo"
      },
      {
        "id": "BEE-045",
        "name": "EP414LCR LCD control IdBox 2.0 ESP32",
        "code": "",
        "category": "scheda esp32",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 52.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=EP414LCR+LCD+control+IdBox+2.0+ESP32+product+photo"
      },
      {
        "id": "BEE-046",
        "name": "Pannello Led Illuminatore Spis IdSysBox H570",
        "code": "",
        "category": "pannello led",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 10.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Pannello+Led+Illuminatore+Spis+IdSysBox+H570+product+photo"
      },
      {
        "id": "BEE-047",
        "name": "Pannello Led Illuminatore eGate H570ir",
        "code": "",
        "category": "pannello led ir",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 14.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Pannello+Led+Illuminatore+eGate+H570ir+product+photo"
      },
      {
        "id": "BEE-048",
        "name": "EP414LCS LCD support IdBox 2.0",
        "code": "",
        "category": "supporto lcd",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 10.5,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=EP414LCS+LCD+support+IdBox+2.0+product+photo"
      },
      {
        "id": "BEE-049",
        "name": "Raspberry Pi Camera Module 2 NoIR",
        "code": "",
        "category": "camera",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 13.35,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Raspberry+Pi+Camera+Module+2+NoIR+product+photo"
      },
      {
        "id": "BEE-050",
        "name": "Raspberry Pi Camera Module 2",
        "code": "",
        "category": "camera",
        "parent": "Kit schede eGate",
        "quantity": "1",
        "cost": 13.79,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Raspberry+Pi+Camera+Module+2+product+photo"
      },
      {
        "id": "BEE-051",
        "name": "Kit viti e cavi eGate",
        "code": "",
        "category": "kit",
        "parent": "eGate BEESCO",
        "quantity": "1",
        "cost": 35.42,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Kit+viti+e+cavi+eGate+product+photo"
      },
      {
        "id": "BEE-052",
        "name": "Rpi camera cable standard mini 200mm Raspberry PI SC1892",
        "code": "",
        "category": "cavo camera",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 0.85,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Rpi+camera+cable+standard+mini+200mm+Raspberry+PI+SC1892+product+photo"
      },
      {
        "id": "BEE-053",
        "name": "Rpi camera cable standard mini 300mm Raspberry PI SC1129",
        "code": "",
        "category": "cavo camera",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 1.7,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Rpi+camera+cable+standard+mini+300mm+Raspberry+PI+SC1129+product+photo"
      },
      {
        "id": "BEE-054",
        "name": "Patch cord U/FTP Cat 6a RJ45 30cm CQ9011S",
        "code": "",
        "category": "cavo rete",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 2.3,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Patch+cord+U%2FFTP+Cat+6a+RJ45+30cm+CQ9011S+product+photo"
      },
      {
        "id": "BEE-055",
        "name": "Cavo USB 2.0 USB A spina USB C spina 0.3m bianco 480Mbps CU0250",
        "code": "",
        "category": "cavo usb",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 0.91,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+USB+2.0+USB+A+spina+USB+C+spina+0.3m+bianco+480Mbps+CU0250+product+photo"
      },
      {
        "id": "BEE-056",
        "name": "Cavo alimentazione scheda UPS Esp32 50 cm 705402CVBOX004",
        "code": "",
        "category": "cavo alimentazione",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 3.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+alimentazione+scheda+UPS+Esp32+50+cm+705402CVBOX004+product+photo"
      },
      {
        "id": "BEE-057",
        "name": "Cavo fili femmina PIN 2 0.2m 4A PVC nero-rosso KABX-2PFS-L200",
        "code": "",
        "category": "cavo",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 2.09,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+fili+femmina+PIN+2+0.2m+4A+PVC+nero-rosso+KABX-2PFS-L200+product+photo"
      },
      {
        "id": "BEE-058",
        "name": "Cavo 2x0.5mm2 fili DC 5.5/2.5 spina dritto nero 2m DC.CAB.4600.0200",
        "code": "",
        "category": "cavo alimentazione",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 3.87,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+2x0.5mm2+fili+DC+5.5%2F2.5+spina+dritto+nero+2m+DC.CAB.4600.0200+product+photo"
      },
      {
        "id": "BEE-059",
        "name": "Cavo USB 3.0 USB A spina su entrambi i lati nichelato 2m CONBH",
        "code": "",
        "category": "cavo usb",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 4.07,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+USB+3.0+USB+A+spina+su+entrambi+i+lati+nichelato+2m+CONBH+product+photo"
      },
      {
        "id": "BEE-060",
        "name": "Vite M2x6 testa cilindrica Torx TX06 acciaio inox A2 B2X6/BN15857",
        "code": "",
        "category": "vite",
        "parent": "Kit viti e cavi eGate",
        "quantity": "8",
        "cost": 0.24,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Vite+M2x6+testa+cilindrica+Torx+TX06+acciaio+inox+A2+B2X6%2FBN15857+product+photo"
      },
      {
        "id": "BEE-061",
        "name": "Filtro diffusore luci eGate STAMPA 3D",
        "code": "",
        "category": "stampa 3d",
        "parent": "Kit viti e cavi eGate",
        "quantity": "2",
        "cost": 5.94,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Filtro+diffusore+luci+eGate+STAMPA+3D+product+photo"
      },
      {
        "id": "BEE-062",
        "name": "Supporto TLC eGate STAMPA 3D",
        "code": "",
        "category": "stampa 3d",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 1.97,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Supporto+TLC+eGate+STAMPA+3D+product+photo"
      },
      {
        "id": "BEE-063",
        "name": "Distanziali filettati 10mm Filetto int M2.5 Filetto est M2.5 TFM-M2.5X10/DR222",
        "code": "",
        "category": "distanziale",
        "parent": "Kit viti e cavi eGate",
        "quantity": "8",
        "cost": 1.04,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Distanziali+filettati+10mm+Filetto+int+M2.5+Filetto+est+M2.5+TFM-M2.5X10%2FDR222+product+photo"
      },
      {
        "id": "BEE-064",
        "name": "Canotto distanziale cilindrico poliamide 5mm Øest 5mm FIX-3-5",
        "code": "",
        "category": "distanziale",
        "parent": "Kit viti e cavi eGate",
        "quantity": "4",
        "cost": 0.16,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Canotto+distanziale+cilindrico+poliamide+5mm+%C3%98est+5mm+FIX-3-5+product+photo"
      },
      {
        "id": "BEE-065",
        "name": "Distanziali filettati esagonale poliamide M2.5 Lungh 10mm TFF-M2.5X10/DR182",
        "code": "",
        "category": "distanziale",
        "parent": "Kit viti e cavi eGate",
        "quantity": "14",
        "cost": 7.28,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Distanziali+filettati+esagonale+poliamide+M2.5+Lungh+10mm+TFF-M2.5X10%2FDR182+product+photo"
      },
      {
        "id": "BEE-066",
        "name": "Cavo 6 pin led IdSysBox B",
        "code": "",
        "category": "cavo led",
        "parent": "Kit viti e cavi eGate",
        "quantity": "1",
        "cost": 0.0,
        "imageSearchUrl": "https://www.google.com/search?tbm=isch&q=Cavo+6+pin+led+IdSysBox+B+product+photo"
      }
    ]
  }
];
