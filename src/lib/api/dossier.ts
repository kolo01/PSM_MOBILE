import { apiFetch, ApiError } from "@/lib/api-client";

// ---------- Consultations ----------

export interface Consultation {
  id: string;
  patientId: string;
  date: string;
  professionnel: string;
  specialite: string;
  etablissement: string;
  motif: string;
  diagnostic: string;
  conduite: string;
  ordonnance?: string[];
  signature: string;
  createdAt: string;
}

export const consultationsApi = {
  list: (patientId: string): Promise<Consultation[]> =>
    apiFetch(`/patients/${patientId}/consultations`),
};

// ---------- Ordonnances ----------

export type Medicament = { nom: string; posologie: string; duree: string };

export interface Ordonnance {
  id: string;
  patientId: string;
  date: string;
  prescripteur: string;
  medicaments: Medicament[];
  imported: boolean;
  createdAt: string;
}

export const ordonnancesApi = {
  list: (patientId: string): Promise<Ordonnance[]> => apiFetch(`/patients/${patientId}/ordonnances`),
};

// ---------- Consentements ----------

export type ConsentType = "ponctuel" | "suivi" | "urgence" | "protocole";
export type ConsentStatut = "actif" | "revoque" | "expire";

export interface Consent {
  id: string;
  patientId: string;
  beneficiaire: string;
  role: string;
  etablissement: string;
  type: ConsentType;
  sections: string[];
  dateDebut: string;
  dateFin: string;
  statut: ConsentStatut;
  createdAt: string;
}

export const consentsApi = {
  list: (patientId: string): Promise<Consent[]> => apiFetch(`/patients/${patientId}/consents`),
};

// ---------- Protocoles & mesures (utilisé par le graphique tension du dashboard) ----------

export interface Mesure {
  id: string;
  protocolId: string;
  date: string;
  valeur: number;
  unite: string;
}

export interface Protocol {
  id: string;
  patientId: string;
  pathologie: string;
  parametre: string;
  unite: string;
  frequence: string;
  prescripteur: string;
  datePrescription: string;
  seuilMin?: number;
  seuilMax?: number;
  statut: "actif" | "termine";
  mesures: Mesure[];
  createdAt: string;
}

export const protocolsApi = {
  list: (patientId: string): Promise<Protocol[]> => apiFetch(`/patients/${patientId}/protocols`),
};

// ---------- Documents importés ----------

export type DocType = "ordonnance" | "compte_rendu" | "biologie" | "imagerie" | "vaccination" | "autre";

export interface ImportedDoc {
  id: string;
  patientId: string;
  type: DocType;
  date: string;
  praticien?: string;
  note?: string;
  filename: string;
  fileUrl: string;
  validatedBy?: string;
  validatedDate?: string;
  createdAt: string;
}

export interface CreateImportedDocPayload {
  type: DocType;
  date: string;
  praticien?: string;
  note?: string;
  filename: string;
  fileUrl: string;
}

export const documentsApi = {
  list: (patientId: string): Promise<ImportedDoc[]> => apiFetch(`/patients/${patientId}/documents`),
  create: (patientId: string, dto: CreateImportedDocPayload): Promise<ImportedDoc> =>
    apiFetch(`/patients/${patientId}/documents`, { method: "POST", body: JSON.stringify(dto) }),
};

// ---------- Examens ----------

export type ExamBioItem = { nom: string; valeur: string; norme: string; alerte?: boolean };

export interface ExamBio {
  id: string;
  patientId: string;
  date: string;
  labo: string;
  items: ExamBioItem[];
  imported: boolean;
  createdAt: string;
}

export interface ExamImagerie {
  id: string;
  patientId: string;
  date: string;
  type: string;
  etablissement: string;
  radiologue: string;
  conclusion: string;
  imageUrl?: string;
  imported: boolean;
  createdAt: string;
}

export interface ExamFonctionnel {
  id: string;
  patientId: string;
  date: string;
  type: string;
  professionnel: string;
  conclusion: string;
  imported: boolean;
  createdAt: string;
}

export interface ExamAutre {
  id: string;
  patientId: string;
  date: string;
  titre: string;
  auteur: string;
  description: string;
  imported: boolean;
  createdAt: string;
}

export interface ExamsAll {
  bio: ExamBio[];
  imagerie: ExamImagerie[];
  fonctionnels: ExamFonctionnel[];
  autres: ExamAutre[];
}

export const examsApi = {
  list: (patientId: string): Promise<ExamsAll> => apiFetch(`/patients/${patientId}/exams`),
};

// ---------- Rendez-vous (patient) ----------

export type RdvType = "Présentiel" | "Téléconsultation";
export type RdvStatut = "Confirmé" | "En attente" | "Annulé" | "Passé";

export interface Rdv {
  id: string;
  patientId: string;
  date: string;
  professionnel: string;
  specialite: string;
  etablissement: string;
  type: RdvType;
  statut: RdvStatut;
  lien?: string;
  createdAt: string;
}

export const rdvApi = {
  list: (patientId: string): Promise<Rdv[]> => apiFetch(`/patients/${patientId}/rdv`),
  updateStatut: (patientId: string, id: string, statut: RdvStatut): Promise<Rdv> =>
    apiFetch(`/patients/${patientId}/rdv/${id}/statut`, {
      method: "PATCH",
      body: JSON.stringify({ statut }),
    }),
};

// ---------- Prise de RDV en ligne (parcours patient : créneau -> paiement) ----------

export type MoyenPaiement = "moov_money" | "orange_money" | "wave" | "carte";
export type StatutPaiement = "en_attente" | "paye" | "echoue" | "expire";
export type PaiementStatut = "en_attente" | "reussi" | "echoue" | "rembourse";
export type BookingType = "Présentiel" | "Téléconsultation" | "Visite à domicile";

export interface RdvBookingPayload {
  creneauId: string;
  motif?: string;
}

export interface RdvBookingDraft {
  id: string;
  patientId: string;
  proId: string;
  professionnel: string;
  specialite: string;
  etablissement: string;
  date: string;
  type: BookingType;
  motif?: string;
  montantXof: number;
  statutPaiement: StatutPaiement;
  expireAt: string;
}

export interface PayBookingPayload {
  moyenPaiement: MoyenPaiement;
}

export interface PaymentReceipt {
  id: string;
  rdvId: string;
  montantXof: number;
  moyenPaiement: MoyenPaiement;
  statut: PaiementStatut;
  reference: string;
  date: string;
}

export const rdvBookingApi = {
  create: (patientId: string, dto: RdvBookingPayload): Promise<RdvBookingDraft> =>
    apiFetch(`/patients/${patientId}/rdv/bookings`, { method: "POST", body: JSON.stringify(dto) }),
  pay: (
    patientId: string,
    bookingId: string,
    dto: PayBookingPayload,
  ): Promise<{ rdv: Rdv; recu: PaymentReceipt }> =>
    apiFetch(`/patients/${patientId}/rdv/bookings/${bookingId}/payer`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};

// ---------- Nutrition ----------

export interface NutritionPrescription {
  id: string;
  patientId: string;
  regime: string;
  instructions: string;
  alimentsDeconseilles: string[];
  prescripteur: string;
  date: string;
  objectifPoids?: number;
  objectifPas?: number;
  createdAt: string;
  updatedAt: string;
}

export const nutritionApi = {
  get: async (patientId: string): Promise<NutritionPrescription | null> => {
    try {
      return await apiFetch(`/patients/${patientId}/nutrition`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },
};

// ---------- Constantes (utilisé pour le suivi du poids) ----------

export type VitalKey =
  | "poids"
  | "taille"
  | "imc"
  | "temperature"
  | "fc"
  | "tas"
  | "tad"
  | "spo2"
  | "glycemie"
  | "tour_taille"
  | "fr"
  | "perimetre_cranien";

export interface VitalReading {
  id: string;
  patientId: string;
  key: VitalKey;
  date: string;
  valeur: number;
  source: "pro" | "iot" | "patient";
  auteur?: string;
  createdAt: string;
}

export const vitalsApi = {
  list: (patientId: string, key?: VitalKey): Promise<VitalReading[]> =>
    apiFetch(`/patients/${patientId}/vitals${key ? `?key=${key}` : ""}`),
};

// ---------- Vaccinations ----------

export type VaccinType =
  | "DTP"
  | "Hépatite B"
  | "Fièvre jaune"
  | "Méningite"
  | "COVID"
  | "Rougeole"
  | "Polio"
  | "Rotavirus"
  | "Autre";

export interface Vaccin {
  id: string;
  patientId: string;
  nom: string;
  type: VaccinType;
  date: string;
  lot?: string;
  professionnel?: string;
  etablissement?: string;
  rappel?: string;
  imported: boolean;
  validatedBy?: string;
  validatedDate?: string;
  createdAt: string;
}

export interface CreateVaccinPayload {
  nom: string;
  type: VaccinType;
  date: string;
  lot?: string;
  professionnel?: string;
  etablissement?: string;
  rappel?: string;
}

export const vaccinationsApi = {
  list: (patientId: string): Promise<Vaccin[]> => apiFetch(`/patients/${patientId}/vaccinations`),
  create: (patientId: string, dto: CreateVaccinPayload): Promise<Vaccin> =>
    apiFetch(`/patients/${patientId}/vaccinations`, { method: "POST", body: JSON.stringify(dto) }),
};

// ---------- Assurances ----------

export type AssuranceType = "privee" | "mutuelle" | "cmu" | "employeur" | "voyage" | "autre";
export type AssuranceStatut = "actif" | "expire" | "renouvellement";

export type TauxCategories = Partial<{
  consultation_g: number;
  consultation_s: number;
  hospi: number;
  medic: number;
  bio: number;
  imagerie: number;
  dentaire: number;
  optique: number;
  maternite: number;
}>;

export interface Assurance {
  id: string;
  patientId: string;
  type: AssuranceType;
  organisme: string;
  numAdherent: string;
  numCarte?: string;
  dateDebut: string;
  dateFin: string;
  statut: AssuranceStatut;
  tauxGeneral: number;
  plafondXof?: number;
  tauxCategories?: TauxCategories;
  contactTel: string;
  contactEmail?: string;
  agence?: string;
  beneficiaires: string[];
  masquePour: string[];
  createdAt: string;
}

export interface CreateAssurancePayload {
  type: AssuranceType;
  organisme: string;
  numAdherent: string;
  numCarte?: string;
  dateDebut: string;
  dateFin: string;
  tauxGeneral: number;
  plafondXof?: number;
  tauxCategories?: TauxCategories;
  contactTel: string;
  contactEmail?: string;
  agence?: string;
}

export const assurancesApi = {
  list: (patientId: string): Promise<Assurance[]> => apiFetch(`/patients/${patientId}/assurances`),
  create: (patientId: string, dto: CreateAssurancePayload): Promise<Assurance> =>
    apiFetch(`/patients/${patientId}/assurances`, { method: "POST", body: JSON.stringify(dto) }),
};

// ---------- Journal d'accès ----------

export interface AuditLogEntry {
  id: string;
  patientId?: string;
  acteur: string;
  acteurRole: "patient" | "pro" | "admin" | "systeme" | "client_api";
  action: string;
  ressource: string;
  ip?: string;
  resultat: "succes" | "echec";
  createdAt: string;
}

export const journalApi = {
  list: (patientId: string): Promise<AuditLogEntry[]> => apiFetch(`/patients/${patientId}/journal`),
};
