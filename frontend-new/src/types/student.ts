// ─── Types — Profil Étudiant ─────────────────────────────────────────────────
// Schéma Supabase confirmé — noms de colonnes exacts à respecter :
//
// permanents           : id_enseignant (PK), auth_user_id (lien auth.users)
// etudiants            : id_etudiant   (PK), niveau, classe, double_diplome
// enseignants_matieres : id_enseignant, id_matiere
// resultats_examens    : id_etudiant,   id_matiere
// absences_etudiants   : id_etudiant,   id_matiere

export type StudentLevel = '1ere' | '2eme' | '3eme';
export type StudentStatus = 'alerte' | 'normal' | 'excellent';
export type UserRole = 'chef_dept' | 'permanent';

export interface StudentSummary {
  id_etudiant: number;
  nom: string;
  prenom: string;
  niveau: StudentLevel;
  classe?: string;              // ex: "GI3A", "GI2B"
  double_diplome?: boolean;
  moyenne?: number;             // undefined si permanent (accès partiel)
  taux_assiduite?: number;
  statut: StudentStatus;
  nb_matieres_accessibles?: number; // pour permanent : nombre de ses matières
}

export interface StudentResult {
  id_matiere: number;
  nom_matiere: string;
  code_matiere: string;
  note_principale: number | null;
  note_rattrapage: number | null;
  moyenne?: number | null;
  valide: boolean;
  credits: number;
  semestre: string;
}

export interface StudentAbsence {
  total: number;
  justifiees: number;
  taux_assiduite: number;
}

export interface StudentPFE {
  titre: string;
  entreprise: string;
  note?: number;
}

export interface StudentProfile {
  summary: StudentSummary;
  resultats: StudentResult[];     // filtrés selon le rôle par RLS
  absences: StudentAbsence;
  pfe?: StudentPFE;               // undefined pour permanent
  is_partial: boolean;            // true si permanent (accès partiel)
}
