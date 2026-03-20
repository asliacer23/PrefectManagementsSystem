import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, LogOut, Moon, Search, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { navigationItems } from './navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

const baseNotifications = [
  {
    id: 'pending-reviews',
    title: 'Pending reviews',
    description: 'Open items across complaints, incidents, and reports may need attention.',
    time: 'Just now',
  },
  {
    id: 'today-schedule',
    title: 'Today overview',
    description: 'Check your dashboard and assignments for updated schedules and deadlines.',
    time: '5 min ago',
  },
  {
    id: 'profile-reminder',
    title: 'Profile check',
    description: 'Keep your profile details up to date so records and routing stay accurate.',
    time: 'Today',
  },
];

export default function AppHeader() {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const { profile, primaryRole, hasRole, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const accessiblePages = useMemo(
    () => navigationItems.filter((item) => item.roles.some((role) => hasRole(role as never))),
    [hasRole],
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return accessiblePages.slice(0, 6);

    return accessiblePages.filter((item) => {
      const haystack = [item.label, item.section, ...(item.keywords ?? [])].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [accessiblePages, query]);

  const activePage = accessiblePages.find((item) => item.path === location.pathname);
  const initials = `${profile?.first_name?.[0] ?? 'U'}${profile?.last_name?.[0] ?? ''}`.toUpperCase();
  const notifications = baseNotifications.map((notification) => ({
    ...notification,
    description:
      notification.id === 'today-schedule'
        ? `${primaryRole.charAt(0).toUpperCase()}${primaryRole.slice(1)} view is ready with your latest modules.`
        : notification.description,
  }));

  const handleNavigate = (path: string) => {
    navigate(path);
    setQuery('');
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex items-center gap-3 px-4 py-3 pl-16 md:px-6 md:pl-6">
        <div className="hidden min-w-0 lg:block">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
          <h2 className="truncate text-lg font-semibold text-foreground">
            {activePage?.label ?? 'Prefect Management'}
          </h2>
        </div>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Search pages, modules, and shortcuts..."
            className="h-11 rounded-full border-border/70 bg-card pl-10 pr-4 shadow-sm"
          />

          {searchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-border bg-popover p-2 shadow-xl">
              {searchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onMouseDown={() => handleNavigate(item.path)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.section}</span>
                    </span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-11 w-11 rounded-full">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-blue-500" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-3xl">
            <DialogHeader>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>Recent updates for your workspace and account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{notification.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-2 py-1.5 shadow-sm transition-colors hover:bg-accent">
              <Avatar className="h-9 w-9 border border-border/70">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.first_name ?? 'User'} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="max-w-32 truncate text-sm font-medium">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}
                </p>
                <p className="text-xs capitalize text-muted-foreground">{primaryRole}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
