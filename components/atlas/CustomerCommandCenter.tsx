"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  MapPin,
  Search,
} from "lucide-react";
import CustomerWorkspace from "@/components/atlas/CustomerWorkspace";
import { supabase } from "@/lib/supabase";

type CustomerCommandCenterProps = {
  customers: any[];
  sites: any[];
  tickets: any[];
  customerEntities?: any[];
  onOpenTicket?: (customer: any, site?: any) => void;
  executiveMode?: boolean;
  glpiEnabled?: boolean;
};

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandSearchText(value: any) {
  const base = normalize(value);
  const expanded = ` ${base} `
    .replace(/\bprov\b/g, " provincia provinciale prov ")
    .replace(/\bprovinciale\b/g, " provincia provinciale prov ")
    .replace(/\bcomp\b/g, " compagnia comp ")
    .replace(/\bcdo\b/g, " comando cdo ")
    .replace(/\bstaz\b/g, " stazione staz ")
    .replace(/\bcc\b/g, " carabinieri cc ");

  return normalize(`${base} ${expanded}`);
}

function normalizeGlpiHierarchy(value: any) {
  return String(value || "")
    .split(">")
    .map((part) =>
      expandSearchText(part)
        .replace(/\bcom prov cc\b/g, "comando provinciale carabinieri")
        .replace(/\bcomando prov carabinieri\b/g, "comando provinciale carabinieri")
        .replace(/\bcomp cc\b/g, "compagnia carabinieri")
        .replace(/\bcomp carabinieri\b/g, "compagnia carabinieri")
        .replace(/\bprov\b/g, "provinciale")
        .replace(/\bcom\b/g, "comando")
        .replace(/\bcomp\b/g, "compagnia")
        .replace(/\bcc\b/g, "carabinieri")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join(" > ");
}

function hasExactToken(text: string, token: string) {
  return ` ${text} `.includes(` ${token} `);
}

function hasExactPhrase(text: string, phrase: string) {
  return ` ${text} `.includes(` ${phrase} `);
}

function includesSmart(haystack: any, query: string) {
  const text = expandSearchText(haystack);
  const q = expandSearchText(query);

  if (!q) return false;

  // Match frase completa solo con bordi parola.
  // Evita "roma" dentro "romagna".
  if (hasExactPhrase(text, q)) return true;

  const tokens = Array.from(new Set(q.split(" ").filter(Boolean)));
  if (tokens.length === 0) return false;

  // Con una sola parola deve esserci il token esatto.
  // "roma" NON deve matchare "romagna".
  if (tokens.length === 1) {
    return hasExactToken(text, tokens[0]);
  }

  // Con più parole devono esserci tutti i token esatti.
  return tokens.every((token) => hasExactToken(text, token));
}

function resultScore(haystack: any, query: string) {
  const text = expandSearchText(haystack);
  const q = expandSearchText(query);
  if (!q) return 0;

  if (text === q) return 1000;
  if (hasExactPhrase(text, q)) return 800;

  const tokens = Array.from(new Set(q.split(" ").filter(Boolean)));
  const tokenScore = tokens.reduce(
    (score, token) => score + (hasExactToken(text, token) ? 50 : 0),
    0,
  );

  // Peso extra a città/parole specifiche: se cerco "roma", Roma deve battere Emilia-Romagna.
  const lastToken = tokens[tokens.length - 1];
  const lastTokenBonus = lastToken && hasExactToken(text, lastToken) ? 100 : 0;

  return tokenScore + lastTokenBonus;
}

function isActiveCustomerEntity(entity: any) {
  const status = normalize(entity?.status || entity?.state || entity?.is_active || entity?.active || "");

  return (
    entity?.is_active !== false &&
    entity?.active !== false &&
    entity?.is_deleted !== true &&
    entity?.deleted !== true &&
    !["0", "false", "inactive", "disattivo", "non attivo", "deleted", "archiviato"].includes(status)
  );
}

function mapTicketRow(t: any) {
  return {
    id: t.id,
    site: t.site,
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
    expectedCloseDate: t.expected_close_date || "",
    closedAt: t.closed_at || "",
    urgent: Boolean(t.urgent),
    siteId: t.site_id || null,
    site_id: t.site_id || null,
    customerId: t.customer_id || null,
    customer_id: t.customer_id || null,
    tenantId: t.tenant_id || null,
    tenant_id: t.tenant_id || null,
    source: t.source || null,
    glpi_ticket_id: t.glpi_ticket_id || null,
    glpi_entity_path: t.glpi_entity_path || "",
    ticketType: t.ticket_type || "ordinaria",
  };
}

function findCustomerForSite(site: any, customers: any[]) {
  if (!site) return null;

  if (site.customer_id) {
    const byId = customers.find((customer) => String(customer.id) === String(site.customer_id));
    if (byId) return byId;
  }

  const text = expandSearchText(`${site.name} ${site.entity} ${site.city} ${site.region} ${site.glpi_entity_path || ""}`);

  return (
    customers.find((customer) => {
      const name = expandSearchText(customer.name);
      const entity = expandSearchText(site.entity);
      return name && (text.includes(name) || (entity && name.includes(entity)));
    }) || null
  );
}

function entityAsCustomer(entity: any) {
  if (!entity) return null;

  const normalizedPath =
    entity.normalized_complete_name ||
    entity.complete_name ||
    "";

  const parts = String(normalizedPath)
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);

  const text = expandSearchText(normalizedPath || entity.name || "");

  const inferredContract = text.includes("carabinieri")
    ? "Carabinieri"
    : text.includes("polizia")
    ? "Polizia"
    : text.includes("rfi")
    ? "RFI"
    : entity.contract_type || "Entità GLPI";

  return {
    id: `entity-${entity.id}`,
    name: parts[parts.length - 1] || entity.name,
    entity_type: entity.entity_type,
    glpi_entity_id: entity.glpi_entity_id,
    complete_name: normalizedPath,
    raw_complete_name: entity.raw_complete_name || entity.complete_name,
    normalized_complete_name: normalizedPath,
    contract_type: inferredContract,
    sla_hours: entity.sla_hours || 48,
    is_glpi_entity: true,
  };
}



function normalizePath(value: any) {
  return normalizeGlpiHierarchy(value);
}

function pathStartsWith(ticketPath: any, entityPath: any) {
  const cleanTicketPath = normalizePath(ticketPath);
  const cleanEntityPath = normalizePath(entityPath);

  if (!cleanTicketPath || !cleanEntityPath) return false;

  return (
    cleanTicketPath === cleanEntityPath ||
    cleanTicketPath.startsWith(`${cleanEntityPath} > `)
  );
}

function compactEntityKey(value: any) {
  return expandSearchText(value)
    .replace(/\broot\b/g, "")
    .replace(/\bcomando\b/g, "")
    .replace(/\bcom\b/g, "")
    .replace(/\bprovincia\b/g, "")
    .replace(/\bprovinciale\b/g, "")
    .replace(/\bprov\b/g, "")
    .replace(/\bcompagnia\b/g, "")
    .replace(/\bcomp\b/g, "")
    .replace(/\bcc\b/g, "")
    .replace(/\bcarabinieri\b/g, "")
    .replace(/\bcampania\b/g, "")
    .replace(/\blazio\b/g, "")
    .replace(/\bsicilia\b/g, "")
    .replace(/\blombardia\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resultDedupeKey(item: any) {
  const preferredPath =
    item.entity?.normalized_complete_name ||
    item.entity?.complete_name ||
    item.site?.normalized_complete_name ||
    item.site?.glpi_entity_path ||
    item.subtitle ||
    item.label ||
    "";

  const parts = String(preferredPath)
    .split(">")
    .map((part) => compactEntityKey(part))
    .filter(Boolean);

  return parts[parts.length - 1] || compactEntityKey(item.label || preferredPath);
}

function sameId(a: any, b: any) {
  if (a === undefined || a === null || b === undefined || b === null) {
    return false;
  }

  return String(a) === String(b);
}

function ticketMatchesSelectedSite(ticket: any, selectedSite: any) {
  if (!ticket || !selectedSite) return false;

  if (
    sameId(ticket.siteId, selectedSite.id) ||
    sameId(ticket.site_id, selectedSite.id)
  ) {
    return true;
  }

  const selectedPath = selectedSite.glpi_entity_path || selectedSite.complete_name || "";
  const ticketPath = ticket.glpi_entity_path || ticket.glpiEntityPath || "";

  if (selectedPath && ticketPath && pathStartsWith(ticketPath, selectedPath)) {
    return true;
  }

  const selectedSiteName = expandSearchText(selectedSite.name || "");
  const ticketSiteName = expandSearchText(ticket.site || "");

  return Boolean(selectedSiteName && ticketSiteName && selectedSiteName === ticketSiteName);
}

function ticketMatchesSelectedEntity(ticket: any, selectedEntity: any) {
  if (!ticket || !selectedEntity) return false;

  const ticketPath = normalizeGlpiHierarchy(
    ticket.normalized_glpi_entity_path ||
      ticket.glpi_entity_path ||
      ticket.glpiEntityPath ||
      "",
  );

  const selectedPath = normalizeGlpiHierarchy(
    selectedEntity.normalized_complete_name ||
      selectedEntity.complete_name ||
      "",
  );

  if (!ticketPath || !selectedPath) return false;

  return ticketPath === selectedPath || ticketPath.startsWith(`${selectedPath} > `);
}

function siteMatchesSelectedEntity(site: any, selectedEntity: any) {
  if (!site || !selectedEntity) return false;

  const selectedPath = normalizeGlpiHierarchy(
    selectedEntity.normalized_complete_name ||
      selectedEntity.complete_name ||
      "",
  );

  const sitePath = normalizeGlpiHierarchy(
    site.normalized_glpi_entity_path ||
      site.normalized_complete_name ||
      site.glpi_entity_path ||
      site.complete_name ||
      "",
  );

  if (!selectedPath || !sitePath) return false;

  return sitePath === selectedPath || sitePath.startsWith(`${selectedPath} > `);
}

function ticketMatchesSelectedCustomer(ticket: any, customer: any) {
  if (!ticket || !customer) return false;

  if (
    sameId(ticket.customerId, customer.id) ||
    sameId(ticket.customer_id, customer.id)
  ) {
    return true;
  }

  const customerName = expandSearchText(customer.name || "");
  const ticketText = expandSearchText(`
    ${ticket.site || ""}
    ${ticket.entity || ""}
    ${ticket.city || ""}
    ${ticket.region || ""}
    ${ticket.glpi_entity_path || ""}
  `);

  return Boolean(customerName && hasExactPhrase(ticketText, customerName));
}

export default function CustomerCommandCenter({
  customers,
  sites,
  tickets,
  customerEntities = [],
  onOpenTicket,
  executiveMode = false,
  glpiEnabled = true,
}: CustomerCommandCenterProps) {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [siteTickets, setSiteTickets] = useState<any[]>([]);
  const [entityTickets, setEntityTickets] = useState<any[]>([]);

  const query = normalize(search);

  const results = useMemo(() => {
    if (query.length < 2) return [];

    const entityResults = customerEntities
      .filter(isActiveCustomerEntity)
      .map((entity) => {
        const normalizedPath =
          entity.normalized_complete_name ||
          entity.complete_name ||
          "";

        const normalizedParts = String(normalizedPath)
          .split(">")
          .map((part) => part.trim())
          .filter(Boolean);

        const label =
          normalizedParts[normalizedParts.length - 1] ||
          entity.name ||
          entity.complete_name ||
          "Entità GLPI";

        return {
          type: "entity" as const,
          id: `entity-${entity.id || entity.glpi_entity_id}`,
          label,
          subtitle: normalizedPath || "Entità GLPI",
          site: null,
          customer: entityAsCustomer({
            ...entity,
            name: label,
            complete_name: normalizedPath || entity.complete_name,
          }),
          entity: {
            ...entity,
            name: label,
            raw_complete_name: entity.complete_name,
            complete_name: normalizedPath || entity.complete_name,
            normalized_complete_name: normalizedPath || entity.normalized_complete_name || entity.complete_name,
          },
          searchText: `${label} ${normalizedPath} ${entity.name || ""} ${entity.complete_name || ""}`,
        };
      })
      .filter((item) => includesSmart(item.searchText, query))
      .sort((a, b) => {
        const aScore = resultScore(a.searchText, query);
        const bScore = resultScore(b.searchText, query);
        return bScore - aScore;
      });

    const seen = new Set<string>();

    return entityResults
      .filter((item) => {
        const key = resultDedupeKey(item);
        if (!key) return true;

        if (seen.has(key)) return false;
        seen.add(key);

        return true;
      })
      .slice(0, 20);
  }, [query, customerEntities]);

  const currentCustomer = selectedCustomer || entityAsCustomer(selectedEntity) || findCustomerForSite(selectedSite, customers);
  const currentLabel =
    selectedSite?.name ||
    selectedEntity?.name ||
    currentCustomer?.name ||
    "";

  useEffect(() => {
    async function loadEntityTickets() {
      if (!selectedEntity) {
        setEntityTickets([]);
        return;
      }

      const entityTenantId = String(selectedEntity.tenant_id || selectedEntity.tenantId || "").trim();
      if (!entityTenantId || !glpiEnabled) {
        setEntityTickets([]);
        return;
      }

      const rawPath =
        selectedEntity.raw_complete_name ||
        selectedEntity.complete_name ||
        selectedEntity.normalized_complete_name ||
        "";

      const normalizedPath =
        selectedEntity.normalized_complete_name ||
        selectedEntity.complete_name ||
        "";

      const queryPath = rawPath || normalizedPath;

      if (!queryPath) {
        setEntityTickets([]);
        return;
      }

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          glpi_ticket_id,
          site,
          region,
          entity,
          city,
          problem,
          materials,
          technician,
          status,
          intervention_date,
          resolved,
          future_needs,
          closing_notes,
          slot,
          opened_at,
          expected_close_date,
          closed_at,
          urgent,
          site_id,
          customer_id,
          tenant_id,
          source,
          glpi_entity_path,
          ticket_type,
          created_at
        `)
        .eq("tenant_id", entityTenantId)
        .eq("source", "glpi")
        .ilike("glpi_entity_path", `${queryPath}%`)
        .order("opened_at", { ascending: false, nullsFirst: false })
        .order("glpi_ticket_id", { ascending: false, nullsFirst: false })
        .range(0, 99);

      if (error) {
        console.log("Errore caricamento ticket entità GLPI:", error);
        setEntityTickets([]);
        return;
      }

      setEntityTickets((data || []).map(mapTicketRow));
    }

    loadEntityTickets();
  }, [selectedEntity?.id, selectedEntity?.tenant_id, selectedEntity?.complete_name, selectedEntity?.normalized_complete_name, glpiEnabled]);


  useEffect(() => {
    async function loadSiteTickets() {
      if (!selectedSite?.id) {
        setSiteTickets([]);
        return;
      }

      const siteTenantId = String(selectedSite.tenant_id || selectedSite.tenantId || "").trim();
      if (!siteTenantId) {
        setSiteTickets([]);
        return;
      }

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          glpi_ticket_id,
          site,
          region,
          entity,
          city,
          problem,
          materials,
          technician,
          status,
          intervention_date,
          resolved,
          future_needs,
          closing_notes,
          slot,
          opened_at,
          expected_close_date,
          closed_at,
          urgent,
          site_id,
          customer_id,
          tenant_id,
          source,
          glpi_entity_path,
          ticket_type,
          created_at
        `)
        .eq("tenant_id", siteTenantId)
        .eq("site_id", selectedSite.id)
        .order("created_at", { ascending: false })
        .range(0, 99);

      if (error) {
        console.log("Errore caricamento ticket sede:", error);
        setSiteTickets([]);
        return;
      }

      setSiteTickets((data || []).map(mapTicketRow));
    }

    loadSiteTickets();
  }, [selectedSite?.id, selectedSite?.tenant_id]);

  const relatedSites = useMemo(() => {
    if (selectedSite) return [selectedSite];

    if (selectedEntity) {
      return sites.filter((site) => siteMatchesSelectedEntity(site, selectedEntity));
    }

    if (!currentCustomer) return [];

    return sites.filter((site) => {
      if (
        sameId(site.customer_id, currentCustomer.id) ||
        sameId(site.customerId, currentCustomer.id)
      ) {
        return true;
      }

      const customerName = expandSearchText(currentCustomer.name || "");
      const siteText = expandSearchText(`
        ${site.name || ""}
        ${site.entity || ""}
        ${site.city || ""}
        ${site.region || ""}
        ${site.glpi_entity_path || ""}
      `);

      return Boolean(customerName && hasExactPhrase(siteText, customerName));
    });
  }, [sites, selectedSite, selectedEntity, currentCustomer]);

  const relatedTickets = useMemo(() => {
    if (!currentCustomer && !selectedSite && !selectedEntity) return [];

    if (selectedSite) {
      return tickets.filter((ticket) => ticketMatchesSelectedSite(ticket, selectedSite));
    }

    if (selectedEntity) {
      if (entityTickets.length > 0) return entityTickets;
      return tickets.filter((ticket) => ticketMatchesSelectedEntity(ticket, selectedEntity));
    }

    if (currentCustomer) {
      return tickets.filter((ticket) => ticketMatchesSelectedCustomer(ticket, currentCustomer));
    }

    return [];
  }, [tickets, currentCustomer, selectedSite, selectedEntity, entityTickets]);

  function selectResult(result: any) {
    setSelectedSite(result.site || null);
    setSelectedCustomer(result.entity ? null : result.customer || null);
    setSelectedEntity(result.entity || null);
    setSearch(result.label || "");
  }

  function resetSearch() {
    setSearch("");
    setSelectedSite(null);
    setSelectedCustomer(null);
    setSelectedEntity(null);
    setSiteTickets([]);
    setEntityTickets([]);
  }

  function selectSiteFromWorkspace(site: any) {
    const customer = findCustomerForSite(site, customers) || currentCustomer || null;
    setSelectedSite(site || null);
    setSelectedCustomer(customer);
    setSelectedEntity(null);
    setEntityTickets([]);
    setSearch(site?.name || customer?.name || "");
  }

  return (
    <section className={executiveMode ? "mx-auto grid w-full max-w-5xl gap-5 rounded-[34px] border border-cyan-300/10 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(251,191,36,0.10),transparent_26%),linear-gradient(135deg,rgba(2,7,19,0.96),rgba(7,19,33,0.94)_48%,rgba(3,7,17,0.98))] p-5 shadow-[0_28px_100px_rgba(0,0,0,0.40)] backdrop-blur-2xl md:p-8" : "mx-auto grid w-full max-w-5xl gap-5 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 md:p-8"}>
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">{executiveMode ? "ATLAS COMMAND" : "ATLAS CRM"}</p>
        <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Cerca una sede o un cliente</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
          Parti dalla posizione reale: trovi contratto, chiamate e asset collegati, poi apri la chiamata corretta.
        </p>
      </div>

      <div className="relative">
        <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelectedSite(null);
            setSelectedCustomer(null);
            setSelectedEntity(null);
            setSiteTickets([]);
            setEntityTickets([]);
          }}
          placeholder="Scrivi sede, città, ente, cliente o nodo GLPI..."
          className="w-full rounded-3xl border border-white/10 bg-slate-950/70 py-5 pl-14 pr-5 text-base font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-500 md:text-lg"
        />

        {query.length >= 2 && !currentLabel && (
          <div className="absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-3xl border border-white/10 bg-[#081523] shadow-2xl">
            {results.length === 0 ? (
              <div className="p-5 text-sm font-bold text-slate-400">Nessun risultato trovato.</div>
            ) : (
              results.map((result) => (
                <button key={result.id} onClick={() => selectResult(result)} className="flex w-full items-center gap-4 border-b border-white/10 p-4 text-left transition hover:bg-blue-500/10 last:border-b-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-300">
                    <Building2 size={21} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white md:text-base">{result.label}</p>
                    <p className="truncate text-xs font-bold text-slate-500">{result.subtitle || "Dettagli non disponibili"}</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-500" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {currentLabel && (
        <CustomerWorkspace
          currentCustomer={currentCustomer}
          selectedSite={selectedSite}
          currentLabel={currentLabel}
          relatedTickets={relatedTickets}
          relatedSites={relatedSites}
          onSelectSite={selectSiteFromWorkspace}
          onOpenTicket={onOpenTicket}
          onReset={resetSearch}
        />
      )}
    </section>
  );
}
