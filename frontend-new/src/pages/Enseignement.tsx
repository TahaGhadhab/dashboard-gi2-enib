import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, CheckCircle2, RefreshCcw, Users, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, RECHARTS_CURSOR_STYLE } from '@/constants/theme';

export default function Enseignement() {
  const { data, loading, error } = useKpis('enseignement');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent-blue" /></div>;
  if (error) return <div className="glass-panel rounded-xl p-6 text-accent-red font-bold">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl px-4 md:px-10 pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard index={1} value={`${k.m1_01_reussite_principale?.value ?? '—'}%`} label="Réussite S. Principale" icon={<CheckCircle2 className="h-5 w-5" />} variant="success" />
        <KPICard index={2} value={`${k.m1_02_reussite_totale?.value ?? '—'}%`} label="Réussite Totale" icon={<CheckCircle2 className="h-5 w-5" />} variant="success" />
        <KPICard index={3} value={`${k.m1_04_taux_controle?.value ?? '—'}%`} label="Taux de Rattrapage" icon={<RefreshCcw className="h-5 w-5" />} variant="warning" reverseTrend />
        <KPICard index={4} value={`${k.m1_05_assiduite_global?.value ?? '—'}%`} label="Assiduité Globale" icon={<Users className="h-5 w-5" />} variant="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taux de réussite par promotion */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Réussite par Promotion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={k.m1_01_reussite_principale?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="niveau" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
              <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="taux" radius={[4, 4, 0, 0]} style={RECHARTS_CURSOR_STYLE}>
                {(k.m1_01_reussite_principale?.chartData || []).map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Moyenne par promo */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Moyennes Générales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={k.m1_03_moyenne_promo?.chartData || []}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                stroke="none"
                style={RECHARTS_CURSOR_STYLE}
              >
                {(k.m1_03_moyenne_promo?.chartData || []).map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-xs font-bold text-secondary-text uppercase tracking-wider">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Remplissage de notes table */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6 flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent-blue" />
          État du remplissage des notes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Matière / Élément</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Notes Saisies</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {(k.m1_07_remplissage_notes?.details || []).map((m: any, i: number) => (
                <tr key={i} className="group hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="py-4 px-4 text-sm font-bold text-primary-text">{m.matiere}</td>
                  <td className="py-4 px-4 text-sm font-mono text-secondary-text">{m.saisies}/{m.total}</td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      m.complet ? "bg-accent-teal/10 text-accent-teal" : "bg-accent-amber/10 text-accent-amber"
                    )}>
                      {m.complet ? 'Complet' : 'Incomplet'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
