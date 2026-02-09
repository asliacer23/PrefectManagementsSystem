import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateEventInput {
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}

interface UpdateEventInput {
  title?: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}

/**
 * Fetch all events
 */
export const fetchEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch events');
  }

  return data || [];
};

/**
 * Fetch a single event by ID
 */
export const fetchEventById = async (id: string): Promise<Event> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch event');
  }

  return data;
};

/**
 * Fetch events by date range
 */
export const fetchEventsByDateRange = async (startDate: string, endDate: string): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch events');
  }

  return data || [];
};

/**
 * Fetch upcoming events
 */
export const fetchUpcomingEvents = async (): Promise<Event[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', today)
    .order('event_date', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch upcoming events');
  }

  return data || [];
};

/**
 * Create a new event
 */
export const createEvent = async (userId: string, input: CreateEventInput): Promise<Event> => {
  if (!input.title.trim()) {
    throw new Error('Event title is required');
  }

  if (!input.event_date) {
    throw new Error('Event date is required');
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      event_date: input.event_date,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      location: input.location?.trim() || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create event');
  }

  return data;
};

/**
 * Update an event
 */
export const updateEvent = async (id: string, input: UpdateEventInput): Promise<Event> => {
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error('Event title cannot be empty');
  }

  const updateData: UpdateEventInput = {};
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description.trim() || null;
  if (input.event_date !== undefined) updateData.event_date = input.event_date;
  if (input.start_time !== undefined) updateData.start_time = input.start_time || null;
  if (input.end_time !== undefined) updateData.end_time = input.end_time || null;
  if (input.location !== undefined) updateData.location = input.location.trim() || null;

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update event');
  }

  return data;
};

/**
 * Delete an event
 */
export const deleteEvent = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete event');
  }
};

/**
 * Get events count
 */
export const getEventsStats = async (): Promise<{ total: number; upcoming: number }> => {
  const today = new Date().toISOString().split('T')[0];

  const [totalResult, upcomingResult] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', today),
  ]);

  return {
    total: totalResult.count || 0,
    upcoming: upcomingResult.count || 0,
  };
};

/**
 * Search events by title, description, or location
 */
export const searchEvents = async (searchTerm: string): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
    )
    .order('event_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to search events');
  }

  return data || [];
};

/**
 * Fetch all user profiles (for creator info)
 */
export const fetchProfiles = async (): Promise<Array<{ id: string; first_name: string; last_name: string }>> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .order('first_name');

  if (error) {
    throw new Error(error.message || 'Failed to fetch profiles');
  }

  return data || [];
};
