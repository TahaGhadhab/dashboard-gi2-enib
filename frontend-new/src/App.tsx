import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Enseignement = lazy(() => import('./pages/Enseignement'));
const RH = lazy(() => import('./pages/RH'));
const Encadrement = lazy(() => import('./pages/Encadrement'));
const Satisfaction = lazy(() => import('./pages/Satisfaction'));
const Rayonnement = lazy(() => import('./pages/Rayonnement'));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <FilterProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="enseignement" element={<Enseignement />} />
                  <Route path="rh" element={<RH />} />
                  <Route path="encadrement" element={<Encadrement />} />
                  <Route path="satisfaction" element={<Satisfaction />} />
                  <Route path="rayonnement" element={<Rayonnement />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </FilterProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
