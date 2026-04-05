import { useKpis } from '@/hooks/useKpis';
import { KPICard } from '@/components/KPICard';
import { Loader2, Briefcase, TrendingUp, Building2, GraduationCap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';


export default function Encadrement() {
  const { data, loading, error } = useKpis('encadrement');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="glass-panel rounded-2xl p-6 text-rose-400">Erreur: {error}</div>;

  const k = data?.kpis || {};

  return (
    <div className="space-y-8 max-w-7xl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard value={k.m3_02_note_pfe?.value != null ? `${k.m3_02_note_pfe.value}/20` : '—'} label="Note moyenne PFE" icon={<GraduationCap className="h-6 w-6" />} variant="success" />
        <KPICard value={k.m3_03_note_pjm?.value != null ? `${k.m3_03_note_pjm.value}/20` : '—'} label="Note moyenne PJM" icon={<Briefcase className="h-6 w-6" />} variant="neutral" />
        <KPICard value={k.m3_05_emploi_pfe?.value != null ? `${k.m3_05_emploi_pfe.value}%` : '—'} label="Emploi post-PFE" icon={<TrendingUp className="h-6 w-6" />} variant="success" />
        <KPICard value={k.m3_07_entreprises_actives?.value ?? '—'} label="Entreprises partenaires" icon={<Building2 className="h-6 w-6" />} variant="neutral" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projets par encadrant */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Projets par encadrant</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={(k.m3_01_projets_encadrant?.chartData || []).slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="encadrant" type="category" stroke="#64748b" fontSize={10} width={130} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="pfe" stackId="a" fill="#3b82f6" name="PFE" />
              <Bar dataKey="pjm" stackId="a" fill="#8b5cf6" name="PJM" />
              <Bar dataKey="amp" stackId="a" fill="#06b6d4" name="AMP" radius={[0, 8, 8, 0]} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Emploi post-PFE Pie */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Emploi post-PFE</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={k.m3_05_emploi_pfe?.chartData || []}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={110}
                dataKey="value" nameKey="name"
                stroke="none" paddingAngle={4}
              >
                {(k.m3_05_emploi_pfe?.chartData || []).map((_: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? '#10b981' : '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Note PFE par encadrant */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Note PFE moyenne par encadrant</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={k.m3_02_note_pfe?.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="encadrant" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" height={60} />
            <YAxis stroke="#64748b" fontSize={12} domain={[0, 20]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
            <Bar dataKey="moyenne" radius={[8, 8, 0, 0]} fill="#10b981" name="Moyenne /20" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pré-embauche par industrie */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Pré-embauche par secteur industriel</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={k.m3_06_preembauche_industrie?.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="secteur" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
            <Bar dataKey="taux" radius={[8, 8, 0, 0]} fill="#f59e0b" name="Taux embauche (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
