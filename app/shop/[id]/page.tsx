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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Product Image */}
              <div>
                <div className="w-full aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-9xl">🏺</span>
                </div>
                
                {product.featured && (
                  <div className="inline-block bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                    ✨ Featured Product
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description || 'Beautiful handcrafted pottery for your plants'}
                </p>

                {/* Variants */}
                {variants.length > 0 ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Available Options
                      </h3>
                      <div className="space-y-3">
                        {variants.map((variant: any) => (
                          <VariantOption key={variant.id} variant={variant} />
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <AddToCartButton variants={variants} productName={product.name} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      No variants available for this product yet.
                    </p>
                  </div>
                )}

                {/* Product Features */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Features
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Handcrafted with care
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Drainage hole included
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Perfect for indoor plants
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      QR code for digital garden
                    </li>
                  </ul>
                </div>
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
    <div className={`border rounded-lg p-4 ${isInStock ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900">
              {variant.size && <span className="capitalize">{variant.size}</span>}
              {variant.size && variant.color && ' - '}
              {variant.color && <span className="capitalize">{variant.color}</span>}
            </h4>
            {!isInStock && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                Out of Stock
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
          {isInStock && (
            <p className="text-xs text-gray-500 mt-1">
              {variant.stock_qty} in stock
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            ${(variant.price_cents / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

