import { useState, useEffect } from "react";
import { Cookie, ShieldCheck, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  COOKIE_STORAGE_KEY,
  DEFAULT_COOKIE_PREFERENCES,
  type CookiePreferences,
} from "@/lib/cookie-consent";

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_COOKIE_PREFERENCES);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (stored) {
        setPrefs(JSON.parse(stored));
      } else {
        const timer = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const savePreferences = (updated: Partial<CookiePreferences>) => {
    const finalPrefs: CookiePreferences = {
      ...prefs,
      ...updated,
      essential: true,
      answered: true,
      timestamp: new Date().toISOString(),
    };
    setPrefs(finalPrefs);
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(finalPrefs));
    } catch {
      // Ignora erro de quota ou storage indisponível
    }
    setOpen(false);
    setModalOpen(false);
  };

  const acceptAll = () => {
    savePreferences({ analytics: true, marketing: true });
  };

  const acceptEssentialOnly = () => {
    savePreferences({ analytics: false, marketing: false });
  };

  if (!open && !modalOpen) return null;

  return (
    <>
      {open && (
        <aside
          role="region"
          aria-label="Consentimento de Cookies e Privacidade"
          className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 bg-background/95 backdrop-blur-md border-t-2 border-primary/30 shadow-2xl transition-all animate-in slide-in-from-bottom duration-300"
        >
          <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
                <Cookie className="h-6 w-6" />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-foreground flex items-center gap-2">
                  Privacidade e Cookies no Carita's Pets
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 rounded-full px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3" /> LGPD Compliant
                  </span>
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-3xl">
                  Utilizamos cookies essenciais para manter sua sessão segura e permitir a adoção
                  responsável. Cookies de desempenho e métricas analíticas permanecem{" "}
                  <b>desativados por padrão</b> e só serão ativados com sua expressa autorização.
                  Veja nossa{" "}
                  <a
                    href="/privacidade"
                    className="underline font-semibold text-primary hover:text-primary/80"
                  >
                    Política de Privacidade
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="gap-1.5 text-xs font-semibold border-primary/30 hover:bg-primary/5"
              >
                <Settings2 className="h-3.5 w-3.5 text-primary" /> Preferências
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={acceptEssentialOnly}
                className="text-xs font-semibold"
              >
                Apenas Essenciais
              </Button>
              <Button size="sm" onClick={acceptAll} className="text-xs font-bold shadow-sm">
                Aceitar Todos
              </Button>
            </div>
          </div>
        </aside>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
              <Cookie className="h-5 w-5" /> Configuração de Preferências de Privacidade
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem controle
              total sobre quais categorias de cookies deseja autorizar em sua navegação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-primary/20 bg-accent/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    Cookies Estritamente Necessários
                    <span className="text-[10px] uppercase font-bold bg-primary text-primary-foreground rounded px-1.5 py-0.5">
                      Sempre Ativos
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Indispensáveis para autenticação, segurança contra fraudes e funcionamento do
                    chat.
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <h4 className="font-bold text-sm text-foreground">
                    Cookies de Desempenho e Métricas
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permitem entender quantas adoções foram intermediadas e quais regiões do DF
                    demandam mais resgates.
                  </p>
                </div>
                <Switch
                  checked={prefs.analytics}
                  onCheckedChange={(checked) => setPrefs({ ...prefs, analytics: checked })}
                />
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <h4 className="font-bold text-sm text-foreground">
                    Comunicações e Campanhas (Vaquinhas)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permitem exibir atualizações sobre vaquinhas e mutirões de castração relevantes
                    na sua região.
                  </p>
                </div>
                <Switch
                  checked={prefs.marketing}
                  onCheckedChange={(checked) => setPrefs({ ...prefs, marketing: checked })}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-2 border-t border-primary/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={acceptEssentialOnly}
              className="text-xs"
            >
              Rejeitar Não Essenciais
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  savePreferences({ analytics: prefs.analytics, marketing: prefs.marketing })
                }
                className="text-xs font-bold"
              >
                Salvar Minhas Preferências
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
