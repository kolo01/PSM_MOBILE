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

export interface UpdatePatientPayload {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  sexe?: "M" | "F";
  idCmu?: string;
  region?: string;
  groupeSanguin?: string;
  allergies?: string[];
  pathologiesChroniques?: string[];
  photoUrl?: string;
}

export function updatePatient(id: string, payload: UpdatePatientPayload): Promise<PatientProfile> {
  return apiFetch(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function updatePatientTelephone(
  id: string,
  telephone: string,
  otpCode: string,
): Promise<PatientProfile> {
  return apiFetch(`/patients/${id}/telephone`, {
    method: "PATCH",
    body: JSON.stringify({ telephone, otpCode }),
  });
}
