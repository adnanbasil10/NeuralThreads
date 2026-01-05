# Supabase Setup - Quick Guide

## ✅ Step-by-Step Instructions

### 1. Get Your Supabase Connection String

1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your project (or create a new one)
3. Click **Settings** (gear icon) in the left sidebar
4. Click **Database** in the settings menu
5. Scroll down to **Connection string** section
6. Select **URI** tab
7. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 2. Update `.env.local` File

1. Open `.env.local` in your project root
2. Find the `DATABASE_URL` line
3. Replace it with your Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
   ```
   ⚠️ **Important:** Replace `YOUR_ACTUAL_PASSWORD` with your real Supabase database password (the one you set when creating the project)

### 3. Push Schema to Database

Run this command to create all tables:
```bash
npm run db:push
```

You should see output like:
```
✔ Generated Prisma Client
✔ Database synchronized
```

### 4. (Optional) Seed Sample Data

If you want to add some test data:
```bash
npm run db:seed
```

### 5. Test the Connection

1. Make sure your Next.js dev server is running (`npm run dev`)
2. Visit: `http://localhost:3000/api/test-db`
3. You should see: `{"success":true,"message":"Database connection successful!"}`

### 6. Try Logging In Again!

Now try logging in - the database connection error should be gone! 🎉

---

## 🔍 Finding Your Database Password

If you forgot your Supabase database password:

1. Go to **Settings > Database**
2. Scroll to **Database password** section
3. Click **Reset database password**
4. Copy the new password
5. Update `DATABASE_URL` in `.env.local` with the new password

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Connection string copied from Supabase dashboard
- [ ] `DATABASE_URL` updated in `.env.local` with correct password
- [ ] Ran `npm run db:push` successfully
- [ ] Test endpoint shows connection successful
- [ ] Can login without database errors

---

## 🆘 Troubleshooting

### "Connection refused" or "Can't reach database server"
- Check if your connection string is correct
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Verify the Supabase project is active (not paused)

### "Authentication failed"
- Your database password is incorrect
- Reset the password in Supabase dashboard
- Update `.env.local` with new password

### "Database does not exist"
- This is normal! Run `npm run db:push` to create the schema
- The database will be created automatically

### Still having issues?
- Check server logs for detailed error messages
- Verify `.env.local` file is in the project root
- Make sure you restarted the dev server after changing `.env.local`









