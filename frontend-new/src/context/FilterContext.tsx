import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FilterContextType {
  anneeUniv: string;
  setAnneeUniv: (v: string) => void;
  promo: string;
  setPromo: (v: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const ANNEES = ['2024-2025', '2023-2024', '2022-2023', '2021-2022'];
const PROMOS = ['Toutes promos', '1ere', '2eme', '3eme'];

export function FilterProvider({ children }: { children: ReactNode }) {
  const [anneeUniv, setAnneeUniv] = useState('2024-2025');
  const [promo, setPromo] = useState('Toutes promos');

  return (
    <FilterContext.Provider value={{ anneeUniv, setAnneeUniv, promo, setPromo }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}

export { ANNEES, PROMOS };
