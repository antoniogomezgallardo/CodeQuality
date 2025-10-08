# Load Testing Examples

This directory contains production-ready examples for load, performance, and stress testing using industry-standard tools.

## Table of Contents

- [Overview](#overview)
- [Load Testing Concepts](#load-testing-concepts)
- [Tools Covered](#tools-covered)
- [Performance Metrics](#performance-metrics)
- [Getting Started](#getting-started)
- [Running the Examples](#running-the-examples)
- [Best Practices](#best-practices)
- [SLA Validation](#sla-validation)
- [Results Analysis](#results-analysis)

## Overview

Load testing validates that your application performs acceptably under expected and peak load conditions. This directory provides comprehensive examples using the most popular load testing tools in the industry.

**What You'll Find:**
- Complete, runnable test scripts for k6, JMeter, Artillery, and Gatling
- Realistic user scenarios and journey patterns
- Performance thresholds aligned with industry SLAs
- Helper utilities for common testing tasks
- Guidance on interpreting and acting on results

## Load Testing Concepts

### Types of Performance Testing

#### 1. Load Testing
**Purpose:** Validate system behavior under expected load conditions.

**Characteristics:**
- Gradual ramp-up to target concurrent users
- Sustained load for extended period
- Monitors response times, throughput, and resource utilization
- Validates SLA compliance under normal conditions

**Example Scenario:**
```
Users: 0 → 1000 over 5 minutes
Duration: 30 minutes at 1000 users
Goal: Validate p95 < 500ms, p99 < 1000ms
```

#### 2. Stress Testing
**Purpose:** Identify breaking point and system behavior under extreme conditions.

**Characteristics:**
- Continuous increase in load beyond normal capacity
- Push system until failure or degradation
- Identify bottlenecks and resource limitations
- Validate graceful degradation and recovery

**Example Scenario:**
```
Users: 0 → 5000+ over 30 minutes
Continue until: Error rate > 5% or p95 > 5000ms
Goal: Find maximum capacity and failure modes
```

#### 3. Spike Testing
**Purpose:** Validate system behavior under sudden traffic surges.

**Characteristics:**
- Rapid increase in load (seconds, not minutes)
- Short duration at peak load
- Tests auto-scaling and caching effectiveness
- Common for flash sales, viral content, news events

**Example Scenario:**
```
Users: 100 → 5000 in 30 seconds
Duration: 5 minutes at peak
Goal: No errors, auto-scaling triggers, recovery
```

#### 4. Soak Testing (Endurance Testing)
**Purpose:** Identify memory leaks, resource exhaustion, and degradation over time.

**Characteristics:**
- Moderate load sustained for hours or days
- Monitors memory usage, connection pools, disk space
- Validates long-running stability
- Catches issues that only appear over time

**Example Scenario:**
```
Users: 500 constant
Duration: 24-72 hours
Goal: No memory leaks, stable performance
```

#### 5. Scalability Testing
**Purpose:** Validate system scales linearly with added resources.

**Characteristics:**
- Incremental load increases with resource additions
- Measure throughput per resource unit
- Validate horizontal and vertical scaling
- Identify scalability limits

**Example Scenario:**
```
Phase 1: 1000 users on 2 servers
Phase 2: 2000 users on 4 servers
Goal: Linear scaling, same response times
```

### Load Testing vs Functional Testing

| Aspect | Functional Testing | Load Testing |
|--------|-------------------|--------------|
| **Focus** | Correctness | Performance |
| **Volume** | Single user | Many concurrent users |
| **Metrics** | Pass/Fail | Response time, throughput |
| **Environment** | Often test/dev | Production-like |
| **Duration** | Seconds/minutes | Minutes/hours |
| **Automation** | Unit, integration tests | Performance scripts |

## Tools Covered

### k6 (Recommended for Modern Teams)

**Strengths:**
- JavaScript-based scripting (developer-friendly)
- Excellent CLI and cloud integration
- Built-in metrics and thresholds
- Great for CI/CD integration
- Active community and extensions

**Best For:**
- API load testing
- Microservices architectures
- DevOps/SRE teams
- CI/CD pipelines
- Modern web applications

**File:** `k6-load-test.js`

### Apache JMeter

**Strengths:**
- Industry standard with 20+ years of maturity
- GUI for test plan creation
- Extensive protocol support (HTTP, JDBC, JMS, LDAP, etc.)
- Rich plugin ecosystem
- Distributed testing capabilities

**Best For:**
- Enterprise environments
- Complex protocols beyond HTTP
- Teams preferring GUI tools
- Legacy system testing
- Distributed load generation

**File:** `jmeter-test-plan.jmx`

### Artillery

**Strengths:**
- YAML configuration (no coding required)
- Built-in support for Socket.io and WebSockets
- Easy scenario definition
- Good reporting out of the box
- Plugin architecture

**Best For:**
- Real-time applications
- WebSocket testing
- Teams preferring configuration over code
- Quick test creation
- CI/CD integration

**File:** `artillery-config.yml`

### Gatling

**Strengths:**
- Scala-based DSL (concise and powerful)
- Excellent HTML reports
- High performance (millions of requests)
- Recorder for capturing scenarios
- Enterprise support available

**Best For:**
- High-volume testing
- Scala/Java teams
- Detailed performance analysis
- Complex user journeys
- Enterprise applications

**File:** `gatling-simulation.scala`

## Performance Metrics

### Response Time Metrics

#### Mean (Average) Response Time
**Definition:** Sum of all response times / number of requests

**Use Cases:**
- General performance overview
- Trend analysis over time

**Limitations:**
- Sensitive to outliers
- Doesn't show distribution
- Can hide poor user experiences

**Example:**
```
Request times: [100ms, 120ms, 150ms, 5000ms]
Mean: (100 + 120 + 150 + 5000) / 4 = 1342ms
Problem: Looks bad despite 75% being fast
```

#### Median (p50) Response Time
**Definition:** Middle value when all response times are sorted

**Use Cases:**
- Better central tendency than mean
- Less affected by outliers
- Shows typical user experience

**Example:**
```
Request times: [100ms, 120ms, 150ms, 5000ms]
Median: 135ms (much more representative)
```

#### Percentiles (p90, p95, p99, p99.9)

**Definition:** Value below which X% of observations fall

**p90 (90th percentile):**
- 90% of requests faster than this value
- 10% of requests slower
- Good for general SLA targets

**p95 (95th percentile):**
- Most common SLA metric
- Balances performance and outliers
- Industry standard for "most users"

**p99 (99th percentile):**
- Captures tail latency
- Important for user experience
- 1 in 100 requests slower than this

**p99.9 (99.9th percentile):**
- Extreme tail latency
- Critical for high-traffic systems
- 1 in 1000 requests

**Why Percentiles Matter:**
```
Scenario: E-commerce checkout with 1M daily requests

p50 = 200ms  ✓ Great!
p95 = 450ms  ✓ Good
p99 = 2000ms ⚠️ Warning

Impact: 10,000 users/day (1%) experience 2+ second delays
At scale: This could mean significant revenue loss
```

**Industry Benchmarks:**
- **Google:** p99 < 100ms for search
- **Amazon:** 100ms delay = 1% revenue loss
- **Typical SLA:** p95 < 500ms, p99 < 1000ms

### Throughput Metrics

#### Requests Per Second (RPS)
**Definition:** Number of requests processed per second

**Use Cases:**
- Measure system capacity
- Compare performance across versions
- Calculate required infrastructure

**Example:**
```
Total requests: 60,000
Duration: 300 seconds
RPS: 60,000 / 300 = 200 requests/sec
```

**Capacity Planning:**
```
Expected daily users: 100,000
Peak hour traffic: 30% of daily
Peak concurrent users: 30,000
Average session: 5 minutes (300s)
Required RPS: 30,000 / 300 = 100 RPS minimum
Recommended: 200 RPS (100% overhead)
```

#### Transactions Per Second (TPS)
**Definition:** Number of complete business transactions per second

**Difference from RPS:**
- One transaction = multiple requests
- More meaningful business metric
- Used for capacity planning

**Example:**
```
User Registration Transaction:
1. POST /api/users (create user)
2. POST /api/email/verify (send email)
3. GET /api/users/{id} (fetch profile)

3 RPS = 1 TPS for this flow
```

#### Data Transfer Rate
**Definition:** Bytes transmitted per second (KB/s, MB/s)

**Use Cases:**
- Network capacity planning
- CDN effectiveness
- API payload optimization

**Example:**
```
Average response size: 50 KB
RPS: 200
Transfer rate: 200 × 50 KB = 10 MB/s
Monthly bandwidth: ~26 TB
```

### Error Metrics

#### Error Rate
**Definition:** Percentage of failed requests

**Formula:**
```
Error Rate = (Failed Requests / Total Requests) × 100
```

**Industry Standards:**
- **Excellent:** < 0.1% (99.9% success)
- **Good:** < 1% (99% success)
- **Acceptable:** < 5% (95% success)
- **Poor:** > 5%

**SLA Considerations:**
```
99.9% uptime (three nines) = 43 minutes downtime/month
99.99% uptime (four nines) = 4.3 minutes downtime/month
99.999% uptime (five nines) = 26 seconds downtime/month
```

#### HTTP Status Code Distribution
**Categories:**
- **2xx (Success):** Request successful
- **3xx (Redirect):** Usually expected for redirects
- **4xx (Client Error):** Bad request, auth issues
- **5xx (Server Error):** Backend failures (critical)

**Monitoring:**
```
200 OK: 98.5%        ✓ Good
201 Created: 0.5%    ✓ Expected
304 Not Modified: 1% ✓ Caching working
401 Unauthorized: 0% ✓ Auth working
500 Server Error: 0% ✓ No backend issues
503 Unavailable: 0%  ✓ Service healthy
```

### Resource Utilization Metrics

#### CPU Utilization
**Targets:**
- **Normal load:** 40-60%
- **Peak load:** 70-80%
- **Alert threshold:** > 85%
- **Critical:** > 95%

**Why headroom matters:**
- Auto-scaling lag time
- Traffic spike buffer
- Background job capacity

#### Memory Utilization
**Targets:**
- **Healthy:** < 70%
- **Warning:** 70-85%
- **Critical:** > 85%

**Memory Leak Detection:**
```
Start: 2 GB
After 1 hour: 3 GB
After 2 hours: 4 GB
After 3 hours: 5 GB → Memory leak detected
```

#### Connection Pool Metrics
**Monitor:**
- Active connections
- Pool exhaustion events
- Connection wait time
- Connection errors

**Example:**
```
Pool size: 100
Active: 95
Wait time: 200ms → Increase pool size
```

## Getting Started

### Prerequisites

**System Requirements:**
- **Node.js:** v16+ (for k6, Artillery, helpers)
- **Java:** JDK 8+ (for JMeter, Gatling)
- **Scala:** 2.13+ (for Gatling)
- **Memory:** 4GB+ RAM recommended
- **Network:** Stable internet for remote testing

### Installation

#### k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

**Verify:**
```bash
k6 version
```

#### Apache JMeter

**Download:**
```bash
# Download from https://jmeter.apache.org/download_jmeter.cgi
wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz
tar -xzf apache-jmeter-5.6.3.tgz
cd apache-jmeter-5.6.3
```

**Run:**
```bash
# GUI mode (for creating tests)
./bin/jmeter

# CLI mode (for running tests)
./bin/jmeter -n -t test-plan.jmx -l results.jtl
```

#### Artillery

**Install:**
```bash
npm install -g artillery
```

**Verify:**
```bash
artillery version
```

#### Gatling

**macOS:**
```bash
brew install gatling
```

**Download (All platforms):**
```bash
# Download from https://gatling.io/open-source/
wget https://repo1.maven.org/maven2/io/gatling/highcharts/gatling-charts-highcharts-bundle/3.10.3/gatling-charts-highcharts-bundle-3.10.3.zip
unzip gatling-charts-highcharts-bundle-3.10.3.zip
cd gatling-charts-highcharts-bundle-3.10.3
```

**Run:**
```bash
./bin/gatling.sh
```

### Project Setup

```bash
# Clone or navigate to examples directory
cd examples/load-testing

# Install Node dependencies
npm install

# Verify k6 scripts
k6 run k6-load-test.js

# Verify Artillery config
artillery run artillery-config.yml

# Run all tests (using npm scripts)
npm run test:load
```

## Running the Examples

### k6 Load Test

**Basic Run:**
```bash
k6 run k6-load-test.js
```

**With Custom VUs and Duration:**
```bash
k6 run --vus 100 --duration 5m k6-load-test.js
```

**Run Specific Scenario:**
```bash
k6 run --env SCENARIO=spike k6-load-test.js
```

**Output to JSON:**
```bash
k6 run --out json=results.json k6-load-test.js
```

**Cloud Run (k6 Cloud):**
```bash
k6 cloud k6-load-test.js
```

**With Environment Variables:**
```bash
k6 run --env BASE_URL=https://api.production.com k6-load-test.js
```

### JMeter Test Plan

**CLI Mode (Recommended for CI/CD):**
```bash
jmeter -n -t jmeter-test-plan.jmx -l results.jtl -e -o report/
```

**Parameters:**
- `-n`: Non-GUI mode
- `-t`: Test plan file
- `-l`: Results log file
- `-e`: Generate HTML report
- `-o`: Output folder for report

**With Properties:**
```bash
jmeter -n -t jmeter-test-plan.jmx \
  -Jusers=100 \
  -Jrampup=60 \
  -Jduration=300 \
  -l results.jtl
```

**GUI Mode (For Editing):**
```bash
jmeter -t jmeter-test-plan.jmx
```

**Distributed Testing:**
```bash
# On server machines
jmeter-server

# On controller
jmeter -n -t test.jmx -R server1,server2,server3
```

### Artillery Load Test

**Basic Run:**
```bash
artillery run artillery-config.yml
```

**Quick Test:**
```bash
artillery quick --count 10 --num 100 https://api.example.com/health
```

**With Target Override:**
```bash
artillery run -t https://staging.api.com artillery-config.yml
```

**Generate Report:**
```bash
artillery run --output report.json artillery-config.yml
artillery report report.json
```

**With Environment Variables:**
```bash
TARGET=https://production.com artillery run artillery-config.yml
```

### Gatling Simulation

**Interactive Mode:**
```bash
./bin/gatling.sh
# Select simulation from menu
```

**Direct Simulation:**
```bash
./bin/gatling.sh -s LoadTestingSimulation
```

**With Results Folder:**
```bash
./bin/gatling.sh -s LoadTestingSimulation -rf results/
```

**Maven/Gradle Integration:**
```bash
# Maven
mvn gatling:test

# Gradle
gradle gatlingRun
```

## Best Practices

### 1. Test Environment Setup

**Production-Like Environment:**
```
✓ Same infrastructure (servers, databases, caches)
✓ Same configurations (timeouts, pool sizes)
✓ Same third-party integrations
✓ Representative data volumes
✗ Don't test against production
✗ Don't use development environments
```

**Data Preparation:**
```javascript
// Pre-populate database with realistic data
const users = 10000;
const productsPerUser = 5;
const ordersPerUser = 2;

// Ensure data distribution matches production
const activeUsers = users * 0.3; // 30% active
const premiumUsers = users * 0.1; // 10% premium
```

**Network Considerations:**
```
✓ Test from similar geographic locations
✓ Account for CDN behavior
✓ Consider network latency
✗ Don't test from same datacenter
✗ Don't ignore DNS resolution time
```

### 2. Load Profile Design

**Realistic Ramp-Up:**
```javascript
// Bad: Instant load
stages: [
  { duration: '1s', target: 1000 }
]

// Good: Gradual ramp-up
stages: [
  { duration: '2m', target: 100 },  // Warm-up
  { duration: '5m', target: 500 },  // Ramp-up
  { duration: '10m', target: 1000 }, // Peak
  { duration: '5m', target: 0 }     // Ramp-down
]
```

**Think Time (User Pacing):**
```javascript
// Simulate realistic user behavior
import { sleep } from 'k6';

export default function() {
  // User views homepage
  http.get('/');
  sleep(randomIntBetween(2, 5)); // Read time

  // User searches
  http.post('/search', { q: 'product' });
  sleep(randomIntBetween(3, 8)); // Review results

  // User clicks product
  http.get('/product/123');
  sleep(randomIntBetween(5, 15)); // Decision time
}
```

**User Journey Modeling:**
```javascript
// Define realistic user flows with probabilities
const scenarios = {
  browser: {
    weight: 60,  // 60% of users just browse
    exec: 'browseProducts'
  },
  buyer: {
    weight: 30,  // 30% add to cart
    exec: 'addToCart'
  },
  purchaser: {
    weight: 10,  // 10% complete purchase
    exec: 'completePurchase'
  }
};
```

### 3. Threshold Definition

**SMART Thresholds:**
```javascript
// Specific, Measurable, Achievable, Relevant, Time-bound
export const options = {
  thresholds: {
    // Response time: p95 under 500ms
    'http_req_duration': ['p(95)<500'],

    // Error rate: less than 1%
    'http_req_failed': ['rate<0.01'],

    // Throughput: at least 100 RPS
    'http_reqs': ['rate>100'],

    // Specific endpoints
    'http_req_duration{name:checkout}': ['p(99)<1000'],

    // By status code
    'http_req_duration{status:200}': ['p(95)<400'],
  }
};
```

**Progressive Thresholds:**
```javascript
// Phase-specific thresholds
const thresholds = {
  warmup: {
    'http_req_duration': ['p(95)<1000']  // Relaxed
  },
  peak: {
    'http_req_duration': ['p(95)<500']   // Strict
  },
  soak: {
    'http_req_duration': ['p(95)<500', 'p(99.9)<2000']  // Stable
  }
};
```

### 4. Monitoring During Tests

**Application Metrics:**
```bash
# Monitor in real-time
- Response times (all percentiles)
- Error rates and types
- Throughput (RPS/TPS)
- Active connections
```

**Infrastructure Metrics:**
```bash
# System health
- CPU utilization (per service)
- Memory usage (heap, RSS)
- Disk I/O
- Network bandwidth
- Database connections
- Cache hit rates
```

**Integration Points:**
```javascript
// Prometheus metrics
import { Counter, Histogram } from 'k6/metrics';

const errorCounter = new Counter('errors');
const latencyHistogram = new Histogram('latency');

export default function() {
  const res = http.get(url);

  if (res.status !== 200) {
    errorCounter.add(1);
  }

  latencyHistogram.add(res.timings.duration);
}
```

### 5. Data Management

**Parameterization:**
```javascript
// Use data pools, not hardcoded values
import papaparse from 'papaparse';

const users = papaparse.parse(open('./users.csv')).data;

export default function() {
  const user = users[__VU % users.length];

  http.post('/login', {
    username: user.username,
    password: user.password
  });
}
```

**Data Cleanup:**
```javascript
// Clean up test data after runs
export function teardown(data) {
  // Delete test users
  http.del('/api/test-data', {
    headers: { 'X-Test-Run-ID': data.runId }
  });
}
```

### 6. Correlation and Dynamic Values

**Extract and Reuse:**
```javascript
// Extract CSRF tokens, session IDs
export default function() {
  const loginRes = http.post('/login', credentials);

  const token = loginRes.json('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  http.get('/profile', { headers });
  http.post('/update', payload, { headers });
}
```

**Handle Sessions:**
```javascript
import { jar } from 'k6/http';

const cookieJar = jar();

export default function() {
  // Cookies automatically managed
  http.get('/', { jar: cookieJar });
}
```

### 7. Error Handling

**Distinguish Error Types:**
```javascript
export default function() {
  const res = http.get(url);

  check(res, {
    'status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    }
  });

  // Tag errors for analysis
  if (res.status >= 500) {
    res.error_type = 'server_error';
  } else if (res.status >= 400) {
    res.error_type = 'client_error';
  }
}
```

### 8. Reporting and Analysis

**Consistent Metrics:**
```javascript
// Always include
- Test configuration (VUs, duration, ramp-up)
- Environment details (servers, versions)
- All percentiles (p50, p90, p95, p99, p99.9)
- Error rate and distribution
- Throughput (RPS/TPS)
- Resource utilization
```

**Trend Analysis:**
```javascript
// Compare against baselines
const baseline = {
  p95: 450,
  p99: 900,
  errorRate: 0.005,
  throughput: 200
};

const current = {
  p95: 520,  // ⚠️ Regression: +15.5%
  p99: 850,  // ✓ Improvement: -5.5%
  errorRate: 0.008,  // ⚠️ Regression: +60%
  throughput: 210  // ✓ Improvement: +5%
};
```

## SLA Validation

### Common SLA Patterns

#### Web Applications
```javascript
export const SLA = {
  availability: '99.9%',           // Three nines
  responseTime: {
    p50: '< 200ms',
    p95: '< 500ms',
    p99: '< 1000ms'
  },
  errorRate: '< 0.1%',            // 1 in 1000
  throughput: '> 100 RPS',
  uptime: '43m downtime/month max'
};
```

#### API Services
```javascript
export const SLA = {
  availability: '99.99%',          // Four nines
  responseTime: {
    p50: '< 100ms',
    p95: '< 300ms',
    p99: '< 500ms'
  },
  errorRate: '< 0.01%',           // 1 in 10,000
  throughput: '> 1000 RPS',
  uptime: '4.3m downtime/month max'
};
```

#### Critical Services (Payment, Auth)
```javascript
export const SLA = {
  availability: '99.999%',         // Five nines
  responseTime: {
    p50: '< 50ms',
    p95: '< 150ms',
    p99: '< 300ms'
  },
  errorRate: '< 0.001%',          // 1 in 100,000
  throughput: '> 5000 RPS',
  uptime: '26s downtime/month max'
};
```

### Validation Strategies

#### Automated SLA Checks
```javascript
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time');

export const options = {
  thresholds: {
    'errors': ['rate<0.001'],        // < 0.1% errors
    'response_time': [
      'p(50)<200',
      'p(95)<500',
      'p(99)<1000'
    ],
    'http_reqs': ['rate>100']        // > 100 RPS
  }
};

export default function() {
  const res = http.get(url);

  const passed = check(res, {
    'meets SLA': (r) => r.status === 200 && r.timings.duration < 500
  });

  errorRate.add(!passed);
  responseTrend.add(res.timings.duration);
}
```

#### Continuous SLA Monitoring
```yaml
# Prometheus alert rules
groups:
  - name: sla_violations
    interval: 30s
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        annotations:
          summary: "p95 response time above SLA threshold"

      - alert: HighErrorRate
        expr: rate(http_requests_failed_total[5m]) > 0.001
        for: 2m
        annotations:
          summary: "Error rate above SLA threshold"
```

### SLA Breach Response

**1. Immediate Actions:**
```
- Stop test if errors > 5% (safety threshold)
- Capture detailed logs and metrics
- Snapshot system state (heap dumps, thread dumps)
- Preserve test data for reproduction
```

**2. Root Cause Analysis:**
```
- Review response time distribution
- Analyze error types and patterns
- Check resource utilization
- Examine database query performance
- Review third-party service calls
```

**3. Remediation Planning:**
```
- Identify bottlenecks
- Propose optimizations
- Estimate impact
- Plan incremental improvements
- Retest after changes
```

## Results Analysis

See [results-analysis.md](./results-analysis.md) for comprehensive guide on:
- Reading test reports
- Identifying performance bottlenecks
- Correlating metrics with infrastructure
- Creating actionable recommendations
- Reporting to stakeholders

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Testing

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run k6 Load Test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: examples/load-testing/k6-load-test.js
          cloud: true
          token: ${{ secrets.K6_CLOUD_TOKEN }}

      - name: Upload Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: k6-results
          path: results/

      - name: Comment PR
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const results = require('./results/summary.json');
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Load Test Results\n\n- p95: ${results.p95}ms\n- Error rate: ${results.errorRate}%`
            });
```

### GitLab CI Example

```yaml
load-test:
  stage: test
  image: grafana/k6:latest
  script:
    - k6 run --out json=results.json examples/load-testing/k6-load-test.js
  artifacts:
    reports:
      junit: results.xml
    paths:
      - results.json
    expire_in: 30 days
  only:
    - merge_requests
    - schedules
```

## Troubleshooting

### Common Issues

**High Error Rates:**
```
Symptoms: > 1% errors during test
Causes:
  - Connection pool exhaustion
  - Rate limiting
  - Database connection limits
  - Memory pressure

Solutions:
  - Increase pool sizes
  - Add retry logic
  - Scale infrastructure
  - Optimize queries
```

**Inconsistent Results:**
```
Symptoms: Wide variation between test runs
Causes:
  - Background jobs interference
  - Caching effects
  - Auto-scaling delays
  - Network variability

Solutions:
  - Longer warm-up periods
  - Dedicated test environment
  - Disable auto-scaling during tests
  - Multiple test runs for average
```

**Load Generator Bottlenecks:**
```
Symptoms: Can't generate enough load
Causes:
  - CPU/memory limits on test machine
  - Network bandwidth saturation
  - DNS resolution delays

Solutions:
  - Distributed testing
  - More powerful machines
  - Connection pooling
  - DNS caching
```

## Additional Resources

### Documentation
- [k6 Documentation](https://k6.io/docs/)
- [Apache JMeter User Manual](https://jmeter.apache.org/usermanual/)
- [Artillery Documentation](https://artillery.io/docs/)
- [Gatling Documentation](https://gatling.io/docs/)

### Standards and Guidelines
- [ISO 25010 Quality Model](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010)
- [OWASP Performance Testing Guide](https://owasp.org/www-community/controls/Load_Testing)

### Performance Testing Communities
- [k6 Community Forum](https://community.k6.io/)
- [PerfBytes Newsletter](https://www.perfbytes.com/)
- [Load Impact Blog](https://k6.io/blog/)

### Books
- "The Art of Capacity Planning" by Arun Kejariwal & John Allspaw
- "High Performance Browser Networking" by Ilya Grigorik
- "Systems Performance" by Brendan Gregg

## Contributing

Found an issue or want to improve these examples? Please:
1. Review existing issues and pull requests
2. Follow the project's coding standards
3. Include comprehensive comments
4. Add or update tests as needed
5. Update documentation to reflect changes

## License

These examples are provided for educational purposes. Modify and use as needed for your projects.
