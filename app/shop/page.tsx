import { createServerSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Browse beautiful handcrafted pottery and plant accessories. Find the perfect pot for your plants with QR-enabled tracking.',
  openGraph: {
    title: 'Shop | Plobie',
    description: 'Beautiful handcrafted pottery and plant accessories.',
    type: 'website',
  },
};

// Type definitions
interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price_cents: number;
  stock_qty: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  featured: boolean;
  variants: ProductVariant[];
}

// Category icons
const categoryIcons: Record<string, string> = {
  pottery: '🏺',
  planters: '🌱',
  accessories: '🧰',
  seeds: '🌻',
  tools: '🛠️',
  default: '🪴',
};

export default async function ShopPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all products with their variants
  const { data: products } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  const typedProducts = (products || []) as Product[];

  // Get featured products
  const featuredProducts = typedProducts.filter(p => p.featured).slice(0, 3);

  // Get unique categories
  const categories = [...new Set(typedProducts.map(p => p.category).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 rounded-2xl p-8 sm:p-10 mb-8 text-white shadow-xl">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">🛍️ Shop</h1>
            <p className="text-green-100 text-lg">
              Beautiful pottery and plant accessories for your garden
            </p>
            <div className="flex gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span>✓</span>
                <span>Free shipping over $50</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span>🪴</span>
                <span>QR-enabled pots</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-8">
            <div className="flex gap-3 overflow-x-auto pb-2">
              <CategoryPill category="all" label="All Products" active />
              {categories.map(category => (
                <CategoryPill
                  key={category}
                  category={category}
                  label={category.charAt(0).toUpperCase() + category.slice(1)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                ✨ Featured Items
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Hand-picked by our team
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Products</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {typedProducts.length} items
            </span>
          </div>

          {typedProducts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🏺</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                No products available yet.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Check back soon for beautiful handcrafted pottery!
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {typedProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Trust Badges */}
        <section className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🚚</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Free Shipping</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Orders over $50</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Secure Payment</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stripe powered</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🌿</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Eco-Friendly</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sustainable materials</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💚</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Plant Lovers</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Made with love</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CategoryPill({
  category,
  label,
  active,
}: {
  category: string;
  label: string;
  active?: boolean;
}) {
  const icon = categoryIcons[category.toLowerCase()] || categoryIcons.default;

  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-green-600 text-white'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ProductCard({ product, featured }: { product: Product; featured?: boolean }) {
  const variants = product.variants || [];
  const minPrice =
    variants.length > 0 ? Math.min(...variants.map((v: ProductVariant) => v.price_cents)) : 0;
  const totalStock = variants.reduce(
    (sum: number, v: ProductVariant) => sum + (v.stock_qty || 0),
    0
  );
  const isLowStock = totalStock > 0 && totalStock < 5;
  const categoryIcon =
    categoryIcons[product.category?.toLowerCase() || ''] || categoryIcons.default;

  return (
    <Link
      href={`/shop/${product.id}`}
      className={`group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-gray-900/50 transition-all duration-300 overflow-hidden ${
        featured ? 'ring-2 ring-green-500 dark:ring-green-400' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative">
        <div className="w-full aspect-[4/3] bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/50 dark:to-emerald-900/50 flex items-center justify-center overflow-hidden">
          <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
            {categoryIcon}
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {featured && (
            <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              ✨ Featured
            </span>
          )}
          {isLowStock && (
            <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              Low Stock
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {product.name}
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {product.description || 'Beautiful handcrafted pottery'}
        </p>

        <div className="flex items-end justify-between">
          <div>
            {variants.length > 0 ? (
              <>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${(minPrice / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {variants.length > 1 ? `From • ${variants.length} options` : 'Single option'}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-500">Price TBD</p>
            )}
          </div>

          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium group-hover:gap-2 transition-all">
            View
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
