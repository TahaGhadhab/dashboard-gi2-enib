import { KPICard } from '@/components/KPICard';
import { useKpis } from '@/hooks/useKpis';
import {
  CheckCircle2, RefreshCcw, Users, Briefcase,
  Star, AlertTriangle, Award, FileWarning, Handshake, TrendingUp,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { data, loading, error } = useKpis('dashboard');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="glass-panel rounded-2xl p-6 text-rose-400">Erreur: {error}</div>
  );

  const k = data?.kpis || {};
  const alerts = data?.alerts || [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 rounded-2xl p-4 border transition-colors ${
              a.level === 'red' 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}>
              <span className="text-lg">{a.icon}</span>
              <span className="text-sm font-semibold">{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <KPICard
          value={k.taux_reussite_principale != null ? `${k.taux_reussite_principale}%` : '—'}
          label="Taux réussite S. Principale"
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="success"
        />
        <KPICard
          value={k.taux_controle != null ? `${k.taux_controle}%` : '—'}
          label="Taux rattrapage"
          icon={<RefreshCcw className="h-6 w-6" />}
          variant="warning"
          reverseTrend
        />
        <KPICard
          value={k.taux_assiduite != null ? `${k.taux_assiduite}%` : '—'}
          label="Assiduité étudiants"
          icon={<Users className="h-6 w-6" />}
          variant="neutral"
        />
        <KPICard
          value={k.taux_occupation_rh != null ? `${k.taux_occupation_rh}%` : '—'}
          label="Occupation enseignants"
          icon={<Briefcase className="h-6 w-6" />}
          variant="warning"
        />
        <KPICard
          value={k.score_satisfaction != null ? `${k.score_satisfaction}/5` : '—'}
          label="Satisfaction Globale"
          icon={<Star className="h-6 w-6" />}
          variant="neutral"
        />
        <KPICard
          value={data?.etudiants_alertes ?? '—'}
          label="Étudiants en alerte"
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
          reverseTrend
        />
        <KPICard
          value={k.taux_double_diplome != null ? `${k.taux_double_diplome}%` : '—'}
          label="Double diplôme M2"
          icon={<Award className="h-6 w-6" />}
          variant="success"
        />
        <KPICard
          value={k.taux_emploi_pfe != null ? `${k.taux_emploi_pfe}%` : '—'}
          label="Emploi post-PFE"
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        <KPICard
          value={k.conventions_actives ?? '—'}
          label="Conventions actives"
          icon={<Handshake className="h-6 w-6" />}
          variant="neutral"
        />
        <KPICard
          value={k.modules_non_couverts ?? 0}
          label="Modules non couverts"
          icon={<FileWarning className="h-6 w-6" />}
          variant={k.modules_non_couverts > 0 ? 'warning' : 'success'}
          reverseTrend
        />
      </div>
    </div>
  );
}
