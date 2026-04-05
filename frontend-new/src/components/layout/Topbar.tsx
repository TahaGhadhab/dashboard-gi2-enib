import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Download, FileText, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFilters, ANNEES, PROMOS } from '@/context/FilterContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/api';

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

export function Topbar() {
  const location = useLocation();
  const currentModule = moduleMap[location.pathname] || 'dashboard';
  const title = titleMap[location.pathname] || 'Tableau de bord';

  const { anneeUniv, setAnneeUniv, promo, setPromo } = useFilters();
  const { theme, toggleTheme } = useTheme();

  const [anneeOpen, setAnneeOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const anneeRef = useRef<HTMLDivElement>(null);
  const promoRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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
      alert('Erreur lors de l\'export CSV. Vérifiez que le backend est démarré.');
    }
  };

  const handlePDFExport = () => {
    window.print();
  };

  return (
    <header className="relative z-[100] flex flex-col gap-6 p-6 md:p-8 pb-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground font-medium mt-0.5">Département Génie Industriel</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Filters */}
        <div className="flex items-center rounded-full bg-secondary/80 backdrop-blur-md border border-border p-1 px-2 h-11">
          {/* Year Filter */}
          <div ref={anneeRef} className="relative">
            <button
              onClick={() => { setAnneeOpen(!anneeOpen); setPromoOpen(false); }}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 opacity-70"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              {anneeUniv}
              <ChevronDown className={`h-4 w-4 ml-1 opacity-50 transition-transform ${anneeOpen ? 'rotate-180' : ''}`} />
            </button>
            {anneeOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 rounded-xl bg-card border border-border shadow-2xl py-1 z-[110] backdrop-blur-xl">
                {ANNEES.map(a => (
                  <button
                    key={a}
                    onClick={() => { setAnneeUniv(a); setAnneeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      a === anneeUniv ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-border mx-1"></div>

          {/* Promo Filter */}
          <div ref={promoRef} className="relative">
            <button
              onClick={() => { setPromoOpen(!promoOpen); setAnneeOpen(false); }}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {promo}
              <ChevronDown className={`h-4 w-4 ml-1 opacity-50 transition-transform ${promoOpen ? 'rotate-180' : ''}`} />
            </button>
            {promoOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 rounded-xl bg-card border border-border shadow-2xl py-1 z-[110] backdrop-blur-xl">
                {PROMOS.map(p => (
                  <button
                    key={p}
                    onClick={() => { setPromo(p); setPromoOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      p === promo ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border mx-2"></div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/80 backdrop-blur-md border border-border text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* CSV Export */}
        <button
          onClick={handleCSVExport}
          className="flex h-11 items-center gap-2 rounded-full bg-secondary/80 backdrop-blur-md border border-border px-6 text-sm font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>

        {/* PDF Export */}
        <button
          onClick={handlePDFExport}
          className="flex h-11 items-center gap-2 rounded-full bg-primary/90 px-6 text-sm font-semibold text-white hover:bg-primary transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        >
          <FileText className="h-4 w-4" />
          PDF
        </button>
      </div>
    </header>
  );
}
