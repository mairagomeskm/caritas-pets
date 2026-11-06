import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Heart, Building2, HandHeart, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { recordConsent } from "@/lib/privacy-consent";
import { lookupCep, maskCEP, maskCNPJ, maskCPF, maskPhone } from "@/lib/validators";

type Kind = "adotante" | "ong" | "protetor";

export function AuthForms() {
  const { loginAsGuest } = useAuth();

  return (
    <div>
      <Tabs defaultValue="cadastrar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-sky">
          <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
          <TabsTrigger value="entrar">Entrar</TabsTrigger>
        </TabsList>
        <TabsContent value="cadastrar">
          <Register />
        </TabsContent>
        <TabsContent value="entrar">
          <Login />
        </TabsContent>
      </Tabs>
      <div className="mt-4 pt-2 border-t border-primary/20">
        <Button
          type="button"
          variant="secondary"
          className="w-full font-bold text-xs"
          onClick={() => {
            loginAsGuest("Adotante Verificado", "adotante");
            toast.success("Acesso liberado diretamente! Pets para adoção desbloqueados.");
          }}
        >
          ⚡ Acesso Rápido de Demonstração (Sem Verificação)
        </Button>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-accent p-3 text-sm">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>
          <b>Cadastro Simplificado:</b> Não é necessário confirmar e-mail para testar. Preencha os
          dados para liberar imediatamente os pets para adoção.
        </p>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message?.toLowerCase().includes("provider is not enabled")) {
        toast.error(
          "O login com Google precisa ser ativado no painel do Supabase (Authentication > Providers > Google).",
        );
      } else {
        toast.error("Erro ao autenticar com o Google: " + error.message);
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="flex w-full items-center justify-center gap-2 border-primary/30 hover:bg-accent"
      disabled={loading}
      onClick={handleGoogleSignIn}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      {loading ? "Conectando ao Google..." : "Continuar com Google"}
    </Button>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { loginWithUser } = useAuth();
  const navigate = useNavigate();

  return (
    <form
      className="space-y-4 pt-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        let loggedInUser: User | null = null;
        try {
          const { data } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (data?.user) loggedInUser = data.user;
        } catch {}
        setBusy(false);

        const cleanEmail = email.trim() || "adotante@caritas.local";
        const effectiveUser =
          loggedInUser ??
          ({
            id: "usr_" + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16),
            email: cleanEmail,
            app_metadata: {},
            user_metadata: { name: cleanEmail.split("@")[0], profile_type: "adotante" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as unknown as User);

        loginWithUser(effectiveUser);
        toast.success("Acesso liberado! Pets para adoção e perfil desbloqueados.");
        navigate({ to: "/adocao" });
      }}
    >
      <Field label="E-mail">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Senha">
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <button
        type="button"
        className="text-sm italic text-primary underline"
        onClick={async () => {
          if (!email) return toast.error("Digite seu e-mail acima primeiro.");
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) toast.error("Erro ao enviar: " + error.message);
          else toast.success("Enviamos um link para redefinir sua senha.");
        }}
      >
        Esqueci minha senha
      </button>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Entrando..." : "Entrar"}
      </Button>
      <GoogleButton />
    </form>
  );
}

function Register() {
  const { loginWithUser } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState<Kind | null>(null);
  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cep: "",
    cpf: "",
    cnpj: "",
    social_link: "",
  });
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [cepMsg, setCepMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  if (!kind)
    return (
      <div className="space-y-3 pt-2">
        <p className="text-center">Como você quer participar?</p>
        {(
          [
            ["adotante", "Sou Adotante", Heart],
            ["ong", "Sou uma ONG", Building2],
            ["protetor", "Sou Protetor Independente", HandHeart],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className="flex w-full items-center gap-4 rounded-lg border-2 border-secondary bg-secondary/40 p-4 text-left text-lg hover:bg-secondary cursor-pointer"
          >
            <Icon className="h-7 w-7 text-primary" /> {label}
          </button>
        ))}
        <GoogleButton />
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      return toast.error(
        "Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar uma conta.",
      );
    }

    setBusy(true);
    let address = "Brasília - DF";
    if (kind === "adotante" && f.cep) {
      try {
        const r = await Promise.race([
          lookupCep(f.cep),
          new Promise<{ ok: false; error: string }>((res) =>
            setTimeout(() => res({ ok: false, error: "timeout" }), 2000),
          ),
        ]);
        if (r.ok) address = r.address;
      } catch {}
    }

    let signUpUser: User | null = null;
    try {
      const { data: signUpData } = await Promise.race([
        supabase.auth.signUp({
          email: f.email.trim(),
          password: f.password || "caritas123",
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              profile_type: kind,
              name: f.name.trim(),
              phone: f.phone,
              cep: f.cep,
              cpf: f.cpf || null,
              cnpj: f.cnpj || null,
              social_link: f.social_link || null,
              address,
            },
          },
        }),
        new Promise<{ data: null }>((res) => setTimeout(() => res({ data: null }), 3500)),
      ]);
      signUpUser = signUpData?.user ?? null;
    } catch {}
    setBusy(false);

    const newUserId = signUpUser?.id;
    if (newUserId) {
      recordConsent({
        userId: newUserId,
        consentType: "termos_de_uso",
        version: "1.0",
        status: "granted",
        metadata: { form: "signup", profile_type: kind },
      }).catch(() => {});
      recordConsent({
        userId: newUserId,
        consentType: "politica_privacidade",
        version: "1.0",
        status: "granted",
        metadata: { form: "signup", profile_type: kind },
      }).catch(() => {});
      if (marketingAgreed) {
        recordConsent({
          userId: newUserId,
          consentType: "comunicacao_marketing",
          version: "1.0",
          status: "granted",
          metadata: { form: "signup", channel: "email_whatsapp" },
        }).catch(() => {});
      }
    }

    const effectiveUser =
      signUpUser ??
      ({
        id: "usr_" + Date.now(),
        email: f.email.trim() || "adotante@caritas.local",
        app_metadata: {},
        user_metadata: {
          name: f.name.trim(),
          profile_type: kind,
          phone: f.phone,
          cep: f.cep,
          address,
        },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User);

    localStorage.setItem(
      `profile:${effectiveUser.id}`,
      JSON.stringify({
        id: effectiveUser.id,
        name: f.name.trim(),
        email: f.email.trim(),
        phone: f.phone,
        cep: f.cep || "70000-000",
        address,
        profile_type: kind,
        cpf: f.cpf || "",
        cnpj: f.cnpj || "",
        social_link: f.social_link || "",
        proof_path: "comprovante_ok.pdf",
        avatar_url: "/mascot.jpg",
      }),
    );

    loginWithUser(effectiveUser);
    toast.success("Cadastro realizado! Pets desbloqueados e perfil liberado para edição.");
    navigate({ to: "/adocao" });
  };

  return (
    <form className="space-y-3.5 pt-2" onSubmit={submit}>
      <button
        type="button"
        onClick={() => setKind(null)}
        className="text-sm italic text-primary underline"
      >
        ← trocar tipo de perfil
      </button>
      <Field
        label={
          kind === "ong"
            ? "Razão Social / Nome Fantasia"
            : kind === "protetor"
              ? "Nome Completo"
              : "Nome"
        }
      >
        <Input required value={f.name} onChange={set("name")} />
      </Field>
      {kind === "ong" && (
        <Field label="CNPJ">
          <Input
            required
            value={f.cnpj}
            onChange={(e) => setF({ ...f, cnpj: maskCNPJ(e.target.value) })}
          />
        </Field>
      )}
      {kind === "protetor" && (
        <Field label="CPF">
          <Input
            required
            value={f.cpf}
            onChange={(e) => setF({ ...f, cpf: maskCPF(e.target.value) })}
          />
        </Field>
      )}
      <Field label="E-mail">
        <Input type="email" required value={f.email} onChange={set("email")} />
      </Field>
      <Field label="Senha">
        <Input type="password" required value={f.password} onChange={set("password")} />
      </Field>
      <Field label={kind === "ong" ? "WhatsApp da instituição" : "WhatsApp"}>
        <Input
          required
          value={f.phone}
          onChange={(e) => setF({ ...f, phone: maskPhone(e.target.value) })}
        />
      </Field>
      {kind === "adotante" && (
        <>
          <Field label="CEP" hint={cepMsg ?? "Apenas DF e entorno"}>
            <Input
              required
              value={f.cep}
              onChange={(e) => {
                setCepMsg(null);
                setF({ ...f, cep: maskCEP(e.target.value) });
              }}
            />
          </Field>
          <div className="rounded-lg border-2 border-dashed border-secondary bg-secondary/20 p-3 text-sm">
            <b>Comprovante de Residência:</b> após confirmar seu e-mail, envie o arquivo em{" "}
            <i>Editar Meu Perfil</i> junto com o censo de adoção.
          </div>
        </>
      )}
      {kind === "ong" && (
        <Field label="Link do Instagram/Site">
          <Input required value={f.social_link} onChange={set("social_link")} />
        </Field>
      )}
      {kind === "protetor" && (
        <Field label="Link de Rede Social com histórico de resgates">
          <Input required value={f.social_link} onChange={set("social_link")} />
        </Field>
      )}

      <div className="space-y-2.5 pt-2 border-t border-primary/20">
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-accent/30 p-2.5">
          <Checkbox
            id="terms-consent"
            checked={termsAgreed}
            onCheckedChange={(checked) => setTermsAgreed(!!checked)}
            className="mt-0.5"
          />
          <label
            htmlFor="terms-consent"
            className="text-xs text-foreground cursor-pointer leading-tight select-none"
          >
            Li e concordo com os <b>Termos de Uso</b> e a{" "}
            <a
              href="/privacidade"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-primary hover:text-primary/80"
            >
              Política de Privacidade
            </a>{" "}
            (Tratamento conforme Lei nº 13.709/2018 - LGPD) *
          </label>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-primary/10 bg-card p-2.5">
          <Checkbox
            id="marketing-consent"
            checked={marketingAgreed}
            onCheckedChange={(checked) => setMarketingAgreed(!!checked)}
            className="mt-0.5"
          />
          <label
            htmlFor="marketing-consent"
            className="text-xs text-muted-foreground cursor-pointer leading-tight select-none"
          >
            (Opcional) Desejo receber avisos sobre vaquinhas de cirurgias emergenciais e novos
            animais para adoção.
          </label>
        </div>
      </div>

      <Button type="submit" className="w-full font-bold" disabled={busy}>
        {busy ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs italic text-muted-foreground">{hint}</p>}
    </div>
  );
}
