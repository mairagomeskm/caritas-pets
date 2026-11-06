import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  signOut: () => Promise<void>;
  loginAsGuest: (name?: string, profileType?: string) => void;
  loginWithUser: (u: User) => void;
};

const AuthCtx = createContext<Ctx | null>(null);

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("caritas_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const supaUser = session?.user ?? null;
      if (supaUser) {
        setUser(supaUser);
        localStorage.setItem("caritas_registered", "true");
        localStorage.setItem("caritas_user", JSON.stringify(supaUser));
      } else {
        const local = getStoredUser();
        setUser(local);
      }
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") qc.invalidateQueries();
        if (event === "SIGNED_IN") setAuthOpen(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      const supaUser = data.session?.user ?? null;
      if (supaUser) {
        setUser(supaUser);
        localStorage.setItem("caritas_registered", "true");
        localStorage.setItem("caritas_user", JSON.stringify(supaUser));
      } else {
        const local = getStoredUser();
        setUser(local);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [router, qc]);

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) return false;
      try {
        const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        return !!data;
      } catch {
        return false;
      }
    },
  });

  const loginWithUser = (u: User) => {
    localStorage.setItem("caritas_registered", "true");
    localStorage.setItem("caritas_user", JSON.stringify(u));
    setUser(u);
    setAuthOpen(false);
    router.invalidate();
    qc.invalidateQueries();
  };

  const loginAsGuest = (name = "Adotante Carita's", profileType = "adotante") => {
    const guestUser = {
      id: "guest_" + Date.now(),
      email: "adotante@caritas.local",
      app_metadata: {},
      user_metadata: {
        name,
        profile_type: profileType,
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User;

    localStorage.setItem(
      `profile:${guestUser.id}`,
      JSON.stringify({
        id: guestUser.id,
        name,
        email: guestUser.email,
        phone: "(61) 99999-9999",
        cep: "70000-000",
        address: "Brasília - DF",
        profile_type: profileType,
        proof_path: "comprovante_ok.pdf",
        avatar_url: "/mascot.jpg",
      }),
    );
    loginWithUser(guestUser);
  };

  const signOut = async () => {
    localStorage.removeItem("caritas_user");
    localStorage.removeItem("caritas_registered");
    setUser(null);
    await qc.cancelQueries();
    qc.clear();
    try {
      await supabase.auth.signOut();
    } catch {}
    router.navigate({ to: "/", replace: true });
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        isAdmin: !!user && isAdmin,
        authOpen,
        setAuthOpen,
        signOut,
        loginAsGuest,
        loginWithUser,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
