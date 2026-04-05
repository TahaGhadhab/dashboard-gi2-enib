import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, Users, Briefcase, AlertTriangle, FileWarning, Clock, UserCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function RH() {
  const { data, loading, error } = useKpis('rh');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="glass-panel rounded-2xl p-6 text-rose-400">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard value={`${k.m2_01_occupation?.value ?? '—'}%`} label="Occupation Permanents" icon={<Briefcase className="h-6 w-6" />} variant="neutral" />
        <KPICard value={`${k.m2_02_ratio_perm_vac?.value ?? '—'}%`} label="Ratio Permanents" icon={<Users className="h-6 w-6" />} variant="success" />
        <KPICard value={k.m2_04_modules_non_couverts?.value ?? 0} label="Modules non couverts" icon={<FileWarning className="h-6 w-6" />} variant={k.m2_04_modules_non_couverts?.value > 0 ? 'warning' : 'success'} />
        <KPICard value={k.m2_06_contrats_renouveler?.value ?? 0} label="Contrats à renouveler" icon={<AlertTriangle className="h-6 w-6" />} variant={k.m2_06_contrats_renouveler?.value > 0 ? 'warning' : 'success'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <KPICard value={`${k.m2_07_charge_moyenne?.value ?? '—'}h`} label="Charge moyenne / enseignant" icon={<Clock className="h-6 w-6" />} variant="neutral" />
        <KPICard value={k.m2_08_surcharge?.value ?? 0} label="Enseignants en surcharge" icon={<AlertTriangle className="h-6 w-6" />} variant={k.m2_08_surcharge?.value > 0 ? 'warning' : 'success'} />
        <KPICard value={`${k.m2_05_execution_vacataires?.value ?? '—'}%`} label="Exécution vacataires" icon={<UserCheck className="h-6 w-6" />} variant="neutral" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupation par enseignant */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Taux d'occupation par enseignant</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={k.m2_01_occupation?.chartData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 150]} />
              <YAxis dataKey="enseignant" type="category" stroke="#64748b" fontSize={10} width={130} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="taux" radius={[0, 8, 8, 0]} name="Occupation (%)">
                {(k.m2_01_occupation?.chartData || []).map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.taux > 120 ? '#ef4444' : entry.taux > 100 ? '#f59e0b' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ratio Permanents / Vacataires */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Répartition Permanents / Vacataires</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={k.m2_02_ratio_perm_vac?.chartData || []}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={110}
                dataKey="value" nameKey="name"
                stroke="none" paddingAngle={4}
              >
                {(k.m2_02_ratio_perm_vac?.chartData || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contrats à renouveler */}
      {k.m2_06_contrats_renouveler?.contrats?.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Contrats expirant sous 30 jours
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Nom</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Expiration</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {k.m2_06_contrats_renouveler.contrats.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white">{c.nom}</td>
                    <td className="py-3 px-4 text-slate-300">{c.type_contrat}</td>
                    <td className="py-3 px-4 text-amber-400 font-semibold">{c.date_expiration}</td>
                    <td className="py-3 px-4 text-slate-300">{c.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charge par enseignant */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Charge horaire par enseignant</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={k.m2_07_charge_moyenne?.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="enseignant" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
            <Bar dataKey="heures" radius={[8, 8, 0, 0]} fill="#8b5cf6" name="Heures" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
