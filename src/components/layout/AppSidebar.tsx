import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, LogOut, Moon, Sun, X,
  PanelLeftClose
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import bestlinkLogo from '@/assets/bestlink-logo.png';
import { navigationItems, navigationSections } from './navigation';

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const filteredNav = navigationItems.filter(item =>
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
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navigationSections.map((section) => {
          const sectionItems = filteredNav.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="mb-4 last:mb-0">
              {!collapsed && (
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">
                  {section}
                </p>
              )}
              <div className="space-y-0.5">
                {sectionItems.map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                        active
                          ? 'bg-sidebar-accent text-sidebar-primary font-medium shadow-sm'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                        <Icon size={18} />
                      </span>
                      {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
          title={collapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-accent hover:bg-accent/10 transition-colors"
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
        <PanelLeftClose size={20} />
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
