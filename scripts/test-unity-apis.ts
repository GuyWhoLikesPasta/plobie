/**
 * Test Unity API Endpoints
 * This script tests all Unity integration endpoints
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

const BASE_URL = 'http://localhost:3000';

// Test user credentials
const TEST_USER = {
  email: `unity-test-${Date.now()}@plobie.test`,
  username: `unitytest${Date.now()}`,
  password: 'TestPass123!',
};

async function signUp() {
  console.log('\n🔐 Creating test user...');

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: TEST_USER.email,
    password: TEST_USER.password,
    options: {
      data: {
        username: TEST_USER.username,
      },
    },
  });

  if (authError) {
    console.error('❌ Auth signup error:', authError);
    throw authError;
  }

  if (!authData.user || !authData.session) {
    throw new Error('No user or session returned from signup');
  }

  // Update profile with username (profile is auto-created by trigger)
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({
      username: TEST_USER.username,
    })
    .eq('id', authData.user.id);

  if (profileError) {
    console.error('❌ Profile update error:', profileError);
    throw profileError;
  }

  console.log('✅ Test user created:', TEST_USER.username);
  console.log('   User ID:', authData.user.id);
  console.log('   Has session:', !!authData.session);

  return authData.session.access_token;
}

async function testUserProfileAPI(token: string) {
  console.log('\n📋 Testing GET /api/user/me...');

  const response = await fetch(`${BASE_URL}/api/user/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed:', data);
    return false;
  }

  console.log('✅ Success!');
  console.log('   Profile:', data.profile?.username);
  console.log('   Level:', data.xp?.level);
  console.log('   Total XP:', data.xp?.total_xp);
  console.log('   Pots:', data.stats?.pots);
  return true;
}

async function testStartGameSession(token: string) {
  console.log('\n🎮 Testing POST /api/games/session (start)...');

  const response = await fetch(`${BASE_URL}/api/games/session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'start',
      metadata: {
        client: 'Unity',
        version: '1.0.0',
        test: true,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed:', data);
    return null;
  }

  console.log('✅ Success!');
  console.log('   Session ID:', data.session?.id);
  console.log('   Started at:', data.session?.started_at);
  return data.session?.id;
}

async function testEndGameSession(token: string, sessionId: string) {
  console.log('\n🎮 Testing POST /api/games/session (end)...');

  const response = await fetch(`${BASE_URL}/api/games/session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'end',
      session_id: sessionId,
      duration_minutes: 45, // Should award 2 XP (1 block of 30 min)
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed:', data);
    return false;
  }

  console.log('✅ Success!');
  console.log('   XP Awarded:', data.xp_result?.awarded);
  console.log('   Capped:', data.xp_result?.capped);
  console.log('   New Total XP:', data.xp_result?.new_total_xp);
  console.log('   Level:', data.xp_result?.new_level);
  return true;
}

async function testActionXP(token: string) {
  console.log('\n⚡ Testing POST /api/games/xp...');

  const response = await fetch(`${BASE_URL}/api/games/xp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'water_plant',
      xp_amount: 5,
      metadata: {
        pot_id: 'test-pot-123',
        plant_type: 'succulent',
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed:', data);
    return false;
  }

  console.log('✅ Success!');
  console.log('   XP Awarded:', data.xp_result?.awarded);
  console.log('   New Total XP:', data.xp_result?.new_total_xp);
  console.log('   Message:', data.message);
  return true;
}

async function testSaveGameProgress(token: string) {
  console.log('\n💾 Testing POST /api/games/progress (save)...');

  const gameState = {
    camera: {
      position: { x: 0, y: 5, z: -10 },
      rotation: { x: 20, y: 0, z: 0 },
    },
    pots: [
      {
        id: 'pot_001',
        position: { x: 2, y: 0, z: 3 },
        plant_type: 'succulent',
        growth_stage: 2,
      },
    ],
    unlocked_areas: ['garden'],
    settings: {
      music_volume: 0.7,
      sfx_volume: 0.8,
    },
  };

  const response = await fetch(`${BASE_URL}/api/games/progress`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game_state: gameState,
      version: 1,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed:', data);
    return false;
  }

  console.log('✅ Success!');
  console.log('   Saved at:', data.saved_at);
  console.log('   Size:', data.size, 'bytes');
  return true;
}

async function testLoadGameProgress(token: string) {
  console.log('\n💾 Testing GET /api/games/progress (load)...');

  const response = await fetch(`${BASE_URL}/api/games/progress`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed:', data);
    return false;
  }

  console.log('✅ Success!');
  console.log('   Has saved game:', !!data.game_state);
  console.log('   Version:', data.version);
  console.log('   Pots in save:', data.game_state?.pots?.length || 0);
  return true;
}

async function runTests() {
  console.log('🧪 Unity API Endpoint Tests');
  console.log('============================');

  try {
    // 1. Create test user and get token
    const token = await signUp();

    // 2. Test user profile API
    const profileOk = await testUserProfileAPI(token);
    if (!profileOk) throw new Error('User profile API failed');

    // 3. Test game session start
    const sessionId = await testStartGameSession(token);
    if (!sessionId) throw new Error('Start session failed');

    // 4. Test game session end (awards XP)
    const endOk = await testEndGameSession(token, sessionId);
    if (!endOk) throw new Error('End session failed');

    // 5. Test action XP
    const xpOk = await testActionXP(token);
    if (!xpOk) throw new Error('Action XP failed');

    // 6. Test save game progress
    const saveOk = await testSaveGameProgress(token);
    if (!saveOk) throw new Error('Save progress failed');

    // 7. Test load game progress
    const loadOk = await testLoadGameProgress(token);
    if (!loadOk) throw new Error('Load progress failed');

    console.log('\n✅ All Unity API tests passed!');
    console.log('\n📊 Summary:');
    console.log('   ✅ User Profile API');
    console.log('   ✅ Game Session (Start)');
    console.log('   ✅ Game Session (End + XP)');
    console.log('   ✅ Action XP');
    console.log('   ✅ Save Game Progress');
    console.log('   ✅ Load Game Progress');
    console.log('\n🎉 Unity integration is ready for James!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
