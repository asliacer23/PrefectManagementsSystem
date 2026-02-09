import { supabase } from '@/integrations/supabase/client';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  location: string;
  is_resolved: boolean;
  reported_by: string;
  incident_date: string;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateIncidentInput {
  title: string;
  description: string;
  severity: IncidentSeverity;
  location?: string;
}

interface UpdateIncidentInput {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  location?: string;
  is_resolved?: boolean;
}

/**
 * Fetch all incidents
 */
export const fetchIncidents = async (): Promise<Incident[]> => {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch incidents');
  }

  return data || [];
};

/**
 * Fetch user's own incidents
 */
export const fetchUserIncidents = async (userId: string): Promise<Incident[]> => {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('reported_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch incidents');
  }

  return data || [];
};

/**
 * Fetch a single incident by ID
 */
export const fetchIncidentById = async (id: string): Promise<Incident> => {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch incident');
  }

  return data;
};

/**
 * Fetch incidents by severity
 */
export const fetchIncidentsBySeverity = async (severity: IncidentSeverity): Promise<Incident[]> => {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('severity', severity)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch incidents');
  }

  return data || [];
};

/**
 * Fetch resolved or unresolved incidents
 */
export const fetchIncidentsByResolved = async (isResolved: boolean): Promise<Incident[]> => {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('is_resolved', isResolved)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch incidents');
  }

  return data || [];
};

/**
 * Create a new incident
 */
export const createIncident = async (userId: string, input: CreateIncidentInput): Promise<Incident> => {
  if (!input.title.trim()) {
    throw new Error('Incident title is required');
  }

  if (!input.description.trim()) {
    throw new Error('Incident description is required');
  }

  const { data, error } = await supabase
    .from('incident_reports')
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      severity: input.severity,
      location: input.location?.trim() || null,
      is_resolved: false,
      reported_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create incident');
  }

  return data;
};

/**
 * Update an incident
 */
export const updateIncident = async (id: string, input: UpdateIncidentInput): Promise<Incident> => {
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error('Incident title cannot be empty');
  }

  if (input.description !== undefined && !input.description.trim()) {
    throw new Error('Incident description cannot be empty');
  }

  const updateData: UpdateIncidentInput = {};
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description.trim();
  if (input.severity !== undefined) updateData.severity = input.severity;
  if (input.location !== undefined) updateData.location = input.location.trim() || null;
  if (input.is_resolved !== undefined) updateData.is_resolved = input.is_resolved;

  const { data, error } = await supabase
    .from('incident_reports')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update incident');
  }

  return data;
};

/**
 * Delete an incident
 */
export const deleteIncident = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('incident_reports')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete incident');
  }
};

/**
 * Mark incident as resolved
 */
export const resolveIncident = async (id: string): Promise<Incident> => {
  return updateIncident(id, { is_resolved: true });
};

/**
 * Mark incident as unresolved
 */
export const unresolveIncident = async (id: string): Promise<Incident> => {
  return updateIncident(id, { is_resolved: false });
};

/**
 * Get incidents count by severity
 */
export const getIncidentsStats = async (): Promise<Record<IncidentSeverity, number>> => {
  const severities: IncidentSeverity[] = ['low', 'medium', 'high', 'critical'];
  const stats: Record<IncidentSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const severity of severities) {
    const { count, error } = await supabase
      .from('incident_reports')
      .select('*', { count: 'exact', head: true })
      .eq('severity', severity);

    if (!error && count !== null) {
      stats[severity] = count;
    }
  }

  return stats;
};

/**
 * Get critical incidents count
 */
export const getCriticalIncidentsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('incident_reports')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'critical')
    .eq('is_resolved', false);

  if (error) {
    throw new Error(error.message || 'Failed to fetch critical incidents count');
  }

  return count || 0;
};

/**
 * Search incidents by title, description, or location
 */
export const searchIncidents = async (searchTerm: string): Promise<Incident[]> => {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to search incidents');
  }

  return data || [];
};
