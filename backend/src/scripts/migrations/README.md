# Database Migrations

## Overview

This directory contains migration scripts to fix database issues in the application. These scripts are designed to check for and fix common database problems such as missing tables or columns.

## Available Migrations

1. **fixSettingsTable.js** - Adds the missing 'group' column to the settings table
2. **fixUsersTable.js** - Creates the users table if it doesn't exist
3. **fixPermissionsTable.js** - Adds the missing 'module' column to the permissions table
4. **fixAnimalsTable.js** - Ensures the animals table has the required columns (animal_id, birth_date, category)
5. **createColumnExistsFunction.js** - Creates a helper function to check if columns exist in tables

## How to Run Migrations

You can run all migrations at once or run them individually:

### Run All Migrations

```bash
npm run db:migrate
```

### Run Individual Migrations

```bash
npm run db:fix-settings    # Fix settings table
npm run db:fix-users       # Fix users table
npm run db:fix-permissions # Fix permissions table
npm run db:fix-animals     # Fix animals table
```

## Manual SQL Execution

If the automatic migrations fail due to permission issues, you'll need to manually execute the SQL commands in the Supabase SQL Editor. The migration scripts will output the necessary SQL commands when they fail.

1. Go to the Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the SQL commands from the migration script output
5. Execute the SQL commands

### Animals Table Update

To manually update the animals table, you can run the following SQL:

```sql
-- Add required columns if they don't exist
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS animal_id VARCHAR;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS category VARCHAR;

-- If animal_id is empty, you can populate it with a default value
UPDATE public.animals SET animal_id = CONCAT('ANM-', id) WHERE animal_id IS NULL;
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: If you see errors like `permission denied for table users`, you need to run the SQL commands manually in the Supabase SQL Editor.

2. **RLS Policies**: Some tables might have Row Level Security (RLS) policies that prevent the migrations from working. You can disable RLS for a table with:
   ```sql
   ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;
   ```

3. **Missing Functions**: If you see errors about missing RPC functions, you need to create them manually or run the SQL commands directly.

### Environment Variables

Make sure your `.env` file has the correct database connection information:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
DISABLE_PERMISSION_CHECK=true  # Set to true during migrations
```

You can update your environment configuration by running:

```bash
npm run update-env
```