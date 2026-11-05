-- ==============================================================================
-- Migration: Pets Desaparecidos (DF) - Carita's Pets
-- Tabela para divulgação e busca ativa de animais perdidos no Distrito Federal
-- ==============================================================================

-- 1. Cria a tabela missing_pets se ainda nao existir
CREATE TABLE IF NOT EXISTS public.missing_pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL DEFAULT 'Cachorro',
    sex_age TEXT DEFAULT '',
    region TEXT NOT NULL DEFAULT 'Brasília',
    location TEXT NOT NULL,
    last_seen TEXT DEFAULT '',
    photo_url TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    guardian_name TEXT DEFAULT '',
    contact TEXT NOT NULL,
    phone TEXT DEFAULT '',
    reward TEXT DEFAULT '',
    status TEXT DEFAULT 'desaparecido',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Garante que todas as colunas existem (caso a tabela ja tenha sido criada com schema antigo)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'species') THEN
        ALTER TABLE public.missing_pets ADD COLUMN species TEXT NOT NULL DEFAULT 'Cachorro';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'sex_age') THEN
        ALTER TABLE public.missing_pets ADD COLUMN sex_age TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'region') THEN
        ALTER TABLE public.missing_pets ADD COLUMN region TEXT NOT NULL DEFAULT 'Brasília';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'last_seen') THEN
        ALTER TABLE public.missing_pets ADD COLUMN last_seen TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'guardian_name') THEN
        ALTER TABLE public.missing_pets ADD COLUMN guardian_name TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'phone') THEN
        ALTER TABLE public.missing_pets ADD COLUMN phone TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'reward') THEN
        ALTER TABLE public.missing_pets ADD COLUMN reward TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'status') THEN
        ALTER TABLE public.missing_pets ADD COLUMN status TEXT DEFAULT 'desaparecido';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missing_pets' AND column_name = 'user_id') THEN
        ALTER TABLE public.missing_pets ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Habilita Row Level Security (RLS)
ALTER TABLE public.missing_pets ENABLE ROW LEVEL SECURITY;

-- 4. Politicas RLS
DROP POLICY IF EXISTS "Leitura publica de pets desaparecidos" ON public.missing_pets;
CREATE POLICY "Leitura publica de pets desaparecidos"
    ON public.missing_pets FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Cadastro publico de pets desaparecidos" ON public.missing_pets;
CREATE POLICY "Cadastro publico de pets desaparecidos"
    ON public.missing_pets FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Atualizacao de pets desaparecidos" ON public.missing_pets;
CREATE POLICY "Atualizacao de pets desaparecidos"
    ON public.missing_pets FOR UPDATE
    USING (true);

-- Permissoes explicitas
GRANT SELECT, INSERT ON public.missing_pets TO anon, authenticated;
GRANT ALL ON public.missing_pets TO service_role;

-- 5. Limpa registros genericos antigos (se existirem na tabela)
DELETE FROM public.missing_pets 
WHERE name IN ('Caramelo', 'Nina') 
  AND (description LIKE '%Usa coleira azul%' OR location LIKE '%Cruzeiro Velho, próximo à feira%');

-- 6. Insercao dos 4 Pets Iniciais Oficiais
INSERT INTO public.missing_pets (
    id,
    name,
    species,
    sex_age,
    region,
    location,
    last_seen,
    photo_url,
    description,
    guardian_name,
    contact,
    phone,
    status
) VALUES 
(
    '11111111-1111-1111-1111-000000000001',
    'Bento',
    'Gato',
    'Macho (castrado) • 2 anos',
    'Cruzeiro Novo',
    'Perto da Quadra 1205 (Brasília/DF)',
    '02/11/2026, por volta das 19h30',
    '/assets/img/bento.jpg',
    'Pelagem curta branca e preta (frajola), peito, patas e focinho brancos, nariz rosado e olhos verdes (sem coleira). É dócil e curioso, mas se assusta com barulho de carros e motos. Escapou por uma fresta da janela à noite. Se o avistar, evite movimentos bruscos e chame pelo nome oferecendo sachê.',
    'Mariana Alves',
    'Mariana Alves — (61) 99812-0041',
    '(61) 99812-0041',
    'desaparecido'
),
(
    '11111111-1111-1111-1111-000000000002',
    'Apolo',
    'Cachorro',
    'Macho (Golden Retriever) • 1 ano e 4 meses',
    'Asa Norte',
    'Altura da SQN 210, próximo ao comércio local (Brasília/DF)',
    '03/11/2026, às 16h45',
    '/assets/img/apolo.jpg',
    'Porte médio/grande, pelagem dourada clara, orelhas caramelo e focinho preto. Extremamente brincalhão, manso e acostumado a carregar galhos, brinquedos e flores na boca. Soltou-se da guia no passeio da tarde ao correr atrás de um pássaro.',
    'Lucas Tavares',
    'Lucas Tavares — (61) 99645-0183',
    '(61) 99645-0183',
    'desaparecido'
),
(
    '11111111-1111-1111-1111-000000000003',
    'Mel',
    'Cachorro',
    'Fêmea (filhote) • 4 meses',
    'Sudoeste',
    'Próximo à QMSW 5 (Brasília/DF)',
    '04/11/2026, às 09h15',
    '/assets/img/mel.jpg',
    'Filhote peluda cor creme com orelhas douradas e coleira laranja vibrante com fecho metálico. Muito carinhosa e confiante com estranhos; saiu pelo portão da garagem durante uma entrega. Está em fase de vacinação e tem dieta específica.',
    'Camila Rocha',
    'Camila Rocha — (61) 99230-0759',
    '(61) 99230-0759',
    'desaparecido'
),
(
    '11111111-1111-1111-1111-000000000004',
    'Avelã',
    'Gato',
    'Fêmea (castrada) • 3 anos',
    'Águas Claras',
    'Arredores da entrada do Parque Ecológico (Brasília/DF)',
    '01/11/2026, por volta das 21h00',
    '/assets/img/avela.jpg',
    'Pelagem rajada (marrom e preta) semilonga, cauda bem volumosa com ponta escura e olhos amarelados. Usa coleira azul com cápsula prateada de identificação. Calma, caseira e mia bem baixinho; pode ter se escondido em arbustos ou garagens vizinhas.',
    'Rafael Mendes',
    'Rafael Mendes — (61) 99104-0392',
    '(61) 99104-0392',
    'desaparecido'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    species = EXCLUDED.species,
    sex_age = EXCLUDED.sex_age,
    region = EXCLUDED.region,
    location = EXCLUDED.location,
    last_seen = EXCLUDED.last_seen,
    photo_url = EXCLUDED.photo_url,
    description = EXCLUDED.description,
    guardian_name = EXCLUDED.guardian_name,
    contact = EXCLUDED.contact,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status;

