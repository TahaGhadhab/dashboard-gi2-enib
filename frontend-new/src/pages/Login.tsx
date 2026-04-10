import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { BookMarked, LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-md space-y-10">
        {/* Branding */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue shadow-lg shadow-accent-blue/5 border border-accent-blue/20">
            <BookMarked className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-text uppercase tracking-[0.15em] font-sans">ENIB GI</h1>
            <p className="text-xs font-bold text-muted-text uppercase tracking-widest mt-2">Performance Analytics Dashboard</p>
          </div>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-text ml-1">Email Personnel</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@enib.fr"
              required
              className="w-full rounded-xl bg-elevated/50 border border-[var(--border-default)] px-5 py-3.5 text-sm text-primary-text placeholder-text-muted focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/10 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-text ml-1">Mot de Passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl bg-elevated/50 border border-[var(--border-default)] px-5 py-3.5 text-sm text-primary-text placeholder-text-muted focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/10 outline-none transition-all font-medium"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-accent-red/10 border border-accent-red/20 p-4 text-xs font-bold text-accent-red animate-shake uppercase tracking-tight">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-accent-blue text-white text-sm font-bold uppercase tracking-widest hover:bg-accent-blue/90 disabled:opacity-50 transition-all shadow-lg shadow-accent-blue/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            {loading ? 'Authentification...' : 'Se Connecter'}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-text uppercase tracking-widest font-bold">
          Accès Réservé au Personnel ENIB
        </p>
      </div>
    </div>
  );
}
