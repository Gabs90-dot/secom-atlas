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

function includesSmart(haystack: any, query: string) {
  const text = expandSearchText(haystack);
  const q = expandSearchText(query);
  if (!q) return false;

  const tokens = q.split(" ").filter(Boolean);
  return tokens.every((token) => text.includes(token));
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

  const text = expandSearchText(`${site.name} ${site.entity} ${site.city} ${site.region}`);

  return (
    customers.find((customer) => {
      const name = expandSearchText(customer.name);
      const entity = expandSearchText(site.entity);
      return name && (text.includes(name) || (entity && name.includes(entity)));
    }) || null
  );
}

export default function CustomerCommandCenter({
  customers,
  sites,
  tickets,
  onOpenTicket,
}: CustomerCommandCenterProps) {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [siteTickets, setSiteTickets] = useState<any[]>([]);

  const query = normalize(search);

  const results = useMemo(() => {
    if (query.length < 2) return [];

    const siteResults = sites
      .filter((site) =>
        includesSmart(`${site.name} ${site.entity} ${site.city} ${site.region} ${site.address || ""}`, query)
      )
      .slice(0, 8)
      .map((site) => ({
        type: "site" as const,
        id: `site-${site.id || site.name}`,
        label: site.name,
        subtitle: [site.city, site.region, site.entity].filter(Boolean).join(" · "),
        site,
        customer: findCustomerForSite(site, customers),
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
      }));

    return [...siteResults, ...customerResults].slice(0, 10);
  }, [query, sites, customers]);

  const currentCustomer = selectedCustomer || findCustomerForSite(selectedSite, customers);
  const currentLabel = selectedSite?.name || currentCustomer?.name || "";

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

    if (!currentCustomer) return [];

    return sites.filter((site) => {
      const sameCustomer = String(site.customer_id || site.customerId || "") === String(currentCustomer.id || "");
      if (sameCustomer) return true;

      const siteText = expandSearchText(`${site.name} ${site.entity} ${site.city} ${site.region}`);
      const customerName = expandSearchText(currentCustomer.name);
      return Boolean(customerName && siteText.includes(customerName));
    });
  }, [sites, selectedSite, currentCustomer]);

  const relatedTickets = useMemo(() => {
    if (!currentCustomer && !selectedSite) return [];

    if (selectedSite) {
      return siteTickets;
    }

    return tickets.filter((ticket) => {
      const sameCustomer =
        currentCustomer &&
        (
          String(ticket.customerId || "") === String(currentCustomer.id) ||
          String(ticket.customer_id || "") === String(currentCustomer.id)
        );

      const sameText =
        currentCustomer &&
        includesSmart(
          `${ticket.site} ${ticket.entity} ${ticket.city} ${ticket.region}`,
          currentCustomer.name
        );

      return Boolean(sameCustomer || sameText);
    });
  }, [tickets, currentCustomer, selectedSite, siteTickets]);

  function selectResult(result: any) {
    setSelectedSite(result.site || null);
    setSelectedCustomer(result.customer || null);
    setSearch(result.label || "");
  }

  function resetSearch() {
    setSearch("");
    setSelectedSite(null);
    setSelectedCustomer(null);
    setSiteTickets([]);
  }

  function selectSiteFromWorkspace(site: any) {
    const customer = findCustomerForSite(site, customers) || currentCustomer || null;
    setSelectedSite(site || null);
    setSelectedCustomer(customer);
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
            setSiteTickets([]);
          }}
          placeholder="Scrivi sede, città, ente o cliente..."
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
