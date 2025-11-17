import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🌱 Seeding products and variants...\n');

  // Sample products with Stripe IDs (these would be real in production)
  const products = [
    {
      name: 'Classic Terracotta Pot',
      description: 'Traditional hand-thrown terracotta pot with drainage hole. Perfect for succulents and small plants.',
      stripe_product_id: 'prod_classic_terracotta',
      featured: true,
      category: 'pottery',
    },
    {
      name: 'Modern Ceramic Planter',
      description: 'Sleek modern design with matte finish. Ideal for indoor plants and home decor.',
      stripe_product_id: 'prod_modern_ceramic',
      featured: true,
      category: 'pottery',
    },
    {
      name: 'Hanging Planter Set',
      description: 'Set of 3 hanging planters with macrame holders. Great for vining plants.',
      stripe_product_id: 'prod_hanging_set',
      featured: false,
      category: 'pottery',
    },
    {
      name: 'Glazed Garden Pot',
      description: 'Beautiful glazed finish in various colors. Weather-resistant for outdoor use.',
      stripe_product_id: 'prod_glazed_garden',
      featured: true,
      category: 'pottery',
    },
    {
      name: 'Mini Succulent Collection',
      description: 'Set of 5 small pots perfect for succulent collections and desk plants.',
      stripe_product_id: 'prod_mini_collection',
      featured: false,
      category: 'pottery',
    },
    {
      name: 'Artisan Bowl Planter',
      description: 'Wide shallow bowl perfect for arrangements and bonsai.',
      stripe_product_id: 'prod_artisan_bowl',
      featured: false,
      category: 'pottery',
    },
  ];

  for (const product of products) {
    console.log(`📦 Creating product: ${product.name}`);
    
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (productError) {
      console.error(`   ❌ Error: ${productError.message}`);
      continue;
    }

    console.log(`   ✓ Created product ID: ${productData.id}`);

    // Create variants for each product
    const variants = generateVariants(productData.id, product.name);
    
    for (const variant of variants) {
      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variant);

      if (variantError) {
        console.error(`   ❌ Variant error: ${variantError.message}`);
      } else {
        console.log(`   ✓ Added variant: ${variant.sku} - $${(variant.price_cents / 100).toFixed(2)}`);
      }
    }
    
    console.log('');
  }

  console.log('✅ Product seeding complete!\n');
  console.log('📊 Summary:');
  
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  
  const { count: variantCount } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true });
  
  console.log(`   Products: ${productCount}`);
  console.log(`   Variants: ${variantCount}`);
  console.log('\n🛍️ Visit /shop to see your products!');
}

function generateVariants(productId: string, productName: string): any[] {
  const sizes = ['small', 'medium', 'large'];
  const colors = ['terracotta', 'white', 'charcoal', 'sage'];
  const variants: any[] = [];

  // Generate 3-4 variants per product
  const numVariants = Math.floor(Math.random() * 2) + 3; // 3 or 4 variants
  
  for (let i = 0; i < numVariants; i++) {
    const size = sizes[i % sizes.length];
    const color = colors[i % colors.length];
    const basePrice = size === 'small' ? 1200 : size === 'medium' ? 1800 : 2400;
    const colorPremium = color === 'white' || color === 'sage' ? 200 : 0;
    const price = basePrice + colorPremium;
    
    variants.push({
      product_id: productId,
      sku: `${productName.substring(0, 3).toUpperCase()}-${size.substring(0, 1).toUpperCase()}-${color.substring(0, 3).toUpperCase()}`.replace(/\s/g, ''),
      size,
      color,
      price_cents: price,
      stripe_price_id: `price_${productId}_${size}_${color}`,
      stock_qty: Math.floor(Math.random() * 50) + 10, // 10-60 in stock
    });
  }

  return variants;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

