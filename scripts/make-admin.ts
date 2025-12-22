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
    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email, role')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error(`❌ User not found: ${email}`);
      console.error('Make sure the user exists and the email is correct.');
      process.exit(1);
    }

    console.log('Found user:');
    console.log(`  ID: ${profile.id}`);
    console.log(`  Username: ${profile.username}`);
    console.log(`  Email: ${profile.email}`);
    console.log(`  Current Role: ${profile.role || 'user'}\n`);

    if (profile.role === 'admin') {
      console.log('✅ User is already an admin!');
      return;
    }

    // Update role to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
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
