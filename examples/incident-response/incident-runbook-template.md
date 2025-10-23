# Service Runbook: [Service Name]

**Last Updated:** [Date]
**Owner:** [Team Name]
**On-Call Rotation:** [Link to schedule]
**Service Dashboard:** [Link to Grafana/monitoring dashboard]
**Alert Configuration:** [Link to alert rules]

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Architecture](#architecture)
3. [Dependencies](#dependencies)
4. [Common Issues and Resolutions](#common-issues-and-resolutions)
5. [Monitoring and Alerts](#monitoring-and-alerts)
6. [Rollback Procedures](#rollback-procedures)
7. [Escalation Paths](#escalation-paths)
8. [Useful Commands](#useful-commands)
9. [External Resources](#external-resources)

---

## Service Overview

### Purpose

[Brief description of what this service does and its business criticality]

**Example:**

> The Order Processing Service handles all customer orders from submission through fulfillment. It's a critical service with 99.9% availability SLO. Downtime directly impacts revenue.

### Key Functionality

- **Function 1:** [Description]
- **Function 2:** [Description]
- **Function 3:** [Description]

### Service Criticality

- **Tier:** [1 (Critical) / 2 (High) / 3 (Medium) / 4 (Low)]
- **SLO Target:** [e.g., 99.9% availability, <500ms p95 latency]
- **Business Impact:** [Revenue impact, customer-facing, internal tool, etc.]

---

## Architecture

### System Diagram

```
┌─────────────┐
│   Client    │
│ Application │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────┐
│ [Service Name]   │─────▶│  Database    │
│  (Primary)       │      │  (PostgreSQL)│
└────────┬─────────┘      └──────────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌────────────┐  ┌──────────────┐
│   Cache    │  │ Message Queue│
│  (Redis)   │  │  (RabbitMQ)  │
└────────────┘  └──────────────┘
```

### Component Details

#### Application Servers

- **Technology:** [e.g., Node.js 18, Python 3.11]
- **Deployment:** [e.g., Kubernetes, EC2, ECS]
- **Instance Count:** [e.g., 3 replicas minimum, auto-scales to 10]
- **Region:** [e.g., us-east-1, multi-region]

#### Database

- **Type:** [e.g., PostgreSQL 15, MongoDB 6]
- **Configuration:** [e.g., Primary-Replica, Cluster size]
- **Backup:** [Schedule and retention policy]
- **Connection Pool:** [Size and configuration]

#### Cache

- **Type:** [e.g., Redis 7, Memcached]
- **Usage:** [What's cached and TTL]
- **Eviction Policy:** [e.g., LRU, TTL-based]

#### Message Queue

- **Type:** [e.g., RabbitMQ, Kafka, SQS]
- **Queues:** [List of queues and their purpose]
- **Retention:** [Message retention policy]

---

## Dependencies

### Upstream Services (Services that call this service)

| Service     | Purpose   | Impact if Down | Fallback            |
| ----------- | --------- | -------------- | ------------------- |
| [Service A] | [Purpose] | [Impact]       | [Fallback strategy] |
| [Service B] | [Purpose] | [Impact]       | [Fallback strategy] |

### Downstream Services (Services this service calls)

| Service     | Purpose   | Timeout | Circuit Breaker         | Fallback   |
| ----------- | --------- | ------- | ----------------------- | ---------- |
| [Service C] | [Purpose] | 5s      | Enabled (50% threshold) | [Fallback] |
| [Service D] | [Purpose] | 3s      | Enabled (70% threshold) | [Fallback] |

### External Dependencies

- **Payment Gateway:** [Provider, timeout, fallback]
- **CDN:** [Provider, failover strategy]
- **Email Service:** [Provider, queue-based fallback]
- **Monitoring:** [Provider, critical for operations]

---

## Common Issues and Resolutions

### Issue 1: High Error Rate (HTTP 500)

**Symptoms:**

- Alert: "Error rate exceeds 5% for 5 minutes"
- Dashboard shows spike in 5xx errors
- Customer reports of failed operations

**Possible Causes:**

1. Database connection pool exhausted
2. Downstream service timeout
3. Memory leak in application
4. Recent deployment issue

**Investigation Steps:**

1. **Check application logs:**

   ```bash
   kubectl logs -f deployment/[service-name] --tail=100 | grep ERROR
   ```

2. **Check error breakdown:**

   ```bash
   # View errors by type
   curl 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' | jq
   ```

3. **Check database connections:**

   ```bash
   # PostgreSQL
   kubectl exec -it postgres-0 -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
   ```

4. **Check downstream service health:**
   ```bash
   curl http://[downstream-service]/health
   ```

**Resolution:**

**If Database Connection Pool Exhausted:**

```bash
# Temporary: Restart pods to reset connections
kubectl rollout restart deployment/[service-name]

# Long-term: Increase pool size in configuration
kubectl edit configmap [service-name]-config
# Update: DATABASE_POOL_SIZE: "50"
```

**If Downstream Service Timeout:**

```bash
# Check circuit breaker status
curl http://[service-name]/admin/circuit-breaker-status

# Manually open circuit breaker if needed
curl -X POST http://[service-name]/admin/circuit-breaker/open
```

**If Recent Deployment Issue:**

```bash
# Rollback deployment
kubectl rollout undo deployment/[service-name]

# Verify rollback
kubectl rollout status deployment/[service-name]
```

**Prevention:**

- Implement connection pooling best practices
- Add retry logic with exponential backoff
- Implement circuit breakers for all downstream calls
- Gradual rollout strategy (canary/blue-green)

---

### Issue 2: High Latency (p95 > 1000ms)

**Symptoms:**

- Alert: "p95 latency exceeds 1000ms for 10 minutes"
- Dashboard shows latency spike
- Slow page loads reported by users

**Possible Causes:**

1. Database query performance degradation
2. Cache miss rate increased
3. High CPU/Memory usage
4. Network issues

**Investigation Steps:**

1. **Check service metrics:**

   ```bash
   # View latency percentiles
   curl 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'
   ```

2. **Check database slow queries:**

   ```sql
   -- PostgreSQL slow query log
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY duration DESC;
   ```

3. **Check cache hit rate:**

   ```bash
   redis-cli info stats | grep hit_rate
   ```

4. **Check resource usage:**
   ```bash
   kubectl top pods -l app=[service-name]
   ```

**Resolution:**

**If Database Query Issue:**

```sql
-- Identify and kill slow queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = [slow-query-pid];

-- Add missing index (if identified)
CREATE INDEX CONCURRENTLY idx_[table]_[column] ON [table]([column]);
```

**If Cache Issue:**

```bash
# Warm up cache
curl -X POST http://[service-name]/admin/cache-warmup

# Increase cache TTL temporarily
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

**If Resource Exhaustion:**

```bash
# Scale up pods
kubectl scale deployment/[service-name] --replicas=10

# Or increase resource limits
kubectl set resources deployment/[service-name] --limits=cpu=2000m,memory=4Gi
```

**Prevention:**

- Implement query performance monitoring
- Set up cache warming on deployment
- Configure autoscaling based on latency
- Regular database query optimization

---

### Issue 3: Service Completely Down

**Symptoms:**

- Alert: "Service is unreachable"
- All health checks failing
- 100% error rate

**Possible Causes:**

1. Kubernetes pods crashed
2. Configuration error in recent deployment
3. Database is down
4. Network partition

**Investigation Steps:**

1. **Check pod status:**

   ```bash
   kubectl get pods -l app=[service-name]
   ```

2. **Check pod events:**

   ```bash
   kubectl describe pod [pod-name]
   ```

3. **Check recent deployments:**

   ```bash
   kubectl rollout history deployment/[service-name]
   ```

4. **Check database connectivity:**
   ```bash
   kubectl exec -it [pod-name] -- nc -zv postgres 5432
   ```

**Resolution:**

**If Pods CrashLooping:**

```bash
# Check logs for crash reason
kubectl logs [pod-name] --previous

# If config issue, rollback
kubectl rollout undo deployment/[service-name]

# If database connection issue, check secrets
kubectl get secret [db-secret] -o yaml
```

**If Database Down:**

```bash
# Check database pods
kubectl get pods -l app=postgres

# Restart database if needed (CAREFUL!)
kubectl delete pod postgres-0

# Verify database is accepting connections
kubectl exec -it postgres-0 -- pg_isready
```

**If Network Issue:**

```bash
# Check service endpoints
kubectl get endpoints [service-name]

# Check network policies
kubectl get networkpolicies

# Test connectivity from another pod
kubectl run test-pod --rm -it --image=busybox -- wget -O- http://[service-name]:8080/health
```

**Prevention:**

- Implement readiness and liveness probes
- Set up PodDisruptionBudget
- Multi-region deployment
- Regular disaster recovery drills

---

### Issue 4: Memory Leak

**Symptoms:**

- Gradual memory increase over time
- Pods being OOMKilled
- Alert: "Memory usage exceeds 90%"

**Investigation Steps:**

1. **Check memory trends:**

   ```bash
   # View memory usage over time in Grafana
   # Or query Prometheus
   curl 'http://prometheus:9090/api/v1/query?query=container_memory_usage_bytes{pod=~"[service-name].*"}'
   ```

2. **Generate heap dump:**

   ```bash
   # For Node.js
   kubectl exec -it [pod-name] -- kill -USR2 $(pgrep node)

   # For Java
   kubectl exec -it [pod-name] -- jmap -dump:format=b,file=/tmp/heap.hprof [PID]
   ```

3. **Analyze heap dump:**

   ```bash
   # Copy heap dump locally
   kubectl cp [pod-name]:/tmp/heapdump-*.heapsnapshot ./heapdump.heapsnapshot

   # Analyze with Chrome DevTools or specialized tool
   ```

**Resolution:**

**Immediate:**

```bash
# Restart affected pods to free memory
kubectl delete pod [pod-name]

# Or rolling restart
kubectl rollout restart deployment/[service-name]
```

**Long-term:**

- Fix memory leak in code
- Increase memory limits temporarily
- Implement memory leak detection in CI/CD
- Add memory profiling to monitoring

---

## Monitoring and Alerts

### Key Metrics

| Metric         | Normal Range | Warning Threshold | Critical Threshold |
| -------------- | ------------ | ----------------- | ------------------ |
| Error Rate     | < 0.1%       | > 1%              | > 5%               |
| p95 Latency    | < 200ms      | > 500ms           | > 1000ms           |
| Availability   | 99.9%        | < 99.5%           | < 99%              |
| CPU Usage      | < 60%        | > 80%             | > 95%              |
| Memory Usage   | < 70%        | > 85%             | > 95%              |
| DB Connections | < 50         | > 80              | > 95               |

### Dashboard Links

- **Service Overview:** [Grafana Dashboard URL]
- **Infrastructure:** [Kubernetes Dashboard URL]
- **Database:** [Database Monitoring URL]
- **Logs:** [Kibana/Splunk URL]
- **Traces:** [Jaeger/Zipkin URL]

### Alert Channels

- **Slack:** #alerts-[service-name]
- **PagerDuty:** [Service Name] - SEV-1/2 only
- **Email:** [team-email]@company.com

---

## Rollback Procedures

### Application Rollback

```bash
# View deployment history
kubectl rollout history deployment/[service-name]

# Rollback to previous version
kubectl rollout undo deployment/[service-name]

# Rollback to specific revision
kubectl rollout undo deployment/[service-name] --to-revision=3

# Verify rollback
kubectl rollout status deployment/[service-name]

# Check pods are running new version
kubectl get pods -l app=[service-name] -o jsonpath='{.items[*].spec.containers[0].image}'
```

### Database Migration Rollback

```bash
# Connect to database
kubectl exec -it postgres-0 -- psql -U postgres -d [database]

# Run down migration
npm run migrate:down

# Or manually if needed
# SQL rollback script should be in migrations/[version]_down.sql
```

### Configuration Rollback

```bash
# Rollback ConfigMap
kubectl rollout undo configmap/[service-name]-config

# Restart pods to pick up old config
kubectl rollout restart deployment/[service-name]
```

### Feature Flag Rollback

```bash
# Disable feature flag via admin API
curl -X POST http://[service-name]/admin/features/[feature-name]/disable

# Or via feature flag service
curl -X PATCH https://feature-flags.company.com/api/flags/[flag-id] \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"enabled": false}'
```

---

## Escalation Paths

### Level 1: On-Call Engineer

**When:** All incidents initially
**Contact:** PagerDuty rotation
**Expected Actions:**

- Acknowledge incident within 5 minutes
- Begin investigation
- Follow runbook procedures
- Escalate if needed

### Level 2: Team Lead

**When:**

- Incident not resolved within 30 minutes
- SEV-1 incidents (always)
- Need additional expertise

**Contact:**

- Primary: [Name] - [Phone] - [Slack]
- Secondary: [Name] - [Phone] - [Slack]

### Level 3: Engineering Manager

**When:**

- SEV-1 incidents (for visibility)
- Major incidents affecting multiple services
- Need cross-team coordination

**Contact:**

- [Name] - [Phone] - [Email]

### Level 4: VP Engineering / CTO

**When:**

- Critical business impact
- Extended outage (> 2 hours)
- Data breach or security incident
- Customer escalation

**Contact:**

- [Name] - [Phone] - [Email]

### External Escalations

**Database Vendor Support:**

- Contact: [Support portal/phone]
- Account: [Account ID]
- When: Database issues beyond team expertise

**Cloud Provider Support:**

- Contact: [Support portal/phone]
- Plan: [Support plan level]
- When: Infrastructure issues

---

## Useful Commands

### Logs

```bash
# Tail service logs
kubectl logs -f deployment/[service-name] --tail=100

# Grep for errors
kubectl logs deployment/[service-name] --since=1h | grep ERROR

# Export logs to file
kubectl logs deployment/[service-name] --since=24h > incident-logs.txt

# View logs in specific time range (using stern)
stern [service-name] --since 15m
```

### Debugging

```bash
# Execute command in container
kubectl exec -it [pod-name] -- /bin/sh

# Port forward for local debugging
kubectl port-forward deployment/[service-name] 8080:8080

# Run debug container in same namespace
kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
```

### Metrics

```bash
# Query Prometheus metrics
curl 'http://prometheus:9090/api/v1/query?query=[metric-name]'

# Top pods by CPU
kubectl top pods --sort-by=cpu

# Top pods by memory
kubectl top pods --sort-by=memory
```

### Database

```bash
# Connect to database
kubectl exec -it postgres-0 -- psql -U postgres -d [database]

# Check connection count
kubectl exec -it postgres-0 -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check table sizes
kubectl exec -it postgres-0 -- psql -U postgres -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## External Resources

### Documentation

- **Architecture Docs:** [Confluence/Notion link]
- **API Docs:** [Swagger/Postman link]
- **Code Repository:** [GitHub link]

### Dependencies Documentation

- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Redis Docs:** https://redis.io/documentation
- **Kubernetes Docs:** https://kubernetes.io/docs/

### Team Resources

- **Team Wiki:** [Link]
- **Incident History:** [Link to incident log]
- **Postmortems:** [Link to postmortem archive]

---

## Runbook Maintenance

**Review Schedule:** Monthly
**Next Review Date:** [Date]
**Reviewers:** [Team members]

**Change Log:**

| Date       | Author | Changes                     |
| ---------- | ------ | --------------------------- |
| YYYY-MM-DD | [Name] | Initial creation            |
| YYYY-MM-DD | [Name] | Added Issue 4: Memory Leak  |
| YYYY-MM-DD | [Name] | Updated escalation contacts |

---

**Remember:** This runbook is a living document. Update it after every incident with new learnings and procedures.
