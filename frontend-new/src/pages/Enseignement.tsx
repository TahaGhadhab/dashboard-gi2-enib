import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, CheckCircle2, RefreshCcw, Users, AlertTriangle, FlaskConical } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Enseignement() {
  const { data, loading, error } = useKpis('enseignement');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="glass-panel rounded-2xl p-6 text-rose-400">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard value={`${k.m1_01_reussite_principale?.value ?? '—'}%`} label="Réussite S. Principale" icon={<CheckCircle2 className="h-6 w-6" />} variant="success" />
        <KPICard value={`${k.m1_02_reussite_rattrapage?.value ?? '—'}%`} label="Réussite Rattrapage" icon={<RefreshCcw className="h-6 w-6" />} variant="warning" />
        <KPICard value={`${k.m1_04_assiduite?.value ?? '—'}%`} label="Assiduité Globale" icon={<Users className="h-6 w-6" />} variant="neutral" />
        <KPICard value={`${k.m1_08_tp_disponibles?.value ?? '—'}%`} label="TP Disponibles" icon={<FlaskConical className="h-6 w-6" />} variant="success" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réussite par promo */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Réussite par promotion</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={k.m1_01_reussite_principale?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="promo" stroke="currentColor" fontSize={12} className="text-muted-foreground" />
              <YAxis stroke="currentColor" fontSize={12} domain={[0, 100]} className="text-muted-foreground" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="taux" radius={[8, 8, 0, 0]} name="Taux (%)">
                {(k.m1_01_reussite_principale?.chartData || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Assiduité mensuelle */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Assiduité mensuelle</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={k.m1_04_assiduite?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="mois" stroke="currentColor" fontSize={11} className="text-muted-foreground" />
              <YAxis stroke="currentColor" fontSize={12} domain={[0, 100]} className="text-muted-foreground" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="taux" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} name="Assiduité (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Couverture des cours */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Couverture des cours par module</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={k.m1_05_couverture?.chartData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} />
              <YAxis dataKey="module" type="category" stroke="#64748b" fontSize={10} width={120} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="taux" radius={[0, 8, 8, 0]} fill="#06b6d4" name="Couverture (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Taux contrôle par semestre */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Taux de contrôle par semestre</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={k.m1_03_taux_controle?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="semestre" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="taux" radius={[8, 8, 0, 0]} fill="#f59e0b" name="Taux contrôle (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Étudiants en alerte */}
      {k.m1_07_etudiants_alerte?.students?.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            Étudiants en alerte ({k.m1_07_etudiants_alerte.value})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nom</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Classe</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Moyenne</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">% Injustifiées</th>
                </tr>
              </thead>
              <tbody>
                {k.m1_07_etudiants_alerte.students.map((s: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">{s.prenom} {s.nom}</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.classe}</td>
                    <td className="py-3 px-4"><span className="text-rose-500 font-bold">{s.moyenne}</span></td>
                    <td className="py-3 px-4"><span className="text-amber-600 dark:text-amber-400 font-bold">{s.pct_injustifiees}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Validation Modules */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Taux de validation par module</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={k.m1_09_validation_modules?.chartData || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} />
            <YAxis dataKey="module" type="category" stroke="#64748b" fontSize={10} width={120} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
            <Bar dataKey="taux" radius={[0, 8, 8, 0]} fill="#10b981" name="Validation (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
