import { useState } from "react";
import type { PartnerOrg } from "@/types/partner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Heart,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Package,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface PartnerPixModalProps {
  partner: PartnerOrg | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PartnerPixModal({ partner, isOpen, onClose }: PartnerPixModalProps) {
  const [copiedPix, setCopiedPix] = useState(false);

  if (!partner) return null;

  const handleCopyPixKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedPix(true);
      toast.success("Chave PIX copiada para a área de transferência! 💛");
      setTimeout(() => setCopiedPix(false), 2500);
    } catch {
      toast.error("Não foi possível copiar a chave automaticamente.");
    }
  };

  const instagramHandle = partner.instagramUrl
    ? `@${partner.instagramUrl.replace(/\/$/, "").split("/").pop()}`
    : "@instagram";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6 border border-primary/20">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl border-2 border-primary/20 bg-muted/40 p-1.5 shadow-sm shrink-0">
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-full w-full rounded-xl object-contain"
              />
            </div>
            <div>
              <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                Apoio e Doações Oficiais
              </span>
              <DialogTitle className="text-xl font-black text-foreground">
                {partner.name}
              </DialogTitle>
              {partner.slogan && (
                <p className="text-xs font-semibold text-primary">{partner.slogan}</p>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Sua contribuição apoia diretamente os animais resgatados com alimentação, saúde e
            reabilitação até a adoção definitiva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Opção 1: Doação Financeira via PIX */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                  1
                </span>
                <h4 className="text-sm font-extrabold text-foreground">
                  Doação Financeira (PIX Oficial)
                </h4>
              </div>
              <span className="rounded-md bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                Chave {partner.pixType}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
              <div className="shrink-0 p-2 bg-white rounded-xl shadow-xs border border-border">
                <QRCodeSVG value={partner.pixKey} size={96} level="M" includeMargin={false} />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Chave Copia e Cola:
                </p>
                <p className="text-xs font-mono font-bold text-foreground break-all bg-muted/60 p-2 rounded-lg border border-border/60">
                  {partner.pixKey}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Favorecido: <strong className="text-foreground">{partner.pixName}</strong>
                </p>

                <Button
                  onClick={() => handleCopyPixKey(partner.pixKey)}
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
                >
                  {copiedPix ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedPix ? "Chave Copiada com Sucesso!" : "Copiar Chave PIX"}
                </Button>
              </div>
            </div>

            {/* Apadrinhamento */}
            <div className="rounded-xl border border-emerald-500/20 bg-background/80 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Quer apadrinhar um pet?</strong>
                <p className="mt-0.5">
                  Você pode fazer doações recorrentes para cobrir alimentação e vacinas de um
                  afilhado até que ele encontre uma família!
                </p>
              </div>
            </div>
          </div>

          {/* Opção 2: Doação de Itens e Apoio Presencial */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <h4 className="text-sm font-extrabold text-foreground">
                Doação de Itens, Ração & Lar Temporário
              </h4>
            </div>

            <div className="rounded-xl bg-card p-3.5 border border-border/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Package className="h-4 w-4" />
                <span>O que você pode doar:</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {partner.donationItemsSummary ||
                  "Ração de qualidade, medicamentos veterinários, artigos pet (camas, coleiras, guias, roupinhas) e oferta de lar temporário para acolhimento."}
              </p>
            </div>

            {partner.instagramUrl && (
              <div className="pt-1">
                <Button
                  asChild
                  className="w-full rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:opacity-95 text-white font-bold text-xs gap-2 shadow-sm"
                >
                  <a href={partner.instagramUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Falar pelo Instagram (DM) — {instagramHandle}
                    <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-80" />
                  </a>
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  Envie uma mensagem direta no Instagram oficial para combinar pontos de entrega de
                  doações físicas no DF.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full rounded-xl text-xs font-semibold"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
