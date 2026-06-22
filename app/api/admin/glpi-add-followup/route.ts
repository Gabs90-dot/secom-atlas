import { NextResponse, type NextRequest } from "next/server";
import mysql from "mysql2/promise";

import type { AtlasRole } from "@/lib/auth";
import { requireGlpiEnabledForTenant } from "@/lib/server/glpiTenantGuard";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

const GLPI_FOLLOWUP_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin", "manager", "dispatcher"];

type TicketLookupRow = {
  id: string | number;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

async function getGlpiConnection() {
  return mysql.createConnection({
    host: getEnv("GLPI_DB_HOST"),
    port: Number(process.env.GLPI_DB_PORT || 3306),
    user: getEnv("GLPI_DB_USER"),
    password: getEnv("GLPI_DB_PASSWORD"),
    database: getEnv("GLPI_DB_NAME"),
    charset: "utf8mb4",
  });
}

function htmlEscape(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function legacyString(value: unknown): string {
  return String(value || "").trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Errore invio followup GLPI";
}

export async function POST(request: NextRequest) {
  let glpi: mysql.Connection | null = null;

  try {
    const body = toRecord(await request.json());

    const ticketId = Number(body.ticketId);
    const content = legacyString(body.content);
    const tenantId = legacyString(body.tenantId);

    if (!tenantId || !ticketId || !content) {
      return NextResponse.json(
        {
          ok: false,
          error: "tenantId, ticketId o content mancanti",
        },
        { status: 400 },
      );
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: GLPI_FOLLOWUP_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const glpiGuard = await requireGlpiEnabledForTenant(auth.serviceClient, auth.requester);

    if (glpiGuard) {
      return glpiGuard;
    }

    const { data: ticketData, error: ticketError } = await auth.serviceClient
      .from("tickets")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("glpi_ticket_id", ticketId)
      .maybeSingle();

    if (ticketError) {
      throw ticketError;
    }

    const atlasTicket = ticketData as TicketLookupRow | null;

    if (!atlasTicket) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ticket GLPI non trovato per il tenant.",
        },
        { status: 404 },
      );
    }

    glpi = await getGlpiConnection();

    await glpi.execute(
      `
      INSERT INTO glpi_itilfollowups (
        itemtype,
        items_id,
        date,
        users_id,
        content,
        is_private,
        requesttypes_id
      )
      VALUES (
        'Ticket',
        ?,
        NOW(),
        2,
        ?,
        0,
        1
      )
      `,
      [ticketId, htmlEscape(content)],
    );

    return NextResponse.json({
      ok: true,
      ticketId,
    });
  } catch (error: unknown) {
    console.error("GLPI add followup error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  } finally {
    if (glpi) {
      await glpi.end();
    }
  }
}
