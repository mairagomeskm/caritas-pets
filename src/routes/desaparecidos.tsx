import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  MapPin,
  Share2,
  MessageCircle,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  Clock,
  Phone,
  Copy,
  Check,
  X,
  HeartHandshake,
  ShieldAlert,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadMedia } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileUploadDropzone } from "@/components/ui/file-upload-dropzone";
import type { MissingPet } from "@/types/pet";
import { INITIAL_MISSING_PETS } from "@/data/missing";

const LOCAL_STORAGE_KEY = "caritas:missing_pets_v1";

export const Route = createFileRoute("/desaparecidos")({
  head: () => ({
    meta: [
      { title: "Pets Desaparecidos no DF — Carita's Pets" },
      {
        name: "description",
        content:
          "Ajude a reunir famílias no Distrito Federal. Viu algum destes animais? Entre em contato imediatamente pelo WhatsApp.",
      },
      { property: "og:title", content: "Pets Desaparecidos no DF — Ajude a Encontrar" },
      {
        property: "og:description",
        content:
          "Cartazes de pets desaparecidos no Distrito Federal. Veja fotos, características e contatos diretos.",
      },
    ],
  }),
  component: DesaparecidosPage,
});

export function DesaparecidosPage() {
  // Filtros em tempo real
  const [selectedSpecies, setSelectedSpecies] = useState<"Todos" | "Gatos" | "Cachorros">("Todos");
  const [selectedRegion, setSelectedRegion] = useState<string>("Todas as regiões");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal de registro
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Campos do formulário
  const [name, setName] = useState<string>("");
  const [species, setSpecies] = useState<string>("Cachorro");
  const [sexAge, setSexAge] = useState<string>("");
  const [region, setRegion] = useState<string>("Cruzeiro Novo");
  const [customRegion, setCustomRegion] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [lastSeen, setLastSeen] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [guardianName, setGuardianName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Carrega pets adicionados localmente do localStorage (fallback persistente)
  const [localPets, setLocalPets] = useState<MissingPet[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Salva no localStorage quando pets locais forem atualizados
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localPets));
    } catch {
      // Ignora erro de quota em navegadores restritivos
    }
  }, [localPets]);

  // 2. Consulta ao Supabase com fallback gracioso e sem tela branca
  const { data: remotePets = [] } = useQuery<MissingPet[]>({
    queryKey: ["missing_pets_list"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("missing_pets")
          .select("*")
          .order("created_at", { ascending: false });

        if (error || !data) {
          return [];
        }

        // Mapeia colunas do banco com suporte a schemas legados ou novos
        return (data as any[])
          .filter((item) => {
            // Remove animais genéricos antigos se existirem no banco
            const n = (item.name || "").toLowerCase();
            if (n === "caramelo" || n === "nina") return false;
            return true;
          })
          .map((item) => {
            const rawDesc = item.description || "";
            const rawContact = item.contact || item.phone || "";
            return {
              id: item.id || `remote-${item.name}-${Math.random()}`,
              name: item.name,
              species: item.species || (rawDesc.toLowerCase().includes("gato") ? "Gato" : "Cachorro"),
              sex_age: item.sex_age || "Idade não informada",
              region: item.region || item.location || "Distrito Federal",
              location: item.location || "Brasília/DF",
              last_seen: item.last_seen || "Recentemente",
              photo_url: item.photo_url || "/assets/img/bento.jpg",
              description: rawDesc,
              guardian_name: item.guardian_name || "",
              contact: rawContact,
              phone: item.phone || rawContact,
              reward: item.reward || undefined,
              created_at: item.created_at,
            } as MissingPet;
          });
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // 3. Combina os 4 pets oficiais + locais + remotos (com deduplicação estrita)
  const allPets = useMemo(() => {
    const map = new Map<string, MissingPet>();

    // Primeiro os 4 registros iniciais oficiais
    INITIAL_MISSING_PETS.forEach((pet) => {
      map.set(pet.name.toLowerCase(), pet);
    });

    // Em seguida sobrescreve ou mescla com dados remotos oficiais (se houver)
    remotePets.forEach((pet) => {
      map.set(pet.name.toLowerCase(), {
        ...map.get(pet.name.toLowerCase()),
        ...pet,
      });
    });

    // Por fim adiciona os cadastrados localmente no topo
    localPets.forEach((pet) => {
      map.set(`local-${pet.id}`, pet);
    });

    return Array.from(map.values());
  }, [remotePets, localPets]);

  // Lista dinâmica de bairros/regiões a partir dos pets existentes
  const availableRegions = useMemo(() => {
    const baseDefault = ["Cruzeiro Novo", "Asa Norte", "Sudoeste", "Águas Claras"];
    const set = new Set<string>(baseDefault);
    allPets.forEach((p) => {
      if (p.region && p.region.trim()) {
        set.add(p.region.trim());
      }
    });
    return ["Todas as regiões", ...Array.from(set)];
  }, [allPets]);

  // 4. Filtragem em tempo real (Espécie, Região e Busca por texto)
  const filteredPets = useMemo(() => {
    return allPets.filter((pet) => {
      // Filtro por Espécie
      if (selectedSpecies === "Gatos") {
        const s = (pet.species || "").toLowerCase();
        if (!s.includes("gato") && !s.includes("felino")) return false;
      } else if (selectedSpecies === "Cachorros") {
        const s = (pet.species || "").toLowerCase();
        if (!s.includes("cachorro") && !s.includes("cão") && !s.includes("cao") && !s.includes("canino")) {
          return false;
        }
      }

      // Filtro por Região/Bairro
      if (selectedRegion !== "Todas as regiões") {
        const target = selectedRegion.toLowerCase();
        const pRegion = (pet.region || "").toLowerCase();
        const pLoc = (pet.location || "").toLowerCase();
        if (!pRegion.includes(target) && !pLoc.includes(target)) {
          return false;
        }
      }

      // Busca por texto
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const inName = (pet.name || "").toLowerCase().includes(q);
        const inDesc = (pet.description || "").toLowerCase().includes(q);
        const inLoc = (pet.location || "").toLowerCase().includes(q);
        const inRegion = (pet.region || "").toLowerCase().includes(q);
        const inSexAge = (pet.sex_age || "").toLowerCase().includes(q);
        const inGuardian = (pet.guardian_name || "").toLowerCase().includes(q);

        if (!inName && !inDesc && !inLoc && !inRegion && !inSexAge && !inGuardian) {
          return false;
        }
      }

      return true;
    });
  }, [allPets, selectedSpecies, selectedRegion, searchTerm]);

  // Helper para link do WhatsApp
  const getWhatsAppLink = (phoneOrContact: string, pet: MissingPet) => {
    const digits = phoneOrContact.replace(/\D/g, "");
    const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
    const msg = `Olá! Vi o cartaz do pet "${pet.name}" que desapareceu em "${pet.region || pet.location}" no Carita's Pets e tenho informações/avistamento para compartilhar.`;
    return `https://wa.me/${fullNumber}?text=${encodeURIComponent(msg)}`;
  };

  // Helper para copiar telefone do tutor
  const handleCopyPhone = (pet: MissingPet) => {
    const raw = pet.phone || pet.contact;
    const cleanDigits = raw.replace(/[^\d() -]/g, "").trim();
    const textToCopy = cleanDigits || raw;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(pet.id);
    toast.success(`Telefone copiado: ${textToCopy}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Compartilhar cartaz
  const handleShare = async (pet: MissingPet) => {
    const shareText = `🚨 PET DESAPARECIDO NO DF: ${pet.name.toUpperCase()} (${pet.species})! Visto por último em ${pet.location}. Contato: ${pet.contact}. Ajude a compartilhar!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Procura-se ${pet.name} — Carita's Pets DF`,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // Cancelado pelo usuário
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      toast.success("Informações do cartaz copiadas para a área de transferência!");
    }
  };

  // Submissão do novo cadastro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !location.trim() || !phone.trim()) {
      toast.error("Por favor, preencha pelo menos o Nome do pet, Local e WhatsApp de contato.");
      return;
    }

    setIsSubmitting(true);
    const finalRegion = region === "Outra região" ? customRegion.trim() || "Distrito Federal" : region;

    try {
      let finalPhotoUrl = "/assets/img/bento.jpg";

      // 1. Converte ou faz upload da foto
      if (photoFile) {
        try {
          finalPhotoUrl = await uploadMedia(user?.id || "anonymous-missing", photoFile);
        } catch {
          // Fallback seguro: converte para Data URL se o bucket de storage não estiver configurado
          finalPhotoUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve("/assets/img/bento.jpg");
            reader.readAsDataURL(photoFile);
          });
        }
      }

      const formattedContact = guardianName.trim()
        ? `${guardianName.trim()} — ${phone.trim()}`
        : phone.trim();

      const newPet: MissingPet = {
        id: `local-${Date.now()}`,
        name: name.trim(),
        species: species.trim() || "Cachorro",
        sex_age: sexAge.trim() || "Não especificado",
        region: finalRegion,
        location: location.trim(),
        last_seen: lastSeen.trim() || "Data recente",
        photo_url: finalPhotoUrl,
        description: description.trim(),
        guardian_name: guardianName.trim(),
        contact: formattedContact,
        phone: phone.trim(),
        created_at: new Date().toISOString(),
      };

      // 2. Salva localmente de forma imediata
      setLocalPets((prev) => [newPet, ...prev]);

      // 3. Tenta persistir no Supabase silenciosamente
      try {
        await supabase.from("missing_pets").insert({
          name: newPet.name,
          species: newPet.species,
          sex_age: newPet.sex_age,
          region: newPet.region,
          location: newPet.location,
          last_seen: newPet.last_seen,
          photo_url: newPet.photo_url,
          description: newPet.description,
          guardian_name: newPet.guardian_name,
          contact: newPet.contact,
          phone: newPet.phone,
          status: "desaparecido",
        });
      } catch {
        // Fallback ativo: já salvo com segurança no localStorage
      }

      queryClient.invalidateQueries({ queryKey: ["missing_pets_list"] });

      // Limpa os campos do formulário
      setName("");
      setSpecies("Cachorro");
      setSexAge("");
      setRegion("Cruzeiro Novo");
      setCustomRegion("");
      setLocation("");
      setLastSeen("");
      setDescription("");
      setGuardianName("");
      setPhone("");
      setPhotoFile(null);
      setDialogOpen(false);

      toast.success(`Cartaz de ${newPet.name} publicado com sucesso!`);
    } catch {
      toast.error("Ocorreu um erro ao registrar. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters =
    selectedSpecies !== "Todos" || selectedRegion !== "Todas as regiões" || searchTerm.trim() !== "";

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Cabeçalho Principal Direto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-primary/20 pb-6 pt-2">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-destructive">
            <ShieldAlert className="h-4 w-4" /> Alerta Solidário DF
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Pets Desaparecidos
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Ajude a reunir famílias no Distrito Federal. Viu algum destes animais? Entre em contato
            imediatamente.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => setDialogOpen(true)}
          className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md font-bold shrink-0 self-start md:self-auto rounded-xl px-5 h-12"
        >
          <Plus className="h-5 w-5" /> Registrar Desaparecimento
        </Button>
      </div>

      {/* 2. Barra de Filtros Funcional e Enxuta em TypeScript */}
      <div className="vintage-card p-4 sm:p-5 space-y-4 shadow-sm border border-primary/25">
        <div className="grid gap-3 md:grid-cols-12 items-center">
          {/* Busca por texto compacta */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou característica (ex: frajola, coleira laranja)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 bg-background border-primary/30 h-10 rounded-lg text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 p-0.5 text-muted-foreground hover:text-foreground rounded"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtro por Espécie */}
          <div className="md:col-span-4 flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-primary/20">
            {(["Todos", "Gatos", "Cachorros"] as const).map((sp) => {
              const active = selectedSpecies === sp;
              return (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSelectedSpecies(sp)}
                  className={`flex-1 rounded-md py-1.5 text-xs sm:text-sm font-bold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  {sp === "Gatos" ? "🐱 Gatos" : sp === "Cachorros" ? "🐶 Cachorros" : "🐾 Todos"}
                </button>
              );
            })}
          </div>

          {/* Filtro por Região/Bairro (Gerado dinamicamente) */}
          <div className="md:col-span-3">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="h-10 w-full rounded-lg border border-primary/30 bg-background px-3 text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              aria-label="Filtrar por região do DF"
            >
              {availableRegions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de status dos filtros ativos */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-primary/10 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong className="text-foreground">{filteredPets.length}</strong> de{" "}
              {allPets.length} pet{allPets.length !== 1 ? "s" : ""} desaparecido
              {allPets.length !== 1 ? "s" : ""} no DF
            </span>
            {hasActiveFilters && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-bold text-destructive text-[11px]">
                Filtros ativos
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedSpecies("Todos");
                setSelectedRegion("Todas as regiões");
                setSearchTerm("");
              }}
              className="font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Limpar todos os filtros
            </button>
          )}
        </div>
      </div>

      {/* 3. Listagem de Cards dos Pets */}
      {filteredPets.length === 0 ? (
        <div className="vintage-card p-12 text-center space-y-4 border border-dashed border-primary/40 bg-card/60">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Search className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Nenhum pet encontrado com os filtros selecionados
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tente remover a busca por texto ou selecionar outra região do Distrito Federal.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedSpecies("Todos");
              setSelectedRegion("Todas as regiões");
              setSearchTerm("");
            }}
            className="border-primary/40 font-bold"
          >
            Ver todos os pets
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {filteredPets.map((pet) => {
            const waUrl = getWhatsAppLink(pet.phone || pet.contact, pet);
            const isCopied = copiedId === pet.id;

            return (
              <article
                key={pet.id}
                className="vintage-card flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-primary/30 bg-card shadow-md transition-all hover:shadow-xl hover:border-primary/60"
              >
                <div>
                  {/* Tag visual clara no topo: 🔴 DESAPARECIDO + Tag do Bairro */}
                  <div className="flex items-center justify-between border-b-2 border-primary/20 bg-destructive/10 px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-destructive">
                      <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                      🔴 DESAPARECIDO
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-0.5 text-xs font-bold text-foreground border border-primary/30 shadow-2xs">
                      <MapPin className="h-3 w-3 text-destructive shrink-0" />
                      {pet.region}
                    </span>
                  </div>

                  {/* Foto com proporção e enquadramento perfeito (object-fit: cover, object-position: center) */}
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-stone-200 border-b border-primary/20">
                    <img
                      src={pet.photo_url}
                      alt={`Foto do pet desaparecido ${pet.name}`}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = "1";
                          // Fallback em cascata para pets da pasta pública ou unsplash seguro
                          if (pet.photo_url.includes("bento")) target.src = "/assets/img/bento.jpg";
                          else if (pet.photo_url.includes("apolo")) target.src = "/assets/img/apolo.jpg";
                          else if (pet.photo_url.includes("mel")) target.src = "/assets/img/mel.jpg";
                          else if (pet.photo_url.includes("avela")) target.src = "/assets/img/avela.jpg";
                          else target.src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";
                        }
                      }}
                    />

                    {/* Espécie badge sobreposto */}
                    <div className="absolute top-3 left-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs shadow-sm">
                      {pet.species === "Gato" ? "🐱 Gato" : "🐶 Cachorro"}
                    </div>
                  </div>

                  {/* Detalhes do Pet */}
                  <div className="p-5 space-y-4">
                    {/* Nome em destaque e Resumo de espécie/idade */}
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        {pet.name}
                      </h2>
                      {pet.sex_age && (
                        <p className="text-xs sm:text-sm font-bold text-primary mt-0.5">
                          {pet.species} • {pet.sex_age}
                        </p>
                      )}
                    </div>

                    {/* Informações de Local e Data do Desaparecimento */}
                    <div className="space-y-1.5 rounded-xl bg-muted/60 p-3 text-xs border border-primary/15">
                      <div className="flex items-start gap-2 text-foreground">
                        <MapPin className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">Local exato: </strong>
                          <span>{pet.location}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-foreground">
                        <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">Visto por último: </strong>
                          <span className="font-semibold">{pet.last_seen}</span>
                        </div>
                      </div>
                    </div>

                    {/* Características e Descrição */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Características & Descrição:
                      </span>
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed rounded-xl border border-primary/20 bg-background/90 p-3.5 shadow-2xs italic">
                        "{pet.description}"
                      </p>
                    </div>

                    {/* Contato do Tutor */}
                    <div className="border-t border-primary/15 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-semibold">Tutor responsável:</span>
                        <strong className="text-foreground text-sm font-bold">{pet.contact}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas de Contato */}
                <div className="border-t-2 border-primary/20 bg-muted/30 p-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Botão de destaque "Entrar em Contato / Vi este pet" */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-4 py-3 shadow-sm transition-colors text-center"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Entrar em Contato / Vi este pet
                    </a>

                    {/* Botão para copiar telefone com feedback imediato */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCopyPhone(pet)}
                      className="h-11 sm:h-auto px-3 border-primary/40 font-bold text-xs gap-1.5 rounded-xl hover:bg-card"
                      title="Copiar telefone do tutor"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" /> Copiar Telefone
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Compartilhar Cartaz */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(pet)}
                    className="w-full gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-lg"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Compartilhar cartaz deste pet no DF
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 4. Banner Educativo / Ações em caso de desaparecimento */}
      <div className="rounded-2xl border-2 border-primary/20 bg-accent/40 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-2xs">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <h3 className="font-extrabold text-lg text-primary">
            Dicas essenciais para quem perdeu ou encontrou um animal no DF
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed">
          <div className="rounded-xl bg-card p-4 border border-primary/15 shadow-2xs space-y-1">
            <strong className="block text-foreground text-sm font-bold">1. Ação nas primeiras horas</strong>
            <p className="text-muted-foreground">
              Espalhe o cartaz em grupos de WhatsApp dos blocos, comércios locais e praças da região.
            </p>
          </div>
          <div className="rounded-xl bg-card p-4 border border-primary/15 shadow-2xs space-y-1">
            <strong className="block text-foreground text-sm font-bold">2. Clínicas e Zoonoses</strong>
            <p className="text-muted-foreground">
              Ligue para veterinárias 24h e postos da região. Animais recolhidos costumam ser levados para checagem.
            </p>
          </div>
          <div className="rounded-xl bg-card p-4 border border-primary/15 shadow-2xs space-y-1">
            <strong className="block text-foreground text-sm font-bold">3. Reconhecimento Olfativo</strong>
            <p className="text-muted-foreground">
              Deixe peças de roupa com cheiro do tutor e a caminha na entrada da residência ou portaria.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Modal / Formulário Limpo de Cadastro de Novo Caso */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-destructive flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" /> Registrar Desaparecimento
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do pet para divulgar na rede Carita's Pets DF e alertar a comunidade.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 pt-2">
            <FileUploadDropzone
              file={photoFile}
              onFileChange={setPhotoFile}
              label="Foto do Pet Desaparecido"
              hint="Envie uma imagem nítida que mostre bem o rosto e a pelagem do pet"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-foreground">Nome do Pet *</label>
                <Input
                  required
                  placeholder="Ex: Bento, Apolo, Mel..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Espécie *</label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-primary/30 bg-background px-3 text-sm font-medium"
                >
                  <option value="Cachorro">Cachorro</option>
                  <option value="Gato">Gato</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-foreground">Sexo e Idade / Porte</label>
                <Input
                  placeholder="Ex: Macho (castrado) • 2 anos"
                  value={sexAge}
                  onChange={(e) => setSexAge(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Região / Bairro do DF *</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-primary/30 bg-background px-3 text-sm font-medium"
                >
                  <option value="Cruzeiro Novo">Cruzeiro Novo</option>
                  <option value="Asa Norte">Asa Norte</option>
                  <option value="Sudoeste">Sudoeste</option>
                  <option value="Águas Claras">Águas Claras</option>
                  <option value="Asa Sul">Asa Sul</option>
                  <option value="Cruzeiro Velho">Cruzeiro Velho</option>
                  <option value="Octogonal">Octogonal</option>
                  <option value="Guará">Guará</option>
                  <option value="Taguatinga">Taguatinga</option>
                  <option value="Lago Norte">Lago Norte</option>
                  <option value="Lago Sul">Lago Sul</option>
                  <option value="Outra região">Outra região do DF...</option>
                </select>
              </div>
            </div>

            {region === "Outra região" && (
              <div>
                <label className="text-xs font-bold text-foreground">Especifique a Região / Bairro</label>
                <Input
                  placeholder="Ex: Samambaia, Sobradinho, Planaltina..."
                  value={customRegion}
                  onChange={(e) => setCustomRegion(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-foreground">Local Exato do Desaparecimento *</label>
                <Input
                  required
                  placeholder="Ex: Perto da Quadra 1205 (Brasília/DF)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Data / Hora Visto pela Última Vez *</label>
                <Input
                  required
                  placeholder="Ex: 05/11/2026, às 16h30"
                  value={lastSeen}
                  onChange={(e) => setLastSeen(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Características e Descrição do Animal</label>
              <Textarea
                rows={3}
                placeholder="Ex: Pelagem frajola, coleira azul, dócil mas assustado com barulho de moto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-foreground">Nome do Tutor / Contato</label>
                <Input
                  placeholder="Ex: Mariana Alves"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">WhatsApp / Telefone com DDD *</label>
                <Input
                  required
                  placeholder="Ex: (61) 99812-0041"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-primary/20">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              >
                {isSubmitting ? "Cadastrando..." : "Publicar Cartaz"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
