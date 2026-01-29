/**
 * Script to check database tables exist
 * Usage: npx tsx scripts/check-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('Connecting to Supabase:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTables() {
  console.log('\n--- Checking Database Tables ---\n');

  // Check achievements table
  console.log('1. Checking achievements table...');
  const { data: achievements, error: achievementsError } = await supabase
    .from('achievements')
    .select('id, name')
    .limit(5);

  if (achievementsError) {
    console.error('   ❌ achievements table error:', achievementsError.message);
  } else {
    console.log('   ✅ achievements table exists, rows:', achievements?.length || 0);
    if (achievements && achievements.length > 0) {
      console.log('   Sample:', achievements.map(a => a.name).join(', '));
    }
  }

  // Check user_achievements table
  console.log('\n2. Checking user_achievements table...');
  const { data: userAchievements, error: userAchievementsError } = await supabase
    .from('user_achievements')
    .select('id')
    .limit(1);

  if (userAchievementsError) {
    console.error('   ❌ user_achievements table error:', userAchievementsError.message);
  } else {
    console.log('   ✅ user_achievements table exists');
  }

  // Check profiles table
  console.log('\n3. Checking profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .limit(5);

  if (profilesError) {
    console.error('   ❌ profiles table error:', profilesError.message);
  } else {
    console.log('   ✅ profiles table exists, rows:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
      console.log('   Usernames:', profiles.map(p => p.username).join(', '));
    }
  }

  // Check xp_balances table
  console.log('\n4. Checking xp_balances table...');
  const { data: xpBalances, error: xpError } = await supabase
    .from('xp_balances')
    .select('profile_id, total_xp')
    .limit(5);

  if (xpError) {
    console.error('   ❌ xp_balances table error:', xpError.message);
  } else {
    console.log('   ✅ xp_balances table exists, rows:', xpBalances?.length || 0);
  }

  // Check article_reads table
  console.log('\n5. Checking article_reads table...');
  const { data: articleReads, error: articleError } = await supabase
    .from('article_reads')
    .select('id')
    .limit(1);

  if (articleError) {
    console.error('   ❌ article_reads table error:', articleError.message);
  } else {
    console.log('   ✅ article_reads table exists');
  }

  console.log('\n--- Check Complete ---\n');
}

checkTables().catch(console.error);
