#!/bin/bash

# Restore Database - Run all migrations in order
# This script applies all SQL migrations to rebuild the Supabase database

echo "🔄 Starting database restoration..."
echo ""

# Get Supabase credentials from .env.local
source .env.local

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Error: Supabase credentials not found in .env.local"
  exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')

echo "📊 Project: $PROJECT_REF"
echo "📁 Running 16 migrations..."
echo ""

# Run each migration file in order
for migration in supabase/migrations/*.sql; do
  filename=$(basename "$migration")
  echo "⏳ Running: $filename"
  
  # Use psql to run the migration
  psql "postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
    -f "$migration" \
    -v ON_ERROR_STOP=1 \
    --quiet
  
  if [ $? -eq 0 ]; then
    echo "✅ Success: $filename"
  else
    echo "❌ Failed: $filename"
    exit 1
  fi
  echo ""
done

echo "🎉 Database restoration complete!"
echo ""
echo "Next steps:"
echo "1. Create a test user via Supabase dashboard or signup page"
echo "2. Test login at https://plobie.vercel.app/login"

