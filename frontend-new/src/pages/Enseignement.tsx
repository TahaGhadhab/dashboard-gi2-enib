import { useState, useMemo } from 'react';
import { useKpis } from '@/hooks/useKpis';
import { useStudentAccess } from '@/hooks/useStudentAccess';
import { useFilters } from '@/context/FilterContext';
import { KPICard } from '@/components/KPICard';
import { StudentSlideOver } from '@/components/StudentSlideOver';
import { Loader2, CheckCircle2, RefreshCcw, Users, Clock, Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, RECHARTS_CURSOR_STYLE } from '@/constants/theme';
import { cn } from '@/lib/utils';
import type { StudentLevel, StudentStatus, StudentSummary } from '@/types/student';

// ─── Helpers tableau ────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<StudentLevel, string> = {
  '1ere': '1ère année',
  '2eme': '2ème année',
  '3eme': '3ème année',
};

const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; bg: string }> = {
  alerte:    { label: 'Alerte',    color: 'var(--kpi-danger)',  bg: 'rgba(240,68,56,0.12)' },
  normal:    { label: 'Normal',    color: 'var(--kpi-ok)',      bg: 'rgba(15,204,176,0.12)' },
  excellent: { label: 'Excellent', color: 'var(--accent-purple)', bg: 'rgba(167,139,250,0.12)' },
};

const PAGE_SIZE = 20;

type SortKey = 'nom' | 'niveau' | 'moyenne' | 'taux_assiduite' | 'statut';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-[var(--text-muted)]" />;
  return dir === 'asc'
    ? <ChevronUp className="h-3 w-3 text-[var(--accent-blue)]" />
    : <ChevronDown className="h-3 w-3 text-[var(--accent-blue)]" />;
}

function getInitialsColor(id: string): string {
  const colors = ['var(--accent-blue)', 'var(--accent-teal)', 'var(--accent-purple)', 'var(--accent-cyan)'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Sous-composant : tableau étudiants ─────────────────────────────────────

function StudentsTable() {
  const { anneeUniv, promo } = useFilters();
  const { students, role, loading, error } = useStudentAccess(anneeUniv, promo);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<StudentLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StudentStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('statut');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const statusOrder: Record<StudentStatus, number> = { alerte: 0, normal: 1, excellent: 2 };
    return students
      .filter((s) => {
        const matchSearch = `${s.nom} ${s.prenom}`.toLowerCase().includes(search.toLowerCase());
        const matchLevel = filterLevel === 'all' || s.niveau === filterLevel;
        const matchStatus = filterStatus === 'all' || s.statut === filterStatus;
        return matchSearch && matchLevel && matchStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'nom') cmp = `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
        else if (sortKey === 'niveau') cmp = a.niveau.localeCompare(b.niveau);
        else if (sortKey === 'moyenne') cmp = (a.moyenne ?? -1) - (b.moyenne ?? -1);
        else if (sortKey === 'taux_assiduite') cmp = (a.taux_assiduite ?? 100) - (b.taux_assiduite ?? 100);
        else if (sortKey === 'statut') cmp = statusOrder[a.statut] - statusOrder[b.statut];
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [students, search, filterLevel, filterStatus, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const thClass = "py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] select-none";

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-blue)]" />
    </div>
  );

  if (error) return (
    <div className="rounded-xl p-4 border border-[var(--kpi-danger)]/20 bg-[var(--kpi-danger)]/5 text-[var(--kpi-danger)] text-sm font-bold">
      Données non disponibles
    </div>
  );

  if (!students.length) return (
    <div className="rounded-xl border border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-muted)]">
      Aucun étudiant accessible avec votre compte.
    </div>
  );

  return (
    <>
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
          />
        </div>

        {/* Filtre niveau */}
        <select
          value={filterLevel}
          onChange={(e) => { setFilterLevel(e.target.value as StudentLevel | 'all'); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40"
        >
          <option value="all">Tous les niveaux</option>
          <option value="1ere">1ère année</option>
          <option value="2eme">2ème année</option>
          <option value="3eme">3ème année</option>
        </select>

        {/* Filtre statut — chef_dept uniquement */}
        {role === 'chef_dept' && (
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as StudentStatus | 'all'); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40"
          >
            <option value="all">Tous les statuts</option>
            <option value="alerte">En alerte</option>
            <option value="normal">Normal</option>
            <option value="excellent">Excellent</option>
          </select>
        )}

        <span className="text-xs text-[var(--text-muted)] ml-auto">
          {filtered.length} étudiant{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <th className={thClass}>Nom</th>
              <th
                className={cn(thClass, "cursor-pointer hover:text-[var(--text-primary)] transition-colors")}
                onClick={() => toggleSort('niveau')}
              >
                <span className="flex items-center gap-1">Niveau <SortIcon active={sortKey === 'niveau'} dir={sortDir} /></span>
              </th>
              <th
                className={cn(thClass, "cursor-pointer hover:text-[var(--text-primary)] transition-colors")}
                onClick={() => toggleSort('moyenne')}
              >
                <span className="flex items-center gap-1">
                  Moyenne{role === 'permanent' && <span className="font-normal text-[var(--text-muted)] ml-1">(part.)</span>}
                  <SortIcon active={sortKey === 'moyenne'} dir={sortDir} />
                </span>
              </th>
              <th
                className={cn(thClass, "cursor-pointer hover:text-[var(--text-primary)] transition-colors")}
                onClick={() => toggleSort('taux_assiduite')}
              >
                <span className="flex items-center gap-1">Assiduité <SortIcon active={sortKey === 'taux_assiduite'} dir={sortDir} /></span>
              </th>
              <th
                className={cn(thClass, "cursor-pointer hover:text-[var(--text-primary)] transition-colors")}
                onClick={() => toggleSort('statut')}
              >
                <span className="flex items-center gap-1">Statut <SortIcon active={sortKey === 'statut'} dir={sortDir} /></span>
              </th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {paginated.map((s: StudentSummary) => (
              <tr
                key={s.id_etudiant}
                className="group hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                onClick={() => setSelectedId(String(s.id_etudiant))}
              >
                {/* Avatar + nom */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: getInitialsColor(String(s.id_etudiant)) }}
                    >
                      {s.nom[0]?.toUpperCase()}{s.prenom[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{s.prenom} {s.nom}</p>
                      {s.classe && (
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">{s.classe}</p>
                      )}
                    </div>
                  </div>
                </td>
                {/* Niveau */}
                <td className="py-3.5 px-4 text-sm text-[var(--text-secondary)]">
                  {LEVEL_LABELS[s.niveau] ?? s.niveau}
                </td>
                {/* Moyenne */}
                <td className="py-3.5 px-4">
                  {s.moyenne !== undefined ? (
                    <span
                      className="text-sm font-mono font-bold"
                      style={{
                        color: s.moyenne < 10 ? 'var(--kpi-danger)' : s.moyenne >= 14 ? 'var(--kpi-ok)' : 'var(--kpi-warning)',
                      }}
                    >
                      {s.moyenne.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)] italic">
                      {s.nb_matieres_accessibles !== undefined ? `${s.nb_matieres_accessibles} mat.` : '—'}
                    </span>
                  )}
                </td>
                {/* Assiduité */}
                <td className="py-3.5 px-4">
                  {s.taux_assiduite !== undefined ? (
                    <span
                      className="text-sm font-mono font-bold"
                      style={{
                        color: s.taux_assiduite >= 80 ? 'var(--kpi-ok)' : s.taux_assiduite >= 60 ? 'var(--kpi-warning)' : 'var(--kpi-danger)',
                      }}
                    >
                      {s.taux_assiduite}%
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  )}
                </td>
                {/* Statut */}
                <td className="py-3.5 px-4">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: STATUS_CONFIG[s.statut].color,
                      background: STATUS_CONFIG[s.statut].bg,
                    }}
                  >
                    {STATUS_CONFIG[s.statut].label}
                  </span>
                </td>
                {/* Flèche */}
                <td className="py-3.5 px-4 text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-[var(--text-muted)]">
            Page {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* SlideOver */}
      <StudentSlideOver studentId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}

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
                data={k.m1_12_repartition_moyennes?.chartData || []}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                stroke="none"
                style={RECHARTS_CURSOR_STYLE}
              >
                {(k.m1_12_repartition_moyennes?.chartData || []).map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
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
      {/* Section Étudiants */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6 flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--accent-teal)]" />
          Étudiants
        </h3>
        <StudentsTable />
      </div>
    </div>
  );
}
