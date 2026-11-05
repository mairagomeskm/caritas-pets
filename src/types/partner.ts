export interface PartnerOrg {
  id: string;
  name: string;
  category: "Projeto Universitário" | "ONG de Acolhimento" | "Coletivo Independente";
  region: string;
  leader: string;
  leaderRole: string;
  logo: string;
  coverGradient: string;
  badges: string[];
  summary: string;
  aboutStory: string;
  rescueMethodology: string;
  healthProtocols: {
    title: string;
    description: string;
  }[];
  adoptionRequirements: string[];
  pixKey: string;
  pixType: string;
  pixName: string;
  contactPhone?: string;
  instagramUrl?: string;
  slogan?: string;
  mission?: string;
  howToHelp?: {
    title: string;
    description: string;
    tag?: string;
  }[];
  donationItemsSummary?: string;
}

export interface Article {
  id: string;
  cat: "Dicas & Cuidados" | "Posse Responsável";
  title: string;
  summary: string;
  photo: string;
  readTime: string;
  content: string;
}

export interface CommunityPost {
  id: string;
  pet_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  pets: { name: string; photo_url: string | null } | null;
}

export type FeedItem = { kind: "post"; post: CommunityPost } | { kind: "article"; a: Article };
