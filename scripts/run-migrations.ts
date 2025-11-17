import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🗄️  Running database migrations...\n');

  try {
    // Read migration files
    const schemaPath = join(process.cwd(), 'supabase/migrations/20241115_initial_schema.sql');
    const rlsPath = join(process.cwd(), 'supabase/migrations/20241115_rls_policies.sql');

    const schemaSql = readFileSync(schemaPath, 'utf-8');
    const rlsSql = readFileSync(rlsPath, 'utf-8');

    console.log('📝 Running initial schema migration...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSql });
    
    if (schemaError) {
      // Try direct approach if RPC doesn't exist
      console.log('   (Using direct execution)');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query: schemaSql }),
      });
      
      if (!response.ok) {
        throw new Error('Schema migration failed. Please run manually in Supabase SQL Editor.');
      }
    }
    
    console.log('   ✅ Schema migration complete\n');

    console.log('🔒 Running RLS policies migration...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSql });
    
    if (rlsError) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query: rlsSql }),
      });
      
      if (!response.ok) {
        throw new Error('RLS migration failed. Please run manually in Supabase SQL Editor.');
      }
    }
    
    console.log('   ✅ RLS policies complete\n');

    console.log('✨ All migrations completed successfully!\n');
    console.log('📊 Next steps:');
    console.log('   1. Run: npm run seed');
    console.log('   2. Run: npm run seed:products');
    console.log('   3. Run: npm run dev\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📝 Manual migration required:');
    console.log('   1. Go to https://app.supabase.com/project/_/sql');
    console.log('   2. Copy supabase/migrations/20241115_initial_schema.sql');
    console.log('   3. Run it in SQL Editor');
    console.log('   4. Copy supabase/migrations/20241115_rls_policies.sql');
    console.log('   5. Run it in SQL Editor\n');
    process.exit(1);
  }
}

runMigrations();

