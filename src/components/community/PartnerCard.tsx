import type { PartnerOrg } from "@/types/partner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Heart, ChevronRight, ExternalLink } from "lucide-react";

interface PartnerCardProps {
  partner: PartnerOrg;
  onSelect: (partner: PartnerOrg) => void;
  onOpenPix: (partner: PartnerOrg) => void;
}

export function PartnerCard({ partner, onSelect, onOpenPix }: PartnerCardProps) {
  const instagramHandle = partner.instagramUrl
    ? `@${partner.instagramUrl.replace(/\/$/, "").split("/").pop()}`
    : null;

  return (
    <div className="vintage-card group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="space-y-4">
        {/* Topo do Card com Logo e Selo */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/20 bg-muted/40 p-1 shadow-xs">
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-full w-full rounded-xl object-contain"
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs ring-2 ring-card">
                <CheckCircle2 className="h-3 w-3" />
              </span>
            </div>
            <div>
              <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                {partner.category}
              </span>
              <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                {partner.name}
              </h3>
              {partner.slogan ? (
                <p className="text-[11px] font-bold text-primary">{partner.slogan}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{partner.region.split("—")[0]}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Descrição resumida */}
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {partner.summary}
        </p>

        {/* Instagram Oficial Clicável */}
        {partner.instagramUrl && instagramHandle && (
          <div className="pt-0.5">
            <a
              href={partner.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-50/70 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <span>{instagramHandle}</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        )}

        {/* Badges de Destaque */}
        <div className="flex flex-wrap gap-1.5">
          {partner.badges.slice(0, 3).map((badge) => (
            <span
              key={badge}
              className="rounded-lg bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Botões de Ação do Parceiro */}
      <div className="mt-5 space-y-2 border-t border-border/40 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenPix(partner)}
            className="rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs font-bold gap-1 shadow-xs"
          >
            <Heart className="h-3.5 w-3.5 fill-emerald-600/30 text-emerald-600" />
            Fazer Doação
          </Button>
          <Button
            size="sm"
            onClick={() => onSelect(partner)}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1 shadow-xs"
          >
            <span>Ver Perfil</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
