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
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden glass-strong rounded-3xl p-12 mb-12 border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-purple-500/20"></div>
          <div className="relative z-10">
            <h1 className="text-6xl font-black mb-3">
              <span className="gradient-text">Premium Shop</span>
            </h1>
            <p className="text-xl text-gray-300">
              Handcrafted pottery and curated plant accessories
            </p>
          </div>
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-black text-white">
                ✨ Featured Collection
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <h2 className="text-4xl font-black text-white mb-8">All Products</h2>
          
          {!products || products.length === 0 ? (
            <div className="glass-strong rounded-3xl border border-white/10 p-16 text-center">
              <div className="text-8xl mb-6">🏺</div>
              <p className="text-xl text-gray-300 mb-4">No products available yet.</p>
              <p className="text-sm text-gray-500">
                Run <code className="glass px-3 py-1 rounded-lg">npm run seed</code> to add sample products.
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
      className={`glass-strong rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border group ${
        featured ? 'border-emerald-500/50' : 'border-white/10 hover:border-emerald-500/30'
      }`}
    >
      {featured && (
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-4 py-2 text-center">
          ✨ FEATURED
        </div>
      )}
      
      <div className="p-6">
        {/* Placeholder Image */}
        <div className="relative w-full h-56 bg-gradient-to-br from-emerald-900/30 via-purple-900/20 to-cyan-900/30 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-white/10">
          <span className="text-7xl group-hover:scale-110 transition-transform">🏺</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {product.description || 'Beautiful handcrafted pottery'}
        </p>

        <div className="flex items-center justify-between">
          <div>
            {variants.length > 0 && (
              <p className="text-white font-bold text-lg">
                From ${(minPrice / 100).toFixed(2)}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {variants.length} {variants.length === 1 ? 'option' : 'options'}
            </p>
          </div>
          
          <span className="text-emerald-400 text-sm font-bold group-hover:translate-x-1 transition-transform inline-block">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

