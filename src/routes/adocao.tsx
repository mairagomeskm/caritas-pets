import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { REGIONS } from "@/lib/regions";
import { AdoptionConsentModal } from "@/components/privacy/AdoptionConsentModal";

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
  breed?: string;
  weight?: string;
  gender?: "macho" | "femea" | string;
  size?: "pequeno" | "medio" | "grande" | string;
  age_label: string;
  is_puppy: boolean;
  region: string;
  photo_url: string;
  photos?: string[];
  description?: string;
  detailed_story?: string;
  health_status?: string[];
  temperament?: string[];
  organization_name?: string;
  status: "disponivel" | "adotado" | string;
}

export const SPIKE_PET: PetItem = {
  id: "seed-spike",
  name: "Spike",
  species: "cao",
  breed: "Possível mestiço de Fox Paulistinha",
  weight: "Porte pequeno (apenas 9kg)",
  gender: "macho",
  size: "pequeno",
  age_label: "1 ano",
  is_puppy: false,
  region: "Brasília / DF",
  photo_url: "/pets/spike.jpg",
  photos: ["/pets/spike.jpg", "/pets/spike-2.jpg"],
  description:
    "Fox Paulistinha mestiço de 1 ano e 9kg. Sociável com cães, gatos e coelhos. Tímido no início, mas vira puro amor ao confiar!",
  detailed_story:
    "Quem aí ama um Fox Paulistinha? Esse é o Spike, tímido no primeiro encontro, mas basta um pouco de paciência para conquistar esse cãozinho super sociável! Convive muito bem com gatos, coelhos e outros cachorros, e depois que confia, vira puro amor. 🧡\n\nAh! Não se engane pelas fotos: ele é um pítico de 9kgs apenas.\n\n🐶 Macho · 1 ano\n🧬 Possível mestiço de Fox Paulistinha\n🩼 Porte pequeno (9kg)\n💉 Vacinado\n💊 Vermifugado\n✂️ Castrado\n🐾 Super sociável com cães, gatos e coelhos\n🙈 Tímido no início com pessoas\n🥰 Depois que confia, vira puro carinho e aconchego",
  health_status: [
    "Vacinado (Antirrábica + Polivalente)",
    "Vermifugado (Protocolo completo)",
    "Castrado",
    "Porte pequeno (9kg apenas)",
  ],
  temperament: [
    "Super sociável com cães, gatos e coelhos",
    "Tímido no início com pessoas",
    "Muito amoroso após criar vínculo",
    "Dócil e leal",
  ],
  organization_name: "AuMigos do quadradinho",
  status: "disponivel",
};

export const CHICO_PET: PetItem = {
  id: "seed-chico",
  name: "Chico",
  species: "cao",
  breed: "Vira-lata (SRD) Caramelo e Branco",
  weight: "Porte pequeno a médio (12,5kg)",
  gender: "macho",
  size: "medio",
  age_label: "1 ano",
  is_puppy: false,
  region: "Brasília / DF",
  photo_url: "/pets/chico.jpg",
  photos: ["/pets/chico.jpg", "/pets/chico-2.jpg"],
  description:
    "Resgatado com a companheira Mar e 3 filhotes. Charmoso, calmo em casa e dengoso: ama pessoas e adora encostar o rostinho no colo!",
  detailed_story:
    "Oi gente! Esse é o Chico, ele foi resgatado nas ruas ao lado da companheira Mar e 3 filhotes. Charmoso e carente, é daqueles que gostam de encostar o rostinho no colo e ficar por ali, quietinho, só curtindo a companhia. 🧡\n\nInformações importantes:\n🐶 Macho · 1 ano\n🦴 Porte pequeno a médio (12,5kg)\n💉 Vacinado\n💊 Vermifugado\n✂️ Castrado\n🐕 Anda perfeitamente de coleira e guia\n😌 Calmo e companheiro em casa\n🥰 Ama pessoas e adora colo\n🐾 Com outros cães, prefere a companhia de fêmeas\n\nDê uma chance para esse dengoso apaixonante que é o Chico!",
  health_status: [
    "Vacinado (Protocolo completo)",
    "Vermifugado (Em dia)",
    "Castrado",
    "Anda de coleira e guia com facilidade",
    "Porte pequeno a médio (12,5kg)",
  ],
  temperament: [
    "Charmoso e carente",
    "Calmo e comportado em casa",
    "Ama pessoas e adora colo",
    "Prefere a companhia de fêmeas",
    "Dengoso e leal",
  ],
  organization_name: "AuMigos do quadradinho",
  status: "disponivel",
};

export const MARI_PET: PetItem = {
  id: "seed-mari",
  name: "Mari",
  species: "cao",
  breed: "Possível mestiça de Cocker Spaniel",
  weight: "Porte pequeno a médio (14kg)",
  gender: "femea",
  size: "medio",
  age_label: "1 ano e meio",
  is_puppy: false,
  region: "Brasília / DF",
  photo_url: "/pets/mari.jpg",
  photos: ["/pets/mari.jpg"],
  description:
    "Resgatada com o companheiro Chico e 3 filhotes. Calma, extremamente amorosa e sociável com pessoas e outros cães!",
  detailed_story:
    "Mari chegouuuu! Essa fofinha foi resgatada nas ruas ao lado do companheiro Chico e mais 3 filhotes. Mari é calma, amorosa e cheia de disposição para uma nova fase, agora só falta encontrar quem queira dividir o dia a dia com ela. 💖\n\nInformações importantes:\n🐶 Fêmea · 1 ano e meio\n🧬 Possível mestiça de Cocker Spaniel\n📏 Porte pequeno a médio (14kg)\n💉 Vacinada\n💊 Vermifugada\n✂️ Castrada\n💛 Extremamente amorosa e calma em casa\n🐾 Sociável: se dá muito bem com outros cães\n🧑 Apaixonada por humanos: gosta muito de carinho e companhia\n\nDê uma chance para a Mari fazer sua vida muito mais feliz!",
  health_status: [
    "Vacinada (Protocolo completo)",
    "Vermifugada",
    "Castrada",
    "Porte pequeno a médio (14kg)",
  ],
  temperament: [
    "Calma e serena",
    "Extremamente amorosa",
    "Se dá bem com outros cães",
    "Gosta muito de pessoas",
    "Dócil e leal",
  ],
  organization_name: "AuMigos do quadradinho",
  status: "disponivel",
};

export const NALA_PET: PetItem = {
  id: "seed-nala",
  name: "Nala",
  species: "cao",
  breed: "Vira-lata (SRD) Creme Dourado",
  weight: "Porte médio (16kg)",
  gender: "femea",
  size: "medio",
  age_label: "1 ano",
  is_puppy: false,
  region: "Brasília / DF",
  photo_url: "/pets/nala.jpg",
  photos: ["/pets/nala.jpg"],
  description:
    "Um verdadeiro show de recomeço e superação! Alegre, carinhosa, sociável com outros cães e pronta para uma família amorosa.",
  detailed_story:
    "A Nala é um 🪩💃🐕 show de recomeço, daquelas histórias que vão além das cicatrizes e mostram como o amor transforma tudo. Mesmo depois de tudo que enfrentou, machucados que não saravam, ela escolheu ser leve, alegre e seguir confiando. Nala aos poucos vai se aproximando, criando laços e revelando um carinho sincero que conquista de verdade. 🧡\n\nInformações importantes:\n• 🐶 Fêmea · 1 ano\n• ⚖️ 16 kg (Porte médio)\n• ✂️ Castrada\n• 💉 Vacinada\n• 💊 Vermifugada\n• 📏 Porte: médio\n• 🐾 Personalidade: alegre, companheira, sociável com cães e carinhosa (pode ser um pouco insegura com homens no início)\n\nPronta para viver um novo capítulo cheio de amor, cuidado e segurança ao lado de quem escolher ser sua família!",
  health_status: [
    "Vacinada (Protocolo completo)",
    "Vermifugada",
    "Castrada",
    "Recuperada e saudável (16kg)",
    "Porte médio",
  ],
  temperament: [
    "Alegre e radiante",
    "Companheira e carinhosa",
    "Sociável com outros cães",
    "Cria laços sinceros e profundos",
    "Resiliente e dócil",
  ],
  organization_name: "AuMigos do quadradinho",
  status: "disponivel",
};

export const RESGATADOS_UNB_PETS: PetItem[] = [
  {
    id: "seed-violeta",
    name: "Violeta",
    species: "gato",
    gender: "femea",
    size: "pequeno",
    age_label: "6 meses",
    is_puppy: true,
    region: "Asa Norte (UnB)",
    photo_url: "/pets/violeta.jpg",
    description:
      "Gatinha de 6 meses charmosa e dócil. Vermifugada, vacinada (antirrábica), mãe negativa para FIV/FeLV e castração garantida.",
    detailed_story:
      "A Violeta é uma gatinha encantadora, dócil e cheia de charme de 6 meses resgatada pela ONG parceira Resgatados UnB. Com sua pose charmosa e sua carinha expressiva com lacinho vermelho, conquista qualquer pessoa! Ela é filha de mamãe com teste negativo para FIV e FeLV. Seu protocolo veterinário está rigorosamente em dia: já está vermifugada, vacinada contra raiva (antirrábica) e a castração está 100% garantida pelo projeto. É super carinhosa, sociável, brincalhona e usa a caixinha de areia com perfeição. Procura uma família amorosa e responsável no DF para encher o lar de alegria.",
    health_status: [
      "Vacinada (Antirrábica)",
      "Vermifugada com protocolo completo",
      "Mãe testada negativa para FIV e FeLV",
      "Castração 100% garantida",
    ],
    temperament: ["Super dócil", "Charmosa", "Brincalhona", "Usa caixa de areia"],
    organization_name: "Resgatados UnB",
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
      "O Higor é um gatinho tigrado com peito branquinho, olhar doce e muito carinhoso de 6 meses da ONG parceira Resgatados UnB. Muito tranquilo e amoroso, ele adora aconchegar-se em mantinhas quentinhas e receber carinho atrás das orelhas. É filho de mamãe testada negativa para FIV e FeLV. Seu protocolo veterinário está rigorosamente em dia: vermifugado, vacinado contra a raiva (antirrábica) e a castração está 100% garantida pelo projeto. Usa caixinha de areia com perfeição e busca um lar responsável em Brasília/DF (apartamento telado ou casa sem rotas de fuga).",
    health_status: [
      "Vacinado (Antirrábica)",
      "Vermifugado com protocolo completo",
      "Mãe testada negativa para FIV e FeLV",
      "Castração 100% garantida",
    ],
    temperament: ["Super carinhoso", "Calmo", "Adora colo", "Usa caixa de areia"],
    organization_name: "Resgatados UnB",
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
      "A Rosa é uma gatinha linda e graciosa de 6 meses, resgatada junto com seus irmãozinhos pela ONG parceira Resgatados UnB. Muito carinhosa, expressiva e vaidosa, adora receber carinho e posar elegante com seu lacinho listrado. É filha de mamãe com teste negativo para FIV e FeLV. Seu protocolo veterinário está rigorosamente completo: já está vermifugada, vacinada contra raiva (antirrábica) e possui castração 100% garantida pelo projeto. É super asseada, brincalhona e usa a caixinha de areia com perfeição. Busca uma família responsável em Brasília/DF (apartamento telado ou casa segura) para encher a vida de amor.",
    health_status: [
      "Vacinada (Antirrábica)",
      "Vermifugada com protocolo completo",
      "Mãe testada negativa para FIV e FeLV",
      "Castração 100% garantida",
    ],
    temperament: ["Meiga e carinhosa", "Expressiva", "Asseada", "Usa caixa de areia"],
    organization_name: "Resgatados UnB",
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
      "A Ana é a heroica e doce mãezinha de Violeta, Higor e Rosa, resgatada com toda a sua ninhada pela ONG parceira Resgatados UnB. Jovem (entre 1 e 2 anos), ela cuidou exemplarmente de todos os seus filhotes e agora merece um lar repleto de carinho e tranquilidade. Com seus olhos verdes encantadores e um charmoso laço de florzinhas amarelas, é super mansa, adora ficar deitada em mantas macias e receber cafuné. Seu protocolo veterinário está 100% completo: castrada, vacinada contra a raiva (antirrábica), vermifugada e testada negativa para FIV e FeLV. Muito limpinha e asseada com sua caixinha de areia. Espera por uma adoção amorosa e responsável em Brasília/DF (apartamento telado ou casa sem rotas de fuga).",
    health_status: [
      "Castrada com recuperação perfeita",
      "Vacinada (Antirrábica)",
      "Vermifugada com protocolo completo",
      "Testada 100% negativa para FIV e FeLV",
    ],
    temperament: ["Extremamente dócil", "Mansa", "Protetora", "Usa caixa de areia"],
    organization_name: "Resgatados UnB",
    status: "disponivel",
  },
];

export const VERIFIED_REAL_PETS: PetItem[] = [
  SPIKE_PET,
  CHICO_PET,
  MARI_PET,
  NALA_PET,
  ...RESGATADOS_UNB_PETS,
];

function AdocaoPage() {
  const [filter, setFilter] = useState<"todos" | "filhotes" | "gato" | "cao">("todos");
  const [region, setRegion] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPet, setSelectedPet] = useState<PetItem | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [consentPet, setConsentPet] = useState<PetItem | null>(null);

  const { user, setAuthOpen } = useAuth();
  const navigate = useNavigate();

  const { data: dbPets = [], isLoading } = useQuery({
    queryKey: ["pets", "disponivel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("*, organizations(name)")
        .eq("status", "disponivel")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
      })) as PetItem[];
    },
  });

  const rawPets: PetItem[] = useMemo(() => {
    const map = new Map<string, PetItem>();
    VERIFIED_REAL_PETS.forEach((p) => map.set(p.id, p));
    dbPets.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [dbPets]);

  const list = rawPets.filter((p) => {
    const matchesFilter =
      filter === "todos" || (filter === "filhotes" ? p.is_puppy : p.species === filter);

    const matchesRegion = region === "Todas" || p.region === region || p.region.includes(region);

    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.region.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesRegion && matchesSearch;
  });

  const proceedToChat = async (pet: PetItem) => {
    if (!user) return;
    try {
      const cid = await openPetChat(user.id, pet.id, pet.name);
      navigate({ to: "/chats/$id", params: { id: cid } });
    } catch {
      toast.error("Não foi possível iniciar o chat de adoção no momento.");
    }
  };

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

      // Requisito 2 LGPD: Opt-in explícito prévio ao compartilhamento com a ONG/Protetor
      setConsentPet(pet);
    } catch {
      toast.error("Não foi possível processar a solicitação no momento.");
    }
  };

  const handleSharePet = async (pet: PetItem) => {
    const text = `Conheça ${pet.name}, para adoção responsável no Carita's Pets DF (${pet.region}). Venha dar um lar cheio de amor!`;
    if (navigator.share) {
      await navigator
        .share({ title: `Adote ${pet.name}`, text, url: window.location.href })
        .catch(() => {});
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
              Para a segurança dos animais resgatados, exigimos foto de perfil e comprovante de
              residência no DF antes de conversar diretamente com a ONG ou protetor.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-accent/60 p-4 border border-primary/20 text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Por que isso é necessário?</strong>
            </p>
            <p>
              Isso combate o abandono e garante que protetores conversem com adotantes reais e
              verificados.
            </p>
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
            Clique na ficha de qualquer animal para ver seu histórico, vacinas e temperamento. Todos
            os pets são avaliados por protetores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            asChild
            variant="outline"
            className="border-primary/40 text-xs font-bold w-full sm:w-auto"
          >
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
          {(
            [
              ["todos", "Todos os Pets"],
              ["filhotes", "Filhotes"],
              ["gato", "Gatos"],
              ["cao", "Cães"],
            ] as const
          ).map(([k, l]) => (
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
          <p className="text-sm text-muted-foreground">
            Experimente mudar a espécie ou selecionar "Todas as Regiões".
          </p>
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
                  className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950/80 cursor-pointer flex items-center justify-center group"
                  onClick={() => {
                    setSelectedPet(p);
                    setActivePhoto(null);
                  }}
                >
                  {/* Atmospheric blurred ambient backdrop */}
                  <img
                    src={p.photo_url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                  />
                  {/* Sharp full photo: centered and never cut off */}
                  <img
                    src={p.photo_url}
                    alt={p.name}
                    loading="lazy"
                    className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20">
                    <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-md border border-white/20">
                      {p.species === "cao" ? "🐶 Cão" : "🐱 Gato"}
                    </span>
                    {p.is_puppy && (
                      <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-amber-950 shadow-xs">
                        Filhote
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md border border-white/20 flex items-center gap-1 z-20">
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
                  onClick={() => {
                    setSelectedPet(p);
                    setActivePhoto(null);
                  }}
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
      <Dialog
        open={!!selectedPet}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPet(null);
            setActivePhoto(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          {selectedPet && (
            <div className="space-y-6">
              {/* Header Info */}
              <DialogHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 text-primary font-bold text-xs px-3 py-1 flex items-center gap-1">
                    {selectedPet.species === "cao" ? "🐶 Cachorro" : "🐱 Gatinho"}
                  </span>
                  {selectedPet.is_puppy && (
                    <span className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs px-2.5 py-0.5">
                      Filhote
                    </span>
                  )}
                  {selectedPet.organization_name && (
                    <span className="rounded-full bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 ml-auto flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> {selectedPet.organization_name}
                    </span>
                  )}
                </div>

                <DialogTitle className="text-3xl sm:text-4xl font-extrabold text-foreground flex items-center justify-between">
                  <span>{selectedPet.name}</span>
                </DialogTitle>

                <DialogDescription className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-1 text-destructive font-semibold">
                    <MapPin className="h-4 w-4" /> {selectedPet.region}
                  </span>
                  <span>•</span>
                  <span>{selectedPet.age_label}</span>
                  {selectedPet.breed && (
                    <>
                      <span>•</span>
                      <span className="text-primary font-bold">{selectedPet.breed}</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              {/* Main Photo Gallery: 100% Centered & Never Cropped */}
              <div className="space-y-3">
                <div className="relative w-full h-[340px] sm:h-[420px] rounded-2xl overflow-hidden bg-neutral-950 border border-primary/25 flex items-center justify-center shadow-md">
                  {/* Atmospheric blurred ambient background */}
                  <img
                    src={activePhoto || selectedPet.photo_url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none transition-all duration-700"
                  />
                  {/* Full sharp foreground photo: perfectly centered without cropping */}
                  <img
                    src={activePhoto || selectedPet.photo_url}
                    alt={selectedPet.name}
                    className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center drop-shadow-2xl transition-transform duration-300 p-1"
                  />
                  {selectedPet.photos && selectedPet.photos.length > 1 && (
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/20 z-20 flex items-center gap-1.5 shadow-md">
                      📸 Foto {selectedPet.photos.indexOf(activePhoto || selectedPet.photo_url) + 1}{" "}
                      de {selectedPet.photos.length}
                    </div>
                  )}
                </div>

                {/* Gallery Thumbnails */}
                {selectedPet.photos && selectedPet.photos.length > 1 && (
                  <div className="flex items-center gap-2.5">
                    {selectedPet.photos.map((ph, idx) => {
                      const isSelected = (activePhoto || selectedPet.photo_url) === ph;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhoto(ph)}
                          className={`relative h-18 w-20 overflow-hidden rounded-xl border-2 transition-all cursor-pointer bg-neutral-900 ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/50 scale-105 shadow-md"
                              : "border-border/80 hover:border-primary/50 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={ph}
                            alt={`${selectedPet.name} foto ${idx + 1}`}
                            className="h-full w-full object-contain p-0.5"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 1. Key Biometric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-accent/70 p-2.5 border border-primary/20 space-y-0.5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">Espécie</p>
                  <p className="font-extrabold text-foreground text-sm">
                    {selectedPet.species === "cao" ? "🐶 Canina" : "🐱 Felina"}
                  </p>
                </div>
                <div className="rounded-xl bg-accent/70 p-2.5 border border-primary/20 space-y-0.5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">Sexo</p>
                  <p className="font-extrabold text-foreground text-sm capitalize">
                    {selectedPet.gender === "femea" ? "♀ Fêmea" : "♂ Macho"}
                  </p>
                </div>
                <div className="rounded-xl bg-accent/70 p-2.5 border border-primary/20 space-y-0.5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">Idade</p>
                  <p className="font-extrabold text-foreground text-sm">{selectedPet.age_label}</p>
                </div>
                <div className="rounded-xl bg-accent/70 p-2.5 border border-primary/20 space-y-0.5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                    Porte Físico
                  </p>
                  <p className="font-extrabold text-foreground text-sm capitalize">
                    {selectedPet.weight ||
                      (selectedPet.size ? `Porte ${selectedPet.size}` : "Porte Médio")}
                  </p>
                </div>
              </div>

              {/* 2. Health & Care Protocol */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Protocolo Veterinário & Saúde
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(selectedPet.health_status || ["Vacinado", "Castrado", "Vermifugado"]).map(
                    (h) => (
                      <div
                        key={h}
                        className="flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-xs font-bold text-foreground border border-emerald-500/20 shadow-2xs"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* 3. Temperament & Socialization */}
              {selectedPet.temperament && selectedPet.temperament.length > 0 && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" /> Convivência & Temperamento
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPet.temperament.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-background px-3 py-1.5 text-xs font-bold text-foreground border border-primary/30 shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Story & Personality */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2 shadow-xs">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-destructive fill-current" /> História do(a){" "}
                  {selectedPet.name}
                </h4>
                <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line font-normal">
                  {selectedPet.detailed_story || selectedPet.description}
                </div>
              </div>

              {/* 5. Responsible Organization Box */}
              <div className="rounded-2xl border border-primary/20 bg-accent/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm">
                    🐾
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                      Instituição / Protetor Responsável
                    </p>
                    <p className="text-sm font-extrabold text-foreground">
                      {selectedPet.organization_name || "Protetor Independente Parceiro"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Adoção consciente no DF com termo formal e acompanhamento
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Modal Action Buttons */}
              <div className="pt-2 border-t border-primary/20 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSharePet(selectedPet)}
                  className="gap-2 border-primary/30 font-bold"
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
                  <Heart className="h-5 w-5 fill-current text-white" />
                  Quero Adotar {selectedPet.name} / Falar com o Protetor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal de Consentimento de Compartilhamento com Terceiros (LGPD Art. 7º, I) */}
      {consentPet && user && (
        <AdoptionConsentModal
          open={!!consentPet}
          onOpenChange={(open) => !open && setConsentPet(null)}
          userId={user.id}
          petId={consentPet.id}
          petName={consentPet.name}
          protectorName={consentPet.organization_name || "o Protetor responsável"}
          onConsentGranted={() => {
            const petToAdopt = consentPet;
            setConsentPet(null);
            proceedToChat(petToAdopt);
          }}
        />
      )}
    </div>
  );
}
