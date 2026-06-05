import { supabase } from "@/lib/supabase";

export type HelpQueryPayload = {
  category: string;
  title: string;
  keywords?: string;
  sql_text: string;
};

export async function getHelpQueries() {
  const { data, error } = await supabase
    .from("help_queries")
    .select("id, category, title, keywords, sql_text, created_at")
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createHelpQuery(payload: HelpQueryPayload) {
  const { error } = await supabase.from("help_queries").insert(payload);
  if (error) throw error;
}

export async function deleteHelpQuery(id: string) {
  const { error } = await supabase.from("help_queries").delete().eq("id", id);
  if (error) throw error;
}
