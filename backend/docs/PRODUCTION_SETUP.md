# Production Setup Guide

## Current State

| Component | Status | Next Action |
|-----------|--------|--------------|
| Database | SQLite → PostgreSQL ready | Run migration |
| Multi-tenancy | tenantId implemented | Enable RLS when on PostgreSQL |
| Caching | Redis service created | Install Redis |
| Connection Pooling | PgBouncer config ready | Configure PgBouncer |

---

## Step 1: Install PostgreSQL (Local Development)

### Option A: Install PostgreSQL locally
```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# Or use winget:
winget install PostgreSQL.PostgreSQL

# Start PostgreSQL service
pg_ctl start -D /path/to/data
```

### Option B: Use Neon (Cloud PostgreSQL - Free Tier)
1. Go to https://neon.tech
2. Create free account
3. Copy connection string
4. Update DATABASE_URL in .env

### Option C: Use Docker
```bash
docker run -d \
  --name reframe-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=reframe \
  -p 5432:5432 \
  postgres:15
```

---

## Step 2: Run Migration

```bash
cd server

# Update DATABASE_URL in .env to point to PostgreSQL
# Then run:
npx prisma generate
npx prisma migrate deploy

# Seed data
npm run db:seed
```

---

## Step 3: Install Redis (Optional - for caching)

```bash
# Windows: Use WSL or Docker
docker run -d --name reframe-redis -p 6379:6379 redis:7

# Or use Memurai/Redis Windows port
```

---

## Step 4: Configure PgBouncer (Optional - for production)

```bash
# Install PgBouncer
# Windows: Use WSL or Docker
docker run -d \
  --name reframe-pgbouncer \
  -e DATABASE_URL=postgres://user:pass@host:5432/reframe \
  -p 6432:5432 \
  pgbouncer/pgbouncer

# Or install locally and configure
```

---

## Step 5: Enable RLS (After PostgreSQL is running)

```bash
# Connect to PostgreSQL and run RLS setup
psql $DATABASE_URL -f docs/POSTGRESQL_RLS.md

# Or just the SQL commands:
psql $DATABASE_URL -c "ALTER TABLE \"Customer\" ENABLE ROW LEVEL SECURITY;"
# ... repeat for other tables
```

---

## Environment Variables (.env)

```
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/reframe"

# Optional - for production
REDIS_URL="redis://localhost:6379"

# For PgBouncer (optional)
DATABASE_URL_PGBOUNCER="postgresql://user:pass@localhost:6432/reframe"
```

---

## Verification Commands

```bash
# Test database connection
npx prisma db execute --sql "SELECT 1"

# Check RLS status
npx prisma db execute --sql "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'Customer'"

# Run seed
npm run db:seed

# Test API
curl http://localhost:3001/api/health
```

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Updated to PostgreSQL |
| `.env` | Added PostgreSQL and Redis configs |
| `pgbouncer.ini` | Connection pooling config |
| `src/services/cacheService.ts` | Redis caching service |
| `docs/POSTGRESQL_RLS.md` | RLS implementation guide |

---

## Troubleshooting

### Prisma Client Error
```bash
# Regenerate client
npx prisma generate
```

### Connection Refused
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432
```

### RLS Blocking Queries
```bash
# Check current session role
SELECT current_user;

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'Customer';
```