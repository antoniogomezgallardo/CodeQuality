# Emergency Rollback Playbook

## Overview

This playbook provides step-by-step procedures for rolling back various types of changes when incidents occur. Quick and safe rollbacks are critical for minimizing incident impact.

**Golden Rule:** When in doubt, rollback first, investigate later.

**Last Updated:** March 2024
**Owner:** Platform Team
**Review Frequency:** Monthly

---

## Table of Contents

1. [General Rollback Principles](#general-rollback-principles)
2. [Application Deployment Rollback](#application-deployment-rollback)
3. [Database Migration Rollback](#database-migration-rollback)
4. [Infrastructure Changes Rollback](#infrastructure-changes-rollback)
5. [Feature Flag Rollback](#feature-flag-rollback)
6. [Configuration Rollback](#configuration-rollback)
7. [DNS Changes Rollback](#dns-changes-rollback)
8. [Third-Party Integration Rollback](#third-party-integration-rollback)
9. [Emergency Procedures](#emergency-procedures)

---

## General Rollback Principles

### When to Rollback

Rollback immediately if:

- ✅ Deployment caused service outage
- ✅ Error rate significantly increased (>5%)
- ✅ Latency significantly increased (>2x normal)
- ✅ Users reporting critical issues
- ✅ Fix will take > 15 minutes
- ✅ Root cause is unclear

Consider rollback if:

- ⚠️ Error rate moderately increased (1-5%)
- ⚠️ Performance degradation but service functional
- ⚠️ Affects subset of users
- ⚠️ Fix is simple and can be done quickly

Don't rollback if:

- ❌ Issue unrelated to recent changes
- ❌ Rollback would cause more problems
- ❌ Forward fix is simpler and faster
- ❌ Data migration makes rollback impossible

### Rollback Safety Checklist

Before rolling back, verify:

- [ ] Recent change is the likely cause
- [ ] Rollback target version is known and stable
- [ ] Rollback won't cause data loss or corruption
- [ ] Team is aware and ready
- [ ] Monitoring is in place to verify rollback success

### Post-Rollback Actions

After every rollback:

1. ✅ Verify service health restored
2. ✅ Monitor key metrics for 15+ minutes
3. ✅ Notify stakeholders
4. ✅ Create incident ticket
5. ✅ Block future deployments until root cause fixed
6. ✅ Schedule postmortem

---

## Application Deployment Rollback

### Kubernetes Deployments

#### Quick Rollback (Recommended)

```bash
# 1. Check deployment history
kubectl rollout history deployment/[service-name] -n [namespace]

# 2. Rollback to previous version
kubectl rollout undo deployment/[service-name] -n [namespace]

# 3. Monitor rollback progress
kubectl rollout status deployment/[service-name] -n [namespace]

# 4. Verify pods are running
kubectl get pods -l app=[service-name] -n [namespace]

# 5. Check pod logs for errors
kubectl logs -l app=[service-name] -n [namespace] --tail=50
```

**Expected Time:** 2-5 minutes

#### Rollback to Specific Version

```bash
# Check revision history
kubectl rollout history deployment/[service-name] -n [namespace]

# Rollback to specific revision
kubectl rollout undo deployment/[service-name] -n [namespace] --to-revision=[number]

# Verify rollback
kubectl rollout status deployment/[service-name] -n [namespace]
```

#### Verification Steps

```bash
# 1. Check service endpoints
kubectl get endpoints [service-name] -n [namespace]

# 2. Check service version
kubectl get pods -l app=[service-name] -n [namespace] \
  -o jsonpath='{.items[0].spec.containers[0].image}'

# 3. Test service health endpoint
curl http://[service-name].[namespace].svc.cluster.local/health

# 4. Check error rate in Prometheus
curl 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{service="[service]",status=~"5.."}[5m])'
```

### Docker Swarm Rollback

```bash
# Rollback service to previous version
docker service rollback [service-name]

# Monitor rollback
docker service ps [service-name]

# Verify service is healthy
docker service inspect [service-name]
```

### AWS ECS Rollback

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix [service-name]

# Update service to previous task definition
aws ecs update-service \
  --cluster [cluster-name] \
  --service [service-name] \
  --task-definition [previous-task-definition-arn]

# Monitor deployment
aws ecs describe-services \
  --cluster [cluster-name] \
  --services [service-name] \
  --query 'services[0].deployments'
```

### Manual / VM-Based Deployments

```bash
# SSH to server
ssh [user]@[server]

# Stop current version
sudo systemctl stop [service-name]

# Switch to previous version
sudo rm /opt/[service]/current
sudo ln -s /opt/[service]/releases/[previous-version] /opt/[service]/current

# Start service
sudo systemctl start [service-name]

# Verify
sudo systemctl status [service-name]
curl http://localhost:[port]/health
```

---

## Database Migration Rollback

### Principle: Always Have Down Migrations

Every database migration must have a corresponding rollback migration.

### PostgreSQL Migration Rollback

#### Using Migration Tool (e.g., Flyway, Liquibase)

```bash
# Check migration history
flyway info

# Rollback last migration
flyway undo

# Or rollback to specific version
flyway undo -target=[version]

# Verify
flyway info
```

#### Manual SQL Rollback

```sql
-- 1. Connect to database
psql -h [host] -U [user] -d [database]

-- 2. Begin transaction
BEGIN;

-- 3. Run rollback SQL
-- (Keep down migrations in migrations/[version]_down.sql)
\i migrations/[version]_down.sql

-- 4. Verify changes
SELECT * FROM [affected_table] LIMIT 10;

-- 5. Commit if correct, rollback if not
COMMIT;  -- or ROLLBACK;

-- 6. Update migration tracking table
DELETE FROM schema_migrations WHERE version = '[version]';
```

### Critical Database Rollback Scenarios

#### 1. Column Added

```sql
-- If migration added column:
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Rollback:
ALTER TABLE users DROP COLUMN email_verified;
```

#### 2. Index Added

```sql
-- If migration added index:
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Rollback:
DROP INDEX CONCURRENTLY idx_users_email;
```

#### 3. Table Created

```sql
-- If migration created table:
CREATE TABLE user_sessions (...);

-- Rollback:
DROP TABLE IF EXISTS user_sessions CASCADE;
```

#### 4. Data Migration

```sql
-- If migration updated data:
UPDATE users SET status = 'active' WHERE last_login > NOW() - INTERVAL '30 days';

-- Rollback (if original values were saved):
UPDATE users SET status = backup_status FROM users_backup
WHERE users.id = users_backup.id;

-- Clean up backup table
DROP TABLE IF EXISTS users_backup;
```

### MongoDB Migration Rollback

```javascript
// Connect to MongoDB
mongo [connection-string]

// Use database
use [database]

// Run rollback script
load('migrations/down/[version].js')

// Verify
db.[collection].find().limit(5)
```

### Migration Rollback Best Practices

1. **Always test rollback before production**

   ```bash
   # Test on staging
   flyway undo -environment=staging
   # Verify
   # Re-apply
   flyway migrate -environment=staging
   ```

2. **Save data before destructive migrations**

   ```sql
   -- Before dropping column, save data
   CREATE TABLE users_backup AS
   SELECT id, deprecated_column FROM users;

   -- Then safe to drop
   ALTER TABLE users DROP COLUMN deprecated_column;
   ```

3. **Use transactions where possible**

   ```sql
   BEGIN;
   -- All migration statements here
   COMMIT;  -- or ROLLBACK if something fails
   ```

4. **Monitor replication lag during rollback**
   ```sql
   -- Check replication lag
   SELECT * FROM pg_stat_replication;
   ```

---

## Infrastructure Changes Rollback

### Kubernetes Configuration Rollback

```bash
# Rollback ConfigMap
kubectl rollout undo configmap/[configmap-name] -n [namespace]

# Or restore from backup
kubectl apply -f backups/[configmap-name]-[timestamp].yaml

# Restart pods to pick up old config
kubectl rollout restart deployment/[service-name] -n [namespace]
```

### Terraform Rollback

```bash
# Option 1: Rollback to previous state
terraform state pull > terraform-current.tfstate.backup
terraform state push terraform-previous.tfstate

# Option 2: Revert code and re-apply
git revert [commit-hash]
terraform plan
terraform apply

# Option 3: Destroy problematic resources
terraform destroy -target=[resource]
terraform apply -target=[resource]

# Verify
terraform show
```

### AWS CloudFormation Rollback

```bash
# CloudFormation automatically rolls back on failure
# Manual rollback:
aws cloudformation update-stack \
  --stack-name [stack-name] \
  --use-previous-template

# Or delete and recreate
aws cloudformation delete-stack --stack-name [stack-name]
# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name [stack-name]
# Recreate with old template
aws cloudformation create-stack \
  --stack-name [stack-name] \
  --template-body file://old-template.yaml
```

### Load Balancer Configuration Rollback

```bash
# AWS ALB
aws elbv2 describe-target-groups --names [target-group]

# Remove new targets
aws elbv2 deregister-targets \
  --target-group-arn [arn] \
  --targets Id=[instance-id]

# Add old targets back
aws elbv2 register-targets \
  --target-group-arn [arn] \
  --targets Id=[old-instance-id]
```

---

## Feature Flag Rollback

### LaunchDarkly

```bash
# Using CLI
ldcli toggle-off --flag [flag-key] --environment production

# Or via API
curl -X PATCH "https://app.launchdarkly.com/api/v2/flags/[project]/[flag-key]" \
  -H "Authorization: [api-key]" \
  -d '{"environmentKey": "production", "on": false}'
```

### Split.io

```bash
# Via dashboard or API
curl -X PUT "https://api.split.io/internal/api/v2/splits/[split-name]" \
  -H "Authorization: Bearer [api-key]" \
  -d '{"status": "OFF"}'
```

### Custom Feature Flag System

```bash
# Update feature flag in database
psql -h [host] -U [user] -d [database] -c \
  "UPDATE feature_flags SET enabled = false WHERE name = '[flag-name]';"

# Or via admin API
curl -X PATCH "http://[service]/admin/features/[flag-name]" \
  -H "Authorization: Bearer [token]" \
  -d '{"enabled": false}'
```

### Gradual Rollback

```bash
# Reduce percentage rollout
curl -X PATCH "http://[service]/admin/features/[flag-name]" \
  -d '{"rollout_percentage": 50}'  # Reduce from 100% to 50%

# Monitor for 5 minutes

# Reduce further if needed
curl -X PATCH "http://[service]/admin/features/[flag-name]" \
  -d '{"rollout_percentage": 10}'

# Disable completely if issues persist
curl -X PATCH "http://[service]/admin/features/[flag-name]" \
  -d '{"enabled": false}'
```

---

## Configuration Rollback

### Application Configuration

#### Kubernetes ConfigMap Rollback

```bash
# List ConfigMap versions (if using annotations)
kubectl describe configmap [name] -n [namespace]

# Restore from backup
kubectl apply -f backups/configmap-[timestamp].yaml

# Restart pods to pick up config
kubectl rollout restart deployment/[service] -n [namespace]
```

#### Environment Variable Rollback

```bash
# Edit deployment
kubectl edit deployment/[service] -n [namespace]

# Or use kubectl set
kubectl set env deployment/[service] \
  DATABASE_URL=[old-value] \
  -n [namespace]

# Verify
kubectl get deployment/[service] -n [namespace] -o yaml | grep -A 5 env
```

### Web Server Configuration

#### Nginx

```bash
# Restore old config
sudo cp /etc/nginx/sites-available/[site].conf.backup \
       /etc/nginx/sites-available/[site].conf

# Test config
sudo nginx -t

# Reload if test passes
sudo systemctl reload nginx

# Verify
curl -I http://localhost
```

#### Apache

```bash
# Restore old config
sudo cp /etc/apache2/sites-available/[site].conf.backup \
       /etc/apache2/sites-available/[site].conf

# Test config
sudo apache2ctl configtest

# Reload
sudo systemctl reload apache2
```

---

## DNS Changes Rollback

### Critical: DNS Changes Have Propagation Delay

**TTL Awareness:** DNS changes take time to propagate based on TTL.

### AWS Route53 Rollback

```bash
# List change history
aws route53 list-resource-record-sets \
  --hosted-zone-id [zone-id]

# Prepare rollback JSON
cat > rollback-dns.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "[domain]",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "[old-ip]"}]
    }
  }]
}
EOF

# Apply rollback
aws route53 change-resource-record-sets \
  --hosted-zone-id [zone-id] \
  --change-batch file://rollback-dns.json

# Monitor change status
aws route53 get-change --id [change-id]
```

### CloudFlare Rollback

```bash
# Via API
curl -X PUT "https://api.cloudflare.com/client/v4/zones/[zone]/dns_records/[record-id]" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "type": "A",
    "name": "[domain]",
    "content": "[old-ip]",
    "ttl": 300
  }'
```

### DNS Rollback Strategies

1. **Immediate Rollback (Low TTL)**
   - If TTL was set low (e.g., 60s), change propagates quickly
   - Wait 2x TTL for full propagation

2. **Traffic Split (During TTL Propagation)**

   ```bash
   # Add both old and new IPs temporarily
   # Some traffic goes to old, some to new
   # Remove new IP once confirmed problematic
   ```

3. **Load Balancer Weighted Routing**
   ```bash
   # Shift traffic weight back to old infrastructure
   aws route53 change-resource-record-sets \
     --change-batch file://weighted-rollback.json
   ```

---

## Third-Party Integration Rollback

### API Version Rollback

```bash
# Update API client version
npm install [package]@[old-version]

# Or update code to use old API version
# Before:
const apiVersion = 'v2';
# After:
const apiVersion = 'v1';

# Redeploy
kubectl rollout restart deployment/[service]
```

### OAuth/SSO Configuration Rollback

```bash
# Revert OAuth configuration
# Update environment variables or config
kubectl set env deployment/[service] \
  OAUTH_CLIENT_ID=[old-id] \
  OAUTH_CLIENT_SECRET=[old-secret] \
  -n [namespace]

# Restart to pick up config
kubectl rollout restart deployment/[service] -n [namespace]
```

### Payment Gateway Rollback

```bash
# Switch back to previous payment provider
kubectl set env deployment/payment-service \
  PAYMENT_PROVIDER=stripe \  # was 'braintree'
  -n production

# Restart
kubectl rollout restart deployment/payment-service -n production

# Verify
kubectl logs -l app=payment-service -n production --tail=20 | grep "Payment provider"
```

---

## Emergency Procedures

### Total Outage - Immediate Actions

```bash
# 1. Declare incident
# 2. Create incident channel
# 3. Rollback most recent change

# Quick rollback script
#!/bin/bash
set -e

SERVICE=$1
NAMESPACE=${2:-production}

echo "Rolling back $SERVICE in $NAMESPACE"

# Rollback deployment
kubectl rollout undo deployment/$SERVICE -n $NAMESPACE

# Wait for rollback
kubectl rollout status deployment/$SERVICE -n $NAMESPACE --timeout=5m

# Verify health
kubectl get pods -l app=$SERVICE -n $NAMESPACE

echo "Rollback complete. Monitor metrics."
```

### Cascading Failures

```bash
# Rollback all services in reverse deployment order

services=("frontend" "api-gateway" "order-service" "payment-service")

for service in "${services[@]}"; do
  echo "Rolling back $service"
  kubectl rollout undo deployment/$service -n production
  sleep 10  # Brief pause between rollbacks
done

# Verify all services
for service in "${services[@]}"; do
  kubectl rollout status deployment/$service -n production
done
```

### Database Emergency Rollback

```sql
-- Emergency: Revert data changes
BEGIN;

-- Disable constraints temporarily if needed
SET session_replication_role = 'replica';

-- Restore from backup table
TRUNCATE TABLE users;
INSERT INTO users SELECT * FROM users_backup_20240315;

-- Re-enable constraints
SET session_replication_role = 'origin';

-- Verify
SELECT COUNT(*) FROM users;

COMMIT;
```

### Kill Switch Activation

```bash
# Disable entire service/feature
curl -X POST "http://[service]/admin/kill-switch" \
  -H "Authorization: Bearer [emergency-token]" \
  -d '{"reason": "Emergency rollback", "enabled": true}'

# Verify service is returning 503 with maintenance message
curl -I http://[service]/

# Monitor that errors have stopped
```

---

## Rollback Communication Template

```
🔄 **ROLLBACK IN PROGRESS**

**Service:** [Service Name]
**Reason:** [Brief reason]
**Initiated By:** @[name]
**Initiated At:** [Time] UTC

**Actions:**
- Rolling back deployment from v[new] to v[old]
- ETA: [time]

**Monitor:** [Dashboard link]

Will update when complete.
```

---

## Rollback Verification Checklist

After any rollback:

- [ ] Service is responding to health checks
- [ ] Error rate returned to normal (<1%)
- [ ] Latency returned to normal (p95 < SLO)
- [ ] No customer reports of ongoing issues
- [ ] Monitored for at least 15 minutes
- [ ] Team notified of successful rollback
- [ ] Incident ticket created/updated
- [ ] Deployment pipeline blocked
- [ ] Postmortem scheduled

---

## Rollback Best Practices

1. **Always Have a Rollback Plan**
   - Document rollback procedure before deploying
   - Test rollback in staging
   - Know the previous stable version

2. **Maintain Backward Compatibility**
   - Database changes should be backward compatible
   - API changes should support old clients
   - Use feature flags for risky changes

3. **Monitor During Rollback**
   - Watch metrics closely
   - Have dashboard ready
   - Multiple people monitoring

4. **Document Everything**
   - What was rolled back
   - Why it was rolled back
   - Verification steps taken
   - Timeline of events

5. **Learn From Rollbacks**
   - Conduct postmortem
   - Update deployment procedures
   - Improve testing
   - Enhance monitoring

---

## Related Documents

- [Incident Runbook Template](./incident-runbook-template.md)
- [Deployment Procedures](../deployment/README.md)
- [Monitoring Alerts](./monitoring-alerts.yaml)

---

**Emergency Contact:** #incidents channel or page on-call via PagerDuty

**Questions?** Contact the Platform Team in #platform
