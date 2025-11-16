import { createServerSupabaseClient } from './supabase';
import { redirect } from 'next/navigation';

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Get the current user's profile
 * Returns null if not authenticated or profile doesn't exist
 */
export async function getCurrentProfile() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  return profile;
}

/**
 * Require authentication for a page
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

/**
 * Require admin access
 * Redirects to home if not admin
 */
export async function requireAdmin() {
  const profile = await getCurrentProfile();
  
  if (!profile || !profile.is_admin) {
    redirect('/');
  }
  
  return profile;
}

/**
 * Check if user is authenticated (doesn't redirect)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Check if user is admin (doesn't redirect)
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return !!profile?.is_admin;
}

