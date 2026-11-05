import type { PartnerOrg, Article } from "@/types/partner";

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

export const PARTNERS: PartnerOrg[] = [
  {
    id: "aumigos-do-quadradinho",
    name: "AuMigos do Quadradinho",
    slogan: "Conectando Famílias",
    category: "ONG de Acolhimento",
    region: "Distrito Federal",
    leader: "Equipe AuMigos",
    leaderRole: "Resgate e Conexão de Famílias",
    logo: "/aumigos-do-quadradinho.png",
    coverGradient: "from-[#1a1a1a] via-[#ea580c] to-[#c2410c]",
    badges: ["🐾 Conectando Famílias", "🐶 Cães & Gatos", "💉 Vacinados", "✂️ Castração Garantida"],
    summary:
      "Iniciativa solidária dedicada a acolher, reabilitar e conectar animais resgatados às suas novas famílias no Distrito Federal.",
    mission:
      "Você quer salvar um animal? É muito fácil e a gente te conta como! Nossa missão é conectar animais resgatados às suas novas famílias.",
    aboutStory:
      "O AuMigos do Quadradinho atua em Brasília e regiões administrativas com foco no resgate humanizado, socialização e no encontro do par perfeito entre famílias amorosas e pets acolhidos. Cada animal acolhido passa por triagem veterinária completa: vacinação, vermifugação, castração e adaptação em ambiente acolhedor, convivendo em harmonia com outros cães, gatos e pessoas.",
    rescueMethodology:
      "Acolhimento humanizado em lares temporários supervisionados, triagem clínica com quarentena, vermifugação, vacinação, castração obrigatória e feiras de adoção com processo criterioso de avaliação e acompanhamento continuado.",
    howToHelp: [
      {
        title: "Seja Voluntário",
        description:
          "Ajude durante nossas feiras de adoção com transporte, limpeza do espaço, manutenção da água e da comida, passeios e muito carinho para o bem-estar dos bichinhos.",
        tag: "Apoio Presencial",
      },
      {
        title: "Madrinha / Padrinho",
        description:
          "Faça doações pontuais ou recorrentes para garantir que seu afilhado fique alimentado e com saúde até ser adotado. Você recebe relatórios atualizados dos gastos!",
        tag: "Apadrinhamento",
      },
      {
        title: "Lar Temporário",
        description:
          "Tem um pouco mais de tempo e disposição? Abrigue um bichinho temporariamente enquanto ele espera pela adoção. É muita responsabilidade, mas você dá conta! Peça mais informações por DM no Instagram.",
        tag: "Acolhimento",
      },
      {
        title: "Doe Ração",
        description:
          "Alimentação de qualidade é fundamental para a recuperação dos animais e libera recursos para ajudarmos mais bichinhos. Marcas utilizadas: Golden, Gran Plus, Premier Filhotes, Royal Canin Kitten, Special Dog e Fino Trato.",
        tag: "Alimentação",
      },
      {
        title: "Doe Remédios",
        description:
          "Tem algum medicamento veterinário que seu pet não usa mais? Doe pra gente! Além dos nossos resgatados, ajudamos famílias carentes com animais que precisam de tratamento.",
        tag: "Saúde Animal",
      },
      {
        title: "Doe Artigos Pet",
        description:
          "Como muitos bichinhos chegam e saem, itens acabam rápido. Aceitamos: camas, coleiras, guias, mantas, comedouros, brinquedos, tapetes higiênicos, roupinhas cirúrgicas, arranhadores, nichos, focinheiras, colares elizabetanos, etc.",
        tag: "Utensílios & Conforto",
      },
      {
        title: "Divulgue nas Redes",
        description:
          "Compartilhe nossos eventos, perfil (@aumigosdoquadradinho) e posts de animais para adoção. Quanto mais gente atingirmos, maior a chance de conectarmos animais às suas novas famílias!",
        tag: "Redes Sociais",
      },
    ],
    donationItemsSummary:
      "Rações de qualidade (Golden, Gran Plus, Premier, Royal Canin, Special Dog, Fino Trato), medicamentos veterinários (lacrados ou abertos dentro da validade), artigos pet (camas, guias, roupinhas, comedouros) e cadastro para lar temporário.",
    healthProtocols: [
      {
        title: "Imunização e Carteirinha Oficial",
        description: "Vacinação polivalente e antirrábica com acompanhamento clínico veterinário.",
      },
      {
        title: "Desparasitação e Profilaxia",
        description: "Protocolo completo contra vermes intestinais, pulgas e carrapatos.",
      },
      {
        title: "Castração Garantida e Obrigatória",
        description:
          "Todos os animais são entregues esterilizados para controle populacional ético no DF.",
      },
      {
        title: "Avaliação Comportamental e Socialização",
        description: "Triagem de convivência amigável com cães, gatos e outros animais domésticos.",
      },
    ],
    adoptionRequirements: [
      "Espaço seguro e compatível com o porte do pet (casas sem rotas de fuga ou apartamentos com rede).",
      "Concordância explícita de todos os moradores do domicílio.",
      "Capacidade para alimentação de qualidade e cuidados veterinários periódicos.",
      "Assinatura do Termo de Adoção Responsável com acompanhamento continuado.",
    ],
    pixKey: "aumigosdoquadradinho@gmail.com",
    pixType: "Chave E-mail",
    pixName: "AuMigos do Quadradinho DF",
    instagramUrl: "https://www.instagram.com/aumigosdoquadradinho",
  },
  {
    id: "resgatados-unb",
    name: "Resgatos UnB",
    slogan: "Acolhimento, Saúde e Adoção Felina no Campus Darcy Ribeiro",
    category: "Projeto Universitário",
    region: "Campus Darcy Ribeiro, Asa Norte — Brasília/DF",
    leader: "Bruna Miranda",
    leaderRole: "Gestora do Projeto • Voluntária da UnB",
    logo: "/resgatos-unb.png",
    coverGradient: "from-[#002f54] via-[#004f7a] to-[#0d6938]",
    badges: [
      "🎓 Projeto Universitário (UnB)",
      "🐾 Proteção Felina",
      "💉 FIV/FeLV Negativo",
      "✂️ Castração Garantida",
    ],
    summary:
      "Iniciativa universitária gerida por Bruna Miranda, dedicada ao acolhimento, saúde, controle sanitário e adoção responsável de felinos no campus Darcy Ribeiro.",
    mission:
      "Acolher, reabilitar, controlar o aspecto sanitário e conectar gatos da Universidade de Brasília a lares seguros e com rede de proteção.",
    aboutStory:
      "O projeto Resgatos UnB nasceu no campus Darcy Ribeiro da Universidade de Brasília com o objetivo de acolher, cuidar da saúde e encontrar lares seguros para os felinos que vivem no campus. Sob a coordenação de Bruna Miranda e voluntários dedicados da comunidade acadêmica, o projeto atua no controle ético populacional, garantindo atendimento veterinário completo, desparasitação, vacinação antirrábica, testes sorológicos contra FIV/FeLV e castração garantida antes de encaminhar cada felino para adoção responsável no Distrito Federal.",
    rescueMethodology:
      "Acolhimento criterioso no campus Darcy Ribeiro com quarentena supervisionada, vermifugação em duas etapas, testagem sorológica completa por imunocromatografia e adaptação comportamental continuada.",
    howToHelp: [
      {
        title: "Doação de Ração e Sachês",
        description:
          "Rações para gatos adultos e filhotes (secas e úmidas) são essenciais para manter a nutrição dos gatinhos acolhidos e em recuperação.",
        tag: "Alimentação Felina",
      },
      {
        title: "Areia Sanitária e Higiene",
        description:
          "Areia sanitária, caixas de areia, pás e produtos de limpeza veterinária para os ambientes de acolhimento e quarentena.",
        tag: "Higiene",
      },
      {
        title: "Apadrinhamento de Castrações e Testes",
        description:
          "Contribua financeiramente via PIX para cobrir os custos de testes FIV/FeLV e castrações em clínicas parceiras.",
        tag: "Saúde",
      },
      {
        title: "Lar Temporário no DF",
        description:
          "Ofereça um lar temporário seguro (com janelas 100% teladas) para gatos em pós-operatório ou aguardando adoção.",
        tag: "Acolhimento",
      },
    ],
    donationItemsSummary:
      "Ração felina (adulto e filhote), sachês, areia sanitária, caixas de transporte, vermífugos/antipulgas e doações PIX para custeio de exames e castrações.",
    healthProtocols: [
      {
        title: "Testes Sorológicos FIV e FeLV",
        description:
          "100% dos animais resgatados são testados para Imunodeficiência e Leucemia Felina com laudo registrado.",
      },
      {
        title: "Vacinação Antirrábica & Polivalente (V4/V5)",
        description:
          "Protocolo completo de imunização com emissão da carteira de vacinação veterinária oficial.",
      },
      {
        title: "Castração Garantida e Obrigatória",
        description:
          "Animais adultos são entregues já castrados; filhotes contam com esterilização 100% custeada pelo projeto.",
      },
      {
        title: "Acompanhamento Pós-Adoção",
        description:
          "Suporte continuado nos primeiros 90 dias com a família para assegurar adaptação tranquila e enriquecimento ambiental.",
      },
    ],
    adoptionRequirements: [
      "Apartamento ou casa com 100% das janelas, vãos e sacadas com rede de proteção certificada.",
      "Vida estritamente indoor (sem rotas de fuga ou acesso desacompanhado à rua).",
      "Residência comprovada em Brasília/DF ou regiões administrativas adjacentes.",
      "Capacidade financeira para alimentação Super Premium e assistência veterinária periódica.",
      "Entrevista prévia e assinatura do Termo de Adoção Responsável com valor legal.",
    ],
    pixKey: "resgatadosunb@gmail.com",
    pixType: "Chave E-mail",
    pixName: "Projeto Resgatos UnB",
    instagramUrl: "https://www.instagram.com/resgatosunb",
  },
];

export const ARTICLES: Article[] = [
  {
    id: "art-telas",
    cat: "Dicas & Cuidados",
    title: "Telas de proteção em janelas salvam vidas: Entenda a 'Síndrome do Gato Voador'",
    summary:
      "Por que janelas e sacadas teladas são exigência unânime de todas as ONGs sérias para adoção de felinos.",
    photo: img("photo-1514888286974-6c03e2ca1dba"),
    readTime: "3 min de leitura",
    content:
      "Gatos são caçadores ágeis, mas não possuem asas. Uma simples mosca, mariposa ou pássaro que passa na janela ativa o reflexo de bote instintivo do felino, fazendo com que ele se lance no vazio sem calcular a altura. As quedas de apartamentos (conhecidas na medicina veterinária como 'síndrome do gato voador') causam pneumotórax, fraturas mandibulares, ruptura de bexiga e muitas vezes a morte instantânea. Redes de proteção certificadas (em poliamida ou polietileno com nós resistentes), instaladas por profissionais qualificados em todas as janelas e vãos da residência, garantem que o animal viva com plenitude, ar fresco e segurança absoluta.",
  },
  {
    id: "art-vacinas",
    cat: "Dicas & Cuidados",
    title: "Carteirinha de vacinas em dia: O calendário básico de imunização para cães e gatos",
    summary:
      "Polivalente (V8/V10 ou V4/V5), antirrábica anual e desparasitação periódica salvam seu companheiro.",
    photo: img("photo-1583337130417-3346a1be7dee"),
    readTime: "4 min de leitura",
    content:
      "A vacinação é o maior ato preventivo de carinho pelo seu pet. Para cães, a vacina polivalente (V8 ou V10) protege contra cinomose, parvovirose, coronavirose, hepatite infecciosa e leptospirose. A vacina antirrábica é obrigatória por lei e protege contra a raiva, zoonose letal tanto para animais quanto para humanos. Para gatos, a vacina quádrupla (V4) ou quíntupla (V5) protege contra panleucopenia, rinotraqueíte, calicivirose e clamidiose. Mantenha os vermífugos e antipulgas/carrapatos rigorosamente atualizados com a orientação do veterinário de confiança.",
  },
  {
    id: "art-adaptacao",
    cat: "Posse Responsável",
    title: "A regra dos 3 dias, 3 semanas e 3 meses na adaptação de um animal resgatado",
    summary:
      "Como respeitar o tempo emocional do pet recém-chegado para construir um laço eterno de confiança.",
    photo: img("photo-1450778869180-41d0601e046e"),
    readTime: "3 min de leitura",
    content:
      "A adaptação de um animal resgatado segue uma curva biológica conhecida como a 'Regra 3-3-3': Nos primeiros 3 dias, o pet pode se sentir sobrecarregado, assustado, esconder-se embaixo de camas ou recusar alimento. É tempo de dar espaço e silêncio. Em 3 semanas, ele começa a relaxar, entender a rotina de alimentação e passeios, demonstrando sua verdadeira personalidade. Após 3 meses, o animal finalmente compreende que aquele é o seu lar definitivo, desenvolvendo um sentimento incondicional de segurança, vínculo familiar e lealdade.",
  },
  {
    id: "art-voluntariado",
    cat: "Posse Responsável",
    title: "Como apoiar a proteção animal no DF mesmo sem adotar um pet agora",
    summary:
      "Carona solidária (táxi pet), apadrinhamento de vacinas, doação de ração e lar temporário transformam vidas.",
    photo: img("photo-1601758228041-f3b2795255f1"),
    readTime: "3 min de leitura",
    content:
      "Se no momento você não dispõe de espaço ou rotina para adotar, ainda existem dezenas de formas vitais de salvar vidas. As ONGs de Brasília enfrentam escassez contínua de recursos básicos: transporte solidário para levar animais a consultas veterinárias, doações de rações Super Premium para animais convalescentes, produtos de higiene para abrigos e, acima de tudo, voluntários de Lar Temporário (LT) para acolher animais em recuperação pós-cirúrgica. Pequenos gestos regulares fazem toda a diferença para os protetores que estão na linha de frente.",
  },
];
