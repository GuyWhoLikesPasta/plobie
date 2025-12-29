/**
 * Create Test User for Unity Testing
 * Creates a user with seed data for James to test with
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USER = {
  email: 'unity_test@plobie.com',
  username: 'unity_tester',
  password: 'UnityTest123!',
  fullName: 'Unity Test User',
};

async function createTestUser() {
  console.log('🔐 Creating Unity test user...');
  console.log('================================');
  console.log('');

  // Check if user already exists
  const { data: existingProfile } = await adminSupabase
    .from('profiles')
    .select('id, username')
    .eq('username', TEST_USER.username)
    .single();

  if (existingProfile) {
    console.log('✅ Test user already exists!');
    console.log('   Username:', TEST_USER.username);
    console.log('   Email:', TEST_USER.email);
    console.log('   Password:', TEST_USER.password);
    console.log('');
    console.log('📊 Current stats:');
    await printUserStats(existingProfile.id);
    return;
  }

  // Create user via admin API
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      username: TEST_USER.username,
    },
  });

  if (authError || !authData.user) {
    console.error('❌ Failed to create user:', authError);
    process.exit(1);
  }

  console.log('✅ User created in auth.users');

  // Update profile
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({
      username: TEST_USER.username,
      full_name: TEST_USER.fullName,
      bio: 'Test user for Unity integration testing',
    })
    .eq('id', authData.user.id);

  if (profileError) {
    console.error('❌ Failed to update profile:', profileError);
    process.exit(1);
  }

  console.log('✅ Profile updated');

  // Add some XP (simulate activity)
  console.log('');
  console.log('📈 Adding seed XP...');

  const { error: xpError } = await adminSupabase.rpc('apply_xp', {
    p_profile_id: authData.user.id,
    p_action_type: 'seed_data',
    p_xp_amount: 50, // Level 1 with 50 XP
    p_description: 'Seed data for testing',
  });

  if (xpError) {
    console.warn('⚠️  Failed to add XP:', xpError);
  } else {
    console.log('✅ Added 50 XP');
  }

  // Create a sample post
  console.log('');
  console.log('📝 Creating sample post...');

  const { error: postError } = await adminSupabase.from('posts').insert({
    author_id: authData.user.id,
    hobby_group: 'Gardening',
    title: 'Test Post from Unity Tester',
    content: 'This is a test post created for Unity integration testing.',
  });

  if (postError) {
    console.warn('⚠️  Failed to create post:', postError);
  } else {
    console.log('✅ Created sample post');
  }

  console.log('');
  console.log('🎉 Test user created successfully!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('   Email:', TEST_USER.email);
  console.log('   Password:', TEST_USER.password);
  console.log('   Username:', TEST_USER.username);
  console.log('');
  console.log('📊 Current stats:');
  await printUserStats(authData.user.id);
  console.log('');
  console.log('💡 James can use these credentials to test Unity integration!');
}

async function printUserStats(userId: string) {
  // Get XP balance
  const { data: xpBalance } = await adminSupabase
    .from('xp_balances')
    .select('total_xp, daily_xp')
    .eq('profile_id', userId)
    .single();

  const totalXp = xpBalance?.total_xp || 0;
  const level = Math.floor(totalXp / 100) + 1;

  // Get post count
  const { count: postCount } = await adminSupabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId);

  // Get comment count
  const { count: commentCount } = await adminSupabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId);

  // Get pot count
  const { count: potCount } = await adminSupabase
    .from('pot_claims')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log('   Level:', level);
  console.log('   Total XP:', totalXp);
  console.log('   Daily XP:', xpBalance?.daily_xp || 0);
  console.log('   Posts:', postCount || 0);
  console.log('   Comments:', commentCount || 0);
  console.log('   Pots:', potCount || 0);
}

createTestUser().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
