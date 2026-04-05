import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

router.get('/kpis', async (req, res, next) => {
  try {
    const annee = req.query.annee_univ || process.env.ANNEE_UNIV;

    const [pfeEncRes, pfeEvalRes, pfeFichesRes, pfeDeboucheRes,
      pjmEvalRes, pjmFichesRes, ampEvalRes, ampFichesRes,
      entreprisesRes, permanentsRes] = await Promise.all([
      supabase.from('pfe_encadrement').select('*, permanents(nom, prenom), pfe_fiches(annee_univ)').is('deleted_at', null),
      supabase.from('pfe_evaluation').select('*, pfe_fiches(annee_univ)').is('deleted_at', null),
      supabase.from('pfe_fiches').select('*, entreprises(nom, secteur), etudiants(nom, prenom)').eq('annee_univ', annee).is('deleted_at', null),
      supabase.from('pfe_debouche').select('*, pfe_fiches(annee_univ)').is('deleted_at', null),
      supabase.from('pjm_evaluation').select('*, permanents(nom, prenom), pjm_fiches(theme, semestre)').is('deleted_at', null),
      supabase.from('pjm_fiches').select('*, modules_heures(nom_module)').is('deleted_at', null),
      supabase.from('amp_evaluation').select('*, permanents(nom, prenom), amp_fiches(sujet, semestre)').is('deleted_at', null),
      supabase.from('amp_fiches').select('*, etudiants(nom, prenom)').is('deleted_at', null),
      supabase.from('entreprises').select('*').is('deleted_at', null),
      supabase.from('permanents').select('id_enseignant, nom, prenom').is('deleted_at', null),
    ]);

    const pfeEnc = (pfeEncRes.data || []).filter(p => p.pfe_fiches?.annee_univ === annee);
    const pfeEval = (pfeEvalRes.data || []).filter(p => p.pfe_fiches?.annee_univ === annee);
    const pfeFiches = pfeFichesRes.data || [];
    const pfeDebouche = (pfeDeboucheRes.data || []).filter(p => p.pfe_fiches?.annee_univ === annee);
    const pjmEval = pjmEvalRes.data || [];
    const pjmFiches = pjmFichesRes.data || [];
    const ampEval = ampEvalRes.data || [];
    const entreprises = entreprisesRes.data || [];
    const permMap = Object.fromEntries((permanentsRes.data || []).map(p => [p.id_enseignant, `${p.prenom} ${p.nom}`]));

    // M3-01: Projets par encadrant
    const encProj = {};
    for (const e of pfeEnc) {
      const n = permMap[e.id_enseignant] || `Ens. ${e.id_enseignant}`;
      if (!encProj[n]) encProj[n] = { pfe: 0, pjm: 0, amp: 0 };
      encProj[n].pfe++;
    }
    for (const e of pjmEval) {
      const n = permMap[e.id_enseignant] || `Ens. ${e.id_enseignant}`;
      if (!encProj[n]) encProj[n] = { pfe: 0, pjm: 0, amp: 0 };
      encProj[n].pjm++;
    }
    for (const e of ampEval) {
      const n = permMap[e.id_enseignant] || `Ens. ${e.id_enseignant}`;
      if (!encProj[n]) encProj[n] = { pfe: 0, pjm: 0, amp: 0 };
      encProj[n].amp++;
    }
    const m3_01 = {
      chartData: Object.entries(encProj).map(([enc, d]) => ({
        encadrant: enc, total: d.pfe + d.pjm + d.amp, pfe: d.pfe, pjm: d.pjm, amp: d.amp,
      })).sort((a, b) => b.total - a.total),
    };

    // M3-02: Note moyenne PFE par encadrant
    const pfeNotes = {};
    for (const enc of pfeEnc) {
      const ev = pfeEval.find(e => e.id_pfe === enc.id_pfe);
      if (!ev) continue;
      const n = permMap[enc.id_enseignant] || `Ens. ${enc.id_enseignant}`;
      if (!pfeNotes[n]) pfeNotes[n] = [];
      pfeNotes[n].push(((ev.note_rapport||0) + (ev.note_soutenance||0) + (ev.note_jury||0)) / 3);
    }
    const m3_02 = {
      chartData: Object.entries(pfeNotes).map(([enc, notes]) => ({
        encadrant: enc, moyenne: Math.round(10 * notes.reduce((a,b)=>a+b,0) / notes.length) / 10,
      })),
      value: pfeEval.length > 0
        ? Math.round(10 * pfeEval.reduce((s,e) => s + ((e.note_rapport||0)+(e.note_soutenance||0)+(e.note_jury||0))/3, 0) / pfeEval.length) / 10
        : null,
    };

    // M3-03: Note moyenne PJM par module
    const pjmByMod = {};
    for (const e of pjmEval) {
      const f = pjmFiches.find(f => f.id_pjm === e.id_pjm);
      const mod = f?.modules_heures?.nom_module || 'Inconnu';
      if (!pjmByMod[mod]) pjmByMod[mod] = [];
      pjmByMod[mod].push(((e.note_rapport||0) + (e.note_presentation||0)) / 2);
    }
    const m3_03 = {
      chartData: Object.entries(pjmByMod).map(([m, notes]) => ({
        module: m, moyenne: Math.round(10 * notes.reduce((a,b)=>a+b,0) / notes.length) / 10,
      })),
      value: pjmEval.length > 0
        ? Math.round(10 * pjmEval.reduce((s,e) => s + ((e.note_rapport||0)+(e.note_presentation||0))/2, 0) / pjmEval.length) / 10
        : null,
    };

    // M3-04: Note moyenne AMP par semestre
    const ampBySem = {};
    for (const e of ampEval) {
      const f = (ampFichesRes.data||[]).find(f => f.id_amp === e.id_amp);
      const sem = f?.semestre || 'Inconnu';
      if (!ampBySem[sem]) ampBySem[sem] = [];
      ampBySem[sem].push(e.note_memoire || 0);
    }
    const m3_04 = {
      chartData: Object.entries(ampBySem).map(([s, notes]) => ({
        semestre: s, moyenne: Math.round(10 * notes.reduce((a,b)=>a+b,0) / notes.length) / 10,
      })),
      value: ampEval.length > 0
        ? Math.round(10 * ampEval.reduce((s,e) => s + (e.note_memoire||0), 0) / ampEval.length) / 10
        : null,
    };

    // M3-05: Taux emploi post-PFE
    const totalDeb = pfeDebouche.length;
    const emb = pfeDebouche.filter(d => d.embauche === true).length;
    const m3_05 = {
      value: totalDeb > 0 ? Math.round(1000 * emb / totalDeb) / 10 : null,
      embauches: emb, total: totalDeb,
      chartData: [{ name: 'Embauchés', value: emb }, { name: 'Non embauchés', value: totalDeb - emb }],
    };

    // M3-06: Pré-embauche par industrie
    const bySect = {};
    for (const d of pfeDebouche) {
      const s = d.secteur_final || 'Autre';
      if (!bySect[s]) bySect[s] = { total: 0, emb: 0 };
      bySect[s].total++;
      if (d.embauche) bySect[s].emb++;
    }
    const m3_06 = {
      chartData: Object.entries(bySect).map(([secteur, d]) => ({
        secteur, taux: d.total > 0 ? Math.round(1000 * d.emb / d.total) / 10 : 0, total: d.total,
      })),
    };

    // M3-07: Entreprises partenaires actives
    const actives = entreprises.filter(e => e.convention_active === true);
    const m3_07 = {
      value: actives.length,
      entreprises: actives.map(e => ({ id: e.id_entreprise, nom: e.nom, secteur: e.secteur })),
    };

    res.json({
      annee_univ: annee,
      kpis: {
        'm3_01_projets_encadrant': m3_01,
        'm3_02_note_pfe': m3_02,
        'm3_03_note_pjm': m3_03,
        'm3_04_note_amp': m3_04,
        'm3_05_emploi_pfe': m3_05,
        'm3_06_preembauche_industrie': m3_06,
        'm3_07_entreprises_actives': m3_07,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
