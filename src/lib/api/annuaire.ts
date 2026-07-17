import { apiFetch } from "@/lib/api-client";

export interface ProSearchResult {
  id: string;
  nom: string;
  specialite: string;
  etablissementId?: string;
  etablissement?: string;
  ville: string;
  verifie: boolean;
  exerciceLibre: boolean;
}

export interface SearchProsParams {
  specialite?: string;
  ville?: string;
  etablissement?: string;
  nom?: string;
}

export function searchPros(params: SearchProsParams): Promise<ProSearchResult[]> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const s = qs.toString();
  return apiFetch(`/annuaire/pros${s ? `?${s}` : ""}`);
}

export const VILLES_CI = [
  "Abidjan",
  "Bouaké",
  "Yamoussoukro",
  "San-Pédro",
  "Korhogo",
  "Daloa",
  "Man",
  "Gagnoa",
] as const;

export type CreneauType = "Présentiel" | "Téléconsultation" | "Visite à domicile";
export type CreneauStatut = "disponible" | "reserve" | "annule";

export interface Creneau {
  id: string;
  proId: string;
  date: string;
  dureeMin: number;
  type: CreneauType;
  statut: CreneauStatut;
}

export function fetchCreneauxDisponibles(proId: string): Promise<Creneau[]> {
  return apiFetch(`/annuaire/pros/${proId}/creneaux`);
}
