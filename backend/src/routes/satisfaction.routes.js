import { Router } from 'express';
import supabase from '../config/supabase.js';
import axios from 'axios';

const router = Router();

router.get('/kpis', async (req, res, next) => {
  try {
    const annee = req.query.annee_univ || process.env.ANNEE_UNIV;

    const [reponsesRes, matieresScoreRes] = await Promise.all([
      supabase.from('satisfaction_reponses').select('*').eq('annee_univ', annee).is('deleted_at', null),
      supabase.from('satisfaction_matieres').select('*, matieres(nom_matiere)').is('deleted_at', null),
    ]);

    const reponses = reponsesRes.data || [];
    const matScores = matieresScoreRes.data || [];

    // M4-01: Score global satisfaction (RadarChart 4 axes)
    const avgScores = { cours: 0, encadrement: 0, infra: 0, vie: 0 };
    if (reponses.length > 0) {
      for (const r of reponses) {
        avgScores.cours += parseFloat(r.score_cours || 0);
        avgScores.encadrement += parseFloat(r.score_encadrement || 0);
        avgScores.infra += parseFloat(r.score_infra || 0);
        avgScores.vie += parseFloat(r.score_vie_etudiante || 0);
      }
      const n = reponses.length;
      avgScores.cours = Math.round(10 * avgScores.cours / n) / 10;
      avgScores.encadrement = Math.round(10 * avgScores.encadrement / n) / 10;
      avgScores.infra = Math.round(10 * avgScores.infra / n) / 10;
      avgScores.vie = Math.round(10 * avgScores.vie / n) / 10;
    }
    const globalScore = reponses.length > 0
      ? Math.round(10 * (avgScores.cours + avgScores.encadrement + avgScores.infra + avgScores.vie) / 4) / 10
      : null;

    const m4_01 = {
      value: globalScore,
      radarData: [
        { axis: 'Cours', score: avgScores.cours },
        { axis: 'Encadrement', score: avgScores.encadrement },
        { axis: 'Infrastructures', score: avgScores.infra },
        { axis: 'Vie Étudiante', score: avgScores.vie },
      ],
    };

    // M4-02: Score enseignement par classe
    const m4_02 = groupScoreBy(reponses, 'classe', 'score_cours');

    // M4-03: Score infrastructures
    const m4_03 = groupScoreBy(reponses, 'classe', 'score_infra');

    // M4-04: Score encadrement par semestre
    const m4_04 = groupScoreBy(reponses, 'semestre', 'score_encadrement');

    // M4-05: Score vie étudiante par niveau
    const m4_05 = groupScoreBy(reponses, 'niveau', 'score_vie_etudiante');

    // M4-06: Taux participation (placeholder — need total students per class)
    const classCounts = {};
    for (const r of reponses) {
      const c = r.classe || 'Inconnu';
      classCounts[c] = (classCounts[c] || 0) + 1;
    }
    const m4_06 = {
      chartData: Object.entries(classCounts).map(([classe, nb]) => ({
        classe, nb_reponses: nb, taux: null,
      })),
      total_reponses: reponses.length,
    };

    // M4-07: Top/Flop matières
    const sorted = [...matScores]
      .filter(m => m.score !== null)
      .sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    const m4_07 = {
      top3: sorted.slice(0, 3).map(m => ({
        matiere: m.matieres?.nom_matiere || `Matière ${m.id_matiere}`,
        score: parseFloat(m.score), nb_votes: m.nb_votes,
      })),
      flop3: sorted.slice(-3).reverse().map(m => ({
        matiere: m.matieres?.nom_matiere || `Matière ${m.id_matiere}`,
        score: parseFloat(m.score), nb_votes: m.nb_votes,
      })),
    };

    // M4-08: Évolution satisfaction entre semestres
    const bySem = {};
    for (const r of reponses) {
      const sem = r.semestre || 'S?';
      if (!bySem[sem]) bySem[sem] = { sum: 0, count: 0 };
      const avg = ((parseFloat(r.score_cours)||0) + (parseFloat(r.score_encadrement)||0) +
        (parseFloat(r.score_infra)||0) + (parseFloat(r.score_vie_etudiante)||0)) / 4;
      bySem[sem].sum += avg;
      bySem[sem].count++;
    }
    const m4_08 = {
      chartData: Object.entries(bySem).map(([semestre, d]) => ({
        semestre, score: Math.round(10 * d.sum / d.count) / 10,
      })),
    };

    res.json({
      annee_univ: annee,
      kpis: {
        'm4_01_score_global': m4_01,
        'm4_02_score_enseignement': m4_02,
        'm4_03_score_infra': m4_03,
        'm4_04_score_encadrement': m4_04,
        'm4_05_score_vie': m4_05,
        'm4_06_participation': m4_06,
        'm4_07_top_flop': m4_07,
        'm4_08_evolution': m4_08,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/satisfaction/import — Import from Google Sheets
 */
router.post('/import', async (req, res, next) => {
  try {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    const { data: csvText } = await axios.get(url);

    const rows = parseCSV(csvText);
    if (rows.length <= 1) return res.json({ imported: 0 });

    const records = rows.slice(1).map(row => ({
      classe: row[1]?.trim() || null,
      niveau: row[2]?.trim() || null,
      semestre: row[3]?.trim() || null,
      annee_univ: row[4]?.trim() || process.env.ANNEE_UNIV,
      score_cours: parseFloat(row[5]) || null,
      score_encadrement: parseFloat(row[6]) || null,
      score_infra: parseFloat(row[7]) || null,
      score_vie_etudiante: parseFloat(row[8]) || null,
      date_reponse: row[0] ? new Date(row[0]).toISOString() : new Date().toISOString(),
    })).filter(r => r.classe);

    if (records.length === 0) return res.json({ imported: 0 });

    const { error } = await supabase.from('satisfaction_reponses').insert(records);
    if (error) throw error;

    res.json({ imported: records.length });
  } catch (err) {
    next(err);
  }
});

function groupScoreBy(reponses, groupField, scoreField) {
  const groups = {};
  for (const r of reponses) {
    const key = r[groupField] || 'Inconnu';
    if (!groups[key]) groups[key] = { sum: 0, count: 0 };
    groups[key].sum += parseFloat(r[scoreField] || 0);
    groups[key].count++;
  }
  const chartData = Object.entries(groups).map(([name, d]) => ({
    name, score: Math.round(10 * d.sum / d.count) / 10,
  }));
  const allSum = Object.values(groups).reduce((s, d) => s + d.sum, 0);
  const allCount = Object.values(groups).reduce((s, d) => s + d.count, 0);
  return {
    value: allCount > 0 ? Math.round(10 * allSum / allCount) / 10 : null,
    chartData,
  };
}

function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { current.push(field); field = ''; }
      else if (c === '\n' || (c === '\r' && text[i + 1] === '\n')) {
        current.push(field); field = ''; rows.push(current); current = [];
        if (c === '\r') i++;
      } else { field += c; }
    }
  }
  if (field || current.length) { current.push(field); rows.push(current); }
  return rows;
}

export default router;
