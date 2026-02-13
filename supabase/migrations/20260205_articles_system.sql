-- ============================================
-- Articles System Migration
-- Created: 2026-02-05
-- ============================================

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📖',
  difficulty TEXT NOT NULL DEFAULT 'Beginner'
    CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  read_time TEXT NOT NULL DEFAULT '5 min read',
  xp_reward INTEGER NOT NULL DEFAULT 10,
  content_html TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_category_published ON articles(category, published);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public read access to published articles
CREATE POLICY "Anyone can read published articles"
  ON articles FOR SELECT
  USING (published = true);

-- Admin write access
CREATE POLICY "Admins can insert articles"
  ON articles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update articles"
  ON articles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete articles"
  ON articles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================
-- Seed 24 articles with real content
-- ============================================

INSERT INTO articles (slug, title, category, description, icon, difficulty, read_time, xp_reward, content_html) VALUES

-- 1
('indoor-plant-care', 'Complete Guide to Indoor Plant Care', 'Indoor Plants',
 'Learn the fundamentals of keeping your indoor plants healthy and thriving.',
 '🪴', 'Beginner', '8 min read', 10,
 '<h2>Getting Started with Indoor Plants</h2><p>Indoor plants transform any space into a living, breathing environment. Whether you are a first-time plant parent or expanding your collection, understanding a few core principles will set you up for success.</p><h2>Light Requirements</h2><p>Most indoor plants thrive in bright, indirect light. Place them near east- or north-facing windows where they receive gentle morning sun without harsh afternoon rays. Low-light tolerant plants like pothos, snake plants, and ZZ plants can handle darker corners.</p><h2>Watering Best Practices</h2><ul><li>Check the top inch of soil before watering — if it is dry, water thoroughly.</li><li>Use room-temperature water to avoid shocking roots.</li><li>Empty saucers after 30 minutes to prevent root rot.</li><li>Most plants prefer to dry out slightly between waterings.</li></ul><h2>Humidity and Temperature</h2><p>Tropical plants enjoy 50-70% humidity. Group plants together, use a pebble tray, or run a humidifier during dry winter months. Keep plants away from heating vents and cold drafts — a stable temperature between 60-75°F (15-24°C) is ideal.</p><h2>Soil and Fertilizing</h2><p>Use a well-draining potting mix appropriate for your plant type. Feed with a balanced liquid fertilizer at half strength during the growing season (spring through early fall). Reduce feeding in winter when growth naturally slows.</p>'),

-- 2
('succulent-cacti-care', 'Succulent & Cacti Care 101', 'Succulents',
 'Everything you need to know about watering, sunlight, and soil for succulents.',
 '🌵', 'Beginner', '6 min read', 10,
 '<h2>Why Succulents Are Perfect for Beginners</h2><p>Succulents store water in their thick, fleshy leaves, making them incredibly forgiving plants. They thrive on neglect — overwatering is the number one killer, not under-watering.</p><h2>Sunlight Needs</h2><p>Most succulents want at least 6 hours of bright, indirect light daily. South-facing windowsills are ideal. If leaves start stretching toward the light (etiolation), move them closer to a window or supplement with a grow light.</p><h2>The Soak-and-Dry Method</h2><ul><li>Water deeply until it drains out the bottom.</li><li>Let the soil dry completely before watering again — typically every 7-14 days.</li><li>In winter, cut back to once every 3-4 weeks.</li><li>Never let succulents sit in standing water.</li></ul><h2>Soil Mix</h2><p>Use a fast-draining cactus and succulent mix. You can make your own by combining regular potting soil with perlite and coarse sand in equal parts. Good drainage prevents root rot, which is the most common cause of succulent death.</p><h2>Common Varieties to Start With</h2><p>Echeveria, Haworthia, Sempervivum (hens and chicks), Jade Plant, and Aloe Vera are all excellent choices for beginners. They are resilient, widely available, and come in beautiful forms and colors.</p>'),

-- 3
('growing-herbs-indoors', 'Growing Herbs Indoors Year-Round', 'Herbs & Edibles',
 'A practical guide to growing fresh herbs in your kitchen all year.',
 '🌿', 'Intermediate', '7 min read', 10,
 '<h2>Fresh Herbs at Your Fingertips</h2><p>Growing herbs indoors means you always have fresh basil, mint, cilantro, and more within arm''s reach. With the right setup, you can harvest year-round regardless of the weather outside.</p><h2>Best Herbs for Indoor Growing</h2><ul><li><strong>Basil:</strong> Loves warmth and 6-8 hours of light. Pinch flowers to keep leaves producing.</li><li><strong>Mint:</strong> Vigorous grower — keep in its own pot so it does not take over.</li><li><strong>Cilantro:</strong> Prefers cooler temps. Sow new seeds every 3 weeks for continuous harvest.</li><li><strong>Rosemary:</strong> Needs bright light and good air circulation.</li><li><strong>Chives:</strong> Hardy and easy. Cut from the outside in.</li></ul><h2>Light and Location</h2><p>Herbs need a minimum of 6 hours of direct sunlight. A south-facing kitchen window works best. If natural light is limited, use a full-spectrum LED grow light positioned 6-12 inches above the plants for 12-16 hours daily.</p><h2>Watering and Feeding</h2><p>Keep soil consistently moist but not soggy. Herbs in small pots may need water every 2-3 days. Feed monthly with a diluted organic liquid fertilizer — herbs do not need heavy feeding.</p><h2>Harvesting Tips</h2><p>Regular harvesting encourages bushier growth. Never remove more than one-third of the plant at a time. Cut stems just above a leaf node to promote branching.</p>'),

-- 4
('orchid-care-mastery', 'Orchid Care Mastery', 'Orchids',
 'Master the art of keeping orchids blooming with this comprehensive guide.',
 '🌸', 'Advanced', '10 min read', 15,
 '<h2>Understanding Orchids</h2><p>Orchids are one of the largest flowering plant families with over 25,000 species. Phalaenopsis (moth orchids) are the most popular houseplant variety — they are beautiful, long-blooming, and more forgiving than their reputation suggests.</p><h2>Light and Temperature</h2><p>Orchids prefer bright, indirect light. An east-facing window is ideal. Phalaenopsis enjoy daytime temperatures of 70-80°F and a 10-15 degree drop at night, which actually helps trigger blooming.</p><h2>Watering Orchids Correctly</h2><ul><li>Water once a week by running water through the bark mix for 15-20 seconds.</li><li>Never let water pool in the crown — this causes crown rot.</li><li>Orchid roots should be silvery-green (dry) before watering. Green roots mean they still have moisture.</li><li>Ice cube watering is a myth — use room temperature water.</li></ul><h2>Potting Media</h2><p>Orchids grow in bark, sphagnum moss, or a mix of both — never regular potting soil. Repot every 1-2 years when the bark begins to decompose and compact. Use a clear pot so you can monitor root health.</p><h2>Encouraging Reblooming</h2><p>After flowers drop, cut the spike above the second node from the bottom. Provide a month of cooler nighttime temperatures (55-65°F) and reduce watering slightly to trigger a new bloom cycle. Patience is key — it can take 2-3 months.</p>'),

-- 5
('bonsai-basics', 'Bonsai Basics for Beginners', 'Bonsai',
 'Start your bonsai journey with this beginner-friendly introduction.',
 '🌳', 'Intermediate', '12 min read', 15,
 '<h2>What Is Bonsai?</h2><p>Bonsai is the art of growing miniature trees in containers. It is not a species of tree — virtually any tree can become bonsai with proper training. The practice originated in China over a thousand years ago and was refined in Japan into the art form we know today.</p><h2>Choosing Your First Tree</h2><ul><li><strong>Ficus:</strong> Excellent for indoor bonsai. Tolerates low light and dry air.</li><li><strong>Chinese Elm:</strong> Forgiving, fast-growing, beautiful bark texture.</li><li><strong>Juniper:</strong> Classic outdoor bonsai. Needs full sun and outdoor conditions.</li><li><strong>Jade:</strong> Succulent bonsai — drought tolerant and easy to style.</li></ul><h2>Basic Care</h2><p>Water when the top of the soil feels slightly dry. Bonsai in small pots may need daily watering in summer. Place outdoor bonsai in full sun; indoor bonsai near the brightest window. Feed every two weeks during the growing season with a balanced bonsai fertilizer.</p><h2>Pruning and Shaping</h2><p>Regular pruning keeps your bonsai in shape. Maintenance pruning removes new growth to maintain the design. Structural pruning shapes the trunk and main branches — do this in late winter when the tree is dormant.</p><h2>Common Mistakes</h2><p>Keeping outdoor species indoors, overwatering, using the wrong soil, and pruning too aggressively are the most common beginner mistakes. Start simple, observe your tree daily, and let it teach you what it needs.</p>'),

-- 6
('propagation-techniques', 'Propagation Techniques That Always Work', 'Propagation',
 'Learn foolproof methods for propagating your favorite plants.',
 '🌱', 'Beginner', '9 min read', 10,
 '<h2>Why Propagate?</h2><p>Propagation lets you multiply your plant collection for free, share with friends, and rescue leggy plants. The three most common methods for houseplants are stem cuttings, leaf cuttings, and division.</p><h2>Stem Cuttings</h2><ul><li>Cut a 4-6 inch section below a node (the bump where leaves grow).</li><li>Remove bottom leaves, leaving 2-3 at the top.</li><li>Place in water or moist soil. Roots appear in 2-4 weeks.</li><li>Works great for: Pothos, Philodendron, Monstera, Tradescantia.</li></ul><h2>Leaf Cuttings</h2><p>Some plants can grow entirely new plants from a single leaf. Place a succulent leaf on dry soil and mist occasionally. For African Violets, insert the leaf stem into moist soil at a 45-degree angle. New plantlets emerge in 4-8 weeks.</p><h2>Division</h2><p>Plants that grow in clumps — like snake plants, peace lilies, and ferns — can be divided. Remove the plant from its pot, gently separate root sections, and repot each division into its own container with fresh soil.</p><h2>Tips for Success</h2><ul><li>Use clean, sharp scissors or pruners.</li><li>Keep cuttings in warm, bright (not direct sun) locations.</li><li>Change water every few days to prevent bacteria.</li><li>Be patient — some plants root faster than others.</li></ul>'),

-- 7
('plant-lighting-needs', 'Understanding Plant Lighting Needs', 'Indoor Plants',
 'Decode light requirements and find the perfect spot for every plant.',
 '☀️', 'Beginner', '7 min read', 10,
 '<h2>Why Light Matters</h2><p>Light is the primary energy source for plants through photosynthesis. Getting light right is the single most important factor in keeping your plants alive. Too little light causes stretching and weak growth; too much causes scorching.</p><h2>Light Level Categories</h2><ul><li><strong>Bright direct:</strong> 4+ hours of direct sun hitting leaves (south/west windows). Best for: cacti, succulents, herbs.</li><li><strong>Bright indirect:</strong> Near a sunny window but shielded from direct rays. Best for: Monstera, Fiddle Leaf Fig, most tropical plants.</li><li><strong>Medium light:</strong> A few feet from a window or a north-facing window. Best for: Pothos, Dracaena, Peace Lily.</li><li><strong>Low light:</strong> Far from windows, hallways, bathrooms. Best for: Snake Plant, ZZ Plant, Cast Iron Plant.</li></ul><h2>Reading Your Space</h2><p>Hold your hand between the window and where you want to place your plant. A sharp, defined shadow means bright light. A soft, blurry shadow means medium light. No visible shadow means low light.</p><h2>Grow Lights</h2><p>If natural light is insufficient, full-spectrum LED grow lights are an affordable solution. Position them 12-18 inches above plants and run for 12-16 hours daily. They use minimal electricity and can completely substitute for natural light.</p>'),

-- 8
('watering-101', 'Watering 101: When and How Much', 'Indoor Plants',
 'Master the most common cause of plant problems with proper watering techniques.',
 '💧', 'Beginner', '6 min read', 10,
 '<h2>The Number One Plant Killer</h2><p>Overwatering causes more houseplant deaths than any other factor. Root rot from soggy soil suffocates roots and invites fungal disease. Learning when and how to water is the most impactful skill you can develop.</p><h2>The Finger Test</h2><p>Stick your finger one inch into the soil. If it feels dry, water. If moist, wait a day or two and check again. For succulents, wait until the soil is completely dry throughout the pot.</p><h2>How to Water Properly</h2><ul><li>Water slowly and thoroughly until it flows from the drainage holes.</li><li>Use room-temperature water — cold water shocks tropical roots.</li><li>Water the soil, not the leaves, to prevent fungal issues.</li><li>Empty saucers after 30 minutes to prevent root rot.</li></ul><h2>Signs of Overwatering vs. Underwatering</h2><p><strong>Overwatering:</strong> Yellow leaves, mushy stems, fungus gnats, moldy soil surface, rotten smell. <strong>Underwatering:</strong> Crispy leaf edges, wilting, dry and pulling-away soil, lightweight pot.</p><h2>Seasonal Adjustments</h2><p>Plants drink more in spring and summer when actively growing. Reduce watering frequency by 30-50% in fall and winter. Heating in winter dries air but plants grow slower, so check soil moisture rather than following a fixed schedule.</p>'),

-- 9
('repotting-guide', 'Repotting Your Plants: A Step-by-Step Guide', 'Indoor Plants',
 'Know when and how to repot for healthier, happier plants.',
 '🏺', 'Intermediate', '8 min read', 10,
 '<h2>When to Repot</h2><ul><li>Roots growing out of drainage holes or circling on the surface.</li><li>Water runs straight through without being absorbed.</li><li>Plant is top-heavy and tipping over.</li><li>Growth has stalled despite proper care.</li><li>It has been more than 2 years in the same pot.</li></ul><h2>Choosing the Right Pot</h2><p>Go up only one pot size (1-2 inches larger in diameter). Too large a pot holds excess moisture that can cause root rot. Always use pots with drainage holes. Terracotta is great for plants that like to dry out; plastic retains moisture longer.</p><h2>Step-by-Step Repotting</h2><ul><li>Water your plant a day before repotting to reduce stress.</li><li>Gently remove from the old pot — squeeze plastic pots or run a knife around terracotta.</li><li>Loosen the rootball and trim any dead or circling roots.</li><li>Add fresh potting mix to the new pot (about one-third full).</li><li>Place the plant at the same depth as before and fill around with soil.</li><li>Water thoroughly and place in shade for a few days to recover.</li></ul><h2>Best Time to Repot</h2><p>Spring is ideal — plants are entering their active growth phase and recover fastest. Avoid repotting in winter when growth is dormant, unless the situation is urgent (root rot, severe root-binding).</p>'),

-- 10
('common-pests', 'Common Pests and How to Fight Them', 'Indoor Plants',
 'Identify and eliminate spider mites, mealybugs, fungus gnats, and more.',
 '🐛', 'Intermediate', '10 min read', 10,
 '<h2>Prevention Is Key</h2><p>Inspect new plants before bringing them home. Quarantine newcomers for 2 weeks. Healthy plants resist pests better, so proper watering, light, and feeding are your first line of defense.</p><h2>Spider Mites</h2><p>Tiny, nearly invisible pests that spin fine webs on leaf undersides. They thrive in dry conditions. Treatment: Spray with a mix of water and a few drops of dish soap. Increase humidity. Neem oil is effective for persistent infestations.</p><h2>Mealybugs</h2><p>White, cottony clusters usually found in leaf joints and on stems. Dab individual bugs with rubbing alcohol on a cotton swab. For larger infestations, spray with neem oil solution weekly until clear.</p><h2>Fungus Gnats</h2><ul><li>Small flies hovering around soil — larvae feed on roots.</li><li>Let soil dry completely between waterings to break their lifecycle.</li><li>Use yellow sticky traps to catch adults.</li><li>Add a layer of sand or diatomaceous earth on the soil surface.</li></ul><h2>Scale Insects</h2><p>Brown, shell-like bumps on stems and leaves. Scrape off with a fingernail or old toothbrush. Apply rubbing alcohol or neem oil to affected areas. Scale can be persistent — check weekly for a month after treatment.</p><h2>General Treatment Protocol</h2><p>Isolate the affected plant immediately. Remove heavily infested leaves. Apply treatment weekly for at least 3 weeks to catch all life cycle stages. Always treat the undersides of leaves where pests hide.</p>'),

-- 11
('perfect-soil-mix', 'Creating the Perfect Soil Mix', 'Indoor Plants',
 'Learn to customize soil for different plant types and drainage needs.',
 '🪨', 'Intermediate', '7 min read', 10,
 '<h2>Why Soil Matters</h2><p>The right soil mix provides three things: structure for roots to anchor, moisture retention for hydration, and drainage so roots can breathe. Store-bought mixes work, but customizing your own gives your plants exactly what they need.</p><h2>Key Ingredients</h2><ul><li><strong>Potting soil:</strong> The base — provides nutrients and moisture retention.</li><li><strong>Perlite:</strong> White, lightweight volcanic glass. Improves drainage and aeration.</li><li><strong>Orchid bark:</strong> Chunky pieces that create air pockets for root health.</li><li><strong>Pumice:</strong> Like perlite but heavier — does not float to the surface.</li><li><strong>Coco coir:</strong> Sustainable peat alternative. Retains moisture without compacting.</li><li><strong>Vermiculite:</strong> Holds moisture — good for thirsty plants.</li></ul><h2>Recipes by Plant Type</h2><p><strong>Aroids (Monstera, Philodendron):</strong> 40% potting soil, 30% perlite, 20% orchid bark, 10% charcoal. <strong>Succulents:</strong> 50% potting soil, 25% perlite, 25% coarse sand. <strong>Ferns:</strong> 50% potting soil, 25% coco coir, 25% perlite.</p><h2>Signs of Wrong Soil</h2><p>Water sitting on the surface for more than a few seconds means poor drainage. Soil pulling away from pot edges means too much peat. Compacted, heavy soil means not enough aeration amendments. Adjust your mix accordingly.</p>'),

-- 12
('fertilizing-fundamentals', 'Fertilizing Fundamentals', 'Indoor Plants',
 'When, what, and how much to feed your plants for optimal growth.',
 '🧪', 'Beginner', '6 min read', 10,
 '<h2>Do Plants Need Fertilizer?</h2><p>Potting soil nutrients deplete over time. Fertilizing replaces essential minerals — nitrogen for leaf growth, phosphorus for roots and flowers, and potassium for overall health. Think of it as vitamins for your plants.</p><h2>Types of Fertilizer</h2><ul><li><strong>Liquid:</strong> Mix with water and apply every 2-4 weeks. Easy to control dosage.</li><li><strong>Slow-release granules:</strong> Sprinkle on soil surface. Feeds for 2-3 months.</li><li><strong>Organic:</strong> Fish emulsion, worm castings, compost tea. Gentler, harder to over-apply.</li></ul><h2>The Golden Rule: Less Is More</h2><p>Always dilute liquid fertilizer to half the recommended strength. Over-fertilizing causes salt buildup, burned roots, and crispy leaf edges — symptoms that look like underwatering but are actually chemical burn.</p><h2>When to Fertilize</h2><p>Feed during the growing season: March through September. Reduce to monthly in fall. Stop completely in winter when most houseplants are dormant. Always water before fertilizing — never apply to dry soil.</p><h2>Reading the Numbers</h2><p>Fertilizer labels show N-P-K ratios (e.g., 10-10-10). For general houseplants, a balanced ratio works well. Flowering plants benefit from higher phosphorus (middle number). Foliage plants prefer higher nitrogen (first number).</p>'),

-- 13
('rare-succulents', 'Rare Succulents Worth Collecting', 'Succulents',
 'Discover unique and beautiful succulents to add to your collection.',
 '💎', 'Intermediate', '8 min read', 10,
 '<h2>The World of Rare Succulents</h2><p>Beyond the common varieties at garden centers lies a fascinating world of rare and unusual succulents. Collecting rare species is rewarding, but these plants often require more specific care than their common cousins.</p><h2>Standout Species</h2><ul><li><strong>Echeveria ''Lola'':</strong> Pearly lavender-pink rosettes. Compact and elegant.</li><li><strong>Lithops (Living Stones):</strong> Mimics pebbles. Fascinating minimal watering needs.</li><li><strong>Haworthia cooperi:</strong> Translucent, jelly-like leaf tips that glow in sunlight.</li><li><strong>Pachyphytum oviferum (Moonstones):</strong> Plump, pastel purple-pink leaves.</li><li><strong>Crassula ''Buddha''s Temple'':</strong> Stacked square leaves forming a column.</li></ul><h2>Where to Find Rare Succulents</h2><p>Specialty nurseries, plant swaps, online sellers (Etsy, rare plant shops), and succulent society sales are the best sources. Avoid purchasing unrooted cuttings from overseas that may carry pests or diseases.</p><h2>Care Considerations</h2><p>Rare succulents often have slower growth rates and specific light needs. Many prefer less direct sun than common varieties. Research each species individually — what works for Echeveria may stress a Lithops. Start with moderately rare species before investing in expensive specimens.</p>'),

-- 14
('succulent-arrangements', 'Succulent Arrangements and Displays', 'Succulents',
 'Create stunning arrangements that showcase your succulents beautifully.',
 '🎨', 'Beginner', '7 min read', 10,
 '<h2>Planning Your Arrangement</h2><p>A beautiful succulent arrangement combines different heights, textures, and colors. Use a mix of rosette shapes, trailing varieties, and upright growers for visual interest.</p><h2>Choosing a Container</h2><p>Shallow, wide containers work best for succulents. Terracotta bowls, wooden boxes, ceramic planters, and even teacups make creative homes. The only requirement is drainage — drill holes if needed or use a gravel layer at the bottom.</p><h2>Design Principles</h2><ul><li><strong>Thriller:</strong> A tall, eye-catching plant in the center or back (e.g., Aeonium, tall Echeveria).</li><li><strong>Filler:</strong> Medium-sized plants that fill the space (e.g., Sedum, Haworthia).</li><li><strong>Spiller:</strong> Trailing plants for the edges (e.g., String of Pearls, Burro''s Tail).</li></ul><h2>Planting Tips</h2><p>Fill the container with well-draining cactus mix. Arrange plants while still in their nursery pots first to test the layout. Once satisfied, plant from largest to smallest. Top-dress with decorative gravel or sand for a polished look.</p><h2>Maintaining Your Arrangement</h2><p>Water less frequently than individual pots — arrangements have less soil per plant. Remove any dead leaves immediately to prevent rot. Rotate the arrangement weekly so all sides receive even light.</p>'),

-- 15
('winter-succulent-care', 'Winter Care for Succulents', 'Succulents',
 'Help your succulents survive and thrive through the cold months.',
 '❄️', 'Intermediate', '5 min read', 10,
 '<h2>Winter Changes</h2><p>Succulents enter a dormancy period in winter, slowing growth significantly. Shorter days and lower temperatures mean your care routine needs to shift accordingly.</p><h2>Watering in Winter</h2><p>Reduce watering to once every 3-4 weeks. The combination of slower growth and lower evaporation means soil stays moist much longer. Overwatering in winter is the leading cause of succulent death.</p><h2>Light Concerns</h2><ul><li>Move succulents to the brightest window available — south-facing is best.</li><li>Consider a grow light if natural light drops below 4-5 hours daily.</li><li>Some stretching is normal and can be corrected in spring.</li></ul><h2>Temperature</h2><p>Most common succulents tolerate 50-55°F at night but suffer below 40°F. Keep them away from cold window panes and drafts. If outdoor succulents experience frost, bring them inside or cover with frost cloth.</p><h2>Do Not Fertilize</h2><p>Stop all fertilizing from November through February. Feeding dormant plants causes weak, stretched growth and can damage roots. Resume feeding at half strength when you see new growth in spring.</p>'),

-- 16
('container-tomatoes', 'Growing Tomatoes in Containers', 'Herbs & Edibles',
 'Fresh tomatoes from your balcony or patio with container gardening.',
 '🍅', 'Intermediate', '9 min read', 10,
 '<h2>Container Tomatoes Are Easier Than You Think</h2><p>You do not need a yard to grow delicious tomatoes. A sunny balcony or patio with containers and good soil can yield impressive harvests all summer long.</p><h2>Choosing Varieties</h2><ul><li><strong>Cherry tomatoes:</strong> Compact, prolific, and perfect for containers. Try Sweet Million or Sun Gold.</li><li><strong>Determinate varieties:</strong> Bush-type that stay compact. Roma, Patio Princess, and Bush Early Girl work well.</li><li><strong>Avoid:</strong> Large indeterminate varieties that grow 6+ feet — they are harder to manage in pots.</li></ul><h2>Container Size</h2><p>Use at least a 5-gallon pot (10-gallon is better) for each plant. Fabric grow bags are excellent — they air-prune roots and prevent circling. Ensure multiple drainage holes at the bottom.</p><h2>Soil and Feeding</h2><p>Use high-quality potting mix enriched with compost. Tomatoes are heavy feeders — apply a balanced tomato fertilizer every 2 weeks once flowering begins. Add calcium (crushed eggshells or Cal-Mag supplement) to prevent blossom end rot.</p><h2>Watering</h2><p>Container tomatoes need consistent moisture — typically daily watering in hot weather. Inconsistent watering causes cracking and blossom end rot. Mulch the surface with straw to retain moisture and regulate soil temperature.</p>'),

-- 17
('microgreens-at-home', 'Microgreens at Home', 'Herbs & Edibles',
 'Grow nutritious microgreens in just 1-2 weeks on your windowsill.',
 '🥗', 'Beginner', '6 min read', 10,
 '<h2>What Are Microgreens?</h2><p>Microgreens are young vegetable or herb seedlings harvested just after the first true leaves appear, typically 7-14 days after germination. They pack 4-40 times more nutrients than mature plants and add incredible flavor to meals.</p><h2>Getting Started</h2><ul><li>Shallow trays (1-2 inches deep) with drainage holes.</li><li>Organic potting soil or coconut coir growing medium.</li><li>Seeds: radish, broccoli, sunflower, pea shoots, and arugula are beginner-friendly.</li><li>Spray bottle for misting.</li></ul><h2>Growing Steps</h2><p>Fill trays with 1 inch of moist growing medium. Scatter seeds densely — much closer than you would in a garden. Press gently into soil, mist well, and cover with another tray or lid for 2-3 days (the blackout period). Once seeds sprout, remove the cover and place in bright light.</p><h2>Harvesting</h2><p>When seedlings are 1-3 inches tall with their first true leaves (usually day 7-14), cut just above the soil line with clean scissors. Rinse gently and use immediately for the best flavor and nutrition.</p><h2>Continuous Supply</h2><p>Start a new tray every 3-4 days so you always have fresh microgreens ready to harvest. Compost spent soil and roots, then start fresh for each batch.</p>'),

-- 18
('advanced-bonsai', 'Advanced Bonsai Techniques', 'Bonsai',
 'Take your bonsai skills to the next level with wiring, grafting, and styling.',
 '✂️', 'Advanced', '15 min read', 15,
 '<h2>Wiring for Shape</h2><p>Wiring is the primary technique for bending and positioning branches. Use anodized aluminum wire (for deciduous trees) or annealed copper wire (for conifers). Wrap at a 45-degree angle, anchoring from the trunk outward. Remove wire before it cuts into growing bark — typically after 3-6 months.</p><h2>Structural Pruning</h2><p>Major branch removal and trunk chops should be done in late winter for deciduous species and early spring for conifers. Use concave cutters for clean, healing-friendly cuts. Seal large wounds with cut paste to prevent infection and moisture loss.</p><h2>Jin and Shari</h2><ul><li><strong>Jin:</strong> Dead, bleached branch tips that suggest age and hardship. Strip bark and apply lime sulfur.</li><li><strong>Shari:</strong> Stripped bark on the trunk, creating dramatic deadwood features.</li><li>These techniques add character and suggest the tree has endured harsh conditions.</li></ul><h2>Air Layering</h2><p>Create new bonsai material from existing branches. Remove a ring of bark, apply rooting hormone, wrap with moist sphagnum moss, and cover with plastic. Roots develop in 2-4 months. Sever and pot the new tree.</p><h2>Repotting and Root Work</h2><p>Advanced root pruning creates the nebari (visible root spread) that gives bonsai their aged appearance. During repotting, comb out roots, prune thick tap roots, and arrange surface roots radially. Use akadama-based soil for optimal drainage and root development.</p>'),

-- 19
('first-bonsai-tree', 'Choosing Your First Bonsai Tree', 'Bonsai',
 'The best beginner-friendly species and where to find quality trees.',
 '🌲', 'Beginner', '8 min read', 10,
 '<h2>Starting Your Bonsai Journey</h2><p>Choosing the right first tree makes all the difference between frustration and falling in love with the hobby. The best beginner trees are resilient, fast-growing, and forgiving of mistakes.</p><h2>Top Beginner Species</h2><ul><li><strong>Chinese Elm:</strong> The gold standard for beginners. Tolerates indoor/outdoor, recovers quickly from mistakes.</li><li><strong>Ficus (any variety):</strong> Thrives indoors, tolerates low light, and is nearly indestructible.</li><li><strong>Jade (Crassula):</strong> Succulent bonsai that forgives missed waterings.</li><li><strong>Juniper:</strong> Classic outdoor bonsai. Hardy and responsive to styling.</li><li><strong>Dwarf Schefflera:</strong> Tropical — great for indoor growing, develops aerial roots.</li></ul><h2>Where to Buy</h2><p>Local bonsai nurseries offer the best quality and advice. Garden centers have affordable starter trees. Avoid ''bonsai'' seeds or gift-set trees from big-box stores — they are often poor quality. Online specialty sellers like Bonsai Boy, Brussel''s Bonsai, and Eastern Leaf are reliable.</p><h2>What to Look For</h2><p>A healthy tree with a thick trunk base, evenly distributed branches, and no signs of pests or disease. Good nebari (visible root spread at the base) is a bonus. Start with a tree that is already 3-5 years old rather than growing from seed.</p><h2>Initial Setup</h2><p>Keep your new tree in the conditions it was grown in for at least 2 weeks before making any changes. Learn its watering needs first. Resist the urge to prune or repot immediately — let the tree settle in.</p>'),

-- 20
('water-propagation', 'Water Propagation Masterclass', 'Propagation',
 'Root cuttings in water successfully with tips for faster growth.',
 '🫧', 'Beginner', '7 min read', 10,
 '<h2>Water Propagation Basics</h2><p>Water propagation is the easiest way to grow new plants from cuttings. Watching roots develop through clear glass is one of the most satisfying experiences in plant care.</p><h2>Best Plants for Water Propagation</h2><ul><li>Pothos (any variety) — roots in 1-2 weeks</li><li>Philodendron — fast and reliable</li><li>Monstera — cut below a node with an aerial root</li><li>Tradescantia — roots in days</li><li>Begonia — stem or leaf cuttings both work</li><li>Coleus — roots extremely fast</li></ul><h2>How to Do It Right</h2><p>Take a cutting 4-6 inches long, cutting just below a node. Remove the bottom 1-2 leaves so no foliage is submerged (submerged leaves rot and foul the water). Place in a clean jar with room-temperature water. Position in bright, indirect light.</p><h2>Keys to Success</h2><ul><li>Change water every 3-5 days to prevent bacteria buildup.</li><li>Use a clear container so you can monitor root growth.</li><li>Add a tiny piece of charcoal to keep water fresh longer.</li><li>Roots should be 2-3 inches long before transferring to soil.</li></ul><h2>Transitioning to Soil</h2><p>Water roots are different from soil roots. When transplanting, keep soil consistently moist for the first 2 weeks to help the plant adjust. Gradually reduce watering as new soil roots establish.</p>'),

-- 21
('division-separation', 'Division and Separation Techniques', 'Propagation',
 'Multiply your plants by dividing root systems the right way.',
 '🔀', 'Intermediate', '6 min read', 10,
 '<h2>When to Divide</h2><p>Division works for plants that grow in clumps, produce offsets, or spread via rhizomes. The best time is during repotting in spring when the plant is entering its active growth phase.</p><h2>Plants Perfect for Division</h2><ul><li><strong>Snake Plant:</strong> Separate rhizome sections with at least 2-3 leaves each.</li><li><strong>Peace Lily:</strong> Gently tease apart root clumps — each section needs roots and leaves.</li><li><strong>Ferns:</strong> Divide the root ball into halves or quarters.</li><li><strong>Spider Plant:</strong> Separate plantlets (babies) that have their own roots.</li><li><strong>Calathea:</strong> Divide at natural separation points in the root system.</li></ul><h2>Step-by-Step Division</h2><p>Water the plant thoroughly the day before. Remove from pot and shake off loose soil. Identify natural division points where stems or crowns separate. Use your hands to gently pull apart, or use a clean, sharp knife for stubborn root masses. Ensure each division has healthy roots and at least 3-4 leaves.</p><h2>Aftercare</h2><p>Pot each division in fresh, appropriately-sized containers. Water well and place in a warm spot with indirect light. Avoid fertilizing for 4-6 weeks while new roots establish. Some wilting is normal in the first week — keep humidity high and be patient.</p>'),

-- 22
('reblooming-orchids', 'Reblooming Your Orchids', 'Orchids',
 'Trigger new blooms and extend flowering with proven techniques.',
 '🌺', 'Intermediate', '8 min read', 10,
 '<h2>After the Flowers Drop</h2><p>When your orchid''s last bloom falls, do not throw the plant away. Phalaenopsis orchids can rebloom for many years with proper care. The key is understanding what triggers a new flower spike.</p><h2>Spike Care</h2><ul><li>If the spike is still green, cut above the second node from the bottom. A secondary spike may branch from a lower node.</li><li>If the spike turns brown or yellow, cut it off at the base. The plant will produce an entirely new spike.</li><li>Green spikes can sometimes bloom again from the tip — wait and watch before cutting.</li></ul><h2>Triggering New Blooms</h2><p>The secret to reblooming is a temperature drop. For 4-6 weeks, expose your orchid to nighttime temperatures of 55-65°F (13-18°C). A cooler room, near a window in fall, or even an unheated porch works well. This simulates the natural temperature shift that triggers blooming in the wild.</p><h2>Ongoing Care Between Blooms</h2><p>Continue watering weekly, provide bright indirect light, and feed with orchid-specific fertilizer at quarter strength weekly (the "weakly, weekly" method). Healthy leaves are the foundation for future blooms — a plant with strong, green leaves will rebloom faster.</p><h2>Timeline</h2><p>After the temperature treatment, a new spike typically appears within 1-3 months. Buds develop over another 1-2 months. From spike to bloom, expect 2-4 months total. Patience is rewarded with stunning flowers that can last 2-3 months.</p>'),

-- 23
('orchid-mounting', 'Orchid Mounting and Display', 'Orchids',
 'Create stunning mounted orchid displays that mimic natural habitats.',
 '🪵', 'Advanced', '10 min read', 15,
 '<h2>Why Mount Orchids?</h2><p>In nature, most orchids are epiphytes — they grow on trees, not in soil. Mounting orchids on wood or cork mimics their natural habitat, allows excellent root aeration, and creates stunning living wall art.</p><h2>Materials Needed</h2><ul><li>Cork bark, driftwood, or a natural wood plaque (avoid treated lumber).</li><li>Sphagnum moss (long-fiber, not ground).</li><li>Fishing line, plant wire, or nylon stockings for securing.</li><li>Optional: small hook or wire for hanging.</li></ul><h2>Mounting Process</h2><p>Soak sphagnum moss in water until fully hydrated. Remove the orchid from its pot and gently clean old media from roots. Place a small pad of moist sphagnum on the mount where the orchid will sit. Position the orchid with roots spread over the moss and secure with fishing line — firm but not tight. Add more moss around the roots if needed.</p><h2>Care for Mounted Orchids</h2><p>Mounted orchids dry out faster than potted ones. Soak the entire mount in water for 10-15 minutes every 2-3 days, or mist roots daily. Fertilize by adding diluted orchid food to your soaking water. Mounted orchids need higher humidity — 60-70% is ideal.</p><h2>Display Ideas</h2><p>Create a living wall with multiple mounted orchids at different heights. Hang in a bright bathroom where humidity is naturally high. Display on a plate stand on a shelf. Group with other mounted plants like staghorn ferns and bromeliads for a stunning vertical garden.</p>'),

-- 24
('air-plants', 'Air Plants: The No-Soil Solution', 'Indoor Plants',
 'Care for Tillandsia and other air plants with minimal fuss.',
 '🌬️', 'Beginner', '5 min read', 10,
 '<h2>What Are Air Plants?</h2><p>Air plants (Tillandsia) absorb water and nutrients through their leaves rather than roots. They need no soil, making them incredibly versatile for creative displays. With over 650 species, they range from tiny silver wisps to large, flowering specimens.</p><h2>Watering Air Plants</h2><ul><li>Soak in room-temperature water for 20-30 minutes once a week.</li><li>After soaking, shake off excess water and place upside down to dry completely within 4 hours.</li><li>Mist 2-3 times per week between soakings in dry environments.</li><li>Never let water sit in the base of the plant — this causes rot.</li></ul><h2>Light and Air</h2><p>Bright, indirect light is ideal. Air plants near a window with filtered light do best. Good air circulation is essential — avoid enclosed terrariums with no airflow. A gentle fan or open room works well.</p><h2>Creative Display Ideas</h2><p>The no-soil requirement makes air plants perfect for unconventional displays: driftwood, seashells, wire holders, hanging glass globes, magnetic holders on the fridge, or nestled in a bookshelf. They are living decor that works anywhere.</p><h2>Blooming and Pups</h2><p>Air plants bloom once in their lifetime — a spectacular event that lasts weeks. After blooming, the mother plant produces offsets called "pups." When pups reach about one-third the size of the parent, gently separate them. The cycle continues with each new generation.</p>')

ON CONFLICT (slug) DO NOTHING;
