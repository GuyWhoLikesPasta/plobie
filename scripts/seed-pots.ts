/**
 * Seed Test Pots for QR Claiming
 * 
 * Creates sample pots in the database for testing the claim flow.
 * Run with: npm run seed:pots
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_POTS = [
  {
    code: 'TEST001',
    product_id: null,
    status: 'unclaimed',
    metadata: {
      size: 'Medium',
      color: 'Terracotta',
      design: 'Classic',
      note: 'Test pot for development'
    }
  },
  {
    code: 'TEST002',
    product_id: null,
    status: 'unclaimed',
    metadata: {
      size: 'Small',
      color: 'White',
      design: 'Minimalist',
      note: 'Test pot for development'
    }
  },
  {
    code: 'TEST003',
    product_id: null,
    status: 'unclaimed',
    metadata: {
      size: 'Large',
      color: 'Blue Ceramic',
      design: 'Artisan',
      note: 'Test pot for development'
    }
  },
];

async function main() {
  console.log('🌱 Seeding test pots...\n');

  // Check if pots already exist
  const { data: existingPots } = await supabase
    .from('pots')
    .select('code')
    .in('code', TEST_POTS.map(p => p.code));

  if (existingPots && existingPots.length > 0) {
    console.log(`⚠️  Found ${existingPots.length} existing test pots. Skipping...`);
    console.log('   To reseed, delete existing pots first.');
    return;
  }

  // Insert test pots
  const { data: insertedPots, error } = await supabase
    .from('pots')
    .insert(TEST_POTS)
    .select();

  if (error) {
    console.error('❌ Error inserting pots:', error);
    process.exit(1);
  }

  console.log(`✅ Created ${insertedPots?.length} test pots:\n`);
  insertedPots?.forEach((pot) => {
    console.log(`   🏺 ${pot.code} - https://plobie.vercel.app/claim?code=${pot.code}`);
  });

  console.log('\n🎉 Pot seeding complete!');
  console.log('\n📝 Test the claim flow:');
  console.log('   1. Go to: https://plobie.vercel.app/claim?code=TEST001');
  console.log('   2. Click "Claim This Pot"');
  console.log('   3. Earn +50 XP!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  });

