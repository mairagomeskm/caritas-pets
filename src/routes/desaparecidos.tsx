import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  MapPin,
  Share2,
  Phone,
  MessageCircle,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  CheckCircle2,
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
import { REGIONS } from "@/lib/regions";

export const Route = createFileRoute("/desaparecidos")({
  head: () => ({
    meta: [
      { title: "Desaparecidos no DF — Carita's Pets" },
      {
        name: "description",
        content:
          "Cartazes de pets perdidos no Distrito Federal. Veja fotos, contate tutores diretamente pelo WhatsApp e ajude no reencontro.",
      },
      { property: "og:title", content: "Pets Desaparecidos no DF — Ajude a Encontrar" },
      {
        property: "og:description",
        content: "Cães e gatos perdidos em Brasília e regiões. Compartilhe e reporte avistamentos.",
      },
    ],
  }),
  component: DesaparecidosPage,
});

export interface MissingPet {
  id: string;
  name: string;
  species?: string | undefined;
  photo_url: string;
  location: string;
  region?: string | undefined;
  description: string;
  contact: string;
  reward?: string | undefined;
  date_lost?: string | undefined;
  created_at?: string | undefined;
}

function DesaparecidosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localList, setLocalList] = useState<MissingPet[]>([]);

  // Form State for new missing pet
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("cao");
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("Plano Piloto");
  const [contact, setContact] = useState("");
  const [reward, setReward] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { user, setAuthOpen } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["missing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missing_pets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data;
    },
  });

  const baseList: MissingPet[] = data && data.length > 0 ? (data as any) : [];
  const combinedList = [...localList, ...baseList];

  const filtered = combinedList.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion =
      selectedRegion === "Todas" ||
      (m.region && m.region.toLowerCase().includes(selectedRegion.toLowerCase())) ||
      m.location.toLowerCase().includes(selectedRegion.toLowerCase());

    return matchesSearch && matchesRegion;
  });

  const getWhatsAppUrl = (phone: string, petName: string, petLocation: string) => {
    const cleanDigits = phone.replace(/\D/g, "");
    const formattedNumber = cleanDigits.startsWith("55") ? cleanDigits : `55${cleanDigits}`;
    const message = `Olá! Vi o cartaz do pet "${petName}" que desapareceu em "${petLocation}" no Carita's Pets e tenho informações/avistamento para compartilhar.`;
    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleShare = async (m: MissingPet) => {
    const text = `🚨 PROCURA-SE: ${m.name.toUpperCase()} desapareceu em ${m.location}. ${
      m.reward ? `[${m.reward}] ` : ""
    }Se tiver notícias, entre em contato: ${m.contact}!`;

    if (navigator.share) {
      await navigator
        .share({
          title: `Procura-se ${m.name} - Carita's Pets DF`,
          text,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      toast.success("Informações do cartaz copiadas com sucesso!");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !contact) {
      toast.error("Por favor, preencha o nome, local e telefone de contato.");
      return;
    }

    setIsSubmitting(true);
    try {
      let photo_url = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";

      if (photoFile) {
        photo_url = await uploadMedia(user?.id || "anonymous", photoFile);
      }

      const newPet: MissingPet = {
        id: `local-miss-${Date.now()}`,
        name,
        species,
        photo_url,
        location,
        region,
        contact,
        reward: reward ? `Recompensa: R$ ${reward}` : undefined,
        description,
        date_lost: new Date().toLocaleDateString("pt-BR"),
      };

      // Try inserting into Supabase
      try {
        await supabase.from("missing_pets").insert({
          name,
          location,
          contact,
          description: reward ? `${description} (Recompensa: R$ ${reward})` : description,
          photo_url,
        });
      } catch (err) {
        console.warn("Could not insert directly to Supabase table:", err);
      }

      setLocalList((prev) => [newPet, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["missing"] });

      // Reset form
      setName("");
      setLocation("");
      setContact("");
      setReward("");
      setDescription("");
      setPhotoFile(null);
      setDialogOpen(false);
      toast.success("Cartaz de pet desaparecido publicado com sucesso!");
    } catch {
      toast.error("Ocorreu um erro ao cadastrar o cartaz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Call to Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-primary/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive mb-2 uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5" /> Rede de Ajuda Rápida no DF
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Pets Desaparecidos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-xl">
            Avistou algum animal perdido? Fale direto com a família no WhatsApp ou publique um
            cartaz gratuitamente.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => setDialogOpen(true)}
          className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md font-bold shrink-0"
        >
          <Plus className="h-5 w-5" /> Cadastrar Pet Desaparecido
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do pet ou local (ex: Asa Sul, Cruzeiro, Poodle)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="h-10 rounded-md border border-primary/40 bg-card px-3 text-sm font-medium"
          aria-label="Filtrar por região do DF"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r === "Todas" ? "Todas as Regiões do DF" : r}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Missing Pets Posters */}
      {filtered.length === 0 ? (
        <div className="vintage-card p-10 text-center space-y-3">
          <p className="text-lg font-bold text-primary">
            Nenhum cartaz encontrado com esses filtros.
          </p>
          <p className="text-sm text-muted-foreground">
            Tente alterar os termos da busca ou a região selecionada.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setSelectedRegion("Todas");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const waUrl = getWhatsAppUrl(m.contact, m.name, m.location);
            return (
              <article
                key={m.id}
                className="wanted relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 text-center shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
              >
                {/* Header Banner */}
                <div>
                  <div className="flex items-center justify-between border-b-2 border-destructive/30 pb-2 mb-3">
                    <span className="text-2xl font-black uppercase tracking-widest text-destructive">
                      Procura-se!
                    </span>
                    {m.reward && (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-black text-amber-800 border border-amber-500/40">
                        {m.reward}
                      </span>
                    )}
                  </div>

                  {/* Photo with vintage sepia touch */}
                  <div className="relative my-2 aspect-square w-full overflow-hidden rounded-xl border-2 border-primary/40 bg-stone-100">
                    <img
                      src={m.photo_url}
                      alt={m.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {m.date_lost && (
                      <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Visto em {m.date_lost}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-extrabold text-foreground mt-3 tracking-tight">
                    {m.name}
                  </h3>

                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    <span>{m.location}</span>
                  </p>

                  {m.description && (
                    <div className="mt-3 rounded-lg bg-black/5 p-3 text-xs leading-relaxed text-foreground/90 italic">
                      "{m.description}"
                    </div>
                  )}
                </div>

                {/* Direct Action Contacts */}
                <div className="mt-5 space-y-2 border-t border-primary/20 pt-3">
                  <p className="text-xs font-bold text-muted-foreground">
                    Contato do Tutor: <strong className="text-foreground">{m.contact}</strong>
                  </p>

                  <div className="flex flex-col gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Avisei / Falar no WhatsApp
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(m)}
                      className="w-full gap-1.5 border-primary/30 text-xs font-semibold hover:bg-primary/10"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Compartilhar Cartaz
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Useful Tips for Finding Lost Pets */}
      <div className="rounded-2xl border border-primary/20 bg-accent/40 p-6 space-y-3">
        <h4 className="font-bold text-primary flex items-center gap-2 text-base">
          <Info className="h-5 w-5 text-primary" /> O que fazer se seu pet desapareceu no DF:
        </h4>
        <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground leading-relaxed">
          <div className="rounded-xl bg-card p-3 border border-primary/10">
            <strong className="block text-foreground mb-1">1. Divulgue Rápido</strong>
            Espalhe o cartaz em grupos de bairro do WhatsApp e redes sociais nas primeiras horas.
          </div>
          <div className="rounded-xl bg-card p-3 border border-primary/10">
            <strong className="block text-foreground mb-1">2. Contate Clínicas Próximas</strong>
            Ligue para veterinárias e zoonoses da sua região. Animais feridos costumam ser levados
            por pedestres.
          </div>
          <div className="rounded-xl bg-card p-3 border border-primary/10">
            <strong className="block text-foreground mb-1">3. Deixe Itens com seu Cheiro</strong>
            Coloque peças de roupa usada e a caminha perto da porta de casa para atrair pelo olfato.
          </div>
        </div>
      </div>

      {/* Modal: Cadastrar Pet Desaparecido */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" /> Cadastrar Pet Desaparecido
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do animal para divulgar imediatamente na rede Carita's Pets DF.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 pt-2">
            <FileUploadDropzone
              file={photoFile}
              onFileChange={setPhotoFile}
              label="Foto do Pet Desaparecido *"
              hint="Envie uma foto recente que mostre bem o porte e cores do pet"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground/90">Nome do Pet *</label>
                <Input
                  required
                  placeholder="ex: Pipoca"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/90">Espécie</label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="h-9 w-full rounded-md border bg-card px-3 text-sm"
                >
                  <option value="cao">Cão</option>
                  <option value="gato">Gato</option>
                  <option value="outro">Outro animal</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground/90">Região do DF</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-9 w-full rounded-md border bg-card px-3 text-sm"
                >
                  {REGIONS.slice(1).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/90">
                  Local Específico *
                </label>
                <Input
                  required
                  placeholder="ex: SQS 308 Bloco D, Asa Sul"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground/90">
                  Telefone / WhatsApp *
                </label>
                <Input
                  required
                  placeholder="(61) 99999-0000"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/90">
                  Recompensa (Opcional)
                </label>
                <Input
                  placeholder="ex: 200,00"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/90">
                Características e Detalhes Importantes
              </label>
              <Textarea
                placeholder="Ex: Usa coleira vermelha, é medroso, tem mancha no olho esquerdo, responde pelo apelido de..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              >
                {isSubmitting ? "Publicando..." : "Publicar Cartaz"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
