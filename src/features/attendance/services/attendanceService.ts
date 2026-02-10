import { supabase } from '@/integrations/supabase/client';

export interface Attendance {
  id: string;
  prefect_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface CreateAttendanceInput {
  prefect_id: string;
  date: string;
  time_in?: string | null;
  time_out?: string | null;
  status?: string;
  notes?: string | null;
}

export interface UpdateAttendanceInput {
  date?: string;
  time_in?: string | null;
  time_out?: string | null;
  status?: string;
  notes?: string | null;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AttendanceStats {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

/**
 * Fetch all attendance records with pagination and filtering
 */
export async function fetchAttendance(
  startDate?: string,
  endDate?: string,
  prefectId?: string
): Promise<Attendance[]> {
  let query = supabase
    .from('attendance')
    .select('*')
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  if (prefectId) {
    query = query.eq('prefect_id', prefectId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Attendance[];
}

/**
 * Fetch attendance records for a specific user
 */
export async function fetchUserAttendance(userId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('prefect_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []) as Attendance[];
}

/**
 * Fetch attendance by date range
 */
export async function fetchAttendanceByDateRange(
  startDate: string,
  endDate: string
): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []) as Attendance[];
}

/**
 * Fetch attendance for a specific date
 */
export async function fetchAttendanceByDate(date: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', date)
    .order('time_in', { ascending: false });

  if (error) throw error;
  return (data || []) as Attendance[];
}

/**
 * Create a new attendance record
 */
export async function createAttendance(input: CreateAttendanceInput): Promise<Attendance> {
  // Check for existing record on same date for the prefect
  const existing = await supabase
    .from('attendance')
    .select('id')
    .eq('prefect_id', input.prefect_id)
    .eq('date', input.date)
    .single();

  if (existing.data) {
    throw new Error('Attendance record already exists for this date');
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert([
      {
        prefect_id: input.prefect_id,
        date: input.date,
        time_in: input.time_in || null,
        time_out: input.time_out || null,
        status: input.status || 'present',
        notes: input.notes || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Attendance;
}

/**
 * Update an attendance record
 */
export async function updateAttendance(
  id: string,
  input: UpdateAttendanceInput
): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendance')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Attendance;
}

/**
 * Update attendance status
 */
export async function updateAttendanceStatus(
  id: string,
  status: string
): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendance')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Attendance;
}

/**
 * Log time in for attendance
 */
export async function logTimeIn(id: string, timeIn: string): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendance')
    .update({ time_in: timeIn })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Attendance;
}

/**
 * Log time out for attendance
 */
export async function logTimeOut(id: string, timeOut: string): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendance')
    .update({ time_out: timeOut })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Attendance;
}

/**
 * Delete an attendance record
 */
export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabase.from('attendance').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Get attendance statistics
 */
export async function getAttendanceStats(
  startDate?: string,
  endDate?: string
): Promise<AttendanceStats> {
  let query = supabase.from('attendance').select('status', { count: 'exact' });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { count: total, data: totalData } = await query;

  let presentQuery = supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('status', 'present');

  if (startDate) presentQuery = presentQuery.gte('date', startDate);
  if (endDate) presentQuery = presentQuery.lte('date', endDate);

  const { count: presentCount } = await presentQuery;

  let absentQuery = supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('status', 'absent');

  if (startDate) absentQuery = absentQuery.gte('date', startDate);
  if (endDate) absentQuery = absentQuery.lte('date', endDate);

  const { count: absentCount } = await absentQuery;

  let lateQuery = supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('status', 'late');

  if (startDate) lateQuery = lateQuery.gte('date', startDate);
  if (endDate) lateQuery = lateQuery.lte('date', endDate);

  const { count: lateCount } = await lateQuery;

  return {
    totalRecords: total || 0,
    presentCount: presentCount || 0,
    absentCount: absentCount || 0,
    lateCount: lateCount || 0,
  };
}

/**
 * Search attendance by notes or other fields
 */
export async function searchAttendance(query: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .or(`notes.ilike.%${query}%,date.ilike.%${query}%`)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []) as Attendance[];
}

/**
 * Fetch all prefect profiles (users with 'prefect' role)
 */
export async function fetchPrefects(): Promise<Profile[]> {
  // First, get all user IDs with 'prefect' role
  const { data: prefectRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'prefect');

  if (rolesError) throw rolesError;

  if (!prefectRoles || prefectRoles.length === 0) {
    return [];
  }

  // Extract user IDs
  const prefectIds = prefectRoles.map(r => r.user_id);

  // Fetch profiles for these users
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', prefectIds)
    .order('first_name', { ascending: true });

  if (error) throw error;
  return (data || []) as Profile[];
}

/**
 * Fetch all user profiles (for lookups)
 */
export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .order('first_name', { ascending: true });

  if (error) throw error;
  return (data || []) as Profile[];
}

/**
 * Get attendance status options
 */
export const ATTENDANCE_STATUS_OPTIONS = ['present', 'absent', 'late'];

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'absent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'late':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}
