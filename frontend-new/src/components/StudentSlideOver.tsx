import { useEffect, useRef, useState } from 'react';
import { X, GraduationCap, AlertTriangle, CheckCircle2, Star, BookOpen, Clock, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudentAccess } from '@/hooks/useStudentAccess';
import type { StudentProfile, StudentLevel, StudentStatus } from '@/types/student';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLevelLabel(level: StudentLevel): string {
  const map: Record<StudentLevel, string> = {
    '1ere': '1ère année',
    '2eme': '2ème année',
    '3eme': '3ème année',
  };
  return map[level] ?? level;
}

function getInitialsColor(id: string): string {
  const colors = [
    'var(--accent-blue)',
    'var(--accent-teal)',
    'var(--accent-purple)',
    'var(--accent-cyan)',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getNoteColor(note: number | null): string {
  if (note === null) return 'var(--text-muted)';
  if (note < 10) return 'var(--kpi-danger)';
  if (note < 12) return 'var(--kpi-warning)';
  return 'var(--kpi-ok)';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return (
    <div
      className={cn('rounded animate-pulse bg-[var(--bg-elevated)]', width, height)}
    />
  );
}

function SlideOverSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full animate-pulse bg-[var(--bg-elevated)]" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-2/3" height="h-5" />
          <SkeletonLine width="w-1/3" height="h-3" />
        </div>
      </div>
      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <SkeletonLine width="w-1/4" height="h-3" />
          <SkeletonLine height="h-10" />
          <SkeletonLine height="h-10" />
          <SkeletonLine width="w-3/4" height="h-10" />
        </div>
      ))}
    </div>
  );
}

// ─── Badge statut ─────────────────────────────────────────────────────────────

function StatusBadge({ statut }: { statut: StudentStatus }) {
  const config = {
    alerte: { label: 'Alerte', icon: <AlertTriangle className="h-3 w-3" />, color: 'var(--kpi-danger)', bg: 'rgba(240,68,56,0.12)' },
    normal: { label: 'Normal', icon: <CheckCircle2 className="h-3 w-3" />, color: 'var(--kpi-ok)', bg: 'rgba(15,204,176,0.12)' },
    excellent: { label: 'Excellent', icon: <Star className="h-3 w-3" />, color: 'var(--accent-purple)', bg: 'rgba(167,139,250,0.12)' },
  }[statut];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ color: config.color, background: config.bg }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Barre de progression ────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? 'var(--kpi-ok)' : value >= 60 ? 'var(--kpi-warning)' : 'var(--kpi-danger)';
  return (
    <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudentSlideOverProps {
  studentId: string | null;
  onClose: () => void;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function StudentSlideOver({ studentId, onClose }: StudentSlideOverProps) {
  const { fetchStudentProfile, role } = useStudentAccess();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = studentId !== null;

  // Fetch profil quand studentId change
  useEffect(() => {
    if (!studentId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setFetching(true);
    setFetchError(null);

    fetchStudentProfile(Number(studentId)).then((p) => {
      if (!cancelled) {
        if (!p) setFetchError('Données non disponibles.');
        else setProfile(p);
        setFetching(false);
      }
    });

    return () => { cancelled = true; };
  }, [studentId, fetchStudentProfile]);

  // Fermeture par Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Trap focus dans le panneau
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex flex-col h-full w-[380px] max-w-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-[var(--shadow-elevated)] outline-none overflow-hidden"
        style={{ animation: 'slideOverIn 250ms ease-out both' }}
      >
        {/* Header fixe */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Profil Étudiant</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto">
          {fetching && <SlideOverSkeleton />}

          {fetchError && (
            <div className="p-6">
              <div className="rounded-xl p-4 border border-[var(--kpi-danger)]/20 bg-[var(--kpi-danger)]/5 text-[var(--kpi-danger)] text-sm font-bold">
                {fetchError}
              </div>
            </div>
          )}

          {!fetching && !fetchError && profile && (
            <div className="p-6 space-y-7">

              {/* ── HEADER ÉTUDIANT ──────────────────────────────────── */}
              <div className="flex items-start gap-4">
                {/* Avatar initiales */}
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{
                    background: getInitialsColor(String(profile.summary.id_etudiant)),
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {profile.summary.nom[0]?.toUpperCase()}
                  {profile.summary.prenom[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
                    {profile.summary.prenom} {profile.summary.nom}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {getLevelLabel(profile.summary.niveau)}
                    {profile.summary.classe && (
                      <span className="ml-2 font-mono text-[var(--text-muted)]">
                        {profile.summary.classe}
                      </span>
                    )}
                    {profile.summary.double_diplome && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--accent-purple)' }}>Double diplôme</span>
                    )}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <StatusBadge statut={profile.summary.statut} />
                    {profile.summary.moyenne !== undefined && (
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: getNoteColor(profile.summary.moyenne) }}
                      >
                        Moy. {profile.summary.moyenne.toFixed(1)}/20
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── RÉSULTATS ────────────────────────────────────────── */}
              {profile.resultats.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                    <BookOpen className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
                    Résultats
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                          <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Matière</th>
                          <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-right">Note</th>
                          <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-right">Ratt.</th>
                          <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-right">Cr.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {profile.resultats.map((r) => (
                          <tr key={r.id_matiere} className="hover:bg-[var(--bg-elevated)] transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="block text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px]">{r.nom_matiere}</span>
                              <span className="block text-[10px] font-mono text-[var(--text-muted)]">{r.code_matiere}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-sm font-mono font-bold" style={{ color: getNoteColor(r.note_principale) }}>
                                {r.note_principale !== null ? r.note_principale.toFixed(1) : '—'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-sm font-mono font-bold" style={{ color: getNoteColor(r.note_rattrapage) }}>
                                {r.note_rattrapage !== null ? r.note_rattrapage.toFixed(1) : '—'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-[10px] font-mono text-[var(--text-muted)]">{r.credits}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {profile.is_partial && (
                    <p className="mt-2 text-[10px] text-[var(--text-muted)] italic text-right">
                      Affichage limité à vos matières
                    </p>
                  )}
                </section>
              )}

              {!profile.resultats.length && (
                <div className="rounded-xl p-4 border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                  Aucun résultat disponible
                </div>
              )}

              {/* ── ASSIDUITÉ ────────────────────────────────────────── */}
              <section>
                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                  <Clock className="h-3.5 w-3.5 text-[var(--accent-teal)]" />
                  Assiduité
                </h3>
                <div className="rounded-xl border border-[var(--border-subtle)] p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--text-secondary)]">Taux d'assiduité</span>
                    <span
                      className="text-sm font-mono font-bold"
                      style={{
                        color: profile.absences.taux_assiduite >= 80
                          ? 'var(--kpi-ok)'
                          : profile.absences.taux_assiduite >= 60
                            ? 'var(--kpi-warning)'
                            : 'var(--kpi-danger)',
                      }}
                    >
                      {profile.absences.taux_assiduite}%
                    </span>
                  </div>
                  <ProgressBar value={profile.absences.taux_assiduite} />
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>{profile.absences.total} absence{profile.absences.total > 1 ? 's' : ''} au total</span>
                    <span>{profile.absences.justifiees} justifiée{profile.absences.justifiees > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </section>

              {/* ── PFE (chef_dept seulement) ────────────────────────── */}
              {role === 'chef_dept' && profile.pfe && (
                <section>
                  <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                    <Briefcase className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
                    Encadrement PFE
                  </h3>
                  <div className="rounded-xl border border-[var(--border-subtle)] p-4 space-y-2">
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{profile.pfe.titre}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{profile.pfe.entreprise}</p>
                    {profile.pfe.note !== undefined && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Note PFE</span>
                        <span
                          className="font-mono font-bold text-sm"
                          style={{ color: getNoteColor(profile.pfe.note) }}
                        >
                          {profile.pfe.note.toFixed(1)}/20
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Animation keyframe inline (une seule fois) */}
      <style>{`
        @keyframes slideOverIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
