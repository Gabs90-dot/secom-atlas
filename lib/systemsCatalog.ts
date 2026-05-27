export type SystemCatalogComponent = {
  name: string;
  code?: string;
  category?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
};

export type SystemCatalogItem = {
  name: string;
  productName: string;
  category?: string;
  totalCost: number;
  sourceFile?: string;
  summary?: string;
  tags?: string[];
  components: SystemCatalogComponent[];
};

export const systemsCatalog: SystemCatalogItem[] = [
  {
    "name": "IdBox A 2.0 - Plus",
    "productName": "IdBox A 2.0 - Plus",
    "category": "Identificazione / Box",
    "totalCost": 1176.83,
    "sourceFile": "IdBox A 2.0 - Plus.pdf",
    "summary": "Box identificazione con Raspberry Pi 5, gruppo ottico, 3 telecamere, LCD 3.2, UPS audio e carpenteria IdBox 2.0.",
    "tags": [
      "idbox",
      "a",
      "2.0",
      "plus"
    ],
    "components": [
      {
        "name": "Gruppo ottico IdBox 2.0 - Raspberry",
        "code": "GRP-IDBOX20-RPI",
        "category": "Ottica",
        "quantity": 1,
        "unitCost": 464.21,
        "totalCost": 464.21
      },
      {
        "name": "Raspberry Pi 5 4GB RAM",
        "code": "RP5-4GB",
        "category": "Computer",
        "quantity": 1,
        "unitCost": 96.43,
        "totalCost": 96.43
      },
      {
        "name": "Scheda Audio - UPS Raspberry",
        "code": "UPS-RPI-AUDIO",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 77.0,
        "totalCost": 77
      },
      {
        "name": "Telecamera IdBox & SPIS USB2.0",
        "code": "ST-IMX258-USB2.0",
        "category": "Telecamera",
        "quantity": 3,
        "unitCost": 34.0,
        "totalCost": 102
      },
      {
        "name": "LCD control IdBox 2.0 ESP32",
        "code": "EP414LCR",
        "category": "Display",
        "quantity": 1,
        "unitCost": 52.0,
        "totalCost": 52
      },
      {
        "name": "LCD 3.2 Display IdBox 2.0",
        "code": "4DLCD-32320240",
        "category": "Display",
        "quantity": 3,
        "unitCost": 22.37,
        "totalCost": 67.11
      },
      {
        "name": "LCD support IdBox 2.0",
        "code": "EP414LCS",
        "category": "Display",
        "quantity": 3,
        "unitCost": 10.5,
        "totalCost": 31.5
      },
      {
        "name": "Patch cord RJ45 30 cm",
        "code": "CQ9011S",
        "category": "Rete",
        "quantity": 2,
        "unitCost": 2.3,
        "totalCost": 4.6
      },
      {
        "name": "Cavo USB2.0 30/60 cm",
        "code": "ST-IMX258-USB2.0-CAVI",
        "category": "Cavi",
        "quantity": 3,
        "unitCost": 0.97,
        "totalCost": 2.91
      }
    ]
  },
  {
    "name": "IdBox A 2.0 - Gara IPZS",
    "productName": "IdBox A 2.0 - Gara IPZS",
    "category": "Identificazione / Box",
    "totalCost": 1103.99,
    "sourceFile": "IdBox A 2.0 - Gara IPZS.pdf",
    "summary": "Versione IPZS con carpenteria IdBox, gruppo ottico scheda master, 3 telecamere, LCD, cablaggi e LED.",
    "tags": [
      "idbox",
      "a",
      "2.0",
      "gara",
      "ipzs"
    ],
    "components": [
      {
        "name": "Carpenteria IdBox 2.0",
        "code": "SCM-A000561",
        "category": "Carpenteria",
        "quantity": 1,
        "unitCost": 535.0,
        "totalCost": 535
      },
      {
        "name": "Metacrilato IDBox 2.0",
        "code": "META-IDBOX20",
        "category": "Meccanica",
        "quantity": 1,
        "unitCost": 40.0,
        "totalCost": 40
      },
      {
        "name": "Gruppo ottico IdBox 2.0 - Scheda Master",
        "code": "GRP-IDBOX20-MASTER",
        "category": "Ottica",
        "quantity": 1,
        "unitCost": 332.86,
        "totalCost": 332.86
      },
      {
        "name": "Scheda IdSysBox Master USB aggiuntiva",
        "code": "IDSYS-MASTER-USB",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 56.0,
        "totalCost": 56
      },
      {
        "name": "Telecamera IdBox & SPIS USB2.0",
        "code": "ST-IMX258-USB2.0",
        "category": "Telecamera",
        "quantity": 3,
        "unitCost": 34.0,
        "totalCost": 102
      },
      {
        "name": "LCD control IdBox 2.0 ESP32",
        "code": "EP414LCR",
        "category": "Display",
        "quantity": 1,
        "unitCost": 52.0,
        "totalCost": 52
      },
      {
        "name": "LCD 3.2 Display IdBox 2.0",
        "code": "4DLCD-32320240",
        "category": "Display",
        "quantity": 3,
        "unitCost": 22.37,
        "totalCost": 67.11
      },
      {
        "name": "Striscia LED K2",
        "code": "K2-40-1920-24",
        "category": "Illuminazione",
        "quantity": 4,
        "unitCost": 15.0,
        "totalCost": 60
      }
    ]
  },
  {
    "name": "IdSysBox Tipo B",
    "productName": "IdSysBox Tipo B",
    "category": "Identificazione / Desk",
    "totalCost": 286.39,
    "sourceFile": "IdSysBox Tipo B.pdf",
    "summary": "Box desk con scheda master, speaker, pannelli LED, telecamere, cablaggi e alimentatore 24V.",
    "tags": [
      "idsysbox",
      "tipo",
      "b"
    ],
    "components": [
      {
        "name": "Scheda IdSysBox - Master",
        "code": "IDSYS-MASTER",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 53.0,
        "totalCost": 53
      },
      {
        "name": "Telecamera IdBox & SPIS USB2.0",
        "code": "ST-IMX258-USB2.0",
        "category": "Telecamera",
        "quantity": 2,
        "unitCost": 34.0,
        "totalCost": 68
      },
      {
        "name": "Pannello Led Illuminatore SPIS/IdSysBox",
        "code": "H570",
        "category": "Illuminazione",
        "quantity": 2,
        "unitCost": 10.5,
        "totalCost": 21
      },
      {
        "name": "Altoparlante FR 58 - 8 Ohm",
        "code": "FR58-8OHM",
        "category": "Audio",
        "quantity": 1,
        "unitCost": 5.21,
        "totalCost": 5.21
      },
      {
        "name": "Braccio luci cover Opalino",
        "code": "BRACCIO-LUCI-COVER",
        "category": "Meccanica",
        "quantity": 1,
        "unitCost": 15.56,
        "totalCost": 15.56
      },
      {
        "name": "Gommina scheda audio IdSysBox B",
        "code": "GOMMA-AUDIO-IDB",
        "category": "Meccanica",
        "quantity": 1,
        "unitCost": 18.52,
        "totalCost": 18.52
      },
      {
        "name": "Scatola IdSysBox Tipo B",
        "code": "SCATOLA-IDSB",
        "category": "Meccanica",
        "quantity": 1,
        "unitCost": 7.0,
        "totalCost": 7
      },
      {
        "name": "Alimentatore Full Power 24V",
        "code": "FULLPOWER-24V",
        "category": "Alimentazione",
        "quantity": 1,
        "unitCost": 5.97,
        "totalCost": 5.97
      }
    ]
  },
  {
    "name": "SPIS COMPLETO",
    "productName": "SPIS COMPLETO",
    "category": "SPIS",
    "totalCost": 12836.67,
    "sourceFile": "SPIS COMPLETO.pdf",
    "summary": "Sistema SPIS completo con roll-up, penisola, PC, monitor, UPS, stampante Lexmark, scanner Thales MS527, software MySpis/Winlase, testa SPIS, display e TLC.",
    "tags": [
      "spis",
      "completo"
    ],
    "components": [
      {
        "name": "Kit ROLL UP CON TELO",
        "code": "KIT-ROLLUP-SPIS",
        "category": "Struttura",
        "quantity": 1,
        "unitCost": 260.92,
        "totalCost": 260.92
      },
      {
        "name": "Penisola Secom con scanner MS527",
        "code": "PENISOLA-MS527",
        "category": "Penisola",
        "quantity": 1,
        "unitCost": 597.4,
        "totalCost": 597.4
      },
      {
        "name": "PC Winblue I5",
        "code": "PC-WINBLUE-I5",
        "category": "Computer",
        "quantity": 1,
        "unitCost": 800.0,
        "totalCost": 800
      },
      {
        "name": "Monitor Yashi 24\"",
        "code": "10.1078",
        "category": "Monitor",
        "quantity": 1,
        "unitCost": 55.04,
        "totalCost": 55.04
      },
      {
        "name": "UPS Atlantis 1000VA",
        "code": "42.950",
        "category": "Alimentazione",
        "quantity": 1,
        "unitCost": 48.86,
        "totalCost": 48.86
      },
      {
        "name": "Stampante Lexmark M3350",
        "code": "LEXMARK-M3350",
        "category": "Stampante",
        "quantity": 1,
        "unitCost": 1048.0,
        "totalCost": 1048
      },
      {
        "name": "Scanner Thales MS 527",
        "code": "MS527",
        "category": "Scanner",
        "quantity": 1,
        "unitCost": 3000.0,
        "totalCost": 3000
      },
      {
        "name": "Software MySpis",
        "code": "SW-MYSPIS",
        "category": "Software",
        "quantity": 1,
        "unitCost": 1000.97,
        "totalCost": 1000.97
      },
      {
        "name": "Software Winlase EVO",
        "code": "SW-WINLASE-EVO",
        "category": "Software",
        "quantity": 1,
        "unitCost": 1000.97,
        "totalCost": 1000.97
      },
      {
        "name": "KIT TESTA SPIS",
        "code": "KIT-TESTA-SPIS",
        "category": "Testa SPIS",
        "quantity": 1,
        "unitCost": 1048.19,
        "totalCost": 1048.19
      },
      {
        "name": "SSCB configurazione SPIS",
        "code": "SSCB-SPIS",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 88.0,
        "totalCost": 88
      },
      {
        "name": "KIT DISPLAY SPIS",
        "code": "KIT-DISPLAY-SPIS",
        "category": "Display",
        "quantity": 1,
        "unitCost": 137.03,
        "totalCost": 137.03
      }
    ]
  },
  {
    "name": "SPIS ALBANIA",
    "productName": "SPIS ALBANIA",
    "category": "SPIS",
    "totalCost": 9751.63,
    "sourceFile": "SPIS ALBANIA.pdf",
    "summary": "Configurazione SPIS Albania con roll-up, PC Winblue, monitor, UPS 1500VA, stampante Lexmark, quadro elettrico, software MySpis/Winlase, alimentatore 24V e cablaggi.",
    "tags": [
      "spis",
      "albania"
    ],
    "components": [
      {
        "name": "Kit ROLL UP CON TELO",
        "code": "KIT-ROLLUP-SPIS",
        "category": "Struttura",
        "quantity": 1,
        "unitCost": 260.92,
        "totalCost": 260.92
      },
      {
        "name": "PC Winblue I5",
        "code": "PC-WINBLUE-I5",
        "category": "Computer",
        "quantity": 1,
        "unitCost": 800.0,
        "totalCost": 800
      },
      {
        "name": "Monitor Yashi 24\"",
        "code": "10.1078",
        "category": "Monitor",
        "quantity": 1,
        "unitCost": 55.04,
        "totalCost": 55.04
      },
      {
        "name": "UPS Atlantis 1500VA",
        "code": "42.907",
        "category": "Alimentazione",
        "quantity": 1,
        "unitCost": 101.84,
        "totalCost": 101.84
      },
      {
        "name": "Stampante Lexmark M3350",
        "code": "LEXMARK-M3350",
        "category": "Stampante",
        "quantity": 1,
        "unitCost": 1048.0,
        "totalCost": 1048
      },
      {
        "name": "Quadro elettrico volante Secom",
        "code": "8050402QBPSPIS",
        "category": "Quadro elettrico",
        "quantity": 1,
        "unitCost": 160.0,
        "totalCost": 160
      },
      {
        "name": "Software MySpis",
        "code": "SW-MYSPIS",
        "category": "Software",
        "quantity": 1,
        "unitCost": 1000.97,
        "totalCost": 1000.97
      },
      {
        "name": "Software Winlase EVO",
        "code": "SW-WINLASE-EVO",
        "category": "Software",
        "quantity": 1,
        "unitCost": 1000.97,
        "totalCost": 1000.97
      },
      {
        "name": "KIT CABLAGGIO SPIS",
        "code": "KIT-CABLAGGIO-SPIS",
        "category": "Cablaggio",
        "quantity": 1,
        "unitCost": 197.8,
        "totalCost": 197.8
      },
      {
        "name": "KIT DISPLAY SPIS",
        "code": "KIT-DISPLAY-SPIS",
        "category": "Display",
        "quantity": 1,
        "unitCost": 137.03,
        "totalCost": 137.03
      },
      {
        "name": "KIT MECCANICHE SPIS & ACCESSORI",
        "code": "KIT-MECC-SPIS",
        "category": "Meccanica",
        "quantity": 1,
        "unitCost": 2047.83,
        "totalCost": 2047.83
      }
    ]
  },
  {
    "name": "Spis My",
    "productName": "Spis My",
    "category": "SPIS",
    "totalCost": 4774.87,
    "sourceFile": "Spis My.pdf",
    "summary": "SPIS MY con testa SPIS, Raspberry Pi 5, SSCB, pannelli LED, display 10.1 QLED, TLC full body, TLC SPIS e cablaggi.",
    "tags": [
      "spis",
      "my"
    ],
    "components": [
      {
        "name": "KIT TESTA SPIS",
        "code": "KIT-TESTA-SPIS",
        "category": "Testa SPIS",
        "quantity": 1,
        "unitCost": 1048.19,
        "totalCost": 1048.19
      },
      {
        "name": "Raspberry Pi 5 4GB RAM",
        "code": "RP5-4GB",
        "category": "Computer",
        "quantity": 1,
        "unitCost": 96.43,
        "totalCost": 96.43
      },
      {
        "name": "Micro SD 64GB Kingston",
        "code": "MICROSD-64-KINGSTON",
        "category": "Storage",
        "quantity": 1,
        "unitCost": 27.48,
        "totalCost": 27.48
      },
      {
        "name": "SSCB configurazione SPIS",
        "code": "SSCB-SPIS",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 88.0,
        "totalCost": 88
      },
      {
        "name": "Pannello Led Illuminatore SPIS/IdSysBox",
        "code": "H570",
        "category": "Illuminazione",
        "quantity": 4,
        "unitCost": 10.5,
        "totalCost": 42
      },
      {
        "name": "Carpenteria Testa SPIS",
        "code": "SCM-A000383",
        "category": "Carpenteria",
        "quantity": 1,
        "unitCost": 420.0,
        "totalCost": 420
      },
      {
        "name": "KIT DISPLAY SPIS",
        "code": "KIT-DISPLAY-SPIS",
        "category": "Display",
        "quantity": 1,
        "unitCost": 137.03,
        "totalCost": 137.03
      },
      {
        "name": "KIT TLC Full Body",
        "code": "KIT-TLC-FULLBODY",
        "category": "Telecamera",
        "quantity": 1,
        "unitCost": 64.93,
        "totalCost": 64.93
      },
      {
        "name": "Telecamera IdBox & SPIS USB2.0",
        "code": "ST-IMX258-USB2.0",
        "category": "Telecamera",
        "quantity": 1,
        "unitCost": 34.0,
        "totalCost": 34
      },
      {
        "name": "KIT TLC SPIS",
        "code": "KIT-TLC-SPIS",
        "category": "Telecamera",
        "quantity": 1,
        "unitCost": 216.55,
        "totalCost": 216.55
      }
    ]
  },
  {
    "name": "Spis Tenenze 2025",
    "productName": "Spis Tenenze 2025",
    "category": "SPIS",
    "totalCost": 2462.25,
    "sourceFile": "Spis Tenenze 2025.pdf",
    "summary": "SPIS Tenenze 2025 con lampade E27, telecamera Visionlink, UPS Atlantis 1100VA, PC Winblue, scheda CCM, monitor Yashi, stampante Lexmark e cablaggi.",
    "tags": [
      "spis",
      "tenenze",
      "2025"
    ],
    "components": [
      {
        "name": "Lampada E27 220 Volt",
        "code": "LAMP-E27-220V",
        "category": "Illuminazione",
        "quantity": 4,
        "unitCost": 5.9,
        "totalCost": 23.6
      },
      {
        "name": "Telecamera Visionlink DFK 37AUR0521",
        "code": "DFK37AUR0521-HF12.5HA",
        "category": "Telecamera",
        "quantity": 1,
        "unitCost": 377.0,
        "totalCost": 377
      },
      {
        "name": "UPS Atlantis 1100VA",
        "code": "42.9320",
        "category": "Alimentazione",
        "quantity": 1,
        "unitCost": 53.96,
        "totalCost": 53.96
      },
      {
        "name": "PC Winblue I5",
        "code": "PC-WINBLUE-I5",
        "category": "Computer",
        "quantity": 1,
        "unitCost": 800.0,
        "totalCost": 800
      },
      {
        "name": "Scheda CCM Crypto Control Module",
        "code": "CCM",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 42.0,
        "totalCost": 42
      },
      {
        "name": "Monitor Yashi 24\"",
        "code": "10.1078",
        "category": "Monitor",
        "quantity": 1,
        "unitCost": 55.04,
        "totalCost": 55.04
      },
      {
        "name": "Stampante Lexmark M3350",
        "code": "LEXMARK-M3350",
        "category": "Stampante",
        "quantity": 1,
        "unitCost": 1048.0,
        "totalCost": 1048
      },
      {
        "name": "Logitech MK120 Tastiera e Mouse",
        "code": "LOGITECH-MK120",
        "category": "Periferiche",
        "quantity": 1,
        "unitCost": 16.39,
        "totalCost": 16.39
      }
    ]
  },
  {
    "name": "SEEKS KIOSK",
    "productName": "SEEKS KIOSK",
    "category": "Kiosk",
    "totalCost": 4565.74,
    "sourceFile": "SEEKS KIOSK.pdf",
    "summary": "Kiosk SEEKS basato su IdBox A 2.0 Plus, gruppo ottico Raspberry, tre telecamere, LCD, carpenteria IdBox, LED e cablaggi.",
    "tags": [
      "seeks",
      "kiosk"
    ],
    "components": [
      {
        "name": "IdBox A 2.0 - Plus",
        "code": "IDBOX-A20-PLUS",
        "category": "Sottosistema",
        "quantity": 1,
        "unitCost": 1176.83,
        "totalCost": 1176.83
      },
      {
        "name": "Gruppo ottico IdBox 2.0 - Raspberry",
        "code": "GRP-IDBOX20-RPI",
        "category": "Ottica",
        "quantity": 1,
        "unitCost": 464.21,
        "totalCost": 464.21
      },
      {
        "name": "Raspberry Pi 5 4GB RAM",
        "code": "RP5-4GB",
        "category": "Computer",
        "quantity": 1,
        "unitCost": 96.43,
        "totalCost": 96.43
      },
      {
        "name": "Scheda Audio - UPS Raspberry",
        "code": "UPS-RPI-AUDIO",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 77.0,
        "totalCost": 77
      },
      {
        "name": "Telecamera IdBox & SPIS USB2.0",
        "code": "ST-IMX258-USB2.0",
        "category": "Telecamera",
        "quantity": 3,
        "unitCost": 34.0,
        "totalCost": 102
      },
      {
        "name": "Carpenteria IdBox 2.0",
        "code": "SCM-A000561",
        "category": "Carpenteria",
        "quantity": 1,
        "unitCost": 535.0,
        "totalCost": 535
      },
      {
        "name": "Striscia Led K2",
        "code": "K2-40-1920-24",
        "category": "Illuminazione",
        "quantity": 4,
        "unitCost": 15.0,
        "totalCost": 60
      }
    ]
  },
  {
    "name": "Server Kiosk",
    "productName": "Server Kiosk",
    "category": "Kiosk",
    "totalCost": 2653.07,
    "sourceFile": "Server Kiosk.pdf",
    "summary": "Server Kiosk con server HPE P71375-425 32GB RAM e monitor Philips LCD VA LED 21.5.",
    "tags": [
      "server",
      "kiosk"
    ],
    "components": [
      {
        "name": "Server HPE P71375-425 32GB RAM",
        "code": "P71375-425",
        "category": "Server",
        "quantity": 1,
        "unitCost": 2600.13,
        "totalCost": 2600.13
      },
      {
        "name": "Monitor Philips LCD VA LED 21.5\"",
        "code": "25.405",
        "category": "Monitor",
        "quantity": 1,
        "unitCost": 52.94,
        "totalCost": 52.94
      }
    ]
  },
  {
    "name": "Work Station Kiosk",
    "productName": "Work Station Kiosk",
    "category": "Kiosk",
    "totalCost": 877.74,
    "sourceFile": "Work Station Kiosk.pdf",
    "summary": "Workstation Kiosk con PC HP 400 G9 i7-14700 16GB DDR5 512SSD e monitor Philips 31.5.",
    "tags": [
      "work",
      "station",
      "kiosk"
    ],
    "components": [
      {
        "name": "PC HP 400 G9 i7-14700 16GB DDR5 512SSD",
        "code": "9M8P3AT / 06.3034",
        "category": "Computer",
        "quantity": 1,
        "unitCost": 721.71,
        "totalCost": 721.71
      },
      {
        "name": "Monitor Philips LCD VA LED 31.5\"",
        "code": "25.5032",
        "category": "Monitor",
        "quantity": 1,
        "unitCost": 156.03,
        "totalCost": 156.03
      }
    ]
  },
  {
    "name": "Smartfad",
    "productName": "Smartfad",
    "category": "FAD",
    "totalCost": 101.65,
    "sourceFile": "Smartfad.pdf",
    "summary": "Dispositivo Smartfad con scheda M337, cover, tastierino, batteria Li-Ion 18650, clip adesiva e lente Smartfad/Biofad.",
    "tags": [
      "smartfad"
    ],
    "components": [
      {
        "name": "Scheda Smartfad",
        "code": "M337",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 68.0,
        "totalCost": 68
      },
      {
        "name": "Cover superiore e inferiore SMARTFAD",
        "code": "COVER-SMARTFAD",
        "category": "Plastica",
        "quantity": 1,
        "unitCost": 3.65,
        "totalCost": 3.65
      },
      {
        "name": "Tastierino adesivo SMARTFAD",
        "code": "TAST-SMARTFAD",
        "category": "Interfaccia",
        "quantity": 1,
        "unitCost": 10.55,
        "totalCost": 10.55
      },
      {
        "name": "Batteria Li-Ion 18650 3500mAh",
        "code": "LIION-18650-3500",
        "category": "Batteria",
        "quantity": 1,
        "unitCost": 5.92,
        "totalCost": 5.92
      },
      {
        "name": "Lente Smartfad & Biofad 2",
        "code": "F-D-04 / C-L-03",
        "category": "Ottica",
        "quantity": 1,
        "unitCost": 10.5,
        "totalCost": 10.5
      }
    ]
  },
  {
    "name": "Biofad 2",
    "productName": "Biofad 2",
    "category": "FAD",
    "totalCost": 735.18,
    "sourceFile": "biofad 2.pdf",
    "summary": "Biofad 2 con scheda elettronica, batterie Li-Ion, USB smartphone PCB, SanDisk Ultra Fit, kit plastiche, lettore MRZ, NFC reader, sensore single-finger e telecamera.",
    "tags": [
      "biofad",
      "2"
    ],
    "components": [
      {
        "name": "Scheda elettronica Biofad 2",
        "code": "BIOFAD2-BOARD",
        "category": "Elettronica",
        "quantity": 1,
        "unitCost": 138.0,
        "totalCost": 138
      },
      {
        "name": "Batteria Li-Ion 18650 3500mAh",
        "code": "LIION-18650-3500",
        "category": "Batteria",
        "quantity": 2,
        "unitCost": 5.92,
        "totalCost": 11.84
      },
      {
        "name": "Kit plastiche Biofad 2",
        "code": "KIT-PLASTICHE-BIOFAD2",
        "category": "Plastica",
        "quantity": 1,
        "unitCost": 135.0,
        "totalCost": 135
      },
      {
        "name": "Lettore MRZ Biofad 2",
        "code": "OCR310-E",
        "category": "Lettore MRZ",
        "quantity": 1,
        "unitCost": 230.0,
        "totalCost": 230
      },
      {
        "name": "Small NFC Reader Module Biofad 2",
        "code": "ACM1252U",
        "category": "NFC",
        "quantity": 1,
        "unitCost": 27.8,
        "totalCost": 27.8
      },
      {
        "name": "Danno Single-Finger TFT OEM Biofad 2",
        "code": "DN1110M-E00",
        "category": "Fingerprint",
        "quantity": 1,
        "unitCost": 125.0,
        "totalCost": 125
      },
      {
        "name": "Telecamera Biofad 2 USB2.0",
        "code": "ST30-298AF",
        "category": "Telecamera",
        "quantity": 1,
        "unitCost": 36.0,
        "totalCost": 36
      }
    ]
  },
  {
    "name": "BEESCO",
    "productName": "BEESCO",
    "category": "Porti / Varco",
    "totalCost": 10198.57,
    "sourceFile": "beesco.pdf",
    "summary": "Sistema BEESCO con kit vetri, plastiche, viti, meccanica, cablaggio, conduttori schermati e patch cord.",
    "tags": [
      "beesco"
    ],
    "components": [
      {
        "name": "Kit vetri BEESCO",
        "code": "KIT-VETRI-BEESCO",
        "category": "Vetri",
        "quantity": 1,
        "unitCost": 1900.0,
        "totalCost": 1900
      },
      {
        "name": "Kit plastiche BEESCO",
        "code": "KIT-PLASTICHE-BEESCO",
        "category": "Plastica",
        "quantity": 1,
        "unitCost": 335.91,
        "totalCost": 335.91
      },
      {
        "name": "Kit viti BEESCO",
        "code": "KIT-VITI-BEESCO",
        "category": "Viti",
        "quantity": 1,
        "unitCost": 63.44,
        "totalCost": 63.44
      },
      {
        "name": "Kit meccanica BEESCO",
        "code": "KIT-MECCANICA-BEESCO",
        "category": "Meccanica",
        "quantity": 1,
        "unitCost": 4800.0,
        "totalCost": 4800
      },
      {
        "name": "Kit cablaggio BEESCO",
        "code": "KIT-CABLAGGIO-BEESCO",
        "category": "Cablaggio",
        "quantity": 1,
        "unitCost": 556.99,
        "totalCost": 556.99
      },
      {
        "name": "Conduttore 3x24AWG schermato",
        "code": "COND-3X24AWG",
        "category": "Cavi",
        "quantity": 40,
        "unitCost": 2.8,
        "totalCost": 112
      },
      {
        "name": "Patch cord U/FTP Cat 6a 1m",
        "code": "GOOBAY-74332",
        "category": "Rete",
        "quantity": 2,
        "unitCost": 2.79,
        "totalCost": 5.58
      }
    ]
  }
];

export default systemsCatalog;
