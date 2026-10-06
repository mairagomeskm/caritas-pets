import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Heart,
  Search,
  Sparkles,
  CheckCircle2,
  Share2,
  Info,
  ShieldCheck,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { openPetChat } from "@/lib/chat";
import { FilterPill } from "@/components/FilterPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { REGIONS } from "@/lib/regions";

export const Route = createFileRoute("/adocao")({
  head: () => ({
    meta: [
      { title: "Adoção Responsável — Carita's Pets DF" },
      {
        name: "description",
        content:
          "Encontre cães, gatos e filhotes para adotar no Distrito Federal. Conheça as fichas completas, temperamento e histórias de superação.",
      },
      { property: "og:title", content: "Pets para Adoção no DF — Carita's Pets" },
      {
        property: "og:description",
        content: "Cães e gatos resgatados esperando um lar cheio de carinho em Brasília e regiões.",
      },
    ],
  }),
  component: AdocaoPage,
});

export interface PetItem {
  id: string;
  name: string;
  species: "cao" | "gato" | string;
  gender?: "macho" | "femea" | string;
  size?: "pequeno" | "medio" | "grande" | string;
  age_label: string;
  is_puppy: boolean;
  region: string;
  photo_url: string;
  description?: string;
  detailed_story?: string;
  health_status?: string[];
  temperament?: string[];
  organization_name?: string;
  status: "disponivel" | "adotado" | string;
}

const DEFAULT_PETS: PetItem[] = [
  {
    id: "seed-violeta",
    name: "Violeta",
    species: "gato",
    gender: "femea",
    size: "pequeno",
    age_label: "6 meses",
    is_puppy: true,
    region: "Plano Piloto",
    photo_url: "/pets/violeta.jpg",
    description:
      "Gatinha de 6 meses charmosa e dócil. Vermifugada, vacinada (antirrábica), mãe negativa para FIV/FeLV e castração garantida.",
    detailed_story:
      "A Violeta é uma gatinha encantadora, dócil e cheia de charme de 6 meses. Com sua pose charmosa e sua carinha expressiva com lacinho vermelho, conquista qualquer pessoa! Ela é filha de mamãe com teste negativo para FIV e FeLV. Seu protocolo veterinário está rigorosamente em dia: já está vermifugada, vacinada contra raiva (antirrábica) e a castração está 100% garantida. Ela é super carinhosa, sociável, brincalhona e usa a caixinha de areia com perfeição. Procura uma família amorosa e responsável no DF para encher o lar de alegria.",
    health_status: [
      "Vacinada (Antirrábica)",
      "Vermifugada",
      "Mãe negativa para FIV/FeLV",
      "Castração garantida",
    ],
    temperament: [
      "Super dócil",
      "Brincalhona e curiosa",
      "Charmosa e expressiva",
      "Adora carinho",
      "Usa caixinha de areia",
    ],
    organization_name: "Resgatos UnB",
    status: "disponivel",
  },
  {
    id: "seed-higor",
    name: "Higor",
    species: "gato",
    gender: "macho",
    size: "pequeno",
    age_label: "6 meses",
    is_puppy: true,
    region: "Asa Norte (UnB)",
    photo_url: "/pets/higor.jpg",
    description:
      "Gatinho de 6 meses lindo, dócil e curioso. Vermifugado, vacinado (antirrábica), mãe negativa para FIV/FeLV e castração garantida.",
    detailed_story:
      "O Higor é um gatinho tigrado com peito branquinho, olhar doce e muito carinhoso de 6 meses. Ele e a Violeta são do projeto Resgatos UnB. Muito tranquilo e amoroso, ele adora aconchegar-se em mantinhas quentinhas e receber carinho atrás das orelhas. É filho de mamãe testada negativa para FIV e FeLV. Seu protocolo veterinário está rigorosamente em dia: vermifugado, vacinado contra a raiva (antirrábica) e a castração está 100% garantida pelo projeto. Usa caixinha de areia com perfeição e busca um lar responsável em Brasília/DF (apartamento telado ou casa sem rotas de fuga).",
    health_status: [
      "Vacinado (Antirrábica)",
      "Vermifugado",
      "Mãe negativa para FIV/FeLV",
      "Castração garantida",
    ],
    temperament: [
      "Super carinhoso",
      "Tranquilo e curioso",
      "Dócil e companheiro",
      "Adora cobertores",
      "Usa caixinha de areia",
    ],
    organization_name: "Resgatos UnB",
    status: "disponivel",
  },
  {
    id: "seed-rosa",
    name: "Rosa",
    species: "gato",
    gender: "femea",
    size: "pequeno",
    age_label: "6 meses",
    is_puppy: true,
    region: "Asa Norte (UnB)",
    photo_url: "/pets/rosa.jpg",
    description:
      "Gatinha de 6 meses elegante, charmosa e meiga. Vermifugada, vacinada (antirrábica), mãe negativa para FIV/FeLV e castração garantida.",
    detailed_story:
      "A Rosa é uma gatinha linda e graciosa de 6 meses, resgatada junto com seus irmãozinhos pelo projeto Resgatos UnB. Muito carinhosa, expressiva e vaidosa, adora receber carinho e posar elegante com seu lacinho listrado. É filha de mamãe com teste negativo para FIV e FeLV. Seu protocolo veterinário está rigorosamente completo: já está vermifugada, vacinada contra raiva (antirrábica) e possui castração 100% garantida pelo projeto. É super asseada, brincalhona e usa a caixinha de areia com perfeição. Busca uma família responsável em Brasília/DF (apartamento telado ou casa segura) para encher a vida de amor.",
    health_status: [
      "Vacinada (Antirrábica)",
      "Vermifugada",
      "Mãe negativa para FIV/FeLV",
      "Castração garantida",
    ],
    temperament: [
      "Meiga e carinhosa",
      "Elegante e dócil",
      "Brincalhona",
      "Sociável",
      "Usa caixinha de areia",
    ],
    organization_name: "Resgatos UnB",
    status: "disponivel",
  },
  {
    id: "seed-ana",
    name: "Ana (Mãezinha)",
    species: "gato",
    gender: "femea",
    size: "pequeno",
    age_label: "1 a 2 anos",
    is_puppy: false,
    region: "Asa Norte (UnB)",
    photo_url: "/pets/ana.jpg",
    description:
      "Mãezinha dos filhotes (Violeta, Higor e Rosa), 1 a 2 anos, extremamente dócil e amorosa. Castrada, vacinada (antirrábica), vermifugada e negativa para FIV/FeLV.",
    detailed_story:
      "A Ana é a heroica e doce mãezinha de Violeta, Higor e Rosa, resgatada com toda a sua ninhada pelo projeto Resgatos UnB. Jovem (entre 1 e 2 anos), ela cuidou exemplarmente de todos os seus filhotes e agora merece um lar repleto de carinho e tranquilidade. Com seus olhos verdes encantadores e um charmoso laço de florzinhas amarelas, é super mansa, adora ficar deitada em mantas macias e receber cafuné. Seu protocolo veterinário está 100% completo: castrada, vacinada contra a raiva (antirrábica), vermifugada e testada negativa para FIV e FeLV. Muito limpinha e asseada com sua caixinha de areia. Espera por uma adoção amorosa e responsável em Brasília/DF (apartamento telado ou casa sem rotas de fuga).",
    health_status: [
      "Castrada",
      "Vacinada (Antirrábica)",
      "Vermifugada",
      "Testada negativa para FIV/FeLV",
    ],
    temperament: [
      "Extremamente dócil",
      "Calma e amorosa",
      "Mãezona carinhosa",
      "Adora mantinhas e colo",
      "Usa caixinha de areia",
    ],
    organization_name: "Resgatos UnB",
    status: "disponivel",
  },
];

function AdocaoPage() {
  const [filter, setFilter] = useState<"todos" | "filhotes" | "gato" | "cao">("todos");
  const [region, setRegion] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPet, setSelectedPet] = useState<PetItem | null>(null);
  const [blocked, setBlocked] = useState(false);

  const { user, setAuthOpen } = useAuth();
  const navigate = useNavigate();

  const { data: dbPets } = useQuery({
    queryKey: ["pets", "disponivel"],
    initialData: [],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("status", "disponivel")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data;
    },
  });

  const rawPets: PetItem[] = DEFAULT_PETS;

  const list = rawPets.filter((p) => {
    const matchesFilter =
      filter === "todos" ||
      (filter === "filhotes" ? p.is_puppy : p.species === filter);

    const matchesRegion =
      region === "Todas" || p.region === region || p.region.includes(region);

    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.region.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesRegion && matchesSearch;
  });

  const handleInterest = async (pet: PetItem) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("avatar_url, proof_path, profile_type")
        .eq("id", user.id)
        .single();

      const isAdopter = !prof?.profile_type || prof.profile_type === "adotante";
      if (isAdopter && (!prof?.avatar_url || !prof?.proof_path)) {
        setBlocked(true);
        return;
      }

      const cid = await openPetChat(user.id, pet.id, pet.name);
      navigate({ to: "/chats/$id", params: { id: cid } });
    } catch {
      toast.error("Não foi possível iniciar o chat de adoção no momento.");
    }
  };

  const handleSharePet = async (pet: PetItem) => {
    const text = `Conheça ${pet.name}, para adoção responsável no Carita's Pets DF (${pet.region}). Venha dar um lar cheio de amor!`;
    if (navigator.share) {
      await navigator.share({ title: `Adote ${pet.name}`, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      toast.success("Ficha do pet copiada para compartilhar!");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Verification Warning Dialog */}
      <Dialog open={blocked} onOpenChange={setBlocked}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> Complete seu Perfil Verificado
            </DialogTitle>
            <DialogDescription>
              Para a segurança dos animais resgatados, exigimos foto de perfil e comprovante de residência no DF antes de conversar diretamente com a ONG ou protetor.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-accent/60 p-4 border border-primary/20 text-xs text-muted-foreground space-y-2">
            <p><strong>Por que isso é necessário?</strong></p>
            <p>Isso combate o abandono e garante que protetores conversem com adotantes reais e verificados.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setBlocked(false)}>
              Depois
            </Button>
            <Button asChild onClick={() => setBlocked(false)}>
              <Link to="/perfil">Completar Meu Perfil Agora</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header and Introduction */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-primary/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Adote um Companheiro Leal no DF
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Pets Disponíveis para Adoção
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-xl">
            Clique na ficha de qualquer animal para ver seu histórico, vacinas e temperamento. Todos os pets são avaliados por protetores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button asChild variant="outline" className="border-primary/40 text-xs font-bold w-full sm:w-auto">
            <Link to="/comunidade">Ver Histórias Felizes</Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou características (ex: Mel, dócil, porte pequeno)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-10 rounded-md border border-primary/40 bg-card px-3 text-sm font-medium"
            aria-label="Região do DF"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r === "Todas" ? "Todas as Regiões do DF" : r}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Pills */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {([
            ["todos", "Todos os Pets"],
            ["filhotes", "Filhotes"],
            ["gato", "Gatos"],
            ["cao", "Cães"],
          ] as const).map(([k, l]) => (
            <FilterPill key={k} active={filter === k} onClick={() => setFilter(k)}>
              {l}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Pets Grid */}
      {list.length === 0 ? (
        <div className="vintage-card p-12 text-center space-y-3">
          <p className="text-xl font-bold text-primary">Nenhum pet encontrado com esses filtros.</p>
          <p className="text-sm text-muted-foreground">Experimente mudar a espécie ou selecionar "Todas as Regiões".</p>
          <Button
            variant="outline"
            onClick={() => {
              setFilter("todos");
              setRegion("Todas");
              setSearchTerm("");
            }}
          >
            Ver todos os pets
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <article
              key={p.id}
              className="vintage-card group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div>
                {/* Photo & Badges */}
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setSelectedPet(p)}
                >
                  <img
                    src={p.photo_url}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-xs">
                      {p.species === "cao" ? "🐶 Cão" : "🐱 Gato"}
                    </span>
                    {p.is_puppy && (
                      <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-amber-950 shadow-xs">
                        Filhote
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur-xs flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-primary" /> Ver Ficha
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3
                        className="text-2xl font-bold text-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => setSelectedPet(p)}
                      >
                        {p.name}
                      </h3>
                      {p.gender && (
                        <span className="text-xs font-semibold text-muted-foreground capitalize">
                          {p.gender === "femea" ? "♀ Fêmea" : "♂ Macho"}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-primary flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-destructive" />
                      <span>{p.region}</span>
                      <span className="text-muted-foreground">· {p.age_label}</span>
                    </p>
                  </div>

                  {p.description && (
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Quick Temperament Pills */}
                  {p.temperament && p.temperament.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.temperament.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-semibold border-primary/30 hover:bg-primary/10"
                  onClick={() => setSelectedPet(p)}
                >
                  <Info className="h-3.5 w-3.5 mr-1 text-primary" /> Ficha Completa
                </Button>

                <Button
                  size="sm"
                  className="flex-1 text-xs font-bold shadow-sm"
                  onClick={() => handleInterest(p)}
                >
                  <Heart className="h-3.5 w-3.5 mr-1 fill-current text-white" /> Tenho Interesse
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detailed "Ficha do Pet" Modal */}
      <Dialog open={!!selectedPet} onOpenChange={(open) => !open && setSelectedPet(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          {selectedPet && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                    {selectedPet.species === "cao" ? "Cachorro" : "Gatinho"}
                  </span>
                  {selectedPet.is_puppy && (
                    <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-3 py-0.5 text-xs font-bold">
                      Filhote
                    </span>
                  )}
                  {selectedPet.organization_name && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      ONG: <strong>{selectedPet.organization_name}</strong>
                    </span>
                  )}
                </div>

                <DialogTitle className="text-3xl font-extrabold text-foreground flex items-center justify-between">
                  <span>{selectedPet.name}</span>
                </DialogTitle>

                <DialogDescription className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-destructive" />
                  Região de {selectedPet.region} · {selectedPet.age_label}
                </DialogDescription>
              </DialogHeader>

              {/* Large Image */}
              <div className="overflow-hidden rounded-2xl border border-primary/20 aspect-video relative">
                <img
                  src={selectedPet.photo_url}
                  alt={selectedPet.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Key Attributes Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-accent/60 p-2.5 border border-primary/15">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">Espécie</p>
                  <p className="font-bold text-foreground text-sm capitalize">{selectedPet.species === "cao" ? "Canina" : "Felina"}</p>
                </div>
                <div className="rounded-xl bg-accent/60 p-2.5 border border-primary/15">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">Sexo</p>
                  <p className="font-bold text-foreground text-sm capitalize">{selectedPet.gender || "Macho"}</p>
                </div>
                <div className="rounded-xl bg-accent/60 p-2.5 border border-primary/15">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">Idade</p>
                  <p className="font-bold text-foreground text-sm">{selectedPet.age_label}</p>
                </div>
                <div className="rounded-xl bg-accent/60 p-2.5 border border-primary/15">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">Porte</p>
                  <p className="font-bold text-foreground text-sm capitalize">{selectedPet.size || "Médio"}</p>
                </div>
              </div>

              {/* Health and Protocol Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Protocolo de Saúde e Cuidados
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(selectedPet.health_status || ["Vacinado", "Castrado", "Vermifugado"]).map((h) => (
                    <div
                      key={h}
                      className="flex items-center gap-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-2 text-xs font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emotional Story & Personality */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-destructive fill-current" /> A História do(a) {selectedPet.name}
                </h4>
                <div className="rounded-xl bg-muted/40 p-4 border border-primary/10 text-sm leading-relaxed text-foreground/90">
                  {selectedPet.detailed_story || selectedPet.description}
                </div>
              </div>

              {/* Temperament Tags */}
              {selectedPet.temperament && selectedPet.temperament.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                    Traços de Temperamento
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPet.temperament.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-primary/20 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSharePet(selectedPet)}
                  className="gap-2 border-primary/30"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar Ficha
                </Button>

                <Button
                  size="lg"
                  className="flex-1 font-bold gap-2 text-base shadow-md"
                  onClick={() => {
                    const pet = selectedPet;
                    setSelectedPet(null);
                    handleInterest(pet);
                  }}
                >
                  <Heart className="h-5 w-5 fill-current" />
                  Quero Adotar / Falar com o Protetor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
