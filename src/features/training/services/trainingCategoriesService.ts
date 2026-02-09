import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface CreateCategoryInput {
  name: string;
  description?: string;
}

interface UpdateCategoryInput {
  name?: string;
  description?: string;
}

/**
 * Fetch all training categories
 */
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('training_categories')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(error.message || 'Failed to fetch categories');
  }

  return data || [];
};

/**
 * Fetch a single category by ID
 */
export const fetchCategoryById = async (id: string): Promise<Category> => {
  const { data, error } = await supabase
    .from('training_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch category');
  }

  return data;
};

/**
 * Create a new training category
 */
export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  if (!input.name.trim()) {
    throw new Error('Category name is required');
  }

  const { data, error } = await supabase
    .from('training_categories')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create category');
  }

  return data;
};

/**
 * Update a training category
 */
export const updateCategory = async (id: string, input: UpdateCategoryInput): Promise<Category> => {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error('Category name cannot be empty');
  }

  const updateData: UpdateCategoryInput = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.description !== undefined) updateData.description = input.description.trim() || null;

  const { data, error } = await supabase
    .from('training_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update category');
  }

  return data;
};

/**
 * Delete a training category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('training_categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete category');
  }
};

/**
 * Check if category has materials
 */
export const getCategoryMaterialCount = async (categoryId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('training_materials')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) {
    throw new Error(error.message || 'Failed to fetch material count');
  }

  return count || 0;
};
