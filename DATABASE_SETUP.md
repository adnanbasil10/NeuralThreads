# Database Setup Guide - Neural Threads

## 🚨 Current Issue
**Error:** "Database server is not accessible. Please check if the database is running."

This means PostgreSQL is either:
- Not installed
- Not running
- Not accessible at the configured address

---

## ✅ Quick Solutions

### Option 1: Use Supabase (Recommended - Easiest)

Supabase provides a free PostgreSQL database in the cloud. No installation needed!

1. **Create a Supabase account:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for free
   - Create a new project

2. **Get your connection string:**
   - Go to **Project Settings > Database**
   - Find **Connection string** section
   - Copy the **URI** connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

3. **Update your `.env.local` file:**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   ```
   Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

4. **Push the schema:**
   ```bash
   npm run db:push
   ```

5. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

✅ **Done!** Your database is now ready.

---

### Option 2: Install PostgreSQL Locally (Windows)

1. **Download PostgreSQL:**
   - Go to [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
   - Download the installer
   - Run the installer and follow the setup wizard
   - Remember the password you set for the `postgres` user!

2. **Start PostgreSQL service:**
   - Press `Win + R`, type `services.msc`, press Enter
   - Find "postgresql-x64-XX" service
   - Right-click and select "Start" (if not already running)

3. **Create the database:**
   - Open **pgAdmin** (installed with PostgreSQL)
   - Or use **psql** from command line:
     ```bash
     psql -U postgres
     CREATE DATABASE neural_threads;
     \q
     ```

4. **Update your `.env.local` file:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/neural_threads"
   ```
   Replace `YOUR_PASSWORD` with the password you set during installation.

5. **Push the schema:**
   ```bash
   npm run db:push
   ```

---

### Option 3: Use Docker (Advanced)

If you have Docker installed:

```bash
# Run PostgreSQL in Docker
docker run --name neural-threads-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=neural_threads -p 5432:5432 -d postgres

# Update .env.local
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/neural_threads"

# Push schema
npm run db:push
```

---

## 🔍 Verify Your Setup

### Test Database Connection

1. **Visit the test endpoint** (development only):
   ```
   http://localhost:3000/api/test-db
   ```
   This will show you detailed connection information.

2. **Or use Prisma Studio:**
   ```bash
   npm run db:studio
   ```
   This opens a visual database browser.

---

## 📝 Common Issues & Solutions

### Issue: "Can't reach database server"
- **Solution:** Make sure PostgreSQL service is running
- **Windows:** Check Services (services.msc)
- **Check:** Verify `DATABASE_URL` in `.env.local` is correct

### Issue: "Authentication failed"
- **Solution:** Check username and password in `DATABASE_URL`
- **Format:** `postgresql://username:password@host:port/database`

### Issue: "Database does not exist"
- **Solution:** Create the database:
  ```sql
  CREATE DATABASE neural_threads;
  ```

### Issue: "Connection refused"
- **Solution:** Check if PostgreSQL is listening on port 5432
- **Check:** Verify firewall isn't blocking the connection

---

## 🎯 Recommended: Use Supabase

For the easiest setup, we recommend using **Supabase**:
- ✅ No installation required
- ✅ Free tier available
- ✅ Automatic backups
- ✅ Web-based database viewer
- ✅ Works from anywhere

Just sign up, get your connection string, and you're ready to go!

---

## 📚 Next Steps

Once your database is connected:

1. **Push the schema:**
   ```bash
   npm run db:push
   ```

2. **Seed with sample data (optional):**
   ```bash
   npm run db:seed
   ```

3. **Try logging in again!**

---

## 🆘 Still Having Issues?

1. Check your `.env.local` file exists and has `DATABASE_URL` set
2. Verify the connection string format is correct
3. Test the connection using `/api/test-db` endpoint
4. Check server logs for detailed error messages
5. Make sure you've restarted your Next.js dev server after changing `.env.local`









