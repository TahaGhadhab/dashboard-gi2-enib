import { useState, useEffect } from 'react';
import api from '../services/api';
import { useFilters } from '../context/FilterContext';

export function useKpis(module: string) {
  const { anneeUniv } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get(`/${module}/kpis`, { params: { annee_univ: anneeUniv } })
      .then(res => {
        if (!cancelled) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [module, anneeUniv]);

  return { data, loading, error };
}
