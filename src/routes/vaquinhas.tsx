import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Heart, Sparkles, Copy, Check, Info, ShieldCheck, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { pixPayload } from "@/lib/pix";
import { useAuth } from "@/hooks/use-auth";
import { openPetChat } from "@/lib/chat";

interface DbCampaign {
  id: string;
  title?: string | null;
  description?: string | null;
  story?: string | null;
  medical_details?: string | null;
  urgency?: string | null;
  photo_url?: string | null;
  goal?: number | string | null;
  raised?: number | string | null;
  donors_count?: number | null;
  pix_key?: string | null;
  pix_name?: string | null;
  active?: boolean | null;
  pets?: { id: string; name: string } | null;
}

export const Route = createFileRoute("/vaquinhas")({
  head: () => ({
    meta: [
      { title: "Vaquinhas Solidárias — Carita's Pets" },
      {
        name: "description",
        content:
          "Doe qualquer valor via PIX e salve vidas. Ajude cirurgias emergenciais, medicamentos e ração para pets resgatados no DF.",
      },
      { property: "og:title", content: "Vaquinhas Solidárias — Salve Vidas no DF" },
      {
        property: "og:description",
        content:
          "Toda doação faz a diferença! Apoie o tratamento e recuperação de animais vulneráveis com qualquer valor.",
      },
    ],
  }),
  component: VaquinhasPage,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface CampaignItem {
  id: string;
  title: string;
  short_description?: string;
  story: string;
  medical_details?: string;
  urgency: string;
  photo_url: string;
  goal: number;
  raised: number;
  donors_count?: number;
  pix_key: string;
  pix_name: string;
  pix_key_type?: string;
  location?: string;
  active: boolean;
  pets?: { id: string; name: string } | null;
}

const DEFAULT_CAMPAIGNS: CampaignItem[] = [
  {
    id: "camp-1",
    title: "Fundo Emergencial para Cirurgias Veterinárias",
    short_description:
      "Apoio a cirurgias de fratura, internações e procedimentos ortopédicos de animais resgatados no DF.",
    story:
      "No Distrito Federal, dezenas de animais são resgatados mensalmente vítimas de atropelamentos e urgências médicas graves. Os custos com placas ortopédicas, exames de imagem e diárias de internação ultrapassam a capacidade de protetores independentes e pequenos abrigos. Este fundo solidário é gerido com total transparência para custear diretamente procedimentos cirúrgicos e medicações em clínicas conveniadas parceiras no DF.",
    medical_details:
      "Custos de cirurgias ortopédicas, osteossínteses, anestesia inalatória, antibioticoterapia e medicações pós-operatórias para animais resgatados.",
    urgency: "Cirurgia Marcada",
    photo_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
    goal: 3500,
    raised: 2140,
    donors_count: 58,
    pix_key: "contato@caritaspets.com.br",
    pix_name: "Carita's Pets Solidário",
    pix_key_type: "Chave E-mail",
    location: "Distrito Federal (Clínicas Conveniadas)",
    active: true,
    pets: null,
  },
  {
    id: "camp-2",
    title: "Ração e Suprimentos para Abrigos Parceiros",
    short_description:
      "Compra coletiva de ração Super Premium, sachês e medicamentos para abrigos comunitários no DF.",
    story:
      "Os abrigos comunitários e lares temporários parceiros no DF acolhem diariamente animais convalescentes, filhotes e idosos resgatados de situações de vulnerabilidade. Manter a nutrição com ração Super Premium e sachês especiais é indispensável para que ganhem imunidade e se recuperem para a adoção. Qualquer valor contribui diretamente para garantir alimentação e desparasitação contínua.",
    medical_details:
      "Compra emergencial de sacos de 15kg de ração Super Premium, vermífugos orais, antiparasitários e sachês para alimentação assistida.",
    urgency: "Alimentação",
    photo_url: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80",
    goal: 2000,
    raised: 1420,
    donors_count: 49,
    pix_key: "contato@caritaspets.com.br",
    pix_name: "Carita's Pets Solidário",
    pix_key_type: "Chave E-mail",
    location: "Brasília e Regiões Administrativas",
    active: true,
    pets: null,
  },
  {
    id: "camp-3",
    title: "Fundo de Castração Solidária e Controle Populacional",
    short_description:
      "Esterilização cirúrgica e vacinação essencial em mutirões comunitários para estancar o abandono.",
    story:
      "A esterilização é a única medida verdadeiramente ética e eficaz para estancar o abandono de ninhadas nas ruas do DF. O Fundo de Castração Solidária apoia mutirões de castração e vacinação antirrábica voltados para colônias de animais resgatados e famílias em vulnerabilidade social em regiões como Gama, Ceilândia e campus Darcy Ribeiro.",
    medical_details:
      "Cirurgias de esterilização realizadas por médicos veterinários com anestesia segura, analgesia e antibioticoterapia preventiva.",
    urgency: "Tratamento Contínuo",
    photo_url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&q=80",
    goal: 2800,
    raised: 1890,
    donors_count: 44,
    pix_key: "contato@caritaspets.com.br",
    pix_name: "Carita's Pets Solidário",
    pix_key_type: "Chave E-mail",
    location: "DF e Entorno",
    active: true,
    pets: null,
  },
];

const PRESET_AMOUNTS = ["5", "10", "20", "50", "100"];

function mapUrgency(urgency?: string | null): string {
  if (!urgency) return "Urgente";
  if (urgency === "critica") return "Cirurgia Marcada";
  if (urgency === "alta") return "Urgente";
  if (urgency === "moderada") return "Tratamento Contínuo";
  return urgency;
}

function VaquinhasPage() {
  const [selectedPix, setSelectedPix] = useState<CampaignItem | null>(null);
  const [storyModalPet, setStoryModalPet] = useState<CampaignItem | null>(null);
  const [amount, setAmount] = useState("10");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { user, setAuthOpen } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, pets(id, name)")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data || []) as DbCampaign[];
    },
  });

  const campaigns: CampaignItem[] =
    data && data.length > 0
      ? data.map((d, idx) => {
          const fallback =
            DEFAULT_CAMPAIGNS[idx % DEFAULT_CAMPAIGNS.length] || DEFAULT_CAMPAIGNS[0]!;
          return {
            id: d.id,
            title: d.title || fallback.title,
            short_description: d.description || fallback.short_description,
            story: d.story || fallback.story,
            medical_details: d.medical_details || fallback.medical_details,
            urgency: mapUrgency(d.urgency || fallback.urgency),
            photo_url: d.photo_url || fallback.photo_url,
            goal: Number(d.goal) || fallback.goal,
            raised: Number(d.raised) || fallback.raised,
            donors_count: d.donors_count ?? fallback.donors_count,
            pix_key: d.pix_key || fallback.pix_key,
            pix_name: d.pix_name || fallback.pix_name,
            pix_key_type: fallback.pix_key_type,
            location: fallback.location,
            active: d.active ?? true,
            pets: d.pets || fallback.pets,
          };
        })
      : DEFAULT_CAMPAIGNS;

  const parsedAmount = Number(amount.replace(",", ".")) || undefined;
  const pixCode = selectedPix
    ? pixPayload({
        key: selectedPix.pix_key,
        name: selectedPix.pix_name,
        amount: parsedAmount,
      })
    : "";

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    toast.success("Chave PIX copiada com sucesso!");
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyCode = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopiedCode(true);
    toast.success("Código PIX Copia e Cola copiado!");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareCampaign = async (c: CampaignItem) => {
    const text = `Apoie a vaquinha solidária: "${c.title}" no Carita's Pets! Aceitamos doações de qualquer valor para salvar esse pet resgatado no DF.`;
    if (navigator.share) {
      await navigator.share({ title: c.title, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      toast.success("Link da vaquinha copiado!");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Solidariedade que transforma
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Vaquinhas Solidárias para Pets no DF
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Ajude a custear cirurgias ortopédicas, medicamentos vitais e ração para animais
              resgatados por ONGs e protetores parceiros.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-sm font-semibold text-primary">
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-primary/20 shadow-xs">
                💝 <strong className="text-foreground">Doações de qualquer valor</strong> (a partir
                de R$ 1,00)
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-primary/20 shadow-xs">
                ⚡ Chave PIX direta e sem intermediários
              </span>
            </div>
          </div>

          <div className="shrink-0 text-center bg-white/90 p-5 rounded-2xl border border-primary/20 shadow-sm max-w-xs">
            <Heart className="h-10 w-10 text-destructive mx-auto mb-2 animate-pulse" />
            <p className="text-xs uppercase font-bold text-muted-foreground">Prestação de Contas</p>
            <p className="text-sm font-medium text-foreground mt-1">
              100% dos valores arrecadados são destinados a clínicas veterinárias e ração.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => {
          const pct =
            c.goal > 0 ? Math.min(100, Math.round((Number(c.raised) / Number(c.goal)) * 100)) : 0;
          return (
            <article
              key={c.id}
              className="vintage-card flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img
                    src={c.photo_url}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-xs">
                      {c.urgency}
                    </span>
                  </div>
                  <button
                    onClick={() => shareCampaign(c)}
                    aria-label="Compartilhar vaquinha"
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-xs"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground leading-snug line-clamp-2">
                      {c.title}
                    </h3>
                    {c.location && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        📍 {c.location}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-primary/5 p-3.5 border border-primary/15 text-sm text-foreground/85 leading-relaxed">
                    <p className="line-clamp-3 italic">"{c.story}"</p>
                    <button
                      type="button"
                      onClick={() => setStoryModalPet(c)}
                      className="mt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Info className="h-3.5 w-3.5" /> Ler história completa do pet
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-primary font-bold">{pct}% arrecadado</span>
                      <span className="text-muted-foreground">Meta: {brl(Number(c.goal))}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border border-primary/30 bg-muted/60">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                      <span>
                        <strong>{brl(Number(c.raised))}</strong> recebidos
                      </span>
                      {c.donors_count && <span>{c.donors_count} doadores solidários</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-2.5">
                <p className="text-center text-xs font-medium text-emerald-800 bg-emerald-50 rounded-md py-1 border border-emerald-200">
                  ✨ Toda contribuição importa! Doe qualquer quantia via PIX
                </p>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 font-bold shadow-sm"
                    onClick={() => {
                      setAmount("10");
                      setSelectedPix(c);
                    }}
                    disabled={!c.pix_key}
                  >
                    <Heart className="h-4 w-4 mr-1 fill-current" /> Doar via PIX
                  </Button>

                  {c.pets && (
                    <Button
                      variant="outline"
                      className="border-primary/30 text-xs px-3"
                      onClick={async () => {
                        if (!user) return setAuthOpen(true);
                        const id = await openPetChat(user.id, c.pets!.id, c.pets!.name);
                        navigate({ to: "/chats/$id", params: { id } });
                      }}
                    >
                      Conversar
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={!!storyModalPet} onOpenChange={(open) => !open && setStoryModalPet(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {storyModalPet && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary w-fit">
                  {storyModalPet.urgency}
                </div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  História de Vida: {storyModalPet.title}
                </DialogTitle>
                <DialogDescription>
                  {storyModalPet.location
                    ? `Resgatado no Distrito Federal (${storyModalPet.location})`
                    : "Animal atendido pela rede Carita's Pets"}
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-hidden rounded-xl border border-primary/20 aspect-video">
                <img
                  src={storyModalPet.photo_url}
                  alt={storyModalPet.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-primary text-base flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-destructive fill-current" /> A Trajetória e
                  Superação
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border border-primary/10">
                  {storyModalPet.story}
                </p>
              </div>

              {storyModalPet.medical_details && (
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Detalhes Clínicos e
                    Procedimentos
                  </h4>
                  <p className="text-xs text-muted-foreground bg-accent/60 p-3 rounded-lg border border-primary/20">
                    {storyModalPet.medical_details}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center">
                <p className="text-sm font-bold text-emerald-950">
                  Ajude com qualquer valor a partir de R$ 1,00
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  O valor vai direto para a conta de tratamento sem intermediários ou taxas.
                </p>
                <Button
                  className="mt-3 w-full font-bold shadow-sm"
                  onClick={() => {
                    const pet = storyModalPet;
                    setStoryModalPet(null);
                    setAmount("10");
                    setSelectedPix(pet);
                  }}
                >
                  Fazer Doação via PIX Agora
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPix} onOpenChange={(open) => !open && setSelectedPix(null)}>
        <DialogContent className="max-w-md">
          {selectedPix && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive fill-current" /> Doar para:{" "}
                  {selectedPix.title}
                </DialogTitle>
                <DialogDescription>
                  Doe qualquer quantia pelo PIX. Todo valor é fundamental!
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Escolha um valor ou digite abaixo (qualquer quantia):
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        amount === amt
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background border-primary/30 text-foreground hover:bg-primary/10"
                      }`}
                    >
                      R$ {amt}
                    </button>
                  ))}
                </div>

                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    className="pl-9 font-bold text-base"
                    placeholder="Outro valor, ex: 15,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-card p-4 border border-primary/25 shadow-xs">
                <QRCodeSVG value={pixCode} size={190} level="M" />
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  Escaneie com o app do seu banco
                </p>
                {parsedAmount && (
                  <p className="text-xs font-bold text-primary mt-0.5">
                    Valor configurado: {brl(parsedAmount)}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-accent/70 p-3 border border-primary/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">
                    Chave PIX Direta ({selectedPix.pix_key_type || "E-mail"}):
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs font-bold text-primary"
                    onClick={() => handleCopyKey(selectedPix.pix_key)}
                  >
                    {copiedKey ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    {copiedKey ? "Copiada!" : "Copiar Chave"}
                  </Button>
                </div>
                <p className="text-xs font-mono font-bold text-foreground break-all bg-background/80 p-1.5 rounded border border-primary/20">
                  {selectedPix.pix_key}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Favorecido: {selectedPix.pix_name}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Código PIX Copia e Cola:
                </label>
                <p className="max-h-16 overflow-y-auto break-all rounded bg-muted/80 p-2 font-mono text-[11px] text-muted-foreground border border-primary/10">
                  {pixCode}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleCopyCode} className="w-full font-bold shadow-sm">
                  {copiedCode ? (
                    <Check className="h-4 w-4 mr-1.5" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1.5" />
                  )}
                  {copiedCode ? "Código Copiado!" : "Copiar PIX Copia e Cola"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPix(null)}
                  className="w-full text-xs"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
