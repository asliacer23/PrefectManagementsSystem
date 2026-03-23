import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Network,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  icon: LucideIcon;
  path: string;
  roles: string[];
  section: 'Overview' | 'Workspace' | 'Operations' | 'Insights' | 'Admin';
  keywords?: string[];
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'prefect', 'faculty', 'student'], section: 'Overview', keywords: ['home', 'overview'] },
  { label: 'Training', icon: BookOpen, path: '/training', roles: ['admin', 'prefect', 'faculty', 'student'], section: 'Workspace', keywords: ['materials', 'learning'] },
  { label: 'Conversations', icon: MessageCircle, path: '/conversations', roles: ['admin', 'prefect', 'faculty', 'student'], section: 'Workspace', keywords: ['messages', 'chat'] },
  { label: 'Complaints', icon: FileText, path: '/complaints', roles: ['admin', 'prefect', 'faculty', 'student'], section: 'Workspace', keywords: ['reports', 'cases'] },
  { label: 'Incidents', icon: AlertTriangle, path: '/incidents', roles: ['admin', 'prefect', 'faculty'], section: 'Workspace', keywords: ['discipline', 'alerts'] },
  { label: 'Recruitment', icon: UserCheck, path: '/recruitment', roles: ['admin', 'faculty', 'student'], section: 'Operations', keywords: ['applications', 'hiring'] },
  { label: 'Request Staff from HR', icon: UserPlus, path: '/integrations/hr-staff-request', roles: ['admin', 'prefect', 'faculty'], section: 'Operations', keywords: ['hr', 'hiring', 'employee', 'manpower'] },
  { label: 'Duty Assignments', icon: ClipboardList, path: '/duties', roles: ['admin', 'prefect', 'faculty'], section: 'Operations', keywords: ['schedule', 'assignments'] },
  { label: 'Gate Assistance', icon: DoorOpen, path: '/gate-logs', roles: ['admin', 'prefect', 'faculty'], section: 'Operations', keywords: ['gate', 'logs'] },
  { label: 'Events', icon: Calendar, path: '/events', roles: ['admin', 'prefect', 'faculty'], section: 'Operations', keywords: ['calendar', 'activities'] },
  { label: 'Attendance', icon: ShieldCheck, path: '/attendance', roles: ['admin', 'prefect', 'faculty'], section: 'Operations', keywords: ['presence', 'records'] },
  { label: 'Evaluations', icon: GraduationCap, path: '/evaluations', roles: ['admin', 'faculty'], section: 'Operations', keywords: ['performance', 'assessment'] },
  { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin', 'prefect', 'faculty'], section: 'Insights', keywords: ['analytics', 'metrics'] },
  { label: 'Weekly Reports', icon: FileBarChart, path: '/weekly-reports', roles: ['admin', 'prefect', 'faculty'], section: 'Insights', keywords: ['summary', 'weekly'] },
  { label: 'Integration Hub', icon: Network, path: '/integrations', roles: ['admin', 'faculty'], section: 'Admin', keywords: ['connections', 'endpoints', 'backend', 'database'] },
  { label: 'Registrar Integration', icon: Network, path: '/integrations/registrar', roles: ['admin', 'faculty'], section: 'Admin', keywords: ['prefect schema', 'registrar'] },
  { label: 'User Management', icon: Users, path: '/users', roles: ['admin'], section: 'Admin', keywords: ['roles', 'accounts'] },
];

export const navigationSections: Array<NavigationItem['section']> = [
  'Overview',
  'Workspace',
  'Operations',
  'Insights',
  'Admin',
];
