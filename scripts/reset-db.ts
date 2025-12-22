/**
 * Reset Database Script
 * 
 * Clears all user-generated data from the database while preserving:
 * - Products
 * - Pots
 * - Learn articles
 * - Feature flags
 * 
 * Usage: npm run db:reset
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

async function resetDatabase() {
  console.log('🗑️  Starting database reset...\n');

  try {
    // Delete in order to respect foreign key constraints
    
    console.log('Deleting notifications...');
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (notificationsError) throw notificationsError;
    console.log('✅ Notifications deleted\n');

    console.log('Deleting post reactions (likes)...');
    const { error: reactionsError } = await supabase
      .from('post_reactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (reactionsError) throw reactionsError;
    console.log('✅ Post reactions deleted\n');

    console.log('Deleting comments...');
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (commentsError) throw commentsError;
    console.log('✅ Comments deleted\n');

    console.log('Deleting posts...');
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (postsError) throw postsError;
    console.log('✅ Posts deleted\n');

    console.log('Deleting orders...');
    const { error: ordersError} = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (ordersError) throw ordersError;
    console.log('✅ Orders deleted\n');

    console.log('Deleting pot claims...');
    const { error: claimsError } = await supabase
      .from('pot_claims')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (claimsError) throw claimsError;
    console.log('✅ Pot claims deleted\n');

    console.log('Deleting XP events...');
    const { error: xpEventsError } = await supabase
      .from('xp_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (xpEventsError) throw xpEventsError;
    console.log('✅ XP events deleted\n');

    console.log('Deleting XP balances...');
    const { error: xpBalancesError } = await supabase
      .from('xp_balances')
      .delete()
      .neq('profile_id', '00000000-0000-0000-0000-000000000000');
    if (xpBalancesError) throw xpBalancesError;
    console.log('✅ XP balances deleted\n');

    console.log('Deleting game progress...');
    const { error: gameProgressError } = await supabase
      .from('game_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (gameProgressError) throw gameProgressError;
    console.log('✅ Game progress deleted\n');

    console.log('Deleting game sessions...');
    const { error: gameSessionsError } = await supabase
      .from('game_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (gameSessionsError) throw gameSessionsError;
    console.log('✅ Game sessions deleted\n');

    console.log('Deleting profiles...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (profilesError) throw profilesError;
    console.log('✅ Profiles deleted\n');

    console.log('🎉 Database reset complete!');
    console.log('\n📝 Preserved:');
    console.log('  - Products');
    console.log('  - Pots');
    console.log('  - Learn articles');
    console.log('  - Feature flags');
    console.log('\n✅ Ready for fresh data!');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

// Run the script
resetDatabase();

