# Incident Management

## Overview

Incident management is the process of identifying, responding to, resolving, and learning from incidents that disrupt or degrade service quality. It ensures rapid restoration of service while minimizing business impact and preventing recurrence.

## Purpose

- **Minimize impact**: Restore service quickly to reduce user disruption
- **Clear communication**: Keep stakeholders informed during incidents
- **Root cause analysis**: Understand why incidents occur
- **Prevent recurrence**: Implement fixes and improvements
- **Continuous improvement**: Learn from every incident

## Incident Severity Levels

### Severity Classification

```markdown
**SEV-1 (Critical):**
- Complete service outage
- Data loss or corruption
- Security breach
- Revenue impact >$10K/hour
- Response time: Immediate
- Update frequency: Every 30 minutes

**SEV-2 (High):**
- Significant feature degradation
- Affecting >50% of users
- Performance severely degraded
- Revenue impact $1K-$10K/hour
- Response time: <15 minutes
- Update frequency: Every hour

**SEV-3 (Medium):**
- Minor feature degradation
- Affecting <50% of users
- Workaround available
- Minimal revenue impact
- Response time: <1 hour
- Update frequency: Every 4 hours

**SEV-4 (Low):**
- Cosmetic issues
- Minimal user impact
- No revenue impact
- Response time: Next business day
- Update frequency: Daily
```

## Incident Response Process

### 1. Detection

```javascript
// Automated incident detection
class IncidentDetector {
  async monitorMetrics() {
    const metrics = await this.getMetrics();

    // Error rate threshold
    if (metrics.errorRate > 0.05) {  // >5% errors
      await this.createIncident({
        title: 'High Error Rate Detected',
        severity: 'SEV-2',
        metrics: {
          errorRate: metrics.errorRate,
          affectedUsers: metrics.affectedUsers
        }
      });
    }

    // Latency threshold
    if (metrics.latencyP99 > 5000) {  // >5s p99 latency
      await this.createIncident({
        title: 'High Latency Detected',
        severity: 'SEV-2',
        metrics: {
          latencyP99: metrics.latencyP99,
          latencyP95: metrics.latencyP95
        }
      });
    }

    // Traffic drop
    const expectedTraffic = await this.getExpectedTraffic();
    if (metrics.requestsPerMinute < expectedTraffic * 0.5) {
      await this.createIncident({
        title: 'Significant Traffic Drop',
        severity: 'SEV-1',
        metrics: {
          current: metrics.requestsPerMinute,
          expected: expectedTraffic
        }
      });
    }
  }

  async createIncident(incident) {
    // Create incident ticket
    const ticket = await this.ticketingSystem.create(incident);

    // Page on-call engineer
    await this.pagerDuty.trigger({
      title: incident.title,
      severity: incident.severity,
      details: incident.metrics
    });

    // Post to incident channel
    await this.slack.postMessage({
      channel: '#incidents',
      text: `🚨 ${incident.severity}: ${incident.title}`,
      attachments: [
        {
          title: 'Incident Details',
          fields: Object.entries(incident.metrics).map(([key, value]) => ({
            title: key,
            value: value.toString(),
            short: true
          }))
        }
      ]
    });
  }
}
```

### 2. Response

```markdown
**Immediate Actions (First 5 Minutes):**
1. Acknowledge incident in PagerDuty
2. Join incident Zoom/Slack channel
3. Assign incident commander
4. Assess severity and impact
5. Begin status page updates

**Initial Investigation (5-15 Minutes):**
1. Check recent deployments
2. Review error logs
3. Examine monitoring dashboards
4. Identify affected systems
5. Determine root cause hypothesis

**Mitigation (15-30 Minutes):**
1. Implement immediate fix (if known)
2. Rollback recent changes (if applicable)
3. Scale resources (if capacity issue)
4. Enable circuit breakers
5. Route traffic away from affected systems
```

### 3. Communication

```javascript
// Incident status updates
class IncidentCommunication {
  async updateStatus(incidentId, update) {
    const incident = await this.getIncident(incidentId);

    // Update status page
    await this.statusPage.postUpdate({
      incident: incident.id,
      status: update.status,  // investigating, identified, monitoring, resolved
      message: update.message,
      timestamp: new Date()
    });

    // Notify stakeholders
    if (incident.severity === 'SEV-1' || incident.severity === 'SEV-2') {
      await this.slack.postMessage({
        channel: '#incidents',
        text: `Update on ${incident.title}:\n${update.message}`
      });

      // Email executives for SEV-1
      if (incident.severity === 'SEV-1') {
        await this.email.send({
          to: 'executives@example.com',
          subject: `SEV-1 Update: ${incident.title}`,
          body: this.formatIncidentEmail(incident, update)
        });
      }
    }

    // Update incident timeline
    await this.updateTimeline(incidentId, {
      timestamp: new Date(),
      event: 'status_update',
      details: update
    });
  }

  formatIncidentEmail(incident, update) {
    return `
      Incident: ${incident.title}
      Severity: ${incident.severity}
      Status: ${update.status}
      Started: ${incident.startedAt}
      Duration: ${this.calculateDuration(incident)}

      Current Status:
      ${update.message}

      Impact:
      - Affected Users: ${incident.affectedUsers}
      - Services Impacted: ${incident.services.join(', ')}

      Next Update: ${this.calculateNextUpdate(incident.severity)}
    `;
  }
}
```

### 4. Resolution

```javascript
// Incident resolution workflow
class IncidentResolution {
  async resolve(incidentId, resolution) {
    const incident = await this.getIncident(incidentId);

    // Verify fix
    const verified = await this.verifyResolution(incident);

    if (!verified) {
      throw new Error('Resolution verification failed');
    }

    // Update incident status
    await this.updateIncident(incidentId, {
      status: 'resolved',
      resolvedAt: new Date(),
      resolution: resolution.description,
      rootCause: resolution.rootCause
    });

    // Close status page incident
    await this.statusPage.resolve(incident.statusPageId);

    // Notify team
    await this.slack.postMessage({
      channel: '#incidents',
      text: `✅ Resolved: ${incident.title}\n\nDuration: ${this.calculateDuration(incident)}\nResolution: ${resolution.description}`
    });

    // Schedule postmortem
    await this.schedulePostmortem(incidentId, {
      daysAfter: 2,
      attendees: [
        ...incident.responders,
        'engineering-leads@example.com'
      ]
    });
  }

  async verifyResolution(incident) {
    // Check metrics returned to normal
    const metrics = await this.getMetrics();

    const checksPass = (
      metrics.errorRate < 0.01 &&
      metrics.latencyP99 < 1000 &&
      metrics.requestsPerMinute > this.getExpectedTraffic() * 0.9
    );

    // Monitor for 15 minutes
    if (checksPass) {
      await this.sleep(15 * 60 * 1000);
      const metricsAfter = await this.getMetrics();

      return (
        metricsAfter.errorRate < 0.01 &&
        metricsAfter.latencyP99 < 1000
      );
    }

    return false;
  }
}
```

## On-Call Management

### On-Call Rotation

```javascript
// On-call schedule
const onCallSchedule = {
  team: 'Platform Engineering',
  rotation: {
    duration: '1 week',
    handoff: 'Monday 9am',
    schedule: [
      { week: 1, primary: 'alice@example.com', secondary: 'bob@example.com' },
      { week: 2, primary: 'bob@example.com', secondary: 'carol@example.com' },
      { week: 3, primary: 'carol@example.com', secondary: 'alice@example.com' }
    ]
  },

  escalation: {
    level1: 'Primary on-call',
    level2: 'Secondary on-call',
    level3: 'Engineering Manager',
    level4: 'VP Engineering',
    timeout: {
      level1: 5,   // minutes
      level2: 10,
      level3: 15,
      level4: 20
    }
  },

  expectations: {
    responseTime: '15 minutes',
    acknowledgmentTime: '5 minutes',
    availabilityRequirement: '24/7',
    compensationType: 'Time off + stipend'
  }
};
```

### On-Call Best Practices

```markdown
**Before Your On-Call Week:**
- [ ] Review recent incidents
- [ ] Test pager/alerting system
- [ ] Ensure laptop charged and accessible
- [ ] Review runbooks and documentation
- [ ] Check access to all systems
- [ ] Set up remote access if traveling

**During On-Call:**
- [ ] Acknowledge alerts within 5 minutes
- [ ] Respond to incidents within 15 minutes
- [ ] Keep laptop nearby 24/7
- [ ] Stay in cellular coverage
- [ ] Limit alcohol consumption
- [ ] Update runbooks with learnings

**After On-Call:**
- [ ] Hand off open incidents
- [ ] Document any new issues discovered
- [ ] Update runbooks
- [ ] Provide feedback on alerting
- [ ] Take time off to recover
```

## Runbooks

### Runbook Template

```markdown
# Runbook: High API Latency

## Symptoms
- P99 latency > 2s
- Increased timeout errors
- User complaints about slow responses

## Impact
- SEV-2: Significant user experience degradation
- Affects all API consumers

## Investigation Steps

### 1. Check Application Metrics
```bash
# View current latency
curl https://grafana.example.com/api/dashboards/api-latency

# Check error rates
curl https://grafana.example.com/api/dashboards/error-rates
```

### 2. Check Infrastructure
```bash
# CPU usage
kubectl top nodes
kubectl top pods -n production

# Memory usage
kubectl describe nodes | grep -A 5 "Allocated resources"

# Network issues
ping api.example.com
traceroute api.example.com
```

### 3. Check Dependencies
```bash
# Database latency
psql -h db.example.com -c "SELECT * FROM pg_stat_activity;"

# Redis latency
redis-cli --latency -h cache.example.com

# External API status
curl https://status.external-api.com
```

## Resolution Steps

### Option 1: Scale Application
```bash
# Increase replicas
kubectl scale deployment/api --replicas=20 -n production

# Verify scaling
kubectl get pods -n production -w
```

### Option 2: Restart Pods
```bash
# Rolling restart
kubectl rollout restart deployment/api -n production

# Monitor restart
kubectl rollout status deployment/api -n production
```

### Option 3: Disable Expensive Features
```bash
# Disable recommendation engine
curl -X POST https://api.example.com/admin/features \
  -d '{"recommendations": false}'
```

### Option 4: Rollback Recent Deployment
```bash
# Rollback to previous version
kubectl rollout undo deployment/api -n production

# Verify rollback
kubectl rollout status deployment/api -n production
```

## Escalation
- Primary: Platform Team (#platform-oncall)
- Secondary: Database Team (#database-oncall)
- Escalation Manager: VP Engineering

## Related Runbooks
- [Database Performance Issues](database-performance.md)
- [Cache Issues](cache-issues.md)
- [Rollback Procedures](rollback.md)

## Postmortem Links
- [2024-01-15 API Latency](postmortems/2024-01-15-api-latency.md)
- [2024-02-03 Database Slowdown](postmortems/2024-02-03-db-slow.md)
```

## Postmortem Process

### Postmortem Template

```markdown
# Postmortem: [Incident Title]

**Date:** 2024-01-15
**Authors:** Engineering Team
**Status:** Complete
**Severity:** SEV-2
**Duration:** 2 hours 35 minutes

## Summary
Brief description of what happened, impact, and resolution.

## Impact
- **Users Affected:** 45,000 (30% of active users)
- **Duration:** 2 hours 35 minutes
- **Revenue Impact:** $15,000 estimated
- **Services Affected:** API, Web App, Mobile App

## Timeline (UTC)
- **14:23** - First alerts for increased error rates
- **14:25** - On-call engineer paged
- **14:28** - Incident declared SEV-2
- **14:30** - Incident commander assigned
- **14:35** - Root cause identified: database connection pool exhausted
- **14:40** - Mitigation started: increased connection pool size
- **14:50** - Partial recovery observed
- **15:05** - Additional scaling applied
- **16:58** - Full recovery confirmed
- **17:05** - Incident closed

## Root Cause
Database connection pool size (100 connections) was insufficient for traffic spike caused by marketing campaign. Connection exhaustion led to request queueing and timeouts.

## Resolution
1. Increased database connection pool from 100 to 300
2. Scaled API servers from 10 to 20 instances
3. Implemented connection pool monitoring alerts

## What Went Well
- ✅ Incident detected automatically within 2 minutes
- ✅ On-call engineer responded in 3 minutes
- ✅ Clear communication in incident channel
- ✅ No data loss occurred
- ✅ Rollback plan available (not needed)

## What Went Wrong
- ❌ Connection pool size not properly sized for expected traffic
- ❌ Marketing campaign not coordinated with engineering
- ❌ No pre-launch load testing performed
- ❌ Alerts for connection pool utilization missing
- ❌ Runbook for database connection issues outdated

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Implement connection pool monitoring | @alice | 2024-01-20 | Done |
| Add load testing to deployment pipeline | @bob | 2024-01-25 | In Progress |
| Create marketing-engineering coordination process | @carol | 2024-01-22 | Done |
| Update database runbook | @dave | 2024-01-18 | Done |
| Set up auto-scaling for database connections | @alice | 2024-02-01 | Planned |

## Lessons Learned
1. Always load test before major marketing campaigns
2. Connection pool size should auto-scale with traffic
3. Better cross-team communication needed
4. Monitoring gaps still exist in database layer

## Related Incidents
- [2023-11-03: Similar connection pool issue](postmortems/2023-11-03.md)
- [2023-12-15: Traffic spike during Black Friday](postmortems/2023-12-15.md)
```

## SLIs, SLOs, and SLAs

### Service Level Indicators (SLIs)

```javascript
const slis = {
  // Request success rate
  availability: {
    description: 'Percentage of successful requests',
    measurement: '(successful_requests / total_requests) * 100',
    current: 99.95  // %
  },

  // Request latency
  latency: {
    description: 'Time to process requests',
    measurement: 'p99 response time',
    current: 450  // ms
  },

  // Error rate
  errorRate: {
    description: 'Percentage of failed requests',
    measurement: '(failed_requests / total_requests) * 100',
    current: 0.05  // %
  }
};
```

### Service Level Objectives (SLOs)

```javascript
const slos = {
  availability: {
    target: 99.9,     // %
    window: '30 days',
    errorBudget: 0.1  // % (100% - 99.9%)
  },

  latency: {
    target: 500,      // ms (p99)
    window: '30 days'
  },

  errorRate: {
    target: 0.1,      // %
    window: '30 days'
  }
};

// Error budget calculation
function calculateErrorBudget(slo) {
  const totalMinutes = 30 * 24 * 60;  // 30 days
  const allowedDowntime = totalMinutes * (slo.errorBudget / 100);

  return {
    totalMinutes,
    allowedDowntimeMinutes: allowedDowntime,
    allowedDowntimeHours: allowedDowntime / 60,
    remainingBudget: calculateRemainingBudget(slo)
  };
}
```

### Service Level Agreements (SLAs)

```markdown
## SLA Commitments

**Availability:** 99.9% uptime
- Measurement Period: Monthly
- Credit: 10% for each 0.1% below SLA
- Maximum Credit: 100% of monthly fees

**Support Response Times:**
- SEV-1: 15 minutes
- SEV-2: 1 hour
- SEV-3: 4 hours
- SEV-4: Next business day

**Data Backup:**
- Frequency: Daily
- Retention: 30 days
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 24 hours
```

## Incident Metrics

```javascript
const incidentMetrics = {
  // Frequency
  incidents: {
    total: 45,
    sev1: 2,
    sev2: 8,
    sev3: 20,
    sev4: 15
  },

  // MTTR (Mean Time To Repair)
  mttr: {
    sev1: 45,   // minutes
    sev2: 90,
    sev3: 240,
    sev4: 1440
  },

  // MTTD (Mean Time To Detect)
  mttd: {
    automated: 2,  // minutes
    manual: 15
  },

  // MTTA (Mean Time To Acknowledge)
  mtta: 4,  // minutes

  // Repeat incidents
  repeatIncidents: 8,  // Same root cause
  repeatRate: 17.7     // %
};
```

## Related Resources

- [Observability](../09-metrics-monitoring/observability.md)
- [DORA Metrics](../09-metrics-monitoring/dora-metrics.md)
- [Deployment Strategies](../10-deployment/deployment-strategies.md)
- [Continuous Delivery](../08-cicd-pipeline/continuous-delivery.md)

## References

- Google SRE Book - Incident Management
- PagerDuty - Incident Response Documentation
- Atlassian - Incident Management Best Practices
- ITIL - Incident Management Framework

---

*Part of: Incident Management*
