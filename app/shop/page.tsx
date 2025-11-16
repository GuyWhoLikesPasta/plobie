import { createServerSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import type { Product, ProductVariant } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch all products with their variants
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants(*)
    `)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  // Get featured products
  const featuredProducts = products?.filter(p => p.featured).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🛍️ Shop</h1>
          <p className="text-green-100">
            Beautiful pottery and plant accessories for your garden
          </p>
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✨ Featured Items</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">All Products</h2>
          
          {!products || products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 mb-4">No products available yet.</p>
              <p className="text-sm text-gray-500">
                Run <code className="bg-gray-100 px-2 py-1 rounded">npm run seed</code> to add sample products.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductCard({ product, featured }: { product: any; featured?: boolean }) {
  const variants = product.variants || [];
  const minPrice = variants.length > 0 
    ? Math.min(...variants.map((v: any) => v.price_cents))
    : 0;

  return (
    <Link 
      href={`/shop/${product.id}`}
      className={`bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden ${
        featured ? 'ring-2 ring-green-500' : ''
      }`}
    >
      {featured && (
        <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1 text-center">
          FEATURED
        </div>
      )}
      
      <div className="p-6">
        {/* Placeholder Image */}
        <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-4 flex items-center justify-center">
          <span className="text-6xl">🏺</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description || 'Beautiful handcrafted pottery'}
        </p>

        <div className="flex items-center justify-between">
          <div>
            {variants.length > 0 && (
              <p className="text-gray-900 font-bold">
                From ${(minPrice / 100).toFixed(2)}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {variants.length} {variants.length === 1 ? 'option' : 'options'}
            </p>
          </div>
          
          <span className="text-green-600 text-sm font-medium">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

