# Railway Deployment Checklist

**Project:** Hisham Traders ERP
**Version:** 1.0
**Date:** 2025-01-15

---

## Pre-Deployment Checks ✅

### Local Testing
- [ ] All tests pass: `pnpm test`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] Docker images build locally:
  ```bash
  docker build -f apps/api/Dockerfile.production .
  docker build -f apps/web/Dockerfile.production .
  ```
- [ ] `docker-compose.yml` works: `docker-compose up` starts all services
- [ ] Frontend loads at http://localhost:5173
- [ ] API responds at http://localhost:3001
- [ ] Database migrations run successfully

### Code Quality
- [ ] No console.log statements (except logging service)
- [ ] No hardcoded secrets in code
- [ ] No broken imports or unused variables
- [ ] ESLint passes: `pnpm lint --fix`
- [ ] TypeScript compiles with no errors

### Security
- [ ] JWT_SECRET generated (32+ chars)
- [ ] Database password is strong
- [ ] CORS is properly configured
- [ ] No sensitive data in environment examples
- [ ] `.env` files in `.gitignore`
- [ ] No API keys in code

### Git Repository
- [ ] All changes committed to main branch
- [ ] No uncommitted changes: `git status`
- [ ] Recent commits are working: `git log --oneline | head -5`
- [ ] Remote is correct: `git remote -v`
- [ ] Branch is up-to-date: `git pull`

---

## Railway Account Setup ✅

### Account & Project
- [ ] Railway account created (https://railway.app)
- [ ] GitHub connected to Railway account
- [ ] New Railway project created
- [ ] Repository connected to project
- [ ] Project is private (not public)

### Environment
- [ ] Project timezone is correct
- [ ] Billing method added (credit card)
- [ ] Spending limit set (recommended: $50-100)

---

## Service Configuration ✅

### MySQL Database Service
- [ ] MySQL service added
- [ ] Database initialized (wait 2-3 minutes)
- [ ] DATABASE_URL is available in variables
- [ ] Test connection works

### API Service Configuration
- [ ] Service name: `hisham-api`
- [ ] Dockerfile Path: `apps/api/Dockerfile.production`
- [ ] Root Directory: (blank)
- [ ] Watch Paths: `apps/api/**`

### API Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `DATABASE_URL=${{MySQL.DATABASE_URL}}`
- [ ] `JWT_SECRET=<secure-random-string>` (use `openssl rand -base64 32`)
- [ ] `JWT_EXPIRES_IN=24h`
- [ ] `LOG_LEVEL=info`

### API Networking
- [ ] Public networking enabled
- [ ] Domain/URL noted (will be needed for Web service)

### Web Service Configuration
- [ ] Service name: `hisham-web`
- [ ] Dockerfile Path: `apps/web/Dockerfile.production`
- [ ] Root Directory: (blank)
- [ ] Watch Paths: `apps/web/**`

### Web Environment Variables
- [ ] `VITE_API_URL=https://${{hisham-api.RAILWAY_PUBLIC_DOMAIN}}/api/v1`
- [ ] OR if using manual domain: `https://api.yourdomain.com/api/v1`

### Web Networking
- [ ] Public networking enabled
- [ ] Domain/URL noted for frontend access

---

## Deployment ✅

### Initial Deployment
- [ ] Triggered deployment (push to main or click Deploy)
- [ ] All services show "✓ Healthy" or building
- [ ] Check deployment logs for errors:
  - [ ] API service logs
  - [ ] Web service logs
  - [ ] MySQL service logs
- [ ] Wait for all services to reach "Running" state (5-10 min)

### Service Health Checks
- [ ] API health endpoint responds: `curl https://<api-url>/health`
  - Expected: `{"status":"ok","message":"Hisham Traders API is running"}`
- [ ] Web service loads: Visit `https://<web-url>`
  - Expected: Hisham Traders login page
- [ ] Database connection successful (check API logs)
  - Expected: "✅ Database connected"
- [ ] Prisma migrations completed (check API logs)
  - Expected: "All migrations applied successfully"

---

## Post-Deployment Validation ✅

### Frontend Testing
- [ ] Web app loads at public URL
- [ ] Login page displays
- [ ] Try to login (will fail if no seed data, that's OK)
- [ ] Check browser console for errors (F12)
- [ ] Network tab shows requests to correct API URL
- [ ] No CORS errors

### Backend Testing
- [ ] API health check: `GET /health`
- [ ] API responds to requests: `GET /api/v1`
- [ ] Database queries work (check logs)
- [ ] No connection errors in logs
- [ ] No unhandled exceptions in logs

### Database Testing
- [ ] Connect to MySQL and verify data
  - [ ] Tables created (from Prisma schema)
  - [ ] Audit logs table exists
  - [ ] Users table exists
- [ ] Run seed if needed: `railway run --service hisham-api pnpm db:seed`

### Monitoring
- [ ] Set up log alerts in Railway
- [ ] Configure error notification (optional)
- [ ] Review resource usage
- [ ] Check costs/billing

---

## Configuration Verification ✅

### Environment Variables
- [ ] All required variables set
- [ ] No variables hardcoded in Dockerfiles
- [ ] Variable references work: `${{service.VAR}}`
- [ ] Secrets are secure and unique

### Dockerfile Validation
- [ ] Multi-stage builds correct
- [ ] Non-root users used (security)
- [ ] Health checks present
- [ ] Correct ports exposed
- [ ] No security issues (check for `RUN chmod -R 777`, etc.)

### Nginx Configuration
- [ ] SPA routing works (React Router)
- [ ] Static assets cache properly
- [ ] Security headers present
- [ ] GZIP compression enabled
- [ ] `.env` and `.git` files denied

### Database
- [ ] Prisma schema valid
- [ ] Migrations folder present
- [ ] No migration errors in logs
- [ ] Data persists after restart

---

## Security Verification ✅

### Secrets Management
- [ ] No secrets in git history: `git log --all -p | grep -i secret`
- [ ] JWT_SECRET is random (32+ chars)
- [ ] DATABASE_URL not in code
- [ ] API keys not exposed in frontend

### CORS & Authentication
- [ ] CORS configured properly in API
- [ ] Only allowed origins can call API
- [ ] Authentication middleware active
- [ ] 401 errors redirect to login
- [ ] 403 errors block access

### Network Security
- [ ] API is not publicly exposing internal endpoints
- [ ] Database is not publicly accessible
- [ ] Only Railway services can reach database
- [ ] HTTPS enforced (Railway handles this)

---

## Performance Check ✅

### Load Testing
- [ ] API responds in <500ms (healthy response time)
- [ ] Web loads in <3s (first paint)
- [ ] No 502/503 errors under normal load
- [ ] Memory usage stable (check Railway metrics)

### Optimization
- [ ] JavaScript bundles gzipped
- [ ] Images optimized (if any)
- [ ] Database queries efficient
- [ ] No N+1 queries (check logs)

### Monitoring
- [ ] Error logs reviewed for issues
- [ ] Performance metrics acceptable
- [ ] No security warnings
- [ ] Costs within budget

---

## Documentation ✅

### Internal Documentation
- [ ] Deployment guide (`docs/deployment/railway-setup.md`) updated
- [ ] Troubleshooting steps documented
- [ ] Emergency procedures documented
- [ ] Rollback procedure documented

### Team Communication
- [ ] Team notified of deployment
- [ ] Production URL shared
- [ ] Access credentials distributed securely
- [ ] Known issues documented

---

## Rollout Plan ✅

### Phase 1: Soft Launch (Internal Testing)
- [ ] Deploy to Railway
- [ ] Internal team tests functionality
- [ ] Identify issues and fix
- [ ] Performance baseline established

### Phase 2: Limited Release (Beta Users)
- [ ] Announce to beta users
- [ ] Gather feedback
- [ ] Monitor error logs closely
- [ ] Stand by for quick fixes

### Phase 3: Full Release (All Users)
- [ ] Announce to all users
- [ ] Monitor usage and errors
- [ ] Be ready to rollback if needed
- [ ] Celebrate! 🎉

---

## Post-Launch Monitoring ✅

### Daily (First Week)
- [ ] Check error logs daily
- [ ] Monitor response times
- [ ] Watch for memory leaks
- [ ] Verify backups running
- [ ] Quick response team on call

### Weekly
- [ ] Review log summaries
- [ ] Check resource usage trends
- [ ] Update on performance metrics
- [ ] Plan optimizations if needed

### Monthly
- [ ] Security audit
- [ ] Database cleanup
- [ ] Update dependencies
- [ ] Review and plan improvements

---

## Emergency Procedures ✅

### If Deployment Fails
1. [ ] Check service logs
2. [ ] Identify error
3. [ ] Fix code locally
4. [ ] Test with Docker locally
5. [ ] Commit and push
6. [ ] Re-deploy

### If Service Goes Down
1. [ ] Check Railway dashboard
2. [ ] Review recent logs
3. [ ] Check if auto-restarted
4. [ ] If not, click "Redeploy"
5. [ ] Notify team
6. [ ] Follow investigation checklist

### If Database Issues
1. [ ] Don't panic, Railway has backups
2. [ ] Check database logs
3. [ ] Verify connection string
4. [ ] Try manual migration: `railway run --service hisham-api pnpm db:migrate`
5. [ ] If still failed, contact Railway support

### If Need to Rollback
1. [ ] Run: `git revert <commit>`
2. [ ] Push to main
3. [ ] Railway auto-deploys
4. [ ] Verify services healthy
5. [ ] Investigate issue separately

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| DevOps Lead | | | |
| QA Lead | | | |
| Team Lead | | | |
| Product Manager | | | |

---

## Notes & Issues

**Issues Encountered:**
```
(Document any issues and how they were resolved)
```

**Performance Baseline:**
- API Response Time: _____ ms
- Frontend Load Time: _____ s
- Database Queries: _____ avg
- Memory Usage: _____ MB

**Success Metrics:**
- ✅ All tests passing
- ✅ All services healthy
- ✅ No critical errors
- ✅ Performance acceptable
- ✅ Users can login
- ✅ Data persists

---

**Status: READY FOR PRODUCTION** ✅

**Date Completed:** _____________
**Deployed By:** _________________
**Approved By:** __________________

---

## Helpful Commands

```bash
# View logs
railway logs --service hisham-api --follow
railway logs --service hisham-web --follow

# Connect to database
railway connect MySQL

# Run commands in container
railway run --service hisham-api pnpm db:seed
railway run --service hisham-api pnpm db:migrate

# Check service status
railway status

# View metrics
railway metrics --service hisham-api
```

---

**For detailed instructions, see:** `docs/deployment/railway-setup.md`
