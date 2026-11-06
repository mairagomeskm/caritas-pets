import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {}

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("caritas_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user) return { user };
        } catch {}
      }
      const registered = localStorage.getItem("caritas_registered");
      if (registered === "true") {
        return {
          user: {
            id: "guest_user",
            email: "adotante@caritas.local",
            user_metadata: { name: "Adotante", profile_type: "adotante" },
          },
        };
      }
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
