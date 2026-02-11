import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  student_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  year_level?: number;
  section?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  year_level?: number;
  section?: string;
  avatar_url?: string;
}

/**
 * Get current user's profile
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

/**
 * Upload profile avatar image to 'profile' bucket
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("profile")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("profile").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}

/**
 * Delete profile avatar from 'profile' bucket
 */
export async function deleteAvatar(userId: string): Promise<void> {
  try {
    // Get the user's current avatar URL
    const profile = await getProfile(userId);
    if (!profile?.avatar_url) return;

    // Extract file path from URL
    const urlParts = profile.avatar_url.split("/avatars/");
    if (urlParts.length < 2) return;

    const fileName = urlParts[1];
    const { error } = await supabase.storage
      .from("profile")
      .remove([`avatars/${fileName}`]);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting avatar:", error);
    throw error;
  }
}
