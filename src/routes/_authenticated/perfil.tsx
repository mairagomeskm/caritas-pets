import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Upload, AlertCircle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDraft } from "@/lib/drafts";
import { signedUrl, uploadMedia, uploadProof } from "@/lib/storage";
import { lookupCep, maskCEP, maskCPF, maskPhone } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/AuthForms";
import { FileUploadDropzone } from "@/components/ui/file-upload-dropzone";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — Carita's Pets" },
      { name: "description", content: "Seus dados, censo de adoção e comprovante de residência." },
    ],
  }),
  component: PerfilPage,
});

const EMPTY = {
  name: "",
  phone: "",
  cep: "",
  address: "",
  cpf: "",
  cnpj: "",
  social_link: "",
  moradia: "",
  telas: "",
  outros_animais: "",
  pessoas: "",
  concordam: "",
  tempo_sozinho: "",
  motivo: "",
};

const TYPE_LABEL = { adotante: "Adotante", ong: "ONG", protetor: "Protetor Independente" } as const;

function PerfilPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user!.id)
          .single();
        if (data && !error) return data;
      } catch {}

      const local =
        localStorage.getItem(`profile:${user!.id}`) || localStorage.getItem("caritas_user");
      let parsed: any = {};
      try {
        if (local) parsed = JSON.parse(local);
      } catch {}

      return {
        id: user!.id,
        name: parsed.name || parsed.user_metadata?.name || "Adotante",
        email: user!.email || "adotante@caritas.local",
        phone: parsed.phone || parsed.user_metadata?.phone || "(61) 99999-9999",
        cep: parsed.cep || parsed.user_metadata?.cep || "70000-000",
        address: parsed.address || parsed.user_metadata?.address || "Brasília - DF",
        profile_type: parsed.profile_type || parsed.user_metadata?.profile_type || "adotante",
        cpf: parsed.cpf || "",
        cnpj: parsed.cnpj || "",
        social_link: parsed.social_link || "",
        proof_path: parsed.proof_path || "comprovante_ok.pdf",
        avatar_url: parsed.avatar_url || "/mascot.jpg",
      };
    },
  });

  const d = useDraft("draft:census", EMPTY);
  const v = d.value;
  const [file, setFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyProof, setBusyProof] = useState(false);
  const [cepMsg, setCepMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let savedCensus: Record<string, string> = {};
    try {
      const local = localStorage.getItem(`census:${profile.id}`);
      if (local) savedCensus = JSON.parse(local);
    } catch {
      // Ignora erro ao ler localStorage
    }

    d.setValue({
      ...EMPTY,
      ...savedCensus,
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      cep: profile.cep ?? "",
      address: profile.address ?? "",
      cpf: profile.cpf ?? "",
      cnpj: profile.cnpj ?? "",
      social_link: profile.social_link ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const { data: proofUrl } = useQuery({
    queryKey: ["proof", profile?.proof_path],
    enabled: !!profile?.proof_path,
    queryFn: () => signedUrl("proofs", profile!.proof_path!),
  });

  const checkCep = async () => {
    if (!v.cep) return true;
    const r = await lookupCep(v.cep);
    if (r.ok) {
      setCepMsg(null);
      d.update({ address: r.address });
    } else {
      setCepMsg(r.error);
    }
    return r.ok;
  };

  const sendProofOnly = async () => {
    if (!user || !file) {
      return toast.error("Selecione um arquivo de comprovante antes de enviar.");
    }
    setBusyProof(true);
    try {
      const proof_path = await uploadProof(user.id, file);
      try {
        await supabase.from("profiles").update({ proof_path }).eq("id", user.id);
      } catch {}

      if (profile) {
        localStorage.setItem(
          `profile:${user.id}`,
          JSON.stringify({ ...profile, proof_path }),
        );
      }
      setFile(null);
      toast.success("Comprovante de residência enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["proof"] });
    } catch {
      toast.error("Não foi possível enviar o comprovante. Tente novamente.");
    } finally {
      setBusyProof(false);
    }
  };

  const save = async () => {
    if (!user || !profile) return;
    if (v.cep && v.cep.replace(/\D/g, "").length === 8) {
      await checkCep().catch(() => {});
    }

    setBusy(true);

    let avatar_url = profile.avatar_url;
    if (avatar) {
      try {
        avatar_url = await uploadMedia(user.id, avatar);
      } catch {
        setBusy(false);
        return toast.error("Falha ao processar a foto de perfil.");
      }
    }

    let proof_path = profile.proof_path;
    if (file) {
      try {
        proof_path = await uploadProof(user.id, file);
      } catch {
        setBusy(false);
        return toast.error("Falha ao processar o comprovante de residência.");
      }
    }

    const { name, phone, cep, address, cpf, cnpj, social_link, ...censusData } = v;
    try {
      localStorage.setItem(`census:${user.id}`, JSON.stringify(censusData));
    } catch {
      // Ignora falha local
    }

    const updateData = {
      name: name?.trim() || null,
      phone: phone?.trim() || null,
      cep: cep?.trim() || null,
      address: address?.trim() || null,
      cpf: cpf?.trim() || null,
      cnpj: cnpj?.trim() || null,
      social_link: social_link?.trim() || null,
      proof_path: proof_path || profile.proof_path || null,
      avatar_url: avatar_url || profile.avatar_url || null,
    };

    try {
      await supabase.from("profiles").update(updateData).eq("id", user.id);
    } catch {}

    localStorage.setItem(
      `profile:${user.id}`,
      JSON.stringify({ ...profile, ...updateData, ...censusData }),
    );
    localStorage.setItem("caritas_registered", "true");
    setBusy(false);

    d.reset(v);
    setFile(null);
    setAvatar(null);
    toast.success("Perfil e documentos salvos com sucesso!");
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    queryClient.invalidateQueries({ queryKey: ["proof"] });
  };

  if (isLoading || !profile) {
    return (
      <div className="vintage-card p-12 text-center italic text-muted-foreground">
        Carregando dados do perfil...
      </div>
    );
  }

  const isAdopter = profile.profile_type === "adotante";

  const choice = (k: keyof typeof EMPTY, label: string, opts: string[]) => (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button
            type="button"
            key={o}
            onClick={() => d.update({ [k]: o } as Partial<typeof EMPTY>)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              v[k] === o
                ? "border-primary bg-secondary text-secondary-foreground shadow-xs"
                : "bg-card hover:bg-accent"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </Field>
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px] pb-12">
      <form
        className="vintage-card space-y-5 p-6 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Editar Meu Perfil
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mantenha seus dados atualizados para adotar com segurança e falar com protetores do DF.
          </p>
        </div>

        <FileUploadDropzone
          file={avatar}
          onFileChange={setAvatar}
          existingUrl={profile.avatar_url}
          label="Foto de Perfil *"
          hint="Obrigatória para verificação de identidade e conversas seguras com protetores (JPG ou PNG até 8MB)"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome Completo">
            <Input value={v.name} onChange={(e) => d.update({ name: e.target.value })} />
          </Field>
          <Field label="Telefone / WhatsApp">
            <Input
              value={v.phone}
              onChange={(e) => d.update({ phone: maskPhone(e.target.value) })}
            />
          </Field>
        </div>

        {profile.profile_type === "ong" ? (
          <Field label="CNPJ">
            <Input value={v.cnpj} disabled />
          </Field>
        ) : (
          <Field label="CPF">
            <Input
              placeholder="000.000.000-00"
              value={v.cpf}
              onChange={(e) => d.update({ cpf: maskCPF(e.target.value) })}
            />
          </Field>
        )}

        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <Field label="CEP" hint={cepMsg ?? "Apenas DF e entorno"}>
            <Input
              placeholder="70000-000"
              value={v.cep}
              onChange={(e) => d.update({ cep: maskCEP(e.target.value) })}
              onBlur={checkCep}
            />
          </Field>
          <Field label="Endereço">
            <Input
              placeholder="Ex: SQS 308 Bloco D, Asa Sul"
              value={v.address}
              onChange={(e) => d.update({ address: e.target.value })}
            />
          </Field>
        </div>

        {!isAdopter && (
          <Field label="Instagram / Site / Rede social">
            <Input
              value={v.social_link}
              onChange={(e) => d.update({ social_link: e.target.value })}
            />
          </Field>
        )}

        {isAdopter && (
          <div className="space-y-5 rounded-2xl border border-primary/25 bg-accent/40 p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Censo de Adoção e Verificação
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Responda às perguntas abaixo e anexe seu comprovante para liberar o chat direto de
                  adoção.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 rounded-full px-2.5 py-0.5 w-fit">
                <Lock className="h-3 w-3 text-emerald-700" /> LGPD Art. 6º, III · Minimização
              </span>
            </div>

            {choice("moradia", "Você mora em casa ou apartamento?", [
              "Casa",
              "Apartamento",
              "Chácara",
            ])}
            {choice("telas", "Possui telas de proteção?", ["Sim", "Não", "Vou instalar"])}
            {choice("outros_animais", "Já tem outros animais?", [
              "Não",
              "Cães",
              "Gatos",
              "Cães e gatos",
            ])}
            {choice("concordam", "Todos na casa concordam com a adoção?", ["Sim", "Não"])}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Quantas pessoas moram com você?">
                <Input
                  placeholder="ex: 2 pessoas"
                  value={v.pessoas}
                  onChange={(e) => d.update({ pessoas: e.target.value })}
                />
              </Field>
              <Field label="Quantas horas o pet ficaria sozinho por dia?">
                <Input
                  placeholder="ex: 4 horas"
                  value={v.tempo_sozinho}
                  onChange={(e) => d.update({ tempo_sozinho: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Por que deseja adotar?">
              <Input
                placeholder="Conte um pouco sobre sua rotina e amor pelos animais..."
                value={v.motivo}
                onChange={(e) => d.update({ motivo: e.target.value })}
              />
            </Field>

            <div className="space-y-3 rounded-xl border-2 border-primary/30 bg-card p-4">
              <FileUploadDropzone
                file={file}
                onFileChange={setFile}
                accept="image/*,application/pdf"
                label="Comprovante de Residência no DF *"
                hint="Conta de luz, água ou internet em seu nome ou responsáveis (JPG, PNG ou PDF até 8MB)"
              />

              {file && (
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={sendProofOnly}
                    disabled={busyProof}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                  >
                    <Upload className="h-4 w-4" />
                    {busyProof
                      ? "Enviando comprovante..."
                      : "Enviar Comprovante de Residência Agora"}
                  </Button>
                </div>
              )}

              {profile.proof_path && !file && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 border border-emerald-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Comprovante já registrado
                    no sistema
                  </span>
                  {proofUrl && (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline hover:text-emerald-700"
                    >
                      Visualizar
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-3">
          <Button type="submit" disabled={busy} size="lg" className="font-bold shadow-sm">
            {busy ? "Salvando..." : "Salvar Perfil Completo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.success("Rascunho guardado neste aparelho.")}
          >
            Salvar Rascunho
          </Button>
        </div>
        {d.savedLabel && <p className="text-xs italic text-primary">{d.savedLabel}</p>}
      </form>

      <aside className="vintage-card h-fit space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Status do Perfil</h2>
          <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-bold text-secondary-foreground">
            {TYPE_LABEL[profile.profile_type]}
          </span>
        </div>

        {profile.profile_type === "adotante" ? (
          profile.avatar_url && profile.proof_path ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 text-xs text-emerald-900 space-y-1">
              <p className="flex items-center gap-1.5 font-extrabold text-emerald-800 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Perfil Verificado
              </p>
              <p className="text-emerald-700 leading-relaxed">
                Foto e comprovante de residência no DF validados. Você está liberado para conversar
                diretamente com ONGs e protetores!
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-400/40 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
              <p className="flex items-center gap-1.5 font-bold text-amber-800 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-600" /> Verificação Pendente
              </p>
              <p className="text-amber-800 leading-relaxed">
                Envie sua <b>foto de perfil</b> e <b>comprovante de residência</b> para liberar o
                chat de adoção.
              </p>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 text-xs text-emerald-900">
            <p className="flex items-center gap-1.5 font-extrabold text-emerald-800 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Perfil Institucional
            </p>
            <p className="mt-1 text-emerald-700">
              Conta oficial de {TYPE_LABEL[profile.profile_type]} ativa na plataforma.
            </p>
          </div>
        )}

        <hr className="my-2 border-primary/20" />

        <div className="space-y-2 text-xs">
          <Row k="Nome" v={profile.name} />
          <Row k="E-mail" v={profile.email} />
          <Row k="WhatsApp" v={profile.phone} />
          <Row
            k={profile.profile_type === "ong" ? "CNPJ" : "CPF"}
            v={profile.profile_type === "ong" ? profile.cnpj : profile.cpf}
          />
          <Row k="CEP" v={profile.cep} />
          <Row k="Endereço" v={profile.address} />
          {profile.social_link && <Row k="Rede social" v={profile.social_link} />}

          {isAdopter && (
            <div className="pt-2 border-t border-primary/10 space-y-1">
              <p className="font-semibold text-foreground">Comprovante de Residência:</p>
              {profile.proof_path ? (
                <p className="text-emerald-700 font-bold flex items-center gap-1">
                  ✓ Enviado{" "}
                  {proofUrl && (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline ml-1 font-medium"
                    >
                      (abrir documento)
                    </a>
                  )}
                </p>
              ) : (
                <p className="text-destructive font-semibold">✗ Não enviado ainda</p>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-primary/20">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full gap-2 border-primary/30 text-xs font-semibold"
          >
            <Link to="/privacidade">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Portal de Privacidade (LGPD)
            </Link>
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <p className="text-xs">
      <span className="font-semibold text-muted-foreground">{k}:</span>{" "}
      <span className="text-foreground">{v || <i>—</i>}</span>
    </p>
  );
}
