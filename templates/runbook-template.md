# Service Runbook Template

## Document Information

| Field               | Details                 |
| ------------------- | ----------------------- |
| **Service Name**    | [Service Name]          |
| **Version**         | 1.0                     |
| **Last Updated**    | YYYY-MM-DD              |
| **Document Owner**  | [Team/Person]           |
| **Review Schedule** | Quarterly               |
| **Classification**  | Internal / Confidential |

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Architecture](#architecture)
3. [Common Operations](#common-operations)
4. [Monitoring & Alerting](#monitoring--alerting)
5. [Troubleshooting](#troubleshooting)
6. [Incident Response](#incident-response)
7. [Rollback Procedures](#rollback-procedures)
8. [Maintenance Tasks](#maintenance-tasks)
9. [Contacts & Escalation](#contacts--escalation)
10. [Dependencies](#dependencies)

---

## Service Overview

### Purpose

[Brief description of what this service does and its business value]

**Example:**
The Payment Processing Service handles all payment transactions for the e-commerce platform. It integrates with multiple payment gateways, processes transactions, manages payment methods, and handles refunds. This service is critical for revenue generation and processes approximately 50,000 transactions daily.

### Key Features

- Credit/debit card processing
- Multiple payment gateway integration (Stripe, PayPal, Square)
- Recurring billing support
- Refund and chargeback management
- PCI DSS compliant payment tokenization
- Real-time fraud detection

### Service Characteristics

| Characteristic          | Value                                       |
| ----------------------- | ------------------------------------------- |
| **Service Type**        | REST API / Microservice / Background Worker |
| **Language/Framework**  | Node.js 18 / Express.js                     |
| **Database**            | PostgreSQL 14                               |
| **Cache**               | Redis 7.0                                   |
| **Message Queue**       | RabbitMQ 3.12                               |
| **Deployment Model**    | Kubernetes (EKS)                            |
| **Availability Target** | 99.99% (4 nines)                            |
| **RTO**                 | 30 minutes                                  |
| **RPO**                 | 5 minutes                                   |

### Service Metrics (Normal Operation)

| Metric               | Normal Range     | Alert Threshold |
| -------------------- | ---------------- | --------------- |
| Request Rate         | 800-1200 req/min | < 100 or > 2000 |
| Error Rate           | < 0.1%           | > 1%            |
| Latency (p95)        | < 500ms          | > 1000ms        |
| Latency (p99)        | < 1000ms         | > 2000ms        |
| CPU Usage            | 30-50%           | > 80%           |
| Memory Usage         | 2-4 GB           | > 6 GB          |
| Database Connections | 20-40            | > 80            |

---

## Architecture

### High-Level Architecture

```
                                 Internet
                                    |
                            Load Balancer (ALB)
                                    |
                    +---------------+---------------+
                    |               |               |
                API Pod 1       API Pod 2       API Pod 3
                    |               |               |
                    +-------+-------+-------+-------+
                            |
                    +-------+-------+
                    |               |
                PostgreSQL      Redis Cache
                (RDS)           (ElastiCache)
                    |
            Payment Gateways
            (Stripe, PayPal)
```

### Components

#### 1. API Server

- **Technology:** Node.js + Express.js
- **Replicas:** 3 (auto-scales 3-10)
- **Port:** 3000
- **Health Check:** `/health` endpoint
- **Location:** Kubernetes namespace `payment-service-prod`

#### 2. Database

- **Type:** PostgreSQL 14.5
- **Instance:** AWS RDS db.r5.xlarge
- **Storage:** 500 GB (auto-scaling enabled)
- **Backup:** Daily automated snapshots (retained 30 days)
- **Read Replicas:** 2 (for reporting queries)
- **Connection String:** Stored in AWS Secrets Manager

#### 3. Cache Layer

- **Type:** Redis 7.0
- **Instance:** AWS ElastiCache cache.r6g.large
- **Configuration:** Cluster mode enabled, 3 shards
- **Persistence:** AOF enabled, snapshots every 6 hours
- **Use Cases:** Session data, payment method tokens, rate limiting

#### 4. Message Queue

- **Type:** RabbitMQ 3.12
- **Queues:**
  - `payment.processing` - Payment transaction processing
  - `payment.notifications` - Payment status notifications
  - `payment.webhooks` - External webhook events
  - `payment.refunds` - Refund processing

### Network Configuration

| Component | Internal DNS             | External Endpoint        |
| --------- | ------------------------ | ------------------------ |
| API       | payment-service.internal | api.example.com/payments |
| Database  | payment-db.internal      | -                        |
| Redis     | payment-cache.internal   | -                        |
| RabbitMQ  | payment-queue.internal   | -                        |

### Security

- **Authentication:** JWT tokens (issued by Auth Service)
- **Authorization:** Role-based access control (RBAC)
- **Encryption:**
  - TLS 1.3 for all external connections
  - Encryption at rest for database
  - Payment data tokenized (PCI DSS compliant)
- **Secrets:** AWS Secrets Manager
- **Network:** VPC isolation, private subnets

---

## Common Operations

### Starting the Service

#### Development Environment

```bash
# Clone repository
git clone https://github.com/company/payment-service.git
cd payment-service

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with local configuration

# Start database (Docker)
docker-compose up -d postgres redis

# Run database migrations
npm run migrate

# Start the service
npm run dev

# Verify service is running
curl http://localhost:3000/health
```

#### Production Environment

```bash
# Connect to Kubernetes cluster
aws eks update-kubeconfig --name production-cluster --region us-east-1

# Verify current deployment
kubectl get deployment payment-service -n payment-service-prod

# Check current pods
kubectl get pods -n payment-service-prod -l app=payment-service

# View service status
kubectl describe service payment-service -n payment-service-prod

# Check recent events
kubectl get events -n payment-service-prod --sort-by='.lastTimestamp'
```

### Stopping the Service

#### Graceful Shutdown (Maintenance)

```bash
# Scale down to zero replicas (drains existing connections)
kubectl scale deployment payment-service --replicas=0 -n payment-service-prod

# Verify all pods terminated
kubectl get pods -n payment-service-prod -l app=payment-service

# Update status page
# Navigate to status.example.com and post maintenance notice
```

#### Emergency Shutdown

```bash
# Immediate shutdown (use only in emergencies)
kubectl delete deployment payment-service -n payment-service-prod

# Or redirect traffic at load balancer level
aws elbv2 deregister-targets --target-group-arn <arn> --targets Id=<instance-id>
```

### Restarting the Service

#### Rolling Restart (Zero Downtime)

```bash
# Trigger rolling restart of all pods
kubectl rollout restart deployment payment-service -n payment-service-prod

# Monitor rollout status
kubectl rollout status deployment payment-service -n payment-service-prod

# Verify new pods are healthy
kubectl get pods -n payment-service-prod -l app=payment-service

# Check logs for any startup errors
kubectl logs -n payment-service-prod -l app=payment-service --tail=50
```

#### Force Restart (If Rolling Restart Fails)

```bash
# Delete all pods (deployment will recreate them)
kubectl delete pods -n payment-service-prod -l app=payment-service

# Monitor pod recreation
watch kubectl get pods -n payment-service-prod
```

### Deployment

#### Standard Deployment

```bash
# 1. Verify you're on correct cluster
kubectl config current-context

# 2. Pull latest configuration
git pull origin main

# 3. Build new Docker image
docker build -t payment-service:v2.5.0 .

# 4. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag payment-service:v2.5.0 <account>.dkr.ecr.us-east-1.amazonaws.com/payment-service:v2.5.0
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/payment-service:v2.5.0

# 5. Update Kubernetes deployment
kubectl set image deployment/payment-service payment-service=<account>.dkr.ecr.us-east-1.amazonaws.com/payment-service:v2.5.0 -n payment-service-prod

# 6. Monitor rollout
kubectl rollout status deployment payment-service -n payment-service-prod

# 7. Verify deployment
kubectl get pods -n payment-service-prod
curl https://api.example.com/payments/health

# 8. Check error rates in Grafana
# Navigate to: https://grafana.example.com/d/payment-service
```

#### Canary Deployment

```bash
# 1. Create canary deployment (10% traffic)
kubectl apply -f k8s/canary-deployment.yaml

# 2. Monitor canary metrics for 15 minutes
# Check error rates, latency, business metrics

# 3. If metrics are good, increase to 50%
kubectl patch service payment-service -p '{"spec":{"selector":{"version":"canary"}}}' --type=strategic

# 4. Monitor for another 15 minutes

# 5. If still good, roll out to 100%
kubectl apply -f k8s/production-deployment.yaml

# 6. Remove canary deployment
kubectl delete -f k8s/canary-deployment.yaml
```

### Scaling

#### Manual Scaling

```bash
# Scale up to handle increased load
kubectl scale deployment payment-service --replicas=8 -n payment-service-prod

# Verify scaling
kubectl get pods -n payment-service-prod -l app=payment-service

# Monitor resource usage
kubectl top pods -n payment-service-prod
```

#### Auto-Scaling Configuration

```yaml
# HPA (Horizontal Pod Autoscaler) configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payment-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Monitoring & Alerting

### Monitoring Dashboards

#### Primary Dashboard

**URL:** https://grafana.example.com/d/payment-service-overview

**Key Panels:**

- Request rate (last 1 hour)
- Error rate percentage
- Latency (p50, p95, p99)
- Active connections
- Database query performance
- Cache hit rate
- Payment gateway response times

#### Infrastructure Dashboard

**URL:** https://grafana.example.com/d/payment-service-infrastructure

**Key Panels:**

- CPU usage per pod
- Memory usage per pod
- Network I/O
- Disk usage
- Pod restart count
- Node health

### Key Metrics to Monitor

#### Application Metrics

```
# Request metrics
payment_requests_total (counter)
payment_request_duration_seconds (histogram)
payment_errors_total (counter)

# Business metrics
payment_transactions_total (counter)
payment_transaction_amount_dollars (gauge)
payment_success_rate (gauge)
payment_refund_total (counter)

# Dependency metrics
payment_gateway_response_time_seconds (histogram)
payment_gateway_errors_total (counter)
database_query_duration_seconds (histogram)
cache_hit_rate (gauge)
```

#### Infrastructure Metrics

```
# Pod metrics
container_cpu_usage_seconds_total
container_memory_usage_bytes
container_network_receive_bytes_total
container_network_transmit_bytes_total

# Database metrics
pg_stat_database_xact_commit (commits per second)
pg_stat_database_xact_rollback (rollbacks per second)
pg_stat_activity_count (active connections)
pg_database_size_bytes
```

### Alerts

#### Critical Alerts (Page Immediately)

**High Error Rate**

```yaml
alert: HighErrorRate
expr: (sum(rate(payment_errors_total[5m])) / sum(rate(payment_requests_total[5m]))) > 0.05
for: 5m
labels:
  severity: critical
annotations:
  summary: 'Payment service error rate above 5%'
  description: 'Error rate is {{ $value | humanizePercentage }}'
```

**Service Down**

```yaml
alert: ServiceDown
expr: up{job="payment-service"} == 0
for: 2m
labels:
  severity: critical
annotations:
  summary: 'Payment service is down'
  description: 'Service has been down for more than 2 minutes'
```

**High Latency**

```yaml
alert: HighLatency
expr: histogram_quantile(0.95, payment_request_duration_seconds) > 2.0
for: 10m
labels:
  severity: critical
annotations:
  summary: 'Payment service p95 latency above 2s'
  description: 'P95 latency is {{ $value }}s'
```

#### Warning Alerts (Notify, No Page)

**Elevated Error Rate**

```yaml
alert: ElevatedErrorRate
expr: (sum(rate(payment_errors_total[5m])) / sum(rate(payment_requests_total[5m]))) > 0.01
for: 15m
labels:
  severity: warning
annotations:
  summary: 'Payment service error rate above 1%'
  description: 'Error rate is {{ $value | humanizePercentage }}'
```

**High Memory Usage**

```yaml
alert: HighMemoryUsage
expr: container_memory_usage_bytes{pod=~"payment-service-.*"} / container_spec_memory_limit_bytes > 0.85
for: 15m
labels:
  severity: warning
annotations:
  summary: 'Payment service memory usage above 85%'
  description: 'Memory usage is {{ $value | humanizePercentage }}'
```

### Log Locations

#### Application Logs

```bash
# View real-time logs
kubectl logs -f -n payment-service-prod -l app=payment-service

# View logs from all pods
kubectl logs -n payment-service-prod -l app=payment-service --tail=100

# View logs from specific pod
kubectl logs -n payment-service-prod payment-service-abc123-xyz

# Search logs in Elasticsearch
# Navigate to: https://kibana.example.com
# Index pattern: payment-service-*
# Time range: Last 15 minutes
```

#### Audit Logs

- **Location:** S3 bucket `s3://company-audit-logs/payment-service/`
- **Retention:** 7 years
- **Format:** JSON
- **Contents:** All payment transactions, refunds, user actions

---

## Troubleshooting

### Common Issues

#### Issue 1: High Response Time

**Symptoms:**

- API response time > 2 seconds
- Users reporting slow checkout experience
- Grafana dashboard showing elevated p95 latency

**Diagnostic Steps:**

```bash
# 1. Check current response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/payments/health

# 2. Check database query performance
kubectl exec -it payment-db-0 -n payment-service-prod -- psql -U postgres -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"

# 3. Check cache hit rate
redis-cli -h payment-cache.internal INFO stats | grep hit_rate

# 4. Check for slow external API calls
kubectl logs -n payment-service-prod -l app=payment-service | grep "gateway_response_time" | tail -100
```

**Common Causes & Solutions:**

| Cause                | Solution                                 | ETA    |
| -------------------- | ---------------------------------------- | ------ |
| Database query slow  | Analyze and optimize query, add index    | 30 min |
| Cache miss high      | Warm up cache, increase TTL              | 15 min |
| Payment gateway slow | Switch to backup gateway, contact vendor | 5 min  |
| High traffic         | Scale up pods                            | 5 min  |
| Memory leak          | Restart pods, investigate code           | 10 min |

**Resolution Steps:**

```bash
# If database is slow - analyze specific query
EXPLAIN ANALYZE SELECT * FROM payments WHERE user_id = 12345;

# If cache miss is high - warm up cache
node scripts/warm-cache.js

# If need to scale immediately
kubectl scale deployment payment-service --replicas=10 -n payment-service-prod
```

---

#### Issue 2: Service Not Starting

**Symptoms:**

- Pods in CrashLoopBackOff state
- Health check endpoint not responding
- Deployment rollout stuck

**Diagnostic Steps:**

```bash
# 1. Check pod status
kubectl get pods -n payment-service-prod -l app=payment-service

# 2. Describe problematic pod
kubectl describe pod payment-service-xxx-yyy -n payment-service-prod

# 3. Check pod logs
kubectl logs payment-service-xxx-yyy -n payment-service-prod

# 4. Check previous container logs (if crashed)
kubectl logs payment-service-xxx-yyy -n payment-service-prod --previous

# 5. Check events
kubectl get events -n payment-service-prod --sort-by='.lastTimestamp' | tail -20
```

**Common Causes & Solutions:**

| Cause                         | Solution                             | ETA    |
| ----------------------------- | ------------------------------------ | ------ |
| Database connection failed    | Check DB credentials, security group | 10 min |
| Missing environment variables | Update ConfigMap/Secret              | 5 min  |
| Image pull error              | Check ECR permissions                | 10 min |
| Insufficient resources        | Increase resource limits             | 5 min  |
| Port already in use           | Check port conflicts                 | 5 min  |
| Migration failed              | Rollback migration, fix and retry    | 20 min |

**Resolution Steps:**

```bash
# If database connection issue
kubectl get secret payment-db-credentials -n payment-service-prod -o jsonpath='{.data.password}' | base64 --decode

# If environment variables missing
kubectl edit configmap payment-service-config -n payment-service-prod

# If image pull error
kubectl describe pod payment-service-xxx-yyy -n payment-service-prod | grep -A 5 "Events"

# If need to rollback
kubectl rollout undo deployment payment-service -n payment-service-prod
```

---

#### Issue 3: Database Connection Pool Exhausted

**Symptoms:**

- Errors: "Unable to acquire connection from pool"
- Response time increasing
- Database connection count at maximum

**Diagnostic Steps:**

```bash
# 1. Check active database connections
kubectl exec -it payment-db-0 -n payment-service-prod -- psql -U postgres -c "
SELECT count(*) as connections, state
FROM pg_stat_activity
WHERE datname = 'payment_service'
GROUP BY state;"

# 2. Check long-running queries
kubectl exec -it payment-db-0 -n payment-service-prod -- psql -U postgres -c "
SELECT pid, now() - query_start as duration, state, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;"

# 3. Check connection pool config
kubectl get configmap payment-service-config -n payment-service-prod -o yaml | grep -A 5 "database"
```

**Resolution Steps:**

```bash
# 1. Kill long-running queries (if found)
kubectl exec -it payment-db-0 -n payment-service-prod -- psql -U postgres -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 minutes';"

# 2. Restart pods to release connections
kubectl rollout restart deployment payment-service -n payment-service-prod

# 3. If needed, temporarily increase connection pool
kubectl set env deployment/payment-service DB_POOL_MAX=50 -n payment-service-prod

# 4. Investigate root cause
kubectl logs -n payment-service-prod -l app=payment-service | grep "connection" | tail -100
```

---

#### Issue 4: Payment Gateway Errors

**Symptoms:**

- Payment transactions failing
- Gateway-specific error codes
- Increased error rate for specific gateway

**Diagnostic Steps:**

```bash
# 1. Check gateway-specific error rates
kubectl logs -n payment-service-prod -l app=payment-service | grep "gateway_error" | grep "stripe" | tail -50

# 2. Check gateway status page
curl https://status.stripe.com/api/v2/status.json

# 3. Check recent gateway API calls
kubectl logs -n payment-service-prod -l app=payment-service | grep "stripe_api_call" | tail -20
```

**Resolution Steps:**

```bash
# 1. Switch to backup gateway (if configured)
kubectl set env deployment/payment-service PRIMARY_GATEWAY=paypal -n payment-service-prod

# 2. Update status page
# Post update on status.example.com

# 3. Contact gateway support
# Open ticket at gateway support portal

# 4. Monitor error rates
# Watch Grafana dashboard for improvement
```

---

### Debugging Commands

#### Check Service Health

```bash
# Internal health check
kubectl exec -it payment-service-xxx-yyy -n payment-service-prod -- curl localhost:3000/health

# External health check
curl https://api.example.com/payments/health

# Detailed health info
curl https://api.example.com/payments/health/detailed
```

#### Inspect Configuration

```bash
# View ConfigMap
kubectl get configmap payment-service-config -n payment-service-prod -o yaml

# View Secrets (base64 encoded)
kubectl get secret payment-service-secrets -n payment-service-prod -o yaml

# View environment variables in running pod
kubectl exec -it payment-service-xxx-yyy -n payment-service-prod -- env | sort
```

#### Database Debugging

```bash
# Connect to database
kubectl exec -it payment-db-0 -n payment-service-prod -- psql -U postgres payment_service

# Check database size
SELECT pg_size_pretty(pg_database_size('payment_service'));

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active locks
SELECT * FROM pg_locks WHERE granted = false;
```

#### Cache Debugging

```bash
# Connect to Redis
kubectl exec -it payment-cache-0 -n payment-service-prod -- redis-cli

# Check cache stats
INFO stats

# Check key count
DBSIZE

# Check specific key
GET payment:token:user123

# Monitor cache operations
MONITOR
```

---

## Incident Response

### Incident Severity Levels

| Level     | Definition                             | Response Time | Examples                             |
| --------- | -------------------------------------- | ------------- | ------------------------------------ |
| **SEV-1** | Complete service outage                | < 5 minutes   | Service down, database inaccessible  |
| **SEV-2** | Partial outage or degraded performance | < 15 minutes  | High error rate, slow response times |
| **SEV-3** | Minor issue, limited user impact       | < 1 hour      | Single payment gateway failing       |
| **SEV-4** | Cosmetic or low-impact issue           | < 4 hours     | Logging issues, minor UI problems    |

### Incident Response Procedure

#### 1. Detection & Assessment (0-5 minutes)

```bash
# Acknowledge alert in PagerDuty
# Create incident Slack channel: #incident-YYYY-MM-DD-payment

# Quick assessment
kubectl get pods -n payment-service-prod
kubectl get events -n payment-service-prod --sort-by='.lastTimestamp' | tail -20

# Check dashboards
# Open: https://grafana.example.com/d/payment-service-overview

# Determine severity level
# SEV-1 if: Error rate > 50% OR Response time > 10s OR Complete outage
# SEV-2 if: Error rate 5-50% OR Response time 2-10s
```

#### 2. Communication (5-10 minutes)

```bash
# Update status page
# Navigate to: https://status.example.com/admin
# Post: "Investigating payment processing issues"

# Notify stakeholders
# Post in #incidents Slack channel
# Page additional team members if needed

# Assign roles
# Incident Commander: [Name]
# Technical Lead: [Name]
# Communications Lead: [Name]
# Scribe: [Name]
```

#### 3. Investigation & Mitigation (10-30 minutes)

```bash
# Check recent deployments
kubectl rollout history deployment payment-service -n payment-service-prod

# Check logs for errors
kubectl logs -n payment-service-prod -l app=payment-service --tail=200 | grep ERROR

# Check resource usage
kubectl top pods -n payment-service-prod

# Check dependencies
curl https://api.example.com/payments/dependencies/health

# Mitigation options (in order of preference):
# 1. Quick configuration change
# 2. Scale up/down
# 3. Restart pods
# 4. Rollback deployment
# 5. Redirect traffic
# 6. Enable maintenance mode
```

#### 4. Resolution & Recovery (30-60 minutes)

```bash
# Implement fix
# (Based on root cause identified)

# Verify fix
kubectl get pods -n payment-service-prod
curl https://api.example.com/payments/health

# Monitor metrics
# Watch error rate return to normal
# Watch response time return to baseline

# Extended monitoring period (15-30 minutes)
```

#### 5. Post-Incident (After resolution)

```bash
# Update status page
# Post: "Service restored. Monitoring closely."

# Schedule postmortem
# Within 24 hours

# Document timeline
# Update incident spreadsheet

# Thank team members
# Post appreciation in Slack
```

---

## Rollback Procedures

### Quick Rollback

#### Rollback Deployment

```bash
# 1. View rollout history
kubectl rollout history deployment payment-service -n payment-service-prod

# Output:
# REVISION  CHANGE-CAUSE
# 1         Initial deployment
# 2         Update to v2.4.0
# 3         Update to v2.5.0

# 2. Rollback to previous version
kubectl rollout undo deployment payment-service -n payment-service-prod

# 3. Monitor rollback
kubectl rollout status deployment payment-service -n payment-service-prod

# 4. Verify service health
kubectl get pods -n payment-service-prod
curl https://api.example.com/payments/health
```

#### Rollback to Specific Version

```bash
# Rollback to specific revision
kubectl rollout undo deployment payment-service --to-revision=2 -n payment-service-prod

# Verify correct version is deployed
kubectl describe deployment payment-service -n payment-service-prod | grep Image
```

### Database Rollback

#### Rollback Migration

```bash
# 1. Connect to pod
kubectl exec -it payment-service-xxx-yyy -n payment-service-prod -- /bin/sh

# 2. Check migration status
npm run migrate:status

# 3. Rollback last migration
npm run migrate:down

# 4. Verify database schema
npm run migrate:status
```

#### Restore from Backup

```bash
# 1. Find latest backup
aws rds describe-db-snapshots \
  --db-instance-identifier payment-service-db \
  --snapshot-type automated \
  --query 'reverse(sort_by(DBSnapshots, &SnapshotCreateTime))[0]'

# 2. Stop application (prevent writes)
kubectl scale deployment payment-service --replicas=0 -n payment-service-prod

# 3. Restore snapshot to new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier payment-service-db-restored \
  --db-snapshot-identifier <snapshot-id>

# 4. Update connection string
kubectl set env deployment/payment-service DATABASE_URL="postgres://..." -n payment-service-prod

# 5. Restart application
kubectl scale deployment payment-service --replicas=3 -n payment-service-prod
```

### Configuration Rollback

#### Rollback ConfigMap

```bash
# ConfigMaps don't have built-in rollback, so maintain versions

# 1. Apply previous version from git
git checkout HEAD~1 k8s/configmap.yaml
kubectl apply -f k8s/configmap.yaml

# 2. Restart pods to pick up new config
kubectl rollout restart deployment payment-service -n payment-service-prod
```

### DNS/Traffic Rollback

#### Route Traffic to Previous Version

```bash
# If both versions are running, update service selector

# 1. Update service to point to old version
kubectl patch service payment-service -p '{"spec":{"selector":{"version":"v2.4.0"}}}' -n payment-service-prod

# 2. Verify traffic routing
kubectl describe service payment-service -n payment-service-prod

# 3. Scale down new version
kubectl scale deployment payment-service-v2-5-0 --replicas=0 -n payment-service-prod
```

---

## Maintenance Tasks

### Daily Tasks

- [ ] Review error logs for anomalies
- [ ] Check alert noise and tune thresholds
- [ ] Verify backup completion
- [ ] Monitor disk space trends

```bash
# Check daily backup status
aws rds describe-db-snapshots --db-instance-identifier payment-service-db \
  --query "DBSnapshots[?contains(DBSnapshotIdentifier, '$(date +%Y-%m-%d)')]"

# Review error logs
kubectl logs -n payment-service-prod -l app=payment-service --since=24h | grep ERROR | wc -l
```

### Weekly Tasks

- [ ] Review and optimize slow queries
- [ ] Check and update dependencies
- [ ] Review capacity and scaling trends
- [ ] Clean up old data (if applicable)
- [ ] Review security alerts

```bash
# Check for dependency updates
npm outdated

# Analyze slow queries
kubectl exec -it payment-db-0 -n payment-service-prod -- psql -U postgres -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;"

# Check disk usage trends
kubectl exec -it payment-db-0 -n payment-service-prod -- df -h
```

### Monthly Tasks

- [ ] Review and update runbook
- [ ] Conduct disaster recovery drill
- [ ] Review access permissions
- [ ] Update documentation
- [ ] Analyze cost optimization opportunities

```bash
# Test backup restoration
# Follow "Restore from Backup" procedure in non-prod environment

# Review AWS costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "1 month ago" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://cost-filter.json
```

### Quarterly Tasks

- [ ] Security audit and penetration testing
- [ ] Performance testing and benchmarking
- [ ] Review SLO/SLA compliance
- [ ] Update disaster recovery plan
- [ ] Team training on new features

---

## Contacts & Escalation

### Team Contacts

| Role                 | Name               | Email             | Phone       | Slack    |
| -------------------- | ------------------ | ----------------- | ----------- | -------- |
| **Product Owner**    | Jane Doe           | jane@example.com  | +1-555-0101 | @jane    |
| **Engineering Lead** | John Smith         | john@example.com  | +1-555-0102 | @john    |
| **SRE Lead**         | Alice Johnson      | alice@example.com | +1-555-0103 | @alice   |
| **On-Call Engineer** | PagerDuty Rotation | -                 | +1-555-0199 | #on-call |

### Escalation Path

```
Level 1: On-Call Engineer
  ↓ (15 minutes if unresolved)
Level 2: Engineering Lead + SRE Lead
  ↓ (30 minutes if unresolved)
Level 3: Engineering Director
  ↓ (1 hour if unresolved or high business impact)
Level 4: VP Engineering + CTO
```

### External Contacts

| Vendor      | Purpose         | Contact                     | Support Portal                 |
| ----------- | --------------- | --------------------------- | ------------------------------ |
| **AWS**     | Infrastructure  | +1-800-AWS-HELP             | console.aws.amazon.com/support |
| **Stripe**  | Payment Gateway | support@stripe.com          | dashboard.stripe.com/support   |
| **PayPal**  | Payment Gateway | merchant-support@paypal.com | paypal.com/merchant-support    |
| **Datadog** | Monitoring      | support@datadoghq.com       | app.datadoghq.com/help         |

### Communication Channels

| Channel              | Purpose                | Link                              |
| -------------------- | ---------------------- | --------------------------------- |
| **#payment-service** | General discussion     | slack://channel?team=T123&id=C456 |
| **#incidents**       | Active incidents       | slack://channel?team=T123&id=C789 |
| **#on-call**         | On-call coordination   | slack://channel?team=T123&id=C012 |
| **Status Page**      | Customer communication | https://status.example.com        |

---

## Dependencies

### Upstream Dependencies (Services this service depends on)

| Service                  | Purpose                 | Contact        | SLA    | Criticality | Health Check                   |
| ------------------------ | ----------------------- | -------------- | ------ | ----------- | ------------------------------ |
| **Auth Service**         | User authentication     | @auth-team     | 99.9%  | Critical    | https://auth.internal/health   |
| **User Service**         | User profile data       | @user-team     | 99.5%  | High        | https://user.internal/health   |
| **Notification Service** | Email/SMS notifications | @notify-team   | 99%    | Medium      | https://notify.internal/health |
| **PostgreSQL**           | Primary database        | @dba-team      | 99.99% | Critical    | Internal monitoring            |
| **Redis**                | Caching                 | @platform-team | 99.9%  | High        | Internal monitoring            |
| **Stripe API**           | Payment processing      | Stripe Support | 99.99% | Critical    | https://status.stripe.com      |
| **PayPal API**           | Payment processing      | PayPal Support | 99.99% | Critical    | https://status.paypal.com      |

### Downstream Dependencies (Services that depend on this service)

| Service                  | Purpose                | Contact            | Impact of Outage             |
| ------------------------ | ---------------------- | ------------------ | ---------------------------- |
| **Order Service**        | Order processing       | @order-team        | Cannot complete orders       |
| **Subscription Service** | Recurring billing      | @subscription-team | Cannot process subscriptions |
| **Reporting Service**    | Financial reports      | @analytics-team    | Reports show stale data      |
| **Admin Portal**         | Transaction management | @admin-team        | Cannot view/manage payments  |

### External APIs

| API                 | Purpose            | Rate Limit  | Timeout | Retry Policy                       |
| ------------------- | ------------------ | ----------- | ------- | ---------------------------------- |
| **Stripe**          | Payment processing | 100 req/sec | 30s     | 3 retries with exponential backoff |
| **PayPal**          | Payment processing | 50 req/sec  | 30s     | 3 retries with exponential backoff |
| **Fraud Detection** | Fraud check        | 200 req/sec | 5s      | No retry (fail open)               |
| **Tax Calculator**  | Tax calculation    | 100 req/sec | 10s     | 2 retries                          |

### Database Schema

| Table               | Purpose                | Size   | Growth Rate  |
| ------------------- | ---------------------- | ------ | ------------ |
| **payments**        | Payment records        | 500 GB | 5 GB/month   |
| **transactions**    | Transaction log        | 200 GB | 2 GB/month   |
| **payment_methods** | Stored payment methods | 50 GB  | 500 MB/month |
| **refunds**         | Refund records         | 100 GB | 1 GB/month   |

---

## Appendix

### Useful Commands Reference

```bash
# Quick service status
alias ps-status='kubectl get all -n payment-service-prod -l app=payment-service'

# Watch pod status
alias ps-watch='watch kubectl get pods -n payment-service-prod'

# Tail logs
alias ps-logs='kubectl logs -f -n payment-service-prod -l app=payment-service'

# Port forward for local testing
alias ps-forward='kubectl port-forward -n payment-service-prod svc/payment-service 3000:3000'

# Quick health check
alias ps-health='curl -s https://api.example.com/payments/health | jq'

# Check database connections
alias ps-db-conn='kubectl exec -it payment-db-0 -n payment-service-prod -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname = \"payment_service\";"'
```

### Related Documentation

- [API Documentation](https://docs.example.com/api/payments)
- [Architecture Decision Records](https://github.com/company/payment-service/tree/main/docs/adr)
- [Deployment Guide](https://docs.example.com/deployment/payment-service)
- [Security Policy](https://docs.example.com/security/payment-service)
- [Disaster Recovery Plan](https://docs.example.com/dr/payment-service)

### Glossary

- **RTO (Recovery Time Objective):** Maximum acceptable time to restore service
- **RPO (Recovery Point Objective):** Maximum acceptable data loss
- **SLA (Service Level Agreement):** Commitment to service availability
- **SLO (Service Level Objective):** Target metric for service performance
- **SLI (Service Level Indicator):** Measurement of service performance

---

## Document History

| Version | Date       | Author        | Changes                       |
| ------- | ---------- | ------------- | ----------------------------- |
| 1.0     | 2024-01-15 | John Smith    | Initial version               |
| 1.1     | 2024-02-20 | Alice Johnson | Added troubleshooting section |
| 1.2     | 2024-03-10 | John Smith    | Updated monitoring section    |

---

## Feedback

This runbook is a living document. If you find errors, missing information, or have suggestions for improvement:

1. Create an issue: https://github.com/company/payment-service/issues
2. Submit a PR with updates
3. Message in #payment-service Slack channel

**Last Review Date:** YYYY-MM-DD
**Next Review Date:** YYYY-MM-DD
