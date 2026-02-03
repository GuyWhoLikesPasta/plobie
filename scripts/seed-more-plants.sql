-- ============================================
-- SEED MORE PLANTS
-- Expanding from 15 to 35+ species
-- Run in: https://supabase.com/dashboard/project/puhblesoxhizcfuubphh/sql/new
-- ============================================

INSERT INTO public.plants (key, name, category, description, care_difficulty, water_frequency, sunlight, icon, xp_reward, growth_stages, growth_time_hours) VALUES
  -- MORE SUCCULENTS
  ('succulent_string_pearls', 'String of Pearls', 'succulent', 'Trailing succulent with bead-like leaves. Perfect for hanging baskets.', 3, 'biweekly', 'partial', '📿', 150, 5, 360),
  ('succulent_burros_tail', 'Burro''s Tail', 'succulent', 'Cascading succulent with plump, blue-green leaves.', 2, 'biweekly', 'partial', '🌿', 120, 5, 300),
  ('succulent_zebra', 'Zebra Plant', 'succulent', 'Striking white stripes on dark green leaves.', 2, 'biweekly', 'partial', '🦓', 130, 5, 280),
  ('succulent_lithops', 'Living Stones', 'succulent', 'Unique stone-like succulents that blend with rocks.', 4, 'monthly', 'full', '🪨', 200, 4, 480),
  ('succulent_hens_chicks', 'Hens and Chicks', 'succulent', 'Clusters of rosettes that multiply over time.', 1, 'biweekly', 'full', '🐔', 80, 4, 240),
  
  -- MORE HERBS
  ('herb_lavender', 'Lavender', 'herb', 'Fragrant purple flowers, calming aroma. Great for teas.', 2, 'weekly', 'full', '💜', 120, 5, 300),
  ('herb_thyme', 'Thyme', 'herb', 'Versatile culinary herb with tiny leaves.', 2, 'weekly', 'full', '🌿', 90, 4, 180),
  ('herb_oregano', 'Oregano', 'herb', 'Classic Italian herb, robust flavor.', 2, 'weekly', 'full', '🍕', 90, 4, 180),
  ('herb_cilantro', 'Cilantro', 'herb', 'Fresh, citrusy flavor. Essential for salsas.', 2, 'daily', 'partial', '🥗', 70, 3, 120),
  ('herb_chives', 'Chives', 'herb', 'Mild onion flavor, pretty purple flowers.', 1, 'twice-weekly', 'partial', '🧅', 60, 4, 150),
  ('herb_sage', 'Sage', 'herb', 'Earthy, slightly peppery. Perfect for stuffing.', 2, 'weekly', 'full', '🍂', 100, 5, 210),
  ('herb_parsley', 'Parsley', 'herb', 'Versatile garnish and flavor enhancer.', 1, 'daily', 'partial', '🥬', 50, 3, 100),
  
  -- MORE FLOWERS
  ('flower_pothos', 'Golden Pothos', 'flower', 'Heart-shaped leaves, nearly indestructible.', 1, 'weekly', 'shade', '💛', 80, 5, 240),
  ('flower_snake_plant', 'Snake Plant', 'flower', 'Tall, sword-like leaves. Purifies air at night.', 1, 'biweekly', 'shade', '🐍', 100, 6, 400),
  ('flower_spider_plant', 'Spider Plant', 'flower', 'Arching leaves with baby plantlets.', 1, 'weekly', 'partial', '🕷️', 80, 5, 200),
  ('flower_anthurium', 'Anthurium', 'flower', 'Glossy red heart-shaped flowers.', 3, 'weekly', 'partial', '❤️', 180, 6, 360),
  ('flower_begonia', 'Begonia', 'flower', 'Colorful foliage and delicate blooms.', 3, 'twice-weekly', 'shade', '🌸', 140, 5, 280),
  ('flower_chrysanthemum', 'Chrysanthemum', 'flower', 'Fall favorite with pompom blooms.', 3, 'daily', 'full', '🌼', 160, 5, 250),
  ('flower_marigold', 'Marigold', 'flower', 'Bright orange/yellow pest-repelling blooms.', 1, 'daily', 'full', '🌻', 60, 4, 140),
  ('flower_zinnia', 'Zinnia', 'flower', 'Vibrant, long-lasting cut flowers.', 2, 'daily', 'full', '🎨', 100, 4, 160),
  
  -- MORE FERNS & FOLIAGE
  ('fern_birds_nest', 'Bird''s Nest Fern', 'fern', 'Wavy fronds emerging from a central rosette.', 2, 'twice-weekly', 'shade', '🪹', 130, 5, 260),
  ('fern_staghorn', 'Staghorn Fern', 'fern', 'Antler-shaped fronds, can be mounted on wood.', 4, 'weekly', 'partial', '🦌', 220, 6, 400),
  ('fern_asparagus', 'Asparagus Fern', 'fern', 'Feathery, delicate foliage. Not a true fern!', 2, 'twice-weekly', 'partial', '🌾', 100, 5, 220),
  ('foliage_calathea', 'Calathea', 'fern', 'Stunning patterned leaves that move with light.', 4, 'twice-weekly', 'shade', '🎭', 200, 6, 350),
  ('foliage_monstera', 'Monstera', 'fern', 'Iconic split leaves, Instagram famous.', 3, 'weekly', 'partial', '🌴', 250, 8, 500),
  ('foliage_philodendron', 'Philodendron', 'fern', 'Heart-shaped leaves, easy trailing vine.', 2, 'weekly', 'partial', '💚', 120, 5, 280),
  
  -- MORE TREES & PALMS
  ('tree_rubber', 'Rubber Plant', 'tree', 'Glossy dark leaves, air purifying champion.', 2, 'weekly', 'partial', '🌳', 180, 7, 550),
  ('tree_fiddle_leaf', 'Fiddle Leaf Fig', 'tree', 'Large violin-shaped leaves, design statement.', 5, 'weekly', 'partial', '🎻', 400, 8, 650),
  ('tree_dracaena', 'Dracaena', 'tree', 'Striking sword-like leaves, easy care tree.', 2, 'biweekly', 'partial', '⚔️', 150, 6, 450),
  ('palm_parlor', 'Parlor Palm', 'tree', 'Elegant, compact palm for low light.', 2, 'weekly', 'shade', '🌴', 140, 6, 400),
  ('palm_areca', 'Areca Palm', 'tree', 'Feathery fronds, natural humidifier.', 3, 'twice-weekly', 'partial', '🏝️', 180, 7, 480),
  ('tree_norfolk_pine', 'Norfolk Island Pine', 'tree', 'Mini Christmas tree all year round.', 3, 'weekly', 'partial', '🎄', 200, 8, 600),
  
  -- VEGETABLES (Bonus category)
  ('veggie_tomato', 'Cherry Tomato', 'herb', 'Sweet bite-sized tomatoes. Harvest frequently!', 3, 'daily', 'full', '🍅', 180, 6, 280),
  ('veggie_pepper', 'Bell Pepper', 'herb', 'Colorful, crunchy peppers for salads.', 3, 'daily', 'full', '🫑', 200, 6, 320),
  ('veggie_lettuce', 'Butterhead Lettuce', 'herb', 'Soft, sweet salad greens. Fast growing!', 2, 'daily', 'partial', '🥬', 60, 3, 90)
ON CONFLICT (key) DO NOTHING;

-- Verify count
SELECT COUNT(*) as total_plants, 
       COUNT(DISTINCT category) as categories
FROM public.plants;
