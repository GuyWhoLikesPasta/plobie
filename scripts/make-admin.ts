/**
 * Make Admin Script
 *
 * Grants admin role to a user by email
 *
 * Usage: npm run user:admin <email>
 * Example: npm run user:admin test@plobie.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin(email: string) {
  console.log(`👑 Granting admin role to: ${email}\n`);

  try {
    // Find user in auth.users using service role key
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error accessing auth users:', authError.message);
      process.exit(1);
    }

    const authUser = authData.users.find(u => u.email === email);

    if (!authUser) {
      console.error(`❌ User not found: ${email}`);
      console.error('Make sure the user exists and the email is correct.');
      console.error('The user must sign up first before granting admin privileges.');
      process.exit(1);
    }

    // Get profile (id in profiles is the same as auth.users.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, is_admin')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.error(`❌ Profile not found for: ${email}`);
      console.error('The user exists but has no profile. This is unusual.');
      process.exit(1);
    }

    console.log('Found user:');
    console.log(`  ID: ${profile.id}`);
    console.log(`  Username: ${profile.username}`);
    console.log(`  Email: ${email}`);
    console.log(`  Current Admin: ${profile.is_admin ? 'Yes' : 'No'}\n`);

    if (profile.is_admin) {
      console.log('✅ User is already an admin!');
      return;
    }

    // Update is_admin to true
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    console.log('✅ Admin role granted successfully!\n');
    console.log(`${profile.username} is now an admin.`);
    console.log('They can access the admin dashboard at: /admin\n');
  } catch (error: any) {
    console.error('❌ Error granting admin role:', error.message || error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Email is required');
  console.error('Usage: npm run user:admin <email>');
  console.error('Example: npm run user:admin test@plobie.com');
  process.exit(1);
}

// Run the script
makeAdmin(email);
