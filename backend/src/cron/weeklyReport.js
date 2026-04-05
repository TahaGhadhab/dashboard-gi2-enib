import cron from 'node-cron';
import nodemailer from 'nodemailer';
import supabase from '../config/supabase.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Weekly report — Every Monday at 8:00am
 * Sends HTML email to CHEF_DEPT_EMAIL with KPI alerts
 */
export function startWeeklyCron() {
  cron.schedule('0 8 * * 1', async () => {
    console.log('[CRON] Generating weekly report...');
    try {
      await sendWeeklyReport();
      console.log('[CRON] Weekly report sent successfully.');
    } catch (err) {
      console.error('[CRON] Failed to send weekly report:', err);
    }
  }, { timezone: 'Africa/Tunis' });

  console.log('[CRON] Weekly report scheduled — every Monday at 8:00am (Africa/Tunis)');
}

export async function sendWeeklyReport() {
  const annee = process.env.ANNEE_UNIV || '2024-2025';

  const [reussite, controle, occupationRH, assiduite, modulesNC, contratsR, emploiPfe] = await Promise.all([
    supabase.rpc('calc_taux_reussite_principale', { p_annee: annee }),
    supabase.rpc('calc_taux_controle', { p_annee: annee }),
    supabase.rpc('calc_occupation_rh', { p_annee: annee }),
    supabase.rpc('calc_assiduite'),
    supabase.rpc('calc_modules_non_couverts'),
    supabase.rpc('calc_contrats_renouveler'),
    supabase.rpc('calc_emploi_pfe', { p_annee: annee }),
  ]);

  // Satisfaction
  const { data: satRows } = await supabase
    .from('satisfaction_reponses')
    .select('score_cours, score_encadrement, score_infra, score_vie_etudiante')
    .eq('annee_univ', annee)
    .is('deleted_at', null);

  let satisfaction = null;
  if (satRows && satRows.length > 0) {
    const total = satRows.reduce((sum, r) =>
      sum + ((parseFloat(r.score_cours)||0) + (parseFloat(r.score_encadrement)||0) +
        (parseFloat(r.score_infra)||0) + (parseFloat(r.score_vie_etudiante)||0)) / 4, 0);
    satisfaction = Math.round(10 * total / satRows.length) / 10;
  }

  // Alert students count
  const { data: resultats } = await supabase
    .from('resultats_examens')
    .select('id_etudiant, moyenne')
    .eq('annee_univ', annee).is('deleted_at', null);
  const { data: absences } = await supabase
    .from('absences_etudiants')
    .select('id_etudiant, nb_justifiees, nb_injustifiees')
    .is('deleted_at', null);

  let alertCount = 0;
  if (resultats && absences) {
    const avgMap = {};
    for (const r of resultats) {
      if (!avgMap[r.id_etudiant]) avgMap[r.id_etudiant] = { sum: 0, count: 0 };
      if (r.moyenne != null) { avgMap[r.id_etudiant].sum += parseFloat(r.moyenne); avgMap[r.id_etudiant].count++; }
    }
    const absMap = {};
    for (const a of absences) {
      if (!absMap[a.id_etudiant]) absMap[a.id_etudiant] = { j: 0, i: 0 };
      absMap[a.id_etudiant].j += a.nb_justifiees || 0;
      absMap[a.id_etudiant].i += a.nb_injustifiees || 0;
    }
    for (const [id, avg] of Object.entries(avgMap)) {
      const mean = avg.count > 0 ? avg.sum / avg.count : 20;
      const abs = absMap[id] || { j: 0, i: 0 };
      const total = abs.j + abs.i;
      if (mean < 10 && total > 0 && (abs.i / total) > 0.3) alertCount++;
    }
  }

  const dateStr = new Date().toLocaleDateString('fr-TN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const frontendUrl = process.env.FRONTEND_URL || 'https://dashboard-gi-enib.vercel.app';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
    <div style="background:#0F2D5C;color:#fff;padding:24px 32px;">
      <h1 style="margin:0;font-size:22px;">📊 Rapport Hebdomadaire — Département GI</h1>
      <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">${dateStr}</p>
    </div>
    <div style="padding:24px 32px;">
      <h2 style="color:#0F2D5C;font-size:18px;margin-top:0;">Indicateurs Clés</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;">${alertCount > 0 ? '🔴' : '✅'} Étudiants en alerte académique</td>
          <td style="padding:10px 0;text-align:right;font-weight:bold;color:${alertCount > 0 ? '#dc2626' : '#16a34a'};">${alertCount}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;">${(contratsR.data || 0) > 0 ? '🟠' : '✅'} Contrats expirant &lt;30j</td>
          <td style="padding:10px 0;text-align:right;font-weight:bold;color:${(contratsR.data || 0) > 0 ? '#ea580c' : '#16a34a'};">${contratsR.data || 0}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;">${(controle.data || 0) > 35 ? '🟠' : '✅'} Taux de contrôle</td>
          <td style="padding:10px 0;text-align:right;font-weight:bold;">${controle.data ?? '—'}%</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;">📈 Occupation RH</td>
          <td style="padding:10px 0;text-align:right;font-weight:bold;">${occupationRH.data ?? '—'}%</td>
        </tr>
        <tr>
          <td style="padding:10px 0;">⭐ Satisfaction globale</td>
          <td style="padding:10px 0;text-align:right;font-weight:bold;color:${satisfaction && satisfaction < 3.5 ? '#ea580c' : '#16a34a'};">${satisfaction ?? '—'}/5</td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:28px;">
        <a href="${frontendUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">
          Voir le Tableau de Bord →
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#6b7280;">
      Département Génie Industriel — ENIB • Année universitaire ${annee}
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Dashboard GI ENIB" <${process.env.SMTP_USER}>`,
    to: process.env.CHEF_DEPT_EMAIL,
    subject: `📊 Rapport Hebdomadaire GI — ${dateStr}`,
    html,
  });
}

export default { startWeeklyCron, sendWeeklyReport };
