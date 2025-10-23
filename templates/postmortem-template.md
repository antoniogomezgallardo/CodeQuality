# Incident Postmortem Template

## Blameless Postmortem Principles

**Remember:** The goal is to learn and improve, not to assign blame. Focus on systems and processes, not individuals.

- We assume everyone involved had good intentions
- We focus on what went wrong with the system, not who made a mistake
- We identify actionable improvements
- We share learnings across the organization

---

## Incident Summary

| Field                  | Details                               |
| ---------------------- | ------------------------------------- |
| **Incident ID**        | INC-2024-001                          |
| **Date**               | YYYY-MM-DD                            |
| **Time (Start)**       | HH:MM UTC                             |
| **Time (End)**         | HH:MM UTC                             |
| **Duration**           | X hours Y minutes                     |
| **Severity**           | Critical / High / Medium / Low        |
| **Status**             | Resolved / Investigating / Monitoring |
| **Incident Commander** | [Name]                                |
| **Scribe**             | [Name]                                |

### Quick Summary

[2-3 sentence overview of what happened]

**Example:**
On January 15, 2024, our payment processing system experienced a complete outage from 14:30 to 16:45 UTC, affecting approximately 10,000 customers. The root cause was a database connection pool exhaustion caused by a deployment that introduced a connection leak. Service was restored by rolling back to the previous version and manually clearing stuck connections.

---

## Impact Assessment

### User Impact

- **Number of Users Affected:** [Quantity or percentage]
- **Geographic Region:** [Specific regions or global]
- **User Experience Impact:** [Describe how users were affected]
- **Accessibility:** Could users access the service? What functionality was lost?

### Business Impact

- **Revenue Impact:** $XX,XXX in lost transactions
- **Reputation Impact:** [Social media mentions, support tickets, etc.]
- **SLA Impact:** [Any SLA breaches]
- **Compliance Impact:** [Any regulatory implications]

### Technical Impact

- **Services Affected:**
  - Payment Processing Service (Complete outage)
  - Order Management Service (Degraded performance)
  - Customer Portal (Intermittent errors)
- **Data Impact:** [Any data loss or corruption]
- **Infrastructure Impact:** [Resource utilization, costs]

### Metrics

| Metric           | Normal | During Incident | Impact |
| ---------------- | ------ | --------------- | ------ |
| Error Rate       | 0.1%   | 45%             | +44.9% |
| Response Time    | 200ms  | 5000ms          | +2400% |
| Availability     | 99.9%  | 0%              | -99.9% |
| Transactions/min | 500    | 0               | -100%  |

---

## Timeline of Events

**Note:** All times in UTC. Include both what happened and what actions were taken.

### Discovery Phase

| Time  | Event                                           | Action Taken                  | Actor              |
| ----- | ----------------------------------------------- | ----------------------------- | ------------------ |
| 14:00 | Deployment v2.5.0 to production started         | -                             | DevOps Team        |
| 14:15 | Deployment completed successfully               | -                             | Automated Pipeline |
| 14:30 | First alert: Payment API response time elevated | Acknowledged alert            | On-call Engineer   |
| 14:32 | Error rate spike to 15%                         | Started investigating logs    | Engineer A         |
| 14:35 | Multiple customer reports via support           | Escalated to senior engineer  | Support Team       |
| 14:37 | Complete service outage detected                | Declared incident, paged team | Engineer A         |

### Response Phase

| Time  | Event                                          | Action Taken                    | Actor          |
| ----- | ---------------------------------------------- | ------------------------------- | -------------- |
| 14:40 | Incident Commander assigned                    | Started incident call           | IC: Engineer B |
| 14:42 | Database connection pool exhaustion identified | Attempted to increase pool size | DBA Team       |
| 14:45 | Pool increase had no effect                    | Started rollback procedure      | DevOps Team    |
| 14:50 | Rollback initiated to v2.4.3                   | -                               | DevOps Team    |
| 15:00 | Rollback completed                             | Service still unavailable       | DevOps Team    |
| 15:05 | Stuck connections identified in database       | Manually killing connections    | DBA Team       |
| 15:15 | Connection pool clearing completed             | -                               | DBA Team       |
| 15:20 | Service availability at 50%                    | Monitoring recovery             | All Teams      |
| 15:30 | Service fully restored                         | Continued monitoring            | All Teams      |

### Recovery Phase

| Time  | Event                                 | Action Taken | Actor               |
| ----- | ------------------------------------- | ------------ | ------------------- |
| 15:35 | All metrics returned to normal        | -            | -                   |
| 15:45 | Customer notification sent            | -            | Communications Team |
| 16:00 | Extended monitoring period            | -            | On-call Team        |
| 16:45 | Incident closed, monitoring continues | -            | Incident Commander  |

### Post-Incident Phase

| Time     | Event                         | Action Taken | Actor              |
| -------- | ----------------------------- | ------------ | ------------------ |
| 17:00    | Postmortem meeting scheduled  | -            | Incident Commander |
| 18:00    | Root cause analysis completed | -            | Engineering Team   |
| Next Day | Postmortem document published | -            | Scribe             |

---

## Root Cause Analysis

### The Five Whys

**Problem Statement:** Payment processing service experienced complete outage

1. **Why did the payment processing service go down?**
   - Because the database connection pool was exhausted

2. **Why was the connection pool exhausted?**
   - Because the application was not properly releasing database connections

3. **Why was the application not releasing connections?**
   - Because the new code in v2.5.0 introduced a connection leak in the error handling path

4. **Why did the connection leak make it to production?**
   - Because our integration tests did not cover the specific error scenario that triggered the leak

5. **Why didn't our tests cover that scenario?**
   - Because we lack comprehensive test coverage for error paths and edge cases

### Root Cause

**Primary Cause:** Connection leak introduced in v2.5.0 deployment in the payment processing error handler. When payment gateway API returned specific error codes, the application failed to close database connections in the finally block.

**Contributing Factors:**

1. **Insufficient Testing:** Integration tests did not simulate payment gateway error scenarios
2. **Code Review Gap:** Connection management in error paths not specifically reviewed
3. **Monitoring Gap:** No alerting on database connection pool utilization
4. **Rollback Delay:** Manual intervention required to fully restore service after rollback
5. **Deployment Timing:** Deployed during high-traffic period (early afternoon)

### Fishbone Diagram (Ishikawa)

```
                                    Service Outage
                                         |
        People                    Process              Technology
           |                         |                      |
    Missing code review         No error path         Connection leak
    checklist for               testing in CI         in new code
    resource management         pipeline
           |                         |                      |
    ----------------     -------------------------  -----------------
                                     |
                              Environment
                                     |
                         Deployed during peak hours
                         No canary deployment
```

---

## What Went Well

### Successes During the Incident

- ✅ **Fast Detection:** Issue detected within 2 minutes of first symptoms via monitoring
- ✅ **Clear Communication:** Incident call established quickly with all stakeholders
- ✅ **Documentation:** Timeline was accurately documented by dedicated scribe
- ✅ **Team Coordination:** Cross-functional teams worked together effectively
- ✅ **Customer Communication:** Status updates provided every 15 minutes
- ✅ **Rollback Capability:** Rollback procedure worked as designed
- ✅ **Blameless Culture:** Team focused on problem-solving, not finger-pointing

### What Prevented Worse Outcomes

- Database had connection timeout configured, preventing complete lock-up
- Automated rollback capability existed (even though manual steps were needed)
- On-call rotation was properly staffed
- Incident response playbook was accessible and up-to-date

---

## What Went Wrong

### Issues Identified During the Incident

- ❌ **Testing Gap:** Integration tests missed critical error scenarios
- ❌ **Code Review Miss:** Connection management not verified in error paths
- ❌ **Monitoring Gap:** No alerting on connection pool utilization metrics
- ❌ **Manual Intervention:** Rollback alone didn't resolve issue; required manual DB work
- ❌ **Deployment Strategy:** No canary or phased rollout for risky change
- ❌ **Recovery Time:** 2+ hours to fully restore service exceeded target (30 min)
- ❌ **Detection Delay:** Relied on error rate alerts instead of proactive metrics

### Process Failures

- No pre-deployment checklist for database resource management
- No requirement for error path testing coverage
- Deployment during high-traffic period without additional safeguards
- Insufficient runbook for database connection pool issues

---

## Lessons Learned

### Technical Lessons

1. **Always close resources in finally blocks:** Even in error scenarios
2. **Monitor connection pool metrics:** Add alerting before exhaustion occurs
3. **Test error paths:** Integration tests must cover failure scenarios
4. **Implement connection timeouts:** Ensure connections don't leak indefinitely

### Process Lessons

1. **Canary deployments for risky changes:** Identify changes that affect critical paths
2. **Enhanced code review checklist:** Add resource management verification
3. **Deployment windows:** Avoid peak hours for high-risk deployments
4. **Improved rollback procedures:** Ensure rollback is sufficient without manual steps

### Organizational Lessons

1. **Blameless culture works:** Team collaborated effectively without fear
2. **Documentation is crucial:** Real-time timeline documentation was invaluable
3. **Cross-team training needed:** Not all engineers familiar with DB operations
4. **Customer communication matters:** Proactive updates reduced support load

---

## Action Items

### Immediate Actions (Within 24 Hours)

| #   | Action                                | Owner            | Due Date   | Status  | Priority |
| --- | ------------------------------------- | ---------------- | ---------- | ------- | -------- |
| 1   | Fix connection leak in error handler  | Engineering Lead | 2024-01-16 | ✅ Done | Critical |
| 2   | Add connection pool monitoring alerts | SRE Team         | 2024-01-16 | ✅ Done | Critical |
| 3   | Deploy hotfix v2.5.1 with fix         | DevOps Team      | 2024-01-16 | ✅ Done | Critical |
| 4   | Verify fix in production              | QA Team          | 2024-01-16 | ✅ Done | Critical |

### Short-Term Actions (Within 1 Week)

| #   | Action                                                | Owner            | Due Date   | Status         | Priority |
| --- | ----------------------------------------------------- | ---------------- | ---------- | -------------- | -------- |
| 5   | Add integration tests for payment error scenarios     | QA Engineer      | 2024-01-22 | 🔄 In Progress | High     |
| 6   | Update code review checklist with resource management | Tech Lead        | 2024-01-20 | 🔄 In Progress | High     |
| 7   | Create runbook for connection pool issues             | SRE Team         | 2024-01-21 | ⏳ Pending     | High     |
| 8   | Review all error handlers for similar issues          | Engineering Team | 2024-01-23 | ⏳ Pending     | High     |
| 9   | Implement automated connection leak detection         | DevOps Team      | 2024-01-24 | ⏳ Pending     | Medium   |

### Medium-Term Actions (Within 1 Month)

| #   | Action                                       | Owner               | Due Date   | Status     | Priority |
| --- | -------------------------------------------- | ------------------- | ---------- | ---------- | -------- |
| 10  | Implement canary deployment system           | DevOps Team         | 2024-02-15 | ⏳ Pending | High     |
| 11  | Enhance automated rollback capabilities      | SRE Team            | 2024-02-10 | ⏳ Pending | High     |
| 12  | Establish deployment windows policy          | Engineering Manager | 2024-02-05 | ⏳ Pending | Medium   |
| 13  | Create comprehensive error testing framework | QA Team             | 2024-02-20 | ⏳ Pending | Medium   |
| 14  | Conduct chaos engineering exercises          | SRE Team            | 2024-02-28 | ⏳ Pending | Medium   |

### Long-Term Actions (Within 3 Months)

| #   | Action                                           | Owner             | Due Date   | Status     | Priority |
| --- | ------------------------------------------------ | ----------------- | ---------- | ---------- | -------- |
| 15  | Implement circuit breakers for all external APIs | Architecture Team | 2024-04-15 | ⏳ Pending | Medium   |
| 16  | Establish SLO/SLI framework for all services     | SRE Team          | 2024-04-30 | ⏳ Pending | Medium   |
| 17  | Cross-train engineers on database operations     | DBA Team          | 2024-04-30 | ⏳ Pending | Low      |
| 18  | Quarterly incident response drills               | All Teams         | 2024-04-30 | ⏳ Pending | Low      |

---

## Supporting Data

### Relevant Logs

```
[2024-01-15 14:30:15] ERROR PaymentService: Connection timeout after 30s
[2024-01-15 14:30:16] ERROR PaymentService: Unable to acquire connection from pool
[2024-01-15 14:30:17] ERROR PaymentService: Connection pool exhausted: 0/100 available
[2024-01-15 14:30:18] FATAL PaymentService: Service unavailable - connection pool exhausted
```

### Metrics Graphs

[Attach screenshots of monitoring dashboards showing:]

- Error rate spike
- Response time degradation
- Connection pool utilization
- Traffic patterns

### Code Diff

[Include relevant code changes that caused the issue]

```java
// Previous version (v2.4.3) - Correct
public void processPayment(Payment payment) {
    Connection conn = null;
    try {
        conn = dataSource.getConnection();
        // ... processing logic
    } catch (SQLException e) {
        logger.error("Database error", e);
        throw new PaymentException(e);
    } finally {
        if (conn != null) {
            conn.close(); // ✅ Connection properly closed
        }
    }
}

// New version (v2.5.0) - Introduced bug
public void processPayment(Payment payment) {
    Connection conn = dataSource.getConnection();
    try {
        // ... processing logic
        if (gatewayResponse.hasError()) {
            throw new PaymentGatewayException(gatewayResponse.getError());
            // ❌ Early return without closing connection
        }
    } catch (SQLException e) {
        logger.error("Database error", e);
        throw new PaymentException(e);
    } finally {
        if (conn != null) {
            conn.close(); // This finally block is never reached on gateway errors
        }
    }
}
```

---

## Related Incidents

| Incident ID  | Date       | Similarity             | Lessons Applied? |
| ------------ | ---------- | ---------------------- | ---------------- |
| INC-2023-045 | 2023-08-12 | Connection pool issue  | ⚠️ Partially     |
| INC-2023-078 | 2023-11-03 | Deployment during peak | ❌ No            |

---

## Communication Log

### Internal Communications

- **14:40 UTC:** Engineering team notified via PagerDuty
- **14:45 UTC:** Incident Slack channel created (#incident-2024-001)
- **15:00 UTC:** Leadership team notified
- **15:30 UTC:** All-hands update on service restoration

### External Communications

- **14:50 UTC:** Status page updated - "Investigating payment processing issues"
- **15:15 UTC:** Status page updated - "Identified issue, working on resolution"
- **15:45 UTC:** Status page updated - "Service restored, monitoring closely"
- **16:30 UTC:** Email sent to affected customers with apology and explanation
- **Next Day:** Blog post published with technical details and improvements

---

## Prevention Measures

### Technical Improvements

1. **Resource Management:**
   - Implement try-with-resources pattern for all database connections
   - Add static analysis rules to detect resource leaks
   - Enable connection leak detection in connection pool

2. **Testing:**
   - Add integration tests for all error scenarios
   - Implement chaos engineering for failure injection
   - Add connection leak tests to CI pipeline

3. **Monitoring & Alerting:**
   - Alert on connection pool utilization > 70%
   - Alert on slow connection acquisition times
   - Dashboard for real-time connection pool metrics
   - Synthetic monitoring for payment flows

4. **Deployment Safety:**
   - Implement canary deployments (5% → 50% → 100%)
   - Add automated rollback triggers on error rate spikes
   - Deployment freeze during peak business hours
   - Require load testing for database-intensive changes

### Process Improvements

1. **Code Review:**
   - Add resource management checklist
   - Require two reviewers for critical path changes
   - Mandate error path review

2. **Testing Requirements:**
   - Minimum 90% coverage for error handlers
   - Integration test requirement for external API failures
   - Load test requirement for database changes

3. **Deployment Process:**
   - Risk assessment before each deployment
   - Deployment windows policy
   - Required monitoring period post-deployment

4. **Incident Response:**
   - Update runbooks with connection pool troubleshooting
   - Conduct quarterly incident response drills
   - Maintain up-to-date escalation procedures

---

## Postmortem Meeting Details

**Date:** 2024-01-16
**Attendees:**

- Engineering Team (8 people)
- SRE Team (3 people)
- Product Management (2 people)
- Support Team (2 people)

**Meeting Notes:**

- Reviewed timeline and root cause
- Discussed each action item and assigned owners
- Agreed on follow-up schedule
- Scheduled 1-month review meeting

**Follow-up Meeting:** 2024-02-16 to review action item completion

---

## Sign-off

| Role               | Name   | Date       | Signature |
| ------------------ | ------ | ---------- | --------- |
| Incident Commander | [Name] | YYYY-MM-DD | Approved  |
| Engineering Lead   | [Name] | YYYY-MM-DD | Approved  |
| SRE Lead           | [Name] | YYYY-MM-DD | Approved  |
| Product Manager    | [Name] | YYYY-MM-DD | Approved  |

---

## Distribution List

**Internal:**

- Engineering Team
- SRE Team
- Product Management
- Executive Leadership
- Customer Support

**External:**

- [If applicable] Customers via blog post
- [If applicable] Regulatory bodies

---

## Appendix

### Glossary

- **IC:** Incident Commander
- **SRE:** Site Reliability Engineering
- **SLA:** Service Level Agreement
- **SLO:** Service Level Objective
- **RCA:** Root Cause Analysis

### References

- Incident Response Playbook: [Link]
- Database Connection Pool Documentation: [Link]
- Deployment Procedures: [Link]
- Related Postmortems: [Link]

### Tools Used

- Monitoring: Prometheus + Grafana
- Alerting: PagerDuty
- Logging: ELK Stack
- Communication: Slack, Status Page

---

## Continuous Improvement

### Postmortem Effectiveness

- [ ] Action items reviewed at 1 week
- [ ] Action items reviewed at 1 month
- [ ] Postmortem shared with broader organization
- [ ] Learnings incorporated into training
- [ ] Similar incidents decreased in frequency

### Metrics to Track

- Mean Time to Detect (MTTD)
- Mean Time to Resolve (MTTR)
- Frequency of similar incidents
- Action item completion rate
- Time to implement preventive measures

---

_This postmortem follows blameless postmortem principles and focuses on learning and improvement rather than assigning blame. The goal is to make our systems more resilient and our team more prepared._

**Document Version:** 1.0
**Last Updated:** YYYY-MM-DD
**Next Review:** YYYY-MM-DD
