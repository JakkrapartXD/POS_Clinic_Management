#!/bin/bash

# Script to generate self-signed SSL certificates for development
# For production, use Let's Encrypt or a proper CA

set -e

SSL_DIR="./ssl"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"

echo "🔐 Generating SSL certificates for HTTPS development..."

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out "$KEY_FILE" 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$KEY_FILE" -out "$SSL_DIR/cert.csr" -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Clinic System/OU=IT Department/CN=localhost"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days 365 -in "$SSL_DIR/cert.csr" -signkey "$KEY_FILE" -out "$CERT_FILE"

# Clean up CSR file
rm "$SSL_DIR/cert.csr"

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate: $CERT_FILE"
echo "🔑 Private Key: $KEY_FILE"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   For production, use Let's Encrypt or certificates from a trusted CA."
echo ""
echo "🚀 You can now start your application with HTTPS enabled!"
