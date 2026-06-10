"use client";

import { useState } from "react";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { signInWithEmailPassword } from "@/lib/supabaseAuth";

type LoginScreenProps = {
  onDone?: () => void;
};

export default function LoginScreen({ onDone }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");

    const result = await signInWithEmailPassword(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error.message || "Errore autenticazione");
      return;
    }

    onDone?.();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600/20 text-blue-200">
            <ShieldCheck size={30} />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ATLAS Secure Access</p>
          <h1 className="mt-3 text-3xl font-black">Accesso operativo</h1>
          <p className="mt-2 text-sm font-bold text-slate-400">
            Accesso riservato agli utenti creati da Super Admin/Admin. La registrazione libera è disabilitata.
          </p>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-black text-slate-300">
            Email
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@azienda.it"
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 pl-11 text-white outline-none focus:border-blue-400"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-black text-slate-300">
            Password
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 pl-11 text-white outline-none focus:border-blue-400"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/15 p-3 text-sm font-bold text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="mt-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Accesso in corso..." : "Entra in ATLAS"}
          </button>

          <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-slate-400">
            Per nuovi accessi interni usa Utenti → Nuovo utente. Per clienti esterni usa Registrati come nuovo cliente con codice invito.
          </p>
        </div>
      </div>
    </main>
  );
}
