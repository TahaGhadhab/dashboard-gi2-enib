import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, Star, BookOpen, Building, Users, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';

export default function Satisfaction() {
  const { data, loading, error } = useKpis('satisfaction');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="glass-panel rounded-2xl p-6 text-rose-400">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard value={k.m4_01_score_global?.value != null ? `${k.m4_01_score_global.value}/5` : '—'} label="Satisfaction Globale" icon={<Star className="h-6 w-6" />} variant="success" />
        <KPICard value={k.m4_02_score_enseignement?.value != null ? `${k.m4_02_score_enseignement.value}/5` : '—'} label="Score Enseignement" icon={<BookOpen className="h-6 w-6" />} variant="neutral" />
        <KPICard value={k.m4_03_score_infra?.value != null ? `${k.m4_03_score_infra.value}/5` : '—'} label="Score Infrastructures" icon={<Building className="h-6 w-6" />} variant="neutral" />
        <KPICard value={k.m4_06_participation?.total_reponses ?? '—'} label="Total réponses" icon={<Users className="h-6 w-6" />} variant="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Score par axe</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={k.m4_01_score_global?.radarData || []}>
              <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
              <PolarAngleAxis dataKey="axis" stroke="currentColor" fontSize={12} className="text-muted-foreground" />
              <PolarRadiusAxis domain={[0, 5]} stroke="currentColor" fontSize={10} className="text-muted-foreground" />
              <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Évolution par semestre */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Évolution satisfaction</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={k.m4_08_evolution?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="semestre" stroke="currentColor" fontSize={12} className="text-muted-foreground" />
              <YAxis stroke="currentColor" fontSize={12} domain={[0, 5]} className="text-muted-foreground" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6' }} name="Score /5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score enseignement par classe */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Score enseignement par classe</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={k.m4_02_score_enseignement?.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="name" stroke="currentColor" fontSize={12} className="text-muted-foreground" />
            <YAxis stroke="currentColor" fontSize={12} domain={[0, 5]} className="text-muted-foreground" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#3b82f6" name="Score /5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top / Flop matières */}
      {k.m4_07_top_flop && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><ThumbsUp className="h-5 w-5 text-emerald-400" /> Top 3 matières</h3>
            <div className="space-y-3">
              {(k.m4_07_top_flop.top3 || []).map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <div>
                    <p className="text-foreground font-semibold">{m.matiere}</p>
                    <p className="text-xs text-muted-foreground">{m.nb_votes} votes</p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-400">{m.score}/5</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><ThumbsDown className="h-5 w-5 text-rose-400" /> Flop 3 matières</h3>
            <div className="space-y-3">
              {(k.m4_07_top_flop.flop3 || []).map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
                  <div>
                    <p className="text-foreground font-semibold">{m.matiere}</p>
                    <p className="text-xs text-muted-foreground">{m.nb_votes} votes</p>
                  </div>
                  <span className="text-2xl font-bold text-rose-400">{m.score}/5</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
