# HTTPS Setup Guide

This guide explains how to set up HTTPS for your clinic system application.

## 🚀 Quick Start

### For Development (Self-signed certificates)

1. **Generate SSL certificates:**
   ```bash
   ./scripts/generate-ssl-certs.sh
   ```

2. **Start the application with HTTPS:**
   ```bash
   docker-compose -f docker-compose.https.yml up -d
   ```

3. **Access your application:**
   - Frontend: https://localhost
   - Backend API: https://localhost/api/
   - GraphQL: https://localhost/graphql
   - GraphQL WebSocket: wss://localhost/graphql-ws

### For Production (Let's Encrypt certificates)

1. **Set up your domain and email:**
   ```bash
   ./scripts/setup-letsencrypt.sh yourdomain.com your-email@example.com
   ```

2. **Access your application:**
   - Frontend: https://yourdomain.com
   - Backend API: https://yourdomain.com/api/
   - GraphQL: https://yourdomain.com/graphql
   - GraphQL WebSocket: wss://yourdomain.com/graphql-ws

## 📁 File Structure

```
├── nginx/
│   ├── nginx.conf              # Development HTTPS config
│   ├── nginx.prod.conf         # Production HTTPS config
│   └── nginx.letsencrypt.conf  # Let's Encrypt config
├── ssl/                        # SSL certificates directory
├── scripts/
│   ├── generate-ssl-certs.sh   # Generate self-signed certificates
│   └── setup-letsencrypt.sh    # Set up Let's Encrypt
├── docker-compose.https.yml    # Development with HTTPS
├── docker-compose.prod.yml     # Production with HTTPS
└── docker-compose.prod-https.yml # Production with Let's Encrypt
```

## 🔧 Configuration Details

### Nginx Configuration

The nginx reverse proxy handles:
- **SSL termination** - Handles HTTPS encryption/decryption
- **Load balancing** - Distributes requests to frontend/backend
- **Security headers** - Adds security headers to responses
- **Rate limiting** - Protects against abuse
- **HTTP to HTTPS redirect** - Automatically redirects HTTP to HTTPS

### Security Features

- **TLS 1.2/1.3** - Modern encryption protocols
- **HSTS** - Forces HTTPS connections
- **CSP** - Content Security Policy headers
- **Rate limiting** - API and login protection
- **CORS** - Configured for HTTPS origins
- **WebSocket Security** - Secure WebSocket connections (WSS) for real-time features

### CORS Configuration

The backend CORS is configured to allow:
- `https://localhost` (development)
- `https://yourdomain.com` (production)
- Requests without origin (mobile apps, Postman)

### WebSocket Configuration

The application supports real-time features through GraphQL subscriptions:

- **WebSocket Endpoint**: `/graphql-ws`
- **Development**: `wss://localhost/graphql-ws`
- **Production**: `wss://yourdomain.com/graphql-ws`
- **Authentication**: Uses JWT tokens from cookies
- **Reconnection**: Automatic reconnection with exponential backoff
- **Features**: Queue updates, stock alerts, order notifications, patient updates

## 🛠️ Manual Setup

### 1. Generate Self-signed Certificates

```bash
# Create SSL directory
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate
openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Clinic System/CN=localhost"
```

### 2. Update Environment Variables

Add to your `.env.production`:
```env
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### 3. Update Frontend Configuration

The `next.config.ts` has been updated with:
- Security headers
- HTTPS support
- Environment-specific configurations

### 4. Update Backend CORS

The backend CORS configuration supports:
- Multiple HTTPS origins
- Credential handling
- Proper headers for HTTPS

## 🔄 Certificate Renewal

### Let's Encrypt Auto-renewal

Set up a cron job for automatic renewal:
```bash
# Add to crontab (crontab -e)
0 12 * * * cd /path/to/your/project && docker-compose -f docker-compose.prod-https.yml run --rm certbot renew && docker-compose -f docker-compose.prod-https.yml restart nginx
```

### Manual Renewal

```bash
# Renew certificates
docker-compose -f docker-compose.prod-https.yml run --rm certbot renew

# Restart nginx
docker-compose -f docker-compose.prod-https.yml restart nginx
```

## 🐛 Troubleshooting

### Common Issues

1. **Certificate not trusted (development)**
   - This is normal for self-signed certificates
   - Click "Advanced" → "Proceed to localhost" in your browser

2. **CORS errors**
   - Check that your domain is in the allowed origins
   - Verify the frontend is making requests to the correct HTTPS URL

3. **Let's Encrypt certificate generation fails**
   - Ensure your domain points to your server
   - Check that port 80 is accessible
   - Verify the email address is valid

4. **Nginx won't start**
   - Check nginx configuration: `docker-compose logs nginx`
   - Verify SSL certificates exist and are readable

### Debug Commands

```bash
# Check nginx logs
docker-compose logs nginx

# Test nginx configuration
docker-compose exec nginx nginx -t

# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test HTTPS connection
curl -k https://localhost/health
```

## 📚 Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Next.js HTTPS Configuration](https://nextjs.org/docs/advanced-features/security-headers)

## 🔒 Security Best Practices

1. **Use strong SSL configurations** - TLS 1.2+ only
2. **Implement rate limiting** - Protect against abuse
3. **Add security headers** - HSTS, CSP, etc.
4. **Regular certificate renewal** - Automated with Let's Encrypt
5. **Monitor SSL/TLS** - Use tools like SSL Labs
6. **Keep nginx updated** - Regular security updates

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify your configuration files
3. Test with curl or browser developer tools
4. Check firewall and DNS settings
