import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'prefect' | 'faculty' | 'student';
type TemporaryBypassRole = 'admin' | 'faculty';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  student_id: string | null;
  department: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  primaryRole: AppRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TEMP_BYPASS_STORAGE_KEY = 'prefect-management-temp-auth';

const TEMP_BYPASS_ACCOUNTS: Record<string, {
  password: string;
  role: TemporaryBypassRole;
  userId: string;
  firstName: string;
  lastName: string;
  department: string;
}> = {
  'admin@gmail.com': {
    password: 'admin123',
    role: 'admin',
    userId: '11111111-1111-4111-8111-111111111111',
    firstName: 'Admin',
    lastName: 'User',
    department: 'Administration',
  },
  'staff@gmail.com': {
    password: 'admin123',
    role: 'faculty',
    userId: '22222222-2222-4222-8222-222222222222',
    firstName: 'Staff',
    lastName: 'User',
    department: 'Guidance Office',
  },
};

const createTemporaryUser = (email: string, userId: string) => ({
  id: userId,
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email,
}) as User;

const createTemporarySession = (user: User) => ({
  access_token: 'temporary-bypass-token',
  refresh_token: 'temporary-bypass-refresh-token',
  expires_in: 60 * 60 * 24,
  token_type: 'bearer',
  user,
}) as Session;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const applyTemporaryBypass = (email: string) => {
    const account = TEMP_BYPASS_ACCOUNTS[email];
    if (!account) return false;

    const temporaryUser = createTemporaryUser(email, account.userId);
    setUser(temporaryUser);
    setSession(createTemporarySession(temporaryUser));
    setRoles([account.role]);
    setProfile({
      id: temporaryUser.id,
      first_name: account.firstName,
      last_name: account.lastName,
      email,
      avatar_url: null,
      student_id: null,
      department: account.department,
    });
    localStorage.setItem(TEMP_BYPASS_STORAGE_KEY, email);
    setLoading(false);
    return true;
  };

  const tryRealTemporarySignIn = async (email: string) => {
    const account = TEMP_BYPASS_ACCOUNTS[email];
    if (!account) return false;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: account.password,
    });

    if (error || !data.session) {
      return false;
    }

    localStorage.removeItem(TEMP_BYPASS_STORAGE_KEY);
    setSession(data.session);
    setUser(data.session.user);
    await Promise.all([fetchProfile(data.session.user.id), fetchRoles(data.session.user.id)]);
    setLoading(false);
    return true;
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, student_id, department')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (data) setRoles(data.map(r => r.role as AppRole));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          fetchRoles(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await Promise.all([fetchProfile(session.user.id), fetchRoles(session.user.id)]);
        setLoading(false);
        return;
      }

      const storedBypassEmail = localStorage.getItem(TEMP_BYPASS_STORAGE_KEY);
      if (storedBypassEmail) {
        const signedIn = await tryRealTemporarySignIn(storedBypassEmail);
        if (signedIn) {
          return;
        }

        if (applyTemporaryBypass(storedBypassEmail)) {
          return;
        }
      }

      setSession(null);
      setUser(null);
      setProfile(null);
      setRoles([]);
      setLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (!error && data.session) {
      localStorage.removeItem(TEMP_BYPASS_STORAGE_KEY);
      setSession(data.session);
      setUser(data.session.user);
      await Promise.all([fetchProfile(data.session.user.id), fetchRoles(data.session.user.id)]);
      return { error: null };
    }

    const tempAccount = TEMP_BYPASS_ACCOUNTS[normalizedEmail];
    if (tempAccount && tempAccount.password === password) {
      applyTemporaryBypass(normalizedEmail);
      return { error: null };
    }

    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName, last_name: lastName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    localStorage.removeItem(TEMP_BYPASS_STORAGE_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    await supabase.auth.signOut();
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const rolePriority: AppRole[] = ['admin', 'faculty', 'prefect', 'student'];
  const primaryRole = rolePriority.find(r => roles.includes(r)) || 'student';

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, signIn, signUp, signOut, hasRole, primaryRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
