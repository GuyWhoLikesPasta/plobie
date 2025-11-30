-- Fix order_items RLS - Allow users to insert their own order items

-- Check if the insert policy exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'order_items_insert_own'
    ) THEN
        CREATE POLICY "order_items_insert_own" ON public.order_items
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.orders
              WHERE orders.id = order_items.order_id
              AND orders.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Verify the policy exists
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename = 'order_items';

