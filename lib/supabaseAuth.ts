"use client";

import { supabase } from "@/lib/supabase";
import type { AtlasUser } from "@/lib/auth";

export async function signInWithEmailPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmailPassword(email: string, password: string, name?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
    },
  });
}

export async function signOutAtlasUser() {
  return supabase.auth.signOut();
}

async function resolveAtlasUserViaServer(accessToken: string): Promise<AtlasUser | null> {
  const response = await fetch("/api/auth/resolve-user", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json().catch(() => null);
  return result?.user || null;
}

export async function resolveAtlasUser(sessionUser: any): Promise<AtlasUser | null> {
  if (!sessionUser?.id || !sessionUser?.email) return null;

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) return null;

  // Risoluzione lato server con service role: evita che RLS blocchi cliente_user.
  return resolveAtlasUserViaServer(accessToken);
}
