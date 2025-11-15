import { createServerSupabaseClient } from './supabase';
import { FeatureFlag } from './types';

/**
 * Get all feature flags as a key-value map
 * Server-side only
 */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled');

    if (error) {
      console.error('Error fetching feature flags:', error);
      return {};
    }

    return (data as FeatureFlag[]).reduce((acc, flag) => {
      acc[flag.key] = flag.enabled;
      return acc;
    }, {} as Record<string, boolean>);
  } catch (error) {
    console.error('Unexpected error fetching flags:', error);
    return {};
  }
}

/**
 * Check if a specific feature flag is enabled
 * Server-side only
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key] === true;
}

/**
 * Client-side feature flag hook
 * Call the API to get flags
 */
export async function getFeatureFlagsClient(): Promise<Record<string, boolean>> {
  try {
    const response = await fetch('/api/flags');
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    
    return {};
  } catch (error) {
    console.error('Error fetching flags from client:', error);
    return {};
  }
}

