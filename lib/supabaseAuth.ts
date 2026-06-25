"use client";

import type { User } from "@supabase/supabase-js";
import type { AtlasUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const PROFILE_REQUEST_TIMEOUT_MS = 12_000;

export async function signInWithEmailPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  name?: string,
) {
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

async function resolveAtlasUserViaServer(
  accessToken: string,
): Promise<AtlasUser | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, PROFILE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/auth/resolve-user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error ||
          `Risoluzione profilo ATLAS non riuscita (${response.status}).`,
      );
    }

    return result?.user || null;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Timeout durante il caricamento del profilo ATLAS.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function resolveAtlasUser(
  sessionUser: User,
  accessToken?: string,
): Promise<AtlasUser | null> {
  if (!sessionUser?.id || !sessionUser?.email) return null;

  let token = accessToken;

  if (!token) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    token = data.session?.access_token;
  }

  if (!token) return null;

  // Quando possibile il token viene passato direttamente dalla sessione:
  // evita un secondo getSession durante il login e riduce le gare Auth su mobile.
  return resolveAtlasUserViaServer(token);
}
