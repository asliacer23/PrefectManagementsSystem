import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, FileText,
  ClipboardList, ShieldCheck, Calendar, BarChart3,
  ChevronLeft, ChevronRight, LogOut, Moon, Sun, Menu, X,
  BookOpen, AlertTriangle, DoorOpen, UserCheck, FileBarChart,
  MessageCircle, User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import bestlinkLogo from '@/assets/bestlink-logo.png';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['admin', 'prefect', 'faculty', 'student'] },
  { label: 'User Management', icon: <Users size={20} />, path: '/users', roles: ['admin'] },
  { label: 'Training', icon: <BookOpen size={20} />, path: '/training', roles: ['admin', 'prefect', 'faculty', 'student'] },
  { label: 'Conversations', icon: <MessageCircle size={20} />, path: '/conversations', roles: ['admin', 'prefect', 'faculty', 'student'] },
  { label: 'Complaints', icon: <FileText size={20} />, path: '/complaints', roles: ['admin', 'prefect', 'faculty', 'student'] },
  { label: 'Incidents', icon: <AlertTriangle size={20} />, path: '/incidents', roles: ['admin', 'prefect', 'faculty'] },
  { label: 'Recruitment', icon: <UserCheck size={20} />, path: '/recruitment', roles: ['admin', 'prefect', 'faculty', 'student'] },
  { label: 'Duty Assignments', icon: <ClipboardList size={20} />, path: '/duties', roles: ['admin', 'prefect', 'faculty'] },
  { label: 'Gate Assistance', icon: <DoorOpen size={20} />, path: '/gate-logs', roles: ['admin', 'prefect', 'faculty'] },
  { label: 'Events', icon: <Calendar size={20} />, path: '/events', roles: ['admin', 'prefect', 'faculty'] },
  { label: 'Attendance', icon: <ShieldCheck size={20} />, path: '/attendance', roles: ['admin', 'prefect', 'faculty'] },
  { label: 'Evaluations', icon: <GraduationCap size={20} />, path: '/evaluations', roles: ['admin', 'faculty'] },
  { label: 'Reports', icon: <BarChart3 size={20} />, path: '/reports', roles: ['admin', 'prefect', 'faculty'] },
  { label: 'Weekly Reports', icon: <FileBarChart size={20} />, path: '/weekly-reports', roles: ['admin', 'prefect', 'faculty'] },
  { label: 'My Profile', icon: <User size={20} />, path: '/profile', roles: ['admin', 'prefect', 'faculty', 'student'] },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut, profile, primaryRole, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const filteredNav = navItems.filter(item =>
    item.roles.some(r => hasRole(r as any))
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <img src={bestlinkLogo} alt="Bestlink College" className="w-10 h-10 rounded-lg object-contain bg-white/10 p-0.5 flex-shrink-0" />
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="font-display text-sm font-bold leading-tight text-sidebar-primary-foreground">Prefect</h1>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredNav.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
          title={collapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {!collapsed && profile && (
          <div className="px-3 py-2 animate-fade-in">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{primaryRole}</p>
          </div>
        )}

        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-accent hover:bg-accent/10 transition-colors"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card shadow-lg border border-border md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground z-10"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-sidebar-border transition-all duration-300 flex-shrink-0 ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          style={{ left: collapsed ? '56px' : '248px' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
