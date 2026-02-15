#!/bin/bash
set -e

# Playlist Converter - Droplet Setup Script
# Run as root on a fresh Ubuntu 22.04+ droplet

APP_DIR="/var/www/playlist-converter"
REPO_URL="https://github.com/PatrickSpieker/pink-green-bilateralism.git"

echo "=== Playlist Converter Droplet Setup ==="

# Update system
echo "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Node.js 20.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Nginx
echo "Installing Nginx..."
apt-get install -y nginx

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Clone or pull the repository
if [ -d "$APP_DIR" ]; then
    echo "Updating existing installation..."
    cd "$APP_DIR"
    git pull
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Install dependencies
echo "Installing dependencies..."
npm run install:all

# Build the client
echo "Building client..."
cd client && npm run build && cd ..

# Check for .env file
if [ ! -f "server/.env" ]; then
    echo ""
    echo "=== ACTION REQUIRED ==="
    echo "Create server/.env with your API credentials:"
    echo "  cp server/.env.example server/.env"
    echo "  nano server/.env"
    echo ""
    echo "Required variables:"
    echo "  SPOTIFY_CLIENT_ID"
    echo "  SPOTIFY_CLIENT_SECRET"
    echo "  SPOTIFY_REDIRECT_URI=http://YOUR_DROPLET_IP/api/auth/spotify/callback"
    echo "  CLIENT_URL=http://YOUR_DROPLET_IP"
    echo ""
    echo "Optional (for Apple Music -> Spotify):"
    echo "  APPLE_TEAM_ID"
    echo "  APPLE_KEY_ID"
    echo "  APPLE_PRIVATE_KEY"
    echo "========================"
    echo ""
fi

# Configure Nginx
echo "Configuring Nginx..."
cp deploy/nginx.conf /etc/nginx/sites-available/playlist-converter
ln -sf /etc/nginx/sites-available/playlist-converter /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Start the app with PM2
echo "Starting application with PM2..."
cd "$APP_DIR"
pm2 delete playlist-converter 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "=== Setup Complete ==="
echo "App running at: http://$(curl -s ifconfig.me)"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart the app"
echo ""
