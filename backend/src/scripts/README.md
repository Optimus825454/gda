# Database Fix Scripts

This directory contains scripts to fix database issues and permissions.

## Fixing Database Permissions

If you're experiencing database permission errors like `permission denied for table users` or `permission denied for table settings`, follow these steps:

### Step 1: Fix Supabase Import Issues

Run the following command to fix import issues in model files:

```bash
npm run db:fix-imports
```

This will update all model files to use the correct Supabase client import.

### Step 2: Generate SQL Commands to Fix Database Permissions

Run the following command to generate SQL commands that will fix database permissions:

```bash
npm run db:fix-sql
```

This will output SQL commands that you need to run in the Supabase SQL Editor.

### Step 3: Execute SQL Commands in Supabase

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the SQL commands generated in Step 2
4. Run the SQL commands

### Step 4: Restart Your Application

After executing the SQL commands, restart your application:

```bash
npm run dev
```

## Other Fix Scripts

- `npm run db:fix-settings`: Fix issues with the settings table
- `npm run db:fix-users`: Fix issues with the users table
- `npm run db:fix-permissions`: Fix issues with the permissions table
- `npm run db:fix-all`: Run all fix scripts at once

## Troubleshooting

If you continue to experience issues after running these scripts, check the following:

1. Make sure your `.env` file contains the correct Supabase URL and service role key
2. Verify that you're using the service role key (not the anon key) for admin operations
3. Check if the tables exist in your Supabase database
4. Ensure that Row Level Security (RLS) is properly configured for your tables