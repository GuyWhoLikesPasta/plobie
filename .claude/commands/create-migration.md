Create a new Supabase migration: $ARGUMENTS

Steps:

1. Understand the required schema changes
2. Create a new migration file with a descriptive name
3. Write the SQL DDL including:
   - CREATE TABLE or ALTER TABLE statements
   - Indexes where appropriate
   - Foreign key constraints
   - Check constraints for data validation
   - RLS policies if creating a new table
4. Include a rollback section as a comment
5. Test the migration locally with `npx supabase db reset`
6. Verify the schema matches expectations
7. Commit the migration file

Remember: 
- All tables should have UUID primary keys
- All tables should have created_at timestamp
- Enable RLS on all new tables
- Add appropriate indexes for foreign keys and frequently queried columns

