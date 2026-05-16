import { NextResponse } from "next/server";

type GlpiTicketPayload = {
  atlasTicketId?: string | number;
  site?: string;
  region?: string;
  entity?: string;
  city?: string;
  problem?: string;
  materialIds?: string[];
  materials?: string[];
  cost?: number;
  technician?: string;
  status?: string;
  date?: string;
  slot?: string;
  ticketType?: "ordinaria" | "straordinaria" | string;
  contractName?: string;
  contractEntity?: string;
};

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function buildTicketContent(payload: GlpiTicketPayload) {
  const materials = payload.materials?.length
    ? payload.materials.join(" + ")
    : "Nessun materiale indicato";

  return [
    `<strong>Ticket creato da ATLAS</strong>`,
    `<br><br><strong>ID ATLAS:</strong> ${payload.atlasTicketId ?? "n/d"}`,
    `<br><strong>Sede:</strong> ${payload.site || "n/d"}`,
    `<br><strong>Ente:</strong> ${payload.entity || "n/d"}`,
    `<br><strong>Città:</strong> ${payload.city || "n/d"}`,
    `<br><strong>Regione:</strong> ${payload.region || "n/d"}`,
    `<br><strong>Contratto rilevato:</strong> ${payload.contractName || "n/d"}`,
    `<br><strong>Macro entità:</strong> ${payload.contractEntity || "n/d"}`,
    `<br><strong>Tipo chiamata:</strong> ${(payload.ticketType || "ordinaria").toUpperCase()}`,
    `<br><strong>Tecnico ATLAS:</strong> ${payload.technician || "Non assegnato"}`,
    `<br><strong>Data/slot:</strong> ${payload.date || "n/d"} ${payload.slot || ""}`,
    `<br><strong>Materiali:</strong> ${materials}`,
    `<br><strong>Costo stimato:</strong> ${Number(payload.cost || 0).toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
    })}`,
    `<br><br><strong>Descrizione intervento:</strong><br>${payload.problem || "Nessuna descrizione"}`,
  ].join("");
}

export async function POST(request: Request) {
  const apiUrl = process.env.GLPI_API_URL;
  const appToken = process.env.GLPI_APP_TOKEN;
  const userToken = process.env.GLPI_USER_TOKEN;

  if (!apiUrl || !appToken || !userToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configurazione GLPI mancante. Controlla GLPI_API_URL, GLPI_APP_TOKEN e GLPI_USER_TOKEN in .env.local.",
      },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as GlpiTicketPayload;
  const baseUrl = cleanBaseUrl(apiUrl);

  let sessionToken = "";

  try {
    const sessionResponse = await fetch(`${baseUrl}/initSession`, {
      method: "GET",
      headers: {
        "App-Token": appToken,
        Authorization: `user_token ${userToken}`,
      },
      cache: "no-store",
    });

    const sessionData = await sessionResponse.json().catch(() => null);

    if (!sessionResponse.ok || !sessionData?.session_token) {
      return NextResponse.json(
        {
          ok: false,
          stage: "initSession",
          status: sessionResponse.status,
          error: sessionData || "GLPI non ha restituito session_token.",
        },
        { status: 502 }
      );
    }

    sessionToken = sessionData.session_token;

    const ticketName = `[ATLAS] ${(payload.ticketType || "ordinaria").toUpperCase()} - ${payload.site || "Nuova chiamata"}`;

    const ticketResponse = await fetch(`${baseUrl}/Ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "App-Token": appToken,
        "Session-Token": sessionToken,
      },
      body: JSON.stringify({
        input: {
          name: ticketName,
          content: buildTicketContent(payload),
          status: 1,
          urgency: payload.ticketType === "straordinaria" ? 4 : 3,
          impact: payload.ticketType === "straordinaria" ? 4 : 3,
          priority: payload.ticketType === "straordinaria" ? 4 : 3,
          type: 1,
        },
      }),
    });

    const ticketData = await ticketResponse.json().catch(() => null);

    if (!ticketResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          stage: "createTicket",
          status: ticketResponse.status,
          error: ticketData || "Errore creazione ticket GLPI.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      glpiTicketId: ticketData?.id ?? ticketData?.[0]?.id ?? null,
      glpiResponse: ticketData,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "GLPI non raggiungibile dal server Next.js.",
      },
      { status: 502 }
    );
  } finally {
    if (sessionToken) {
      fetch(`${baseUrl}/killSession`, {
        method: "GET",
        headers: {
          "App-Token": appToken,
          "Session-Token": sessionToken,
        },
      }).catch(() => undefined);
    }
  }
}
