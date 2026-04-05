import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, Handshake, MapPin, Mic2, FlaskConical, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function Rayonnement() {
  const { data, loading, error } = useKpis('rayonnement');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="glass-panel rounded-2xl p-6 text-rose-400">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard value={k.m5_01_conventions_actives?.value ?? '—'} label="Conventions actives" icon={<Handshake className="h-6 w-6" />} variant="success" />
        <KPICard value={k.m5_02_visites?.value ?? '—'} label="Visites entreprises" icon={<MapPin className="h-6 w-6" />} variant="neutral" />
        <KPICard value={k.m5_04_seminaires?.value ?? '—'} label="Séminaires industriels" icon={<Mic2 className="h-6 w-6" />} variant="neutral" />
        <KPICard value={k.m5_06_unites_expertise?.value ?? '—'} label="Unités d'expertise" icon={<FlaskConical className="h-6 w-6" />} variant="success" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <KPICard value={k.m5_05_score_seminaires?.value != null ? `${k.m5_05_score_seminaires.value}/5` : '—'} label="Score moyen séminaires" icon={<Mic2 className="h-6 w-6" />} variant="neutral" />
        <KPICard value={k.m5_08_conventions_expirant?.value ?? 0} label="Conventions expirant (60j)" icon={<AlertTriangle className="h-6 w-6" />} variant={k.m5_08_conventions_expirant?.value > 0 ? 'warning' : 'success'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Étudiants par visite niveau */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Étudiants aux visites par niveau</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={k.m5_03_etudiants_visites?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="niveau" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="nb_etudiants" radius={[8, 8, 0, 0]} fill="#06b6d4" name="Étudiants" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Participants unités */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Participants cumulés par unité</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={k.m5_07_participants_unites?.chartData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="unite" type="category" stroke="#64748b" fontSize={10} width={140} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="participants" radius={[0, 8, 8, 0]} fill="#8b5cf6" name="Participants" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Séminaires timeline */}
      {k.m5_04_seminaires?.timeline?.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Séminaires récents</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Intitulé</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Organisme</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Durée</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Participants</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Évaluation</th>
                </tr>
              </thead>
              <tbody>
                {k.m5_04_seminaires.timeline.map((s: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{s.intitule}</td>
                    <td className="py-3 px-4 text-slate-300">{s.organisme}</td>
                    <td className="py-3 px-4 text-slate-300">{s.date}</td>
                    <td className="py-3 px-4 text-slate-300">{s.duree}h</td>
                    <td className="py-3 px-4 text-slate-300">{s.participants}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${(s.evaluation || 0) >= 4 ? 'text-emerald-400' : (s.evaluation || 0) >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {s.evaluation ?? '—'}/5
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conventions expirant */}
      {k.m5_08_conventions_expirant?.conventions?.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Conventions expirant sous 60 jours
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Organisme</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Expiration</th>
                </tr>
              </thead>
              <tbody>
                {k.m5_08_conventions_expirant.conventions.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white">{c.nom}</td>
                    <td className="py-3 px-4 text-slate-300">{c.type}</td>
                    <td className="py-3 px-4 text-amber-400 font-semibold">{c.date_expiration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
