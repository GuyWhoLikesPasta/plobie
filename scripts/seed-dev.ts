import { createClient } from '@supabase/supabase-js';

// This script seeds development data
// Run with: npm run seed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding development data...\n');

  // Feature Flags
  console.log('📋 Creating feature flags...');
  const { error: flagsError } = await supabase
    .from('feature_flags')
    .upsert([
      { key: 'shop_enabled', enabled: true, description: 'Enable shop tab' },
      { key: 'games_enabled', enabled: true, description: 'Enable games hub' },
      { key: 'hobbies_enabled', enabled: true, description: 'Enable hobbies tab' },
      { key: 'my_plants_enabled', enabled: true, description: 'Enable my plants tab' },
      { key: 'multiplayer_enabled', enabled: false, description: 'Enable multiplayer (future)' },
      { key: 'qr_claim_enabled', enabled: true, description: 'Enable QR pot claiming' },
    ], { onConflict: 'key' });

  if (flagsError) {
    console.error('❌ Error creating feature flags:', flagsError);
  } else {
    console.log('✅ Feature flags created\n');
  }

  // Test Pots
  console.log('🏺 Creating test pots...');
  const { error: potsError } = await supabase
    .from('pots')
    .upsert([
      { code: 'TEST001', design: 'classic', size: 'medium' },
      { code: 'TEST002', design: 'modern', size: 'large' },
      { code: 'TEST003', design: 'rustic', size: 'small' },
      { code: 'DEMO123', design: 'elegant', size: 'medium' },
      { code: 'DEMO456', design: 'minimalist', size: 'large' },
    ], { onConflict: 'code' });

  if (potsError) {
    console.error('❌ Error creating pots:', potsError);
  } else {
    console.log('✅ Test pots created\n');
  }

  // Sample Products (for shop testing)
  console.log('🛍️  Creating sample products...');
  
  // Create products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .upsert([
      {
        name: 'Classic Terra Cotta Pot',
        description: 'Traditional terra cotta pot perfect for succulents and herbs',
        featured: true,
        category: 'pottery',
      },
      {
        name: 'Modern Ceramic Planter',
        description: 'Sleek ceramic planter with drainage hole',
        featured: true,
        category: 'pottery',
      },
      {
        name: 'Rustic Wood Planter Box',
        description: 'Handcrafted wooden planter box for outdoor use',
        featured: false,
        category: 'pottery',
      },
    ], { onConflict: 'name', ignoreDuplicates: false })
    .select();

  if (productsError) {
    console.error('❌ Error creating products:', productsError);
  } else if (products) {
    console.log('✅ Sample products created');

    // Create variants for products
    console.log('📦 Creating product variants...');
    
    const variants = [];
    for (const product of products) {
      variants.push({
        product_id: product.id,
        sku: `${product.name.substring(0, 3).toUpperCase()}-SM-TER`,
        size: 'small',
        color: 'terracotta',
        price_cents: 1200,
        stock_qty: 50,
      });
      variants.push({
        product_id: product.id,
        sku: `${product.name.substring(0, 3).toUpperCase()}-MD-TER`,
        size: 'medium',
        color: 'terracotta',
        price_cents: 1800,
        stock_qty: 50,
      });
      variants.push({
        product_id: product.id,
        sku: `${product.name.substring(0, 3).toUpperCase()}-LG-TER`,
        size: 'large',
        color: 'terracotta',
        price_cents: 2500,
        stock_qty: 30,
      });
    }

    const { error: variantsError } = await supabase
      .from('product_variants')
      .upsert(variants, { onConflict: 'sku', ignoreDuplicates: true });

    if (variantsError) {
      console.error('❌ Error creating variants:', variantsError);
    } else {
      console.log('✅ Product variants created\n');
    }
  }

  console.log('🎉 Seeding complete!\n');
  console.log('Next steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Visit http://localhost:3000');
  console.log('3. Create a test account to start testing\n');
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));

