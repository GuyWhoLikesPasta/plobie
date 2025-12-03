import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/shop/AddToCartButton';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants(*)
    `)
    .eq('id', id)
    .single();

  if (!product) {
    notFound();
  }

  const variants = product.variants || [];

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 max-w-7xl">
        <div className="glass-strong rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
            {/* Product Image */}
            <div>
              <div className="relative w-full aspect-square bg-gradient-to-br from-emerald-900/30 via-purple-900/20 to-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 border border-white/10 overflow-hidden">
                <span className="text-9xl md:text-[12rem]">🏺</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              {product.featured && (
                <div className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                  ✨ Featured Product
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
                {product.name}
              </h1>

              <p className="text-gray-300 mb-8 leading-relaxed text-lg">
                {product.description || 'Beautiful handcrafted pottery for your plants'}
              </p>

              {/* Variants */}
              {variants.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Available Options
                    </h3>
                    <div className="space-y-3">
                      {variants.map((variant: any) => (
                        <VariantOption key={variant.id} variant={variant} />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <AddToCartButton variants={variants} productName={product.name} />
                  </div>
                </div>
              ) : (
                <div className="glass border border-amber-500/30 rounded-xl p-6">
                  <p className="text-amber-400 text-sm font-medium">
                    No variants available for this product yet.
                  </p>
                </div>
              )}

              {/* Product Features */}
              <div className="mt-8 border-t border-white/10 pt-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Features
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <span className="text-emerald-400 mr-3 text-xl">✓</span>
                    Handcrafted with care
                  </li>
                  <li className="flex items-center">
                    <span className="text-emerald-400 mr-3 text-xl">✓</span>
                    Drainage hole included
                  </li>
                  <li className="flex items-center">
                    <span className="text-emerald-400 mr-3 text-xl">✓</span>
                    Perfect for indoor plants
                  </li>
                  <li className="flex items-center">
                    <span className="text-emerald-400 mr-3 text-xl">✓</span>
                    QR code for digital garden
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VariantOption({ variant }: { variant: any }) {
  const isInStock = variant.stock_qty > 0;

  return (
    <div className={`glass rounded-xl p-6 border transition-all ${isInStock ? 'border-white/10 hover:border-emerald-500/50' : 'border-white/5 opacity-50'}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="font-bold text-white text-lg">
              {variant.size && <span className="capitalize">{variant.size}</span>}
              {variant.size && variant.color && ' - '}
              {variant.color && <span className="capitalize">{variant.color}</span>}
            </h4>
            {!isInStock && (
              <span className="text-xs glass px-3 py-1 rounded-full text-gray-500 font-bold border border-white/10">
                Out of Stock
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-mono">SKU: {variant.sku}</p>
          {isInStock && (
            <p className="text-xs text-gray-400 mt-2">
              {variant.stock_qty} in stock
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl md:text-4xl font-black text-white">
            ${(variant.price_cents / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
