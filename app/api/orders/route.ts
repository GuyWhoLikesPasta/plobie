import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ErrorCodes } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get orders with items
    const {
      data: orders,
      error,
      count,
    } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.DATABASE_ERROR, message: 'Failed to fetch orders' },
        },
        { status: 500 }
      );
    }

    // Enrich with order items
    if (orders && orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id);

      const { data: items } = await supabase
        .from('order_items')
        .select('*, product_variants:variant_id(*, products:product_id(name, description))')
        .in('order_id', orderIds);

      // Map items to orders
      const itemsByOrder = (items || []).reduce((acc: Record<string, any[]>, item: any) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});

      orders.forEach((order: any) => {
        order.items = itemsByOrder[order.id] || [];
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: orders || [],
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
