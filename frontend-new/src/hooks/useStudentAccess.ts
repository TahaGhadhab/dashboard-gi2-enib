import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilters } from '@/context/FilterContext';
import type {
  UserRole,
  StudentLevel,
  StudentStatus,
  StudentSummary,
  StudentResult,
  StudentAbsence,
  StudentProfile,
} from '@/types/student';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeStatus(moyenne: number | undefined, pctInjust: number): StudentStatus {
  if (moyenne !== undefined && moyenne < 10 && pctInjust > 30) return 'alerte';
  if (moyenne !== undefined && moyenne >= 14) return 'excellent';
  return 'normal';
}

function computeMoyenne(resultats: StudentResult[]): number | undefined {
  if (!resultats.length) return undefined;
  const valid = resultats.filter((r) => r.moyenne !== null && r.moyenne !== undefined);
  if (!valid.length) return undefined;
  const total = valid.reduce((sum, r) => sum + (r.moyenne ?? 0), 0);
  return Math.round((total / valid.length) * 10) / 10;
}

function buildAbsences(
  rows: { nb_justifiees: number; nb_injustifiees: number }[] | null
): StudentAbsence {
  if (!rows || rows.length === 0) return { total: 0, justifiees: 0, taux_assiduite: 100 };
  const justifiees = rows.reduce((s, r) => s + (r.nb_justifiees ?? 0), 0);
  const injustifiees = rows.reduce((s, r) => s + (r.nb_injustifiees ?? 0), 0);
  const total = justifiees + injustifiees;
  const taux_assiduite = total === 0 ? 100 : Math.max(0, Math.round(((total - injustifiees) / total) * 100));
  return { total, justifiees, taux_assiduite };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildResultats(rows: any[] | null): StudentResult[] {
  if (!rows) return [];
  return rows.map((r) => ({
    id_matiere: r.matieres?.id_matiere ?? r.id_matiere ?? 0,
    nom_matiere: r.matieres?.nom ?? '—',
    code_matiere: r.matieres?.code ?? '—',
    note_principale: r.note_session_principale ?? null,
    note_rattrapage: r.note_rattrapage ?? null,
    moyenne: r.moyenne ?? null,
    valide: r.admis ?? false,
    credits: r.matieres?.credits ?? 0,
    semestre: r.semestre ?? '—',
  }));
}

// ─── Hook principal ───────────────────────────────────────────────────────────

interface UseStudentAccessReturn {
  students: StudentSummary[];
  role: UserRole | null;
  permanentId: number | null;
  loading: boolean;
  error: string | null;
  fetchStudentProfile: (studentId: number) => Promise<StudentProfile | null>;
}

export function useStudentAccess(): UseStudentAccessReturn {
  const { anneeUniv } = useFilters();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [permanentId, setPermanentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1. Rôle depuis user_metadata
        const { data: { user } } = await supabase.auth.getUser();
        const userRole = (user?.user_metadata?.role ?? null) as UserRole | null;
        if (!userRole) throw new Error('Rôle utilisateur non défini.');

        // 2. Si permanent : récupérer son id_enseignant (via auth_user_id)
        let permId: number | null = null;
        if (userRole === 'permanent') {
          const { data: perm, error: permErr } = await supabase
            .from('permanents')
            .select('id_enseignant')
            .eq('auth_user_id', user!.id)
            .is('deleted_at', null)
            .single();
          if (permErr) throw new Error('Impossible de récupérer votre profil enseignant.');
          permId = perm?.id_enseignant ?? null;
        }

        // 3. Étudiants — RLS filtre automatiquement selon le rôle
        const { data: etudiantsRaw, error: etErr } = await supabase
          .from('etudiants')
          .select('id_etudiant, nom, prenom, niveau, classe, double_diplome')
          .is('deleted_at', null)
          .order('nom', { ascending: true });

        if (etErr) throw new Error('Données non disponibles.');

        // 4. Notes globales pour calculer les moyennes (RLS filtre les matières)
        //    Filtre par annee_univ pour correspondre au calcul backend du KPI
        const { data: allResultats } = await supabase
          .from('resultats_examens')
          .select('id_etudiant, note_session_principale, note_rattrapage, moyenne, admis, id_matiere')
          .eq('annee_univ', anneeUniv)
          .is('deleted_at', null);

        const resultatsMap = new Map<
          number,
          { note_session_principale: number | null; note_rattrapage: number | null; moyenne: number | null; admis: boolean | null; id_matiere: number }[]
        >();
        (allResultats ?? []).forEach((r) => {
          if (!resultatsMap.has(r.id_etudiant)) resultatsMap.set(r.id_etudiant, []);
          resultatsMap.get(r.id_etudiant)!.push(r);
        });

        // 5. Absences globales pour calculer le taux d'assiduité et le statut "alerte"
        const { data: allAbsences } = await supabase
          .from('absences_etudiants')
          .select('id_etudiant, nb_justifiees, nb_injustifiees')
          .is('deleted_at', null);

        const absencesMap = new Map<number, { nb_justifiees: number; nb_injustifiees: number }[]>();
        (allAbsences ?? []).forEach((a) => {
          if (!absencesMap.has(a.id_etudiant)) absencesMap.set(a.id_etudiant, []);
          absencesMap.get(a.id_etudiant)!.push(a);
        });

        const summaries: StudentSummary[] = (etudiantsRaw ?? []).map((et) => {
          const res = resultatsMap.get(et.id_etudiant) ?? [];
          const partialResultats = res.map((r) => ({
            id_matiere: r.id_matiere,
            nom_matiere: '',
            code_matiere: '',
            note_principale: r.note_session_principale,
            note_rattrapage: r.note_rattrapage,
            moyenne: r.moyenne,
            valide: r.admis ?? false,
            credits: 0,
            semestre: '',
          }));
          const moyenne = userRole === 'chef_dept' ? computeMoyenne(partialResultats) : undefined;
          
          const abs = absencesMap.get(et.id_etudiant) ?? [];
          const just = abs.reduce((s, a) => s + (a.nb_justifiees ?? 0), 0);
          const injust = abs.reduce((s, a) => s + (a.nb_injustifiees ?? 0), 0);
          const totalAbs = just + injust;
          const pctInjust = totalAbs > 0 ? (injust / totalAbs) * 100 : 0;
          
          const statut = computeStatus(computeMoyenne(partialResultats), pctInjust);
          
          return {
            id_etudiant: et.id_etudiant,
            nom: et.nom,
            prenom: et.prenom,
            niveau: et.niveau as StudentLevel,
            classe: et.classe ?? undefined,
            double_diplome: et.double_diplome ?? false,
            moyenne,
            taux_assiduite: totalAbs === 0 ? 100 : Math.max(0, Math.round(((totalAbs - injust) / totalAbs) * 100)),
            statut,
            nb_matieres_accessibles: userRole === 'permanent' ? res.length : undefined,
          };
        });

        if (!cancelled) {
          setRole(userRole);
          setPermanentId(permId);
          setStudents(summaries);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur inconnue.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [anneeUniv]);

  // ─── fetchStudentProfile ──────────────────────────────────────────────────

  const fetchStudentProfile = useCallback(async (studentId: number): Promise<StudentProfile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userRole = (user?.user_metadata?.role ?? null) as UserRole | null;

      // Infos générales (affichage immédiat)
      const { data: student, error: etErr } = await supabase
        .from('etudiants')
        .select('id_etudiant, nom, prenom, niveau, classe, double_diplome')
        .eq('id_etudiant', studentId)
        .is('deleted_at', null)
        .single();

      if (etErr || !student) return null;

      // Notes + absences en parallèle (RLS filtre selon le rôle automatiquement)
      const [{ data: resultatsRaw }, { data: absencesRaw }] = await Promise.all([
        supabase
          .from('resultats_examens')
          .select(`
            note_session_principale, note_rattrapage, moyenne, admis, semestre, id_matiere,
            matieres (id_matiere, nom, code, credits)
          `)
          .eq('id_etudiant', studentId)
          .is('deleted_at', null),

        supabase
          .from('absences_etudiants')
          .select('nb_justifiees, nb_injustifiees, id_matiere')
          .eq('id_etudiant', studentId)
          .is('deleted_at', null),
      ]);

      const resultats = buildResultats(resultatsRaw);
      const absences = buildAbsences(absencesRaw);
      const moyenne = userRole === 'chef_dept' ? computeMoyenne(resultats) : undefined;
      const pctInjust = absences.total > 0 ? ((absences.total - absences.justifiees) / absences.total) * 100 : 0;
      const statut = computeStatus(computeMoyenne(resultats), pctInjust);

      // PFE — chef_dept seulement
      let pfe = undefined;
      if (userRole === 'chef_dept') {
        const { data: pfeData } = await supabase
          .from('pfe_fiches')
          .select('titre, entreprise, pfe_evaluation(note)')
          .eq('id_etudiant', studentId)
          .is('deleted_at', null)
          .maybeSingle();

        if (pfeData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const evalNote = (pfeData as any).pfe_evaluation?.[0]?.note;
          pfe = {
            titre: pfeData.titre,
            entreprise: pfeData.entreprise,
            note: evalNote,
          };
        }
      }

      const summary: StudentSummary = {
        id_etudiant: student.id_etudiant,
        nom: student.nom,
        prenom: student.prenom,
        niveau: student.niveau as StudentLevel,
        classe: student.classe ?? undefined,
        double_diplome: student.double_diplome ?? false,
        moyenne,
        taux_assiduite: absences.taux_assiduite,
        statut,
        nb_matieres_accessibles: userRole === 'permanent' ? resultats.length : undefined,
      };

      return {
        summary,
        resultats,
        absences,
        pfe,
        is_partial: userRole === 'permanent',
      };
    } catch {
      return null;
    }
  }, []);

  return { students, role, permanentId, loading, error, fetchStudentProfile };
}
