import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, Users, Briefcase, FileWarning, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, RECHARTS_CURSOR_STYLE } from '@/constants/theme';
import { cn } from '@/lib/utils';

export default function RH() {
  const { data, loading, error } = useKpis('rh');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent-blue" /></div>;
  if (error) return <div className="glass-panel rounded-xl p-6 text-accent-red font-bold">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl px-4 md:px-10 pb-10">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard index={1} value={`${k.m2_01_occupation?.value ?? '—'}%`} label="Occupation Permanents" icon={<Briefcase className="h-5 w-5" />} variant="neutral" />
        <KPICard index={2} value={`${k.m2_02_ratio_perm_vac?.value ?? '—'}%`} label="Ratio Permanents" icon={<Users className="h-5 w-5" />} variant="success" />
        <KPICard index={3} value={k.m2_04_modules_non_couverts?.value ?? 0} label="Modules non couverts" icon={<FileWarning className="h-5 w-5" />} variant={k.m2_04_modules_non_couverts?.value > 0 ? 'warning' : 'success'} />
        <KPICard index={4} value={k.m2_06_contrats_renouveler?.value ?? 0} label="Contrats à renouveler" icon={<AlertTriangle className="h-5 w-5" />} variant={k.m2_06_contrats_renouveler?.value > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupation per Teacher */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Occupation par Enseignant</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={k.m2_01_occupation?.chartData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 150]} />
              <YAxis dataKey="enseignant" type="category" stroke="var(--text-muted)" fontSize={10} width={130} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="taux" radius={[0, 4, 4, 0]} style={RECHARTS_CURSOR_STYLE}>
                {(k.m2_01_occupation?.chartData || []).map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.taux > 120 ? 'var(--accent-red)' : entry.taux > 100 ? 'var(--accent-amber)' : 'var(--accent-blue)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ratio Pie Chart */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Répartition Staff</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={k.m2_02_ratio_perm_vac?.chartData || []}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                stroke="none"
                style={RECHARTS_CURSOR_STYLE}
              >
                {(k.m2_02_ratio_perm_vac?.chartData || []).map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend verticalAlign="bottom" align="center" formatter={(v) => <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contracts Table */}
      {k.m2_06_contrats_renouveler?.contrats?.length > 0 && (
        <div className="glass-panel rounded-xl p-6 border-l-4 border-accent-amber animate-[borderPulseAmber_3s_infinite]">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent-amber" />
            Contrats arrivant à échéance (30 jours)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Enseignant</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Type</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Échéance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {k.m2_06_contrats_renouveler.contrats.map((c: any, i: number) => (
                  <tr key={i} className="group hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-4 px-4 text-sm font-bold text-primary-text">{c.nom}</td>
                    <td className="py-4 px-4 text-sm font-medium text-secondary-text">{c.type_contrat}</td>
                    <td className="py-4 px-4 text-sm font-mono font-bold text-accent-amber">{c.date_expiration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charge moyenne par promo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <KPICard index={5} value={`${k.m2_07_charge_moyenne?.value ?? '—'}h`} label="Charge Moyenne" icon={<Clock className="h-5 w-5" />} variant="neutral" />
        <KPICard index={6} value={k.m2_08_surcharge?.value ?? 0} label="Enseignants en Surcharge" icon={<AlertTriangle className="h-5 w-5" />} variant={k.m2_08_surcharge?.value > 0 ? 'danger' : 'success'} />
        <KPICard index={7} value={`${k.m2_05_execution_vacataires?.value ?? '—'}%`} label="Exécution Vacataires" icon={<UserCheck className="h-5 w-5" />} variant="neutral" />
      </div>
    </div>
  );
}
