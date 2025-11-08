# 🚀 Railway Deployment - Quick Reference Card

**Print this and keep it handy!**

---

## 🎯 Deploy in 5 Minutes

### 1️⃣ Create Project
```
https://railway.app → New Project → Deploy from GitHub
```

### 2️⃣ Add MySQL
```
Railway Dashboard → New → Add MySQL → Wait 2 min
```

### 3️⃣ API Service
```
Name: hisham-api
Dockerfile: apps/api/Dockerfile.production

Env Vars:
NODE_ENV=production
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=<random-32-chars>
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
```

### 4️⃣ Web Service
```
Name: hisham-web
Dockerfile: apps/web/Dockerfile.production

Env Vars:
VITE_API_URL=https://${{hisham-api.RAILWAY_PUBLIC_DOMAIN}}/api/v1
```

### 5️⃣ Deploy
```
Push to main OR click "Deploy Now"
```

---

## 🔧 Common Commands

### Logs
```bash
railway logs --service hisham-api --follow
railway logs --service hisham-web --follow
railway logs --service MySQL --follow
```

### Database
```bash
railway connect MySQL           # SSH to MySQL
railway run --service hisham-api pnpm db:migrate
railway run --service hisham-api pnpm db:seed
```

### Status
```bash
railway ps
railway metrics --service hisham-api
```

### Redeploy
```bash
railway redeploy --service hisham-api
railway redeploy --service hisham-web
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| API won't start | Check logs: `railway logs --service hisham-api` |
| Web shows 404 | Rebuild: `railway redeploy --service hisham-web` |
| Cannot reach API | Check: `VITE_API_URL=${{hisham-api.RAILWAY_PUBLIC_DOMAIN}}` |
| Database error | Verify: `DATABASE_URL=${{MySQL.DATABASE_URL}}` |
| Out of memory | Upgrade Railway plan |

---

## 📊 Health Checks

✅ API Health
```
GET https://<api-url>/health
Response: {"status":"ok"}
```

✅ Web Health
```
GET https://<web-url>/
Response: HTML (React app)
```

✅ Database
```
MySQL running in Railway dashboard
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is random (32+ chars)
- [ ] Database password is strong
- [ ] No secrets in code/env files
- [ ] CORS configured
- [ ] HTTPS enabled (automatic)
- [ ] Only Railway services reach DB

---

## 📈 Monitor

```bash
# Daily
Check logs for errors
Check response times

# Weekly
Review metrics
Check costs

# Monthly
Security audit
Update dependencies
```

---

## 🆘 Emergency

### Service Down?
1. Check Railway dashboard
2. Check logs
3. Click "Redeploy"
4. Notify team

### Database Corrupt?
1. Railway has backups (auto)
2. Contact Railway support
3. Restore from backup

### Need to Rollback?
```bash
git revert <commit>
git push
# Railway auto-deploys
```

---

## 💰 Costs

| Service | Est. Cost |
|---------|-----------|
| MySQL | $5-10/mo |
| API | $5-15/mo |
| Web | $3-8/mo |
| **Total** | **$15-35/mo** |

---

## 🔗 Links

| Link | Purpose |
|------|---------|
| https://railway.app | Dashboard |
| https://docs.railway.app | Documentation |
| docs/deployment/ | Local guides |

---

## 📞 Help

- API won't start? → Check `railway logs --service hisham-api`
- Web won't load? → Check browser console (F12)
- Database issue? → Connect via `railway connect MySQL`
- Still stuck? → Railway Discord: https://railway.app/discord

---

## ✅ Deployment Checklist

- [ ] All tests pass locally
- [ ] Docker builds work locally
- [ ] Repository pushed to GitHub
- [ ] Railway project created
- [ ] MySQL service added
- [ ] API service configured
- [ ] Web service configured
- [ ] Deploy triggered
- [ ] Services healthy (✓ all green)
- [ ] API health check works
- [ ] Web app loads
- [ ] Database connected
- [ ] Can access production

---

**Status:** ✅ READY FOR PRODUCTION

**Deployed:** __________
**By:** __________
**Version:** 1.0

---

*Keep this card with your deployment docs!*
