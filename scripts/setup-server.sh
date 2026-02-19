#!/bin/bash
# Yayasan Sahabat Khairat Indonesia - Server Setup Script
# Run this on a fresh Ubuntu 22.04 server

set -e

echo "=== Yayasan Sahabat Khairat Indonesia Server Setup ==="

# Update system
echo "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    fail2ban \
    ufw \
    certbot \
    htop \
    git

# Install Docker
echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
usermod -aG docker $USER

# Configure firewall
echo "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
echo "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl restart fail2ban

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/clicky-foundation
chown $USER:$USER /opt/clicky-foundation

# Create backup directory
mkdir -p /opt/clicky-foundation/backups

# Setup log rotation
echo "Setting up log rotation..."
cat > /etc/logrotate.d/clicky-foundation <<EOF
/var/log/clicky/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    postrotate
        docker compose -f /opt/clicky-foundation/docker-compose.yml restart fastapi
    endscript
}
EOF

# Setup automatic security updates
echo "Setting up automatic security updates..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Create swap file (if RAM < 4GB)
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 4096 ]; then
    echo "Creating swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Optimize Docker
echo "Optimizing Docker..."
cat > /etc/docker/daemon.json <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "live-restore": true
}
EOF

systemctl restart docker

echo "=== Server Setup Complete ==="
echo "Next steps:"
echo "1. Copy docker-compose files to /opt/clicky-foundation/"
echo "2. Set up SSL certificates with: certbot certonly --standalone -d api.clickyfoundation.id"
echo "3. Configure environment variables in .env file"
echo "4. Start services with: docker compose up -d"
