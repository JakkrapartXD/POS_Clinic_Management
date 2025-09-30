#!/bin/bash

# Script to set up Let's Encrypt SSL certificates for production
# Make sure to replace 'yourdomain.com' with your actual domain

set -e

DOMAIN=${1:-"yourdomain.com"}
EMAIL=${2:-"your-email@example.com"}

if [ "$DOMAIN" = "yourdomain.com" ]; then
    echo "❌ Please provide your domain name as the first argument"
    echo "Usage: $0 yourdomain.com your-email@example.com"
    exit 1
fi

if [ "$EMAIL" = "your-email@example.com" ]; then
    echo "❌ Please provide your email as the second argument"
    echo "Usage: $0 yourdomain.com your-email@example.com"
    exit 1
fi

echo "🔐 Setting up Let's Encrypt SSL certificates for $DOMAIN"
echo "📧 Email: $EMAIL"

# Create necessary directories
mkdir -p ssl
mkdir -p nginx

# Update nginx configuration with actual domain
echo "📝 Updating nginx configuration with domain: $DOMAIN"
sed "s/yourdomain.com/$DOMAIN/g" nginx/nginx.letsencrypt.conf > nginx/nginx.letsencrypt.conf.tmp
mv nginx/nginx.letsencrypt.conf.tmp nginx/nginx.letsencrypt.conf

# Update docker-compose with actual domain
echo "📝 Updating docker-compose configuration with domain: $DOMAIN"
sed "s/yourdomain.com/$DOMAIN/g" docker-compose.prod-https.yml > docker-compose.prod-https.yml.tmp
sed -i "s/your-email@example.com/$EMAIL/g" docker-compose.prod-https.yml.tmp
mv docker-compose.prod-https.yml.tmp docker-compose.prod-https.yml

# Start nginx with temporary configuration for certificate generation
echo "🚀 Starting nginx with temporary configuration..."
docker-compose -f docker-compose.prod-https.yml up -d nginx

# Wait for nginx to start
echo "⏳ Waiting for nginx to start..."
sleep 10

# Generate Let's Encrypt certificate
echo "🔐 Generating Let's Encrypt certificate..."
docker-compose -f docker-compose.prod-https.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Restart nginx with SSL configuration
echo "🔄 Restarting nginx with SSL configuration..."
docker-compose -f docker-compose.prod-https.yml restart nginx

# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod-https.yml up -d

echo "✅ HTTPS setup completed successfully!"
echo "🌐 Your application is now available at: https://$DOMAIN"
echo ""
echo "📋 Next steps:"
echo "1. Set up automatic certificate renewal with a cron job:"
echo "   docker-compose -f docker-compose.prod-https.yml run --rm certbot renew"
echo ""
echo "2. Update your DNS records to point to this server"
echo "3. Update your environment variables with the correct domain"
echo ""
echo "🔧 To renew certificates manually, run:"
echo "   docker-compose -f docker-compose.prod-https.yml run --rm certbot renew"
echo "   docker-compose -f docker-compose.prod-https.yml restart nginx"
