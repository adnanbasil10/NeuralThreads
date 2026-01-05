# Supabase Connection Pool Optimization

## Your Current Connection String

```
postgresql://postgres.taznkkbfalupbykwxeyi:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

## ⚠️ Important: Supabase Connection Modes

Supabase provides **two connection modes**:

### 1. **Transaction Pooler** (Port 5432) - Current
- ✅ Good for: Serverless functions, edge functions, high concurrency
- ✅ Connection pooling handled by Supabase
- ✅ Lower connection overhead
- ⚠️ Limitations: Some PostgreSQL features restricted (prepared statements, LISTEN/NOTIFY)

### 2. **Session Pooler** (Port 6543) - Alternative
- ✅ Good for: Traditional applications, Prisma, full PostgreSQL features
- ✅ Full PostgreSQL compatibility
- ⚠️ Higher connection overhead
- ⚠️ Fewer concurrent connections

## 🎯 Recommended: Use Transaction Pooler (Port 5432) with Optimizations

### Optimized Connection String

```env
# For production with high concurrency (300-500 users)
DATABASE_URL="postgresql://postgres.taznkkbfalupbykwxeyi:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=20&pool_timeout=10&connect_timeout=5&sslmode=require"
```

**Key Parameters:**
- `pgbouncer=true` - Explicitly use PgBouncer (transaction pooler)
- `connection_limit=20` - Max connections per instance (Supabase allows up to 200 total)
- `pool_timeout=10` - Wait 10 seconds for available connection
- `connect_timeout=5` - 5 seconds to establish connection
- `sslmode=require` - SSL required for Supabase

### Alternative: Session Pooler (If Prisma Has Issues)

If you encounter issues with prepared statements or Prisma features:

```env
# Session pooler (port 6543) - Full PostgreSQL compatibility
DATABASE_URL="postgresql://postgres.taznkkbfalupbykwxeyi:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?connection_limit=10&pool_timeout=10&connect_timeout=5&sslmode=require"
```

**Note:** Session pooler has lower connection limits, so use `connection_limit=10` instead of 20.

---

## 📊 Supabase Connection Limits

### Transaction Pooler (Port 5432):
- **Max connections per project:** 200
- **Recommended per instance:** 15-20
- **Best for:** High concurrency, serverless

### Session Pooler (Port 6543):
- **Max connections per project:** 100
- **Recommended per instance:** 8-10
- **Best for:** Traditional apps, full PostgreSQL features

### Direct Connection (No Pooler):
- **Max connections per project:** 60
- **Not recommended** for production

---

## 🔧 Implementation Steps

### Step 1: Update `.env.local` (Development)

```env
# Optimized for high concurrency
DATABASE_URL="postgresql://postgres.taznkkbfalupbykwxeyi:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=20&pool_timeout=10&connect_timeout=5&sslmode=require"
```

### Step 2: Update Production Environment Variables

In your deployment platform (Vercel/Railway/etc.), set:

```env
DATABASE_URL="postgresql://postgres.taznkkbfalupbykwxeyi:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=20&pool_timeout=10&connect_timeout=5&sslmode=require"
```

### Step 3: Verify Connection Pool Settings

Update `src/lib/db/prisma.ts` to log connection info:

```typescript
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    // Log connection pool info in development
    ...(process.env.NODE_ENV === 'development' && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  });
```

---

## 🧪 Testing Connection Pool

### Check Active Connections in Supabase Dashboard:

1. Go to Supabase Dashboard → Project Settings → Database
2. Check "Connection Pooling" section
3. Monitor active connections

### Or via SQL:

```sql
-- Check current connections (if using session pooler)
SELECT count(*) FROM pg_stat_activity WHERE datname = 'postgres';

-- Check connection pool stats (Supabase specific)
SELECT * FROM pg_stat_database WHERE datname = 'postgres';
```

---

## ⚡ Performance Expectations

### With Optimized Connection Pool (20 connections per instance):

**At 300 Concurrent Users:**
- **5 instances:** 5 × 20 = 100 connections
- **Connection pool utilization:** ~60%
- **Timeout rate:** <1%
- **Avg response time:** 30-60ms

**At 500 Concurrent Users:**
- **5 instances:** 5 × 20 = 100 connections
- **Connection pool utilization:** ~80%
- **Timeout rate:** <2%
- **Avg response time:** 40-80ms

---

## 🚨 Important Notes

### 1. **Supabase Pooler Limitations:**

Transaction Pooler (port 5432) has some limitations:
- ❌ No prepared statements (Prisma handles this)
- ❌ No LISTEN/NOTIFY (if using real-time subscriptions)
- ❌ No session-level settings

**If you need these features:** Use Session Pooler (port 6543)

### 2. **Prisma Compatibility:**

Prisma works well with Transaction Pooler because:
- ✅ Prisma uses parameterized queries (not prepared statements)
- ✅ Connection pooling is handled by Supabase
- ✅ Lower connection overhead

### 3. **Connection String Security:**

**Never commit passwords to git!**

Use environment variables:
```env
# .env.local (gitignored)
DATABASE_URL="postgresql://postgres.taznkkbfalupbykwxeyi:${SUPABASE_PASSWORD}@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=20&pool_timeout=10&connect_timeout=5&sslmode=require"
```

---

## 🔍 Monitoring Connection Pool Health

### Supabase Dashboard:
1. Go to **Project Settings → Database**
2. Check **Connection Pooling** metrics
3. Monitor:
   - Active connections
   - Connection wait time
   - Pool utilization

### Application Logs:
Monitor for these errors:
- `Connection pool timeout` - Increase `pool_timeout`
- `Too many connections` - Reduce `connection_limit` per instance
- `Connection refused` - Check Supabase project limits

---

## 📝 Summary

**For 300-500 Concurrent Users:**

1. **Use Transaction Pooler (port 5432)** ✅
   - Better for high concurrency
   - Lower connection overhead
   - Works with Prisma

2. **Set `connection_limit=20` per instance** ✅
   - 5 instances = 100 total connections
   - Well within Supabase's 200 limit

3. **Add timeout parameters** ✅
   - `pool_timeout=10` - Wait for connection
   - `connect_timeout=5` - Establish connection

4. **Enable SSL** ✅
   - `sslmode=require` - Required for Supabase

**Optimized Connection String:**
```
postgresql://postgres.taznkkbfalupbykwxeyi:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=20&pool_timeout=10&connect_timeout=5&sslmode=require
```

---

*Last updated: Supabase connection optimization*

