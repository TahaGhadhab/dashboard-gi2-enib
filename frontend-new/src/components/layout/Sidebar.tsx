import { useAuth } from '@/context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Briefcase,
  SmilePlus, Globe, BookMarked, LogOut, User,
  PanelLeftClose, PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, color: 'text-accent-blue', glow: 'icon-glow-blue' },
  { name: 'Enseignement', href: '/enseignement', icon: BookOpen, color: 'text-accent-teal', glow: 'icon-glow-teal' },
  { name: 'Ressources Humaines', href: '/rh', icon: Users, color: 'text-accent-purple', glow: 'icon-glow-purple' },
  { name: 'Encadrement', href: '/encadrement', icon: Briefcase, color: 'text-accent-amber', glow: 'icon-glow-amber' },
  { name: 'Satisfaction', href: '/satisfaction', icon: SmilePlus, color: 'text-accent-red', glow: 'icon-glow-red' },
  { name: 'Rayonnement', href: '/rayonnement', icon: Globe, color: 'text-accent-cyan', glow: 'icon-glow-cyan' },
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
        'flex flex-col bg-surface border-r border-[var(--border-subtle)] relative z-[50] transition-all duration-300 ease-in-out',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-20 items-center px-4 border-b border-[var(--border-subtle)]">
        <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center w-full')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue shadow-lg shadow-accent-blue/5 icon-glow-target icon-glow-blue">
            <BookMarked className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-primary-text uppercase tracking-[0.1em]">ENIB GI</h1>
              <p className="text-[10px] text-muted-text uppercase tracking-widest font-semibold">Performance Hub</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 py-6">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 py-3 px-6 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-glow-blue text-primary-text border-l-[3px] border-accent-blue pl-[21px]'
                  : 'text-secondary-text hover:bg-[var(--bg-hover)] pl-6'
              )
            }
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center icon-glow-target",
              item.glow
            )}>
              <item.icon 
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 transition-all",
                  item.color,
                  "group-[.active]:opacity-100 opacity-60"
                )} 
                aria-hidden="true" 
              />
            </div>
            {!collapsed && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="p-4 border-t border-[var(--border-subtle)] space-y-4">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full h-10 px-3 rounded-lg bg-elevated/50 border border-[var(--border-subtle)] text-secondary-text hover:text-primary-text hover:bg-elevated transition-all"
          aria-label={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4 mx-auto" /> : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-xs font-semibold">Réduire le menu</span>
            </>
          )}
        </button>

        <div className={cn('space-y-2', collapsed && 'items-center')}>
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-xl bg-elevated/30 border border-[var(--border-subtle)] p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary-text truncate">Dr. Admin</p>
                <p className="text-[10px] text-secondary-text truncate uppercase tracking-tighter">{user?.email || 'Chef Dép. GI'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={user?.email || 'Dr. Admin'}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-purple/10 text-accent-purple">
                <User className="h-4 w-4" />
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            aria-label="Déconnexion"
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider text-secondary-text hover:bg-accent-red/10 hover:text-accent-red transition-all',
              collapsed && "px-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>
      </div>
    </aside>
  );
}
