import type { MemorialPet } from "@/types/pet";

export const QUINDIM_MEMORIAL: MemorialPet = {
  id: "memorial-quindim-star",
  name: "Quindim",
  photo_url: "/pets/quindim.jpg",
  tribute_period: "Resgatado na UnB (2024) • Adotado em fev/2025 • Para sempre amado",
  guardian_name: "Família e Resgatos UnB (@resgatosunb)",
  story:
    "Quindim era um gato alegre, amável e amado. Ele foi resgatado da UnB com sua família em 2024 e conseguiu uma adoção em fevereiro de 2025. Cerca de um mês depois, recebemos a notícia de que o adotante, Pablo Stuart, havia adotado dezenas de outros gatos tigrados com outras protetoras. Até então ele mandava fotos e vídeos do Quindim, mas o que exatamente aconteceu com ele nós nunca saberemos. Quindim foi vítima de maus-tratos e provavelmente foi torturado até a morte. Sua passagem deixou uma saudade imensa e inspira nossa luta diária por adoções mais seguras, responsáveis e cheias de amor.",
  likes_count: 128,
  is_pinned: true,
  created_at: "2025-03-01T12:00:00Z",
};

export const INITIAL_MEMORIAL_PETS: MemorialPet[] = [QUINDIM_MEMORIAL];
