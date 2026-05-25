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

  return {
    id: `entity-${entity.id}`,
    name: entity.name,
    entity_type: entity.entity_type,
    glpi_entity_id: entity.glpi_entity_id,
    complete_name: entity.complete_name,
    contract_type: "Entità GLPI",
    sla_hours: 48,
  };
}

export default function CustomerCommandCenter({
  customers,
  sites,
  tickets,
  customerEntities = [],
  onOpenTicket,
}: CustomerCommandCenterProps) {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [siteTickets, setSiteTickets] = useState<any[]>([]);

  const query = normalize(search);

  const results = useMemo(() => {
    if (query.length < 2) return [];

    const siteResults = sites
      .filter((site) =>
        includesSmart(
          `${site.name} ${site.entity} ${site.city} ${site.region} ${site.address || ""} ${site.glpi_entity_path || ""}`,
          query,
        )
      )
      .slice(0, 8)
      .map((site) => ({
        type: "site" as const,
        id: `site-${site.id || site.name}`,
        label: site.name,
        subtitle: [site.city, site.region, site.entity].filter(Boolean).join(" · "),
        site,
        customer: findCustomerForSite(site, customers),
        entity: null,
      }));

    const customerResults = customers
      .filter((customer) => includesSmart(`${customer.name} ${customer.contract_type || ""} ${customer.referent || ""}`, query))
      .slice(0, 6)
      .map((customer) => ({
        type: "customer" as const,
        id: `customer-${customer.id}`,
        label: customer.name,
        subtitle: [customer.contract_type || "Contratto n/d", `SLA ${customer.sla_hours || 48}h`].join(" · "),
        site: null,
        customer,
        entity: null,
      }));

    const entityResults = customerEntities
      .map((entity) => ({
        entity,
        searchText: `${entity.name || ""} ${entity.complete_name || ""} ${(entity.path_parts || []).join(" ")}`,
      }))
      .filter((item) => includesSmart(item.searchText, query))
      .sort((a, b) => {
        const aScore = resultScore(a.searchText, query);
        const bScore = resultScore(b.searchText, query);

        const normalizedQuery = expandSearchText(query);
        const aExact = hasExactPhrase(expandSearchText(a.searchText), normalizedQuery);
        const bExact = hasExactPhrase(expandSearchText(b.searchText), normalizedQuery);

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return bScore - aScore;
      })
      .slice(0, 20)
      .map(({ entity }) => ({
        type: "entity" as const,
        id: `entity-${entity.id || entity.glpi_entity_id}`,
        label: entity.name || entity.complete_name || "Entità GLPI",
        subtitle: entity.complete_name || "Entità GLPI",
        site: null,
        customer: entityAsCustomer(entity),
        entity,
      }));

    const ticketPathResults = tickets
      .map((ticket) => {
        const path = ticket.glpi_entity_path || ticket.glpiEntityPath || "";
        const parts = String(path)
          .split(">")
          .map((part) => part.trim())
          .filter(Boolean)
          .filter((part) => part.toLowerCase() !== "root");

        return {
          ticket,
          path,
          label: parts[parts.length - 1] || ticket.site || "Nodo GLPI",
          searchText: `${path} ${ticket.site || ""} ${ticket.entity || ""} ${ticket.city || ""} ${ticket.region || ""}`,
        };
      })
      .filter((item) => item.path && includesSmart(item.searchText, query))
      .sort((a, b) => {
        const aScore = resultScore(a.searchText, query);
        const bScore = resultScore(b.searchText, query);

        const normalizedQuery = expandSearchText(query);
        const aExact = hasExactPhrase(expandSearchText(a.searchText), normalizedQuery);
        const bExact = hasExactPhrase(expandSearchText(b.searchText), normalizedQuery);

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return bScore - aScore;
      })
      .slice(0, 10)
      .map((item) => ({
        type: "entity" as const,
        id: `ticket-path-${item.ticket.id}`,
        label: item.label,
        subtitle: item.path,
        site: null,
        customer: entityAsCustomer({
          id: `path-${item.ticket.id}`,
          name: item.label,
          complete_name: item.path,
          entity_type: "glpi_path",
          glpi_entity_id: null,
        }),
        entity: {
          id: `path-${item.ticket.id}`,
          name: item.label,
          complete_name: item.path,
          entity_type: "glpi_path",
        },
      }));

    const merged = [
  ...entityResults,
  ...ticketPathResults,
  ...customerResults,
  ...siteResults,
];
    const seen = new Set<string>();

    return merged
      .filter((item) => {
        const key = `${item.type}-${item.label}-${item.subtitle}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 20);
  }, [query, sites, customers, customerEntities, tickets]);

  const currentCustomer = selectedCustomer || entityAsCustomer(selectedEntity) || findCustomerForSite(selectedSite, customers);
  const currentLabel = selectedSite?.name || selectedEntity?.name || currentCustomer?.name || "";

  useEffect(() => {
    async function loadSiteTickets() {
      if (!selectedSite?.id) {
        setSiteTickets([]);
        return;
      }

      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("site_id", selectedSite.id)
        .order("created_at", { ascending: false })
        .range(0, 999);

      if (error) {
        console.log("Errore caricamento ticket sede:", error);
        setSiteTickets([]);
        return;
      }

      setSiteTickets((data || []).map(mapTicketRow));
    }

    loadSiteTickets();
  }, [selectedSite?.id]);

  const relatedSites = useMemo(() => {
    if (selectedSite) return [selectedSite];

    if (selectedEntity) {
      const entityText = expandSearchText(`${selectedEntity.name || ""} ${selectedEntity.complete_name || ""}`);
      return sites.filter((site) =>
        includesSmart(
          `${site.name} ${site.entity} ${site.city} ${site.region} ${site.glpi_entity_path || ""}`,
          entityText,
        ),
      );
    }

    if (!currentCustomer) return [];

    return sites.filter((site) => {
      const sameCustomer = String(site.customer_id || site.customerId || "") === String(currentCustomer.id || "");
      if (sameCustomer) return true;

      const siteText = expandSearchText(`${site.name} ${site.entity} ${site.city} ${site.region} ${site.glpi_entity_path || ""}`);
      const customerName = expandSearchText(currentCustomer.name);
      return Boolean(customerName && siteText.includes(customerName));
    });
  }, [sites, selectedSite, selectedEntity, currentCustomer]);

  const relatedTickets = useMemo(() => {
    if (!currentCustomer && !selectedSite && !selectedEntity) return [];

    if (selectedSite) {
      return siteTickets;
    }

    return tickets.filter((ticket) => {
      const ticketText = `${ticket.site || ""} ${ticket.entity || ""} ${ticket.city || ""} ${ticket.region || ""} ${ticket.glpi_entity_path || ""}`;

      if (selectedEntity) {
        const entityName = selectedEntity.name || "";
        const entityPath = selectedEntity.complete_name || "";
        return (
          includesSmart(ticketText, entityName) ||
          (entityPath && includesSmart(ticketText, entityPath))
        );
      }

      const sameCustomer =
        currentCustomer &&
        (
          String(ticket.customerId || "") === String(currentCustomer.id) ||
          String(ticket.customer_id || "") === String(currentCustomer.id)
        );

      const sameText =
        currentCustomer &&
        includesSmart(ticketText, currentCustomer.name);

      return Boolean(sameCustomer || sameText);
    });
  }, [tickets, currentCustomer, selectedSite, selectedEntity, siteTickets]);

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
  }

  function selectSiteFromWorkspace(site: any) {
    const customer = findCustomerForSite(site, customers) || currentCustomer || null;
    setSelectedSite(site || null);
    setSelectedCustomer(customer);
    setSelectedEntity(null);
    setSearch(site?.name || customer?.name || "");
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-5 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 md:p-8">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">ATLAS CRM</p>
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
                    {result.type === "site" ? <MapPin size={21} /> : <Building2 size={21} />}
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
