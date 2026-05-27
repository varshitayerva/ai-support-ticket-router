# Deployment Checklist - Multi-LLM Support Ticket Router v2.0

Use this checklist before deploying to production.

---

## Pre-Deployment

### Code & Configuration

- [ ] All tests pass
  ```bash
  pytest test_main.py -v
  ```

- [ ] No uncommitted changes
  ```bash
  git status
  ```

- [ ] Dependencies installed correctly
  ```bash
  pip install -r requirements.txt
  ```

- [ ] Model configuration reviewed (`config/models.py`)
  - [ ] All model IDs are valid
  - [ ] Timeouts are appropriate for production
  - [ ] Fallback models configured
  - [ ] Retry policy suitable

- [ ] Environment variables ready
  - [ ] `HUGGING_FACE_API_KEY` set
  - [ ] No hardcoded secrets in code
  - [ ] .env file not committed

- [ ] Logging configured
  - [ ] Logs directory writable
  - [ ] Log rotation configured (if using file logging)
  - [ ] Structured JSON logs enabled

### Documentation

- [ ] `MULTI_LLM_ARCHITECTURE.md` reviewed
- [ ] `IMPLEMENTATION_SUMMARY.md` reviewed
- [ ] `QUICK_START.md` reviewed
- [ ] API documentation up to date
- [ ] README updated with v2.0 info

### Testing

- [ ] Manual testing of all endpoints
  ```bash
  # Test health check
  curl http://localhost:8000/
  
  # Test all LLM endpoints
  curl -X POST http://localhost:8000/api/judge-relevance \
    -d '{"ticket": "test"}'
  ```

- [ ] Error handling tested
  - [ ] Invalid request format
  - [ ] Missing required fields
  - [ ] API timeout scenario
  - [ ] Fallback model activation

- [ ] Load testing (recommended)
  ```bash
  # Use Apache Bench or similar
  ab -n 100 -c 10 http://localhost:8000/
  ```

- [ ] Log output verified
  - [ ] Successful calls logged
  - [ ] Errors logged with details
  - [ ] Performance metrics captured

---

## Production Deployment

### Infrastructure

- [ ] Server has sufficient CPU/RAM
  - Recommended: 2+ cores, 4GB+ RAM
  - SSD recommended for I/O

- [ ] Network connectivity verified
  - [ ] Can reach `https://router.huggingface.co/v1`
  - [ ] DNS resolution works
  - [ ] No firewall blocking

- [ ] SSL/TLS certificate configured
  - [ ] Certificate valid
  - [ ] HTTPS enabled
  - [ ] Certificate auto-renewal set up

### Application Setup

- [ ] Dependencies installed
  ```bash
  pip install -r requirements.txt
  ```

- [ ] Environment variables set
  ```bash
  export HUGGING_FACE_API_KEY="..."
  ```

- [ ] CORS configured for frontend origin
  - [ ] Frontend URL updated in `main.py`
  - [ ] Tested from browser

- [ ] Logging configured for production
  - [ ] Log level set appropriately (INFO/WARNING)
  - [ ] Log rotation enabled
  - [ ] Log storage sufficient

### Server Configuration

- [ ] Use production ASGI server (not dev uvicorn)
  - [ ] Gunicorn installed
  - [ ] Workers configured (4-8 workers)
  - [ ] Timeout set appropriately (60+ seconds)

  **Example gunicorn command:**
  ```bash
  gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --timeout 60
  ```

- [ ] Reverse proxy configured (nginx/Apache)
  - [ ] Proxy settings correct
  - [ ] Compression enabled
  - [ ] Caching headers set

- [ ] Health check endpoint configured
  ```bash
  # Monitor GET /
  # Should respond < 100ms
  ```

### Monitoring & Alerts

- [ ] Monitoring dashboard set up
  - [ ] API endpoint latency tracked
  - [ ] Error rate monitored
  - [ ] Model usage tracked
  - [ ] Resource usage monitored

- [ ] Alerts configured
  - [ ] High error rate alert (>5%)
  - [ ] High latency alert (>2s)
  - [ ] Disk space alert
  - [ ] Memory usage alert
  - [ ] API key expiration alert

- [ ] Logging aggregation set up
  - [ ] Logs sent to central log store
  - [ ] JSON logs parseable
  - [ ] Searchable by task_type, model_id, status

- [ ] Performance baseline established
  - [ ] Average latency per endpoint recorded
  - [ ] Token usage baseline recorded
  - [ ] Cost per request calculated

### Security

- [ ] API key stored securely
  - [ ] Not in code
  - [ ] Not in logs
  - [ ] Environment variable only
  - [ ] Rotation policy in place

- [ ] Rate limiting configured
  - [ ] Per-IP rate limits
  - [ ] Per-API-key rate limits
  - [ ] Burst protection

- [ ] CORS properly configured
  - [ ] Only allowed origins
  - [ ] Credentials not overly permissive
  - [ ] Headers reviewed

- [ ] Input validation verified
  - [ ] Ticket field length limited
  - [ ] JSON size limits enforced
  - [ ] Invalid input rejected

- [ ] Dependencies checked for vulnerabilities
  ```bash
  pip audit
  ```

- [ ] No sensitive data in logs
  - [ ] Ticket content not logged
  - [ ] API keys not logged
  - [ ] User PII not logged

### Data & Backup

- [ ] Backup strategy defined
  - [ ] Configuration backed up
  - [ ] Logs backed up regularly
  - [ ] Retention policy set

- [ ] Disaster recovery plan
  - [ ] Recovery time objective (RTO) defined
  - [ ] Recovery point objective (RPO) defined
  - [ ] Recovery procedure documented

---

## Post-Deployment

### Immediate (First Hour)

- [ ] Application started successfully
  ```bash
  ps aux | grep gunicorn
  ```

- [ ] Health check passing
  ```bash
  curl https://your-domain.com/
  ```

- [ ] Logs flowing to monitoring system
  - [ ] Success logs present
  - [ ] No error spike

- [ ] All endpoints responding
  - [ ] `/` responds
  - [ ] `/api/models` responds
  - [ ] `/api/judge-relevance` responds
  - [ ] `/api/analyze` responds

- [ ] Monitoring dashboard updated
  - [ ] Metrics flowing in
  - [ ] Baseline latencies normal

### First Day

- [ ] Monitor error rate
  - [ ] Should be <1%
  - [ ] No critical errors

- [ ] Monitor latency
  - [ ] Meets expected performance
  - [ ] No unusual spikes

- [ ] Monitor resource usage
  - [ ] CPU usage reasonable
  - [ ] Memory usage stable
  - [ ] Disk usage acceptable

- [ ] Frontend integration tested
  - [ ] Frontend can reach API
  - [ ] Responses correct
  - [ ] No CORS errors

- [ ] Sample logs reviewed
  - [ ] Structure correct
  - [ ] All fields present
  - [ ] Timestamps accurate

- [ ] Alerts working
  - [ ] Test alert trigger
  - [ ] Notifications received

### First Week

- [ ] Performance stable
  - [ ] Latency consistent
  - [ ] No memory leaks
  - [ ] Error rate low

- [ ] Cost tracking
  - [ ] Token usage tracked
  - [ ] Cost per request calculated
  - [ ] Budget on track

- [ ] Model performance
  - [ ] Each model performing as expected
  - [ ] Fallback rarely needed
  - [ ] Retry rate acceptable

- [ ] Log analysis
  - [ ] Common patterns identified
  - [ ] Anomalies investigated
  - [ ] Trends documented

- [ ] User feedback gathered
  - [ ] Response quality good
  - [ ] No complaints about latency
  - [ ] Features working as expected

---

## Ongoing Maintenance

### Daily

- [ ] Check monitoring dashboard
  - [ ] Error rate normal
  - [ ] Latency normal
  - [ ] No alerts

- [ ] Review logs for errors
  - [ ] Investigate any errors
  - [ ] Fix if needed
  - [ ] Document issues

### Weekly

- [ ] Performance review
  - [ ] Latency trends
  - [ ] Error rate trends
  - [ ] Resource usage

- [ ] Cost review
  - [ ] Token usage
  - [ ] Cost per endpoint
  - [ ] Budget tracking

- [ ] Security review
  - [ ] API key rotation
  - [ ] Access logs reviewed
  - [ ] No suspicious activity

### Monthly

- [ ] Model performance analysis
  - [ ] Which models used most
  - [ ] Success rates per model
  - [ ] Consider model swaps

- [ ] Optimization review
  - [ ] Can any timeout be reduced?
  - [ ] Can temperature be adjusted?
  - [ ] Can fallback be improved?

- [ ] Documentation update
  - [ ] Update based on learnings
  - [ ] Document any configuration changes
  - [ ] Update deployment guide

### Quarterly

- [ ] Dependency updates
  ```bash
  pip list --outdated
  pip install --upgrade package-name
  ```

- [ ] Security audit
  - [ ] Check for vulnerabilities
  - [ ] Review access controls
  - [ ] Rotate credentials

- [ ] Capacity planning
  - [ ] Analyze usage trends
  - [ ] Plan for growth
  - [ ] Adjust resources if needed

---

## Rollback Plan

If deployment fails, follow this procedure:

1. **Stop current version**
   ```bash
   pkill -f gunicorn
   ```

2. **Restore previous deployment**
   ```bash
   git checkout previous-tag
   pip install -r requirements.txt
   ```

3. **Restart application**
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

4. **Verify health**
   ```bash
   curl http://localhost:8000/
   ```

5. **Investigate issue**
   - Check logs
   - Review changes
   - Fix problem
   - Test in staging

---

## Deployment Commands Reference

### Development
```bash
uvicorn main:app --reload
```

### Production (with Gunicorn)
```bash
gunicorn main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --timeout 60 \
  --access-logfile - \
  --error-logfile -
```

### With Systemd Service
```ini
[Unit]
Description=AI Support Ticket Router
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/app/backend
Environment="HUGGING_FACE_API_KEY=..."
ExecStart=/usr/local/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
Restart=always

[Install]
WantedBy=multi-user.target
```

### With Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

---

## Troubleshooting Common Issues

### Issue: High Latency
- [ ] Check model availability
- [ ] Check network connectivity
- [ ] Review Hugging Face Router status
- [ ] Increase timeout in config
- [ ] Scale up server resources

### Issue: High Error Rate
- [ ] Check API key validity
- [ ] Review logs for patterns
- [ ] Check model availability
- [ ] Verify fallback models configured
- [ ] Check rate limiting

### Issue: Memory Leak
- [ ] Check application logs
- [ ] Review code for resource leaks
- [ ] Restart application
- [ ] Monitor memory over time
- [ ] Consider connection pooling

### Issue: Slow Response
- [ ] Check database/API calls
- [ ] Review model selection
- [ ] Check for blocking operations
- [ ] Monitor CPU usage
- [ ] Consider caching

---

## Sign-Off

Before marking deployment as complete, get approval from:

- [ ] **Development Lead**
  - Name: ________________
  - Date: ________________
  - Signature: ________________

- [ ] **Operations Lead**
  - Name: ________________
  - Date: ________________
  - Signature: ________________

- [ ] **Security Lead**
  - Name: ________________
  - Date: ________________
  - Signature: ________________

---

**Deployment Date:** ________________

**Version:** 2.0

**Status:** ☐ Ready  ☐ In Progress  ☐ Complete  ☐ Rolled Back

**Notes:** 
_____________________________________________________________________________
_____________________________________________________________________________

---

*Use this checklist for every deployment to production.*
