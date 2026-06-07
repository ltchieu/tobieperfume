export interface ScentNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface PerfumeDTO {
  id: string;
  brand: string;
  product_name: string;
  image_url: string;
  price: string;
  description: string;
  scent_profile: string;
  scent_notes: ScentNotes;
  instagram_url?: string;
}
