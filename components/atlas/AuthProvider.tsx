"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AtlasUser } from "@/lib/auth";
import { resolveAtlasUser, signOutAtlasUser } from "@/lib/supabaseAuth";
import { supabase } from "@/lib/supabase";

type AtlasAuthContextValue = {
  user: AtlasUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AtlasAuthContext = createContext<AtlasAuthContextValue | null>(null);

export function AtlasAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAtlasAuthState();

  return (
    <AtlasAuthContext.Provider value={auth}>
      {auth.user?.mustChangePassword ? (
        <ForcePasswordChange user={auth.user} refreshUser={auth.refreshUser} signOut={auth.signOut} />
      ) : (
        children
      )}
    </AtlasAuthContext.Provider>
  );
}

function useAtlasAuthState(): AtlasAuthContextValue {
  const [user, setUser] = useState<AtlasUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    const atlasUser = sessionUser ? await resolveAtlasUser(sessionUser) : null;
    setUser(atlasUser);
    setLoading(false);
  }

  async function signOut() {
    await signOutAtlasUser();
    setUser(null);
  }

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      const atlasUser = sessionUser ? await resolveAtlasUser(sessionUser) : null;
      if (!mounted) return;
      setUser(atlasUser);
      setLoading(false);
    }

    boot();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const atlasUser = session?.user ? await resolveAtlasUser(session.user) : null;
      if (!mounted) return;
      setUser(atlasUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return useMemo(
    () => ({ user, loading, refreshUser, signOut }),
    [user, loading]
  );
}

function ForcePasswordChange({
  user,
  refreshUser,
  signOut,
}: {
  user: AtlasUser;
  refreshUser: () => Promise<void>;
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

      // Compatibility: older DBs may not have must_change_password yet.
      // Login remains usable after auth metadata is updated; the SQL migration below makes this persistent.
      if (updateProfileError && !String(updateProfileError.message || "").includes("must_change_password")) {
        setSaving(false);
        setError(updateProfileError.message || "Errore aggiornamento profilo utente.");
        return;
      }
    }

    setMessage("Password aggiornata correttamente.");
    setSaving(false);
    await refreshUser();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ATLAS Secure Access</p>
        <h1 className="mt-3 text-3xl font-black">Cambio password obbligatorio</h1>
        <p className="mt-2 text-sm font-bold text-slate-400">
          Il tuo account è stato creato con una password provvisoria. Imposta una nuova password personale per continuare.
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

          {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/15 p-3 text-sm font-bold text-red-200">{error}</div>}
          {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-sm font-bold text-emerald-200">{message}</div>}

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
