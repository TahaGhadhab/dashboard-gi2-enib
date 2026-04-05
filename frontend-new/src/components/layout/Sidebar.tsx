import { useAuth } from '@/context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Briefcase,
  SmilePlus, Globe, BookMarked, LogOut, User,
  PanelLeftClose, PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Enseignement', href: '/enseignement', icon: BookOpen },
  { name: 'Ressources Humaines', href: '/rh', icon: Users },
  { name: 'Encadrement', href: '/encadrement', icon: Briefcase },
  { name: 'Satisfaction', href: '/satisfaction', icon: SmilePlus },
  { name: 'Rayonnement', href: '/rayonnement', icon: Globe },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'flex flex-col glass-panel border-r border-white/5 shadow-2xl relative z-10 m-3 mr-0 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-20 items-center justify-between px-4 border-b border-white/5">
        <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center w-full')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary shadow-lg shadow-primary/20">
            <BookMarked className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-foreground tracking-wide truncate">ENIB GI</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Tableau de Bord</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 mx-3 mt-3 rounded-xl bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        title={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
      >
        {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-full px-3 py-3 text-sm font-medium transition-all duration-300 ease-out',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className={cn('p-3 space-y-2 border-t border-white/5', collapsed && 'px-2')}>
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 border border-border p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Dr. Admin</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'Chef Dép. GI'}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={user?.email || 'Dr. Admin'}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
              <User className="h-5 w-5" />
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Déconnexion"
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors',
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </aside>
  );
}
