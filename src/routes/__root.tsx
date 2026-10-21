import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportAppError } from "../lib/error-capture";
import { AuthProvider } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/privacy/CookieBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="vintage-card max-w-md p-8 text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="vintage-card max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo deu errado. Tente novamente.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Carita's Pets — Adoção de animais no DF" },
      {
        name: "description",
        content: "Plataforma de adoção, vaquinhas e pets desaparecidos no Distrito Federal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #lovable-badge,
              #lovable-badge-wrap,
              [id*="lovable"],
              [class*="lovable"],
              [data-lovable],
              [data-lovable-badge],
              aside[id*="lovable"],
              div[id*="lovable"],
              a[href*="lovable.dev"],
              a[href*="lovable.app"],
              a[href*="gptengineer"],
              [id*="gptengineer"],
              [class*="gptengineer"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                position: absolute !important;
                top: -99999px !important;
                left: -99999px !important;
                width: 0 !important;
                height: 0 !important;
                max-width: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                z-index: -99999 !important;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var clean = function() {
                  try {
                    var selectors = [
                      '#lovable-badge',
                      '#lovable-badge-wrap',
                      'aside[id*="lovable"]',
                      'div[id*="lovable"]',
                      '[id*="lovable-badge"]',
                      '[class*="lovable"]',
                      '[data-lovable-badge]',
                      '[data-lovable]',
                      'a[href*="lovable.dev"]',
                      'a[href*="lovable.app"]',
                      'a[href*="gptengineer"]',
                      '[id*="gptengineer"]',
                      '[class*="gptengineer"]'
                    ];
                    selectors.forEach(function(sel) {
                      document.querySelectorAll(sel).forEach(function(el) {
                        el.remove();
                      });
                    });
                    document.querySelectorAll('*').forEach(function(el) {
                      if (el.shadowRoot) {
                        selectors.forEach(function(sel) {
                          el.shadowRoot.querySelectorAll(sel).forEach(function(badge) {
                            badge.remove();
                          });
                        });
                      }
                    });
                  } catch (e) {}
                };
                clean();
                if (typeof window !== 'undefined') {
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', clean);
                  }
                  window.addEventListener('load', clean);
                  var observer = new MutationObserver(clean);
                  observer.observe(document.documentElement, { childList: true, subtree: true });
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster />
        <CookieBanner />
      </AuthProvider>
    </QueryClientProvider>
  );
}
