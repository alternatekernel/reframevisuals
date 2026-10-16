# PostgreSQL Row-Level Security (RLS) Implementation

## Overview

Row-Level Security (RLS) is a security feature that ensures data isolation at the database level. Even if application code forgets to filter by `tenantId`, RLS will automatically block cross-tenant access.

## When to Enable RLS

Enable RLS after migrating to PostgreSQL when:
- You have 50+ active tenants
- You need compliance (SOC2, HIPAA)
- You want defense-in-depth against data leaks

## Implementation Steps

### 1. Enable RLS on Multi-Tenant Tables

```sql
-- Enable RLS on each tenant-scoped table
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quotation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortalSettings" ENABLE ROW LEVEL SECURITY;
```

### 2. Create Tenant Isolation Policies

```sql
-- For Customers: Users can only see their own tenant
CREATE POLICY tenant_isolation_customer ON "Customer"
  USING (tenantId = current_setting('app.tenant_id', true));

-- For Orders: Filter by tenantId
CREATE POLICY tenant_isolation_order ON "Order"
  USING (tenantId = current_setting('app.tenant_id', true));

-- For Quotations
CREATE POLICY tenant_isolation_quotation ON "Quotation"
  USING (tenantId = current_setting('app.tenant_id', true));

-- For Invoices
CREATE POLICY tenant_isolation_invoice ON "Invoice"
  USING (tenantId = current_setting('app.tenant_id', true));

-- For Conversations
CREATE POLICY tenant_isolation_conversation ON "Conversation"
  USING (tenantId = current_setting('app.tenant_id', true));

-- For Support Tickets
CREATE POLICY tenant_isolation_support_ticket ON "SupportTicket"
  USING (tenantId = current_setting('app.tenant_id', true));

-- For Portal Settings
CREATE POLICY tenant_isolation_portal_settings ON "PortalSettings"
  USING (tenantId = current_setting('app.tenant_id', true));
```

### 3. Create Application Setting Function

```sql
-- Create function to safely get tenant_id
CREATE OR REPLACE FUNCTION app.set_tenant_id(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current tenant
CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true);
END;
$$ LANGUAGE plpgsql STABLE;
```

### 4. Application Integration

Update your database connection to set tenant context per request:

```typescript
// In your database connection or middleware
app.use(async (req, res, next) => {
  const tenantId = req.user?.tenantId || 'platform';
  
  // Set tenant context for this connection
  await prisma.$executeRaw`SELECT app.set_tenant_id(${tenantId})`;
  
  next();
});
```

### 5. Admin Access (Bypass RLS)

For platform admins who need to see ALL data:

```sql
-- Create bypass role for admins
CREATE ROLE app_admin WITH SUPERUSER;

-- Admins bypass RLS automatically (SUPERUSER bypasses RLS)
-- Or create a specific bypass policy:
CREATE POLICY admin_bypass ON "Customer"
  TO app_admin
  USING (true);

-- Grant admin role to platform users
GRANT app_admin TO platform_users;
```

### 6. Verify RLS is Working

```sql
-- Test: Try to access another tenant's data (should return 0 rows)
SET app.tenant_id = 'acme-tenant-id';

SELECT * FROM "Order";  -- Should only return Acme's orders

-- Test: Platform admin access
SET ROLE app_admin;
SELECT COUNT(*) FROM "Order";  -- Should return ALL orders
```

## Performance Considerations

### Indexes for RLS

RLS uses your existing indexes. Ensure compound indexes include `tenantId`:

```sql
-- Create tenant-scoped indexes for optimal RLS performance
CREATE INDEX idx_order_tenant_status ON "Order" (tenantId, status);
CREATE INDEX idx_order_tenant_created ON "Order" (tenantId, createdAt DESC);
CREATE INDEX idx_customer_tenant_email ON "Customer" (tenantId, email);
```

### Query Plan Analysis

Always check query plans with RLS enabled:

```sql
EXPLAIN ANALYZE SELECT * FROM "Order" WHERE tenantId = 'xxx' AND status = 'completed';
```

## Rollback Plan

If RLS causes issues:

```sql
-- Disable all RLS policies temporarily
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;

-- Or drop specific policies
DROP POLICY tenant_isolation_order ON "Order";
```

## Monitoring RLS

Add logging to track blocked queries:

```sql
-- Create audit log for RLS violations
CREATE TABLE IF NOT EXISTS rls_audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT,
  attempted_tenant_id TEXT,
  blocked_at TIMESTAMP DEFAULT NOW()
);

-- Add trigger to log violations (requires superuser)
-- This is optional for debugging only
```

## Production Checklist

- [ ] Migrate to PostgreSQL
- [ ] Enable RLS on all tenant tables
- [ ] Create isolation policies
- [ ] Add tenant context to application
- [ ] Test admin bypass works
- [ ] Verify query performance
- [ ] Document rollback procedure
- [ ] Monitor in production

## References

- PostgreSQL RLS Docs: https://www.postgresql.org/docs/current/ddl-rls.html
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security