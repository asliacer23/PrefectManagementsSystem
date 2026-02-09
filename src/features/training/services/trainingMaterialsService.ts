import { supabase } from '@/integrations/supabase/client';

interface Material {
  id: string;
  title: string;
  content: string | null;
  is_published: boolean;
  category_id: string;
  created_at: string;
  created_by: string;
}

interface CreateMaterialInput {
  title: string;
  content?: string;
  category_id: string;
  is_published?: boolean;
}

interface UpdateMaterialInput {
  title?: string;
  content?: string;
  category_id?: string;
  is_published?: boolean;
}

/**
 * Fetch all training materials
 */
export const fetchMaterials = async (publishedOnly = false): Promise<Material[]> => {
  let query = supabase
    .from('training_materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'Failed to fetch materials');
  }

  return data || [];
};

/**
 * Fetch materials by category
 */
export const fetchMaterialsByCategory = async (
  categoryId: string,
  publishedOnly = false
): Promise<Material[]> => {
  let query = supabase
    .from('training_materials')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'Failed to fetch materials by category');
  }

  return data || [];
};

/**
 * Fetch a single material by ID
 */
export const fetchMaterialById = async (id: string): Promise<Material> => {
  const { data, error } = await supabase
    .from('training_materials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch material');
  }

  return data;
};

/**
 * Create a new training material
 */
export const createMaterial = async (input: CreateMaterialInput): Promise<Material> => {
  if (!input.title.trim()) {
    throw new Error('Material title is required');
  }

  if (!input.category_id) {
    throw new Error('Category is required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('training_materials')
    .insert({
      title: input.title.trim(),
      content: input.content?.trim() || null,
      category_id: input.category_id,
      is_published: input.is_published || false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create material');
  }

  return data;
};

/**
 * Update a training material
 */
export const updateMaterial = async (id: string, input: UpdateMaterialInput): Promise<Material> => {
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error('Material title cannot be empty');
  }

  if (input.category_id !== undefined && !input.category_id) {
    throw new Error('Category is required');
  }

  const updateData: UpdateMaterialInput = {};
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.content !== undefined) updateData.content = input.content.trim() || null;
  if (input.category_id !== undefined) updateData.category_id = input.category_id;
  if (input.is_published !== undefined) updateData.is_published = input.is_published;

  const { data, error } = await supabase
    .from('training_materials')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update material');
  }

  return data;
};

/**
 * Delete a training material
 */
export const deleteMaterial = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('training_materials')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete material');
  }
};

/**
 * Publish a material
 */
export const publishMaterial = async (id: string): Promise<Material> => {
  return updateMaterial(id, { is_published: true });
};

/**
 * Unpublish a material
 */
export const unpublishMaterial = async (id: string): Promise<Material> => {
  return updateMaterial(id, { is_published: false });
};

/**
 * Search materials by title or content
 */
export const searchMaterials = async (
  searchTerm: string,
  publishedOnly = false
): Promise<Material[]> => {
  let query = supabase
    .from('training_materials')
    .select('*')
    .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'Failed to search materials');
  }

  return data || [];
};

/**
 * Get materials count by category
 */
export const getMaterialsCountByCategory = async (categoryId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('training_materials')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) {
    throw new Error(error.message || 'Failed to fetch materials count');
  }

  return count || 0;
};

/**
 * Get total published and draft count
 */
export const getMaterialsStats = async (): Promise<{ published: number; draft: number }> => {
  const { count: published, error: publishedError } = await supabase
    .from('training_materials')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  const { count: draft, error: draftError } = await supabase
    .from('training_materials')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false);

  if (publishedError || draftError) {
    throw new Error('Failed to fetch materials stats');
  }

  return {
    published: published || 0,
    draft: draft || 0,
  };
};
