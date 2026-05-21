export type AtlasAISeverity = "critical" | "warning" | "info" | "success";
export type AtlasAIInsightType =
  | "priority"
  | "dispatch"
  | "sla"
  | "customer_risk"
  | "anomaly"
  | "operations";

export type AtlasAIInsight = {
  id: string;
  type: AtlasAIInsightType;
  severity: AtlasAISeverity;
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  score: number;
  relatedTicketId?: string | number;
  relatedCustomerId?: string | number;
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

function ticketDateValue(ticket: any) {
  return ticket.openedAt || ticket.opened_at || ticket.created_at || ticket.date || ticket.intervention_date || "";
}

function plannedDateValue(ticket: any) {
  return ticket.date || ticket.intervention_date || "";
}

function daysSince(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (!time || Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function isClosed(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("chiuso") || status.includes("risolto") || status.includes("validato");
}

function isBlocked(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("bloccato") || status.includes("attesa") || status.includes("sospeso");
}

function getTicketText(ticket: any) {
  return normalize(`${ticket.site || ""} ${ticket.problem || ""} ${ticket.status || ""} ${ticket.entity || ""} ${ticket.city || ""} ${ticket.region || ""}`);
}

function severityFromScore(score: number): AtlasAISeverity {
  if (score >= 85) return "critical";
  if (score >= 65) return "warning";
  if (score >= 40) return "info";
  return "success";
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function generateAIInsights({
  tickets,
  customers = [],
  sites = [],
  technicians = [],
}: {
  tickets: any[];
  customers?: any[];
  sites?: any[];
  technicians?: string[];
}): AtlasAIInsight[] {
  const activeTickets = tickets.filter((ticket) => !isClosed(ticket));
  const urgentTickets = activeTickets.filter((ticket) => Boolean(ticket.urgent));
  const blockedTickets = activeTickets.filter(isBlocked);
  const unassignedTickets = activeTickets.filter((ticket) => !ticket.technician);
  const unscheduledTickets = activeTickets.filter((ticket) => !plannedDateValue(ticket));
  const oldTickets = activeTickets.filter((ticket) => daysSince(ticketDateValue(ticket)) >= 7);

  const insights: AtlasAIInsight[] = [];

  const criticalKeywords = [
    "bloccante",
    "bloccato",
    "fermo",
    "down",
    "offline",
    "non funziona",
    "urgente",
    "impossibile",
    "errore",
    "guasto",
    "rotto",
    "server",
    "rete",
    "network",
    "firewall",
    "vpn",
  ];

  const highRiskTickets = activeTickets
    .map((ticket) => {
      const text = getTicketText(ticket);
      const keywordHits = criticalKeywords.filter((keyword) => text.includes(keyword));
      const age = daysSince(ticketDateValue(ticket));
      const score = Math.min(
        100,
        (ticket.urgent ? 35 : 0) +
          (isBlocked(ticket) ? 25 : 0) +
          Math.min(25, age * 3) +
          Math.min(25, keywordHits.length * 8) +
          (!ticket.technician ? 10 : 0) +
          (!plannedDateValue(ticket) ? 8 : 0)
      );
      return { ticket, score, keywordHits, age };
    })
    .filter((item) => item.score >= 55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  highRiskTickets.forEach(({ ticket, score, keywordHits, age }) => {
    insights.push({
      id: `priority-${ticket.id}`,
      type: "priority",
      severity: severityFromScore(score),
      title: `Priorità suggerita alta per ticket #${ticket.id}`,
      description: `${ticket.site || "Sede n/d"}: ${ticket.problem || "nessuna descrizione"}`,
      evidence: [
        ticket.urgent ? "Marcato come urgente" : "Non marcato urgente",
        isBlocked(ticket) ? "Stato bloccato/in attesa" : `Stato: ${ticket.status || "n/d"}`,
        age > 0 ? `Aperto da ${age} giorni` : "Aperto oggi o data non disponibile",
        keywordHits.length > 0 ? `Keyword critiche: ${keywordHits.join(", ")}` : "Nessuna keyword critica forte",
      ],
      recommendation: ticket.technician
        ? "Verifica presa in carico e aggiorna stato operativo."
        : "Assegna subito un tecnico dal Dispatch e pianifica una finestra di intervento.",
      score,
      relatedTicketId: ticket.id,
      relatedCustomerId: ticket.customerId || ticket.customer_id || undefined,
    });
  });

  if (unassignedTickets.length > 0) {
    const score = Math.min(100, 45 + unassignedTickets.length * 7 + urgentTickets.filter((ticket) => !ticket.technician).length * 15);
    insights.push({
      id: "dispatch-unassigned",
      type: "dispatch",
      severity: severityFromScore(score),
      title: `${unassignedTickets.length} ticket senza tecnico`,
      description: "La coda contiene ticket attivi non assegnati. Questo crea rischio operativo e falsa percezione di controllo.",
      evidence: [
        `${unassignedTickets.length} ticket non assegnati`,
        `${urgentTickets.filter((ticket) => !ticket.technician).length} urgenti senza tecnico`,
        `${unscheduledTickets.length} ticket non pianificati`,
      ],
      recommendation: "Apri Dispatch e assegna prima urgenti, poi ticket vecchi oltre 7 giorni.",
      score,
    });
  }

  const workload = technicians.map((technician) => {
    const assigned = activeTickets.filter((ticket) => normalize(ticket.technician) === normalize(technician));
    return {
      technician,
      assigned: assigned.length,
      urgent: assigned.filter((ticket) => Boolean(ticket.urgent)).length,
      blocked: assigned.filter(isBlocked).length,
      score: assigned.length * 12 + assigned.filter((ticket) => Boolean(ticket.urgent)).length * 15 + assigned.filter(isBlocked).length * 10,
    };
  });
  const overloaded = workload.filter((item) => item.score >= 70).sort((a, b) => b.score - a.score);

  if (overloaded.length > 0) {
    const top = overloaded[0];
    const score = Math.min(100, top.score);
    insights.push({
      id: `workload-${normalize(top.technician)}`,
      type: "dispatch",
      severity: severityFromScore(score),
      title: `Possibile sovraccarico tecnico: ${top.technician}`,
      description: `${top.technician} ha ${top.assigned} ticket attivi, ${top.urgent} urgenti e ${top.blocked} bloccati/in attesa.`,
      evidence: [`Load score ${score}/100`, `${top.assigned} ticket attivi`, `${top.urgent} urgenti`, `${top.blocked} bloccati/in attesa`],
      recommendation: "Ribilanciare i ticket non critici verso tecnici meno carichi prima di nuove assegnazioni.",
      score,
    });
  }

  const customerGroups = new Map<string, any[]>();
  activeTickets.forEach((ticket) => {
    const key = String(ticket.customerId || ticket.customer_id || ticket.entity || ticket.site || "Cliente non collegato");
    customerGroups.set(key, [...(customerGroups.get(key) || []), ticket]);
  });

  Array.from(customerGroups.entries())
    .map(([customerKey, group]) => {
      const urgent = group.filter((ticket) => Boolean(ticket.urgent)).length;
      const blocked = group.filter(isBlocked).length;
      const old = group.filter((ticket) => daysSince(ticketDateValue(ticket)) >= 7).length;
      const score = Math.min(100, group.length * 9 + urgent * 20 + blocked * 20 + old * 12);
      const label = group[0]?.entity || group[0]?.site || customerKey;
      return { customerKey, group, urgent, blocked, old, score, label };
    })
    .filter((item) => item.score >= 45 && item.group.length >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .forEach((item) => {
      insights.push({
        id: `customer-risk-${item.customerKey}`,
        type: "customer_risk",
        severity: severityFromScore(item.score),
        title: `Cliente/area a rischio: ${item.label}`,
        description: `Concentrazione anomala di ticket attivi collegati allo stesso cliente/area.`,
        evidence: [
          `${item.group.length} ticket attivi`,
          `${item.urgent} urgenti`,
          `${item.blocked} bloccati/in attesa`,
          `${item.old} aperti da oltre 7 giorni`,
        ],
        recommendation: "Aprire workspace cliente e verificare se esiste una causa ricorrente o un'escalation commerciale/operativa.",
        score: item.score,
        relatedCustomerId: item.customerKey,
      });
    });

  const regionGroups = new Map<string, any[]>();
  activeTickets.forEach((ticket) => {
    const key = ticket.region || ticket.city || "Area non definita";
    regionGroups.set(key, [...(regionGroups.get(key) || []), ticket]);
  });

  Array.from(regionGroups.entries())
    .map(([region, group]) => ({ region, group, score: Math.min(100, group.length * 10 + group.filter((ticket) => ticket.urgent).length * 15) }))
    .filter((item) => item.score >= 55 && item.group.length >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .forEach((item) => {
      insights.push({
        id: `area-anomaly-${normalize(item.region)}`,
        type: "anomaly",
        severity: severityFromScore(item.score),
        title: `Anomalia geografica: ${item.region}`,
        description: `Concentrazione elevata di ticket attivi nella stessa area.`,
        evidence: [
          `${item.group.length} ticket attivi in area`,
          `${item.group.filter((ticket) => ticket.urgent).length} urgenti`,
          `${unique(item.group.map((ticket) => ticket.site).filter(Boolean)).slice(0, 3).join(", ") || "Sedi non definite"}`,
        ],
        recommendation: "Verifica sulla mappa se conviene raggruppare interventi e pianificare dispatch geografico.",
        score: item.score,
      });
    });

  if (oldTickets.length > 0) {
    const maxAge = Math.max(...oldTickets.map((ticket) => daysSince(ticketDateValue(ticket))));
    const score = Math.min(100, 50 + oldTickets.length * 6 + maxAge * 2);
    insights.push({
      id: "sla-aging-risk",
      type: "sla",
      severity: severityFromScore(score),
      title: `${oldTickets.length} ticket in aging operativo`,
      description: "Ticket aperti da oltre 7 giorni indicano rischio SLA e perdita di controllo operativo.",
      evidence: [`Ticket più vecchio: ${maxAge} giorni`, `${blockedTickets.length} bloccati/in attesa`, `${urgentTickets.length} urgenti attivi`],
      recommendation: "Filtra aging nel Dispatch, aggiorna stati e chiudi o riassegna i ticket dormienti.",
      score,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "system-stable",
      type: "operations",
      severity: "success",
      title: "Sistema operativo sotto controllo",
      description: "Non emergono anomalie forti dai dati attuali.",
      evidence: [`${activeTickets.length} ticket attivi`, `${urgentTickets.length} urgenti`, `${blockedTickets.length} bloccati/in attesa`],
      recommendation: "Continua monitoraggio da Dispatch, Activity e KPI.",
      score: 20,
    });
  }

  return insights.sort((a, b) => b.score - a.score).slice(0, 12);
}

export function calculateAISummary(insights: AtlasAIInsight[]) {
  const critical = insights.filter((item) => item.severity === "critical").length;
  const warning = insights.filter((item) => item.severity === "warning").length;
  const avgScore = insights.length
    ? Math.round(insights.reduce((sum, item) => sum + item.score, 0) / insights.length)
    : 0;

  return {
    critical,
    warning,
    total: insights.length,
    avgScore,
    label: critical > 0 ? "Critico" : warning > 0 ? "Da monitorare" : "Stabile",
  };
}
