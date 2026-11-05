-- Migration: Cantinho da Saudade (Memorial Pets)
-- Tabela para homenagens de pets que viraram estrelinhas

CREATE TABLE IF NOT EXISTS public.memorial_pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    photo_url TEXT NOT NULL DEFAULT '',
    tribute_period TEXT DEFAULT '',
    guardian_name TEXT DEFAULT '',
    story TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Ativa seguranca RLS
ALTER TABLE public.memorial_pets ENABLE ROW LEVEL SECURITY;

-- Politicas de acesso
CREATE POLICY "Leitura publica de homenagens"
    ON public.memorial_pets FOR SELECT
    USING (true);

CREATE POLICY "Criacao de homenagens"
    ON public.memorial_pets FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Atualizacao de carinho/curtidas"
    ON public.memorial_pets FOR UPDATE
    USING (true);

-- Funcao para incremento atomico de carinho
CREATE OR REPLACE FUNCTION public.increment_memorial_tribute(target_pet_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.memorial_pets
    SET likes_count = likes_count + 1
    WHERE id = target_pet_id;
END;
$$;

-- Insercao da Estrelinha Inspiracao (Quindim)
INSERT INTO public.memorial_pets (
    id,
    name,
    photo_url,
    tribute_period,
    guardian_name,
    story,
    likes_count,
    is_pinned
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Quindim',
    '/pets/quindim.jpg',
    'Resgatado na UnB (2024) • Adotado em fev/2025 • Para sempre amado',
    'Família e Protetores da UnB',
    'Quindim era um gato alegre, amável e amado. Ele foi resgatado da UnB com sua família em 2024 e conseguiu uma adoção em fevereiro de 2025. Cerca de um mês depois, recebemos a notícia de que o adotante, Pablo Stuart, havia adotado dezenas de outros gatos tigrados com outras protetoras. Até então ele mandava fotos e vídeos do Quindim, mas o que exatamente aconteceu com ele nós nunca saberemos. Quindim foi vítima de maus-tratos e provavelmente foi torturado até a morte. Sua passagem deixou uma saudade imensa e inspira nossa luta diária por adoções mais seguras, responsáveis e cheias de amor.',
    127,
    true
)
ON CONFLICT (id) DO NOTHING;
