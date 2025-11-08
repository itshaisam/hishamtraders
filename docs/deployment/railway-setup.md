# Deploying Hisham Traders ERP to Railway

**Updated:** 2025-01-15
**Status:** Production Ready
**Version:** 1.0

---

## Quick Start (5 minutes)

### Prerequisites
- Railway account (https://railway.app)
- GitHub account with access to repository
- Docker installed locally (for testing)

### Step 1: Create Railway Project
1. Go to https://railway.app and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `hishamtraders` repository
4. Click **Deploy**

Railway will detect it's a monorepo but we'll configure services manually.

### Step 2: Add MySQL Database
1. In Railway project, click **New**
2. Select **Database** → **Add MySQL**
3. Railway creates a managed MySQL instance
4. Wait ~2 minutes for initialization

### Step 3: Configure API Service
1. Click **New** → **Empty Service**
2. Name: `hisham-api`
3. Configure in Railway dashboard:
   - **Root Directory**: Leave blank
   - **Dockerfile Path**: `apps/api/Dockerfile.production`
   - **Watch Paths**: `apps/api/**`

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=${{MySQL.DATABASE_URL}}
   JWT_SECRET=<generate with: openssl rand -base64 32>
   JWT_EXPIRES_IN=24h
   LOG_LEVEL=info
   ```

5. Enable Public Networking → Copy generated URL

### Step 4: Configure Web Service
1. Click **New** → **Empty Service**
2. Name: `hisham-web`
3. Configure:
   - **Root Directory**: Leave blank
   - **Dockerfile Path**: `apps/web/Dockerfile.production`
   - **Watch Paths**: `apps/web/**`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://${{hisham-api.RAILWAY_PUBLIC_DOMAIN}}/api/v1
   ```

5. Enable Public Networking

### Step 5: Deploy
Push to main branch or click **Deploy** in Railway dashboard.

**Done!** Your app is deployed. Access via the Railway public domains.

---

## Detailed Setup Guide

### Complete Railway Project Structure

After setup, your Railway project should look like:

```
┌─────────────────────────────────────────────┐
│        Hisham Traders Project               │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────┐                  │
│  │ MySQL Database       │                  │
│  │ • 5.7 GB Volume      │                  │
│  │ • hisham_erp DB      │                  │
│  │ • hisham_user        │                  │
│  └──────┬───────────────┘                  │
│         │ DATABASE_URL                     │
│  ┌──────▼──────────────────┐               │
│  │ API Service             │               │
│  │ (hisham-api)            │               │
│  │ • Node 20 + Express     │               │
│  │ • Port 3001             │               │
│  │ • Auto-migrations       │               │
│  │ • URL: *.railway.app    │               │
│  └──────┬───────────────────┘              │
│         │ VITE_API_URL                     │
│  ┌──────▼──────────────────┐               │
│  │ Web Service             │               │
│  │ (hisham-web)            │               │
│  │ • Nginx Alpine          │               │
│  │ • React SPA             │               │
│  │ • Port 80               │               │
│  │ • URL: *.railway.app    │               │
│  └──────────────────────────┘              │
│                                              │
└─────────────────────────────────────────────┘
```

---

### Environment Variables Reference

#### MySQL Service (Auto-Generated)
Railway automatically provides:
- `DATABASE_URL` - Full connection string
- `MYSQLHOST` - Hostname
- `MYSQLPORT` - Port (3306)
- `MYSQLDATABASE` - Database name
- `MYSQLUSER` - Username
- `MYSQLPASSWORD` - Password

#### API Service (Manual - Required)

| Variable | Value | Example |
|----------|-------|---------|
| `NODE_ENV` | `production` | production |
| `PORT` | `3001` | 3001 |
| `DATABASE_URL` | MySQL connection | `${{MySQL.DATABASE_URL}}` |
| `JWT_SECRET` | 32-char random | `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Token lifetime | `24h` |
| `LOG_LEVEL` | Log verbosity | `info` |

**How to generate JWT_SECRET:**
```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (use Railway CLI terminal):
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

#### Web Service (Manual - Required)

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_URL` | API endpoint | `https://${{hisham-api.RAILWAY_PUBLIC_DOMAIN}}/api/v1` |

---

### Railway Variable Substitution

Railway supports variable references between services:

```bash
# Reference another service's variable:
VITE_API_URL=https://${{hisham-api.RAILWAY_PUBLIC_DOMAIN}}/api/v1

# Reference MySQL service:
DATABASE_URL=${{MySQL.DATABASE_URL}}

# Reference service port:
API_PORT=${{hisham-api.RAILWAY_PORT}}

# Reference service hostname:
API_HOST=${{hisham-api.RAILWAY_PUBLIC_DOMAIN}}
```

---

### Database Initialization

Prisma migrations run **automatically** on deployment:

1. Dockerfile CMD executes: `pnpm --filter @hishamtraders/api prisma:migrate`
2. Migrations run against production MySQL
3. Application starts after migrations complete

**To seed database after first deployment:**

```bash
# Via Railway CLI:
railway run --service hisham-api pnpm db:seed

# Or in Railway terminal:
pnpm db:seed
```

---

## Monitoring & Logs

### View Logs in Railway

1. Click service → **Logs** tab
2. Filter by service:
   - `hisham-api` - Backend logs
   - `hisham-web` - Nginx logs
   - `MySQL` - Database logs

### Common Log Patterns

**API Starting Successfully:**
```
✅ Audit logging enabled
✅ Error handling enabled
🚀 Server running on port 3001
```

**Database Connected:**
```
prisma:schema  Prisma schema loaded from prisma/schema.prisma
prisma:engine  Starting Prisma Engine
[Prisma] Connected to database
```

**Web Serving:**
```
[notice] master process started with pid
[notice] signal process started
```

---

## Health Checks

Both services have health checks enabled:

### API Health Check
```bash
curl https://your-api-domain/health
# Response: {"status":"ok","message":"Hisham Traders API is running"}
```

### Web Health Check
```bash
curl https://your-web-domain/
# Response: HTML (React app)
```

Railway uses these to:
- Detect service failures
- Auto-restart unhealthy services
- Ensure proper deployment order

---

## Troubleshooting

### Issue: API Service Won't Start

**Symptoms:** Deployment fails, API stays "unhealthy"

**Solutions:**
1. Check logs for specific error
2. Verify DATABASE_URL is set correctly
3. Check Prisma migrations for errors
4. Ensure JWT_SECRET is set

```bash
# View detailed logs:
railway logs --service hisham-api --follow
```

### Issue: Web Service Shows Nginx Errors

**Symptoms:** 502 Bad Gateway or 404 on all routes

**Solutions:**
1. Verify web build succeeded: Check build logs
2. Check nginx.conf syntax
3. Ensure React app built correctly
4. Verify dist/ directory has files

### Issue: Cannot Connect to API from Frontend

**Symptoms:** API calls return 404 or CORS errors

**Solutions:**
1. Verify VITE_API_URL environment variable
2. Check API service is running and healthy
3. Test API directly: `curl $API_URL/health`
4. Check CORS in api-client.ts

### Issue: Database Migrations Failed

**Symptoms:** API crashes with "migration not found" error

**Solutions:**
1. Check migrations folder exists and has migration files
2. Verify DATABASE_URL connects to correct database
3. Run migrations manually in Railway terminal
4. Check Prisma schema is valid

**Manual migration fix:**
```bash
railway run --service hisham-api pnpm prisma:migrate
```

### Issue: Out of Memory

**Symptoms:** Service crashes, "OOM killer" in logs

**Solutions:**
1. Increase Railway plan (move to Developer or higher)
2. Check for memory leaks in application
3. Reduce build dependencies
4. Profile memory usage locally

---

## Database Management

### Connect to Production MySQL

**Via Railway CLI:**
```bash
railway connect MySQL
# Then execute SQL commands
```

**Via MySQL Client:**
```bash
# Get connection details from Railway MySQL service
mysql -h<host> -u<user> -p<password> hisham_erp

# Common queries:
SHOW TABLES;
SELECT * FROM users LIMIT 5;
SELECT COUNT(*) FROM audit_logs;
```

### Backup Database

Railway provides automatic backups, but you can also:

```bash
# Dump database locally:
mysqldump -h<host> -u<user> -p<password> hisham_erp > backup.sql

# Restore from backup:
mysql -h<host> -u<user> -p<password> hisham_erp < backup.sql
```

### Reset Database (CAREFUL!)

```bash
# This DELETES all data:
railway run --service hisham-api pnpm db:reset
```

---

## Custom Domain (Optional)

### Set Up Custom Domain

1. In Railway project → Web service
2. Click **Settings** → **Networking**
3. Click **Add Custom Domain**
4. Enter your domain: `erp.yourdomain.com`
5. Add DNS record (CNAME) pointing to Railway
6. Wait for DNS propagation (can take 24 hours)

### Configure API Domain

Similarly for API service:
1. Point to `api.yourdomain.com` or `erp-api.yourdomain.com`
2. Update Web's `VITE_API_URL` to use new domain

---

## Scaling & Performance

### Add More Resources

1. Upgrade Railway plan (more RAM/CPU)
2. Railway will auto-scale based on traffic
3. Monitor resource usage in **Metrics** tab

### Performance Tips

1. **Enable Database Caching** - Check Railway MySQL settings
2. **Use CDN** - Railway provides edge locations
3. **Optimize Images** - Compress before upload
4. **Code Splitting** - React already does this with Vite
5. **Monitor Performance** - Use Railway metrics

---

## Security Best Practices

### Environment Secrets

✅ **DO:**
- Use Railway Variables for secrets
- Generate strong JWT_SECRET
- Use HTTPS only (automatic with Railway)
- Enable firewalls if needed

❌ **DON'T:**
- Commit .env files to git
- Use weak secrets (123456, password, etc.)
- Share railway tokens publicly
- Expose internal URLs

### Database Security

1. Railway MySQL is private by default
2. Only accessible from your services
3. Change default password if needed
4. Use parameterized queries (Prisma does this)

### API Security

- CORS configured properly
- Rate limiting enabled (optional)
- Input validation with Zod
- Error logging (without exposing internals)

---

## Updating & Redeployment

### Deploy New Changes

1. Push to main branch on GitHub
2. Railway auto-detects changes
3. Rebuilds affected services
4. Monitors health checks
5. Completes deployment

**Deploy is automatic!** No need for manual push.

### Manual Redeploy

```bash
# Using Railway CLI:
railway deploy --service hisham-api

# Redeploy specific service:
railway redeploy --service hisham-web
```

### Zero-Downtime Deployments

Railway handles this automatically:
1. Builds new container
2. Health checks pass on new container
3. Routes traffic to new container
4. Removes old container
5. No downtime during deployment

---

## Cost Management

### Monitor Usage

1. Go to **Settings** → **Plan**
2. View current usage and costs
3. Set spending limits if desired

### Cost Breakdown

| Service | Typical Cost | Notes |
|---------|-------------|-------|
| MySQL | $5-10/mo | 5GB storage, 100GB bandwidth |
| API | $5-15/mo | 512MB RAM, 1 shared CPU |
| Web | $3-8/mo | Lightweight Nginx |
| **Total** | **$15-35/mo** | Varies by traffic |

### Cost Optimization

1. **Right-size services** - Don't over-provision
2. **Use managed MySQL** - Cheaper than managed instances
3. **Monitor bandwidth** - Large images increase costs
4. **Clean up unused** - Delete unused services
5. **Plan for scale** - Pay-as-you-go is efficient

---

## Contact & Support

### Railway Support
- Documentation: https://docs.railway.app
- Discord Community: https://railway.app/discord
- Status Page: https://status.railway.app

### Hisham Traders ERP Support
- Internal Docs: `docs/architecture/`
- GitHub Issues: Create issue in repository
- Team Slack: #infrastructure channel

---

## Rollback Strategy

### If Deployment Fails

1. **Check logs** - See what went wrong
2. **Fix code** - Commit changes
3. **Push again** - Railway redeploys automatically

### If Data Is Corrupt

1. **Use backups** - Railway has automatic backups
2. **Contact Railway support** - Restore from backup

### If You Need Previous Version

1. **Revert commit** - `git revert <commit>`
2. **Push to main** - Railway auto-deploys
3. **Verify** - Check health checks pass

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check API response times
- Verify database connectivity

### Weekly
- Review logs for patterns
- Check resource usage
- Monitor costs

### Monthly
- Update dependencies
- Review security logs
- Optimize performance
- Backup important data

---

## Next Steps

1. ✅ Create Railway account
2. ✅ Deploy to Railway (follow Quick Start above)
3. ✅ Set up custom domain (optional)
4. ✅ Configure monitoring (optional)
5. ✅ Set up automated backups (Railway does this)
6. ✅ Document deployment procedures
7. ✅ Train team on monitoring

---

**Status:** ✅ Production Ready
**Last Updated:** 2025-01-15
**Maintained By:** DevOps Team
