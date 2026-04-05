import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

/**
 * GET /api/enseignement/kpis?annee_univ=2024-2025
 * Returns 11 KPIs for Module 1 — Enseignement
 */
router.get('/kpis', async (req, res, next) => {
  try {
    const annee = req.query.annee_univ || process.env.ANNEE_UNIV;

    const [
      resultatsRes,
      absencesRes,
      couvertureRes,
      tpRes,
      etudiantsRes,
      matieresRes,
    ] = await Promise.all([
      supabase.from('resultats_examens').select('*').eq('annee_univ', annee).is('deleted_at', null),
      supabase.from('absences_etudiants').select('*').is('deleted_at', null),
      supabase.from('couverture_cours').select('*, modules_heures(nom_module)').is('deleted_at', null),
      supabase.from('travaux_pratiques').select('*').is('deleted_at', null),
      supabase.from('etudiants').select('*').is('deleted_at', null),
      supabase.from('matieres').select('*, modules_heures(nom_module)').is('deleted_at', null),
    ]);

    const resultats = resultatsRes.data || [];
    const absences = absencesRes.data || [];
    const couverture = couvertureRes.data || [];
    const tps = tpRes.data || [];
    const etudiants = etudiantsRes.data || [];

    // ─── M1-01: Taux réussite session principale (par promotion) ───
    const m1_01 = calcReussiteParPromo(resultats, etudiants, 'principale');

    // ─── M1-02: Taux réussite rattrapage (par promotion) ───
    const m1_02 = calcReussiteParPromo(resultats, etudiants, 'rattrapage');

    // ─── M1-03: Taux de contrôle (accès rattrapage) — par semestre ───
    const m1_03 = calcTauxControle(resultats);

    // ─── M1-04: Taux d'assiduité (mensuel) ───
    const m1_04 = calcAssiduiteMensuel(absences);

    // ─── M1-05: Couverture des cours par module ───
    const m1_05 = calcCouverture(couverture);

    // ─── M1-06: Moyenne de classe (matière × promo) ───
    const m1_06 = calcMoyenneClasse(resultats, etudiants, matieresRes.data || []);

    // ─── M1-07: Étudiants en alerte ───
    const m1_07 = calcEtudiantsAlerte(resultats, absences, etudiants);

    // ─── M1-08: Taux TP disponibles ───
    const totalTp = tps.length;
    const tpDispo = tps.filter(t => t.statut === 'disponible').length;
    const m1_08 = {
      value: totalTp > 0 ? Math.round(1000 * tpDispo / totalTp) / 10 : 100,
      total: totalTp,
      disponibles: tpDispo,
    };

    // ─── M1-09: Taux de validation modules ───
    const m1_09 = calcValidationModules(resultats, matieresRes.data || []);

    // ─── M1-10: % Double diplôme M2 ───
    const m2Students = etudiants.filter(e => e.niveau === 'M2');
    const ddCount = m2Students.filter(e => e.double_diplome === true).length;
    const m1_10 = {
      value: m2Students.length > 0 ? Math.round(1000 * ddCount / m2Students.length) / 10 : 0,
      nb_double_diplome: ddCount,
      nb_m2: m2Students.length,
      by_university: groupBy(m2Students.filter(e => e.double_diplome), 'universite_partenaire'),
    };

    // ─── M1-11: Taux contrôle par semestre ───
    const m1_11 = m1_03; // Same data, different visualization

    res.json({
      annee_univ: annee,
      kpis: {
        'm1_01_reussite_principale': m1_01,
        'm1_02_reussite_rattrapage': m1_02,
        'm1_03_taux_controle': m1_03,
        'm1_04_assiduite': m1_04,
        'm1_05_couverture': m1_05,
        'm1_06_moyenne_classe': m1_06,
        'm1_07_etudiants_alerte': m1_07,
        'm1_08_tp_disponibles': m1_08,
        'm1_09_validation_modules': m1_09,
        'm1_10_double_diplome': m1_10,
        'm1_11_controle_semestre': m1_11,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Helper functions ────────────────────────────────────

function calcReussiteParPromo(resultats, etudiants, session) {
  const etudiantMap = Object.fromEntries(etudiants.map(e => [e.id_etudiant, e]));
  const promos = {};

  for (const r of resultats) {
    const etu = etudiantMap[r.id_etudiant];
    const promo = etu?.classe || etu?.niveau || 'Inconnu';
    if (!promos[promo]) promos[promo] = { total: 0, reussi: 0 };
    promos[promo].total++;
    if (r.admis && r.session_admission === session) {
      promos[promo].reussi++;
    }
  }

  const chartData = Object.entries(promos).map(([promo, d]) => ({
    promo,
    taux: d.total > 0 ? Math.round(1000 * d.reussi / d.total) / 10 : 0,
    total: d.total,
    reussi: d.reussi,
  }));

  const global = resultats.length > 0
    ? Math.round(1000 * resultats.filter(r => r.admis && r.session_admission === session).length / resultats.length) / 10
    : 0;

  return { value: global, chartData };
}

function calcTauxControle(resultats) {
  const bySemestre = {};
  for (const r of resultats) {
    const sem = r.semestre || 'S?';
    if (!bySemestre[sem]) bySemestre[sem] = { total: 0, rattrapage: 0 };
    bySemestre[sem].total++;
    if (r.note_rattrapage !== null && r.note_rattrapage !== undefined) {
      bySemestre[sem].rattrapage++;
    }
  }

  const chartData = Object.entries(bySemestre).map(([semestre, d]) => ({
    semestre,
    taux: d.total > 0 ? Math.round(1000 * d.rattrapage / d.total) / 10 : 0,
    total: d.total,
    rattrapage: d.rattrapage,
  }));

  const totalAll = resultats.length;
  const rattrapageAll = resultats.filter(r => r.note_rattrapage !== null && r.note_rattrapage !== undefined).length;
  const globalValue = totalAll > 0 ? Math.round(1000 * rattrapageAll / totalAll) / 10 : 0;

  return { value: globalValue, chartData };
}

function calcAssiduiteMensuel(absences) {
  const byMonth = {};
  for (const a of absences) {
    const mois = a.mois || 'Inconnu';
    if (!byMonth[mois]) byMonth[mois] = { just: 0, injust: 0 };
    byMonth[mois].just += a.nb_justifiees || 0;
    byMonth[mois].injust += a.nb_injustifiees || 0;
  }

  const months = ['Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février',
    'Mars', 'Avril', 'Mai', 'Juin'];

  const chartData = months
    .filter(m => byMonth[m])
    .map(mois => {
      const d = byMonth[mois];
      const total = d.just + d.injust;
      return {
        mois,
        taux: total > 0 ? Math.round(1000 * (1 - d.injust / total)) / 10 : 100,
        absences_total: total,
        injustifiees: d.injust,
      };
    });

  const totalJust = absences.reduce((s, a) => s + (a.nb_justifiees || 0), 0);
  const totalInjust = absences.reduce((s, a) => s + (a.nb_injustifiees || 0), 0);
  const totalAll = totalJust + totalInjust;
  const globalValue = totalAll > 0 ? Math.round(1000 * (1 - totalInjust / totalAll)) / 10 : 100;

  return { value: globalValue, chartData };
}

function calcCouverture(couverture) {
  const byModule = {};
  for (const c of couverture) {
    const nom = c.modules_heures?.nom_module || `Module ${c.id_module}`;
    if (!byModule[nom]) byModule[nom] = { planifiees: 0, realisees: 0, annulees: 0 };
    byModule[nom].planifiees += c.seances_planifiees || 0;
    byModule[nom].realisees += c.seances_realisees || 0;
    byModule[nom].annulees += c.seances_annulees || 0;
  }

  const chartData = Object.entries(byModule).map(([module, d]) => ({
    module,
    taux: d.planifiees > 0 ? Math.round(1000 * d.realisees / d.planifiees) / 10 : 0,
    planifiees: d.planifiees,
    realisees: d.realisees,
    annulees: d.annulees,
  }));

  const totalPlan = Object.values(byModule).reduce((s, d) => s + d.planifiees, 0);
  const totalReal = Object.values(byModule).reduce((s, d) => s + d.realisees, 0);
  const globalValue = totalPlan > 0 ? Math.round(1000 * totalReal / totalPlan) / 10 : 0;

  return { value: globalValue, chartData };
}

function calcMoyenneClasse(resultats, etudiants, matieres) {
  const etudiantMap = Object.fromEntries(etudiants.map(e => [e.id_etudiant, e]));
  const matiereMap = Object.fromEntries(matieres.map(m => [m.id_matiere, m]));
  const grid = {};

  for (const r of resultats) {
    const etu = etudiantMap[r.id_etudiant];
    const mat = matiereMap[r.id_matiere];
    const classe = etu?.classe || etu?.niveau || 'Inconnu';
    const matiere = mat?.nom_matiere || `Matière ${r.id_matiere}`;
    const key = `${classe}|${matiere}`;

    if (!grid[key]) grid[key] = { classe, matiere, sum: 0, count: 0 };
    if (r.moyenne !== null) {
      grid[key].sum += parseFloat(r.moyenne);
      grid[key].count++;
    }
  }

  const heatmapData = Object.values(grid).map(d => ({
    classe: d.classe,
    matiere: d.matiere,
    moyenne: d.count > 0 ? Math.round(10 * d.sum / d.count) / 10 : null,
  }));

  return { heatmapData };
}

function calcEtudiantsAlerte(resultats, absences, etudiants) {
  const etudiantMap = Object.fromEntries(etudiants.map(e => [e.id_etudiant, e]));

  // Per-student avg
  const avgMap = {};
  for (const r of resultats) {
    if (!avgMap[r.id_etudiant]) avgMap[r.id_etudiant] = { sum: 0, count: 0 };
    if (r.moyenne !== null) {
      avgMap[r.id_etudiant].sum += parseFloat(r.moyenne);
      avgMap[r.id_etudiant].count++;
    }
  }

  // Per-student absences
  const absMap = {};
  for (const a of absences) {
    if (!absMap[a.id_etudiant]) absMap[a.id_etudiant] = { just: 0, injust: 0 };
    absMap[a.id_etudiant].just += a.nb_justifiees || 0;
    absMap[a.id_etudiant].injust += a.nb_injustifiees || 0;
  }

  const alertStudents = [];
  for (const [id, avg] of Object.entries(avgMap)) {
    const eid = parseInt(id);
    const mean = avg.count > 0 ? avg.sum / avg.count : 20;
    const abs = absMap[eid] || { just: 0, injust: 0 };
    const totalAbs = abs.just + abs.injust;
    const pctInjust = totalAbs > 0 ? (abs.injust / totalAbs) * 100 : 0;

    if (mean < 10 && pctInjust > 30) {
      const etu = etudiantMap[eid];
      alertStudents.push({
        id_etudiant: eid,
        nom: etu?.nom || '',
        prenom: etu?.prenom || '',
        classe: etu?.classe || '',
        moyenne: Math.round(mean * 10) / 10,
        pct_injustifiees: Math.round(pctInjust * 10) / 10,
      });
    }
  }

  return {
    value: alertStudents.length,
    students: alertStudents,
  };
}

function calcValidationModules(resultats, matieres) {
  const matiereToModule = {};
  for (const m of matieres) {
    matiereToModule[m.id_matiere] = m.modules_heures?.nom_module || `Module ${m.id_module}`;
  }

  const byModule = {};
  for (const r of resultats) {
    const mod = matiereToModule[r.id_matiere] || 'Inconnu';
    if (!byModule[mod]) byModule[mod] = { total: 0, valide: 0 };
    byModule[mod].total++;
    if (r.admis) byModule[mod].valide++;
  }

  const chartData = Object.entries(byModule).map(([module, d]) => ({
    module,
    taux: d.total > 0 ? Math.round(1000 * d.valide / d.total) / 10 : 0,
    total: d.total,
    valide: d.valide,
  }));

  return { chartData };
}

function groupBy(arr, key) {
  const map = {};
  for (const item of arr) {
    const k = item[key] || 'Non renseigné';
    if (!map[k]) map[k] = 0;
    map[k]++;
  }
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}

export default router;
