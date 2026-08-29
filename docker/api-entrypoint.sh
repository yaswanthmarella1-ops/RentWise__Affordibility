#!/bin/sh
set -e

# Apply any pending migrations before serving traffic. `migrate deploy` only
# applies committed migration files — it never generates or resets anything,
# so it is safe to run on every container start.
echo "[entrypoint] applying database migrations..."
cd /app/apps/api
node_modules/.bin/prisma migrate deploy
cd /app

echo "[entrypoint] starting API"
exec "$@"
