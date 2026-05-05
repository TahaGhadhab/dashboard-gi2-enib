import { useState } from 'react';
import { KPICard } from '@/components/KPICard';
import { BriefingBanner } from '@/components/BriefingBanner';
import { StudentSlideOver } from '@/components/StudentSlideOver';
import { useKpis } from '@/hooks/useKpis';
import {
  CheckCircle2, RefreshCcw, Users, Briefcase,
  Star, AlertTriangle, Award, Handshake, TrendingUp,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { data, loading, error } = useKpis('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
    </div>
  );

  if (error) return (
    <div className="glass-panel rounded-xl p-6 text-accent-red border-accent-red/20 bg-accent-red/5 font-bold">
      Erreur de chargement: {error}
    </div>
  );

  const k = data?.kpis || {};
  const alerts = data?.alerts || [];
  // Alert students come from the backend (service key, bypasses RLS)
  const alertStudents = (data?.alert_students || []).map((s: any) => ({
    ...s,
    double_diplome: false,
    statut: 'alerte' as const,
  }));

  return (
    <div className="space-y-4 max-w-7xl px-4 md:px-10 pb-10">
      {/* Morning Briefing Banner */}
      <BriefingBanner alerts={alerts} />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <KPICard
          index={1}
          value={k.taux_reussite_principale != null ? `${k.taux_reussite_principale}%` : '—'}
          label="Réussite S. Principale"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          index={2}
          value={k.taux_controle != null ? `${k.taux_controle}%` : '—'}
          label="Taux de Rattrapage"
          icon={<RefreshCcw className="h-5 w-5" />}
          variant="warning"
          reverseTrend
        />
        <KPICard
          index={3}
          value={k.taux_assiduite != null ? `${k.taux_assiduite}%` : '—'}
          label="Taux d'Assiduité"
          icon={<Users className="h-5 w-5" />}
          variant="neutral"
        />
        <KPICard
          index={4}
          value={k.taux_occupation_rh != null ? `${k.taux_occupation_rh}%` : '—'}
          label="Occupation Enseignements"
          icon={<Briefcase className="h-5 w-5" />}
          variant="warning"
        />
        <KPICard
          index={5}
          value={k.score_satisfaction != null ? `${k.score_satisfaction}/5` : '—'}
          label="Satisfaction Étudiante"
          icon={<Star className="h-5 w-5" />}
          variant="neutral"
        />
        <div
          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] rounded-xl"
          role="button"
          tabIndex={0}
          aria-label="Voir les étudiants en alerte"
          onClick={() => setSelectedStudentId('__list__')}
          onKeyDown={(e) => e.key === 'Enter' && setSelectedStudentId('__list__')}
        >
          <KPICard
            index={6}
            value={data?.etudiants_alertes ?? '—'}
            label="Étudiants en Alerte"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="danger"
            reverseTrend
          />
        </div>
        <KPICard
          index={7}
          value={k.taux_double_diplome != null ? `${k.taux_double_diplome}%` : '—'}
          label="Double Diplôme"
          icon={<Award className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          index={8}
          value={k.taux_emploi_pfe != null ? `${k.taux_emploi_pfe}%` : '—'}
          label="Insertion Post-PFE"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          index={9}
          value={k.conventions_actives ?? '—'}
          label="Conventions Actives"
          icon={<Handshake className="h-5 w-5" />}
          variant="neutral"
        />
      </div>

      {/* StudentSlideOver — ouvert depuis la carte Étudiants en Alerte */}
      <StudentSlideOver
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        alertStudents={alertStudents}
      />
    </div>
  );
}

