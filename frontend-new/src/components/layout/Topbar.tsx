import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Download, FileText, Sun, Moon, LayoutDashboard, BookOpen, Users, Briefcase, SmilePlus, Globe } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFilters, ANNEES, PROMOS } from '@/context/FilterContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const moduleMap: Record<string, string> = {
  '/': 'dashboard',
  '/enseignement': 'enseignement',
  '/rh': 'rh',
  '/encadrement': 'encadrement',
  '/satisfaction': 'satisfaction',
  '/rayonnement': 'rayonnement',
};

const titleMap: Record<string, string> = {
  '/': 'Tableau de bord de performance',
  '/enseignement': 'Module Enseignement',
  '/rh': 'Ressources Humaines',
  '/encadrement': 'Module Encadrement',
  '/satisfaction': 'Module Satisfaction',
  '/rayonnement': 'Module Rayonnement',
};

const moduleConfig: Record<string, { icon: any, color: string, glow: string }> = {
  'dashboard': { icon: LayoutDashboard, color: 'text-accent-blue', glow: 'icon-glow-blue' },
  'enseignement': { icon: BookOpen, color: 'text-accent-teal', glow: 'icon-glow-teal' },
  'rh': { icon: Users, color: 'text-accent-purple', glow: 'icon-glow-purple' },
  'encadrement': { icon: Briefcase, color: 'text-accent-amber', glow: 'icon-glow-amber' },
  'satisfaction': { icon: SmilePlus, color: 'text-accent-red', glow: 'icon-glow-red' },
  'rayonnement': { icon: Globe, color: 'text-accent-cyan', glow: 'icon-glow-cyan' },
};

export function Topbar() {
  const location = useLocation();
  const currentModule = moduleMap[location.pathname] || 'dashboard';
  const title = titleMap[location.pathname] || 'Tableau de bord';
  const config = moduleConfig[currentModule];
  const ModuleIcon = config.icon;

  const { anneeUniv, setAnneeUniv, promo, setPromo } = useFilters();
  const { theme, toggleTheme } = useTheme();

  const [anneeOpen, setAnneeOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const anneeRef = useRef<HTMLDivElement>(null);
  const promoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (anneeRef.current && !anneeRef.current.contains(e.target as Node)) setAnneeOpen(false);
      if (promoRef.current && !promoRef.current.contains(e.target as Node)) setPromoOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCSVExport = async () => {
    try {
      const mod = currentModule === 'dashboard' ? 'enseignement' : currentModule;
      const response = await api.get(`/export/${mod}/csv`, {
        params: { annee_univ: anneeUniv },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${mod}_${anneeUniv}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  const handlePDFExport = () => {
    window.print();
  };

  return (
    <header className="relative z-[40] flex flex-col gap-6 p-6 md:px-10 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-[var(--border-default)] shadow-sm icon-glow-target",
            config.glow,
            config.color
          )}>
            <ModuleIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary-text tracking-tight font-sans">{title}</h2>
            <p className="text-xs text-muted-text font-bold uppercase tracking-widest mt-1">
              Département Génie Industriel — ENIB
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filters Group */}
          <div className="flex items-center rounded-lg bg-surface border border-[var(--border-default)] p-1 shadow-sm">
            {/* Year Filter */}
            <div ref={anneeRef} className="relative">
              <button
                onClick={() => { setAnneeOpen(!anneeOpen); setPromoOpen(false); }}
                aria-haspopup="listbox"
                aria-expanded={anneeOpen}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-secondary-text hover:text-primary-text transition-colors"
              >
                AU {anneeUniv}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform opacity-50", anneeOpen && "rotate-180")} />
              </button>
              {anneeOpen && (
                <div role="listbox" className="absolute top-full left-0 mt-2 w-44 rounded-lg bg-elevated border border-[var(--border-default)] shadow-xl py-1 z-[110]">
                  {ANNEES.map(a => (
                    <button
                      key={a}
                      role="option"
                      aria-selected={a === anneeUniv}
                      onClick={() => { setAnneeUniv(a); setAnneeOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors",
                        a === anneeUniv ? "bg-accent-blue text-white" : "text-secondary-text hover:bg-[var(--bg-hover)] hover:text-primary-text"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

            {/* Promo Filter */}
            <div ref={promoRef} className="relative">
              <button
                onClick={() => { setPromoOpen(!promoOpen); setAnneeOpen(false); }}
                aria-haspopup="listbox"
                aria-expanded={promoOpen}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-secondary-text hover:text-primary-text transition-colors"
              >
                {promo}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform opacity-50", promoOpen && "rotate-180")} />
              </button>
              {promoOpen && (
                <div role="listbox" className="absolute top-full left-0 mt-2 w-44 rounded-lg bg-elevated border border-[var(--border-default)] shadow-xl py-1 z-[110]">
                  {PROMOS.map(p => (
                    <button
                      key={p}
                      role="option"
                      aria-selected={p === promo}
                      onClick={() => { setPromo(p); setPromoOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors",
                        p === promo ? "bg-accent-blue text-white" : "text-secondary-text hover:bg-[var(--bg-hover)] hover:text-primary-text"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block h-8 w-[1px] bg-[var(--border-subtle)] mx-1" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-[var(--border-default)] text-secondary-text hover:text-primary-text transition-all shadow-sm icon-glow-target icon-glow-blue"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-accent-amber" /> : <Moon className="h-5 w-5 text-accent-blue" />}
          </button>

          {/* Export Group */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCSVExport}
              title="Exporter en CSV"
              aria-label="Exporter les données au format CSV"
              className="flex h-10 items-center gap-2 px-4 rounded-lg bg-surface border border-[var(--border-default)] text-xs font-bold uppercase tracking-widest text-secondary-text hover:bg-[var(--bg-hover)] hover:text-primary-text transition-all shadow-sm icon-glow-target icon-glow-teal"
            >
              <Download className="h-4 w-4 text-accent-teal" />
              CSV
            </button>

            <button
              onClick={handlePDFExport}
              title="Imprimer / PDF"
              aria-label="Générer un rapport PDF"
              className={cn(
                "flex h-10 items-center gap-2 px-6 rounded-lg text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98] icon-glow-target",
                theme === 'light'
                  ? "bg-surface border border-[var(--border-default)] text-secondary-text hover:bg-[var(--bg-hover)] shadow-sm icon-glow-blue"
                  : "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25"
              )}
            >
              <FileText className={cn("h-4 w-4", theme === 'light' ? "text-accent-blue" : "text-white")} />
              PDF
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
