'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { checkAndShowAchievements } from '@/lib/achievement-toast';

interface Article {
  id: string;
  title: string;
  category: string;
  icon: string;
  readTime: string;
  difficulty: string;
  content: string;
}

// Sample articles (will move to database later)
const articles: Record<string, Article> = {
  '550e8400-e29b-41d4-a716-446655440001': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Complete Guide to Indoor Plant Care',
    category: 'Indoor Plants',
    icon: '🪴',
    readTime: '8 min read',
    difficulty: 'Beginner',
    content: `# Complete Guide to Indoor Plant Care

## Understanding Your Indoor Environment

Indoor plants bring life and color to your home, but they require different care than outdoor plants. The key to success is understanding your home's unique environment.

### Light Requirements

Most indoor plants fall into three categories:

**Low Light Plants:**
- Snake plants (Sansevieria)
- Pothos
- ZZ plants
These plants can survive in areas far from windows or in rooms with minimal natural light.

**Medium Light Plants:**
- Spider plants
- Philodendrons
- Peace lilies
These plants do best near windows with filtered light or in bright rooms without direct sun.

**Bright Light Plants:**
- Succulents
- Cacti
- Fiddle leaf figs
These plants need direct sunlight for several hours each day.

## Watering Best Practices

The number one cause of indoor plant death is overwatering. Here's how to get it right:

### The Finger Test
Stick your finger 1-2 inches into the soil. If it feels dry, it's time to water. If it's still moist, wait a few more days.

### Drainage is Critical
Always use pots with drainage holes. Standing water leads to root rot.

### Water Quality
Let tap water sit overnight to allow chlorine to evaporate. Room temperature water is best.

## Humidity and Temperature

Most indoor plants prefer:
- Humidity: 40-60%
- Temperature: 65-75°F (18-24°C)

Increase humidity by:
- Grouping plants together
- Using a pebble tray with water
- Misting leaves (for some species)
- Running a humidifier

## Fertilizing Schedule

During growing season (spring and summer):
- Feed every 2-4 weeks with diluted liquid fertilizer
- Follow package instructions carefully

During dormant season (fall and winter):
- Reduce feeding to once a month or stop entirely

## Common Problems and Solutions

### Yellow Leaves
- Usually means overwatering
- Check soil moisture and drainage
- Allow soil to dry out before watering again

### Brown Tips
- Often due to low humidity or fluoride in water
- Increase humidity
- Use filtered or distilled water

### Leggy Growth
- Indicates insufficient light
- Move plant closer to a window
- Consider grow lights

## Pro Tips

1. **Rotate your plants** weekly for even growth
2. **Clean leaves** monthly to maximize photosynthesis
3. **Repot** every 1-2 years or when roots are visible
4. **Quarantine new plants** for 2 weeks to prevent pest spread

## Conclusion

With proper light, water, and care, your indoor plants will thrive for years to come. Remember: it's better to underwater than overwater, and patience is key!

Happy growing! 🌱`,
  },
  '550e8400-e29b-41d4-a716-446655440002': {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Succulent & Cacti Care 101',
    category: 'Succulents',
    icon: '🌵',
    readTime: '6 min read',
    difficulty: 'Beginner',
    content: `# Succulent & Cacti Care 101

Succulents and cacti are perfect for beginners and busy plant parents. Their water-storing abilities make them incredibly resilient, but they still have specific needs.

## Understanding Succulents

Succulents store water in their leaves, stems, or roots. This adaptation allows them to survive in arid conditions, making them low-maintenance houseplants.

## Light Requirements

**Bright, Direct Light:** Most succulents and cacti need 4-6 hours of direct sunlight daily. South-facing windows are ideal.

**Signs of Too Little Light:**
- Stretching toward light source (etiolation)
- Pale or washed-out colors
- Weak, leggy growth

**Signs of Too Much Light:**
- Brown or white patches (sunburn)
- Shriveled leaves

## Watering Guidelines

**The Golden Rule:** Water deeply but infrequently. Allow soil to dry completely between waterings.

**Seasonal Schedule:**
- Summer: Water every 7-14 days
- Spring/Fall: Water every 2-3 weeks
- Winter: Water once a month or less

**The Soak and Dry Method:**
1. Water thoroughly until water drains from the bottom
2. Empty the saucer - never let them sit in water
3. Wait until soil is completely dry before watering again

## Choosing the Right Soil

Use a well-draining cactus/succulent mix or create your own:
- 2 parts potting soil
- 1 part perlite
- 1 part coarse sand

## Container Requirements

**Must-Haves:**
- Drainage holes (essential!)
- Terracotta pots are excellent for absorbing excess moisture
- Size appropriately - too large a pot holds too much water

## Common Issues and Solutions

### Wrinkled or Shriveled Leaves
- The plant needs water
- Water thoroughly and it should plump up within days

### Mushy or Translucent Leaves
- Overwatering and possible root rot
- Remove affected leaves, let soil dry completely
- Consider repotting in fresh, dry soil

### Stretching/Etiolation
- Insufficient light
- Move to a brighter location gradually

### Brown Spots
- Could be sunburn - move to filtered light
- Could be fungal - remove affected areas, reduce watering

## Popular Beginner Succulents

1. **Echeveria** - Beautiful rosettes, many colors
2. **Jade Plant** - Thick, shiny leaves
3. **Haworthia** - Tolerates lower light
4. **Aloe Vera** - Useful and easy to grow
5. **Sedum** - Hardy and diverse

## Propagation

Most succulents are easy to propagate:
- **Leaf cuttings:** Let callus form, place on soil
- **Stem cuttings:** Cut, dry 2-3 days, plant in soil
- **Offsets:** Separate baby plants from mother plant

Happy planting! 🌵`,
  },
  '550e8400-e29b-41d4-a716-446655440003': {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Growing Herbs Indoors Year-Round',
    category: 'Herbs & Edibles',
    icon: '🌿',
    readTime: '7 min read',
    difficulty: 'Intermediate',
    content: `# Growing Herbs Indoors Year-Round

Fresh herbs from your windowsill can transform your cooking. Here's how to maintain a thriving indoor herb garden all year.

## Best Herbs for Indoor Growing

**Easy (Beginners):**
- Basil
- Mint
- Chives
- Parsley

**Moderate:**
- Cilantro
- Oregano
- Thyme
- Rosemary

**Challenging:**
- Dill (needs space)
- Sage (needs good drainage)

## Light Requirements

Herbs need 6-8 hours of light daily. Options include:
- South-facing window (ideal)
- West or east windows (acceptable)
- Grow lights (necessary in darker homes)

## Watering Tips

Most herbs prefer:
- Consistently moist (not soggy) soil
- Well-draining containers
- Water when top inch of soil is dry

**Exception:** Mediterranean herbs (rosemary, thyme, oregano) prefer drier conditions.

## Harvesting for Maximum Growth

**The 1/3 Rule:** Never harvest more than 1/3 of the plant at once.

**Pinching Technique:**
- Pinch above leaf nodes to encourage bushier growth
- Regular harvesting promotes more growth

## Container Tips

- At least 6 inches deep
- Drainage holes essential
- Group herbs with similar water needs together

## Common Problems

### Leggy Growth
- More light needed
- Pinch regularly

### Yellowing Leaves
- Could be overwatering
- Could be nutrient deficiency

### Bolting (Flowering)
- Harvest immediately
- Start new plants

Enjoy fresh herbs year-round! 🌿`,
  },
  '550e8400-e29b-41d4-a716-446655440004': {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Orchid Care Mastery',
    category: 'Orchids',
    icon: '🌸',
    readTime: '10 min read',
    difficulty: 'Advanced',
    content: `# Orchid Care Mastery

Orchids have a reputation for being difficult, but with the right knowledge, they're incredibly rewarding plants that can bloom for months.

## Understanding Orchid Types

**Phalaenopsis (Moth Orchids):**
- Most common and beginner-friendly
- Bloom for 2-3 months
- Rebloom reliably

**Cattleya:**
- Large, fragrant flowers
- More light requirements
- Seasonal bloomers

**Dendrobium:**
- Cane-like growth
- Diverse care needs by species
- Long-lasting blooms

## Light Requirements

**Bright, Indirect Light:**
- East-facing windows are ideal
- South windows with sheer curtains
- Avoid direct hot afternoon sun

**Signs of Light Issues:**
- Dark green leaves = too little light
- Yellow/red leaves = too much light
- Ideal: Light olive green leaves

## Watering Orchids Correctly

**The Ice Cube Myth:** Don't use ice cubes. Room temperature water is best.

**Proper Watering:**
1. Water early in the day
2. Thoroughly soak the roots
3. Allow to drain completely
4. Never let roots sit in water
5. Wait until roots turn silvery before watering again

**Frequency:** Usually weekly, but depend on environment.

## Humidity and Air Circulation

Orchids need:
- 50-70% humidity
- Good air circulation
- Use humidity trays or humidifiers

## Potting and Media

**Orchid Bark Mix:** Most common
- Bark chips
- Perlite
- Charcoal

**Sphagnum Moss:** Retains more moisture
- Good for dry environments
- Requires less frequent watering

**Repotting:**
- Every 1-2 years
- When media breaks down
- After blooming cycle

## Triggering Reblooming

1. **Temperature Drop:** 10-15°F cooler nights for 2-4 weeks
2. **Reduced Watering:** Slightly drier conditions
3. **Adequate Light:** Increase light exposure
4. **Patience:** Can take several months

## Fertilizing

**Weekly, Weakly:** Use diluted orchid fertilizer
- 1/4 strength weekly during growth
- Reduce in winter
- Skip during active blooming

## Common Problems

### No Blooms
- Insufficient light
- No temperature differential
- Overfertilizing

### Wrinkled Leaves
- Underwatering
- Root problems

### Yellow Leaves
- Normal if lower/older leaves
- Overwatering if multiple
- Root rot possible

### Bud Blast (Buds Falling Off)
- Environmental stress
- Temperature fluctuations
- Moving plant while budding

Master the basics, and orchids will reward you with stunning blooms! 🌸`,
  },
  '550e8400-e29b-41d4-a716-446655440005': {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Bonsai Basics for Beginners',
    category: 'Bonsai',
    icon: '🌳',
    readTime: '12 min read',
    difficulty: 'Intermediate',
    content: `# Bonsai Basics for Beginners

Bonsai is the art of growing miniature trees through careful cultivation. It's a rewarding hobby that combines horticulture with artistic expression.

## What is Bonsai?

Bonsai (盆栽) means "planted in a container." It's not a species of tree but a technique applied to regular trees to keep them small while maintaining natural proportions.

## Choosing Your First Bonsai

**Best Beginner Species:**
1. **Ficus** - Tolerant of indoor conditions
2. **Chinese Elm** - Hardy and forgiving
3. **Juniper** - Classic outdoor bonsai
4. **Jade** - Succulent, hard to kill

**Indoor vs. Outdoor:**
- Most bonsai are outdoor plants
- Only tropical species thrive indoors
- Consider your climate and space

## Essential Care

### Light
- Most bonsai need full sun (6+ hours)
- Indoor bonsai need brightest spot available
- Rotate for even growth

### Watering
**The Most Critical Element:**
- Check soil daily
- Water when top layer feels dry
- Water thoroughly until it drains
- Never let soil completely dry out

**Watering Methods:**
- Gentle overhead watering
- Immersion (placing pot in water)
- Misting leaves (for humidity, not watering)

### Soil
Bonsai soil must:
- Drain well
- Retain some moisture
- Allow air to reach roots

**Common Mix:**
- Akadama
- Pumice
- Lava rock

### Fertilizing
- Liquid fertilizer every 2 weeks during growth
- Solid organic fertilizer monthly
- Reduce in winter

## Basic Techniques

### Pruning
**Maintenance Pruning:**
- Remove dead/yellow leaves
- Trim back to 2-3 leaves on new growth
- Maintain shape

**Structural Pruning:**
- Done in dormant season
- Remove competing branches
- Create basic structure

### Wiring
- Shape branches with aluminum/copper wire
- Apply at 45° angle
- Remove before it cuts into bark (2-6 months)

### Repotting
- Every 1-3 years (depending on species/age)
- Spring is ideal
- Prune roots by 1/3

## Bonsai Styles

1. **Formal Upright (Chokkan)** - Straight trunk
2. **Informal Upright (Moyogi)** - Curved trunk
3. **Slanting (Shakan)** - Angled trunk
4. **Cascade (Kengai)** - Falls below pot
5. **Semi-Cascade (Han-Kengai)** - Partially cascading

## Common Mistakes

- Overwatering (most common)
- Insufficient light
- Neglecting outdoor needs for outdoor species
- Over-pruning
- Impatience

## Getting Started

1. Buy a healthy starter tree
2. Research your specific species
3. Get proper soil and pot
4. Practice daily observation
5. Join a local bonsai club

Remember: Bonsai is a journey, not a destination. Enjoy the process! 🌳`,
  },
  '550e8400-e29b-41d4-a716-446655440006': {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Propagation Techniques That Always Work',
    category: 'Propagation',
    icon: '🌱',
    readTime: '9 min read',
    difficulty: 'Beginner',
    content: `# Propagation Techniques That Always Work

Propagation is the most rewarding way to grow your plant collection for free. Here are foolproof methods for multiplying your plants.

## Why Propagate?

- Free plants!
- Share with friends
- Save struggling plants
- Understand plant biology

## Method 1: Stem Cuttings

**Best For:** Pothos, Philodendron, Tradescantia, most vining plants

### Steps:
1. Cut a 4-6 inch stem with at least 2 nodes
2. Remove lower leaves
3. Place in water or moist soil
4. Keep warm and humid
5. Roots develop in 2-4 weeks

**Pro Tips:**
- Change water weekly if water propagating
- Use rooting hormone for faster results
- Avoid direct sunlight initially

## Method 2: Leaf Cuttings

**Best For:** Succulents, African Violets, Snake Plants, Begonias

### For Succulents:
1. Gently twist off a healthy leaf
2. Let callus form (2-3 days)
3. Place on well-draining soil
4. Mist occasionally
5. Baby plants emerge in 2-8 weeks

### For Snake Plants:
1. Cut leaf into 3-4 inch sections
2. Let callus overnight
3. Plant cut-side down in soil
4. Keep slightly moist
5. New growth in 4-8 weeks

## Method 3: Division

**Best For:** Spider plants, Peace Lily, most clumping plants, ferns

### Steps:
1. Remove plant from pot
2. Identify natural divisions
3. Gently separate roots
4. Plant each division in new pot
5. Water and keep humid

**Best Time:** During repotting in spring

## Method 4: Air Layering

**Best For:** Fiddle Leaf Fig, Rubber Plant, difficult woody plants

### Steps:
1. Make a small cut on stem
2. Insert toothpick to keep open
3. Apply rooting hormone
4. Wrap with moist sphagnum moss
5. Cover with plastic wrap
6. Wait for roots (1-3 months)
7. Cut below roots and pot

## Method 5: Offsets/Pups

**Best For:** Aloe, Haworthia, Agave, Bromeliads

### Steps:
1. Wait until pup is 1/4 size of mother
2. Remove from mother plant
3. Let dry overnight
4. Plant in appropriate soil
5. Water sparingly initially

## Common Propagation Mistakes

### Rotting Cuttings
- Too much water
- Not enough air circulation
- Cutting taken from unhealthy plant

### No Root Development
- Insufficient warmth
- Wrong cutting location (no nodes)
- Plant not actively growing

### Slow Growth
- Not enough light
- Poor water quality
- Wrong time of year

## Best Seasons for Propagation

- **Spring:** Ideal for most plants
- **Summer:** Good for tropical plants
- **Fall:** Slower but possible
- **Winter:** Avoid for most plants

## Tools You'll Need

1. Clean, sharp scissors or pruners
2. Clean containers (glass or small pots)
3. Fresh water or well-draining soil
4. Rooting hormone (optional)
5. Plastic bags or humidity domes

Start with easy plants like Pothos, and soon you'll have plants for everyone! 🌱`,
  },
  '550e8400-e29b-41d4-a716-446655440007': {
    id: '550e8400-e29b-41d4-a716-446655440007',
    title: 'Understanding Plant Lighting Needs',
    category: 'Indoor Plants',
    icon: '☀️',
    readTime: '7 min read',
    difficulty: 'Beginner',
    content: `# Understanding Plant Lighting Needs

Light is the most critical factor for plant health. Master this, and you'll master indoor gardening.

## Light Intensity Levels

### Bright Direct Light
- Unobstructed sun hitting leaves
- South-facing windows
- Best for: Succulents, cacti, most flowering plants

### Bright Indirect Light
- Near sunny windows but not in direct sun
- Sheer curtains filtering light
- Best for: Most tropical houseplants, ficus, philodendrons

### Medium Light
- Few feet from window
- North-facing windows
- Best for: Pothos, dracaena, ferns

### Low Light
- Far from windows
- Artificial light only
- Best for: ZZ plant, snake plant, pothos

## Measuring Light

**Hand Shadow Test:**
- Sharp, defined shadow = Bright light
- Soft shadow = Medium light
- Barely visible shadow = Low light

**Light Meter Apps:**
- More accurate than guessing
- Measure in foot-candles
- Low: 50-250 FC
- Medium: 250-1000 FC
- Bright: 1000+ FC

## Signs Your Plant Needs More Light

- Stretching toward light source
- Pale or yellowing leaves
- Slow or no growth
- Long spaces between leaves
- Dropping leaves

## Signs of Too Much Light

- Bleached or brown patches
- Crispy leaf edges
- Wilting despite adequate water
- Washed out colors

## Grow Lights

When natural light isn't enough:

**LED Grow Lights:**
- Energy efficient
- Low heat
- Full spectrum available
- Best for most situations

**Fluorescent:**
- Good for seedlings
- Cooler running
- Less expensive initially

**Positioning:**
- 6-12 inches from plants
- 12-16 hours daily
- Adjust height as plants grow

## Seasonal Changes

Remember: Light changes with seasons
- Winter: Supplement with grow lights
- Summer: May need to filter intense sun
- Move plants accordingly

Light is food for plants - get it right! ☀️`,
  },
  '550e8400-e29b-41d4-a716-446655440008': {
    id: '550e8400-e29b-41d4-a716-446655440008',
    title: 'Watering 101: When and How Much',
    category: 'Indoor Plants',
    icon: '💧',
    readTime: '6 min read',
    difficulty: 'Beginner',
    content: `# Watering 101: When and How Much

Watering mistakes kill more plants than any other factor. Here's how to get it right every time.

## The Biggest Mistake

**Overwatering** - Not too much water at once, but watering too frequently. Roots need air!

## When to Water

### The Finger Test
1. Insert finger 1-2 inches into soil
2. Dry? Time to water
3. Moist? Wait a few days

### Visual Cues
- Soil pulling away from pot edges
- Pot feels noticeably lighter
- Leaves slightly drooping

### Moisture Meters
- Affordable and accurate
- Insert into root zone
- Useful for larger pots

## How to Water Properly

### The Thorough Soak Method
1. Water slowly around the entire soil surface
2. Continue until water drains from bottom
3. Empty saucer after 30 minutes
4. Don't water again until soil dries appropriately

### Bottom Watering
1. Place pot in container of water
2. Let absorb for 15-30 minutes
3. Remove and drain
4. Good for plants that hate wet leaves

## Water Quality

**Best Options:**
- Rainwater (ideal)
- Filtered water
- Tap water left out overnight (chlorine evaporates)

**Avoid:**
- Softened water (high sodium)
- Very cold water
- Distilled for long-term use (lacks minerals)

## Seasonal Adjustments

**Summer:**
- More frequent watering
- Higher temperatures = faster drying

**Winter:**
- Less frequent watering
- Slower growth = less water needed
- Heating dries air, but growth slows

## Plant-Specific Needs

**Water-Lovers:**
Ferns, Calathea, Peace Lily
- Keep consistently moist
- Never fully dry

**Drought-Tolerant:**
Succulents, Snake Plant, ZZ Plant
- Let dry completely between waterings
- Less is more

## Signs of Watering Problems

### Overwatering
- Yellowing leaves
- Mushy stems
- Fungus gnats
- Root rot smell

### Underwatering
- Crispy leaf edges
- Wilting
- Dry, cracked soil
- Slow growth

Master watering and you're 80% of the way to plant success! 💧`,
  },
  '550e8400-e29b-41d4-a716-446655440009': {
    id: '550e8400-e29b-41d4-a716-446655440009',
    title: 'Repotting Your Plants: A Step-by-Step Guide',
    category: 'Indoor Plants',
    icon: '🏺',
    readTime: '8 min read',
    difficulty: 'Intermediate',
    content: `# Repotting Your Plants: A Step-by-Step Guide

Repotting is essential for plant health. Learn when and how to do it right.

## When to Repot

### Clear Signs
- Roots coming out of drainage holes
- Water runs straight through
- Plant is top-heavy and tips over
- Growth has slowed significantly
- It's been 2+ years in same pot

### Best Time
- Spring (beginning of growing season)
- Early summer (still actively growing)
- Avoid winter unless emergency

## Choosing the Right Pot

### Size
- Go up only 1-2 inches in diameter
- Too big = excess moisture = root rot

### Material
**Terracotta:**
- Breathable, great for overwatering prevention
- Dries faster
- Heavy, stable

**Plastic:**
- Retains moisture longer
- Lightweight
- Less expensive

**Ceramic:**
- Decorative
- Usually needs a nursery pot inside
- Check for drainage

## Step-by-Step Repotting

### Materials Needed
- New pot with drainage holes
- Fresh potting mix
- Trowel or spoon
- Watering can
- Newspaper or tarp for mess

### The Process

1. **Water the plant** a day before - easier to remove

2. **Prepare new pot** - Cover drainage hole with mesh or coffee filter

3. **Remove plant** - Tip pot, gently squeeze sides, support base of plant

4. **Examine roots**
   - Healthy: White or light tan
   - Unhealthy: Brown, mushy, smelly
   - Trim any dead or rotting roots

5. **Loosen root ball** - Gently tease apart if rootbound

6. **Add fresh soil** - Layer at bottom of new pot

7. **Position plant** - Center it, keep at same depth

8. **Fill with soil** - Firm gently, leave 1 inch from rim

9. **Water thoroughly** - Until it drains from bottom

10. **Place in appropriate light** - Avoid direct sun for a few days

## After Repotting Care

### First Two Weeks
- Don't fertilize
- Keep in stable environment
- Water when soil dries
- Some drooping is normal

### What's Normal
- Mild wilting
- A few yellow leaves
- Slower growth temporarily

### When to Worry
- Severe wilting that doesn't recover
- Rapid leaf drop
- Foul smell (root rot)

## Special Cases

### Root Rot Rescue
1. Remove all soil
2. Cut away all affected roots (brown/mushy)
3. Let roots air dry briefly
4. Repot in fresh, dry soil
5. Don't water for 3-5 days

### Breaking Apart Rootbound Plants
- Soak in water first
- Use clean knife if necessary
- Be patient and gentle

Happy repotting! 🏺`,
  },
  '550e8400-e29b-41d4-a716-446655440010': {
    id: '550e8400-e29b-41d4-a716-446655440010',
    title: 'Common Pests and How to Fight Them',
    category: 'Indoor Plants',
    icon: '🐛',
    readTime: '10 min read',
    difficulty: 'Intermediate',
    content: `# Common Pests and How to Fight Them

Even the best plant parents deal with pests. Here's how to identify and eliminate them.

## Prevention First

- Inspect new plants before bringing home
- Quarantine new additions for 2 weeks
- Keep plants healthy (stressed plants attract pests)
- Clean leaves regularly
- Ensure proper air circulation

## Spider Mites

### Identification
- Tiny dots on undersides of leaves
- Fine webbing between leaves/stems
- Stippled, yellow leaves

### Treatment
1. Isolate affected plant
2. Spray with strong water stream
3. Apply neem oil or insecticidal soap
4. Increase humidity (they hate moisture)
5. Repeat treatment every 5-7 days

## Mealybugs

### Identification
- White, cottony masses
- Usually in leaf axils and undersides
- Sticky residue (honeydew)

### Treatment
1. Dip cotton swab in rubbing alcohol
2. Touch each bug directly
3. For severe infestations, spray with alcohol/water mix
4. Apply neem oil preventively
5. Check weekly for several months

## Fungus Gnats

### Identification
- Small black flies around soil
- Larvae in top layer of soil
- Damage to roots

### Treatment
1. Let soil dry out more between waterings
2. Use sticky yellow traps
3. Apply BTI (biological control)
4. Top dress soil with sand or diatomaceous earth
5. Replace top 2 inches of soil if severe

## Aphids

### Identification
- Small, soft-bodied insects
- Green, black, or white
- Usually on new growth
- Sticky honeydew

### Treatment
1. Spray off with water
2. Apply insecticidal soap
3. Introduce ladybugs (outdoors)
4. Neem oil spray
5. Repeat weekly

## Scale

### Identification
- Brown or tan bumps on stems/leaves
- Don't move when touched
- Sticky residue

### Treatment
1. Scrape off with fingernail or old toothbrush
2. Apply rubbing alcohol
3. Use horticultural oil
4. Systemic insecticide for severe cases
5. Very persistent - be patient

## Thrips

### Identification
- Tiny, slender insects
- Silvery scarring on leaves
- Black dots (their droppings)

### Treatment
1. Blue sticky traps
2. Neem oil spray
3. Insecticidal soap
4. Spinosad for severe infestations
5. Remove heavily damaged leaves

## Natural Remedies

### Neem Oil
- Mix 2 tsp neem + 1 tsp dish soap + 1 quart water
- Spray entire plant including undersides
- Apply evening (avoid sun burn)

### Insecticidal Soap
- Safer for plants and pets
- Kills on contact
- Needs reapplication

### Rubbing Alcohol
- Effective for mealybugs and scale
- Test on small area first
- Don't use in sun

## When to Give Up

Sometimes it's not worth saving:
- Severe, repeated infestations
- Pest spreading to other plants
- Plant declining despite treatment

It's okay to discard and start fresh.

Stay vigilant and catch problems early! 🐛`,
  },
};

// Add remaining articles with placeholder content
const additionalArticles = [
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    title: 'Creating the Perfect Soil Mix',
    icon: '🪨',
    category: 'Indoor Plants',
    difficulty: 'Intermediate',
    readTime: '7 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    title: 'Fertilizing Fundamentals',
    icon: '🧪',
    category: 'Indoor Plants',
    difficulty: 'Beginner',
    readTime: '6 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    title: 'Rare Succulents Worth Collecting',
    icon: '💎',
    category: 'Succulents',
    difficulty: 'Intermediate',
    readTime: '8 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    title: 'Succulent Arrangements and Displays',
    icon: '🎨',
    category: 'Succulents',
    difficulty: 'Beginner',
    readTime: '7 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    title: 'Winter Care for Succulents',
    icon: '❄️',
    category: 'Succulents',
    difficulty: 'Intermediate',
    readTime: '5 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440016',
    title: 'Growing Tomatoes in Containers',
    icon: '🍅',
    category: 'Herbs & Edibles',
    difficulty: 'Intermediate',
    readTime: '9 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440017',
    title: 'Microgreens at Home',
    icon: '🥗',
    category: 'Herbs & Edibles',
    difficulty: 'Beginner',
    readTime: '6 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440018',
    title: 'Advanced Bonsai Techniques',
    icon: '✂️',
    category: 'Bonsai',
    difficulty: 'Advanced',
    readTime: '15 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440019',
    title: 'Choosing Your First Bonsai Tree',
    icon: '🌲',
    category: 'Bonsai',
    difficulty: 'Beginner',
    readTime: '8 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    title: 'Water Propagation Masterclass',
    icon: '🫧',
    category: 'Propagation',
    difficulty: 'Beginner',
    readTime: '7 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    title: 'Division and Separation Techniques',
    icon: '🔀',
    category: 'Propagation',
    difficulty: 'Intermediate',
    readTime: '6 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    title: 'Reblooming Your Orchids',
    icon: '🌺',
    category: 'Orchids',
    difficulty: 'Intermediate',
    readTime: '8 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440023',
    title: 'Orchid Mounting and Display',
    icon: '🪵',
    category: 'Orchids',
    difficulty: 'Advanced',
    readTime: '10 min read',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440024',
    title: 'Air Plants: The No-Soil Solution',
    icon: '🌬️',
    category: 'Indoor Plants',
    difficulty: 'Beginner',
    readTime: '5 min read',
  },
];

additionalArticles.forEach(({ id, title, icon, category, difficulty, readTime }) => {
  if (!articles[id]) {
    articles[id] = {
      id,
      title,
      category,
      icon,
      readTime,
      difficulty,
      content: `# ${title}

## Overview

This comprehensive guide covers everything you need to know about ${title.toLowerCase()}.

## Key Points

- Understanding the basics
- Best practices and techniques
- Common mistakes to avoid
- Pro tips from experts

## Getting Started

Start with the fundamentals and build your skills over time. Practice makes perfect!

## Detailed Guide Coming Soon

Full in-depth content for this article is being finalized. Check back soon for the complete guide!

Happy growing! ${icon}`,
    };
  }
});

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState<string>('');
  const [article, setArticle] = useState<Article | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [marking, setMarking] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    params.then(({ id }) => {
      setArticleId(id);
      const foundArticle = articles[id];
      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        router.push('/hobbies/learn');
      }
    });
    checkAuthAndReadStatus();
  }, [params, router]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkAuthAndReadStatus = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setIsAuthenticated(true);

      // Check if already read
      const { id } = await params;
      const { data: existingRead } = await supabase
        .from('article_reads')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', id)
        .single();

      if (existingRead) {
        setHasRead(true);
      }
    }
  };

  const handleMarkAsRead = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/hobbies/learn/${articleId}`);
      return;
    }

    setMarking(true);

    try {
      const response = await fetch('/api/learn/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });

      const data = await response.json();

      if (data.success) {
        setHasRead(true);
        toast.success(`Great! You earned +${data.data.xp_awarded} XP for reading this article!`);
        checkAndShowAchievements();
      } else {
        if (data.error?.code === 'ALREADY_EXISTS') {
          setHasRead(true);
          toast.success("You've already read this article!");
        } else {
          toast.error(data.error?.message || 'Failed to mark as read');
        }
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setMarking(false);
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/hobbies/learn"
          className="inline-flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Learn
        </Link>

        {/* Article Card */}
        <article className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Article Header */}
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-8 sm:p-10">
            <div className="text-7xl sm:text-8xl mb-4">{article.icon}</div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {article.category}
              </span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{article.readTime}</span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{article.difficulty}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {article.title}
            </h1>
          </div>

          {/* XP Badge */}
          <div className="px-8 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span className="text-green-800 dark:text-green-200 font-medium">
                {hasRead ? 'Article completed!' : 'Earn +10 XP by completing this article'}
              </span>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">
              {article.content.split('\n').map((line: string, index: number) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1
                      key={index}
                      className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white"
                    >
                      {line.slice(2)}
                    </h1>
                  );
                } else if (line.startsWith('## ')) {
                  return (
                    <h2
                      key={index}
                      className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
                    >
                      {line.slice(3)}
                    </h2>
                  );
                } else if (line.startsWith('### ')) {
                  return (
                    <h3
                      key={index}
                      className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white"
                    >
                      {line.slice(4)}
                    </h3>
                  );
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <p key={index} className="font-bold mt-4 mb-2 text-gray-900 dark:text-white">
                      {line.slice(2, -2)}
                    </p>
                  );
                } else if (line.startsWith('- ')) {
                  return (
                    <li key={index} className="ml-6 text-gray-700 dark:text-gray-300 mb-1">
                      {line.slice(2)}
                    </li>
                  );
                } else if (line.match(/^\d+\.\s/)) {
                  return (
                    <li
                      key={index}
                      className="ml-6 text-gray-700 dark:text-gray-300 mb-1 list-decimal"
                    >
                      {line.replace(/^\d+\.\s/, '')}
                    </li>
                  );
                } else if (line.trim() === '') {
                  return <br key={index} />;
                } else {
                  return (
                    <p
                      key={index}
                      className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      {line}
                    </p>
                  );
                }
              })}
            </div>
          </div>
        </article>

        {/* Mark as Read Button */}
        <div
          className={`rounded-2xl shadow-xl p-6 sm:p-8 text-center ${
            hasRead
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`}
        >
          {hasRead ? (
            <div>
              <div className="text-4xl sm:text-5xl mb-3">✅</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Article Completed!</h3>
              <p className="text-green-100 mb-4">You have earned XP for reading this article</p>
              <Link
                href="/hobbies/learn"
                className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                Read More Articles →
              </Link>
            </div>
          ) : isAuthenticated ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Finished reading?</h3>
              <button
                onClick={handleMarkAsRead}
                disabled={marking}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all disabled:opacity-50 shadow-lg"
              >
                {marking ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Marking...
                  </span>
                ) : (
                  'Mark as Read (+10 XP) ⭐'
                )}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Log in to earn XP for reading
              </h3>
              <button
                onClick={() => router.push(`/login?redirect=/hobbies/learn/${articleId}`)}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-lg"
              >
                Log In to Earn XP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
