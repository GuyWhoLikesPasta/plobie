import { createServerSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Browse beautiful handcrafted pottery and plant accessories. Find the perfect pot for your plants with QR-enabled tracking.',
  openGraph: {
    title: 'Shop',
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

// Category placeholder SVG - minimal pot icon
const PotIcon = () => (
  <svg
    className="w-16 h-16 text-stone-400 dark:text-stone-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 20h16v4H4zM6 20V10a4 4 0 014-4h4a4 4 0 014 4v10"
    />
  </svg>
);

interface SearchParams {
  category?: string;
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;
  const selectedCategory = params.category || 'all';

  // Build query
  let query = supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  // Filter by category if selected
  if (selectedCategory !== 'all') {
    query = query.eq('category', selectedCategory);
  }

  const { data: products } = await query;
  const typedProducts = (products || []) as Product[];

  // Get all products for category counts (unfiltered)
  const { data: allProducts } = await supabase.from('products').select('category');

  // Get unique categories with counts
  const categoryCounts: Record<string, number> = {};
  (allProducts || []).forEach(p => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });
  const categories = Object.keys(categoryCounts);

  // Get featured products (only from current selection)
  const featuredProducts = typedProducts.filter(p => p.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 sm:p-10 mb-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight text-stone-900 dark:text-white">
              Shop
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-lg">
              Beautiful pottery and plant accessories for your garden
            </p>
            <div className="flex flex-wrap gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2 bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-full px-4 py-2 text-stone-700 dark:text-stone-300">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Free shipping over $50</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-full px-4 py-2 text-stone-700 dark:text-stone-300">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <span>QR-enabled pots</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gift Card Banner */}
        <Link
          href="/shop/gift-cards"
          className="block mb-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow hover:border-green-600/30 dark:hover:border-green-600/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
                Gift a Green Thumb
              </span>
              <p className="text-stone-600 dark:text-stone-400 mt-1">
                Buy a $20 gift card, get $45 value — 125% bonus!
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <span className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium">
                Shop Gift Cards →
              </span>
            </div>
          </div>
        </Link>

        {/* Categories Filter */}
        <section className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <CategoryPill
              category="all"
              label="All Products"
              count={allProducts?.length || 0}
              active={selectedCategory === 'all'}
            />
            {categories.map(category => (
              <CategoryPill
                key={category}
                category={category}
                label={category.charAt(0).toUpperCase() + category.slice(1)}
                count={categoryCounts[category]}
                active={selectedCategory === category}
              />
            ))}
          </div>
        </section>

        {/* Featured Products (show only if not filtering by specific category) */}
        {featuredProducts.length > 0 && selectedCategory === 'all' && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-white">
                Featured Items
              </h2>
              <span className="text-sm text-stone-500 dark:text-stone-400">
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
            <h2 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-white">
              {selectedCategory === 'all'
                ? 'All Products'
                : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
            </h2>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {typedProducts.length} {typedProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {typedProducts.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center">
              <div className="mb-4 flex justify-center">
                <PotIcon />
              </div>
              <p className="text-stone-600 dark:text-stone-400 mb-4 text-lg">
                {selectedCategory !== 'all'
                  ? `No ${selectedCategory} products available yet.`
                  : 'No products available yet.'}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-500 mb-6">
                Check back soon for beautiful handcrafted items!
              </p>
              {selectedCategory !== 'all' && (
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  View all products
                </Link>
              )}
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
        <section className="mt-16 border-t border-stone-200 dark:border-stone-800 pt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="flex justify-center mb-2">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-white">Free Shipping</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">Orders over $50</p>
            </div>
            <div>
              <div className="flex justify-center mb-2">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-white">Secure Payment</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">Stripe powered</p>
            </div>
            <div>
              <div className="flex justify-center mb-2">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-white">Eco-Friendly</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">Sustainable materials</p>
            </div>
            <div>
              <div className="flex justify-center mb-2">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-white">Plant Lovers</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">Made with love</p>
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
  count,
  active,
}: {
  category: string;
  label: string;
  count: number;
  active?: boolean;
}) {
  const href = category === 'all' ? '/shop' : `/shop?category=${category}`;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-green-600 text-white shadow-md'
          : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-green-600/50'
      }`}
    >
      <span>{label}</span>
      <span
        className={`text-xs px-2 py-0.5 rounded-lg ${
          active
            ? 'bg-white/20 text-white'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
        }`}
      >
        {count}
      </span>
    </Link>
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
  const isOutOfStock = totalStock === 0 && variants.length > 0;

  return (
    <Link
      href={`/shop/${product.id}`}
      className={`group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden ${
        featured ? 'ring-2 ring-green-600 dark:ring-green-500' : ''
      } ${isOutOfStock ? 'opacity-75' : ''}`}
    >
      {/* Image Container */}
      <div className="relative">
        <div className="w-full aspect-[4/3] bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center overflow-hidden">
          <span className="group-hover:scale-105 transition-transform duration-300">
            <PotIcon />
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {featured && (
            <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-xl shadow">
              Featured
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-stone-500 text-white text-xs font-semibold px-3 py-1 rounded-xl shadow">
              Out of Stock
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="bg-amber-600 text-white text-xs font-semibold px-3 py-1 rounded-xl shadow">
              Low Stock
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold tracking-tight text-stone-800 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {product.name}
          </h3>
        </div>

        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">
          {product.description || 'Beautiful handcrafted pottery'}
        </p>

        <div className="flex items-end justify-between">
          <div>
            {variants.length > 0 ? (
              <>
                <p className="text-xl font-bold text-stone-900 dark:text-white">
                  ${(minPrice / 100).toFixed(2)}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-500">
                  {variants.length > 1 ? `From • ${variants.length} options` : 'Single option'}
                </p>
              </>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-500">Price TBD</p>
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
