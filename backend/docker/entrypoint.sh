#!/bin/sh
set -e

echo "Creating storage link..."
php artisan storage:link --force

# Run migrations only if RUN_MIGRATIONS=true (skip for pre-existing databases)
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force
else
    echo "Skipping migrations (set RUN_MIGRATIONS=true to enable)"
fi

echo "Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting application..."
exec "$@"
