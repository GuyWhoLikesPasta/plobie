/**
 * Create Test User Script
 * 
 * Creates a test user with known credentials for development/testing
 * 
 * Usage: npm run user:create
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user credentials
const TEST_USER = {
  email: 'test@plobie.com',
  password: 'TestPassword123!',
  username: 'testuser',
  full_name: 'Test User',
};

async function createTestUser() {
  console.log('👤 Creating test user...\n');
  console.log(`Email: ${TEST_USER.email}`);
  console.log(`Password: ${TEST_USER.password}`);
  console.log(`Username: ${TEST_USER.username}\n`);

  try {
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, username, email')
      .eq('email', TEST_USER.email)
      .single();

    if (existingProfile) {
      console.log('⚠️  Test user already exists!');
      console.log(`ID: ${existingProfile.id}`);
      console.log(`Username: ${existingProfile.username}`);
      console.log(`Email: ${existingProfile.email}\n`);
      console.log('✅ You can use the existing credentials to log in.');
      return;
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: TEST_USER.username,
        full_name: TEST_USER.full_name,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    console.log('✅ Auth user created');
    console.log(`User ID: ${authData.user.id}\n`);

    // Profile should be created automatically by trigger, but let's verify
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.warn('⚠️  Profile not found, creating manually...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: TEST_USER.username,
          full_name: TEST_USER.full_name,
          email: TEST_USER.email,
        });

      if (insertError) throw insertError;
      console.log('✅ Profile created manually');
    } else {
      console.log('✅ Profile exists');
    }

    // Create XP balance
    const { error: xpError } = await supabase
      .from('xp_balances')
      .insert({
        profile_id: authData.user.id,
        total_xp: 0,
        current_level: 0,
      });

    if (xpError && xpError.code !== '23505') { // Ignore duplicate key error
      console.warn('⚠️  XP balance creation warning:', xpError.message);
    } else {
      console.log('✅ XP balance initialized');
    }

    console.log('\n🎉 Test user created successfully!\n');
    console.log('📝 Login Credentials:');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Password: ${TEST_USER.password}`);
    console.log(`   Username: ${TEST_USER.username}\n`);
    console.log('🔗 Login at: http://localhost:3000/login\n');

  } catch (error: any) {
    console.error('❌ Error creating test user:', error.message || error);
    process.exit(1);
  }
}

// Run the script
createTestUser();

