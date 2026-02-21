#!/bin/bash
set -e

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"

echo "==> Obtaining initial SSL certificate for ${DOMAIN}..."

# Start nginx with HTTP-only config (redirect server block handles ACME challenge)
docker compose up -d nginx

# Wait for nginx to be ready
sleep 5

# Get certificate from Let's Encrypt
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}"

# Reload nginx to pick up the new certificates
docker compose exec nginx nginx -s reload

echo "==> SSL certificate obtained successfully!"
echo "==> Certificate will auto-renew via the certbot service."
echo ""
echo "To verify: curl -I https://${DOMAIN}"
