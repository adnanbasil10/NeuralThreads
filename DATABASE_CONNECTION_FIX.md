# Database Connection Fix Guide

## Current Issue
The database server at `db.taznkkbfalupbykwxeyi.supabase.co:5432` is not accessible.

## Quick Fixes

### 1. Check Supabase Project Status

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in to your account
3. Find your project (the one with ref: `taznkkbfalupbykwxeyi`)
4. Check if the project shows as **"Paused"** or **"Inactive"**
5. If paused, click **"Restore"** or **"Resume"** to activate it

### 2. Verify Connection String

1. In your Supabase dashboard, go to **Project Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** format
4. Copy the connection string
5. Make sure the password is URL-encoded (use `%40` instead of `@` in passwords)

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.taznkkbfalupbykwxeyi.supabase.co:5432/postgres
```

If your password contains `@`, replace it with `%40`:
```
# If password is: Tanya@200422
# Use: Tanya%40200422
```

### 3. Update .env.local

1. Open `.env.local` file
2. Update the `DATABASE_URL` with the correct connection string
3. Save the file
4. Restart your development server (`npm run dev`)

### 4. Test Connection

Run the test script:
```bash
node scripts/test-db-connection.js
```

Or test via API (if server is running):
```bash
curl http://localhost:3000/api/test-db
```

### 5. Initialize Database Schema

Once connected, push the schema:
```bash
npm run db:push
```

## Alternative: Use Connection Pooling

Supabase provides a connection pooling URL that might be more reliable:

1. In Supabase dashboard: **Project Settings** → **Database**
2. Find **Connection pooling** section
3. Use the **Transaction** mode connection string
4. It will look like: `postgresql://postgres.xxx:6543/postgres`

Update your `.env.local`:
```env
DATABASE_URL="postgresql://postgres.xxx:6543/postgres?pgbouncer=true"
```

## Still Having Issues?

1. **Check Supabase Status**: Visit [status.supabase.com](https://status.supabase.com)
2. **Verify Network**: Ensure you can access Supabase from your network
3. **Check Firewall**: Some networks block port 5432
4. **Try Direct Connection**: Use Supabase's connection pooler (port 6543) instead

## Need Help?

- Check Supabase logs in your dashboard
- Review the error message in your terminal
- Verify your `.env.local` file format









