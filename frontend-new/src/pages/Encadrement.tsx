import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, Briefcase, Users, FileWarning, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, RECHARTS_CURSOR_STYLE } from '@/constants/theme';

export default function Encadrement() {
  const { data, loading, error } = useKpis('encadrement');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent-blue" /></div>;
  if (error) return <div className="glass-panel rounded-xl p-6 text-accent-red font-bold">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl px-4 md:px-10 pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard index={1} value={k.m3_01_total_pfe?.value ?? '—'} label="Total PFE" icon={<Briefcase className="h-5 w-5" />} variant="neutral" />
        <KPICard index={2} value={k.m3_02_total_pjm?.value ?? '—'} label="Total PJM" icon={<Users className="h-5 w-5" />} variant="neutral" />
        <KPICard index={3} value={k.m3_03_total_amp?.value ?? '—'} label="Total AMP" icon={<TrendingUp className="h-5 w-5" />} variant="success" />
        <KPICard index={4} value={k.m3_04_en_retard?.value ?? 0} label="Retard Rapports" icon={<FileWarning className="h-5 w-5" />} variant={k.m3_04_en_retard?.value > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Encadrement par type */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Répartition par Type</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={k.m3_05_repartition_type?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Nombre" radius={[4, 4, 0, 0]} style={RECHARTS_CURSOR_STYLE}>
                {(k.m3_05_repartition_type?.chartData || []).map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Charge par encadrant */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Volume par Encadrant</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={k.m3_06_volume_encadrant?.chartData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="nom" type="category" stroke="var(--text-muted)" fontSize={10} width={120} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="var(--accent-blue)" style={RECHARTS_CURSOR_STYLE} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6 flex items-center gap-2">
           <FileWarning className="h-4 w-4 text-accent-red" />
           PFE sans rapport déposé
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Étudiant</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Entreprise</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Encadrant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {(k.m3_04_en_retard?.details || []).map((pfe: any, i: number) => (
                <tr key={i} className="group hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="py-4 px-4 text-sm font-bold text-primary-text">{pfe.etudiant}</td>
                  <td className="py-4 px-4 text-sm font-medium text-secondary-text">{pfe.entreprise}</td>
                  <td className="py-4 px-4 text-sm font-bold text-accent-blue">{pfe.encadrant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
