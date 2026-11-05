export interface PetItem {
  id: string;
  name: string;
  species: "cao" | "gato" | string;
  breed?: string;
  weight?: string;
  gender?: "macho" | "femea" | string;
  size?: "pequeno" | "medio" | "grande" | string;
  age_label: string;
  is_puppy: boolean;
  region: string;
  photo_url: string;
  photos?: string[];
  description?: string;
  detailed_story?: string;
  health_status?: string[];
  temperament?: string[];
  organization_name?: string;
  status: "disponivel" | "adotado" | string;
}

export type Pet = PetItem;

export interface MemorialPet {
  id: string;
  name: string;
  photo_url: string;
  tribute_period?: string;
  guardian_name?: string;
  story: string;
  likes_count: number;
  is_pinned?: boolean;
  created_at?: string;
  user_id?: string | null;
}

export interface MissingPet {
  id: string;
  name: string;
  species: "Gato" | "Cachorro" | "gato" | "cao" | string;
  sex_age?: string;
  gender?: string;
  age?: string;
  region: string;
  location: string;
  last_seen: string;
  photo_url: string;
  description: string;
  guardian_name?: string;
  contact: string;
  phone?: string;
  reward?: string;
  created_at?: string;
}

