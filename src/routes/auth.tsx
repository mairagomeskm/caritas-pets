import { createFileRoute } from "@tanstack/react-router";
import { AuthForms } from "@/components/AuthForms";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou cadastrar — Carita's Pets" },
      {
        name: "description",
        content: "Entre ou crie sua conta de adotante, ONG ou protetor independente.",
      },
      { property: "og:title", content: "Entrar — Carita's Pets" },
      { property: "og:description", content: "Acesse sua conta no Carita's Pets." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="vintage-card mx-auto max-w-md p-6">
      <h1 className="mb-4 mt-2 rounded-lg bg-white px-4 py-2 font-bold text-3xl text-primary">
        Cadastro e Acesso
      </h1>
      <AuthForms />
    </div>
  );
}
