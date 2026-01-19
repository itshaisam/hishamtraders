# Hisham Traders ERP - Production Deployment Guide

## Quick Overview

This guide covers deploying the Hisham Traders ERP application to a Hostinger Ubuntu VPS using Docker Compose. The application consists of:
- **Frontend**: React + Vite (served by Nginx)
- **Backend**: Express.js + Prisma ORM
- **Database**: MySQL 8.0
- **Backup**: Automated daily database backups

---

## Prerequisites

- Hostinger VPS with Docker Manager enabled
- VPS IP address
- SSH access to VPS (optional, for troubleshooting)
- GitHub repository access

---

## Part 1: Pre-Deployment Setup

### Step 1: Generate Secure Credentials

Before deploying, you need to generate secure credentials for production.

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

**Generate Strong Passwords:**
Use a password generator (32+ characters):
- MYSQL_ROOT_PASSWORD
- MYSQL_PASSWORD

### Step 2: Configure Environment Variables

1. Open [.env.production](e:\pProjects\hishamtraders\.env.production)
2. Replace all placeholder values:
   - `YOUR_VPS_IP` → Your actual Hostinger VPS IP address
   - `CHANGE_THIS_ROOT_PASSWORD_VERY_STRONG_123` → Generated MySQL root password
   - `CHANGE_THIS_DB_PASSWORD_VERY_STRONG_456` → Generated MySQL user password
   - `CHANGE_THIS_GENERATE_SECURE_JWT_SECRET_WITH_OPENSSL` → Generated JWT secret
3. Update `DATABASE_URL` with the same MySQL password
4. Save the file

**Example `.env.production`:**
```bash
MYSQL_ROOT_PASSWORD=x7K9mP2nQ8vL5wR3tY6uH4jF1sD0aZ2eC8b
MYSQL_DATABASE=hisham_erp
MYSQL_USER=hisham_prod_user
MYSQL_PASSWORD=v4B7nM9kL2xZ5cT8wY1qP6rH3sF0jD2eG9a
DATABASE_URL=mysql://hisham_prod_user:v4B7nM9kL2xZ5cT8wY1qP6rH3sF0jD2eG9a@mysql:3306/hisham_erp
JWT_SECRET=YourGeneratedBase64SecretFromOpensslCommand==
JWT_EXPIRES_IN=24h
VITE_API_URL=http://123.45.67.89:3001/api/v1
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
BACKUP_RETENTION_DAYS=7
TZ=Asia/Karachi
```

### Step 3: Make Backup Script Executable

```bash
# On Windows (Git Bash)
git update-index --chmod=+x scripts/backup-mysql.sh

# On Linux/Mac
chmod +x scripts/backup-mysql.sh
```

### Step 4: Commit and Push to GitHub

```bash
git add docker-compose.production.yml
git add scripts/backup-mysql.sh
git add apps/api/Dockerfile.production
git add apps/web/nginx.conf
git add .gitignore
git commit -m "Add production deployment configuration"
git push origin main
```

**Important:** Do NOT commit `.env.production` - it contains sensitive credentials!

---

## Part 2: Deploy to Hostinger VPS

### Method 1: Hostinger Docker Manager (Recommended)

#### Step 1: Get GitHub Raw URL

1. Navigate to your GitHub repository
2. Go to: `https://github.com/YOUR_USERNAME/hishamtraders/blob/main/docker-compose.production.yml`
3. Click the **"Raw"** button
4. Copy the URL (should look like):
   ```
   https://raw.githubusercontent.com/YOUR_USERNAME/hishamtraders/main/docker-compose.production.yml
   ```

#### Step 2: Deploy via Docker Manager

1. Login to **Hostinger VPS Control Panel**
2. Navigate to **"Docker Manager"**
3. Click **"Create New Stack"**
4. Select **"From URL"**
5. Paste the GitHub raw URL
6. Set **Stack Name**: `hisham-erp-production`

#### Step 3: Configure Environment Variables

1. Click **"Environment Variables"** tab
2. Paste all variables from your `.env.production` file
3. Ensure all placeholder values are replaced with actual secure values
4. Double-check the `VITE_API_URL` has your correct VPS IP

#### Step 4: Deploy

1. Click **"Deploy Stack"**
2. Wait 2-3 minutes for build completion
3. Monitor deployment logs for errors

### Method 2: SSH Deployment (Alternative)

If Docker Manager doesn't work, use SSH:

```bash
# 1. SSH into VPS
ssh root@YOUR_VPS_IP

# 2. Install Docker & Docker Compose (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone repository
cd /opt
git clone https://github.com/YOUR_USERNAME/hishamtraders.git
cd hishamtraders

# 4. Create .env.production with your values
nano .env.production
# Paste your environment variables and save (Ctrl+X, Y, Enter)

# 5. Deploy
docker-compose -f docker-compose.production.yml up -d --build

# 6. Check status
docker-compose -f docker-compose.production.yml ps
```

---

## Part 3: Verify Deployment

### Check Container Status

```bash
docker ps --filter "name=hisham_*"
```

**Expected Output:** 4 running containers
- `hisham_mysql_prod`
- `hisham_api_prod`
- `hisham_web_prod`
- `hisham_backup_prod`

### Test Health Endpoints

**API Health Check:**
```bash
curl http://YOUR_VPS_IP:3001/health
```
Expected: `{"status":"ok","message":"Hisham Traders API is running"}`

**Web Health Check:**
```bash
curl http://YOUR_VPS_IP/
```
Expected: HTML content (React app)

### Verify Database Seeding

```bash
docker exec hisham_mysql_prod mysql -uhisham_prod_user -p hisham_erp -e "SELECT COUNT(*) FROM users;"
```
Expected: `1` (admin user created)

### Test Application Login

1. Open browser: `http://YOUR_VPS_IP`
2. You should see the Hisham Traders ERP login page
3. Login with:
   - Email: `admin@hishamtraders.com`
   - Password: `admin123`
4. **IMPORTANT:** Change the admin password immediately!

### Check Logs for Errors

```bash
# API logs
docker logs hisham_api_prod --tail 100

# MySQL logs
docker logs hisham_mysql_prod --tail 50

# Web logs
docker logs hisham_web_prod --tail 50

# Backup logs
docker logs hisham_backup_prod --tail 20
```

Look for:
- ✅ "Prisma schema loaded successfully"
- ✅ "Database connected successfully"
- ✅ "Seed completed successfully"
- ✅ "Server running on port 3001"
- ✅ "Backup cron job installed"

---

## Part 4: Backup Management

### View Backups

```bash
docker exec hisham_backup_prod ls -lh /backups
```

### Trigger Manual Backup

```bash
docker exec hisham_backup_prod /backup-mysql.sh
```

### Download Backup to Local Machine

```bash
# Option 1: Via Docker (from VPS)
docker cp hisham_backup_prod:/backups/hisham_erp_backup_20260119_020000.sql.gz ./

# Option 2: Via SCP (from local machine)
scp root@YOUR_VPS_IP:/var/lib/docker/volumes/hisham-erp-production_mysql_backups/_data/*.sql.gz ./backups/
```

### Restore from Backup

```bash
# 1. Stop API to prevent connections
docker stop hisham_api_prod

# 2. Restore backup
gunzip -c backup_file.sql.gz | docker exec -i hisham_mysql_prod mysql -uroot -p$MYSQL_ROOT_PASSWORD hisham_erp

# 3. Restart API
docker start hisham_api_prod
```

---

## Part 5: Post-Deployment Tasks

### Security Checklist

- [ ] Change admin password from default `admin123`
- [ ] Setup firewall (UFW) on VPS
- [ ] Test backup and restore procedure
- [ ] Document VPS IP and credentials securely
- [ ] Setup monitoring (optional)

### Setup Firewall (UFW)

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Configure firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS (for future SSL)
ufw enable

# Check status
ufw status
```

### Create Additional Users

After logging in as admin:
1. Go to **User Management**
2. Create users with appropriate roles:
   - WAREHOUSE_MANAGER
   - SALES_OFFICER
   - ACCOUNTANT
   - RECOVERY_AGENT

---

## Troubleshooting

### Issue: Containers Won't Start

```bash
# Check logs
docker logs hisham_api_prod
docker logs hisham_mysql_prod

# Rebuild
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

### Issue: Can't Connect to Database

```bash
# Check MySQL health
docker exec hisham_mysql_prod mysqladmin ping -uroot -p$MYSQL_ROOT_PASSWORD

# Check network
docker exec hisham_api_prod ping mysql
```

### Issue: Web Shows 404

```bash
# Check Nginx logs
docker logs hisham_web_prod

# Verify build output
docker exec hisham_web_prod ls -l /usr/share/nginx/html/assets/
```

### Issue: API Returns 502 from Web

```bash
# Test API from web container
docker exec hisham_web_prod curl -f http://api:3001/health

# Check Nginx proxy config
docker exec hisham_web_prod cat /etc/nginx/conf.d/default.conf | grep -A 10 "location /api"
```

---

## Maintenance

### Update Application

```bash
# 1. SSH into VPS
ssh root@YOUR_VPS_IP
cd /opt/hishamtraders

# 2. Pull latest changes
git pull origin main

# 3. Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# 4. Verify
docker-compose -f docker-compose.production.yml ps
```

### View Real-time Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker logs -f hisham_api_prod
```

### Restart Services

```bash
# All services
docker-compose -f docker-compose.production.yml restart

# Specific service
docker restart hisham_api_prod
```

### Stop Deployment

```bash
docker-compose -f docker-compose.production.yml down
```

### Remove Everything (Including Data)

```bash
docker-compose -f docker-compose.production.yml down -v
```

---

## Performance Optimization

### Monitor Resource Usage

```bash
# Real-time stats
docker stats

# System resources
free -h
df -h
```

### Database Optimization

The production configuration already includes:
- `innodb-buffer-pool-size=2G` (optimized for 32GB RAM)
- `max-connections=200`
- `innodb-log-file-size=512M`

---

## SSL/HTTPS Setup (Future)

After initial deployment, you can add SSL:

1. **Option A: Cloudflare** (Recommended)
   - Add your domain to Cloudflare
   - Point DNS to VPS IP
   - Enable Cloudflare proxy
   - Free SSL automatically enabled

2. **Option B: Let's Encrypt**
   - Install Certbot on VPS
   - Generate SSL certificates
   - Update Nginx configuration
   - Setup auto-renewal

---

## Support

### Documentation
- Docker Compose: https://docs.docker.com/compose/
- Prisma: https://www.prisma.io/docs
- Nginx: https://nginx.org/en/docs/

### Hostinger Support
- Docker Manager Guide: https://www.hostinger.com/support/12040815-how-to-deploy-your-first-container-with-hostinger-docker-manager/
- Support: Available via Hostinger control panel

### GitHub Issues
Report deployment issues: https://github.com/YOUR_USERNAME/hishamtraders/issues

---

## Quick Reference

### Important Files
- `docker-compose.production.yml` - Production Docker configuration
- `.env.production` - Environment variables (DO NOT COMMIT)
- `scripts/backup-mysql.sh` - Backup script
- `apps/api/Dockerfile.production` - API container build
- `apps/web/Dockerfile.production` - Web container build

### Important Commands
```bash
# Deploy
docker-compose -f docker-compose.production.yml up -d --build

# Check status
docker ps

# View logs
docker logs hisham_api_prod --tail 100

# Backup now
docker exec hisham_backup_prod /backup-mysql.sh

# Restart service
docker restart hisham_api_prod

# Stop all
docker-compose -f docker-compose.production.yml down
```

### Default Credentials
- **Admin Email:** admin@hishamtraders.com
- **Admin Password:** admin123 (CHANGE IMMEDIATELY!)

### Access URLs
- **Web Application:** http://YOUR_VPS_IP
- **API Endpoint:** http://YOUR_VPS_IP:3001/api/v1
- **Health Check:** http://YOUR_VPS_IP:3001/health

---

**Last Updated:** January 19, 2026
**Deployment Version:** 1.0.0
