import { createClient } from "@supabase/supabase-js";
import mysql from "mysql2/promise";

type SyncGlpiEntitiesArgs = {
  tenantId: string;
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

function splitPath(value: any) {
  return String(value || "")
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
}

function detectEntityType(name: string, completeName: string) {
  const text = `${name} ${completeName}`.toLowerCase();

  if (text.includes("webvime")) return "system";
  if (text.includes("rfi")) return "customer";
  if (text.includes("carabinieri")) return "customer";
  if (text.includes("polfer")) return "customer";
  if (text.includes("polizia")) return "customer";
  if (text.includes("ministero")) return "customer";
  if (text.includes("secom")) return "internal";
  if (text.includes("lazio") || text.includes("sicilia") || text.includes("campania") || text.includes("lombardia")) {
    return "area";
  }

  return "entity";
}

export async function syncGlpiEntitiesToAtlas({ tenantId }: SyncGlpiEntitiesArgs) {
  const supabaseAdmin = createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const glpi = await getGlpiConnection();

  try {
    const [rows] = await glpi.execute(
      `
      SELECT
        id,
        name,
        completename,
        entities_id
      FROM glpi_entities
      ORDER BY completename ASC
      `,
    );

    const entities = rows as any[];

    let processed = 0;
    let upserted = 0;
    let errors = 0;

    for (const entity of entities) {
      processed += 1;

      try {
        const completeName = entity.completename || entity.name || "";
        const parts = splitPath(completeName);
        const level = Math.max(0, parts.length - 1);

        const payload = {
          tenant_id: tenantId,
          glpi_entity_id: Number(entity.id),
          parent_glpi_entity_id: entity.entities_id ? Number(entity.entities_id) : null,
          name: entity.name || parts[parts.length - 1] || `Entità ${entity.id}`,
          complete_name: completeName,
          level,
          path_parts: parts,
          entity_type: detectEntityType(entity.name || "", completeName),
          is_active: true,
          raw: entity,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from("customer_entities")
          .upsert(payload, {
            onConflict: "tenant_id,glpi_entity_id",
          });

        if (error) throw error;
        upserted += 1;
      } catch (error: any) {
        errors += 1;
        await supabaseAdmin.from("glpi_import_errors").insert({
          tenant_id: tenantId,
          glpi_ticket_id: null,
          stage: "glpi_entity_tree_sync",
          message: error?.message || error?.details || JSON.stringify(error),
          raw: { error, entity },
        });
      }
    }

    return {
      ok: true,
      processed,
      upserted,
      errors,
    };
  } finally {
    await glpi.end();
  }
}
