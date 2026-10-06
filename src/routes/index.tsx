import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  MessageCircle,
  HeartHandshake,
  ShieldCheck,
  Home,
  Syringe,
  Heart,
  Sparkles,
  MapPin,
  ArrowRight,
  AlertTriangle,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
        content: "Adote com perfil verificado, doe via PIX direto e ajude pets desaparecidos em Brasília e regiões.",
      },
      { property: "og:image", content: hero },
      { name: "twitter:image", content: hero },
    ],
  }),
  component: Index,
});

const FEATURED_PETS = [
  {
    id: "seed-violeta",
    name: "Violeta",
    species: "🐱 Gatinha",
    age: "6 meses (Filhote)",
    region: "Asa Norte (UnB)",
    photo: "/pets/violeta.jpg",
    desc: "Projeto Resgatos UnB: charmosa e dócil, vermifugada, vacinada (antirrábica), mãe FIV/FeLV negativa e castração garantida.",
  },
  {
    id: "seed-higor",
    name: "Higor",
    species: "🐱 Gatinho",
    age: "6 meses (Filhote)",
    region: "Asa Norte (UnB)",
    photo: "/pets/higor.jpg",
    desc: "Projeto Resgatos UnB: carinhoso e tranquilo, vermifugado, vacinado (antirrábica), mãe FIV/FeLV negativa e castração garantida.",
  },
  {
    id: "seed-rosa",
    name: "Rosa",
    species: "🐱 Gatinha",
    age: "6 meses (Filhote)",
    region: "Asa Norte (UnB)",
    photo: "/pets/rosa.jpg",
    desc: "Projeto Resgatos UnB: meiga e charmosa, vermifugada, vacinada (antirrábica), mãe FIV/FeLV negativa e castração garantida.",
  },
  {
    id: "seed-ana",
    name: "Ana (Mãezinha)",
    species: "🐱 Gatinha",
    age: "1 a 2 anos (Adulta)",
    region: "Asa Norte (UnB)",
    photo: "/pets/ana.jpg",
    desc: "Projeto Resgatos UnB: mãezinha dócil e amorosa de Violeta, Higor e Rosa. Castrada, vacinada, vermifugada e FIV/FeLV negativa.",
  },
];

const URGENT_CAMPAIGNS = [
  {
    title: "Cirurgia Ortopédica da Pretinha",
    location: "Cruzeiro / Clínica Asa Norte",
    story: "Pretinha precisa de cirurgia ortopédica urgente na pata traseira após atropelamento covarde.",
    raised: 1540,
    goal: 2500,
    pct: 61,
    photo: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
  },
  {
    title: "Ração para 40 Gatinhos Resgatados",
    location: "Ceilândia Sul",
    story: "Estoque de ração no fim para abrigo com mais de 40 felinos vítimas de abandono.",
    raised: 1120,
    goal: 1800,
    pct: 62,
    photo: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80",
  },
];

const MISSING_ALERTS = [
  { name: "Caramelo", loc: "Cruzeiro Velho", photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&q=80" },
  { name: "Nina", loc: "Asa Sul (SQS 308)", photo: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=200&q=80" },
];

function Index() {
  const { user, setAuthOpen } = useAuth();
  const navigate = useNavigate();

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
            Conectamos animais resgatados por ONGs e protetores certificados a famílias amorosas. Adoção responsável, vaquinhas transparentes e ajuda mútua.
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
            <div className="hidden lg:flex items-center gap-2">
              {MISSING_ALERTS.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center gap-2 rounded-full bg-background/90 px-2.5 py-1 border border-destructive/20 text-xs shadow-2xs"
                >
                  <img src={m.photo} alt={m.name} className="h-6 w-6 rounded-full object-cover" />
                  <span className="font-bold text-foreground">{m.name}</span>
                  <span className="text-muted-foreground text-[11px]">({m.loc})</span>
                </div>
              ))}
            </div>

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
            <span className="text-xs uppercase font-bold text-primary tracking-widest">Adoção Responsável</span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
              Esperando por um Lar no DF
            </h2>
            <p className="text-sm text-muted-foreground">
              Conheça alguns dos pets resgatados prontos para encher sua casa de carinho.
            </p>
          </div>

          <Button asChild variant="ghost" className="text-primary font-bold text-sm hover:bg-primary/10 gap-1 hidden sm:inline-flex">
            <Link to="/adocao">
              Ver todos os pets <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_PETS.map((pet) => (
            <article
              key={pet.id}
              className="vintage-card group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <img
                    src={pet.photo}
                    alt={pet.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-xs">
                    {pet.species}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-foreground shadow-xs backdrop-blur-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-destructive" /> {pet.region}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {pet.name}
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">{pet.age}</span>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                    {pet.desc}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Button
                  asChild
                  className="w-full font-bold gap-1.5 shadow-xs"
                >
                  <Link to="/adocao">
                    <Heart className="h-4 w-4 fill-current" /> Conhecer {pet.name}
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center sm:hidden pt-2">
          <Button asChild variant="outline" className="w-full border-primary/40 font-bold">
            <Link to="/adocao">Ver todos os pets disponíveis</Link>
          </Button>
        </div>
      </section>

      {/* Urgent Campaigns Preview with PIX of Any Amount */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-primary/20 pb-4">
          <div>
            <span className="text-xs uppercase font-bold text-primary tracking-widest">Solidariedade Animal</span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
              Vaquinhas Solidárias em Andamento
            </h2>
            <p className="text-sm text-muted-foreground">
              Apoie cirurgias e ração de emergência. <strong className="text-foreground">Doações de qualquer valor a partir de R$ 1,00</strong>.
            </p>
          </div>

          <Button asChild variant="ghost" className="text-primary font-bold text-sm hover:bg-primary/10 gap-1 hidden sm:inline-flex">
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
                  <h3 className="text-xl font-bold text-foreground leading-snug mt-0.5">{camp.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{camp.story}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-700">{camp.pct}% arrecadado</span>
                    <span className="text-muted-foreground">Meta: R$ {camp.goal}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted border border-primary/30">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${camp.pct}%` }} />
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
            <p className="text-xs md:text-sm font-semibold text-muted-foreground">Vidas Resgatadas</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-primary">140+</p>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground">Adoções com Amor</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-primary">33</p>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground">Regiões Atendidas no DF</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-primary">100%</p>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground">Voluntário e Seguro</p>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section>
        <h2 className="mb-2 text-center text-3xl font-extrabold italic text-primary">
          Como funciona a adoção responsável
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Processo transparente criado para priorizar o bem-estar dos animais e a segurança da família.
        </p>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            [Search, "1. Escolha com o Coração", "Navegue pelo catálogo com fotos, fichas completas, temperamento e região do DF."],
            [ShieldCheck, "2. Perfil Verificado", "Envie seu comprovante de residência no DF para liberar o contato direto com a ONG."],
            [HeartHandshake, "3. Final Feliz", "Converse pelo chat integrado, conheça o animal e leve um novo membro para sua família."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Search;
            return (
              <div key={t as string} className="vintage-card p-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary shadow-xs">
                  <I className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t as string}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{d as string}</p>
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
            [ShieldCheck, "Telas de Proteção", "Janelas e sacadas teladas são indispensáveis no DF para evitar quedas graves e fugas."],
            [Home, "Adaptação Paciente", "Cada animal tem seu tempo. Prepare um cantinho calmo com caminha e água nas primeiras semanas."],
            [Syringe, "Saúde em Dia", "Mantenha a carteirinha atualizada: vacinas V8/V10, antirrábica e vermífugos regulares."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Home;
            return (
              <div
                key={t as string}
                className="rounded-2xl border border-primary/30 bg-accent/60 p-6 space-y-2"
              >
                <I className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-bold text-foreground text-base">{t as string}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
