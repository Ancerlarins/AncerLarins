#!/bin/sh
set -e

echo "Creating storage link..."
php artisan storage:link --force

echo "Running database migrations..."
php artisan migrate --force

echo "FRONTEND_URL=$FRONTEND_URL"
echo "Clearing and rebuilding caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting application..."
exec "$@"
