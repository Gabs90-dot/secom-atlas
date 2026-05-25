import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

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

export async function POST(request: NextRequest) {
  let glpi: mysql.Connection | null = null;

  try {
    const body = await request.json();

    const ticketId = Number(body?.ticketId);
    const content = String(body?.content || "").trim();

    if (!ticketId || !content) {
      return NextResponse.json(
        {
          ok: false,
          error: "ticketId o content mancanti",
        },
        { status: 400 },
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
  } catch (error: any) {
    console.error("GLPI add followup error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Errore invio followup GLPI",
      },
      { status: 500 },
    );
  } finally {
    if (glpi) {
      await glpi.end();
    }
  }
}
