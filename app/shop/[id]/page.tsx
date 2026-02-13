import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AddToCartButton from '@/components/shop/AddToCartButton';
import { Metadata } from 'next';

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('id', id)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.name,
    description:
      product.description || `Shop ${product.name} at Plobie - Beautiful handcrafted pottery`,
    openGraph: {
      title: product.name,
      description: product.description || `Shop ${product.name} at Plobie`,
      type: 'website',
    },
  };
}

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
  featured: boolean;
  variants: ProductVariant[];
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: product } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('id', id)
    .single();

  if (!product) {
    notFound();
  }

  const typedProduct = product as Product;
  const variants = typedProduct.variants || [];
  const totalStock = variants.reduce(
    (sum: number, v: ProductVariant) => sum + (v.stock_qty || 0),
    0
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <li>
              <Link
                href="/shop"
                className="hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Shop
              </Link>
            </li>
            <li className="text-stone-400 dark:text-stone-600">/</li>
            <li className="text-stone-900 dark:text-white font-medium truncate">
              {typedProduct.name}
            </li>
          </ol>
        </nav>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Product Image */}
              <div className="relative bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/30 p-8 flex items-center justify-center min-h-[400px]">
                <span className="text-[12rem] opacity-90">🏺</span>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {typedProduct.featured && (
                    <span className="bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                      Featured Product
                    </span>
                  )}
                  {totalStock > 0 && totalStock < 10 && (
                    <span className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                      Only {totalStock} left!
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 sm:p-8 lg:p-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white mb-4 tracking-tight">
                  {typedProduct.name}
                </h1>

                <p className="text-stone-600 dark:text-stone-400 mb-6 leading-relaxed text-lg">
                  {typedProduct.description || 'Beautiful handcrafted pottery for your plants'}
                </p>

                {/* Variants */}
                {variants.length > 0 ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
                        Available Options
                      </h3>
                      <div className="space-y-3">
                        {variants.map((variant: ProductVariant) => (
                          <VariantOption key={variant.id} variant={variant} />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-stone-200 dark:border-stone-800 pt-6">
                      <AddToCartButton variants={variants} productName={typedProduct.name} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      No variants available for this product yet.
                    </p>
                  </div>
                )}

                {/* Product Features */}
                <div className="mt-8 border-t border-stone-200 dark:border-stone-800 pt-6">
                  <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
                    Why You&apos;ll Love It
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FeatureItem icon="✓" text="Handcrafted with care" />
                    <FeatureItem icon="✓" text="Drainage hole included" />
                    <FeatureItem icon="✓" text="Perfect for indoors" />
                    <FeatureItem icon="✓" text="QR code for digital garden" />
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-green-700 dark:text-green-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-300">
                        Free Shipping
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        On orders over $50
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Shop */}
          <div className="mt-8 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function VariantOption({ variant }: { variant: ProductVariant }) {
  const isInStock = variant.stock_qty > 0;

  return (
    <div
      className={`border rounded-xl p-4 transition-colors ${
        isInStock
          ? 'border-stone-200 dark:border-stone-700 hover:border-green-400 dark:hover:border-green-600'
          : 'border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-stone-900 dark:text-white">
              {variant.size && <span className="capitalize">{variant.size}</span>}
              {variant.size && variant.color && ' - '}
              {variant.color && <span className="capitalize">{variant.color}</span>}
            </h4>
            {!isInStock && (
              <span className="text-xs bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 px-2 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-500">SKU: {variant.sku}</p>
          {isInStock && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {variant.stock_qty} in stock
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-stone-900 dark:text-white">
            ${(variant.price_cents / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
      <span className="text-green-600 dark:text-green-400">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}
