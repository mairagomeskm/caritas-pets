import { useState } from "react";
import type { PartnerOrg } from "@/types/partner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  Sparkles,
  MapPin,
  Share2,
  Stethoscope,
  CheckCircle2,
  PawPrint,
  Heart,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Package,
  HeartHandshake,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { RESGATADOS_UNB_PETS, SPIKE_PET, CHICO_PET, MARI_PET, NALA_PET } from "@/data/pets";
import { PartnerPixModal } from "./PartnerPixModal";

const AUMIGOS_PETS = [SPIKE_PET, CHICO_PET, MARI_PET, NALA_PET];

interface PartnerModalProps {
  partner: PartnerOrg | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdoption: () => void;
}

export function PartnerModal({
  partner,
  isOpen,
  onClose,
  onNavigateToAdoption,
}: PartnerModalProps) {
  const [copiedPix, setCopiedPix] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const { user, setAuthOpen } = useAuth();
  const isRegistered =
    !!user ||
    (typeof window !== "undefined" && localStorage.getItem("caritas_registered") === "true");

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

  const handleSharePartner = async (p: PartnerOrg) => {
    const title = `${p.name} — Parceiro Oficial Carita's Pets`;
    const text = `Conheça o trabalho de acolhimento e adoção responsável do ${p.name} no Distrito Federal: ${p.summary}`;
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${title}\n${text}\n${window.location.href}`);
      toast.success("Link do parceiro copiado!");
    }
  };

  const instagramHandle = partner.instagramUrl
    ? `@${partner.instagramUrl.replace(/\/$/, "").split("/").pop()}`
    : "@instagram";

  const isAuMigos = partner.id === "aumigos-do-quadradinho";
  const displayedPets = isAuMigos ? AUMIGOS_PETS : RESGATADOS_UNB_PETS;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-0 border border-primary/20">
          <DialogTitle className="sr-only">{partner.name}</DialogTitle>
          <DialogDescription className="sr-only">{partner.summary}</DialogDescription>
          <div>
            {/* Topo / Capa do Perfil com Gradiente Customizado */}
            <div
              className={`relative bg-gradient-to-r ${partner.coverGradient} p-6 sm:p-7 text-white overflow-hidden`}
            >
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-white p-2 shadow-xl ring-2 ring-white/30 shrink-0">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="h-full w-full object-contain rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-md">
                        {partner.category}
                      </span>
                      <span className="text-xs text-white/80 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {partner.region}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{partner.name}</h2>
                    {partner.slogan && (
                      <p className="text-xs font-bold text-amber-200 tracking-wide">
                        {partner.slogan}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-white/90 font-medium">
                      {partner.leaderRole} • {partner.leader}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação no Cabeçalho */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <Button
                    size="sm"
                    onClick={() => setIsDonationModalOpen(true)}
                    className="rounded-full bg-white text-emerald-800 font-extrabold hover:bg-emerald-50 shadow-md border-0 text-xs gap-1.5"
                  >
                    <Heart className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                    Fazer Doação
                  </Button>

                  {partner.instagramUrl && (
                    <Button
                      size="sm"
                      variant="secondary"
                      asChild
                      className="rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border-0 text-xs font-semibold gap-1"
                    >
                      <a href={partner.instagramUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {instagramHandle}
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSharePartner(partner)}
                    className="rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border-0 text-xs font-semibold"
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1" /> Compartilhar
                  </Button>
                </div>
              </div>
            </div>

            {/* Corpo do Modal em Abas */}
            <div className="p-6">
              <Tabs defaultValue="sobre" className="space-y-6">
                <TabsList className="grid grid-cols-4 w-full rounded-2xl bg-muted/60 p-1">
                  <TabsTrigger value="sobre" className="rounded-xl text-xs font-bold">
                    Sobre & Apoio
                  </TabsTrigger>
                  <TabsTrigger value="saude" className="rounded-xl text-xs font-bold">
                    Protocolos
                  </TabsTrigger>
                  <TabsTrigger value="adocao" className="rounded-xl text-xs font-bold">
                    Adoção ({displayedPets.length})
                  </TabsTrigger>
                  <TabsTrigger value="apoiar" className="rounded-xl text-xs font-bold">
                    Doar / PIX
                  </TabsTrigger>
                </TabsList>

                {/* Aba 1: Sobre & História & Como Ajudar */}
                <TabsContent value="sobre" className="space-y-6 pt-2">
                  {/* Missão e Chamada Principal */}
                  {partner.mission && (
                    <div className="rounded-2xl border-2 border-primary/30 bg-primary/10 p-5 space-y-2 text-center sm:text-left">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold text-primary">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                        Nossa Missão
                      </div>
                      <p className="text-sm sm:text-base font-extrabold text-foreground leading-relaxed">
                        "{partner.mission}"
                      </p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-primary/20 bg-card p-4 sm:p-5 space-y-2 shadow-xs">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      História e Propósito do Parceiro
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium">
                      "{partner.aboutStory}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Metodologia de Atuação
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {partner.rescueMethodology}
                    </p>
                  </div>

                  {/* Seção Como Ajudar (7 Formas de Apoio para AuMigos ou Resgatos) */}
                  {partner.howToHelp && partner.howToHelp.length > 0 && (
                    <div className="space-y-4 pt-2 border-t border-border/80">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                            <HeartHandshake className="h-4 w-4 text-primary" />
                            Como Ajudar ({partner.howToHelp.length} Formas de Apoio)
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Você não precisa adotar para salvar uma vida. Escolha como participar!
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setIsDonationModalOpen(true)}
                          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 shadow-xs"
                        >
                          <Heart className="h-3.5 w-3.5 fill-current" />
                          Doar Agora
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {partner.howToHelp.map((item, idx) => (
                          <div
                            key={item.title}
                            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                                    {idx + 1}
                                  </span>
                                  <h5 className="font-bold text-xs sm:text-sm text-foreground">
                                    {item.title}
                                  </h5>
                                </div>
                                {item.tag && (
                                  <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                                    {item.tag}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Destaques Rápidos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {partner.badges.map((b) => (
                      <div
                        key={b}
                        className="flex items-center justify-center rounded-xl border border-border/80 bg-muted/30 p-2.5 text-center text-xs font-bold text-foreground"
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Aba 2: Protocolos Veterinários */}
                <TabsContent value="saude" className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-emerald-600" />
                      Padrões e Cuidados Veterinários Garantidos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Todos os animais tutelados por este parceiro recebem o seguinte protocolo
                      clínico:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {partner.healthProtocols.map((proto) => (
                      <div
                        key={proto.title}
                        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1.5"
                      >
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{proto.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {proto.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Aba 3: Critérios de Adoção e Ver Animais */}
                <TabsContent value="adocao" className="space-y-5 pt-2">
                  {/* Animais Reais da ONG */}
                  {!isRegistered ? (
                    <div className="rounded-2xl border-2 border-primary/30 bg-accent/30 p-6 text-center space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Lock className="h-6 w-6" />
                      </div>
                      <h4 className="font-extrabold text-base text-foreground">
                        Pets de {partner.name} visíveis após o cadastro
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Faça seu cadastro rápido (sem confirmação de e-mail) para liberar os pets
                        disponíveis para adoção desta ONG.
                      </p>
                      <Button
                        size="sm"
                        className="font-bold gap-1.5"
                        onClick={() => {
                          onClose();
                          setAuthOpen(true);
                        }}
                      >
                        <Heart className="h-3.5 w-3.5 fill-current" /> Fazer Cadastro para Ver os
                        Pets
                      </Button>
                    </div>
                  ) : (
                  <div className="space-y-3 pb-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <PawPrint className="h-4 w-4 text-emerald-600" />
                          Animais sob tutela de {partner.name} ({displayedPets.length})
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Pets resgatados prontos para encher sua casa de amor no DF e entorno.
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        Vacinados & Castrados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {displayedPets.map((pet) => (
                        <div
                          key={pet.id}
                          className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-xs hover:border-emerald-500/40 transition-colors"
                        >
                          <div className="space-y-2.5">
                            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
                              <img
                                src={pet.photo_url}
                                alt={pet.name}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute top-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-md">
                                {pet.gender === "femea" ? "Fêmea" : "Macho"} • {pet.age_label}
                              </div>
                            </div>
                            <div>
                              <h5 className="font-extrabold text-sm text-foreground">{pet.name}</h5>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                {pet.description}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                              {pet.region}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => {
                                onClose();
                                onNavigateToAdoption();
                              }}
                              className="h-7 px-3 text-[11px] font-bold rounded-lg"
                            >
                              Adotar {pet.name}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Requisitos Obrigatórios */}
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Requisitos Obrigatórios para Adoção Responsável
                    </h3>
                    <div className="space-y-2">
                      {partner.adoptionRequirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm text-foreground/90 font-medium">
                            {req}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Aba 4: Como Doar (PIX & Itens) */}
                <TabsContent value="apoiar" className="space-y-5 pt-2">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Doação Direta via PIX
                      </span>
                      <h4 className="text-lg font-black text-foreground">
                        Ajude a custear ração, vacinas e tratamentos
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        100% das contribuições apoiam os animais resgatados de {partner.name}.
                      </p>
                    </div>

                    <div className="rounded-xl bg-card border border-border/80 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">
                          Chave Oficial ({partner.pixType}):
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyPixKey(partner.pixKey)}
                          className="h-7 px-2.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          {copiedPix ? (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 mr-1" />
                          )}
                          {copiedPix ? "Copiada!" : "Copiar Chave"}
                        </Button>
                      </div>
                      <p className="text-xs font-mono font-bold text-foreground break-all bg-muted/60 p-2 rounded-lg">
                        {partner.pixKey}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Favorecido: <strong className="text-foreground">{partner.pixName}</strong>
                      </p>
                    </div>

                    <Button
                      onClick={() => setIsDonationModalOpen(true)}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-sm"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                      Abrir Opções Completas de Doação (PIX / QR Code / Itens)
                    </Button>
                  </div>

                  {/* Doação de Itens e Apoio Presencial */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
                    <h5 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Doação de Itens Físicos e Apoio Voluntário
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {partner.donationItemsSummary}
                    </p>

                    {partner.instagramUrl && (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-xl border-primary/30 text-primary font-bold text-xs gap-2"
                      >
                        <a href={partner.instagramUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4" />
                          Combinar Entrega por DM no Instagram ({instagramHandle})
                          <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
                        </a>
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Rodapé do Modal */}
            <div className="border-t border-border/40 p-4 bg-muted/20 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigateToAdoption();
                }}
                className="text-xs font-semibold"
              >
                Ver Catálogo de Adoção
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsDonationModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                >
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  Doar Agora
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-semibold"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Dedicado de Doação */}
      <PartnerPixModal
        partner={partner}
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
      />
    </>
  );
}
