"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { AtlasUser } from "@/lib/auth";
import { resolveAtlasUser, signOutAtlasUser } from "@/lib/supabaseAuth";
import { supabase } from "@/lib/supabase";

type AtlasAuthContextValue = {
  user: AtlasUser | null;
  loading: boolean;
  refreshUser: (sessionOverride?: Session | null) => Promise<AtlasUser | null>;
  signOut: () => Promise<void>;
};

const AtlasAuthContext = createContext<AtlasAuthContextValue | null>(null);

const SESSION_TIMEOUT_MS = 10_000;
const PROFILE_TIMEOUT_MS = 15_000;

function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    Promise.resolve(promise).then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function clearStoredSupabaseSession() {
  if (typeof window === "undefined") return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (!key) continue;

      const isSupabaseAuthKey =
        (key.startsWith("sb-") && key.endsWith("-auth-token")) ||
        key.includes("supabase.auth");

      if (isSupabaseAuthKey) {
        storage.removeItem(key);
      }
    }
  }
}

export function AtlasAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAtlasAuthState();

  return (
    <AtlasAuthContext.Provider value={auth}>
      {auth.user?.mustChangePassword ? (
        <ForcePasswordChange
          user={auth.user}
          refreshUser={auth.refreshUser}
          signOut={auth.signOut}
        />
      ) : (
        children
      )}
    </AtlasAuthContext.Provider>
  );
}

function useAtlasAuthState(): AtlasAuthContextValue {
  const [user, setUser] = useState<AtlasUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);

  const storeUser = useCallback((nextUser: AtlasUser | null) => {
    currentUserIdRef.current = nextUser?.id ?? null;
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(
    async (
      sessionOverride?: Session | null,
    ): Promise<AtlasUser | null> => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        let session: Session | null;

        if (sessionOverride !== undefined) {
          session = sessionOverride;
        } else {
          const { data, error } = await withTimeout(
            supabase.auth.getSession(),
            SESSION_TIMEOUT_MS,
            "Timeout ripristino sessione Supabase",
          );

          if (error) throw error;
          session = data.session;
        }

        if (!session?.user) {
          if (mountedRef.current && requestId === requestIdRef.current) {
            storeUser(null);
          }
          return null;
        }

        const atlasUser = await withTimeout(
          resolveAtlasUser(session.user, session.access_token),
          PROFILE_TIMEOUT_MS,
          "Timeout caricamento profilo ATLAS",
        );

        if (!atlasUser) {
          throw new Error(
            "Accesso riuscito, ma il profilo ATLAS non è associato a un tenant attivo.",
          );
        }

        if (mountedRef.current && requestId === requestIdRef.current) {
          storeUser(atlasUser);
        }

        return atlasUser;
      } catch (error) {
        console.error("ATLAS session/profile resolution failed", error);

        if (mountedRef.current && requestId === requestIdRef.current) {
          storeUser(null);
        }

        throw error;
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [storeUser],
  );

  const signOut = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      await withTimeout(
        signOutAtlasUser(),
        SESSION_TIMEOUT_MS,
        "Timeout chiusura sessione Supabase",
      );
    } catch (error) {
      console.error("ATLAS sign out failed; clearing local auth session", error);
      clearStoredSupabaseSession();
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        storeUser(null);
        setLoading(false);
      }
    }
  }, [storeUser]);

  useEffect(() => {
    mountedRef.current = true;

    void refreshUser().catch(() => {
      // refreshUser chiude comunque loading nel finally.
      // L'utente torna al login e può vedere l'errore al tentativo successivo.
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Non fare chiamate async Supabase dentro questa callback.
        // Il login esplicito passa la Session direttamente a refreshUser.
        if (event === "SIGNED_OUT" || !session) {
          requestIdRef.current += 1;
          storeUser(null);
          setLoading(false);
          return;
        }

        // SIGNED_IN può arrivare più volte quando una PWA mobile riprende il focus.
        // Se l'utente è già caricato, non riaprire il loader.
        if (
          event === "SIGNED_IN" &&
          currentUserIdRef.current === session.user.id
        ) {
          return;
        }

        // INITIAL_SESSION è già gestito dal refreshUser eseguito al mount.
        // TOKEN_REFRESHED non richiede di ricaricare il profilo applicativo.
        // USER_UPDATED è gestito esplicitamente dal flusso cambio password.
      },
    );

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      listener.subscription.unsubscribe();
    };
  }, [refreshUser, storeUser]);

  return useMemo(
    () => ({ user, loading, refreshUser, signOut }),
    [user, loading, refreshUser, signOut],
  );
}

function ForcePasswordChange({
  user,
  refreshUser,
  signOut,
}: {
  user: AtlasUser;
  refreshUser: (sessionOverride?: Session | null) => Promise<AtlasUser | null>;
  signOut: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function savePassword() {
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("La nuova password deve contenere almeno 8 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setSaving(true);

    const { error: updateAuthError } = await supabase.auth.updateUser({
      password,
      data: { temporary_password: false },
    });

    if (updateAuthError) {
      setSaving(false);
      setError(updateAuthError.message || "Errore aggiornamento password.");
      return;
    }

    if (user.tenantUserId) {
      const { error: updateProfileError } = await supabase
        .from("tenant_users")
        .update({
          must_change_password: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.tenantUserId);

      if (
        updateProfileError &&
        !String(updateProfileError.message || "").includes(
          "must_change_password",
        )
      ) {
        setSaving(false);
        setError(
          updateProfileError.message || "Errore aggiornamento profilo utente.",
        );
        return;
      }
    }

    setMessage("Password aggiornata correttamente.");
    setSaving(false);

    try {
      await refreshUser();
    } catch (refreshError) {
      console.error("ATLAS password refresh failed", refreshError);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Password aggiornata, ma il profilo non è stato ricaricato.",
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
          ATLAS Secure Access
        </p>
        <h1 className="mt-3 text-3xl font-black">
          Cambio password obbligatorio
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-400">
          Il tuo account è stato creato con una password provvisoria. Imposta
          una nuova password personale per continuare.
        </p>

        <div className="mt-6 grid gap-3">
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nuova password"
            type="password"
            className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-white outline-none focus:border-blue-400"
          />
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Conferma nuova password"
            type="password"
            className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-white outline-none focus:border-blue-400"
          />

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/15 p-3 text-sm font-bold text-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-sm font-bold text-emerald-200">
              {message}
            </div>
          )}

          <button
            onClick={savePassword}
            disabled={saving || !password || !confirmPassword}
            className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Aggiornamento..." : "Imposta nuova password"}
          </button>

          <button
            onClick={signOut}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-slate-200 hover:bg-white/[0.1]"
          >
            Esci
          </button>
        </div>
      </div>
    </main>
  );
}

export function useAtlasAuth() {
  const context = useContext(AtlasAuthContext);
  if (context) return context;
  return useAtlasAuthState();
}
