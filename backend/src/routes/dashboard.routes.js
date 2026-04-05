import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

/**
 * GET /api/dashboard/kpis?annee_univ=2024-2025
 * Returns 10 summary KPIs + morning briefing alerts
 */
router.get('/kpis', async (req, res, next) => {
  try {
    const annee = req.query.annee_univ || process.env.ANNEE_UNIV || '2024-2025';

    // Execute all KPI queries in parallel
    const [
      reussite,
      controle,
      assiduite,
      occupationRH,
      satisfactionRes,
      doubleDiplomeRes,
      modulesNonCouverts,
      contratsRenouveler,
      emploiPfe,
      conventionsRes,
      alertEtudiantsRes,
    ] = await Promise.all([
      supabase.rpc('calc_taux_reussite_principale', { p_annee: annee }),
      supabase.rpc('calc_taux_controle', { p_annee: annee }),
      supabase.rpc('calc_assiduite'),
      supabase.rpc('calc_occupation_rh', { p_annee: annee }),
      // Score satisfaction — AVG of 4 scores
      supabase
        .from('satisfaction_reponses')
        .select('score_cours, score_encadrement, score_infra, score_vie_etudiante')
        .eq('annee_univ', annee)
        .is('deleted_at', null),
      // Double diplome M2
      supabase
        .from('etudiants')
        .select('double_diplome, niveau')
        .eq('niveau', 'M2')
        .is('deleted_at', null),
      supabase.rpc('calc_modules_non_couverts'),
      supabase.rpc('calc_contrats_renouveler'),
      supabase.rpc('calc_emploi_pfe', { p_annee: annee }),
      // Conventions actives
      supabase
        .from('partenariats')
        .select('id_partenariat', { count: 'exact', head: true })
        .eq('convention_active', true)
        .is('deleted_at', null),
      // Étudiants en alerte (avg < 10 AND unexcused > 30%)
      getAlertStudents(annee),
    ]);

    // Calculate satisfaction score
    const satRows = satisfactionRes.data || [];
    let scoreSatisfaction = null;
    if (satRows.length > 0) {
      const total = satRows.reduce((sum, r) => {
        return sum + ((r.score_cours || 0) + (r.score_encadrement || 0) +
          (r.score_infra || 0) + (r.score_vie_etudiante || 0)) / 4;
      }, 0);
      scoreSatisfaction = Math.round((total / satRows.length) * 10) / 10;
    }

    // Calculate double diplome rate
    const m2Students = doubleDiplomeRes.data || [];
    const nbM2 = m2Students.length;
    const nbDD = m2Students.filter(s => s.double_diplome === true).length;
    const tauxDoubleDiplome = nbM2 > 0 ? Math.round(1000 * nbDD / nbM2) / 10 : 0;

    const kpis = {
      taux_reussite_principale: reussite.data ?? null,
      taux_controle: controle.data ?? null,
      taux_assiduite: assiduite.data ?? null,
      taux_occupation_rh: occupationRH.data ?? null,
      score_satisfaction: scoreSatisfaction,
      taux_double_diplome: tauxDoubleDiplome,
      modules_non_couverts: modulesNonCouverts.data ?? 0,
      contrats_renouveler: contratsRenouveler.data ?? 0,
      taux_emploi_pfe: emploiPfe.data ?? null,
      conventions_actives: conventionsRes.count ?? 0,
    };

    // Morning Briefing — alerts
    const alerts = [];
    const nbAlertEtudiants = alertEtudiantsRes.length;

    if ((kpis.contrats_renouveler || 0) > 0) {
      alerts.push({
        level: 'red',
        icon: '🔴',
        message: `${kpis.contrats_renouveler} contrat(s) expirent dans < 30 jours`,
        link: '/rh',
      });
    }
    if ((kpis.modules_non_couverts || 0) > 0) {
      alerts.push({
        level: 'red',
        icon: '🔴',
        message: `${kpis.modules_non_couverts} module(s) sans enseignant assigné`,
        link: '/rh',
      });
    }
    if (nbAlertEtudiants > 0) {
      alerts.push({
        level: 'red',
        icon: '🔴',
        message: `${nbAlertEtudiants} étudiant(s) en alerte académique`,
        link: '/enseignement',
      });
    }
    if (kpis.taux_controle !== null && kpis.taux_controle > 35) {
      alerts.push({
        level: 'orange',
        icon: '🟠',
        message: `Taux de contrôle ${kpis.taux_controle}% — dépasse 35%`,
        link: '/enseignement',
      });
    }
    if (scoreSatisfaction !== null && scoreSatisfaction < 3.5) {
      alerts.push({
        level: 'orange',
        icon: '🟠',
        message: `Satisfaction ${scoreSatisfaction}/5 — sous le seuil`,
        link: '/satisfaction',
      });
    }

    res.json({
      annee_univ: annee,
      kpis,
      alerts,
      etudiants_alertes: nbAlertEtudiants,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Helper: Get students with avg < 10 AND unexcused absences > 30%
 */
async function getAlertStudents(annee) {
  // Get exam results
  const { data: resultats } = await supabase
    .from('resultats_examens')
    .select('id_etudiant, moyenne')
    .eq('annee_univ', annee)
    .is('deleted_at', null);

  // Get absences
  const { data: absences } = await supabase
    .from('absences_etudiants')
    .select('id_etudiant, nb_justifiees, nb_injustifiees')
    .is('deleted_at', null);

  if (!resultats || !absences) return [];

  // Calculate per-student averages
  const studentAvg = {};
  for (const r of resultats) {
    if (!studentAvg[r.id_etudiant]) studentAvg[r.id_etudiant] = { sum: 0, count: 0 };
    if (r.moyenne !== null) {
      studentAvg[r.id_etudiant].sum += parseFloat(r.moyenne);
      studentAvg[r.id_etudiant].count += 1;
    }
  }

  // Calculate per-student absence rate
  const studentAbs = {};
  for (const a of absences) {
    if (!studentAbs[a.id_etudiant]) studentAbs[a.id_etudiant] = { just: 0, injust: 0 };
    studentAbs[a.id_etudiant].just += a.nb_justifiees || 0;
    studentAbs[a.id_etudiant].injust += a.nb_injustifiees || 0;
  }

  // Find alert students: avg < 10 AND unexcused > 30%
  const alertIds = [];
  for (const [id, avg] of Object.entries(studentAvg)) {
    const mean = avg.count > 0 ? avg.sum / avg.count : 20;
    const abs = studentAbs[id] || { just: 0, injust: 0 };
    const total = abs.just + abs.injust;
    const pctInjust = total > 0 ? (abs.injust / total) * 100 : 0;
    if (mean < 10 && pctInjust > 30) {
      alertIds.push(parseInt(id));
    }
  }

  return alertIds;
}

export default router;
