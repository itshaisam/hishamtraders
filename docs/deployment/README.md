# 🚀 Hisham Traders ERP - Deployment Documentation

**Status:** ✅ Production Ready
**Version:** 1.0
**Last Updated:** 2025-01-15

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [Railway Setup Guide](./railway-setup.md) | Complete Railway deployment instructions |
| [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) | Pre/post deployment verification |
| [Environment Variables](../environment-config.md) | Configuration reference |

---

## What's New?

### Files Added
✅ **Production Dockerfiles**
- `apps/api/Dockerfile.production` - Multi-stage API build
- `apps/web/Dockerfile.production` - Multi-stage Web build
- `apps/web/nginx.conf` - Production Nginx config

✅ **Configuration**
- `.env.production.example` - Production env template
- `docs/deployment/railway-setup.md` - Full Railway guide
- `docs/deployment/DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist

✅ **Development**
- `Makefile` - Convenient CLI commands
- `docker-compose.yml` - Local development stack
- `apps/api/Dockerfile` - Dev Dockerfile
- `apps/web/Dockerfile` - Dev Dockerfile

---

## Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│                   RAILWAY PLATFORM                 │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │         MySQL Database (Managed)           │   │
│  │  • Automatic backups                       │   │
│  │  • 5GB volume, encrypted                   │   │
│  │  • Private network                         │   │
│  └────────┬─────────────────────────────────┘   │
│           │ DATABASE_URL                        │
│  ┌────────▼────────────────────────┐            │
│  │   API Service (Node.js)          │            │
│  │  • Port 3001                     │            │
│  │  • Health checks: /health        │            │
│  │  • Auto-migrations on startup    │            │
│  │  • Public domain: *.railway.app  │            │
│  └────────┬────────────────────────┘            │
│           │ VITE_API_URL                        │
│  ┌────────▼────────────────────────┐            │
│  │   Web Service (Nginx)            │            │
│  │  • Port 80/443 (HTTPS)           │            │
│  │  • React SPA routing             │            │
│  │  • Gzipped, cached               │            │
│  │  • Public domain: *.railway.app  │            │
│  └──────────────────────────────────┘            │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## 5-Minute Deployment

### Prerequisites
- Railway account (free tier OK)
- GitHub account

### Steps

**1. Create Railway Project**
```bash
# Go to https://railway.app
# Click "New Project" → "Deploy from GitHub"
# Select your repository
# Wait for initial setup (2 min)
```

**2. Add Services**
```bash
# In Railway dashboard:
# Click "New" → "Add MySQL"
# Wait for MySQL to initialize (2 min)
```

**3. Configure API**
```bash
# New → Empty Service
# Name: hisham-api
# Dockerfile: apps/api/Dockerfile.production
# Environment Variables:
#   NODE_ENV=production
#   DATABASE_URL=${{MySQL.DATABASE_URL}}
#   JWT_SECRET=<generate secure key>
#   JWT_EXPIRES_IN=24h
#   LOG_LEVEL=info
```

**4. Configure Web**
```bash
# New → Empty Service
# Name: hisham-web
# Dockerfile: apps/web/Dockerfile.production
# Environment Variables:
#   VITE_API_URL=https://${{hisham-api.RAILWAY_PUBLIC_DOMAIN}}/api/v1
```

**5. Deploy**
```bash
# Push to main branch
# OR click "Deploy Now" in Railway
# Wait for services to start (3-5 min)
```

**Done!** Access via Railway public domains.

---

## Production Best Practices

### Security ✅
- [x] Non-root Docker users
- [x] Secrets in environment, not code
- [x] HTTPS via Railway
- [x] Input validation (Zod)
- [x] SQL injection prevention (Prisma)
- [x] CORS configured
- [x] Security headers in Nginx

### Performance ✅
- [x] Multi-stage Docker builds (smaller images)
- [x] Gzip compression
- [x] Asset caching (1 year for versioned files)
- [x] Database connection pooling
- [x] Nginx reverse proxy
- [x] Health checks for auto-restart

### Reliability ✅
- [x] Health checks on all services
- [x] Auto-restart on failure
- [x] Database backups (Railway manages)
- [x] Structured logging
- [x] Error tracking
- [x] Monitoring ready

### Cost Optimization ✅
- [x] Efficient image sizes
- [x] Minimal dependencies
- [x] Right-sized services
- [x] Pay-as-you-go pricing
- **Estimated Cost:** $15-35/month

---

## Local Development

### Start Everything
```bash
# Using docker-compose
docker-compose up

# OR using Makefile
make up
```

### View Logs
```bash
make logs              # All services
make logs-api          # API only
make logs-web          # Web only
make logs-mysql        # Database only
```

### Stop
```bash
make down
```

### Database Operations
```bash
make db-migrate        # Run migrations
make db-seed          # Seed data
make db-reset         # Reset database
```

### More Commands
```bash
make help             # Show all available commands
```

---

## File Structure

```
hishamtraders/
├── 📁 apps/
│   ├── api/
│   │   ├── Dockerfile                    # Dev image
│   │   ├── Dockerfile.production         # ← NEW: Prod image
│   │   └── src/
│   └── web/
│       ├── Dockerfile                    # Dev image
│       ├── Dockerfile.production         # ← NEW: Prod image
│       ├── nginx.conf                    # ← NEW: Prod config
│       └── src/
├── 📁 docs/
│   └── deployment/                       # ← NEW: Deployment docs
│       ├── README.md                     # This file
│       ├── railway-setup.md              # ← NEW: Full guide
│       └── DEPLOYMENT_CHECKLIST.md       # ← NEW: Checklist
├── docker-compose.yml                    # Dev orchestration
├── .dockerignore                         # Docker build ignore
├── .env.production.example               # ← NEW: Prod env template
├── Makefile                              # ← NEW: CLI commands
└── ...
```

---

## Common Tasks

### View Production Logs
```bash
railway logs --service hisham-api --follow
railway logs --service hisham-web --follow
```

### Connect to Database
```bash
# Using Railway CLI
railway connect MySQL

# Or manual MySQL client
mysql -h<host> -u<user> -p<password> hisham_erp
```

### Run Database Command
```bash
# Run migrations
railway run --service hisham-api pnpm db:migrate

# Seed database
railway run --service hisham-api pnpm db:seed
```

### Manual Redeploy
```bash
railway redeploy --service hisham-api
railway redeploy --service hisham-web
```

### View Service Status
```bash
railway ps
```

---

## Troubleshooting

### API Won't Start
1. Check logs: `railway logs --service hisham-api`
2. Verify DATABASE_URL is set
3. Check Prisma migrations are valid
4. Ensure JWT_SECRET is set

**Solution:** Fix the error and redeploy.

### Web Shows 404 on All Routes
1. Verify build succeeded in Railway
2. Check `apps/web/nginx.conf` has SPA routing
3. Ensure React app built correctly

**Solution:** Rebuild web service.

### Cannot Connect from Frontend to API
1. Check VITE_API_URL environment variable
2. Verify API service is healthy
3. Test API directly: `curl $VITE_API_URL/health`

**Solution:** Update VITE_API_URL if needed.

### Database Migrations Failed
1. Check migrations folder exists
2. Verify DATABASE_URL connects
3. Try manual migration in Railway CLI

**Solution:** Run migrations via Railway CLI.

### Out of Memory
1. Upgrade Railway plan
2. Check for memory leaks
3. Reduce build dependencies

**Solution:** Move to Developer plan or higher.

---

## Monitoring

### Health Checks
Railway automatically monitors:
- API health: `GET /health`
- Web health: `GET /`
- Database connectivity
- Service restarts

### Metrics to Watch
- Response time (target: <500ms)
- Error rate (target: <0.1%)
- Memory usage (target: <512MB)
- Database connections
- Request throughput

### Logs to Review
- Error logs daily
- Warning logs weekly
- Audit logs for security events
- Performance metrics monthly

---

## Next Steps

1. **Deploy to Railway**
   - Follow [railway-setup.md](./railway-setup.md)
   - Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

2. **Test Production**
   - Verify all services running
   - Test authentication
   - Check database persistence
   - Load test if needed

3. **Monitor & Optimize**
   - Watch logs for errors
   - Optimize slow queries
   - Plan scaling strategy

4. **Set Up Custom Domain**
   - Configure DNS records
   - Update environment variables
   - Test with custom domain

---

## Support & Resources

### Documentation
- Railway Docs: https://docs.railway.app
- Project Architecture: `docs/architecture/`
- API Endpoints: `docs/architecture/api-endpoints.md`
- Database Schema: `docs/architecture/database-schema.md`

### Tools
- Railway CLI: `npm i -g @railway/cli`
- Railway Dashboard: https://railway.app/dashboard
- Docker Docs: https://docs.docker.com

### Getting Help
- Railway Discord: https://railway.app/discord
- GitHub Issues: Create issue in repository
- Team Slack: #infrastructure channel

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial production deployment setup |

---

## Deployment Confirmation

- [x] Production Dockerfiles created and tested
- [x] Nginx configuration optimized for SPA
- [x] Environment variables documented
- [x] Railway setup guide completed
- [x] Pre/post deployment checklist ready
- [x] Health checks configured
- [x] Security best practices applied
- [x] Monitoring strategy defined

**Status:** ✅ **READY FOR PRODUCTION**

**Who to Contact:**
- Deployment Issues: DevOps Team
- Database Issues: Database Administrator
- Performance Issues: DevOps Team
- Security Issues: Security Team

---

**Last Updated:** 2025-01-15
**Maintained By:** DevOps Team
**Next Review:** 2025-02-15

---

## 🎉 You're Ready to Deploy!

**Next Action:** Follow [railway-setup.md](./railway-setup.md) to deploy to Railway.

Good luck! 🚀
