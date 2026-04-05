import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

/**
 * GET /api/rayonnement/kpis?annee_univ=2024-2025
 * Returns 8 KPIs for Module 5 — Rayonnement
 */
router.get('/kpis', async (req, res, next) => {
  try {
    const annee = req.query.annee_univ || process.env.ANNEE_UNIV;

    const [partenariatsRes, visitesRes, seminairesRes, unitesRes] = await Promise.all([
      supabase.from('partenariats').select('*').is('deleted_at', null),
      supabase.from('visites_entreprises').select('*, partenariats(nom_organisme)').is('deleted_at', null),
      supabase.from('seminaires_industriels').select('*').is('deleted_at', null),
      supabase.from('unites_expertise').select('*, permanents(nom, prenom)').is('deleted_at', null),
    ]);

    const partenariats = partenariatsRes.data || [];
    const visites = visitesRes.data || [];
    const seminaires = seminairesRes.data || [];
    const unites = unitesRes.data || [];

    // M5-01: Conventions actives
    const actives = partenariats.filter(p => p.convention_active === true);
    const m5_01 = { value: actives.length };

    // M5-02: Nb visites entreprises/an
    const m5_02 = {
      value: visites.length,
      chartData: visites.map(v => ({
        date: v.date_visite,
        organisme: v.partenariats?.nom_organisme || 'N/A',
        nb_etudiants: v.nb_etudiants,
        objectif: v.objectif,
      })),
    };

    // M5-03: Étudiants aux visites par niveau
    const byNiveau = {};
    for (const v of visites) {
      const niv = v.niveau_participants || 'Inconnu';
      if (!byNiveau[niv]) byNiveau[niv] = 0;
      byNiveau[niv] += v.nb_etudiants || 0;
    }
    const m5_03 = {
      chartData: Object.entries(byNiveau).map(([niveau, nb]) => ({ niveau, nb_etudiants: nb })),
    };

    // M5-04: Séminaires industriels/an
    const m5_04 = {
      value: seminaires.length,
      timeline: seminaires.map(s => ({
        intitule: s.intitule,
        organisme: s.organisme_intervenant,
        date: s.date,
        duree: s.duree_heures,
        participants: s.nb_participants,
        evaluation: s.evaluation_moyenne,
      })).sort((a, b) => new Date(b.date) - new Date(a.date)),
    };

    // M5-05: Score moyen séminaires
    const semWithScores = seminaires.filter(s => s.evaluation_moyenne != null);
    const avgSem = semWithScores.length > 0
      ? Math.round(10 * semWithScores.reduce((s, sem) =>
          s + parseFloat(sem.evaluation_moyenne), 0) / semWithScores.length) / 10
      : null;
    const m5_05 = { value: avgSem };

    // M5-06: Unités d'expertise actives
    const activeUnits = unites.filter(u => u.actif === true);
    const m5_06 = {
      value: activeUnits.length,
      unites: activeUnits.map(u => ({
        intitule: u.intitule,
        expert: u.permanents ? `${u.permanents.prenom} ${u.permanents.nom}` : 'N/A',
        domaine: u.domaine,
        sessions: u.nb_sessions_annee,
        participants: u.nb_participants_cumul,
        partenaire: u.partenaire_industriel,
      })),
    };

    // M5-07: Participants cumulés unités
    const m5_07 = {
      chartData: activeUnits.map(u => ({
        unite: u.intitule,
        participants: u.nb_participants_cumul || 0,
      })),
    };

    // M5-08: Conventions expirant (60j)
    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const expiring = partenariats.filter(p => {
      if (!p.date_expiration) return false;
      const exp = new Date(p.date_expiration);
      return exp >= now && exp <= in60Days;
    });
    const m5_08 = {
      value: expiring.length,
      conventions: expiring.map(p => ({
        id: p.id_partenariat,
        nom: p.nom_organisme,
        type: p.type,
        date_expiration: p.date_expiration,
      })),
    };

    res.json({
      annee_univ: annee,
      kpis: {
        'm5_01_conventions_actives': m5_01,
        'm5_02_visites': m5_02,
        'm5_03_etudiants_visites': m5_03,
        'm5_04_seminaires': m5_04,
        'm5_05_score_seminaires': m5_05,
        'm5_06_unites_expertise': m5_06,
        'm5_07_participants_unites': m5_07,
        'm5_08_conventions_expirant': m5_08,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
