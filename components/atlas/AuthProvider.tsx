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
  return <AtlasAuthContext.Provider value={auth}>{children}</AtlasAuthContext.Provider>;
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

export function useAtlasAuth() {
  const context = useContext(AtlasAuthContext);
  if (context) return context;
  return useAtlasAuthState();
}
