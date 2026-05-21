"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      await supabase.auth.getSession();
      router.replace("/");
    }

    handleCallback();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
          ATLAS
        </p>
        <h1 className="mt-3 text-2xl font-black">Accesso in corso...</h1>
        <p className="mt-2 text-sm font-bold text-slate-400">
          Stiamo completando il collegamento del tuo account.
        </p>
      </div>
    </main>
  );
}