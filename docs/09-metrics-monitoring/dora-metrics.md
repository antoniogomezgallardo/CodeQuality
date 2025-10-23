# DORA Metrics

## Purpose

DORA (DevOps Research and Assessment) metrics are evidence-based measures that help teams assess their software delivery performance and drive continuous improvement. This document explains the four key DORA metrics, how to measure them, interpret the results, and use them to improve your DevOps practices.

## Table of Contents

1. [Overview](#overview)
2. [The Four Key Metrics](#the-four-key-metrics)
3. [Deployment Frequency](#deployment-frequency)
4. [Lead Time for Changes](#lead-time-for-changes)
5. [Change Failure Rate](#change-failure-rate)
6. [Time to Restore Service](#time-to-restore-service)
7. [Performance Levels](#performance-levels)
8. [Measuring DORA Metrics](#measuring-dora-metrics)
9. [Automation Examples](#automation-examples)
10. [Visualization & Dashboards](#visualization--dashboards)
11. [Improving Your Metrics](#improving-your-metrics)
12. [Common Pitfalls](#common-pitfalls)
13. [Best Practices](#best-practices)
14. [Checklist](#checklist)
15. [References](#references)

---

## Overview

### What are DORA Metrics?

DORA metrics are four key indicators identified by the DevOps Research and Assessment team (acquired by Google) through six years of research and data from over 32,000 professionals worldwide. These metrics measure software delivery and operational performance.

### Why DORA Metrics?

**Benefits:**

- **Objective measurement** of DevOps performance
- **Evidence-based** improvement decisions
- **Industry benchmarking** capabilities
- **Balanced view** of speed and stability
- **Predictive** of organizational performance
- **Actionable** insights for improvement

**Research Findings:**

- Elite performers are 973x faster at deploying code
- Elite performers have 6,570x faster recovery times
- Elite performers have 3x lower change failure rates
- High performers are 2.6x more likely to exceed organizational goals

### The Four Pillars

```
┌─────────────────────────────────────────────────────┐
│            DORA Metrics Framework                    │
├──────────────────────┬──────────────────────────────┤
│    THROUGHPUT        │       STABILITY              │
├──────────────────────┼──────────────────────────────┤
│ Deployment Frequency │  Change Failure Rate         │
│ Lead Time for Changes│  Time to Restore Service     │
└──────────────────────┴──────────────────────────────┘
```

---

## The Four Key Metrics

### 1. Deployment Frequency (DF)

**Definition:** How often code is successfully deployed to production.

**Why it matters:** Indicates the ability to deliver value to customers quickly.

**Formula:**

```
Deployment Frequency = Number of Deployments / Time Period
```

### 2. Lead Time for Changes (LT)

**Definition:** Time from code commit to code running successfully in production.

**Why it matters:** Measures the efficiency of the delivery process.

**Formula:**

```
Lead Time = Production Deployment Time - Commit Time
```

### 3. Change Failure Rate (CFR)

**Definition:** Percentage of deployments that cause failures in production requiring remediation.

**Why it matters:** Balances speed with stability and quality.

**Formula:**

```
Change Failure Rate = (Failed Deployments / Total Deployments) × 100%
```

### 4. Time to Restore Service (MTTR)

**Definition:** Time to recover from a production failure.

**Why it matters:** Measures resilience and ability to respond to incidents.

**Formula:**

```
MTTR = Total Downtime / Number of Incidents
```

---

## Deployment Frequency

### Measurement

**What to count:**

- Successful deployments to production
- Include automated and manual deployments
- Count all production environments

**What NOT to count:**

- Deployments to staging/test environments
- Failed deployment attempts
- Rollbacks (unless they're new deployments)

### Example Calculation

```javascript
// deployment-frequency.js
class DeploymentFrequencyCalculator {
  constructor(deployments) {
    this.deployments = deployments;
  }

  calculate(startDate, endDate) {
    const successfulDeployments = this.deployments.filter(
      d =>
        d.status === 'success' &&
        d.environment === 'production' &&
        d.timestamp >= startDate &&
        d.timestamp <= endDate
    );

    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const deploymentsPerDay = successfulDeployments.length / days;

    return {
      total: successfulDeployments.length,
      perDay: deploymentsPerDay,
      perWeek: deploymentsPerDay * 7,
      perMonth: deploymentsPerDay * 30,
      level: this.getPerformanceLevel(deploymentsPerDay),
    };
  }

  getPerformanceLevel(deploymentsPerDay) {
    if (deploymentsPerDay >= 1) return 'Elite';
    if (deploymentsPerDay >= 1 / 7) return 'High';
    if (deploymentsPerDay >= 1 / 30) return 'Medium';
    return 'Low';
  }
}

// Usage
const deployments = [
  { timestamp: new Date('2024-01-15T10:00:00Z'), status: 'success', environment: 'production' },
  { timestamp: new Date('2024-01-15T14:30:00Z'), status: 'success', environment: 'production' },
  { timestamp: new Date('2024-01-16T09:15:00Z'), status: 'success', environment: 'production' },
  // ... more deployments
];

const calculator = new DeploymentFrequencyCalculator(deployments);
const result = calculator.calculate(new Date('2024-01-01'), new Date('2024-01-31'));

console.log(`Deployments per day: ${result.perDay.toFixed(2)}`);
console.log(`Performance level: ${result.level}`);
```

### Data Collection

**GitHub Actions Example:**

```yaml
name: Track Deployment

on:
  deployment_status:

jobs:
  track-metrics:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Record deployment
        run: |
          curl -X POST https://metrics-api.example.com/deployments \
            -H "Content-Type: application/json" \
            -d '{
              "repository": "${{ github.repository }}",
              "environment": "${{ github.event.deployment.environment }}",
              "commit": "${{ github.sha }}",
              "timestamp": "${{ github.event.deployment_status.created_at }}",
              "status": "success"
            }'
```

**GitLab CI Example:**

```yaml
deploy:production:
  stage: deploy
  environment: production
  script:
    - ./deploy.sh
  after_script:
    - |
      curl -X POST https://metrics-api.example.com/deployments \
        -H "Content-Type: application/json" \
        -d "{
          \"project\": \"$CI_PROJECT_PATH\",
          \"environment\": \"production\",
          \"commit\": \"$CI_COMMIT_SHA\",
          \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
          \"status\": \"success\"
        }"
```

---

## Lead Time for Changes

### Measurement

**Start time:** When commit is created
**End time:** When code runs successfully in production
**Includes:** Code review, CI/CD pipeline, deployment

### Example Calculation

```javascript
// lead-time.js
class LeadTimeCalculator {
  calculateLeadTime(commit, deployment) {
    const commitTime = new Date(commit.timestamp);
    const deployTime = new Date(deployment.timestamp);

    const leadTimeMs = deployTime - commitTime;
    const leadTimeHours = leadTimeMs / (1000 * 60 * 60);
    const leadTimeDays = leadTimeHours / 24;

    return {
      milliseconds: leadTimeMs,
      hours: leadTimeHours,
      days: leadTimeDays,
      formatted: this.formatDuration(leadTimeMs),
      level: this.getPerformanceLevel(leadTimeHours),
    };
  }

  getPerformanceLevel(hours) {
    if (hours < 1) return 'Elite'; // < 1 hour
    if (hours < 24) return 'High'; // < 1 day
    if (hours < 168) return 'Medium'; // < 1 week
    return 'Low'; // > 1 week
  }

  formatDuration(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  calculateAverageLeadTime(commits, deployments) {
    const leadTimes = commits
      .map(commit => {
        const deployment = deployments.find(
          d => d.commit === commit.sha && d.environment === 'production' && d.status === 'success'
        );

        if (!deployment) return null;

        return this.calculateLeadTime(commit, deployment);
      })
      .filter(lt => lt !== null);

    if (leadTimes.length === 0) return null;

    const avgHours = leadTimes.reduce((sum, lt) => sum + lt.hours, 0) / leadTimes.length;

    return {
      average: avgHours,
      median: this.calculateMedian(leadTimes.map(lt => lt.hours)),
      p95: this.calculatePercentile(
        leadTimes.map(lt => lt.hours),
        95
      ),
      count: leadTimes.length,
      level: this.getPerformanceLevel(avgHours),
    };
  }

  calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Usage
const commits = [
  { sha: 'abc123', timestamp: '2024-01-15T10:00:00Z' },
  { sha: 'def456', timestamp: '2024-01-15T14:30:00Z' },
];

const deployments = [
  {
    commit: 'abc123',
    environment: 'production',
    status: 'success',
    timestamp: '2024-01-15T11:45:00Z',
  },
  {
    commit: 'def456',
    environment: 'production',
    status: 'success',
    timestamp: '2024-01-15T16:15:00Z',
  },
];

const calculator = new LeadTimeCalculator();
const avgLeadTime = calculator.calculateAverageLeadTime(commits, deployments);

console.log(`Average lead time: ${avgLeadTime.average.toFixed(2)} hours`);
console.log(`Median lead time: ${avgLeadTime.median.toFixed(2)} hours`);
console.log(`P95 lead time: ${avgLeadTime.p95.toFixed(2)} hours`);
console.log(`Performance level: ${avgLeadTime.level}`);
```

### Data Collection with Git Hooks

```bash
#!/bin/bash
# .git/hooks/post-commit

COMMIT_SHA=$(git rev-parse HEAD)
COMMIT_TIME=$(git log -1 --format=%cI)
REPO=$(git remote get-url origin)

curl -X POST https://metrics-api.example.com/commits \
  -H "Content-Type: application/json" \
  -d "{
    \"repository\": \"$REPO\",
    \"commit\": \"$COMMIT_SHA\",
    \"timestamp\": \"$COMMIT_TIME\",
    \"author\": \"$(git log -1 --format=%ae)\"
  }"
```

---

## Change Failure Rate

### Measurement

**What counts as a failure:**

- Deployment causes production incident
- Immediate rollback required
- Hotfix deployed shortly after
- Service degradation requiring intervention

**What does NOT count:**

- Failed deployment attempts (before production)
- Planned maintenance
- Issues discovered in staging

### Example Calculation

```javascript
// change-failure-rate.js
class ChangeFailureRateCalculator {
  constructor(deployments, incidents) {
    this.deployments = deployments;
    this.incidents = incidents;
  }

  calculate(startDate, endDate) {
    const productionDeployments = this.deployments.filter(
      d => d.environment === 'production' && d.timestamp >= startDate && d.timestamp <= endDate
    );

    const failedDeployments = productionDeployments.filter(deployment => {
      // Check if deployment caused an incident within 24 hours
      const deployTime = new Date(deployment.timestamp);
      const oneDayLater = new Date(deployTime.getTime() + 24 * 60 * 60 * 1000);

      return this.incidents.some(
        incident =>
          incident.causedByDeployment === deployment.id &&
          incident.timestamp >= deployTime &&
          incident.timestamp <= oneDayLater
      );
    });

    const cfr = (failedDeployments.length / productionDeployments.length) * 100;

    return {
      totalDeployments: productionDeployments.length,
      failedDeployments: failedDeployments.length,
      changeFailureRate: cfr,
      level: this.getPerformanceLevel(cfr),
    };
  }

  getPerformanceLevel(cfr) {
    if (cfr <= 5) return 'Elite'; // 0-5%
    if (cfr <= 15) return 'High'; // 6-15%
    if (cfr <= 30) return 'Medium'; // 16-30%
    return 'Low'; // > 30%
  }

  identifyFailurePatterns(deployments, incidents) {
    const patterns = {
      byDay: {},
      byHour: {},
      byAuthor: {},
      byService: {},
    };

    deployments.forEach(deployment => {
      const failed = incidents.some(i => i.causedByDeployment === deployment.id);
      if (!failed) return;

      const date = new Date(deployment.timestamp);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();

      patterns.byDay[day] = (patterns.byDay[day] || 0) + 1;
      patterns.byHour[hour] = (patterns.byHour[hour] || 0) + 1;
      patterns.byAuthor[deployment.author] = (patterns.byAuthor[deployment.author] || 0) + 1;
      patterns.byService[deployment.service] = (patterns.byService[deployment.service] || 0) + 1;
    });

    return patterns;
  }
}

// Usage
const deployments = [
  { id: '1', timestamp: '2024-01-15T10:00:00Z', environment: 'production', author: 'alice' },
  { id: '2', timestamp: '2024-01-15T14:00:00Z', environment: 'production', author: 'bob' },
  { id: '3', timestamp: '2024-01-16T09:00:00Z', environment: 'production', author: 'alice' },
];

const incidents = [
  { id: 'inc-1', causedByDeployment: '2', timestamp: '2024-01-15T14:30:00Z', severity: 'high' },
];

const calculator = new ChangeFailureRateCalculator(deployments, incidents);
const result = calculator.calculate(new Date('2024-01-01'), new Date('2024-01-31'));

console.log(`Change Failure Rate: ${result.changeFailureRate.toFixed(2)}%`);
console.log(`Performance level: ${result.level}`);

const patterns = calculator.identifyFailurePatterns(deployments, incidents);
console.log('Failure patterns:', patterns);
```

### Automated Failure Detection

```javascript
// detect-failures.js
class FailureDetector {
  async detectDeploymentFailure(deployment) {
    const checks = [
      this.checkErrorRate(deployment),
      this.checkResponseTime(deployment),
      this.checkHealthEndpoint(deployment),
      this.checkRollback(deployment),
    ];

    const results = await Promise.all(checks);
    const failed = results.some(r => r.failed);

    if (failed) {
      await this.recordFailure(deployment, results);
    }

    return { failed, checks: results };
  }

  async checkErrorRate(deployment) {
    // Check if error rate increased after deployment
    const preDeploymentErrors = await this.getErrorRate(
      deployment.timestamp - 3600000, // 1 hour before
      deployment.timestamp
    );

    const postDeploymentErrors = await this.getErrorRate(
      deployment.timestamp,
      deployment.timestamp + 3600000 // 1 hour after
    );

    const threshold = 5; // 5% increase
    const increase = ((postDeploymentErrors - preDeploymentErrors) / preDeploymentErrors) * 100;

    return {
      name: 'Error Rate',
      failed: increase > threshold,
      details: {
        before: preDeploymentErrors,
        after: postDeploymentErrors,
        increase: increase.toFixed(2) + '%',
      },
    };
  }

  async checkResponseTime(deployment) {
    const preDeploymentP95 = await this.getResponseTimeP95(
      deployment.timestamp - 3600000,
      deployment.timestamp
    );

    const postDeploymentP95 = await this.getResponseTimeP95(
      deployment.timestamp,
      deployment.timestamp + 3600000
    );

    const threshold = 20; // 20% increase
    const increase = ((postDeploymentP95 - preDeploymentP95) / preDeploymentP95) * 100;

    return {
      name: 'Response Time',
      failed: increase > threshold,
      details: {
        before: preDeploymentP95 + 'ms',
        after: postDeploymentP95 + 'ms',
        increase: increase.toFixed(2) + '%',
      },
    };
  }

  async checkHealthEndpoint(deployment) {
    const response = await fetch(`https://${deployment.service}.example.com/health`);
    const healthy = response.ok && (await response.json()).status === 'healthy';

    return {
      name: 'Health Check',
      failed: !healthy,
      details: { status: response.status },
    };
  }

  async checkRollback(deployment) {
    // Check if there was a rollback within 1 hour
    const rollback = await this.findRollback(deployment.id, deployment.timestamp + 3600000);

    return {
      name: 'Rollback',
      failed: rollback !== null,
      details: rollback ? { rollbackId: rollback.id } : {},
    };
  }

  async recordFailure(deployment, checks) {
    await fetch('https://metrics-api.example.com/failures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deploymentId: deployment.id,
        timestamp: new Date().toISOString(),
        checks: checks.filter(c => c.failed),
      }),
    });
  }
}
```

---

## Time to Restore Service

### Measurement

**Start time:** When incident is detected or reported
**End time:** When service is fully restored
**Includes:** Detection, diagnosis, fix, deployment, verification

### Example Calculation

```javascript
// mttr.js
class MTTRCalculator {
  calculateMTTR(incidents) {
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

    if (resolvedIncidents.length === 0) {
      return null;
    }

    const resolutionTimes = resolvedIncidents.map(incident => {
      const detected = new Date(incident.detectedAt);
      const resolved = new Date(incident.resolvedAt);
      return (resolved - detected) / (1000 * 60); // minutes
    });

    const mean = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
    const median = this.calculateMedian(resolutionTimes);
    const p95 = this.calculatePercentile(resolutionTimes, 95);

    return {
      mean: mean,
      median: median,
      p95: p95,
      count: resolvedIncidents.length,
      level: this.getPerformanceLevel(mean),
      formatted: {
        mean: this.formatDuration(mean),
        median: this.formatDuration(median),
        p95: this.formatDuration(p95),
      },
    };
  }

  getPerformanceLevel(minutes) {
    if (minutes < 60) return 'Elite'; // < 1 hour
    if (minutes < 1440) return 'High'; // < 1 day
    if (minutes < 10080) return 'Medium'; // < 1 week
    return 'Low'; // > 1 week
  }

  formatDuration(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  }

  analyzeIncidentBreakdown(incident) {
    const stages = {
      detection: incident.acknowledgedAt - incident.detectedAt,
      diagnosis: incident.diagnosedAt - incident.acknowledgedAt,
      resolution: incident.resolvedAt - incident.diagnosedAt,
    };

    const total = incident.resolvedAt - incident.detectedAt;

    return {
      stages: {
        detection: {
          duration: stages.detection / (1000 * 60),
          percentage: (stages.detection / total) * 100,
        },
        diagnosis: {
          duration: stages.diagnosis / (1000 * 60),
          percentage: (stages.diagnosis / total) * 100,
        },
        resolution: {
          duration: stages.resolution / (1000 * 60),
          percentage: (stages.resolution / total) * 100,
        },
      },
      total: total / (1000 * 60),
    };
  }

  calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Usage
const incidents = [
  {
    id: 'inc-1',
    detectedAt: new Date('2024-01-15T10:00:00Z'),
    acknowledgedAt: new Date('2024-01-15T10:05:00Z'),
    diagnosedAt: new Date('2024-01-15T10:20:00Z'),
    resolvedAt: new Date('2024-01-15T11:15:00Z'),
    status: 'resolved',
  },
  {
    id: 'inc-2',
    detectedAt: new Date('2024-01-16T14:00:00Z'),
    acknowledgedAt: new Date('2024-01-16T14:03:00Z'),
    diagnosedAt: new Date('2024-01-16T14:45:00Z'),
    resolvedAt: new Date('2024-01-16T15:30:00Z'),
    status: 'resolved',
  },
];

const calculator = new MTTRCalculator();
const mttr = calculator.calculateMTTR(incidents);

console.log(`Mean MTTR: ${mttr.formatted.mean}`);
console.log(`Median MTTR: ${mttr.formatted.median}`);
console.log(`P95 MTTR: ${mttr.formatted.p95}`);
console.log(`Performance level: ${mttr.level}`);

const breakdown = calculator.analyzeIncidentBreakdown(incidents[0]);
console.log('Incident breakdown:', breakdown);
```

### Incident Tracking Integration

```yaml
# .github/workflows/incident-tracking.yml
name: Track Incident Resolution

on:
  issues:
    types: [closed]

jobs:
  record-mttr:
    if: contains(github.event.issue.labels.*.name, 'incident')
    runs-on: ubuntu-latest
    steps:
      - name: Calculate MTTR
        uses: actions/github-script@v7
        with:
          script: |
            const createdAt = new Date(context.payload.issue.created_at);
            const closedAt = new Date(context.payload.issue.closed_at);
            const mttrMinutes = (closedAt - createdAt) / (1000 * 60);

            // Record to metrics API
            await fetch('https://metrics-api.example.com/incidents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: context.payload.issue.number,
                detectedAt: createdAt.toISOString(),
                resolvedAt: closedAt.toISOString(),
                mttr: mttrMinutes,
                severity: context.payload.issue.labels.find(l => l.name.startsWith('severity-'))?.name
              })
            });
```

---

## Performance Levels

### 2023 DORA Benchmarks

| Metric                      | Elite                                | High                                     | Medium                                         | Low                            |
| --------------------------- | ------------------------------------ | ---------------------------------------- | ---------------------------------------------- | ------------------------------ |
| **Deployment Frequency**    | On-demand (multiple deploys per day) | Between once per week and once per month | Between once per month and once every 6 months | Fewer than once per six months |
| **Lead Time for Changes**   | Less than one hour                   | Between one day and one week             | Between one month and six months               | More than six months           |
| **Change Failure Rate**     | 0-5%                                 | 6-15%                                    | 16-30%                                         | > 30%                          |
| **Time to Restore Service** | Less than one hour                   | Less than one day                        | Between one day and one week                   | More than six months           |

### Simplified Numeric Thresholds

```javascript
const PERFORMANCE_LEVELS = {
  deploymentFrequency: {
    elite: { perDay: 1, label: 'Multiple times per day' },
    high: { perWeek: 1, label: 'Between once per week and once per month' },
    medium: { perMonth: 1, label: 'Between once per month and once every 6 months' },
    low: { perMonth: 0.167, label: 'Fewer than once per six months' },
  },

  leadTime: {
    elite: { hours: 1, label: 'Less than one hour' },
    high: { hours: 168, label: 'Between one day and one week' },
    medium: { hours: 4380, label: 'Between one month and six months' },
    low: { hours: 4380, label: 'More than six months' },
  },

  changeFailureRate: {
    elite: { percentage: 5, label: '0-5%' },
    high: { percentage: 15, label: '6-15%' },
    medium: { percentage: 30, label: '16-30%' },
    low: { percentage: 100, label: 'More than 30%' },
  },

  timeToRestore: {
    elite: { hours: 1, label: 'Less than one hour' },
    high: { hours: 24, label: 'Less than one day' },
    medium: { hours: 168, label: 'Between one day and one week' },
    low: { hours: 168, label: 'More than one week' },
  },
};
```

---

## Measuring DORA Metrics

### Data Sources

**Version Control (Git):**

- Commit timestamps
- Commit authors
- Branch information
- Pull request data

**CI/CD Pipeline:**

- Build start/end times
- Test results
- Deployment events
- Environment information

**Incident Management:**

- Incident creation time
- Incident resolution time
- Incident severity
- Related deployments

**Monitoring/Observability:**

- Error rates
- Response times
- Availability metrics
- Alert history

### Complete Metrics Collection System

```javascript
// dora-metrics-collector.js
class DORAMetricsCollector {
  constructor(config) {
    this.githubClient = config.githubClient;
    this.cicdClient = config.cicdClient;
    this.incidentClient = config.incidentClient;
    this.metricsStore = config.metricsStore;
  }

  async collectAllMetrics(startDate, endDate) {
    const [commits, deployments, incidents] = await Promise.all([
      this.fetchCommits(startDate, endDate),
      this.fetchDeployments(startDate, endDate),
      this.fetchIncidents(startDate, endDate),
    ]);

    const metrics = {
      deploymentFrequency: this.calculateDeploymentFrequency(deployments, startDate, endDate),
      leadTime: this.calculateLeadTime(commits, deployments),
      changeFailureRate: this.calculateChangeFailureRate(deployments, incidents),
      timeToRestore: this.calculateMTTR(incidents),
    };

    await this.metricsStore.save(metrics);

    return metrics;
  }

  async fetchCommits(startDate, endDate) {
    return await this.githubClient.getCommits({
      since: startDate.toISOString(),
      until: endDate.toISOString(),
      branch: 'main',
    });
  }

  async fetchDeployments(startDate, endDate) {
    return await this.cicdClient.getDeployments({
      startDate,
      endDate,
      environment: 'production',
      status: 'success',
    });
  }

  async fetchIncidents(startDate, endDate) {
    return await this.incidentClient.getIncidents({
      startDate,
      endDate,
      severities: ['critical', 'high'],
    });
  }

  calculateDeploymentFrequency(deployments, startDate, endDate) {
    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const deploymentsPerDay = deployments.length / days;

    return {
      total: deployments.length,
      perDay: deploymentsPerDay,
      perWeek: deploymentsPerDay * 7,
      perMonth: deploymentsPerDay * 30,
    };
  }

  calculateLeadTime(commits, deployments) {
    const leadTimes = commits
      .map(commit => {
        const deployment = deployments.find(d => d.commit === commit.sha);
        if (!deployment) return null;

        const commitTime = new Date(commit.timestamp);
        const deployTime = new Date(deployment.timestamp);
        return (deployTime - commitTime) / (1000 * 60 * 60); // hours
      })
      .filter(lt => lt !== null);

    if (leadTimes.length === 0) return null;

    return {
      mean: leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length,
      median: this.median(leadTimes),
      p95: this.percentile(leadTimes, 95),
    };
  }

  calculateChangeFailureRate(deployments, incidents) {
    const failedDeployments = deployments.filter(d =>
      incidents.some(i => i.causedByDeployment === d.id)
    );

    return {
      total: deployments.length,
      failed: failedDeployments.length,
      rate: (failedDeployments.length / deployments.length) * 100,
    };
  }

  calculateMTTR(incidents) {
    const resolved = incidents.filter(i => i.status === 'resolved');
    const resolutionTimes = resolved.map(
      i => (new Date(i.resolvedAt) - new Date(i.detectedAt)) / (1000 * 60)
    );

    if (resolutionTimes.length === 0) return null;

    return {
      mean: resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length,
      median: this.median(resolutionTimes),
      p95: this.percentile(resolutionTimes, 95),
    };
  }

  median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  percentile(values, p) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
```

---

## Automation Examples

### Complete GitHub Actions Workflow

```yaml
name: DORA Metrics Collection

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
  workflow_dispatch:

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Collect DORA metrics
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          METRICS_API_URL: ${{ secrets.METRICS_API_URL }}
          METRICS_API_KEY: ${{ secrets.METRICS_API_KEY }}
        run: node scripts/collect-dora-metrics.js

      - name: Generate report
        run: node scripts/generate-dora-report.js

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: dora-metrics-report
          path: reports/dora-metrics.html
```

### Prometheus Metrics Exporter

```javascript
// prometheus-exporter.js
const express = require('express');
const client = require('prom-client');

const app = express();
const register = new client.Registry();

// Define metrics
const deploymentFrequency = new client.Gauge({
  name: 'dora_deployment_frequency_per_day',
  help: 'Number of deployments per day',
  registers: [register],
});

const leadTime = new client.Histogram({
  name: 'dora_lead_time_hours',
  help: 'Lead time for changes in hours',
  buckets: [0.5, 1, 2, 4, 8, 24, 48, 168],
  registers: [register],
});

const changeFailureRate = new client.Gauge({
  name: 'dora_change_failure_rate_percentage',
  help: 'Percentage of deployments causing failures',
  registers: [register],
});

const mttr = new client.Histogram({
  name: 'dora_mttr_minutes',
  help: 'Mean time to restore service in minutes',
  buckets: [15, 30, 60, 120, 240, 480, 1440],
  registers: [register],
});

// Update metrics periodically
async function updateMetrics() {
  const collector = new DORAMetricsCollector(config);
  const metrics = await collector.collectAllMetrics(
    new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    new Date()
  );

  deploymentFrequency.set(metrics.deploymentFrequency.perDay);
  leadTime.observe(metrics.leadTime.mean);
  changeFailureRate.set(metrics.changeFailureRate.rate);
  mttr.observe(metrics.timeToRestore.mean);
}

setInterval(updateMetrics, 5 * 60 * 1000); // Every 5 minutes
updateMetrics(); // Initial update

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(9090, () => {
  console.log('DORA metrics exporter listening on port 9090');
});
```

---

## Visualization & Dashboards

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "DORA Metrics",
    "panels": [
      {
        "title": "Deployment Frequency",
        "targets": [
          {
            "expr": "dora_deployment_frequency_per_day"
          }
        ],
        "type": "stat",
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                { "value": 0, "color": "red" },
                { "value": 0.14, "color": "orange" },
                { "value": 0.5, "color": "yellow" },
                { "value": 1, "color": "green" }
              ]
            }
          }
        }
      },
      {
        "title": "Lead Time for Changes (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, dora_lead_time_hours_bucket)"
          }
        ],
        "type": "graph",
        "fieldConfig": {
          "defaults": {
            "unit": "h",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 1, "color": "yellow" },
                { "value": 24, "color": "orange" },
                { "value": 168, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "title": "Change Failure Rate",
        "targets": [
          {
            "expr": "dora_change_failure_rate_percentage"
          }
        ],
        "type": "gauge",
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "max": 100,
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 5, "color": "yellow" },
                { "value": 15, "color": "orange" },
                { "value": 30, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "title": "Mean Time to Restore (MTTR)",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, dora_mttr_minutes_bucket)"
          }
        ],
        "type": "stat",
        "fieldConfig": {
          "defaults": {
            "unit": "m",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 60, "color": "yellow" },
                { "value": 1440, "color": "orange" },
                { "value": 10080, "color": "red" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

### HTML Report Generation

```javascript
// generate-report.js
function generateDORAReport(metrics) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>DORA Metrics Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .metric { margin-bottom: 30px; padding: 20px; border-radius: 8px; }
    .metric.elite { background: #d4edda; border-left: 5px solid #28a745; }
    .metric.high { background: #fff3cd; border-left: 5px solid #ffc107; }
    .metric.medium { background: #f8d7da; border-left: 5px solid #fd7e14; }
    .metric.low { background: #f8d7da; border-left: 5px solid #dc3545; }
    .value { font-size: 2em; font-weight: bold; }
    .label { font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <h1>DORA Metrics Report</h1>
  <p>Period: ${metrics.period.start} to ${metrics.period.end}</p>

  <div class="metric ${metrics.deploymentFrequency.level.toLowerCase()}">
    <div class="label">Deployment Frequency</div>
    <div class="value">${metrics.deploymentFrequency.perDay.toFixed(2)} per day</div>
    <div class="level">Level: ${metrics.deploymentFrequency.level}</div>
  </div>

  <div class="metric ${metrics.leadTime.level.toLowerCase()}">
    <div class="label">Lead Time for Changes</div>
    <div class="value">${metrics.leadTime.mean.toFixed(2)} hours</div>
    <div class="level">Level: ${metrics.leadTime.level}</div>
    <div class="details">Median: ${metrics.leadTime.median.toFixed(2)}h | P95: ${metrics.leadTime.p95.toFixed(2)}h</div>
  </div>

  <div class="metric ${metrics.changeFailureRate.level.toLowerCase()}">
    <div class="label">Change Failure Rate</div>
    <div class="value">${metrics.changeFailureRate.rate.toFixed(2)}%</div>
    <div class="level">Level: ${metrics.changeFailureRate.level}</div>
    <div class="details">${metrics.changeFailureRate.failed} failures out of ${metrics.changeFailureRate.total} deployments</div>
  </div>

  <div class="metric ${metrics.mttr.level.toLowerCase()}">
    <div class="label">Mean Time to Restore (MTTR)</div>
    <div class="value">${metrics.mttr.mean.toFixed(2)} minutes</div>
    <div class="level">Level: ${metrics.mttr.level}</div>
    <div class="details">Median: ${metrics.mttr.median.toFixed(2)}m | P95: ${metrics.mttr.p95.toFixed(2)}m</div>
  </div>
</body>
</html>
  `;
}
```

---

## Improving Your Metrics

### Improving Deployment Frequency

**Strategies:**

1. **Automate deployments** - Remove manual steps
2. **Implement CI/CD** - Deploy on every merge to main
3. **Use feature flags** - Decouple deployment from release
4. **Reduce batch size** - Deploy smaller changes more frequently
5. **Trunk-based development** - Eliminate long-lived branches

**Example: Automated Deployment Pipeline**

```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: ./deploy.sh production
```

### Improving Lead Time

**Strategies:**

1. **Reduce code review time** - Set SLAs, use automation
2. **Optimize CI/CD pipeline** - Parallel tests, caching
3. **Smaller pull requests** - Easier to review and deploy
4. **Automate testing** - Reduce manual QA time
5. **Remove handoffs** - Cross-functional teams

**Example: Fast CI Pipeline**

```yaml
jobs:
  test:
    strategy:
      matrix:
        test-suite: [unit, integration, e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      - run: npm ci
      - run: npm run test:${{ matrix.test-suite }}
```

### Improving Change Failure Rate

**Strategies:**

1. **Improve test coverage** - Catch bugs before production
2. **Implement canary deployments** - Detect issues early
3. **Add automated rollback** - Quick recovery
4. **Better code review** - Catch issues before merge
5. **Post-incident reviews** - Learn from failures

**Example: Canary Deployment**

```yaml
- name: Deploy to canary
  run: ./deploy.sh production --canary --percentage=10

- name: Monitor canary
  run: ./monitor-canary.sh --duration=10m

- name: Promote or rollback
  run: |
    if ./check-canary-health.sh; then
      ./deploy.sh production --promote-canary
    else
      ./deploy.sh production --rollback-canary
      exit 1
    fi
```

### Improving MTTR

**Strategies:**

1. **Improve monitoring** - Faster detection
2. **Better alerting** - Right people, right information
3. **Automated rollback** - Quick recovery
4. **Runbooks/playbooks** - Faster diagnosis
5. **Practice incident response** - Build muscle memory

**Example: Automated Rollback**

```javascript
async function autoRollback(deployment) {
  const health = await checkDeploymentHealth(deployment);

  if (!health.healthy) {
    console.log('Unhealthy deployment detected, initiating rollback');
    await rollback(deployment);
    await notify({
      channel: '#incidents',
      message: `Deployment ${deployment.id} automatically rolled back due to: ${health.reason}`,
    });
  }
}
```

---

## Common Pitfalls

### ❌ DON'T

1. **Don't game the metrics**
   - Deploying no-op changes to increase frequency
   - Cherry-picking easy incidents for MTTR
   - Hiding failures to improve CFR

2. **Don't measure in isolation**
   - Focus on individual metrics without context
   - Ignore the relationship between metrics
   - Optimize one metric at expense of others

3. **Don't blame individuals**
   - Use metrics to punish teams
   - Create competitive environments
   - Ignore systemic issues

4. **Don't ignore context**
   - Compare teams with different contexts
   - Apply same targets to all teams
   - Ignore external factors

5. **Don't set arbitrary targets**
   - Chase "Elite" without understanding why
   - Ignore your starting point
   - Set unrealistic goals

### ✅ DO

1. **Focus on trends**
   - Is performance improving over time?
   - Are interventions working?

2. **Use metrics for learning**
   - Identify bottlenecks
   - Drive process improvements
   - Celebrate progress

3. **Measure consistently**
   - Same definitions across teams
   - Automated collection
   - Regular cadence

4. **Consider all four metrics**
   - Balance speed and stability
   - Understand trade-offs
   - Optimize holistically

5. **Start where you are**
   - Baseline current performance
   - Set realistic improvement goals
   - Iterate and improve

---

## Best Practices

### Measurement

1. **Automate data collection** - Reduce manual effort and errors
2. **Use consistent definitions** - Ensure apples-to-apples comparisons
3. **Measure continuously** - Track trends over time
4. **Include all changes** - Don't cherry-pick "good" deployments
5. **Document your process** - Make measurement transparent

### Analysis

1. **Look at trends, not point-in-time** - Focus on direction
2. **Consider all four metrics together** - Understand relationships
3. **Segment by team/service** - Identify specific issues
4. **Analyze outliers** - Learn from extremes
5. **Correlate with business outcomes** - Connect to value

### Improvement

1. **Set realistic goals** - Incremental improvement
2. **Focus on bottlenecks** - Biggest constraints first
3. **Experiment and learn** - Try interventions, measure results
4. **Share learnings** - Cross-team collaboration
5. **Celebrate progress** - Recognize improvements

### Culture

1. **Blameless post-mortems** - Learn from failures
2. **Psychological safety** - Safe to report problems
3. **Continuous improvement** - Always iterating
4. **Data-driven decisions** - Let metrics guide you
5. **Team ownership** - Teams own their metrics

---

## Checklist

### Getting Started

- [ ] Define measurement criteria for each metric
- [ ] Identify data sources (Git, CI/CD, incidents)
- [ ] Set up automated data collection
- [ ] Create baseline measurements
- [ ] Document measurement process

### Measurement

- [ ] Collect deployment frequency data
- [ ] Track lead time from commit to production
- [ ] Identify and categorize deployment failures
- [ ] Record incident detection and resolution times
- [ ] Calculate all four DORA metrics weekly

### Visualization

- [ ] Create dashboards for real-time metrics
- [ ] Generate periodic reports (weekly/monthly)
- [ ] Share metrics with stakeholders
- [ ] Track trends over time
- [ ] Identify performance level for each metric

### Improvement

- [ ] Identify biggest bottlenecks
- [ ] Set improvement goals
- [ ] Implement targeted interventions
- [ ] Measure impact of changes
- [ ] Iterate based on results

### Culture

- [ ] Share metrics transparently
- [ ] Use metrics for learning, not blame
- [ ] Celebrate improvements
- [ ] Conduct blameless post-mortems
- [ ] Encourage experimentation

---

## References

### Research

- [DORA State of DevOps Reports](https://dora.dev/research/) - Annual research findings
- [Accelerate Book](https://itrevolution.com/product/accelerate/) - Research-backed DevOps practices
- [Google Cloud DevOps Capabilities](https://cloud.google.com/architecture/devops) - Technical capabilities

### Tools

**Metrics Collection:**

- [Sleuth](https://www.sleuth.io/) - DORA metrics tracking
- [Haystack](https://usehaystack.io/) - Engineering metrics
- [LinearB](https://linearb.io/) - Software delivery intelligence
- [Jellyfish](https://jellyfish.co/) - Engineering management platform

**Open Source:**

- [Four Keys](https://github.com/GoogleCloudPlatform/fourkeys) - Google's DORA metrics implementation
- [DORA Metrics GitHub Action](https://github.com/marketplace/actions/dora-metrics)

### Articles & Guides

- [How to Misuse & Abuse DORA Metrics](https://cloud.google.com/blog/products/devops-sre/how-to-misuse-dora-metrics) - Google Cloud
- [DORA Metrics: What They Are and Why They Matter](https://www.atlassian.com/devops/frameworks/dora-metrics) - Atlassian
- [Getting Started with DORA Metrics](https://www.sleuth.io/post/getting-started-with-dora-metrics) - Sleuth

---

## Related Documentation

- [Metrics & Monitoring Overview](09-README.md)
- [CI/CD Pipeline](../08-cicd-pipeline/08-README.md)
- [Version Control (Trunk-Based Development)](../03-version-control/03-README.md)
- [Testing Strategy](../04-testing-strategy/04-README.md)
- [Deployment Automation](../08-cicd-pipeline/deployment-automation.md)
