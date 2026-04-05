import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

/**
 * Generic CSV export for each module.
 * GET /api/export/:module/csv?annee_univ=...
 */
router.get('/:module/csv', async (req, res, next) => {
  try {
    const { module } = req.params;
    const annee = req.query.annee_univ || process.env.ANNEE_UNIV;

    let data = [];
    let filename = `${module}_${annee}.csv`;

    switch (module) {
      case 'enseignement': {
        const { data: resultats } = await supabase
          .from('resultats_examens')
          .select('*, etudiants(nom, prenom, classe, niveau), matieres(nom_matiere)')
          .eq('annee_univ', annee).is('deleted_at', null);
        data = (resultats || []).map(r => ({
          'Étudiant': `${r.etudiants?.prenom || ''} ${r.etudiants?.nom || ''}`,
          'Classe': r.etudiants?.classe || '',
          'Niveau': r.etudiants?.niveau || '',
          'Matière': r.matieres?.nom_matiere || '',
          'Semestre': r.semestre || '',
          'Note Principale': r.note_session_principale ?? '',
          'DS1': r.note_ds1 ?? '',
          'DS2': r.note_ds2 ?? '',
          'TP': r.note_tp ?? '',
          'Rattrapage': r.note_rattrapage ?? '',
          'Moyenne': r.moyenne ?? '',
          'Mention': r.mention || '',
          'Admis': r.admis ? 'Oui' : 'Non',
          'Session': r.session_admission || '',
        }));
        break;
      }
      case 'rh': {
        const { data: charges } = await supabase
          .from('charge_permanents')
          .select('*, permanents(nom, prenom, grade)')
          .eq('annee_univ', annee).is('deleted_at', null);
        data = (charges || []).map(c => ({
          'Enseignant': `${c.permanents?.prenom || ''} ${c.permanents?.nom || ''}`,
          'Grade': c.permanents?.grade || '',
          'H. Statutaires': c.heures_statutaires ?? '',
          'H. Réalisées': c.heures_realisees ?? '',
          'CM': c.heures_cm ?? '',
          'TD': c.heures_td ?? '',
          'TP': c.heures_tp ?? '',
          'Semestre': c.semestre || '',
        }));
        break;
      }
      case 'encadrement': {
        const { data: pfes } = await supabase
          .from('pfe_fiches')
          .select('*, etudiants(nom, prenom), entreprises(nom), pfe_evaluation(*)')
          .eq('annee_univ', annee).is('deleted_at', null);
        data = (pfes || []).map(p => ({
          'Étudiant': `${p.etudiants?.prenom || ''} ${p.etudiants?.nom || ''}`,
          'Intitulé PFE': p.intitule || '',
          'Entreprise': p.entreprises?.nom || '',
          'Secteur': p.secteur || '',
          'Note Rapport': p.pfe_evaluation?.[0]?.note_rapport ?? '',
          'Note Soutenance': p.pfe_evaluation?.[0]?.note_soutenance ?? '',
          'Mention': p.pfe_evaluation?.[0]?.mention || '',
        }));
        break;
      }
      case 'satisfaction': {
        const { data: reponses } = await supabase
          .from('satisfaction_reponses')
          .select('*').eq('annee_univ', annee).is('deleted_at', null);
        data = (reponses || []).map(r => ({
          'Classe': r.classe || '',
          'Niveau': r.niveau || '',
          'Semestre': r.semestre || '',
          'Score Cours': r.score_cours ?? '',
          'Score Encadrement': r.score_encadrement ?? '',
          'Score Infra': r.score_infra ?? '',
          'Score Vie Étudiante': r.score_vie_etudiante ?? '',
          'Date': r.date_reponse || '',
        }));
        break;
      }
      case 'rayonnement': {
        const { data: parts } = await supabase
          .from('partenariats')
          .select('*').is('deleted_at', null);
        data = (parts || []).map(p => ({
          'Organisme': p.nom_organisme || '',
          'Type': p.type || '',
          'Secteur': p.secteur || '',
          'Convention Active': p.convention_active ? 'Oui' : 'Non',
          'Date Signature': p.date_signature || '',
          'Date Expiration': p.date_expiration || '',
          'Étudiants Accueillis': p.nb_etudiants_accueillis ?? '',
        }));
        break;
      }
      default:
        return res.status(400).json({ error: `Module inconnu: ${module}` });
    }

    if (data.length === 0) {
      return res.status(200).send('Aucune donnée');
    }

    // Build CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(';'),
      ...data.map(row =>
        headers.map(h => {
          const val = String(row[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        }).join(';')
      ),
    ];
    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

export default router;
