import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Pet, PartnerOrg } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { VERIFIED_REAL_PETS, PARTNERS } from "@/data";
import { INITIAL_MISSING_PETS } from "@/data/missing";
import { PartnerCard, PartnerModal, PartnerPixModal } from "@/components/community";
import {
  Search,
  HeartHandshake,
  ShieldCheck,
  Home,
  Syringe,
  Heart,
  Sparkles,
  MapPin,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const hero = "/mascot.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carita's Pets — Adoção de Cães e Gatos no DF" },
      {
        name: "description",
        content:
          "Encontre cães e gatos resgatados para adoção no Distrito Federal. Apoie vaquinhas cirúrgicas de qualquer valor e ajude a encontrar pets perdidos.",
      },
      { property: "og:title", content: "Carita's Pets — Amor e Proteção Animal no DF" },
      {
        property: "og:description",
        content:
          "Adote com perfil verificado, doe via PIX direto e ajude pets desaparecidos em Brasília e regiões.",
      },
      { property: "og:image", content: hero },
      { name: "twitter:image", content: hero },
    ],
  }),
  component: Index,
});

const URGENT_CAMPAIGNS = [
  {
    title: "Fundo Emergencial para Cirurgias Veterinárias",
    location: "Distrito Federal (Clínicas Conveniadas)",
    story:
      "Apoio a cirurgias de fratura, internações e procedimentos ortopédicos de animais resgatados no DF.",
    raised: 2140,
    goal: 3500,
    pct: 61,
    photo: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
  },
  {
    title: "Ração e Suprimentos para Abrigos Parceiros",
    location: "Brasília e Regiões Administrativas",
    story:
      "Compra coletiva de ração Super Premium, sachês e medicamentos para abrigos comunitários no DF.",
    raised: 1420,
    goal: 2000,
    pct: 71,
    photo: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80",
  },
];

function Index() {
  const navigate = useNavigate();
  const { user, setAuthOpen } = useAuth();
  const [selectedPartner, setSelectedPartner] = useState<PartnerOrg | null>(null);
  const [partnerPixModal, setPartnerPixModal] = useState<PartnerOrg | null>(null);
  const isRegistered =
    !!user ||
    (typeof window !== "undefined" && localStorage.getItem("caritas_registered") === "true");

  const { data: realPets = [] } = useQuery({
    queryKey: ["home-pets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pets")
        .select("*")
        .eq("status", "disponivel")
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const { data: dbMissing = [] } = useQuery({
    queryKey: ["home-missing"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("missing_pets")
          .select("id, name, location, photo_url")
          .order("created_at", { ascending: false })
          .limit(3);
        if (error || !data || data.length === 0) {
          return INITIAL_MISSING_PETS.slice(0, 3);
        }
        const filtered = data.filter((d: { name?: string | null }) => {
          const n = (d.name || "").toLowerCase();
          return n !== "caramelo" && n !== "nina";
        });
        return filtered.length > 0 ? filtered : INITIAL_MISSING_PETS.slice(0, 3);
      } catch {
        return INITIAL_MISSING_PETS.slice(0, 3);
      }
    },
  });

  const displayPets = useMemo(() => {
    const map = new Map<string, Pet>();
    realPets.forEach((p) => map.set(p.id, p as Pet));
    VERIFIED_REAL_PETS.forEach((p) => map.set(p.id, p));
    return Array.from(map.values()).slice(0, 12);
  }, [realPets]);

  const handleSeePets = () => {
    navigate({ to: "/adocao" });
  };

  return (
    <div className="space-y-16 pb-14">
      {/* Hero Section */}
      <section className="vintage-card grid overflow-hidden md:grid-cols-12 shadow-md">
        <div className="flex flex-col justify-center gap-5 p-8 md:p-12 md:col-span-7">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary w-fit uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> Brasília & Regiões Administrativas
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold italic leading-tight text-primary">
            Encontre seu novo melhor amigo no DF
          </h1>

          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            Conectamos animais resgatados por ONGs e protetores certificados a famílias amorosas.
            Adoção responsável, vaquinhas transparentes e ajuda mútua.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" onClick={handleSeePets} className="font-bold gap-2 shadow-sm">
              <Heart className="h-5 w-5 fill-current" /> Ver Pets para Adoção
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="font-bold border-primary/40 hover:bg-primary/10"
            >
              <Link to="/vaquinhas">Vaquinhas Solidárias</Link>
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-3 text-xs font-semibold text-muted-foreground">
            <span className="text-foreground">Acesso rápido:</span>
            <Link
              to="/adocao"
              className="rounded-full bg-accent px-3 py-1 text-foreground hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              🐶 Cães
            </Link>
            <Link
              to="/adocao"
              className="rounded-full bg-accent px-3 py-1 text-foreground hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              🐱 Gatos
            </Link>
            <Link
              to="/desaparecidos"
              className="rounded-full bg-accent px-3 py-1 text-destructive font-bold hover:bg-destructive/10 border border-destructive/20 transition-colors"
            >
              🚨 Desaparecidos
            </Link>
          </div>
        </div>

        <div className="relative md:col-span-5 aspect-[4/3] md:aspect-auto overflow-hidden group min-h-[340px]">
          <img
            src={hero}
            alt="Mascote e Modelo Oficial da Carita's Pets"
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-4 right-4 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Mascote Oficial
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:hidden" />
        </div>
      </section>

      {/* Emergency Missing Pets Alert Banner */}
      <section className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive text-white shadow-xs">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Alerta no DF: Pets Procurados Recentemente
              </h2>
              <p className="text-xs text-muted-foreground">
                Ajude as famílias a reencontrarem seus companheiros. Você os viu no DF?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dbMissing.length > 0 && (
              <div className="hidden lg:flex items-center gap-2">
                {dbMissing.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-full bg-background/90 px-2.5 py-1 border border-destructive/20 text-xs shadow-2xs"
                  >
                    <img
                      src={m.photo_url ?? undefined}
                      alt={m.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span className="font-bold text-foreground">{m.name}</span>
                    <span className="text-muted-foreground text-[11px]">({m.location})</span>
                  </div>
                ))}
              </div>
            )}

            <Button asChild size="sm" variant="destructive" className="font-bold shrink-0">
              <Link to="/desaparecidos">Ver Cartazes e Ajudar</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Pets Carousel / Grid */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-primary/20 pb-4">
          <div>
            <span className="text-xs uppercase font-bold text-primary tracking-widest">
              Adoção Responsável
            </span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
              Esperando por um Lar no DF
            </h2>
            <p className="text-sm text-muted-foreground">
              Conheça alguns dos pets resgatados prontos para encher sua casa de carinho.
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            className="text-primary font-bold text-sm hover:bg-primary/10 gap-1 hidden sm:inline-flex"
          >
            <Link to="/adocao">
              Ver todos os pets <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {!isRegistered ? (
          <div className="vintage-card p-8 sm:p-10 text-center space-y-4 rounded-2xl border-2 border-primary/20 bg-accent/30 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Pets Disponíveis para Adoção no DF
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Para a proteção dos animais resgatados, o mural completo com fotos e contatos dos
                protetores é liberado após o cadastro do adotante.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="default" className="font-bold gap-2" onClick={() => setAuthOpen(true)}>
                <Heart className="h-4 w-4 fill-current" /> Cadastre-se para Ver os Pets
              </Button>
              <Button
                variant="outline"
                size="default"
                className="border-primary/30"
                onClick={() => setAuthOpen(true)}
              >
                Já tenho conta / Entrar
              </Button>
            </div>
          </div>
        ) : displayPets.length === 0 ? (
          <div className="vintage-card p-10 text-center space-y-3">
            <Heart className="mx-auto h-10 w-10 text-primary/40" />
            <h3 className="text-lg font-bold text-foreground">
              Todos os nossos amigos resgatados já encontraram um lar ou estão em processo!
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Novos animais resgatados por protetores e ONGs do DF são cadastrados frequentemente.
            </p>
            <Button asChild size="sm" className="font-bold">
              <Link to="/adocao">Ver Mural de Adoção</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayPets.map((pet) => (
              <article
                key={pet.id}
                className="vintage-card group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950/80 flex items-center justify-center">
                    <img
                      src={pet.photo_url || "/mascot.jpg"}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                    />
                    <img
                      src={pet.photo_url || "/mascot.jpg"}
                      alt={pet.name}
                      loading="lazy"
                      className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-md border border-white/20 z-20">
                      {pet.species === "cao" ? "🐶 Cão" : "🐱 Gato"}
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-foreground shadow-xs backdrop-blur-xs flex items-center gap-1 z-20">
                      <MapPin className="h-3 w-3 text-destructive" /> {pet.region}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {pet.name}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {pet.age_label}
                      </span>
                    </div>
                    {pet.description && (
                      <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                        {pet.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Button asChild className="w-full font-bold gap-1.5 shadow-xs">
                    <Link to="/adocao">
                      <Heart className="h-4 w-4 fill-current" /> Conhecer {pet.name}
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {isRegistered && (
          <div className="text-center sm:hidden pt-2">
            <Button asChild variant="outline" className="w-full border-primary/40 font-bold">
              <Link to="/adocao">Ver todos os pets disponíveis</Link>
            </Button>
          </div>
        )}
      </section>

      {/* ONGs e Projetos Parceiros no DF */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-primary/20 pb-4">
          <div>
            <span className="text-xs uppercase font-bold text-primary tracking-widest">
              Rede Credenciada
            </span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
              ONGs e Projetos Parceiros no DF
            </h2>
            <p className="text-sm text-muted-foreground">
              Clique em qualquer organização parceira para abrir o perfil completo, protocolos e
              formas de apoio.
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            className="text-primary font-bold text-sm hover:bg-primary/10 gap-1 hidden sm:inline-flex"
          >
            <Link to="/comunidade">
              Ver comunidade <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PARTNERS.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onSelect={setSelectedPartner}
              onOpenPix={setPartnerPixModal}
            />
          ))}
        </div>
      </section>

      {/* Urgent Campaigns Preview with PIX of Any Amount */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-primary/20 pb-4">
          <div>
            <span className="text-xs uppercase font-bold text-primary tracking-widest">
              Solidariedade Animal
            </span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
              Vaquinhas Solidárias em Andamento
            </h2>
            <p className="text-sm text-muted-foreground">
              Apoie cirurgias e ração de emergência.{" "}
              <strong className="text-foreground">
                Doações de qualquer valor a partir de R$ 1,00
              </strong>
              .
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            className="text-primary font-bold text-sm hover:bg-primary/10 gap-1 hidden sm:inline-flex"
          >
            <Link to="/vaquinhas">
              Ver todas as vaquinhas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {URGENT_CAMPAIGNS.map((camp) => (
            <div
              key={camp.title}
              className="vintage-card overflow-hidden rounded-2xl flex flex-col sm:flex-row gap-4 p-5 hover:shadow-lg transition-shadow"
            >
              <img
                src={camp.photo}
                alt={camp.title}
                className="aspect-square w-full sm:w-40 rounded-xl object-cover shrink-0"
              />
              <div className="flex flex-col justify-between flex-1 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-primary">📍 {camp.location}</span>
                  <h3 className="text-xl font-bold text-foreground leading-snug mt-0.5">
                    {camp.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{camp.story}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-700">{camp.pct}% arrecadado</span>
                    <span className="text-muted-foreground">Meta: R$ {camp.goal}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted border border-primary/30">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${camp.pct}%` }}
                    />
                  </div>
                </div>

                <Button asChild size="sm" className="font-bold shadow-xs">
                  <Link to="/vaquinhas">
                    <Heart className="h-3.5 w-3.5 mr-1 fill-current" /> Doar Qualquer Valor via PIX
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Numbers */}
      <section className="rounded-2xl border-2 border-primary/25 bg-gradient-to-r from-amber-50/60 via-primary/5 to-rose-50/60 p-8 shadow-xs">
        <h3 className="text-center text-xs font-extrabold uppercase tracking-widest text-primary mb-6">
          Impacto Real da Comunidade no Distrito Federal
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-primary">180+</p>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground">
              Vidas Resgatadas
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-primary">140+</p>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground">
              Adoções com Amor
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-primary">33</p>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground">
              Regiões Atendidas no DF
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-primary">100%</p>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground">
              Voluntário e Seguro
            </p>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section>
        <h2 className="mb-2 text-center text-3xl font-extrabold italic text-primary">
          Como funciona a adoção responsável
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Processo transparente criado para priorizar o bem-estar dos animais e a segurança da
          família.
        </p>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            [
              Search,
              "1. Escolha com o Coração",
              "Navegue pelo catálogo com fotos, fichas completas, temperamento e região do DF.",
            ],
            [
              ShieldCheck,
              "2. Perfil Verificado",
              "Envie seu comprovante de residência no DF para liberar o contato direto com a ONG.",
            ],
            [
              HeartHandshake,
              "3. Final Feliz",
              "Converse pelo chat integrado, conheça o animal e leve um novo membro para sua família.",
            ],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Search;
            return (
              <div key={t as string} className="vintage-card p-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary shadow-xs">
                  <I className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t as string}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {d as string}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dicas de Posse Responsável */}
      <section className="space-y-6">
        <h2 className="text-center text-3xl font-extrabold italic text-primary">
          Guia de Posse Responsável
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [
              ShieldCheck,
              "Telas de Proteção",
              "Janelas e sacadas teladas são indispensáveis no DF para evitar quedas graves e fugas.",
            ],
            [
              Home,
              "Adaptação Paciente",
              "Cada animal tem seu tempo. Prepare um cantinho calmo com caminha e água nas primeiras semanas.",
            ],
            [
              Syringe,
              "Saúde em Dia",
              "Mantenha a carteirinha atualizada: vacinas V8/V10, antirrábica e vermífugos regulares.",
            ],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Home;
            return (
              <div
                key={t as string}
                className="rounded-2xl border border-primary/30 bg-accent/60 p-6 space-y-2"
              >
                <I className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-bold text-foreground text-base">{t as string}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {d as string}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <PartnerModal
        partner={selectedPartner}
        isOpen={!!selectedPartner}
        onClose={() => setSelectedPartner(null)}
        onNavigateToAdoption={() => navigate({ to: "/adocao" })}
      />

      <PartnerPixModal
        partner={partnerPixModal}
        isOpen={!!partnerPixModal}
        onClose={() => setPartnerPixModal(null)}
      />
    </div>
  );
}
