#!/bin/sh
set -eu

cd /app/backend

run_migrations() {
  npx prisma migrate deploy
}

if run_migrations; then
  exec node dist/index.js
fi

echo "Prisma migrate deploy failed; attempting safe recovery for known failed migration state." >&2

# Coolify deployments previously failed because Prisma P3009 left these migrations in a failed state.
# This runs inside the deployed container network, where the private database host is reachable.
# Marking a failed migration as rolled-back lets the next `migrate deploy` re-apply it from scratch
# (the corrected SQL), instead of aborting with P3009.
npx prisma migrate resolve --rolled-back 20260601_add_user_reset_token_nonce || true
npx prisma migrate resolve --rolled-back 20260614_add_user_active_flag || true
npx prisma migrate resolve --rolled-back 20260619000000_change_default_order_status_to_new_review || true
npx prisma migrate resolve --rolled-back 20260619_remove_seed_support_demo_data || true
npx prisma migrate resolve --rolled-back 20260620000000_add_order_kanban_position_and_archive || true

run_migrations

exec node dist/index.js
