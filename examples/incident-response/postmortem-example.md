# Postmortem: Payment Service Database Connection Pool Exhaustion

**Date:** 2024-03-15
**Authors:** Alice Johnson (Incident Commander), Bob Smith (Tech Lead)
**Status:** Complete
**Severity:** SEV-2
**Duration:** 2 hours 15 minutes
**Services Affected:** Payment Service, Order Service (downstream)

---

## Executive Summary

On March 15, 2024, from 14:32 UTC to 16:47 UTC, the Payment Service experienced intermittent failures affecting approximately 15% of payment processing requests. The root cause was database connection pool exhaustion due to a database query performance regression introduced in release v2.3.1. The incident was mitigated by rolling back the deployment and implementing a hotfix. No data loss occurred, but an estimated $45,000 in transactions were delayed or failed during the incident window.

---

## Impact

### User Impact

- **Affected Users:** ~12,000 users (15% of active users during incident window)
- **Failed Transactions:** 1,847 payment attempts failed
- **Delayed Transactions:** 3,422 payments were delayed by 5-30 minutes
- **Customer Support Tickets:** 67 tickets filed during incident

### Business Impact

- **Revenue Impact:** $45,000 in failed/delayed transactions
- **SLO Impact:**
  - Payment Service availability: 98.1% (SLO: 99.5%)
  - Error budget consumed: 15% of monthly budget
- **Reputation:** Minimal - incident resolved before significant social media attention

### Technical Impact

- **Services Affected:**
  - Payment Service (Primary)
  - Order Service (Degraded - retry queue backed up)
  - Notification Service (Minor - payment confirmation delays)
- **Infrastructure:**
  - Database CPU spiked to 95%
  - Connection pool maxed at 100 connections
  - API gateway showed 503 errors for payment endpoints

---

## Timeline (All Times UTC)

### Detection (14:32 - 14:35)

**14:32** - Automated alert fired: "Payment Service error rate exceeds 5% threshold"

```
Alert: payment_service_error_rate
Severity: Warning
Message: Error rate: 8.3% (threshold: 5%)
```

**14:33** - PagerDuty page sent to on-call engineer (Alice Johnson)

**14:34** - Alice acknowledged alert and began investigation

**14:35** - Customer support reported incoming complaints about failed payments

### Investigation (14:35 - 14:50)

**14:36** - Alice created incident Slack channel: #incident-2024-03-15-payment

**14:37** - Checked service logs - found database connection timeout errors:

```
ERROR: Unable to acquire database connection from pool
```

**14:39** - Checked database metrics:

- Connection count: 100/100 (maxed out)
- CPU usage: 95%
- Slow query log showing payment_transactions queries taking 5-8 seconds

**14:42** - Bob Smith (Tech Lead) joined incident as Technical Lead

**14:44** - Identified slow query introduced in v2.3.1 (deployed at 14:15):

```sql
SELECT * FROM payment_transactions pt
LEFT JOIN customer_data cd ON pt.customer_id = cd.id
LEFT JOIN order_details od ON pt.order_id = od.id
WHERE pt.status = 'pending'
ORDER BY pt.created_at DESC
```

**14:47** - Root cause identified: Missing index on payment_transactions.created_at after schema migration

**14:50** - Alice escalated to Engineering Manager (notification) and declared SEV-2 incident

### Mitigation Attempts (14:50 - 16:30)

**14:52** - **Attempt 1:** Add index to production database

```sql
CREATE INDEX CONCURRENTLY idx_payment_transactions_created_at
ON payment_transactions(created_at);
```

**Result:** Index creation started but estimated 45 minutes to complete (table has 50M rows)

**15:05** - **Attempt 2:** Increase database connection pool size from 100 to 150

- Edited ConfigMap and restarted pods
  **Result:** Temporary improvement (error rate dropped to 3%) but issue persisted

**15:20** - **Attempt 3:** Scale Payment Service from 3 to 8 replicas
**Result:** Made issue worse - more pods competing for database connections

**15:35** - **Decision:** Rollback to v2.3.0 (previous stable version)

**15:37** - Initiated rollback:

```bash
kubectl rollout undo deployment/payment-service
```

**15:42** - Rollback complete, all pods running v2.3.0

**15:45** - Error rate dropped to 0.2% (within normal range)

**15:50** - Database connection pool stabilized at 45/150 connections

### Recovery (16:30 - 16:47)

**16:30** - Index creation completed on database

**16:32** - Deployed hotfix version v2.3.2 with:

- Optimized query with proper JOIN order
- Added index migration
- Increased query timeout from 5s to 10s

**16:38** - Hotfix deployment complete

**16:40** - Verified metrics back to normal:

- Error rate: 0.1%
- p95 latency: 145ms (normal: <200ms)
- Database connections: 38/150

**16:45** - Processed retry queue (3,422 pending payments)

**16:47** - Incident resolved - all systems normal

### Post-Incident (16:47 onwards)

**16:50** - Alice sent resolution notification to stakeholders

**17:00** - Bob began reviewing failed transactions for manual retry

**17:30** - Customer support notified of resolution and provided talking points

**18:00** - Scheduled postmortem meeting for next day

---

## Root Cause Analysis

### Immediate Cause

Database connection pool exhaustion caused by long-running queries holding connections.

### Contributing Factors

1. **Missing Database Index**
   - Schema migration in v2.3.1 removed index on `payment_transactions.created_at`
   - Developer assumed index was recreated automatically (it wasn't)
   - Query plan changed from index scan to sequential scan on 50M row table

2. **Inadequate Testing**
   - Staging environment has only 10,000 test records
   - Query performed well in staging (< 50ms)
   - Production performance issues only appeared at scale

3. **Deployment Process**
   - No database query performance testing before deployment
   - No gradual rollout (deployed to all pods simultaneously)
   - No automated rollback on error rate threshold

4. **Monitoring Gaps**
   - No alerting on database connection pool utilization
   - No alerting on slow query count
   - Database metrics not prominently displayed in service dashboard

5. **Code Review**
   - Query optimization not caught in code review
   - Migration file changes not specifically reviewed
   - No performance benchmark requirements

### Why It Wasn't Caught Earlier

- **Development:** Developer tested with small dataset, query was fast
- **Code Review:** Reviewers focused on business logic, not query performance
- **CI/CD:** No performance testing or load testing in pipeline
- **Staging:** Environment too small to expose scalability issues
- **Canary:** No canary deployment configured; went straight to production

---

## What Went Well

1. **Fast Detection**
   - Automated monitoring caught the issue within 2 minutes of user impact
   - PagerDuty integration worked perfectly

2. **Clear Incident Process**
   - On-call engineer immediately created incident channel
   - Roles were clearly assigned (IC, Tech Lead)
   - Communication was regular and clear

3. **Good Documentation**
   - Runbook helped guide initial investigation
   - Database debugging commands were readily available
   - Recent deployment history was easy to find

4. **Effective Escalation**
   - Engineering Manager was notified appropriately
   - Customer support was kept in the loop
   - Stakeholders received timely updates

5. **Successful Rollback**
   - Kubernetes rollback was quick and reliable
   - Previous version was stable and well-tested
   - Rollback resolved the issue immediately

---

## What Didn't Go Well

1. **Slow Root Cause Identification**
   - Took 15 minutes to identify the slow query
   - Database metrics were in separate dashboard
   - Slow query logs were not aggregated with application logs

2. **Initial Mitigation Attempts Failed**
   - Adding index would take too long
   - Scaling pods made it worse
   - Wasted 45 minutes on unsuccessful mitigations

3. **No Automatic Rollback**
   - Error rate exceeded threshold for 30 minutes before rollback decision
   - Manual rollback process required engineer judgment
   - Could have been automated based on error rate

4. **Inadequate Staging Environment**
   - Staging environment didn't catch performance issues
   - No load testing before production deployment
   - Data volume mismatch between staging and production

5. **Customer Communication**
   - Status page was not updated until 45 minutes into incident
   - Customer support wasn't notified until they contacted us
   - No proactive customer outreach

---

## Action Items

### Immediate (Complete within 1 week)

| Action                                                                       | Owner         | Due Date   | Status      |
| ---------------------------------------------------------------------------- | ------------- | ---------- | ----------- |
| Add database connection pool utilization alert (>80% warning, >90% critical) | Bob Smith     | 2024-03-18 | ✅ Complete |
| Add slow query count alert (>10 queries/min taking >2s)                      | Bob Smith     | 2024-03-18 | ✅ Complete |
| Implement automatic rollback on sustained error rate >5% for >5 minutes      | Alice Johnson | 2024-03-20 | ✅ Complete |
| Update deployment runbook with database index verification checklist         | Alice Johnson | 2024-03-19 | ✅ Complete |
| Add database metrics to primary service dashboard                            | Bob Smith     | 2024-03-18 | ✅ Complete |

### Short-term (Complete within 1 month)

| Action                                                  | Owner         | Due Date   | Status         |
| ------------------------------------------------------- | ------------- | ---------- | -------------- |
| Implement canary deployment strategy (10% → 50% → 100%) | DevOps Team   | 2024-04-01 | 🔄 In Progress |
| Add database query performance tests to CI/CD pipeline  | QA Team       | 2024-04-05 | 🔄 In Progress |
| Increase staging database to 1M records minimum         | Platform Team | 2024-03-25 | ✅ Complete    |
| Create load testing suite for payment service           | QA Team       | 2024-04-10 | 🔄 In Progress |
| Implement query performance regression testing          | Bob Smith     | 2024-04-08 | 📋 Planned     |
| Add migration review checklist to PR template           | Engineering   | 2024-03-22 | ✅ Complete    |

### Long-term (Complete within 3 months)

| Action                                                         | Owner         | Due Date   | Status     |
| -------------------------------------------------------------- | ------------- | ---------- | ---------- |
| Implement production load testing environment (shadow traffic) | Platform Team | 2024-05-15 | 📋 Planned |
| Set up automated query plan comparison between releases        | Database Team | 2024-06-01 | 📋 Planned |
| Implement chaos engineering for database failures              | SRE Team      | 2024-05-30 | 📋 Planned |
| Create database performance training for developers            | Bob Smith     | 2024-04-30 | 📋 Planned |
| Implement automatic connection pool sizing based on load       | Platform Team | 2024-06-15 | 📋 Planned |

---

## Lessons Learned

### Technical Lessons

1. **Index Performance Matters**
   - Always verify indexes exist after schema migrations
   - Use EXPLAIN ANALYZE for queries on large tables
   - Monitor query execution plans in production

2. **Staging Must Match Production Scale**
   - Performance issues only appear at scale
   - Staging data volume should be representative
   - Regular load testing is essential

3. **Database Connection Pools Have Limits**
   - Monitor pool utilization closely
   - Set appropriate timeouts
   - Plan for connection pool sizing based on query performance

4. **Deployment Safety**
   - Gradual rollouts catch issues before full impact
   - Automated rollback saves critical time
   - Error rate monitoring should trigger automatic actions

### Process Lessons

1. **Code Review Checklist Needed**
   - Specific attention to database changes
   - Performance considerations required
   - Migration changes need special review

2. **Testing Gaps**
   - Performance testing was missing from CI/CD
   - Load testing should be required for service changes
   - Database-heavy changes need extra validation

3. **Monitoring Improvements**
   - Infrastructure metrics should be with service metrics
   - Alert on leading indicators (connection pool) not just lagging (errors)
   - Dashboards should show full stack, not just application

4. **Communication Protocol**
   - Status page should be updated immediately
   - Customer support should be in incident channel
   - Regular updates every 15 minutes during active incident

---

## Supporting Information

### Metrics and Graphs

**Error Rate During Incident:**

```
14:00 - 14:30:  0.1% (normal)
14:30 - 15:00: 8.3% (incident starts)
15:00 - 15:30: 6.2% (attempted mitigations)
15:30 - 16:00: 12.1% (peak, scaling made worse)
16:00 - 16:30: 3.4% (rollback started)
16:30 - 17:00: 0.2% (recovered)
```

**Database Connection Pool:**

```
14:00 - 14:30: 35-45 connections (normal)
14:30 - 15:00: 100 connections (maxed)
15:00 - 15:30: 150 connections (after resize, still high)
15:30 - 16:00: 150 connections (still maxed after scaling)
16:00 - 16:30: 80 connections (rollback)
16:30 - 17:00: 38 connections (hotfix deployed)
```

### Related Incidents

- **2024-01-20:** Similar database performance issue (different query)
- **2023-11-15:** Connection pool exhaustion from external API timeout
- **2023-09-08:** Slow query causing timeouts (resolved with index)

### External References

- [Deployment Log v2.3.1](https://github.com/company/payment-service/releases/tag/v2.3.1)
- [Migration PR #4521](https://github.com/company/payment-service/pull/4521)
- [Grafana Dashboard](https://grafana.company.com/d/payment-service)
- [Incident Slack Channel](https://company.slack.com/archives/incident-2024-03-15-payment)

---

## Feedback and Questions

This postmortem was reviewed by:

- Engineering Team (2024-03-16)
- Platform Team (2024-03-16)
- Leadership Team (2024-03-18)

Feedback received:

- "Excellent detail on timeline and root cause" - CTO
- "Action items are clear and comprehensive" - VP Engineering
- "Would like to see more on customer impact quantification" - Customer Success

Questions raised:

1. **Q:** Why didn't canary deployment catch this?
   **A:** Canary deployment was not configured for this service. Action item added.

2. **Q:** What's the plan for the 1,847 failed transactions?
   **A:** All were automatically retried once issue was resolved. 23 required manual intervention, all completed by 2024-03-16.

3. **Q:** Should we pause all deployments until safety measures are in place?
   **A:** No, but we implemented emergency rollback automation immediately and are requiring load testing for database-heavy changes.

---

## Postmortem Review Sign-offs

- ✅ **Engineering Team Lead:** Bob Smith - 2024-03-16
- ✅ **Engineering Manager:** Carol Williams - 2024-03-16
- ✅ **VP Engineering:** David Chen - 2024-03-18
- ✅ **Customer Success:** Emma Davis - 2024-03-18

---

**Distribution:**

- Engineering team
- Leadership team
- Customer success team
- Public summary (sanitized) on status blog

**Confidentiality:** Internal - Do Not Share Externally

---

**Note:** This postmortem follows the blameless postmortem format. The goal is learning and improvement, not blame. Thank you to everyone who contributed to the rapid resolution of this incident.
