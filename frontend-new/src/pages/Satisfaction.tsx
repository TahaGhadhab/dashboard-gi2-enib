import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, Star, BookOpen, Building, Users, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, RECHARTS_CURSOR_STYLE } from '@/constants/theme';
import { cn } from '@/lib/utils';

export default function Satisfaction() {
  const { data, loading, error } = useKpis('satisfaction');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent-blue" /></div>;
  if (error) return <div className="glass-panel rounded-xl p-6 text-accent-red font-bold">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl px-4 md:px-10 pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard index={1} value={k.m4_01_score_global?.value != null ? `${k.m4_01_score_global.value}/5` : '—'} label="Satisfaction Globale" icon={<Star className="h-5 w-5" />} variant="success" />
        <KPICard index={2} value={k.m4_02_score_enseignement?.value != null ? `${k.m4_02_score_enseignement.value}/5` : '—'} label="Score Enseignement" icon={<BookOpen className="h-5 w-5" />} variant="neutral" />
        <KPICard index={3} value={k.m4_03_score_infra?.value != null ? `${k.m4_03_score_infra.value}/5` : '—'} label="Score Infrastructures" icon={<Building className="h-5 w-5" />} variant="neutral" />
        <KPICard index={4} value={k.m4_06_participation?.total_reponses ?? '—'} label="Panel Réponses" icon={<Users className="h-5 w-5" />} variant="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Score par Axe</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={k.m4_01_score_global?.radarData || []}>
              <PolarGrid stroke="var(--border-subtle)" />
              <PolarAngleAxis dataKey="axis" stroke="var(--text-muted)" fontSize={11} />
              <PolarRadiusAxis domain={[0, 5]} stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
              <Radar name="Score" dataKey="score" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.4} strokeWidth={2} style={RECHARTS_CURSOR_STYLE} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolution Line Chart */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6">Évolution Satisfaction</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={k.m4_08_evolution?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="semestre" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 5]} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="score" stroke="var(--accent-purple)" strokeWidth={3} dot={{ r: 6, fill: 'var(--accent-purple)', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} name="Score /5" style={RECHARTS_CURSOR_STYLE} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top / Flop sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 border-l-4 border-accent-teal">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-accent-teal" />
            Top 3 Matières
          </h3>
          <div className="space-y-4">
            {(k.m4_07_top_flop?.top3 || []).map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-accent-teal/5 border border-accent-teal/10 hover:bg-accent-teal/10 transition-all">
                <div>
                  <p className="text-sm font-bold text-primary-text">{m.matiere}</p>
                  <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest mt-0.5">{m.nb_votes} votes</p>
                </div>
                <span className="text-2xl font-mono font-bold text-accent-teal">{m.score}/5</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 border-l-4 border-accent-red animate-[borderPulseRed_2s_infinite]">
          <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <ThumbsDown className="h-4 w-4 text-accent-red" />
            Points d'Exigence
          </h3>
          <div className="space-y-4">
            {(k.m4_07_top_flop?.flop3 || []).map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-accent-red/5 border border-accent-red/10 hover:bg-accent-red/10 transition-all">
                <div>
                  <p className="text-sm font-bold text-primary-text">{m.matiere}</p>
                  <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest mt-0.5">{m.nb_votes} votes</p>
                </div>
                <span className="text-2xl font-mono font-bold text-accent-red">{m.score}/5</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
