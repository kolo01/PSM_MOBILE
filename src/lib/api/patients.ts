import { apiFetch } from "@/lib/api-client";

export interface PatientProfile {
  id: string;
  userId: string;
  psmId: string;
  idCmu?: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: "M" | "F";
  telephone: string;
  region?: string;
  groupeSanguin?: string;
  allergies: string[];
  pathologiesChroniques: string[];
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchMyPatientProfile(): Promise<PatientProfile> {
  return apiFetch("/patients/me");
}
