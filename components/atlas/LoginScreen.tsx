"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { signInWithEmailPassword } from "@/lib/supabaseAuth";
import DarkVeil from "./DarkVeil";

type LoginScreenProps = {
  onDone?: () => void;
};

export default function LoginScreen({ onDone }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDesktopVeil, setShowDesktopVeil] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const syncDesktopVeil = () => setShowDesktopVeil(desktopQuery.matches);

    syncDesktopVeil();
    desktopQuery.addEventListener("change", syncDesktopVeil);

    return () => desktopQuery.removeEventListener("change", syncDesktopVeil);
  }, []);

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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#03020a] px-5 py-8 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.28),transparent_34%),radial-gradient(circle_at_88%_88%,rgba(6,182,212,0.16),transparent_30%),linear-gradient(145deg,#05020d_0%,#080615_52%,#02030a_100%)] lg:hidden"
      />

      {showDesktopVeil && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.5}
            scanlineFrequency={0}
            warpAmount={0}
          />
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(135deg,rgba(3,2,10,0.48),rgba(2,3,10,0.76))] lg:block"
      />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-violet-300/20 bg-[linear-gradient(160deg,rgba(10,8,22,0.94),rgba(4,7,18,0.92))] p-6 shadow-[0_30px_100px_rgba(24,7,65,0.58),0_0_55px_rgba(99,102,241,0.10)] backdrop-blur-2xl md:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/25 bg-[linear-gradient(145deg,rgba(8,145,178,0.16),rgba(109,40,217,0.18))] text-cyan-200 shadow-[0_0_36px_rgba(34,211,238,0.14),0_0_54px_rgba(124,58,237,0.12)]">
            <ShieldCheck size={30} />
          </div>

          <p className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-xs font-black uppercase tracking-[0.35em] text-transparent">
            ATLAS Secure Access
          </p>

          <h1 className="mt-3 text-3xl font-black text-white">
            Accesso operativo
          </h1>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
            Accesso riservato agli utenti creati da Super Admin/Admin. La registrazione libera è disabilitata.
          </p>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-black text-slate-300">
            Email
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition"
                size={18}
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@azienda.it"
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-[#060812]/90 p-4 pl-11 text-white outline-none transition placeholder:text-slate-600 hover:border-violet-300/25 focus:border-cyan-300/60 focus:ring-4 focus:ring-violet-500/15"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-black text-slate-300">
            Password
            <div className="relative">
              <LockKeyhole
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition"
                size={18}
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-[#060812]/90 p-4 pl-11 text-white outline-none transition placeholder:text-slate-600 hover:border-violet-300/25 focus:border-cyan-300/60 focus:ring-4 focus:ring-violet-500/15"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm font-bold text-red-100">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="mt-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-5 py-4 text-sm font-black text-white shadow-[0_16px_38px_rgba(59,130,246,0.22),0_0_34px_rgba(124,58,237,0.14)] transition hover:-translate-y-0.5 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Accesso in corso..." : "Entra in ATLAS"}
          </button>

          <p className="rounded-2xl border border-violet-300/15 bg-violet-500/[0.045] px-4 py-3 text-xs font-bold leading-5 text-slate-400">
            Per nuovi accessi interni usa Utenti → Nuovo utente. Per clienti esterni usa Registrati come nuovo cliente con codice invito.
          </p>
        </div>
      </div>
    </main>
  );
}
