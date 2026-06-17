"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import LoginScreen from "@/components/atlas/LoginScreen";
import { useAtlasAuth } from "@/components/atlas/AuthProvider";
import { canViewModule } from "@/lib/auth";
import type { AtlasTenant } from "@/lib/tenant";
import { getStoredTenantSlug, storeTenantSlug } from "@/lib/tenant";
import AtlasAppFrame from "@/components/atlas/layout/AtlasAppFrame";
import SlaContractsManager from "@/components/atlas/layout/SlaContractsManager";
import AtlasWorkspaceContent from "@/components/atlas/layout/AtlasWorkspaceContent";
import { createAtlasTabGroups } from "@/components/atlas/layout/atlasNavigation";
import { ATLAS_LOGO_CARD_IMAGE } from "@/components/atlas/layout/atlasLogoImage";

import { CalendarDays, CheckCircle2, X } from "lucide-react";

import type { AtlasTicketCategory, AtlasTicketStatus } from "@/lib/atlasTypes";
import {
  INITIAL_BUDGET,
  atlasStatusToDbStatus,
  contracts,
  initialInventory,
  materials,
  technicians,
  ticketCategoryOptions,
  ticketStatusOptions,
} from "@/lib/atlasConstants";
import {
  euro,
  getContractStatus,
  getInventoryStatus,
  materialCost,
  normalizeSiteRegion,
} from "@/lib/atlasUtils";
import { syncTicketToGlpi as syncTicketToGlpiService } from "@/services/glpi";
import {
  getBudgetRemaining as calculateBudgetRemaining,
  getBudgetSpent as calculateBudgetSpent,
  getBudgetTotal as calculateBudgetTotal,
  getTicketContract as getTicketContractFromService,
  getTicketTypeFromMap,
} from "@/services/budget";
import {
  buildEditableContracts,
  getSelectedContract,
} from "@/services/contracts";

type AtlasSlaContractProfile = {
  key: string;
  category: string;
  customerType: string;
  durationMonths: string;
  warrantyMonths: string;
  phoneSupport: string;
  preventiveOnsite: string;
  extraordinaryOnsite: string;
  sparePartsIncluded: string;
  blockingResponse: string;
  nonblockingResponse: string;
  pickupShipping: string;
  serviceHours: string;
  serviceDays: string;
  driveLink: string;
  commercialNotes: string;
  summary: string;
  aliases: string;
  keywords: string;
  matchPriority: number;
  parentCustomer: string;
  childCustomers: string;
  isActive: boolean;
};

const SLA_CONTRACT_FIELDS: Array<{ key: keyof AtlasSlaContractProfile; label: string; rows?: number; wide?: boolean }> = [
  { key: "category", label: "Categoria Cliente" },
  { key: "customerType", label: "Tipologia Cliente", wide: true },
  { key: "parentCustomer", label: "Cliente padre" },
  { key: "childCustomers", label: "Clienti / figli / sedi collegate", rows: 3, wide: true },
  { key: "durationMonths", label: "Durata contratto (mesi)" },
  { key: "warrantyMonths", label: "Garanzia (mesi)" },
  { key: "phoneSupport", label: "Assistenza telefonica" },
  { key: "preventiveOnsite", label: "Intervento preventivo on site / ordinaria manutenzione", rows: 3, wide: true },
  { key: "extraordinaryOnsite", label: "Intervento straordinario on site / su chiamata", rows: 3, wide: true },
  { key: "sparePartsIncluded", label: "Parti di ricambio incluse - escluso consumabili", rows: 3, wide: true },
  { key: "blockingResponse", label: "Risposta guasto bloccante" },
  { key: "nonblockingResponse", label: "Risposta anomalia non bloccante" },
  { key: "pickupShipping", label: "Servizio di ritiro e spedizione" },
  { key: "serviceHours", label: "Orario di servizio" },
  { key: "serviceDays", label: "Giorni di servizio" },
  { key: "driveLink", label: "Link dettaglio contratto / Drive Secom", rows: 2, wide: true },
  { key: "commercialNotes", label: "Note commerciali", rows: 4, wide: true },
  { key: "summary", label: "Riassunto operativo", rows: 4, wide: true },
  { key: "aliases", label: "Alias ricerca", rows: 3, wide: true },
  { key: "keywords", label: "Keyword match", rows: 3, wide: true },
  { key: "matchPriority", label: "Priorità match" },
];

const SLA_BASE_CONTRACT_PROFILES: AtlasSlaContractProfile[] = [
  {
    key: "ministero-questure",
    category: "MINISTERO DELL'INTERNO",
    customerType: "QUESTURE",
    parentCustomer: "MINISTERO DELL'INTERNO",
    childCustomers: "Questure",
    durationMonths: "N/D",
    warrantyMonths: "N/D",
    phoneSupport: "N/D",
    preventiveOnsite: "N/D",
    extraordinaryOnsite: "N/D",
    sparePartsIncluded: "N/D",
    blockingResponse: "N/D",
    nonblockingResponse: "N/D",
    pickupShipping: "N/D",
    serviceHours: "N/D",
    serviceDays: "N/D",
    driveLink: "N/D",
    commercialNotes: "",
    summary: "Profilo ministeriale generico. Dati SLA da verificare su contratto specifico.",
    aliases: "ministero, questure, questura, interno",
    keywords: "ministero interno questure",
    matchPriority: 50,
    isActive: true,
  },
  {
    key: "ministero-ps-lazio-umbria",
    category: "MINISTERO DELL'INTERNO",
    customerType: "PS LAZIO/UMBRIA",
    parentCustomer: "MINISTERO DELL'INTERNO",
    childCustomers: "PS Lazio; PS Umbria",
    durationMonths: "N/D",
    warrantyMonths: "N/D",
    phoneSupport: "SI",
    preventiveOnsite: "NO",
    extraordinaryOnsite: "SI",
    sparePartsIncluded: "SI (fino a 100,00 € per lampade, UPS, numeratore, scheda elettronica SPIS)",
    blockingResponse: "N/D",
    nonblockingResponse: "N/D",
    pickupShipping: "N/D",
    serviceHours: "N/D",
    serviceDays: "N/D",
    driveLink: "N/D",
    commercialNotes: "",
    summary: "Assistenza telefonica e straordinaria attiva; ricambi coperti fino a soglia indicata.",
    aliases: "ps lazio, ps umbria, polizia stato lazio, polizia stato umbria",
    keywords: "ps lazio umbria",
    matchPriority: 70,
    isActive: true,
  },
  {
    key: "polizia-frontiera-spis-my",
    category: "MINISTERO DELL'INTERNO",
    customerType: "POLIZIA DI FRONTIERA Fornitura 2025 / SPIS MY",
    parentCustomer: "MINISTERO DELL'INTERNO",
    childCustomers: "Polizia di Frontiera",
    durationMonths: "36",
    warrantyMonths: "24",
    phoneSupport: "SI",
    preventiveOnsite: "NO",
    extraordinaryOnsite: "SI",
    sparePartsIncluded: "SI",
    blockingResponse: "12 ORE",
    nonblockingResponse: "24 ORE",
    pickupShipping: "SI",
    serviceHours: "9:00-18:00 e Sabato 9:00-13:00",
    serviceDays: "Lun-Sab fino alle 13:00",
    driveLink: "",
    commercialNotes: "",
    summary: "Contratto Frontiere SPIS MY con assistenza telefonica, straordinaria, ricambi e ritiro/spedizione inclusi.",
    aliases: "frontiere, polizia frontiera, spis my frontiere",
    keywords: "frontiera frontiere spis my",
    matchPriority: 85,
    isActive: true,
  },
  {
    key: "polizia-ferroviaria-spis-my",
    category: "MINISTERO DELL'INTERNO",
    customerType: "POLIZIA FERROVIARIA Fornitura 2026 / SPIS MY",
    parentCustomer: "MINISTERO DELL'INTERNO",
    childCustomers: "Polizia Ferroviaria; POLFER",
    durationMonths: "24",
    warrantyMonths: "24",
    phoneSupport: "SI",
    preventiveOnsite: "NO",
    extraordinaryOnsite: "SI",
    sparePartsIncluded: "SI",
    blockingResponse: "7",
    nonblockingResponse: "14",
    pickupShipping: "SI",
    serviceHours: "09:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "Contratto POLFER SPIS MY: ricambi, intervento straordinario e ritiro/spedizione inclusi.",
    aliases: "polfer, polizia ferroviaria, spis my",
    keywords: "polfer ferroviaria spis my",
    matchPriority: 85,
    isActive: true,
  },
  {
    key: "hotspot-albania-2024-2026",
    category: "MINISTERO DELL'INTERNO",
    customerType: "HOTSPOT ALBANIA 2024-2026",
    parentCustomer: "MINISTERO DELL'INTERNO",
    childCustomers: "Hotspot Albania",
    durationMonths: "24",
    warrantyMonths: "SCADUTA",
    phoneSupport: "SI",
    preventiveOnsite: "NO",
    extraordinaryOnsite: "SI",
    sparePartsIncluded: "SI",
    blockingResponse: "5",
    nonblockingResponse: "10",
    pickupShipping: "SI",
    serviceHours: "09:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "Hotspot Albania: garanzia scaduta, assistenza telefonica e straordinaria attive.",
    aliases: "albania, hotspot albania",
    keywords: "hotspot albania",
    matchPriority: 70,
    isActive: true,
  },
  {
    key: "carabinieri-provinciali-gruppo-vecchio-spis",
    category: "CARABINIERI",
    customerType: "CARABINIERI PROVINCIALI/GRUPPO VECCHIO SPIS contratto triennale 2024-2026",
    parentCustomer: "CARABINIERI",
    childCustomers: "Comandi Provinciali; Gruppi Carabinieri",
    durationMonths: "12",
    warrantyMonths: "—",
    phoneSupport: "SI",
    preventiveOnsite: "SI, solo Comandi Provinciali e Gruppo",
    extraordinaryOnsite: "SI, previa autorizzazione dell'uff. AES",
    sparePartsIncluded: "Decurtabili fino a 80K € annui, per determinati componenti come da nota allegata",
    blockingResponse: "7?",
    nonblockingResponse: "14?",
    pickupShipping: "SI",
    serviceHours: "09:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "Vecchio SPIS per Provinciali/Gruppi: manutenzione preventiva prevista solo per Comandi Provinciali e Gruppi; straordinaria previa autorizzazione AES.",
    aliases: "carabinieri provinciali, comando provinciale carabinieri, gruppo carabinieri, com prov cc",
    keywords: "carabinieri provinciale gruppo vecchio spis",
    matchPriority: 95,
    isActive: true,
  },
  {
    key: "carabinieri-compagnie-vecchio-spis",
    category: "CARABINIERI",
    customerType: "CARABINIERI COMPAGNIE VECCHIO SPIS contratto triennale 2024-2026",
    parentCustomer: "CARABINIERI",
    childCustomers: "Compagnie Carabinieri; Tenenze; Stazioni se agganciate a Compagnia",
    durationMonths: "12",
    warrantyMonths: "—",
    phoneSupport: "SI",
    preventiveOnsite: "NO",
    extraordinaryOnsite: "SI, previa autorizzazione dell'uff. AES",
    sparePartsIncluded: "Decurtabili fino a 80K € annui, per determinati componenti come da nota allegata",
    blockingResponse: "7?",
    nonblockingResponse: "14?",
    pickupShipping: "SI",
    serviceHours: "09:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "Vecchio SPIS per Compagnie: nessuna preventiva, straordinaria previa autorizzazione AES, ricambi decurtabili dal plafond.",
    aliases: "compagnia carabinieri, comp cc, comp. cc, tenenza carabinieri, stazione carabinieri",
    keywords: "carabinieri compagnie vecchio spis",
    matchPriority: 100,
    isActive: true,
  },
  {
    key: "carabinieri-nuovo-spis-my",
    category: "CARABINIERI",
    customerType: "CARABINIERI NUOVO SPIS MY - PENISOLA ESCLUSA",
    parentCustomer: "CARABINIERI",
    childCustomers: "Nuovo SPIS MY Carabinieri",
    durationMonths: "24",
    warrantyMonths: "24",
    phoneSupport: "SI",
    preventiveOnsite: "NO",
    extraordinaryOnsite: "SI",
    sparePartsIncluded: "SI",
    blockingResponse: "7?",
    nonblockingResponse: "14?",
    pickupShipping: "SI",
    serviceHours: "08:30/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "Nuovo SPIS MY Carabinieri con 24 mesi di garanzia, ricambi e spedizione inclusi.",
    aliases: "carabinieri nuovo spis my",
    keywords: "carabinieri nuovo spis my",
    matchPriority: 90,
    isActive: true,
  },
  {
    key: "comuni-polizia-locale",
    category: "COMUNI",
    customerType: "POLIZIA LOCALE/MUNICIPALE/PROVINCIALE",
    parentCustomer: "COMUNI",
    childCustomers: "Polizia Locale; Polizia Municipale; Polizia Provinciale",
    durationMonths: "12/24/36",
    warrantyMonths: "—",
    phoneSupport: "SI",
    preventiveOnsite: "SI, nr. 2 annuali, 1 a semestre",
    extraordinaryOnsite: "SI, nr. 1 annuale",
    sparePartsIncluded: "SI",
    blockingResponse: "Non definito < 5gg",
    nonblockingResponse: "Non definito < 10gg",
    pickupShipping: "SI",
    serviceHours: "9:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "Comuni/Polizie locali: due preventive annuali, una straordinaria annuale, ricambi e spedizione inclusi.",
    aliases: "comuni, polizia locale, polizia municipale, polizia provinciale",
    keywords: "comuni polizia locale municipale provinciale",
    matchPriority: 90,
    isActive: true,
  },
  {
    key: "estero-san-marino-gendarmeria",
    category: "ESTERO",
    customerType: "SAN MARINO - GENDARMERIA",
    parentCustomer: "ESTERO",
    childCustomers: "San Marino; Gendarmeria",
    durationMonths: "12",
    warrantyMonths: "—",
    phoneSupport: "SI",
    preventiveOnsite: "SI, nr. 2 annuali, 1 a semestre",
    extraordinaryOnsite: "SI, nr. 1 annuale",
    sparePartsIncluded: "SI",
    blockingResponse: "Non definito < 5gg",
    nonblockingResponse: "Non definito < 10gg",
    pickupShipping: "SI",
    serviceHours: "9:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "Gendarmeria San Marino: preventive semestrali, straordinaria annuale, ricambi inclusi.",
    aliases: "san marino, gendarmeria",
    keywords: "san marino gendarmeria",
    matchPriority: 80,
    isActive: true,
  },
  {
    key: "rfi-aula-sepa",
    category: "RFI",
    customerType: "AULA SEPA",
    parentCustomer: "RFI",
    childCustomers: "Aula SEPA",
    durationMonths: "48",
    warrantyMonths: "—",
    phoneSupport: "SI",
    preventiveOnsite: "SI, nr. 2 annuali, 1 a semestre",
    extraordinaryOnsite: "SI",
    sparePartsIncluded: "SI (ad esclusione di quanto riportato nell'allegato)",
    blockingResponse: "2",
    nonblockingResponse: "7",
    pickupShipping: "SI",
    serviceHours: "09:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "RFI Aula SEPA: SLA stretto, preventive semestrali, ricambi secondo allegato.",
    aliases: "rfi, aula sepa, sepa",
    keywords: "rfi aula sepa",
    matchPriority: 90,
    isActive: true,
  },
  {
    key: "rfi-webvime",
    category: "RFI",
    customerType: "WEBVIME",
    parentCustomer: "RFI",
    childCustomers: "Webvime",
    durationMonths: "12",
    warrantyMonths: "—",
    phoneSupport: "SI",
    preventiveOnsite: "NO",
    extraordinaryOnsite: "SI, come da allegato contratto",
    sparePartsIncluded: "NO",
    blockingResponse: "—",
    nonblockingResponse: "—",
    pickupShipping: "—",
    serviceHours: "8:00 - 18:00",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "WEBVIME: assistenza telefonica e straordinaria secondo allegato, ricambi esclusi.",
    aliases: "webvime, rfi webvime",
    keywords: "webvime rfi",
    matchPriority: 95,
    isActive: true,
  },
  {
    key: "pa-privato-smartfad",
    category: "PA/PRIVATO",
    customerType: "SMARTFAD care-pack",
    parentCustomer: "PA/PRIVATO",
    childCustomers: "SmartFAD",
    durationMonths: "12/24/36",
    warrantyMonths: "—",
    phoneSupport: "SI",
    preventiveOnsite: "NO",
    extraordinaryOnsite: "NO",
    sparePartsIncluded: "SI",
    blockingResponse: "7",
    nonblockingResponse: "14",
    pickupShipping: "SI",
    serviceHours: "09:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "SmartFAD care-pack: ricambi e spedizione inclusi, nessun intervento on-site programmato.",
    aliases: "smartfad, care pack, pa privato",
    keywords: "smartfad care-pack",
    matchPriority: 75,
    isActive: true,
  },
  {
    key: "porti-seeeks-beesco-genova",
    category: "PORTI",
    customerType: "SEEKS/BEESCO GENOVA",
    parentCustomer: "PORTI",
    childCustomers: "Genova",
    durationMonths: "12",
    warrantyMonths: "12",
    phoneSupport: "SI",
    preventiveOnsite: "SI",
    extraordinaryOnsite: "NON OBBLIGATORIO",
    sparePartsIncluded: "Sostituzione delle sole componenti danneggiate",
    blockingResponse: "2",
    nonblockingResponse: "4",
    pickupShipping: "SI",
    serviceHours: "08:30/17:27",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    summary: "PORTI Genova: preventiva inclusa, straordinaria non obbligatoria, sostituzione componenti danneggiate.",
    aliases: "porti, seeks, beesco, genova",
    keywords: "seeks beesco genova porti",
    matchPriority: 85,
    isActive: true,
  },
  {
    key: "porti-seeeks-beesco-trieste",
    category: "PORTI",
    customerType: "SEEKS/BEESCO TRIESTE",
    parentCustomer: "PORTI",
    childCustomers: "Trieste",
    durationMonths: "36",
    warrantyMonths: "36",
    phoneSupport: "SI",
    preventiveOnsite: "SI",
    extraordinaryOnsite: "NON OBBLIGATORIO",
    sparePartsIncluded: "Sostituzione delle sole componenti danneggiate",
    blockingResponse: "2",
    nonblockingResponse: "4",
    pickupShipping: "SI",
    serviceHours: "08:30/17:28",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    summary: "PORTI Trieste: garanzia 36 mesi, preventiva inclusa, sostituzione sole componenti danneggiate.",
    aliases: "porti, seeks, beesco, trieste",
    keywords: "seeks beesco trieste porti",
    matchPriority: 85,
    isActive: true,
  },
  {
    key: "porti-seeeks-beesco-savona-t2",
    category: "PORTI",
    customerType: "SEEKS/BEESCO SAVONA T2",
    parentCustomer: "PORTI",
    childCustomers: "Savona T2",
    durationMonths: "24",
    warrantyMonths: "24",
    phoneSupport: "SI",
    preventiveOnsite: "SI",
    extraordinaryOnsite: "NON OBBLIGATORIO",
    sparePartsIncluded: "Sostituzione delle sole componenti danneggiate",
    blockingResponse: "2",
    nonblockingResponse: "4",
    pickupShipping: "SI",
    serviceHours: "08:30/17:29",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    summary: "PORTI Savona T2: garanzia 24 mesi, preventiva inclusa, sostituzione componenti danneggiate.",
    aliases: "porti, seeks, beesco, savona t2",
    keywords: "seeks beesco savona t2 porti",
    matchPriority: 85,
    isActive: true,
  },
  {
    key: "porti-seeeks-beesco-savona-t1",
    category: "PORTI",
    customerType: "SEEKS/BEESCO SAVONA T1",
    parentCustomer: "PORTI",
    childCustomers: "Savona T1",
    durationMonths: "24",
    warrantyMonths: "24",
    phoneSupport: "SI",
    preventiveOnsite: "SI",
    extraordinaryOnsite: "NON OBBLIGATORIO",
    sparePartsIncluded: "Sostituzione delle sole componenti danneggiate",
    blockingResponse: "2",
    nonblockingResponse: "4",
    pickupShipping: "SI",
    serviceHours: "08:30/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    summary: "PORTI Savona T1: garanzia 24 mesi, preventiva inclusa, sostituzione componenti danneggiate.",
    aliases: "porti, seeks, beesco, savona t1",
    keywords: "seeks beesco savona t1 porti",
    matchPriority: 85,
    isActive: true,
  },
  {
    key: "porti-seeeks-beesco-civitavecchia-vespucci-arrivi",
    category: "PORTI",
    customerType: "SEEKS/BEESCO CIVITAVECCHIA VESPUCCI ARRIVI",
    parentCustomer: "PORTI",
    childCustomers: "Civitavecchia Vespucci Arrivi",
    durationMonths: "12",
    warrantyMonths: "12",
    phoneSupport: "SI",
    preventiveOnsite: "SI",
    extraordinaryOnsite: "NON OBBLIGATORIO",
    sparePartsIncluded: "Sostituzione delle sole componenti danneggiate",
    blockingResponse: "2",
    nonblockingResponse: "4",
    pickupShipping: "SI",
    serviceHours: "08:30/17:31",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    summary: "PORTI Civitavecchia Vespucci Arrivi: garanzia 12 mesi, preventiva inclusa.",
    aliases: "porti, seeks, beesco, civitavecchia, vespucci arrivi",
    keywords: "seeks beesco civitavecchia vespucci arrivi porti",
    matchPriority: 85,
    isActive: true,
  },
  {
    key: "porti-seeeks-beesco-civitavecchia-vespucci-partenze",
    category: "PORTI",
    customerType: "SEEKS/BEESCO CIVITAVECCHIA VESPUCCI PARTENZE",
    parentCustomer: "PORTI",
    childCustomers: "Civitavecchia Vespucci Partenze",
    durationMonths: "12",
    warrantyMonths: "12",
    phoneSupport: "SI",
    preventiveOnsite: "SI",
    extraordinaryOnsite: "NON OBBLIGATORIO",
    sparePartsIncluded: "Sostituzione delle sole componenti danneggiate",
    blockingResponse: "2",
    nonblockingResponse: "4",
    pickupShipping: "SI",
    serviceHours: "08:30/17:32",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    summary: "PORTI Civitavecchia Vespucci Partenze: garanzia 12 mesi, preventiva inclusa.",
    aliases: "porti, seeks, beesco, civitavecchia, vespucci partenze",
    keywords: "seeks beesco civitavecchia vespucci partenze porti",
    matchPriority: 85,
    isActive: true,
  },
  {
    key: "porti-seeeks-beesco-civitavecchia-bramante",
    category: "PORTI",
    customerType: "SEEKS/BEESCO CIVITAVECCHIA BRAMANTE",
    parentCustomer: "PORTI",
    childCustomers: "Civitavecchia Bramante",
    durationMonths: "12",
    warrantyMonths: "12",
    phoneSupport: "SI",
    preventiveOnsite: "SI",
    extraordinaryOnsite: "NON OBBLIGATORIO",
    sparePartsIncluded: "Sostituzione delle sole componenti danneggiate",
    blockingResponse: "2",
    nonblockingResponse: "4",
    pickupShipping: "SI",
    serviceHours: "08:30/17:33",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    summary: "PORTI Civitavecchia Bramante: garanzia 12 mesi, preventiva inclusa.",
    aliases: "porti, seeks, beesco, civitavecchia, bramante",
    keywords: "seeks beesco civitavecchia bramante porti",
    matchPriority: 85,
    isActive: true,
  },
];

function createEmptySlaContractProfile(): AtlasSlaContractProfile {
  return {
    key: `custom-${Date.now()}`,
    category: "",
    customerType: "",
    parentCustomer: "",
    childCustomers: "",
    durationMonths: "",
    warrantyMonths: "",
    phoneSupport: "SI",
    preventiveOnsite: "",
    extraordinaryOnsite: "",
    sparePartsIncluded: "",
    blockingResponse: "",
    nonblockingResponse: "",
    pickupShipping: "",
    serviceHours: "09:00/17:30",
    serviceDays: "Lun-Ven (festivi esclusi)",
    driveLink: "",
    commercialNotes: "",
    summary: "",
    aliases: "",
    keywords: "",
    matchPriority: 50,
    isActive: true,
  };
}

function contractCell(value: any) {
  return String(value ?? "").replaceAll("\n", " ").trim();
}

function escapeHtml(value: any) {
  return contractCell(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}



type PublicCustomerEntityOption = {
  id: string;
  customerId: string;
  name: string;
  completeName?: string | null;
  glpiEntityId?: number | string | null;
};

type PublicCustomerOption = {
  id: string;
  name: string;
};

type TicketFormSourceCustomer = {
  id?: string | number | null;
  name?: string | null;
};

type TicketFormSourceSite = {
  id?: string | number | null;
  name?: string | null;
  region?: string | null;
  entity?: string | null;
  city?: string | null;
  customer_id?: string | null;
  customerId?: string | null;
  customer_entity_id?: string | null;
  customerEntityId?: string | null;
  glpi_entity_id?: string | number | null;
  glpiEntityId?: string | number | null;
  glpi_entity_path?: string | null;
  complete_name?: string | null;
};

type CustomerRegistrationPayload = {
  email: string;
  password: string;
  displayName: string;
  fiscalCode: string;
  customerId: string;
  customerEntityId: string;
  registrationCode: string;
};

const CUSTOMER_AUTH_DEFAULT_ROLE = "cliente_user";

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

function toPositiveNumberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function toNullableString(value: unknown) {
  const text = String(value || "").trim();
  return text ? text : null;
}

export default function Home() {
  const {
    user: currentUser,
    loading: authLoading,
    refreshUser,
    signOut,
  } = useAtlasAuth();

  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [customerOptions, setCustomerOptions] = useState<PublicCustomerOption[]>([]);
  const [customerEntityOptions, setCustomerEntityOptions] = useState<PublicCustomerEntityOption[]>([]);
  const [customerOptionsLoading, setCustomerOptionsLoading] = useState(false);
  const [customerOptionsLoaded, setCustomerOptionsLoaded] = useState(false);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authActionMessage, setAuthActionMessage] = useState("");
  const [registerForm, setRegisterForm] = useState<CustomerRegistrationPayload>({
    email: "",
    password: "",
    displayName: "",
    fiscalCode: "",
    customerId: "",
    customerEntityId: "",
    registrationCode: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");

  async function loadCustomerOptions() {
  setCustomerOptionsLoading(true);
  setAuthActionMessage("");

  try {
    const response = await fetch("/api/auth/customer-register", {
      method: "GET",
      cache: "no-store",
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "Errore caricamento clienti.");
    }

    setCustomerOptions(
      (result.customers || []).map((customer: any) => ({
        id: String(customer.id),
        name: customer.name || "Cliente senza nome",
      })),
    );

    setCustomerEntityOptions(
      (result.entities || []).map((entity: any) => ({
        id: String(entity.id),
        customerId: String(entity.customerId || entity.customer_id || ""),
        name: entity.name || "Entità senza nome",
        completeName: entity.completeName || entity.complete_name || null,
        glpiEntityId: entity.glpiEntityId || entity.glpi_entity_id || null,
      })),
    );
  } catch (error: any) {
    console.error(error);
    setAuthActionMessage(error?.message || "Errore caricamento clienti.");
  } finally {
    setCustomerOptionsLoaded(true);
    setCustomerOptionsLoading(false);
  }
}

  useEffect(() => {
    if (!currentUser && authMode === "register" && !customerOptionsLoaded && !customerOptionsLoading) {
      loadCustomerOptions();
    }
  }, [authMode, currentUser, customerOptionsLoaded, customerOptionsLoading]);

  const availableCustomerEntities = useMemo(() => {
    if (!registerForm.customerId) return [];
    return customerEntityOptions.filter((entity) => entity.customerId === registerForm.customerId);
  }, [customerEntityOptions, registerForm.customerId]);

  async function handleCustomerRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = cleanEmail(registerForm.email);
    const password = registerForm.password.trim();
    const displayName = registerForm.displayName.trim();
    const fiscalCode = registerForm.fiscalCode.trim().toUpperCase();
    const customerId = registerForm.customerId;
    const customerEntityId = registerForm.customerEntityId;
    const registrationCode = registerForm.registrationCode.trim().toUpperCase();

    if (!email || !password || !displayName || !fiscalCode || !customerId || !customerEntityId || !registrationCode) {
      setAuthActionMessage("Compila email, password, nome, codice fiscale, cliente, entità e codice invito.");
      return;
    }

    if (password.length < 8) {
      setAuthActionMessage("La password deve avere almeno 8 caratteri.");
      return;
    }

    setAuthActionLoading(true);
    setAuthActionMessage("");

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: {
            display_name: displayName,
            fiscal_code: fiscalCode,
            customer_id: customerId,
            customer_entity_id: customerEntityId,
            role: CUSTOMER_AUTH_DEFAULT_ROLE,
          },
        },
      });

      if (error) throw error;

      const response = await fetch("/api/auth/customer-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          fiscalCode,
          customerId,
          customerEntityId,
          registrationCode,
          userId: data.user?.id || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Profilo cliente non creato.");
      }

      setAuthActionMessage("Registrazione creata. Controlla la mail e conferma l'account.");
      setRegisterForm({
        email: "",
        password: "",
        displayName: "",
        fiscalCode: "",
        customerId: "",
        customerEntityId: "",
        registrationCode: "",
      });
    } catch (error: any) {
      console.error(error);
      setAuthActionMessage(error?.message || "Errore registrazione cliente.");
    } finally {
      setAuthActionLoading(false);
    }
  }

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = cleanEmail(forgotEmail);

    if (!email) {
      setAuthActionMessage("Inserisci la mail.");
      return;
    }

    setAuthActionLoading(true);
    setAuthActionMessage("");

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback`,
      });

      if (error) throw error;

      setAuthActionMessage("Se l'utenza esiste, riceverai una mail per il reset password.");
      setForgotEmail("");
    } catch (error: any) {
      console.error(error);
      setAuthActionMessage(error?.message || "Errore invio reset password.");
    } finally {
      setAuthActionLoading(false);
    }
  }

  function renderCustomerRegisterScreen() {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 py-10 text-white">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ATLAS</p>
              <h1 className="mt-3 text-3xl font-black">Registrazione cliente</h1>
              <p className="mt-2 text-sm font-bold text-slate-400">
                Crea un accesso cliente. Il ruolo viene forzato a Cliente User.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthActionMessage("");
              }}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/15"
            >
              Torna al login
            </button>
          </div>

          <form onSubmit={handleCustomerRegistration} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={registerForm.email}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email"
                type="email"
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold outline-none focus:border-blue-500"
              />
              <input
                value={registerForm.password}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Password minimo 8 caratteri"
                type="password"
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={registerForm.displayName}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, displayName: event.target.value }))}
                placeholder="Nome e cognome"
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold outline-none focus:border-blue-500"
              />
              <input
                value={registerForm.fiscalCode}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, fiscalCode: event.target.value.toUpperCase() }))}
                placeholder="Codice fiscale"
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold uppercase outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={registerForm.customerId}
                onChange={(event) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    customerId: event.target.value,
                    customerEntityId: "",
                    registrationCode: "",
                  }))
                }
                disabled={customerOptionsLoading}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold outline-none focus:border-blue-500"
              >
                <option value="">
                  {customerOptionsLoading
                    ? "Caricamento clienti..."
                    : customerOptions.length === 0
                    ? "Nessun cliente disponibile"
                    : "Seleziona cliente"}
                </option>
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              <select
                value={registerForm.customerEntityId}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, customerEntityId: event.target.value, registrationCode: "" }))}
                disabled={!registerForm.customerId || customerOptionsLoading}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold outline-none focus:border-blue-500 disabled:opacity-60"
              >
                <option value="">
                  {!registerForm.customerId
                    ? "Prima seleziona il cliente"
                    : availableCustomerEntities.length === 0
                    ? "Nessuna entità disponibile"
                    : "Seleziona comando / sede"}
                </option>
                {availableCustomerEntities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.completeName || entity.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={registerForm.registrationCode}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, registrationCode: event.target.value.toUpperCase() }))}
              placeholder="Codice invito autorizzato per questa sede"
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold uppercase outline-none focus:border-blue-500"
            />

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-bold text-blue-100">
              Registrazione enterprise: il profilo viene creato come <b>cliente_user</b> e viene associato solo al cliente/comando autorizzato dal codice invito.
            </div>

            {authActionMessage && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm font-bold text-slate-200">
                {authActionMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={authActionLoading}
              className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authActionLoading ? "Creazione account..." : "Crea account cliente"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  function renderForgotPasswordScreen() {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 py-10 text-white">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ATLAS</p>
              <h1 className="mt-3 text-3xl font-black">Password dimenticata</h1>
              <p className="mt-2 text-sm font-bold text-slate-400">
                Inserisci la mail e riceverai il link di reset.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthActionMessage("");
              }}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/15"
            >
              Login
            </button>
          </div>

          <form onSubmit={handleForgotPassword} className="mt-6 grid gap-4">
            <input
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold outline-none focus:border-blue-500"
            />

            {authActionMessage && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm font-bold text-slate-200">
                {authActionMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={authActionLoading}
              className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authActionLoading ? "Invio..." : "Invia reset password"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const [tickets, setTickets] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerEntities, setCustomerEntities] = useState<any[]>([]);
  const [tenants, setTenants] = useState<AtlasTenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<AtlasTenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);

  const [site, setSite] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [region, setRegion] = useState("");
  const [entity, setEntity] = useState("");
  const [city, setCity] = useState("");
  const [siteId, setSiteId] = useState<number | null>(null);
  const [selectedGlpiEntityId, setSelectedGlpiEntityId] = useState<number | null>(null);
  const [selectedGlpiEntityPath, setSelectedGlpiEntityPath] = useState("");

  const [ticketTitle, setTicketTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [technician, setTechnician] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [ticketType, setTicketType] =
    useState<AtlasTicketCategory>("ordinaria");
  const [ticketStatus, setTicketStatus] = useState<AtlasTicketStatus>("nuova");
  const [ticketTypesById, setTicketTypesById] = useState<
    Record<string, AtlasTicketCategory>
  >({});
  const [creatingTicket, setCreatingTicket] = useState(false);

  const [closingNotes, setClosingNotes] = useState("");
  const [futureNeeds, setFutureNeeds] = useState("");
  const [resolved, setResolved] = useState(true);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);
  const [selectedTicketWorkspace, setSelectedTicketWorkspace] = useState<any | null>(null);
  const [ticketFormReturnTarget, setTicketFormReturnTarget] = useState<{ activeTab: any; mobileView: any } | null>(null);
  const [refreshingTickets, setRefreshingTickets] = useState(false);

  const [filterTechnician, setFilterTechnician] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  const [activeTab, setActiveTab] = useState<
    | "home"
    | "dispatch"
    | "piani"
    | "webvime"
    | "todo"
    | "manuali"
    | "activity"
    | "analytics"
    | "ai"
    | "customerPortal"
    | "operativo"
    | "budget"
    | "mappa"
    | "registro"
    | "clienti"
    | "contratti"
    | "sistemi"
    | "magazzino"
    | "calendario"
    | "contatti"
    | "utenti"
    | "glpiImport"
    | "designLab"
  >("home");

  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [systemSearch, setSystemSearch] = useState("");

  const [budgetVisible, setBudgetVisible] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("atlas-theme") || "dark";
    }

    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("atlas-theme", theme);
  }, [theme]);

  const [uiMode, setUiMode] = useState<"classic" | "executive">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-ui-mode");
      return saved === "executive" ? "executive" : "classic";
    }

    return "classic";
  });

  useEffect(() => {
    localStorage.setItem("atlas-ui-mode", uiMode);
  }, [uiMode]);

  const [operatorAvatar, setOperatorAvatar] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("atlas-operator-avatar-v1") || "";
  });

  async function resizeOperatorAvatar(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Impossibile leggere l'immagine."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Formato immagine non valido."));
        image.onload = () => {
          const size = 256;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Canvas non disponibile."));
            return;
          }

          const side = Math.min(image.width, image.height);
          const sourceX = Math.max(0, (image.width - side) / 2);
          const sourceY = Math.max(0, (image.height - side) / 2);
          context.clearRect(0, 0, size, size);
          context.drawImage(image, sourceX, sourceY, side, side, 0, 0, size, size);
          resolve(canvas.toDataURL("image/jpeg", 0.86));
        };
        image.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleOperatorAvatarUpload(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showMessage("Carica un file immagine valido.", "error");
      return;
    }

    try {
      const dataUrl = await resizeOperatorAvatar(file);
      setOperatorAvatar(dataUrl);
      window.localStorage.setItem("atlas-operator-avatar-v1", dataUrl);
      showMessage("Foto profilo aggiornata.", "success");
    } catch (error: any) {
      showMessage(error?.message || "Errore caricamento foto profilo.", "error");
    }
  }

  function switchUiMode(mode: "classic" | "executive") {
    setUiMode(mode);
    localStorage.setItem("atlas-ui-mode", mode);

    if (mode === "executive") {
      setTheme("dark");
      if (activeTab === "designLab") setActiveTab("home");
      if (mobileView === "designLab") setMobileView("home");
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadTodoNewCount() {
      const { count, error } = await supabase
        .from("todo_tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");

      if (!mounted || error) return;
      setTodoNewCount(count || 0);
    }

    loadTodoNewCount();
    window.addEventListener("atlas-todo-updated", loadTodoNewCount);
    const interval = window.setInterval(loadTodoNewCount, 30000);

    return () => {
      mounted = false;
      window.removeEventListener("atlas-todo-updated", loadTodoNewCount);
      window.clearInterval(interval);
    };
  }, []);
  const [budget, setBudget] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-budget");
      return saved ? Number(saved) : INITIAL_BUDGET;
    }

    return INITIAL_BUDGET;
  });

  const [budgets, setBudgets] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-budgets");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // fallback sotto
        }
      }
    }

    return [
      {
        id: "BUD-CARABINIERI-2024-2026",
        contractName: "CARABINIERI ASSISTENZA 2024-2026",
        entity: "Carabinieri",
        value: INITIAL_BUDGET,
        notes:
          "Budget iniziale collegato al contratto Carabinieri Assistenza 2024-2026",
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  const [clientSearch, setClientSearch] = useState("");
  const [customerInvitePanelOpen, setCustomerInvitePanelOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [contractOverrides, setContractOverrides] = useState<any>({});
  const [customSlaContracts, setCustomSlaContracts] = useState<AtlasSlaContractProfile[]>([]);
  const [contractSearchText, setContractSearchText] = useState("");
  const [contractCategoryFilter, setContractCategoryFilter] = useState("Tutte");
  const [selectedSlaContractKeys, setSelectedSlaContractKeys] = useState<Record<string, boolean>>({});
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [editingSlaContractKey, setEditingSlaContractKey] = useState<string | null>(null);
  const [slaContractForm, setSlaContractForm] = useState<AtlasSlaContractProfile>(() => createEmptySlaContractProfile());
  const [inventory, setInventory] = useState<any[]>(initialInventory);
  const [inventorySearch, setInventorySearch] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactClientSearch, setContactClientSearch] = useState("");
  const [contactClient, setContactClient] = useState<any | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
    tag: "Personale",
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(
    null,
  );
  const [calendarTechnician, setCalendarTechnician] = useState("");
  const [calendarFilterTechnician, setCalendarFilterTechnician] = useState("");
  const [calendarSiteSearch, setCalendarSiteSearch] = useState("");
  const [calendarSite, setCalendarSite] = useState<any | null>(null);
  const [calendarTime, setCalendarTime] = useState("");
  const [editingCalendarTicketId, setEditingCalendarTicketId] = useState<
    string | null
  >(null);
  const [expandedCalendarTicketId, setExpandedCalendarTicketId] = useState<
    string | null
  >(null);
  const [mobileView, setMobileView] = useState<
    | "home"
    | "dispatch"
    | "piani"
    | "webvime"
    | "todo"
    | "manuali"
    | "activity"
    | "analytics"
    | "ai"
    | "customerPortal"
    | "operativo"
    | "calendario"
    | "budget"
    | "mappa"
    | "registro"
    | "clienti"
    | "contratti"
    | "sistemi"
    | "contatti"
    | "magazzino"
    | "utenti"
    | "designLab"
  >("home");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [todoNewCount, setTodoNewCount] = useState(0);
  const [manualReminders, setManualReminders] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-reminders");

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }

    return [];
  });
  const [calendarReminderEnabled, setCalendarReminderEnabled] = useState(false);
  const [calendarReminderNote, setCalendarReminderNote] = useState("");
  const [mobileInventoryFormOpen, setMobileInventoryFormOpen] = useState(false);
  const [editingInventoryIndex, setEditingInventoryIndex] = useState<
    number | null
  >(null);
  const [inventoryForm, setInventoryForm] = useState({
    id: "",
    name: "",
    value: "0",
    quantity: "0",
  });
  const [mobileBudgetFormOpen, setMobileBudgetFormOpen] = useState(false);
  const [budgetClientSearch, setBudgetClientSearch] = useState("");
  const [budgetClient, setBudgetClient] = useState<any | null>(null);
  const [budgetForm, setBudgetForm] = useState({
    contractName: "CARABINIERI ASSISTENZA 2024-2026",
    value: String(budget),
    notes: "",
  });
  const [mobileCalendarFormOpen, setMobileCalendarFormOpen] = useState(false);
  const [mobileContactFormOpen, setMobileContactFormOpen] = useState(false);
  const [mobileContactFilter, setMobileContactFilter] = useState<
    "Tutti" | "Personale" | "Fornitore" | "Istituzione" | "Preferiti"
  >("Tutti");

  useEffect(() => {
    async function loadTenants() {
      setTenantLoading(true);

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.log(error);
        setTenantLoading(false);
        return;
      }

      const list = (data || []) as AtlasTenant[];
      const storedSlug = getStoredTenantSlug();
      const selected =
        list.find((tenant) => tenant.slug === storedSlug) ||
        list.find((tenant) => tenant.slug === "secom") ||
        list[0] ||
        null;

      setTenants(list);
      setActiveTenant(selected);

      if (selected?.slug) {
        storeTenantSlug(selected.slug);
      }

      setTenantLoading(false);
    }

    loadTenants();
  }, []);

  useEffect(() => {
    if (currentUser?.role === "cliente") {
      setActiveTab("customerPortal");
      setMobileView("customerPortal");
    }
  }, [currentUser?.role]);

  useEffect(() => {
    const savedContracts = localStorage.getItem("atlas-contract-overrides");
    if (savedContracts) setContractOverrides(JSON.parse(savedContracts));

    const savedInventory = localStorage.getItem("atlas-inventory");
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    const savedContacts = localStorage.getItem("atlas-contacts");
    if (savedContacts) setContacts(JSON.parse(savedContacts));
    const savedTicketTypes = localStorage.getItem("atlas-ticket-types");
    if (savedTicketTypes) setTicketTypesById(JSON.parse(savedTicketTypes));

    const savedCustomSlaContracts = localStorage.getItem("atlas-custom-sla-contracts");
    if (savedCustomSlaContracts) {
      try {
        setCustomSlaContracts(JSON.parse(savedCustomSlaContracts));
      } catch {
        setCustomSlaContracts([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!activeTenant?.id) return;

    async function loadSites() {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("tenant_id", activeTenant?.id)
        .order("name");

      if (error) {
        console.log(error);
        return;
      }

      setSites((data || []).map(normalizeSiteRegion));
    }

    async function loadCustomers() {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("tenant_id", activeTenant?.id)
        .order("name", { ascending: true });

      if (error) {
        console.log(error);
        return;
      }

      setCustomers(data || []);
    }

    async function loadCustomerEntities() {
      const { data, error } = await supabase
        .from("v_customer_entities_active")
        .select("*")
        .eq("tenant_id", activeTenant?.id)
        .order("display_name", { ascending: true });

      if (error) {
        console.log(error);
        setCustomerEntities([]);
        return;
      }

      setCustomerEntities(data || []);
    }

    async function loadTickets() {
      const { data, error } = await supabase
        .from("v_operational_tickets")
        .select("*")
        .eq("tenant_id", activeTenant?.id)
        .or("glpi_entity_path.is.null,glpi_entity_path.not.ilike.%webvime%")
        .order("opened_at", { ascending: false, nullsFirst: false })
        .order("glpi_ticket_id", { ascending: false, nullsFirst: false })
        .range(0, 999);

      if (error) {
        console.log(error);
        return;
      }

      const formatted =
        data?.map((t) => ({
          id: t.id,
          glpi_ticket_id: t.glpi_ticket_id || null,
          glpiTicketId: t.glpi_ticket_id || null,
          site: t.site,
          glpi_entity_path: t.glpi_entity_path || "",
          glpiEntityPath: t.glpi_entity_path || "",
          region: t.region,
          entity: t.entity || "",
          city: t.city || "",
          problem: t.problem,
          materialIds: t.materials || [],
          technician: t.technician,
          status: t.status,
          date: t.intervention_date || "",
          resolved: t.resolved,
          futureNeeds: t.future_needs || "",
          closingNotes: t.closing_notes || "",
          slot: t.slot || "",
          openedAt: t.opened_at || t.created_at || "",
          importedAt: t.imported_at || "",
          expectedCloseDate: t.expected_close_date || "",
          closedAt: t.closed_at || "",
          urgent: Boolean(t.urgent),
          siteId: t.site_id || null,
site_id: t.site_id || null,
          customerId: t.customer_id || null,
          tenantId: t.tenant_id || null,
          tenant_id: t.tenant_id || null,
          ticketType:
            (typeof window !== "undefined"
              ? JSON.parse(
                  localStorage.getItem("atlas-ticket-types") || "{}",
                )?.[String(t.id)]
              : undefined) ||
            t.ticket_type ||
            "ordinaria",
        })) || [];

      setTickets(formatted);
    }

    loadTickets();
    loadSites();
    loadCustomers();
    loadCustomerEntities();
  }, [activeTenant?.id]);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  async function syncTicketToGlpi(ticket: any) {
    return syncTicketToGlpiService({
      ticket,
      editableContracts,
      supabaseClient: supabase,
      showMessage,
    });
  }

  const editableContracts = buildEditableContracts(
    contracts,
    contractOverrides,
  );

  const slaContractProfiles = useMemo(() => {
    const merged = [...SLA_BASE_CONTRACT_PROFILES, ...customSlaContracts];

    return merged.map((profile) => ({
      ...profile,
      ...(contractOverrides?.[profile.key] || {}),
    }));
  }, [contractOverrides, customSlaContracts]);

  const slaContractCategories = useMemo(
    () => [
      "Tutte",
      ...Array.from(new Set(slaContractProfiles.map((contract) => contract.category).filter(Boolean))).sort(),
    ],
    [slaContractProfiles],
  );

  const filteredSlaContracts = useMemo(() => {
    const q = contractSearchText.toLowerCase().trim();

    return slaContractProfiles.filter((contract) => {
      const matchesCategory =
        contractCategoryFilter === "Tutte" ||
        contract.category === contractCategoryFilter;

      const text = [
        contract.category,
        contract.customerType,
        contract.parentCustomer,
        contract.childCustomers,
        contract.durationMonths,
        contract.warrantyMonths,
        contract.phoneSupport,
        contract.preventiveOnsite,
        contract.extraordinaryOnsite,
        contract.sparePartsIncluded,
        contract.blockingResponse,
        contract.nonblockingResponse,
        contract.pickupShipping,
        contract.serviceHours,
        contract.serviceDays,
        contract.driveLink,
        contract.commercialNotes,
        contract.summary,
        contract.aliases,
        contract.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!q || text.includes(q));
    });
  }, [slaContractProfiles, contractSearchText, contractCategoryFilter]);

  const selectedSlaContractsForExport = useMemo(() => {
    const selected = filteredSlaContracts.filter((contract) => selectedSlaContractKeys[contract.key]);
    return selected.length > 0 ? selected : filteredSlaContracts;
  }, [filteredSlaContracts, selectedSlaContractKeys]);

  const selectedContract = getSelectedContract({
    site,
    entity,
    editableContracts,
    contractOverrides,
  });

  const totalBudget =
    budgets.reduce(
      (sum, item) => sum + Number(item.value || item.total || 0),
      0,
    ) || budget;

  function getTicketType(ticket: any): AtlasTicketCategory {
    return getTicketTypeFromMap(ticket, ticketTypesById);
  }

  function getTicketContract(ticket: any) {
    return getTicketContractFromService(ticket, editableContracts);
  }

  function getBudgetSpent(contractName?: string) {
    return calculateBudgetSpent({
      tickets,
      ticketTypesById,
      editableContracts,
      contractName,
    });
  }

  function getBudgetTotal(contractName?: string) {
    return calculateBudgetTotal({
      budgets,
      totalBudget,
      contractName,
    });
  }

  function getBudgetRemaining(contractName?: string) {
    return calculateBudgetRemaining({
      tickets,
      ticketTypesById,
      editableContracts,
      budgets,
      totalBudget,
      contractName,
    });
  }

  function updateContractField(
    contractName: string,
    field: string,
    value: string,
  ) {
    const updated = {
      ...contractOverrides,
      [contractName]: {
        ...(contractOverrides[contractName] || {}),
        [field]: value,
      },
    };

    setContractOverrides(updated);
    localStorage.setItem("atlas-contract-overrides", JSON.stringify(updated));
    showMessage("Contratto aggiornato");
  }

  function updateSlaContractField(
    contractKey: string,
    field: keyof AtlasSlaContractProfile,
    value: string | number | boolean,
  ) {
    const updated = {
      ...contractOverrides,
      [contractKey]: {
        ...(contractOverrides[contractKey] || {}),
        [field]: value,
      },
    };

    setContractOverrides(updated);
    localStorage.setItem("atlas-contract-overrides", JSON.stringify(updated));
    showMessage("Contratto aggiornato");
  }

  function toggleSlaContractSelection(contractKey: string) {
    setSelectedSlaContractKeys((prev) => ({
      ...prev,
      [contractKey]: !prev[contractKey],
    }));
  }

  function toggleAllVisibleSlaContracts() {
    const allSelected =
      filteredSlaContracts.length > 0 &&
      filteredSlaContracts.every((contract) => selectedSlaContractKeys[contract.key]);

    if (allSelected) {
      const next = { ...selectedSlaContractKeys };
      filteredSlaContracts.forEach((contract) => {
        delete next[contract.key];
      });
      setSelectedSlaContractKeys(next);
      return;
    }

    setSelectedSlaContractKeys((prev) => {
      const next = { ...prev };
      filteredSlaContracts.forEach((contract) => {
        next[contract.key] = true;
      });
      return next;
    });
  }

  function openNewSlaContractForm() {
    setEditingSlaContractKey(null);
    setSlaContractForm(createEmptySlaContractProfile());
    setContractFormOpen(true);
  }

  function openEditSlaContractForm(contract: AtlasSlaContractProfile) {
    setEditingSlaContractKey(contract.key);
    setSlaContractForm({ ...contract });
    setContractFormOpen(true);
  }

  function saveSlaContractForm() {
    const cleanForm: AtlasSlaContractProfile = {
      ...slaContractForm,
      key:
        slaContractForm.key ||
        `custom-${Date.now()}`,
      matchPriority: Number(slaContractForm.matchPriority || 0),
      isActive: true,
    };

    const isBaseContract = SLA_BASE_CONTRACT_PROFILES.some(
      (contract) => contract.key === cleanForm.key,
    );

    if (editingSlaContractKey && isBaseContract) {
      const updated = {
        ...contractOverrides,
        [cleanForm.key]: cleanForm,
      };

      setContractOverrides(updated);
      localStorage.setItem("atlas-contract-overrides", JSON.stringify(updated));
    } else {
      const next = customSlaContracts.some((contract) => contract.key === cleanForm.key)
        ? customSlaContracts.map((contract) =>
            contract.key === cleanForm.key ? cleanForm : contract,
          )
        : [cleanForm, ...customSlaContracts];

      setCustomSlaContracts(next);
      localStorage.setItem("atlas-custom-sla-contracts", JSON.stringify(next));
    }

    setContractFormOpen(false);
    showMessage("Contratto salvato");
  }

  function buildSlaContractExportRows(contractsToExport: AtlasSlaContractProfile[]) {
    const headers = SLA_CONTRACT_FIELDS.map((field) => field.label);

    const rows = contractsToExport.map((contract) =>
      SLA_CONTRACT_FIELDS.map((field) => contractCell(contract[field.key])),
    );

    return { headers, rows };
  }

  function exportSlaContractsXls() {
    const { headers, rows } = buildSlaContractExportRows(selectedSlaContractsForExport);

    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <table border="1">
            <thead>
              <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-contratti-sla-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportSlaContractsPdf() {
    const { headers, rows } = buildSlaContractExportRows(selectedSlaContractsForExport);
    const win = window.open("", "_blank", "width=1400,height=900");

    if (!win) {
      showMessage("Popup bloccato dal browser", "error");
      return;
    }

    win.document.open();
    win.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Prospetto contratti SLA ATLAS</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            p { margin: 0 0 18px; color: #4b5563; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 9px; }
            th { background: #0f172a; color: white; padding: 7px; border: 1px solid #cbd5e1; text-align: left; }
            td { padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; white-space: pre-wrap; }
            tr:nth-child(even) td { background: #f8fafc; }
            @page { size: A3 landscape; margin: 10mm; }
          </style>
        </head>
        <body>
          <h1>SERVIZIO DI ASSISTENZA - SLA CONTRATTUALI</h1>
          <p>Esportazione ATLAS · ${new Date().toLocaleString("it-IT")} · ${selectedSlaContractsForExport.length} contratti</p>
          <table>
            <thead>
              <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();

    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  }

  function updateInventoryItem(index: number, field: string, value: string) {
    const updated = inventory.map((item, i) => {
      if (i !== index) return item;

      return {
        ...item,
        [field]:
          field === "value" || field === "quantity"
            ? Number(value || 0)
            : value,
      };
    });

    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
  }

  function addInventoryItem() {
    const updated = [
      ...inventory,
      {
        id: `ART-${Date.now()}`,
        name: "Nuovo articolo",
        value: 0,
        quantity: 0,
      },
    ];

    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
  }

  function mapCustomerEntityToSearchSite(entity: any) {
    const completeName = entity.complete_name || entity.completeName || "";
    const displayName =
      entity.display_name ||
      entity.canonical_name ||
      entity.name ||
      completeName ||
      "Sede / entità cliente";

    return {
      id: null,
      name: displayName,
      city: entity.city || "",
      region: entity.region || "",
      entity: entity.root_name || entity.entity_type || "",
      province: entity.province || "",
      customer_id: entity.customer_id || entity.customerId || null,
      customerId: entity.customer_id || entity.customerId || null,
      customer_entity_id: entity.id || null,
      customerEntityId: entity.id || null,
      glpi_entity_id: entity.glpi_entity_id || null,
      glpiEntityId: entity.glpi_entity_id || null,
      glpi_entity_path: completeName,
      complete_name: completeName,
      is_customer_entity: true,
    };
  }

  const filteredSites = useMemo(() => {
    const q = normalizeFilterText(siteSearch);
    if (q.length < 2) return [];

    const siteResults = sites
      .filter((s) =>
        normalizeFilterText(`${s.name || ""} ${s.city || ""} ${s.entity || ""} ${s.region || ""} ${s.glpi_entity_path || ""}`).includes(q),
      )
      .map((site) => ({ ...site, is_customer_entity: false }));

    const entityResults = customerEntities
      .filter((entity) =>
        normalizeFilterText(`
          ${entity.display_name || ""}
          ${entity.canonical_name || ""}
          ${entity.raw_name || ""}
          ${entity.name || ""}
          ${entity.complete_name || ""}
          ${entity.root_name || ""}
          ${entity.region || ""}
          ${entity.province || ""}
          ${entity.city || ""}
        `).includes(q),
      )
      .map(mapCustomerEntityToSearchSite);

    const seen = new Set<string>();

    return [...entityResults, ...siteResults]
      .filter((item) => {
        const key =
          item.glpi_entity_id
            ? `glpi:${item.glpi_entity_id}`
            : item.id
            ? `site:${item.id}`
            : normalizeFilterText(`${item.name || ""}-${item.glpi_entity_path || item.complete_name || ""}`);

        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }, [siteSearch, sites, customerEntities]);

  const totalForecast = useMemo(
    () =>
      tickets
        .filter((t) => getTicketType(t) === "straordinaria")
        .reduce((sum, t) => sum + materialCost(t.materialIds || []), 0),
    [tickets, ticketTypesById],
  );

  const remainingBudget = totalBudget - totalForecast;

  async function refreshTickets() {
    if (!activeTenant?.id) {
      showMessage("Organizzazione non configurata", "error");
      return;
    }

    setRefreshingTickets(true);

    const { data, error } = await supabase
      .from("v_operational_tickets")
      .select("*")
      .eq("tenant_id", activeTenant?.id)
      .or("glpi_entity_path.is.null,glpi_entity_path.not.ilike.%webvime%")
      .order("opened_at", { ascending: false, nullsFirst: false })
      .order("glpi_ticket_id", { ascending: false, nullsFirst: false })
      .range(0, 999);

    if (error) {
      console.log(error);
      showMessage("Errore aggiornamento ticket", "error");
      setRefreshingTickets(false);
      return;
    }

    const formatted =
      data?.map((t) => ({
        id: t.id,
        glpi_ticket_id: t.glpi_ticket_id || null,
        glpiTicketId: t.glpi_ticket_id || null,
        site: t.site,
        glpi_entity_path: t.glpi_entity_path || "",
        glpiEntityPath: t.glpi_entity_path || "",
        region: t.region,
        entity: t.entity || "",
        city: t.city || "",
        problem: t.problem,
        materialIds: t.materials || [],
        technician: t.technician,
        status: t.status,
        date: t.intervention_date || "",
        resolved: t.resolved,
        futureNeeds: t.future_needs || "",
        closingNotes: t.closing_notes || "",
        slot: t.slot || "",
        openedAt: t.opened_at || t.created_at || "",
        importedAt: t.imported_at || "",
        expectedCloseDate: t.expected_close_date || "",
        closedAt: t.closed_at || "",
        urgent: Boolean(t.urgent),
        siteId: t.site_id || null,
        site_id: t.site_id || null,
        customerId: t.customer_id || null,
        tenantId: t.tenant_id || null,
        tenant_id: t.tenant_id || null,
        ticketType:
          (typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("atlas-ticket-types") || "{}")?.[
                String(t.id)
              ]
            : undefined) ||
          t.ticket_type ||
          "ordinaria",
      })) || [];

    setTickets(formatted);
    setRefreshingTickets(false);
    // refresh silenzioso: il toast piccolo lo gestisce TicketRegistry
  }

  function normalizeFilterText(value: any) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  const filteredTickets = tickets.filter((t) => {
    const searchText = normalizeFilterText(filterSite);
    const openedAtRaw = String(t.openedAt || t.opened_at || "");
    const openedAtTime = openedAtRaw ? new Date(openedAtRaw).getTime() : NaN;
    const isFutureTicket =
      Number.isFinite(openedAtTime) && openedAtTime > Date.now();

    if (isFutureTicket && !searchText) {
      return false;
    }

    const matchTechnician =
      !filterTechnician || t.technician === filterTechnician;

    const entityText = normalizeFilterText(`
      ${t.region || ""}
      ${t.entity || ""}
      ${t.site || ""}
      ${t.city || ""}
      ${t.glpi_entity_path || ""}
      ${t.glpiEntityPath || ""}
    `);

    const matchEntity =
      !filterRegion || entityText.includes(normalizeFilterText(filterRegion));

    const readableStatus = normalizeFilterText(t.status);
    const closedStatus =
      readableStatus.includes("chiuso") ||
      readableStatus.includes("risolto") ||
      readableStatus.includes("closed") ||
      readableStatus === "5" ||
      readableStatus === "6" ||
      Boolean(t.closedAt || t.closed_at);

    const normalizedFilterStatus = normalizeFilterText(filterStatus);

    const matchStatus =
      !filterStatus ||
      (normalizedFilterStatus === "aperto" && !closedStatus) ||
      (normalizedFilterStatus === "chiuso" && closedStatus) ||
      readableStatus === normalizedFilterStatus ||
      readableStatus.includes(normalizedFilterStatus);

    const matchSite =
      !filterSite ||
      normalizeFilterText(`
        ${t.id || ""}
        ${t.glpi_ticket_id || ""}
        ${t.glpiTicketId || ""}
        ${t.site || ""}
        ${t.city || ""}
        ${t.entity || ""}
        ${t.region || ""}
        ${t.problem || ""}
        ${t.status || ""}
        ${t.glpi_entity_path || ""}
        ${t.glpiEntityPath || ""}
      `).includes(searchText);
    const matchUrgent = !urgentOnly || Boolean(t.urgent);

    return (
      matchTechnician && matchEntity && matchStatus && matchSite && matchUrgent
    );
  });

  const urgentTickets = tickets.filter(
    (t) => Boolean(t.urgent) && t.status !== "Chiuso",
  );

  function getPrimaryEntity(ticket: any) {
    const path = String(ticket.glpi_entity_path || ticket.glpiEntityPath || "");
    const parts = path
      .split(">")
      .map((part: string) => part.trim())
      .filter((part: string) => Boolean(part))
      .filter((part: string) => part.toLowerCase() !== "root");

    return (
      parts[0] ||
      ticket.entity ||
      ticket.region ||
      ticket.site ||
      "Da definire"
    );
  }

  const availableRegions = Array.from(
    new Set(tickets.map(getPrimaryEntity).filter(Boolean)),
  ).sort((a, b) => String(a).localeCompare(String(b), "it"));

  const expiringContracts = editableContracts.filter(
    (contract) => getContractStatus(contract).warning,
  );

  const inventoryValue = inventory.reduce(
    (sum, item) => sum + Number(item.value || 0) * Number(item.quantity || 0),
    0,
  );

  const inventoryCritical = inventory.filter(
    (item) => Number(item.quantity) < 10,
  );

  const clientCategories = useMemo(() => {
    if (customerEntities.length > 0) {
      const grouped: Record<string, any[]> = {};

      sites.forEach((site) => {
        const rawPath =
          site.glpi_entity_path ||
          site.entity ||
          "";

        const parts = String(rawPath)
          .split(">")
          .map((part: string) => part.trim())
          .filter((part: string) => Boolean(part))
          .filter((part: string) => part.toLowerCase() !== "root");

        const category =
          parts[0] ||
          site.entity ||
          "Altro";

        if (!grouped[category]) {
          grouped[category] = [];
        }

        grouped[category].push(site);
      });

      Object.keys(grouped).forEach((key) => {
        grouped[key] = grouped[key].sort((a, b) =>
          String(a.name || "").localeCompare(
            String(b.name || ""),
            "it"
          )
        );
      });

      return Object.fromEntries(
        Object.entries(grouped).sort(([a], [b]) =>
          a.localeCompare(b, "it")
        )
      );
    }

    return {
      "Ministero Interni": sites.filter((s) =>
        `${s.name} ${s.entity}`.toLowerCase().includes("minister"),
      ),
      Carabinieri: sites.filter((s) =>
        `${s.name} ${s.entity}`.toLowerCase().includes("carabin"),
      ),
      "Polizia Locale": sites.filter((s) => {
        const text = `${s.name} ${s.entity}`.toLowerCase();
        return (
          text.includes("polizia locale") ||
          text.includes("polizia municipale") ||
          text.includes("polizia provinciale")
        );
      }),
      Questure: sites.filter((s) =>
        `${s.name} ${s.entity}`.toLowerCase().includes("questura"),
      ),
      Prefetture: sites.filter((s) =>
        `${s.name} ${s.entity}`.toLowerCase().includes("prefettura"),
      ),
      Tribunali: sites.filter((s) =>
        `${s.name} ${s.entity}`.toLowerCase().includes("tribunale"),
      ),
      Comuni: sites.filter((s) =>
        `${s.name} ${s.entity}`.toLowerCase().includes("comune"),
      ),
      RFI: sites.filter((s) =>
        `${s.name} ${s.entity}`.toLowerCase().includes("rfi"),
      ),
      Altro: sites.filter((s) => {
        const text = `${s.name} ${s.entity}`.toLowerCase();

        return ![
          "minister",
          "carabin",
          "polizia locale",
          "polizia municipale",
          "polizia provinciale",
          "questura",
          "prefettura",
          "tribunale",
          "comune",
          "rfi",
        ].some((k) => text.includes(k));
      }),
    };
  }, [customerEntities, sites]);

  function toggleMaterial(id: string) {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function addTicket(customerId?: string) {
    if (creatingTicket) return;

    if (!activeTenant?.id) {
      showMessage("Organizzazione non configurata", "error");
      return;
    }

    if (!site || !ticketTitle || !problem) {
      showMessage(
        "Sede, titolo e descrizione intervento sono obbligatori",
        "error",
      );
      return;
    }

    setCreatingTicket(true);

    try {
      const cost = materialCost(selectedMaterials);
      const dbStatus = atlasStatusToDbStatus[ticketStatus] || "Aperto";
      const selectedEntityFromState =
        customerEntities.find(
          (item) =>
            selectedGlpiEntityId &&
            Number(item.glpi_entity_id) === Number(selectedGlpiEntityId),
        ) ||
        customerEntities.find((item) => {
          const q = normalizeFilterText(site || siteSearch);
          if (!q) return false;

          const text = normalizeFilterText(`
            ${item.display_name || ""}
            ${item.canonical_name || ""}
            ${item.raw_name || ""}
            ${item.name || ""}
            ${item.complete_name || ""}
          `);

          return text.includes(q) || q.includes(normalizeFilterText(item.display_name || item.canonical_name || item.name));
        });

      const currentGlpiEntityId =
        selectedGlpiEntityId ||
        toPositiveNumberOrNull(selectedEntityFromState?.glpi_entity_id);
      const currentGlpiEntityPath =
        selectedGlpiEntityPath || selectedEntityFromState?.complete_name || "";
      const currentRegion =
        region && normalizeFilterText(region) !== "da definire"
          ? region
          : selectedEntityFromState?.region ||
            currentGlpiEntityPath
              .split(">")
              .map((part: string) => part.trim())
              .filter((part: string) => Boolean(part))
              .filter((part: string) => part.toLowerCase() !== "root")[1] ||
            "Da definire";
      const currentEntity =
        entity ||
        selectedEntityFromState?.root_name ||
        currentGlpiEntityPath
          .split(">")
          .map((part: string) => part.trim())
          .filter((part: string) => Boolean(part))
          .filter((part: string) => part.toLowerCase() !== "root")[0] ||
        "";
      const currentCity = city || selectedEntityFromState?.city || "";

      const { data, error } = await supabase
        .from("tickets")
        .insert([
          {
            site,
            region: currentRegion,
            entity: currentEntity,
            city: currentCity,
            site_id: siteId,
            glpi_entity_id: currentGlpiEntityId,
            glpi_entity_path: currentGlpiEntityPath || null,
            problem,
            materials: selectedMaterials,
            technician,
            status: dbStatus,
            cost,
            slot: selectedSlot,
            intervention_date: selectedDate || null,
            opened_at: new Date().toISOString(),
            expected_close_date: expectedCloseDate || null,
            urgent: false,
            customer_id: customerId || null,
            tenant_id: activeTenant?.id || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.log(error);
        showMessage("Errore salvataggio ticket", "error");
        return;
      }

      const newTicket = {
        id: data.id,
        title: ticketTitle,
        site,
        region: currentRegion,
        entity: currentEntity,
        city: currentCity,
        problem,
        materialIds: selectedMaterials,
        technician,
        status: dbStatus,
        date: selectedDate || "",
        slot: selectedSlot || "",
        openedAt: data.opened_at || new Date().toISOString(),
        expectedCloseDate: data.expected_close_date || expectedCloseDate || "",
        closedAt: data.closed_at || "",
        urgent: Boolean(data.urgent),
        customerId: data.customer_id || customerId || null,
        tenantId: data.tenant_id || activeTenant?.id || null,
        tenant_id: data.tenant_id || activeTenant?.id || null,
        glpiEntityId: currentGlpiEntityId,
        glpi_entity_id: currentGlpiEntityId,
        glpiEntityPath: currentGlpiEntityPath,
        glpi_entity_path: currentGlpiEntityPath,
        resolved: true,
        closingNotes: "",
        futureNeeds: "",
        ticketType,
        ticketCategory: ticketType,
        ticketStatus,
      };

      const updatedTicketTypes = {
        ...ticketTypesById,
        [String(data.id)]: ticketType,
      };
      setTicketTypesById(updatedTicketTypes);
      localStorage.setItem(
        "atlas-ticket-types",
        JSON.stringify(updatedTicketTypes),
      );

      setTickets((prev) => [newTicket, ...prev]);

      setSite("");
      setSiteSearch("");
      setRegion("");
      setEntity("");
      setCity("");
      setSiteId(null);
      setTicketTitle("");
      setProblem("");
      setTechnician("");
      setSelectedDate("");
      setSelectedSlot("");
      setExpectedCloseDate("");
      setSelectedGlpiEntityId(null);
                        setSelectedGlpiEntityPath("");
      showMessage("Ticket creato in ATLAS, sincronizzazione GLPI in corso...");
      const glpiResult = await syncTicketToGlpi(newTicket);

      if (glpiResult?.glpiTicketId) {
        const syncedTicket = {
          ...newTicket,
          glpi_ticket_id: glpiResult.glpiTicketId,
          glpiTicketId: glpiResult.glpiTicketId,
        };

        await supabase
          .from("tickets")
          .update({ glpi_ticket_id: glpiResult.glpiTicketId })
          .eq("id", data.id)
          .eq("tenant_id", activeTenant?.id);

        setTickets((prev) =>
          prev.map((ticket) =>
            String(ticket.id) === String(data.id) ? syncedTicket : ticket,
          ),
        );
      }

      await supabase.from("ticket_events").insert([
        {
          ticket_id: data.id,
          customer_id: customerId || null,
          site_id: siteId || null,
          event_type: "ticket_created",
          title: "Ticket creato",
          description: `${site} - ${ticketTitle}`,
          created_by: "Operatore",
          tenant_id: activeTenant?.id || null,
          metadata: {
            status: dbStatus,
            urgent: false,
            ticket_type: ticketType,
          },
        },
      ]);

      setSelectedMaterials([]);
      setTicketType("ordinaria");
      setTicketStatus("nuova");

      if (glpiResult?.glpiTicketId) {
        await refreshTickets();
        showMessage(`Ticket salvato e inviato a GLPI #${glpiResult.glpiTicketId}`);
      } else {
        await refreshTickets();
      }
    } catch (error: unknown) {
      console.error("Errore apertura chiamata ATLAS", error);
      showMessage("Errore apertura chiamata. Controlla i dati e riprova.", "error");
    } finally {
      setCreatingTicket(false);
    }
  }

  async function planTicket(id: string) {
    if (!selectedDate || !selectedSlot || !technician) {
      showMessage(
        "Seleziona tecnico, data e slot prima di pianificare",
        "error",
      );
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        technician,
        intervention_date: selectedDate,
        slot: selectedSlot,
        status: "Pianificato",
      })
      .eq("id", id);

    if (error) {
      console.log(error);
      showMessage("Errore pianificazione ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              technician,
              date: selectedDate,
              slot: selectedSlot,
              status: "Pianificato",
            }
          : t,
      ),
    );

    showMessage("Ticket pianificato");
  }

  async function closeTicket(id: string) {
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "Chiuso",
        intervention_date: today,
        closed_at: new Date().toISOString(),
        urgent: false,
        closing_notes: closingNotes || "",
        future_needs: futureNeeds || "",
        resolved,
      })
      .eq("id", Number(id));

    if (error) {
      console.log("ERRORE CHIUSURA:", error);
      showMessage("Errore chiusura ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              status: "Chiuso",
              date: today,
              closedAt: new Date().toISOString(),
              urgent: false,
              closingNotes: closingNotes || "",
              futureNeeds: futureNeeds || "",
              resolved,
            }
          : t,
      ),
    );

    setClosingNotes("");
    setFutureNeeds("");
    setResolved(true);
    setClosingTicketId(null);

    showMessage("Ticket chiuso e salvato");
  }

  async function toggleTicketUrgent(ticket: any) {
    const nextUrgent = !Boolean(ticket.urgent);

    const { error } = await supabase
      .from("tickets")
      .update({ urgent: nextUrgent })
      .eq("id", Number(ticket.id));

    if (error) {
      console.log(error);
      showMessage("Errore aggiornamento urgenza", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((item) =>
        String(item.id) === String(ticket.id)
          ? { ...item, urgent: nextUrgent }
          : item,
      ),
    );

    showMessage(
      nextUrgent ? "Intervento marcato urgente" : "Intervento non più urgente",
    );
  }

  function exportCsv() {
    const header = [
      "ID",
      "Sede",
      "Ente",
      "Città",
      "Regione",
      "Problema",
      "Materiali",
      "Costo",
      "Tecnico",
      "Tipo chiamata",
      "Stato",
      "Risolto",
      "Data apertura",
      "Data chiusura prevista",
      "Data chiusura",
      "Urgente",
      "Data intervento",
      "Slot",
      "Note chiusura",
      "Necessità future",
    ];

    const rows = tickets.map((t) => [
      t.id,
      t.site,
      t.entity || "",
      t.city || "",
      t.region || "",
      t.problem,
      (t.materialIds || [])
        .map((id: string) => materials.find((m) => m.id === id)?.name)
        .join(" + "),
      materialCost(t.materialIds || []),
      t.technician || "",
      getTicketType(t),
      t.status,
      t.resolved === false ? "No" : "Sì",
      t.openedAt || "",
      t.expectedCloseDate || "",
      t.closedAt || "",
      t.urgent ? "Sì" : "No",
      t.date || "",
      t.slot || "",
      t.closingNotes || "",
      t.futureNeeds || "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `secom-atlas-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }
  const monthStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  );

  const monthEnd = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  );

  const calendarDays = Array.from(
    { length: monthEnd.getDate() },
    (_, i) =>
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i + 1),
  );

  const mobileCalendarStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1 - ((monthStart.getDay() + 6) % 7),
  );

  const mobileCalendarCells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(mobileCalendarStart);
    date.setDate(mobileCalendarStart.getDate() + i);
    return date;
  });

  const mobileSelectedDate = selectedCalendarDay || formatLocalDate(new Date());

  const calendarVisibleTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          !calendarFilterTechnician ||
          ticket.technician === calendarFilterTechnician,
      ),
    [tickets, calendarFilterTechnician],
  );

  const mobileSelectedTickets = calendarVisibleTickets.filter(
    (t) => t.date === mobileSelectedDate,
  );

  const monthLabel = calendarMonth.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(amount: number) {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + amount,
        1,
      ),
    );
  }

  function mapCustomerEntityToCalendarSite(entity: any) {
    const completeName =
      entity.complete_name ||
      entity.completeName ||
      "";

    const parts = String(completeName)
      .split(">")
      .map((part: string) => part.trim())
      .filter((part: string) => Boolean(part))
      .filter((part: string) => part.toLowerCase() !== "root");

    const label =
      entity.display_name ||
      entity.canonical_name ||
      parts[parts.length - 1] ||
      entity.name ||
      "Sede / entità cliente";

    return {
      id: null,
      name: label,
      city: entity.city || "",
      region: entity.region || parts[1] || "",
      entity: entity.root_name || parts[0] || entity.entity_type || "",
      customer_id: entity.customer_id || entity.customerId || null,
      customerId: entity.customer_id || entity.customerId || null,
      customer_entity_id: entity.id || null,
      customerEntityId: entity.id || null,
      glpi_entity_id: entity.glpi_entity_id || null,
      glpiEntityId: entity.glpi_entity_id || null,
      glpi_entity_path: completeName,
      complete_name: completeName,
      is_customer_entity: true,
    };
  }

  const calendarSiteResults = useMemo(() => {
    const q = calendarSiteSearch.toLowerCase().trim();

    if (q.length < 2) return [];

    const siteResults = sites
      .filter((s) =>
        `${s.name} ${s.city} ${s.entity} ${s.region} ${s.glpi_entity_path || ""}`
          .toLowerCase()
          .includes(q),
      )
      .map((site) => ({ ...site, is_customer_entity: false }));

    const entityResults = customerEntities
      .filter((entity) =>
        normalizeFilterText(`
          ${entity.display_name || ""}
          ${entity.canonical_name || ""}
          ${entity.raw_name || ""}
          ${entity.name || ""}
          ${entity.complete_name || ""}
          ${entity.root_name || ""}
          ${entity.region || ""}
          ${entity.province || ""}
          ${entity.city || ""}
        `).includes(normalizeFilterText(q)),
      )
      .map(mapCustomerEntityToCalendarSite);

    const seen = new Set<string>();

    return [...siteResults, ...entityResults]
      .filter((item) => {
        const key =
          String(item.id || "") ||
          String(item.customer_entity_id || "") ||
          `${item.name}-${item.glpi_entity_path || item.complete_name || ""}`;

        if (!key) return true;
        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }, [calendarSiteSearch, sites, customerEntities]);
  async function updateCalendarTicket() {
    if (
      !editingCalendarTicketId ||
      !selectedCalendarDay ||
      !calendarTechnician ||
      !calendarSite ||
      !calendarTime
    ) {
      showMessage("Completa tecnico, cliente e orario", "error");
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        site: calendarSite.name,
        region: calendarSite.region || "Da definire",
        entity: calendarSite.entity || "",
        city: calendarSite.city || "",
        site_id: calendarSite.id || null,
        customer_id: calendarSite.customer_id || calendarSite.customerId || null,
        glpi_entity_path: calendarSite.glpi_entity_path || calendarSite.complete_name || null,
        technician: calendarTechnician,
        slot: calendarTime,
        intervention_date: selectedCalendarDay,
        status: "Pianificato",
      })
      .eq("id", Number(editingCalendarTicketId));

    if (error) {
      console.log(error);
      showMessage("Errore modifica intervento", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(editingCalendarTicketId)
          ? {
              ...t,
              site: calendarSite.name,
              region: calendarSite.region || "",
              entity: calendarSite.entity || "",
              city: calendarSite.city || "",
              customerId: calendarSite.customer_id || calendarSite.customerId || null,
              customer_id: calendarSite.customer_id || calendarSite.customerId || null,
              glpi_entity_path: calendarSite.glpi_entity_path || calendarSite.complete_name || "",
              technician: calendarTechnician,
              slot: calendarTime,
              date: selectedCalendarDay,
              status: "Pianificato",
              ticketType,
            }
          : t,
      ),
    );

    const updatedTicketTypes = {
      ...ticketTypesById,
      [String(editingCalendarTicketId)]: ticketType,
    };
    setTicketTypesById(updatedTicketTypes);
    localStorage.setItem(
      "atlas-ticket-types",
      JSON.stringify(updatedTicketTypes),
    );

    setEditingCalendarTicketId(null);
    setExpandedCalendarTicketId(null);
    setCalendarTechnician("");
    setCalendarSiteSearch("");
    setCalendarSite(null);
    setCalendarTime("");

    showMessage("Intervento aggiornato");
  }
  async function addCalendarTicket() {
    if (!activeTenant?.id) {
      showMessage("Organizzazione non configurata", "error");
      return;
    }

    if (
      !selectedCalendarDay ||
      !calendarTechnician ||
      !calendarSite ||
      !calendarTime
    ) {
      showMessage("Completa giorno, tecnico, cliente e orario", "error");
      return;
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          site: calendarSite.name,
          region: calendarSite.region || "Da definire",
          entity: calendarSite.entity || "",
          city: calendarSite.city || "",
          site_id: calendarSite.id || null,
          customer_id: calendarSite.customer_id || calendarSite.customerId || null,
          glpi_entity_path: calendarSite.glpi_entity_path || calendarSite.complete_name || null,
          problem: "Intervento pianificato da calendario",
          materials: [],
          technician: calendarTechnician,
          status: "Pianificato",
          cost: 0,
          slot: calendarTime,
          intervention_date: selectedCalendarDay,
          opened_at: new Date().toISOString(),
          expected_close_date: selectedCalendarDay,
          urgent: false,
          tenant_id: activeTenant?.id || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      showMessage("Errore creazione intervento calendario", "error");
      return;
    }

    const newTicket = {
      id: data.id,
      site: calendarSite.name,
      region: calendarSite.region || "",
      entity: calendarSite.entity || "",
      city: calendarSite.city || "",
      customerId: data.customer_id || calendarSite.customer_id || calendarSite.customerId || null,
      customer_id: data.customer_id || calendarSite.customer_id || calendarSite.customerId || null,
      siteId: data.site_id || calendarSite.id || null,
      site_id: data.site_id || calendarSite.id || null,
      glpi_entity_path: data.glpi_entity_path || calendarSite.glpi_entity_path || calendarSite.complete_name || "",
      problem: "Intervento pianificato da calendario",
      materialIds: [],
      technician: calendarTechnician,
      status: "Pianificato",
      date: selectedCalendarDay,
      slot: calendarTime,
      openedAt: data.opened_at || new Date().toISOString(),
      expectedCloseDate: data.expected_close_date || selectedCalendarDay || "",
      closedAt: data.closed_at || "",
      urgent: Boolean(data.urgent),
      tenantId: data.tenant_id || activeTenant?.id || null,
      tenant_id: data.tenant_id || activeTenant?.id || null,
      resolved: true,
      closingNotes: "",
      futureNeeds: "",
      ticketType,
      ticketCategory: ticketType,
      ticketStatus: "pianificata",
    };

    const updatedTicketTypes = {
      ...ticketTypesById,
      [String(data.id)]: ticketType,
    };
    setTicketTypesById(updatedTicketTypes);
    localStorage.setItem(
      "atlas-ticket-types",
      JSON.stringify(updatedTicketTypes),
    );

    setTickets((prev) => [newTicket, ...prev]);

    const glpiResult = await syncTicketToGlpi(newTicket);

    if (glpiResult?.glpiTicketId) {
      const syncedTicket = {
        ...newTicket,
        glpi_ticket_id: glpiResult.glpiTicketId,
        glpiTicketId: glpiResult.glpiTicketId,
      };

      await supabase
        .from("tickets")
        .update({ glpi_ticket_id: glpiResult.glpiTicketId })
        .eq("id", data.id)
        .eq("tenant_id", activeTenant?.id);

      setTickets((prev) =>
        prev.map((ticket) =>
          String(ticket.id) === String(data.id) ? syncedTicket : ticket,
        ),
      );
    }

    await refreshTickets();

    setSelectedCalendarDay(null);
    setCalendarTechnician("");
    setCalendarSiteSearch("");
    setCalendarSite(null);
    setCalendarTime("");

    showMessage(
      glpiResult?.glpiTicketId
        ? `Intervento aggiunto e inviato a GLPI #${glpiResult.glpiTicketId}`
        : "Intervento aggiunto al calendario",
    );
  }
  const contactClientResults = sites
    .filter((s) => {
      const q = contactClientSearch.toLowerCase();

      return `${s.name} ${s.city} ${s.entity} ${s.region}`
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 8);

  const budgetClientResults = sites
    .filter((s) => {
      const q = budgetClientSearch.toLowerCase();

      return `${s.name} ${s.city} ${s.entity} ${s.region}`
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 8);

  const filteredContacts = contacts.filter((contact) => {
    const q = contactSearch.toLowerCase();
    const tag = contact.tag || "Personale";

    const matchesSearch =
      `${contact.name} ${contact.phone} ${contact.address} ${contact.notes} ${contact.clientName} ${contact.clientCity} ${contact.clientRegion} ${tag}`
        .toLowerCase()
        .includes(q);

    const matchesTag =
      mobileContactFilter === "Tutti" ||
      (mobileContactFilter === "Preferiti" && contact.favorite) ||
      tag === mobileContactFilter;

    return matchesSearch && matchesTag;
  });

  function resetContactForm() {
    setEditingContactId(null);
    setContactClientSearch("");
    setContactClient(null);
    setContactForm({
      name: "",
      phone: "",
      address: "",
      notes: "",
      tag: "Personale",
    });
  }

  function saveContact() {
    if (!contactForm.name || !contactForm.phone) {
      showMessage("Nome e telefono sono obbligatori", "error");
      return;
    }

    const payload = {
      id: editingContactId || `CNT-${Date.now()}`,
      name: contactForm.name,
      phone: contactForm.phone,
      address: contactForm.address,
      notes: contactForm.notes,
      tag: contactForm.tag || "Personale",
      clientId: contactClient?.id || null,
      clientName: contactClient?.name || contactClientSearch || "",
      clientCity: contactClient?.city || "",
      clientRegion: contactClient?.region || "",
      updatedAt: new Date().toISOString(),
    };

    const updated = editingContactId
      ? contacts.map((contact) =>
          contact.id === editingContactId ? payload : contact,
        )
      : [payload, ...contacts];

    setContacts(updated);
    localStorage.setItem("atlas-contacts", JSON.stringify(updated));
    resetContactForm();

    showMessage(editingContactId ? "Contatto aggiornato" : "Contatto aggiunto");
  }

  function editContact(contact: any) {
    setEditingContactId(contact.id);
    setContactClientSearch(contact.clientName || "");
    setContactClient({
      id: contact.clientId || null,
      name: contact.clientName || "",
      city: contact.clientCity || "",
      region: contact.clientRegion || "",
    });

    setContactForm({
      name: contact.name || "",
      phone: contact.phone || "",
      address: contact.address || "",
      notes: contact.notes || "",
      tag: contact.tag || "Personale",
    });
  }

  function deleteContact(id: string) {
    const updated = contacts.filter((contact) => contact.id !== id);
    setContacts(updated);
    localStorage.setItem("atlas-contacts", JSON.stringify(updated));
    resetContactForm();
    showMessage("Contatto eliminato");
  }

  function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function openBudgetForm(contractName?: string) {
    const selectedContractName =
      contractName ||
      budgetForm.contractName ||
      budgets[0]?.contractName ||
      editableContracts[0]?.name ||
      "";
    const existing = budgets.find(
      (item) => item.contractName === selectedContractName,
    );

    setBudgetForm({
      contractName: selectedContractName,
      value: String(existing?.value || budget || INITIAL_BUDGET),
      notes: existing?.notes || "",
    });
    setMobileBudgetFormOpen(true);
  }

  function saveMobileBudget() {
    const parsed = Number(String(budgetForm.value || "0").replace(",", "."));
    const contract = editableContracts.find(
      (item) => item.name === budgetForm.contractName,
    );

    if (!contract) {
      showMessage("Seleziona un contratto / entità", "error");
      return;
    }

    if (Number.isNaN(parsed)) {
      showMessage("Valore budget non valido", "error");
      return;
    }

    const payload = {
      id: `BUD-${contract.name.replace(/[^A-Z0-9]+/gi, "-").toUpperCase()}`,
      contractName: contract.name,
      entity: contract.clientType || contract.name,
      value: parsed,
      notes: budgetForm.notes || "",
      updatedAt: new Date().toISOString(),
    };

    const updated = budgets.some((item) => item.contractName === contract.name)
      ? budgets.map((item) =>
          item.contractName === contract.name ? payload : item,
        )
      : [payload, ...budgets];

    setBudgets(updated);
    localStorage.setItem("atlas-budgets", JSON.stringify(updated));
    setBudget(updated.reduce((sum, item) => sum + Number(item.value || 0), 0));
    localStorage.setItem(
      "atlas-budget",
      String(updated.reduce((sum, item) => sum + Number(item.value || 0), 0)),
    );

    setMobileBudgetFormOpen(false);
    showMessage("Budget contratto aggiornato");
  }

  async function promptPlanTicket(id: string) {
    const current = tickets.find((t) => String(t.id) === String(id));
    const date = prompt(
      "Data intervento (AAAA-MM-GG):",
      current?.date || selectedDate || formatLocalDate(new Date()),
    );
    if (!date) return;

    const slot = prompt(
      "Slot (Mattina/Pomeriggio):",
      current?.slot || selectedSlot || "Mattina",
    );
    if (!slot) return;

    const tech = prompt(
      "Tecnico:",
      current?.technician || technician || technicians[0],
    );
    if (!tech) return;

    const { error } = await supabase
      .from("tickets")
      .update({
        technician: tech,
        intervention_date: date,
        slot,
        status: "Pianificato",
      })
      .eq("id", Number(id));

    if (error) {
      console.log(error);
      showMessage("Errore pianificazione ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? { ...t, technician: tech, date, slot, status: "Pianificato" }
          : t,
      ),
    );

    showMessage("Ticket pianificato");
  }

  async function promptCloseTicket(id: string) {
    const notes = prompt("Note chiusura:", closingNotes || "");
    if (notes === null) return;

    const future = prompt("Necessità future:", futureNeeds || "");
    if (future === null) return;

    const today = formatLocalDate(new Date());

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "Chiuso",
        intervention_date: today,
        closed_at: new Date().toISOString(),
        closing_notes: notes,
        future_needs: future,
        resolved: true,
      })
      .eq("id", Number(id));

    if (error) {
      console.log(error);
      showMessage("Errore chiusura ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              status: "Chiuso",
              date: today,
              closedAt: new Date().toISOString(),
              urgent: false,
              closingNotes: notes,
              futureNeeds: future,
              resolved: true,
            }
          : t,
      ),
    );

    showMessage("Ticket chiuso");
  }

  function startCalendarCreate(day?: string) {
    setEditingCalendarTicketId(null);
    setExpandedCalendarTicketId(null);
    setSelectedCalendarDay(
      day || mobileSelectedDate || formatLocalDate(new Date()),
    );
    setCalendarTechnician("");
    setCalendarSiteSearch("");
    setCalendarSite(null);
    setCalendarTime("");
    setTicketType("ordinaria");
    setTicketStatus("pianificata");
    setMobileCalendarFormOpen(true);
  }

  function startCalendarEdit(ticket: any) {
    setEditingCalendarTicketId(String(ticket.id));
    setExpandedCalendarTicketId(String(ticket.id));
    setSelectedCalendarDay(
      ticket.date || mobileSelectedDate || formatLocalDate(new Date()),
    );
    setCalendarTechnician(ticket.technician || "");
    setCalendarSiteSearch(ticket.site || "");
    setCalendarSite({
      id: ticket.site_id || null,
      name: ticket.site || "",
      region: ticket.region || "",
      entity: ticket.entity || "",
      city: ticket.city || "",
    });
    setCalendarTime(ticket.slot || "");
    setTicketType(getTicketType(ticket));
    setTicketStatus(
      (ticket.ticketStatus as AtlasTicketStatus) || "pianificata",
    );
    setMobileCalendarFormOpen(true);
  }

  async function saveMobileCalendarTicket() {
    const reminderDate =
      selectedCalendarDay || mobileSelectedDate || formatLocalDate(new Date());
    const reminderTitle = calendarSite?.name
      ? `Intervento ${calendarSite.name}`
      : calendarSiteSearch
        ? `Intervento ${calendarSiteSearch}`
        : "Intervento calendario";

    if (editingCalendarTicketId) {
      await updateCalendarTicket();
    } else {
      await addCalendarTicket();
    }

    if (calendarReminderEnabled) {
      addManualReminder(
        reminderTitle,
        reminderDate,
        calendarReminderNote || calendarTime || "Reminder calendario",
      );
      setCalendarReminderEnabled(false);
      setCalendarReminderNote("");
    }

    setMobileCalendarFormOpen(false);
  }

  async function promptAddClient() {
    const name = prompt("Nome sede/cliente:");
    if (!name) return;

    const cityValue = prompt("Città:", "") || "";
    const entityValue = prompt("Ente:", "") || "";
    const regionValue = prompt("Regione:", "Da definire") || "Da definire";

    const { data, error } = await supabase
      .from("sites")
      .insert([
        {
          name,
          city: cityValue,
          entity: entityValue,
          region: regionValue,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      showMessage("Errore creazione cliente", "error");
      return;
    }

    setSites((prev) => [normalizeSiteRegion(data), ...prev]);
    showMessage("Cliente/sede aggiunto");
  }

  function editMobileContract(contract: any) {
    const startDate = prompt(
      "Data inizio contratto (AAAA-MM-GG):",
      contract.startDate !== "Da verificare" ? contract.startDate : "",
    );
    if (startDate !== null)
      updateContractField(
        contract.name,
        "startDate",
        startDate || "Da verificare",
      );

    const endDate = prompt(
      "Scadenza contratto (AAAA-MM-GG):",
      contract.endDate !== "Da verificare" ? contract.endDate : "",
    );
    if (endDate !== null)
      updateContractField(contract.name, "endDate", endDate || "Da verificare");

    const pdf = prompt("Link PDF contratto:", contract.pdf || "");
    if (pdf !== null) updateContractField(contract.name, "pdf", pdf);

    const notes = prompt("Note contratto:", contract.notes || "");
    if (notes !== null) updateContractField(contract.name, "notes", notes);
  }

  function startContactCreate() {
    setEditingContactId(null);
    setContactClientSearch("");
    setContactClient(null);
    setContactForm({
      name: "",
      phone: "",
      address: "",
      notes: "",
      tag: "Personale",
    });
    setMobileContactFormOpen(true);
  }

  function startContactEdit(contact: any) {
    editContact(contact);
    setMobileContactFormOpen(true);
  }

  function saveMobileContact() {
    saveContact();
    setMobileContactFormOpen(false);
  }

  function startInventoryCreate() {
    setEditingInventoryIndex(null);
    setInventoryForm({
      id: "",
      name: "",
      value: "0",
      quantity: "0",
    });
    setMobileInventoryFormOpen(true);
  }

  function startInventoryEdit(index: number) {
    const item = inventory[index];
    if (!item) return;

    setEditingInventoryIndex(index);
    setInventoryForm({
      id: item.id || "",
      name: item.name || "",
      value: String(item.value || 0),
      quantity: String(item.quantity || 0),
    });
    setMobileInventoryFormOpen(true);
  }

  function saveInventoryItemMobile() {
    const name = inventoryForm.name.trim();
    const id =
      inventoryForm.id.trim() || name.toUpperCase().replace(/\s+/g, "-");

    if (!name || !id) {
      showMessage("Nome e ID articolo sono obbligatori", "error");
      return;
    }

    const payload = {
      id,
      name,
      value: Number(String(inventoryForm.value || "0").replace(",", ".")),
      quantity: Number(String(inventoryForm.quantity || "0").replace(",", ".")),
    };

    const updated =
      editingInventoryIndex === null
        ? [payload, ...inventory]
        : inventory.map((item, index) =>
            index === editingInventoryIndex ? { ...item, ...payload } : item,
          );

    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
    setMobileInventoryFormOpen(false);
    setEditingInventoryIndex(null);
    showMessage(
      editingInventoryIndex === null
        ? "Articolo aggiunto"
        : "Articolo aggiornato",
    );
  }

  function deleteInventoryItemMobile() {
    if (editingInventoryIndex === null) return;

    const updated = inventory.filter(
      (_, index) => index !== editingInventoryIndex,
    );
    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
    setMobileInventoryFormOpen(false);
    setEditingInventoryIndex(null);
    showMessage("Articolo eliminato");
  }

  function renderDateInput(
    value: string,
    onChange: (value: string) => void,
    className = input,
  ) {
    return (
      <div className="relative w-full">
        <input
          type="date"
          className={`${className} w-full appearance-none pr-12`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <CalendarDays
          size={20}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    );
  }

  function addManualReminder(title: string, date: string, note = "") {
    if (!title || !date) return;

    const reminder = {
      id: `REM-${Date.now()}`,
      title,
      date,
      note,
      done: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [reminder, ...manualReminders];
    setManualReminders(updated);
    localStorage.setItem("atlas-reminders", JSON.stringify(updated));
  }

  function toggleReminderDone(id: string) {
    const updated = manualReminders.map((reminder) =>
      reminder.id === id ? { ...reminder, done: !reminder.done } : reminder,
    );
    setManualReminders(updated);
    localStorage.setItem("atlas-reminders", JSON.stringify(updated));
  }

  const todayIso = formatLocalDate(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowIso = formatLocalDate(tomorrowDate);

  const budgetAlerts = budgets
    .map((item) => {
      const remaining = getBudgetRemaining(item.contractName);
      const total = Number(item.value || 0);
      const percentage = total > 0 ? Math.round((remaining / total) * 100) : 0;
      return { ...item, remaining, percentage };
    })
    .filter((item) => item.value > 0 && item.percentage <= 20);

  const todayTickets = tickets.filter((ticket) => ticket.date === todayIso);
  const tomorrowTickets = tickets.filter(
    (ticket) => ticket.date === tomorrowIso,
  );

  const notificationItems = [
    ...manualReminders
      .filter((reminder) => !reminder.done)
      .map((reminder) => ({
        id: reminder.id,
        type: "Reminder",
        title: reminder.title,
        detail: `${reminder.date}${reminder.note ? ` · ${reminder.note}` : ""}`,
        tone: "blue",
        action: () => toggleReminderDone(reminder.id),
      })),
    ...(todoNewCount > 0
      ? [
          {
            id: "todo-new-requests",
            type: "TO DO",
            title: `${todoNewCount} nuove richieste aziendali`,
            detail: "Richieste non ancora prese in carico",
            tone: "amber",
            action: () => setActiveTab("todo" as any),
          },
        ]
      : []),
    ...todayTickets.map((ticket) => ({
      id: `today-${ticket.id}`,
      type: "Oggi",
      title: ticket.site || "Intervento",
      detail: `${ticket.slot || "Slot n/d"} · ${ticket.technician || "Tecnico n/d"}`,
      tone: "emerald",
    })),
    ...tomorrowTickets.map((ticket) => ({
      id: `tomorrow-${ticket.id}`,
      type: "Domani",
      title: ticket.site || "Intervento",
      detail: `${ticket.slot || "Slot n/d"} · ${ticket.technician || "Tecnico n/d"}`,
      tone: "blue",
    })),
    ...expiringContracts.map((contract) => ({
      id: `contract-${contract.name}`,
      type: "Contratto",
      title: contract.name,
      detail: getContractStatus(contract).label,
      tone: "amber",
    })),
    ...budgetAlerts.map((budgetItem) => ({
      id: `budget-${budgetItem.id}`,
      type: "Budget",
      title: budgetItem.contractName,
      detail: `Residuo ${euro(budgetItem.remaining)} (${budgetItem.percentage}%)`,
      tone: "red",
    })),
    ...inventoryCritical.slice(0, 6).map((item) => ({
      id: `inventory-${item.id}`,
      type: "Magazzino",
      title: item.name,
      detail: `Quantità ${item.quantity}`,
      tone: Number(item.quantity) <= 0 ? "red" : "amber",
    })),
  ];

  function openTicketFromCustomer(customer: TicketFormSourceCustomer | null, selectedSite?: TicketFormSourceSite | null) {
    const sourceSiteName =
      toNullableString(selectedSite?.name) ||
      toNullableString(selectedSite?.complete_name) ||
      toNullableString(customer?.name) ||
      "";
    const sourceEntity =
      toNullableString(selectedSite?.entity) ||
      toNullableString(customer?.name) ||
      "";

    setTicketFormReturnTarget({ activeTab, mobileView });
    setSiteSearch(sourceSiteName);
    setSite(sourceSiteName);
    setRegion(selectedSite?.region || "");
    setEntity(sourceEntity);
    setCity(selectedSite?.city || "");
    setSiteId(toPositiveNumberOrNull(selectedSite?.id));
    setSelectedGlpiEntityId(toPositiveNumberOrNull(selectedSite?.glpiEntityId || selectedSite?.glpi_entity_id));
    setSelectedGlpiEntityPath(toNullableString(selectedSite?.glpi_entity_path || selectedSite?.complete_name) || "");
    setTicketTitle("");
    setProblem("");
    setMobileView("operativo");
    setActiveTab("operativo");
  }

  function goBackFromTicketForm() {
    const target = ticketFormReturnTarget || { activeTab: "home", mobileView: "home" };
    setActiveTab(target.activeTab || "home");
    setMobileView(target.mobileView || "home");
    setTicketFormReturnTarget(null);
  }

  function handleTenantChange(tenant: AtlasTenant) {
    setActiveTenant(tenant);
    storeTenantSlug(tenant.slug);
    setSite("");
    setSiteSearch("");
    setRegion("");
    setEntity("");
    setCity("");
    setSiteId(null);
    setSelectedGlpiEntityId(null);
    setSelectedGlpiEntityPath("");
    setTicketTitle("");
    setProblem("");
    setSelectedDate("");
    setSelectedSlot("");
    setExpectedCloseDate("");
    setTickets([]);
    setSites([]);
    setCustomers([]);
    setCustomerEntities([]);
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.log("Errore logout AuthProvider:", error);
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log("Errore logout Supabase:", error);
    }

    setTickets([]);
    setSites([]);
    setCustomers([]);
    setCustomerEntities([]);
    setActiveTenant(null);

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }



  async function deleteTicketFromRegistry(ticket: any) {
    const ticketId = ticket?.id;
    if (!ticketId) {
      showMessage("Ticket non valido: ID mancante.", "error");
      return;
    }

    const glpiTicketId = ticket?.glpi_ticket_id || ticket?.glpiTicketId || null;
    const ticketLabel = ticket?.site || ticket?.title || ticket?.problem || `#${ticketId}`;

    const confirmed = window.confirm(
      `Eliminare definitivamente il ticket ${ticketLabel}?\n\nQuesta azione rimuove il ticket dal registro ATLAS.` +
        (glpiTicketId ? `\nTicket GLPI collegato: #${glpiTicketId}.` : ""),
    );

    if (!confirmed) return;

    const deleteFromGlpi = glpiTicketId
      ? window.confirm(`Vuoi provare a cancellare anche il ticket GLPI #${glpiTicketId}?\n\nOK = ATLAS + GLPI\nAnnulla = solo ATLAS`)
      : false;

    try {
      showMessage("Eliminazione ticket in corso...");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        showMessage("Sessione scaduta: fai logout/login e riprova.", "error");
        return;
      }

      const response = await fetch("/api/admin/delete-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId,
          tenantId: activeTenant?.id || ticket?.tenant_id || ticket?.tenantId || null,
          glpiTicketId,
          deleteFromGlpi,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || `Eliminazione fallita (${response.status}).`);
      }

      setTickets((prev) => prev.filter((item) => String(item.id) !== String(ticketId)));
      setSelectedTicketWorkspace((prev: any) => (prev && String(prev.id) === String(ticketId) ? null : prev));

      if (result.glpiError) {
        showMessage(`Ticket eliminato da ATLAS. GLPI non eliminato: ${result.glpiError}`, "error");
        return;
      }

      showMessage(deleteFromGlpi ? "Ticket eliminato da ATLAS e richiesta GLPI eseguita." : "Ticket eliminato da ATLAS.");
    } catch (error: any) {
      showMessage(error?.message || "Errore eliminazione ticket.", "error");
    }
  }

  function openTicketWorkspace(ticket: any) {
    setSelectedTicketWorkspace(ticket);
  }

  function updateTicketFromWorkspace(updatedTicket: any) {
    if (!updatedTicket?.id) return;

    setSelectedTicketWorkspace(updatedTicket);
    setTickets((prev) =>
      prev.map((ticket) =>
        String(ticket.id) === String(updatedTicket.id)
          ? { ...ticket, ...updatedTicket }
          : ticket,
      ),
    );
  }

  function renderNotificationsDrawer() {
    if (!notificationsOpen) return null;

    return (
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onMouseDown={() => setNotificationsOpen(false)}>
        <div
          onMouseDown={(event) => event.stopPropagation()}
          className={`ml-auto flex h-full w-full max-w-md flex-col border-l p-5 shadow-2xl ${
            theme === "dark"
              ? "border-white/10 bg-[#07111f] text-white"
              : "border-slate-200 bg-[#f4f7fb] text-slate-950"
          }`}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
                ATLAS
              </p>
              <h2 className="text-2xl font-black">Notifiche</h2>
            </div>

            <button
              onClick={() => setNotificationsOpen(false)}
              className={`rounded-2xl p-3 ${
                theme === "dark"
                  ? "bg-white/10 text-white"
                  : "bg-white text-slate-900 shadow-sm"
              }`}
            >
              <X size={22} />
            </button>
          </div>

          <div
            className={`mb-4 rounded-3xl border p-4 ${
              theme === "dark"
                ? "border-white/10 bg-white/[0.05]"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="mb-3 text-sm font-black">Nuovo reminder manuale</p>
            <div className="grid gap-3">
              <input
                className={input}
                placeholder="Titolo reminder"
                id="atlas-reminder-title"
              />
              {renderDateInput("", (value) => {
                const field = document.getElementById(
                  "atlas-reminder-date",
                ) as HTMLInputElement | null;
                if (field) field.value = value;
              })}
              <input id="atlas-reminder-date" type="hidden" />
              <button
                onClick={() => {
                  const title =
                    (
                      document.getElementById(
                        "atlas-reminder-title",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const date =
                    (
                      document.getElementById(
                        "atlas-reminder-date",
                      ) as HTMLInputElement | null
                    )?.value || todayIso;
                  addManualReminder(title, date);
                  showMessage("Reminder aggiunto");
                }}
                className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
              >
                + Aggiungi reminder
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {notificationItems.length === 0 ? (
              <div
                className={`rounded-3xl border p-5 text-sm ${
                  theme === "dark"
                    ? "border-white/10 bg-white/[0.05] text-slate-300"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Nessuna notifica attiva.
              </div>
            ) : (
              notificationItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-3xl border p-4 ${
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.06]"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          item.tone === "red"
                            ? "bg-red-500/15 text-red-300"
                            : item.tone === "amber"
                              ? "bg-amber-500/15 text-amber-300"
                              : item.tone === "emerald"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-blue-500/15 text-blue-300"
                        }`}
                      >
                        {item.type}
                      </span>
                      <p className="mt-3 font-black">{item.title}</p>
                      <p
                        className={
                          theme === "dark"
                            ? "text-sm text-slate-400"
                            : "text-sm text-slate-600"
                        }
                      >
                        {item.detail}
                      </p>
                    </div>

                    {"action" in item && (
                      <button
                        onClick={() => (item as any).action?.()}
                        className="rounded-2xl bg-emerald-600 p-3 text-white"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
  const tabGroups = createAtlasTabGroups(todoNewCount);

  const tabs = tabGroups.flatMap((group) => group.items);

  function canAccessTab(key: string) {
    if (!currentUser) return false;

    const isAdminLike = ["super_admin", "admin"].includes(currentUser.role);

    if (key === "utenti" || key === "glpiImport" || key === "designLab") return isAdminLike;
    if (key === "webvime" || key === "todo") return currentUser.role !== "cliente";
    if (key === "piani") return currentUser.role !== "cliente";

    return canViewModule(currentUser, key);
  }

  const isExecutiveMode = uiMode === "executive";

  const card = isExecutiveMode
    ? "rounded-[30px] border border-cyan-300/10 bg-white/[0.055] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-2xl"
    : theme === "dark"
      ? "rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur"
      : "rounded-3xl border border-slate-300 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.12)]";

  const input = isExecutiveMode
    ? "rounded-2xl border border-cyan-300/10 bg-black/30 p-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/45 focus:bg-black/40"
    : theme === "dark"
      ? "rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-400"
      : "rounded-xl border-2 border-slate-300 bg-white p-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-blue-600";

  const lightInput = isExecutiveMode
    ? "rounded-2xl border border-cyan-300/10 bg-black/30 p-2 text-white outline-none transition focus:border-cyan-300/45 focus:bg-black/40"
    : theme === "dark"
      ? "rounded-xl border border-white/10 bg-slate-950/50 p-2 text-white outline-none focus:border-blue-400"
      : "rounded-xl border-2 border-slate-300 bg-white p-2 text-slate-950 outline-none focus:border-blue-600";

  const panel = isExecutiveMode
    ? "border-cyan-300/10 bg-white/[0.045] backdrop-blur-xl"
    : theme === "dark"
      ? "border-white/10 bg-white/[0.04]"
      : "border-slate-300 bg-slate-50 shadow-sm";

  const innerPanel = isExecutiveMode
    ? "border border-cyan-300/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    : theme === "dark"
      ? "bg-slate-950/40"
      : "bg-white border border-slate-300 shadow-sm";

  const mutedText = isExecutiveMode ? "text-slate-400" : theme === "dark" ? "text-slate-400" : "text-slate-600";

  const strongText = isExecutiveMode ? "text-white" : theme === "dark" ? "text-white" : "text-slate-950";

  function renderSlaContractsManager(isMobile = false) {
    return (
      <SlaContractsManager
        isMobile={isMobile}
        card={card}
        input={input}
        panel={panel}
        mutedText={mutedText}
        selectedSlaContractKeys={selectedSlaContractKeys}
        filteredSlaContracts={filteredSlaContracts}
        slaContractCategories={slaContractCategories}
        contractSearchText={contractSearchText}
        setContractSearchText={setContractSearchText}
        contractCategoryFilter={contractCategoryFilter}
        setContractCategoryFilter={setContractCategoryFilter}
        exportSlaContractsXls={exportSlaContractsXls}
        exportSlaContractsPdf={exportSlaContractsPdf}
        openNewSlaContractForm={openNewSlaContractForm}
        toggleAllVisibleSlaContracts={toggleAllVisibleSlaContracts}
        toggleSlaContractSelection={toggleSlaContractSelection}
        openEditSlaContractForm={openEditSlaContractForm}
        contractFormOpen={contractFormOpen}
        setContractFormOpen={setContractFormOpen}
        editingSlaContractKey={editingSlaContractKey}
        slaContractForm={slaContractForm}
        setSlaContractForm={setSlaContractForm}
        saveSlaContractForm={saveSlaContractForm}
        SLA_CONTRACT_FIELDS={SLA_CONTRACT_FIELDS}
      />
    );
  }


  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            ATLAS
          </p>
          <p className="mt-3 text-xl font-black">Ripristino sessione...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    if (authMode === "register") return renderCustomerRegisterScreen();
    if (authMode === "forgot") return renderForgotPasswordScreen();

    return (
      <div className="relative min-h-screen">
        <LoginScreen onDone={refreshUser} />
        <div className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col gap-2 rounded-3xl border border-white/10 bg-[#07111f]/95 p-3 shadow-2xl backdrop-blur md:flex-row">
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setAuthActionMessage("");
            }}
            className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500"
          >
            Registrati come cliente
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("forgot");
              setAuthActionMessage("");
            }}
            className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
          >
            Password dimenticata
          </button>
        </div>
      </div>
    );
  }

  return (
    <main
      className={`atlas-shell atlas-theme-${theme} atlas-ui-${uiMode} min-h-screen overflow-x-hidden transition-all duration-300 ${
        isExecutiveMode
          ? "bg-[#020713] text-slate-100"
          : theme === "dark"
            ? "bg-[#07111f] text-slate-100"
            : "bg-[#eef3f8] text-slate-900"
      }`}
    >
      <style jsx global>{`
        .atlas-ui-executive {
          background:
            radial-gradient(circle at 18% 0%, rgba(34, 211, 238, 0.16), transparent 28%),
            radial-gradient(circle at 82% 4%, rgba(251, 191, 36, 0.12), transparent 25%),
            linear-gradient(135deg, #020713 0%, #071321 50%, #030711 100%) !important;
        }

        .atlas-ui-executive::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 42px 42px;
        }

        .atlas-ui-executive > div,
        .atlas-ui-executive .atlas-sidebar,
        .atlas-ui-executive header,
        .atlas-ui-executive main {
          position: relative;
          z-index: 1;
        }

        .atlas-ui-executive .atlas-sidebar {
          background: rgba(2, 7, 19, 0.82) !important;
          border-right-color: rgba(103, 232, 249, 0.12) !important;
          box-shadow: 18px 0 70px rgba(0, 0, 0, 0.28) !important;
          backdrop-filter: blur(24px);
        }


        .atlas-ui-executive .atlas-sidebar-nav::before,
        .atlas-theme-light .atlas-sidebar-nav::before {
          display: none !important;
          content: none !important;
        }

        .atlas-ui-executive header {
          background: rgba(2, 7, 19, 0.72) !important;
          border-bottom-color: rgba(103, 232, 249, 0.12) !important;
          box-shadow: 0 16px 60px rgba(0, 0, 0, 0.18);
        }

        .atlas-ui-executive section[class*="rounded"],
        .atlas-ui-executive div[class*="rounded-3xl"],
        .atlas-ui-executive div[class*="rounded-[2rem]"],
        .atlas-ui-executive div[class*="rounded-[34px]"] {
          border-color: rgba(103, 232, 249, 0.12) !important;
        }

        .atlas-ui-executive [class*="bg-white/"],
        .atlas-ui-executive [class*="bg-white["] {
          background-color: rgba(255, 255, 255, 0.055) !important;
        }

        .atlas-ui-executive button[class*="bg-blue-600"],
        .atlas-ui-executive a[class*="bg-blue-600"] {
          background: linear-gradient(135deg, rgba(34,211,238,0.88), rgba(37,99,235,0.95)) !important;
          box-shadow: 0 0 28px rgba(34, 211, 238, 0.16);
        }

        .atlas-theme-light {
          --atlas-light-bg: #eef3f8;
          --atlas-light-surface: #ffffff;
          --atlas-light-surface-2: #f8fafc;
          --atlas-light-border: #cbd5e1;
          --atlas-light-text: #0f172a;
          --atlas-light-muted: #475569;
          --atlas-light-soft: #64748b;
        }

        .atlas-theme-light .atlas-sidebar {
          background: #ffffff !important;
          border-right-color: var(--atlas-light-border) !important;
          box-shadow: 12px 0 28px rgba(15, 23, 42, 0.08) !important;
          scrollbar-width: thin;
        }



        .atlas-theme-light .atlas-sidebar button:not(.atlas-force-keep) {
          opacity: 1 !important;
        }

        .atlas-theme-light .atlas-sidebar button:not([class*="bg-blue-600"]) {
          color: #0f172a !important;
          background-color: #ffffff !important;
        }

        .atlas-theme-light .atlas-sidebar button:not([class*="bg-blue-600"]) svg,
        .atlas-theme-light .atlas-sidebar button:not([class*="bg-blue-600"]) span {
          color: #0f172a !important;
          opacity: 1 !important;
        }

        .atlas-theme-light .atlas-sidebar button[class*="bg-blue-600"],
        .atlas-theme-light .atlas-sidebar button[class*="bg-blue-600"] svg,
        .atlas-theme-light .atlas-sidebar button[class*="bg-blue-600"] span {
          color: #ffffff !important;
          opacity: 1 !important;
        }

        .atlas-theme-light [class*="bg-[#07111f]"],
        .atlas-theme-light [class*="bg-[#081523]"],
        .atlas-theme-light [class*="bg-[#06111f]"],
        .atlas-theme-light [class*="bg-slate-950"],
        .atlas-theme-light [class*="bg-slate-900"],
        .atlas-theme-light [class*="bg-slate-800"] {
          background-color: var(--atlas-light-surface) !important;
        }

        .atlas-theme-light [class*="bg-white/["],
        .atlas-theme-light [class*="bg-white/"] {
          background-color: var(--atlas-light-surface) !important;
        }

        .atlas-theme-light section[class*="rounded"],
        .atlas-theme-light div[class*="rounded-[2rem]"],
        .atlas-theme-light div[class*="rounded-3xl"] {
          border-color: var(--atlas-light-border) !important;
        }

        .atlas-theme-light [class*="border-white/"] {
          border-color: var(--atlas-light-border) !important;
        }

        .atlas-theme-light [class*="text-white"] {
          color: var(--atlas-light-text) !important;
        }

        .atlas-theme-light [class*="text-slate-100"],
        .atlas-theme-light [class*="text-slate-200"],
        .atlas-theme-light [class*="text-slate-300"] {
          color: #1e293b !important;
        }

        .atlas-theme-light [class*="text-slate-400"],
        .atlas-theme-light [class*="text-slate-500"] {
          color: var(--atlas-light-muted) !important;
        }

        .atlas-theme-light input,
        .atlas-theme-light textarea,
        .atlas-theme-light select {
          background: #ffffff !important;
          color: var(--atlas-light-text) !important;
          border-color: var(--atlas-light-border) !important;
        }

        .atlas-theme-light input::placeholder,
        .atlas-theme-light textarea::placeholder {
          color: #64748b !important;
        }

        .atlas-theme-light button[class*="bg-blue-"],
        .atlas-theme-light a[class*="bg-blue-"],
        .atlas-theme-light button[class*="bg-emerald-"],
        .atlas-theme-light a[class*="bg-emerald-"],
        .atlas-theme-light button[class*="bg-red-"],
        .atlas-theme-light button[class*="bg-violet-"] {
          color: #ffffff !important;
        }

        /* Non forzare tutti i bg-blue/bg-red/bg-emerald a colore pieno: rompe le card con opacity tipo bg-blue-500/[0.055]. */

        .atlas-theme-light .shadow-2xl,
        .atlas-theme-light .shadow-xl {
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08) !important;
        }

        .atlas-theme-light [class*="bg-amber-500/10"] {
          background-color: #fffbeb !important;
          border-color: #f59e0b !important;
        }

        .atlas-theme-light [class*="bg-red-500/10"] {
          background-color: #fff1f2 !important;
          border-color: #fb7185 !important;
        }

        .atlas-theme-light [class*="bg-blue-500/10"],
        .atlas-theme-light [class*="bg-blue-600/10"] {
          background-color: #eff6ff !important;
          border-color: #93c5fd !important;
        }

        .atlas-theme-light [class*="bg-emerald-500/10"] {
          background-color: #ecfdf5 !important;
          border-color: #6ee7b7 !important;
        }
      `}</style>
      {renderNotificationsDrawer()}
      <AtlasAppFrame
        theme={theme}
        isExecutiveMode={isExecutiveMode}
        logoImage={ATLAS_LOGO_CARD_IMAGE}
        tabGroups={tabGroups}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as any)}
        canAccessTab={canAccessTab}
        tenants={tenants}
        activeTenant={activeTenant}
        currentUser={currentUser}
        notificationCount={notificationItems.length}
        siteSearch={siteSearch}
        onTenantChange={handleTenantChange}
        onLogout={handleLogout}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenMobileMenu={() => setMobileMoreOpen(true)}
        onSwitchUiMode={switchUiMode}
        onThemeChange={setTheme}
        onSiteSearchChange={setSiteSearch}
        operatorAvatar={operatorAvatar}
        onOperatorAvatarUpload={handleOperatorAvatarUpload}
        mobileMoreOpen={mobileMoreOpen}
        setMobileMoreOpen={setMobileMoreOpen}
        mobileView={mobileView}
        setMobileView={setMobileView}
        todoNewCount={todoNewCount}
        message={message}
        messageType={messageType}
        onClearMessage={() => setMessage("")}
        selectedTicketWorkspace={selectedTicketWorkspace}
        onCloseTicketWorkspace={() => setSelectedTicketWorkspace(null)}
        onTicketWorkspaceStatusUpdated={updateTicketFromWorkspace}
      >
            <AtlasWorkspaceContent
              ctx={{
                tenantLoading,
                activeTenant,
                mobileView,
                setMobileView,
                todoNewCount,
                currentUser,
                isExecutiveMode,
                customers,
                sites,
                tickets,
                customerEntities,
                openTicketFromCustomer,
                filteredTickets,
                exportCsv,
                promptCloseTicket,
                filterTechnician,
                setFilterTechnician,
                filterRegion,
                setFilterRegion,
                filterStatus,
                setFilterStatus,
                filterSite,
                setFilterSite,
                urgentOnly,
                setUrgentOnly,
                availableRegions,
                toggleTicketUrgent,
                openTicketWorkspace,
                refreshTickets,
                refreshingTickets,
                deleteTicketFromRegistry,
                input,
                lightInput,
                theme,
                card,
                strongText,
                mutedText,
                uiMode,
                switchUiMode,
                renderSlaContractsManager,
                activeTab,
                setActiveTab,
                setClosingTicketId,
                siteSearch,
                setSiteSearch,
                site,
                setSite,
                setRegion,
                setEntity,
                setCity,
                setSiteId,
                filteredSites,
                ticketTitle,
                setTicketTitle,
                problem,
                setProblem,
                ticketType,
                setTicketType,
                ticketStatus,
                setTicketStatus,
                expectedCloseDate,
                setExpectedCloseDate,
                ticketCategoryOptions,
                ticketStatusOptions,
                addTicket,
                ticketFormReturnTarget,
                goBackFromTicketForm,
                selectedContract,
                getContractStatus,
                euro,
                getBudgetTotal,
                getBudgetSpent,
                getBudgetRemaining,
                setSelectedGlpiEntityId,
                setSelectedGlpiEntityPath,
                region,
                technician,
                setTechnician,
                technicians,
                renderDateInput,
                selectedDate,
                setSelectedDate,
                selectedSlot,
                setSelectedSlot,
                materials,
                toggleMaterial,
                selectedMaterials,
                materialCost,
                creatingTicket,
                changeMonth,
                monthLabel,
                calendarFilterTechnician,
                setCalendarFilterTechnician,
                mobileCalendarCells,
                calendarDays,
                formatLocalDate,
                calendarMonth,
                calendarVisibleTickets,
                mobileSelectedDate,
                mobileSelectedTickets,
                selectedCalendarDay,
                setSelectedCalendarDay,
                startCalendarCreate,
                startCalendarEdit,
                mobileCalendarFormOpen,
                setMobileCalendarFormOpen,
                editingCalendarTicketId,
                setEditingCalendarTicketId,
                expandedCalendarTicketId,
                setExpandedCalendarTicketId,
                calendarTechnician,
                setCalendarTechnician,
                calendarSiteSearch,
                setCalendarSiteSearch,
                calendarSite,
                setCalendarSite,
                calendarSiteResults,
                calendarTime,
                setCalendarTime,
                saveMobileCalendarTicket,
                updateCalendarTicket,
                budgetVisible,
                setBudgetVisible,
                totalBudget,
                totalForecast,
                remainingBudget,
                getTicketType,
                openBudgetForm,
                budgets,
                mobileBudgetFormOpen,
                setMobileBudgetFormOpen,
                budgetForm,
                setBudgetForm,
                editableContracts,
                INITIAL_BUDGET,
                saveMobileBudget,
                setBudgetClientSearch,
                clientCategories,
                clientSearch,
                setClientSearch,
                openCategory,
                setOpenCategory,
                customerInvitePanelOpen,
                setCustomerInvitePanelOpen,
                promptAddClient,
                selectedSystem,
                setSelectedSystem,
                systemSearch,
                setSystemSearch,
                showMessage,
                contactSearch,
                setContactSearch,
                filteredContacts,
                contactForm,
                setContactForm,
                editingContactId,
                setEditingContactId,
                contactClientSearch,
                setContactClientSearch,
                contactClient,
                setContactClient,
                contactClientResults,
                mobileContactFilter,
                setMobileContactFilter,
                mobileContactFormOpen,
                setMobileContactFormOpen,
                startContactCreate,
                startContactEdit,
                saveMobileContact,
                saveContact,
                resetContactForm,
                editContact,
                deleteContact,
                inventory,
                inventorySearch,
                setInventorySearch,
                mobileInventoryFormOpen,
                setMobileInventoryFormOpen,
                editingInventoryIndex,
                inventoryForm,
                setInventoryForm,
                startInventoryCreate,
                startInventoryEdit,
                saveInventoryItemMobile,
                deleteInventoryItemMobile,
                addInventoryItem,
                updateInventoryItem,
                closingTicketId,
                closingNotes,
                futureNeeds,
                resolved,
                setClosingNotes,
                setFutureNeeds,
                setResolved,
                closeTicket,
              }}
            />
      </AtlasAppFrame>
    </main>
  );
}
