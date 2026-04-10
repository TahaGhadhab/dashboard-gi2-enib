import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, Handshake, MapPin, Mic2, FlaskConical, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, RECHARTS_CURSOR_STYLE } from '@/constants/theme';
import { cn } from '@/lib/utils';

export default function Rayonnement() {
  const { data, loading, error } = useKpis('rayonnement');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent-blue" /></div>;
  if (error) return <div className="glass-panel rounded-xl p-6 text-accent-red font-bold">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl px-4 md:px-10 pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard index={1} value={k.m5_01_conventions_actives?.value ?? '—'} label="Conventions Actives" icon={<Handshake className="h-5 w-5" />} variant="success" />
        <KPICard index={2} value={k.m5_02_visites?.value ?? '—'} label="Visites Entreprises" icon={<MapPin className="h-5 w-5" />} variant="neutral" />
        <KPICard index={3} value={k.m5_04_seminaires?.value ?? '—'} label="Séminaires Pro" icon={<Mic2 className="h-5 w-5" />} variant="neutral" />
        <KPICard index={4} value={k.m5_06_unites_expertise?.value ?? '—'} label="Unités d'Expertise" icon={<FlaskConical className="h-5 w-5" />} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Étudiants par visite */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Étudiants aux Visites</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={k.m5_03_etudiants_visites?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="niveau" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="nb_etudiants" name="Étudiants" radius={[4, 4, 0, 0]} style={RECHARTS_CURSOR_STYLE}>
                {(k.m5_03_etudiants_visites?.chartData || []).map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Participants par unité */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Impact des Unités</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={k.m5_07_participants_unites?.chartData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="unite" type="category" stroke="var(--text-muted)" fontSize={10} width={140} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="participants" name="Participants" radius={[0, 4, 4, 0]} fill="var(--accent-teal)" style={RECHARTS_CURSOR_STYLE} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conventions table */}
      {k.m5_08_conventions_expirant?.conventions?.length > 0 && (
        <div className="glass-panel rounded-xl p-6 border-l-4 border-accent-amber animate-[borderPulseAmber_3s_infinite]">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent-amber" />
            Conventions expirant sous 60 jours
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Partenaire</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Type</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-text">Échéance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {k.m5_08_conventions_expirant.conventions.map((c: any, i: number) => (
                  <tr key={i} className="group hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-4 px-4 text-sm font-bold text-primary-text">{c.nom}</td>
                    <td className="py-4 px-4 text-sm font-medium text-secondary-text">{c.type}</td>
                    <td className="py-4 px-4 text-sm font-mono font-bold text-accent-amber">{c.date_expiration}</td>
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
