# Performance Testing

## Purpose
Comprehensive guide to performance testing—ensuring systems meet performance requirements for response time, throughput, resource utilization, and scalability under various load conditions.

## Overview
Performance testing validates:
- Response times meet requirements
- System handles expected load
- Resources are utilized efficiently
- System scales appropriately
- Performance degrades gracefully

## What is Performance Testing?

### Definition
Performance testing is the process of determining the speed, responsiveness, stability, scalability, and resource usage of a system under a particular workload.

### Performance Testing Goals

```
Performance Testing Objectives:

Speed
├── How fast does the system respond?
├── What's the average response time?
└── What's the 95th percentile latency?

Scalability
├── How many concurrent users can it handle?
├── How does performance degrade with load?
└── What's the maximum capacity?

Stability
├── Does the system remain stable under load?
├── Are there memory leaks?
└── Does performance degrade over time?

Resource Usage
├── CPU utilization under load
├── Memory consumption patterns
├── Network bandwidth usage
└── Database connection pooling
```

## Types of Performance Testing

### 1. Load Testing

**Purpose:** Validate system behavior under expected load conditions

```javascript
// k6 load test
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up to 100 users
    { duration: '30m', target: 100 },  // Stay at 100 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.1'],              // Custom error rate < 10%
  },
};

export default function () {
  // Home page
  let res = http.get('https://api.example.com/');
  check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // API endpoint
  res = http.get('https://api.example.com/products');
  check(res, {
    'products status is 200': (r) => r.status === 200,
    'products has data': (r) => r.json().length > 0,
  }) || errorRate.add(1);

  sleep(2);

  // Create order (POST)
  const orderPayload = JSON.stringify({
    customerId: 123,
    items: [{ productId: 456, quantity: 2 }],
  });

  res = http.post('https://api.example.com/orders', orderPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'order created': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(1);
}
```

### 2. Stress Testing

**Purpose:** Determine system breaking point and failure behavior

```javascript
// k6 stress test
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Normal load
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },   // Increase load
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },   // Push beyond capacity
    { duration: '5m', target: 300 },
    { duration: '2m', target: 400 },   // Breaking point
    { duration: '5m', target: 400 },
    { duration: '10m', target: 0 },    // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(99)<3000'],  // Relaxed thresholds
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');

  check(res, {
    'status is 200 or 503': (r) => r.status === 200 || r.status === 503,
  });

  // Log when we start seeing failures
  if (res.status !== 200) {
    console.log(`Error at ${__VU} VUs: ${res.status}`);
  }

  sleep(1);
}
```

### 3. Spike Testing

**Purpose:** Test system behavior during sudden traffic spikes

```javascript
// k6 spike test
export const options = {
  stages: [
    { duration: '1m', target: 100 },    // Normal load
    { duration: '10s', target: 2000 },  // Sudden spike!
    { duration: '3m', target: 2000 },   // Sustain spike
    { duration: '10s', target: 100 },   // Drop back
    { duration: '3m', target: 100 },    // Recovery
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://api.example.com/products');

  check(res, {
    'survived spike': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 5000,
  });

  sleep(Math.random() * 2); // Random think time
}
```

### 4. Endurance Testing (Soak Testing)

**Purpose:** Verify system stability over extended period

```javascript
// k6 endurance test - runs for 8 hours
export const options = {
  stages: [
    { duration: '5m', target: 50 },     // Ramp up
    { duration: '8h', target: 50 },     // Sustained load for 8 hours
    { duration: '5m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Monitor for memory leaks, connection pool exhaustion
  sleep(1);
}
```

### 5. Scalability Testing

**Purpose:** Determine how system scales with increased load

```javascript
// Test scaling characteristics
export const options = {
  scenarios: {
    // Test with different user counts
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      startTime: '0s',
    },
    doubled: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      startTime: '6m',
    },
    quadrupled: {
      executor: 'constant-vus',
      vus: 40,
      duration: '5m',
      startTime: '12m',
    },
    octuple: {
      executor: 'constant-vus',
      vus: 80,
      duration: '5m',
      startTime: '18m',
    },
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Analyze: Does response time increase linearly, logarithmically, or exponentially?
  sleep(1);
}
```

## Performance Testing Tools

### k6 (Modern, Developer-Friendly)

```javascript
// k6-script.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

// Custom metrics
const checkoutDuration = new Trend('checkout_duration');
const checkoutErrors = new Rate('checkout_errors');
const itemsPerOrder = new Gauge('items_per_order');

export const options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '10m', target: 100 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],
    'checkout_duration': ['p(95)<2000'],
    'checkout_errors': ['rate<0.05'],
  },
  ext: {
    loadimpact: {
      projectID: 123456,
      name: 'E-commerce Load Test'
    }
  }
};

export default function () {
  group('Browse Products', () => {
    const res = http.get('https://api.example.com/products');
    check(res, {
      'products loaded': (r) => r.status === 200,
      'has products': (r) => r.json().length > 0,
    });
  });

  sleep(1);

  group('Checkout Flow', () => {
    const startTime = Date.now();

    // Add to cart
    let res = http.post('https://api.example.com/cart/add', JSON.stringify({
      productId: 123,
      quantity: 2,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'added to cart': (r) => r.status === 200,
    });

    sleep(0.5);

    // Checkout
    res = http.post('https://api.example.com/orders', JSON.stringify({
      cartId: res.json().cartId,
      paymentMethod: 'credit_card',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
      'checkout successful': (r) => r.status === 201,
    });

    if (!success) {
      checkoutErrors.add(1);
    }

    const duration = Date.now() - startTime;
    checkoutDuration.add(duration);

    if (res.status === 201) {
      itemsPerOrder.add(res.json().itemCount);
    }
  });

  sleep(2);
}
```

### JMeter (Enterprise Standard)

```xml
<!-- JMeter Test Plan Example -->
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="API Load Test">
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_URL" elementType="Argument">
            <stringProp name="Argument.value">https://api.example.com</stringProp>
          </elementProp>
          <elementProp name="USERS" elementType="Argument">
            <stringProp name="Argument.value">100</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>

    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Users">
        <intProp name="ThreadGroup.num_threads">${USERS}</intProp>
        <intProp name="ThreadGroup.ramp_time">300</intProp>
        <longProp name="ThreadGroup.duration">1800</longProp>
      </ThreadGroup>

      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Get Products">
          <stringProp name="HTTPSampler.domain">${BASE_URL}</stringProp>
          <stringProp name="HTTPSampler.path">/products</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
        </HTTPSamplerProxy>

        <hashTree>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion">
            <intProp name="Assertion.test_type">8</intProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <stringProp name="Assertion.test_string">200</stringProp>
          </ResponseAssertion>
        </hashTree>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

### Gatling (Scala-based)

```scala
// GatlingTest.scala
import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class EcommerceSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")
    .userAgentHeader("Gatling Load Test")

  val scn = scenario("E-commerce User Journey")
    .exec(http("Home Page")
      .get("/")
      .check(status.is(200)))
    .pause(1)

    .exec(http("Browse Products")
      .get("/products")
      .check(status.is(200))
      .check(jsonPath("$[*].id").findAll.saveAs("productIds")))
    .pause(2)

    .exec(http("View Product")
      .get("/products/${productIds.random()}")
      .check(status.is(200)))
    .pause(1)

    .exec(http("Add to Cart")
      .post("/cart/add")
      .body(StringBody("""{"productId": ${productIds.random()}, "quantity": 1}"""))
      .asJson
      .check(status.is(200)))
    .pause(2)

    .exec(http("Checkout")
      .post("/orders")
      .body(StringBody("""{"paymentMethod": "credit_card"}"""))
      .asJson
      .check(status.is(201)))

  setUp(
    scn.inject(
      rampUsers(100) during (5 minutes),
      constantUsersPerSec(20) during (10 minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.max.lt(5000),
     global.responseTime.percentile3.lt(1000),
     global.successfulRequests.percent.gt(99)
   )
}
```

## Performance Metrics

### Response Time Metrics

```
Key Metrics to Track:

Average Response Time
├── Mean time for all requests
└── Can be misleading due to outliers

Median Response Time (P50)
├── 50% of requests faster than this
└── Better than average for typical user

90th Percentile (P90)
├── 90% of requests faster than this
└── Captures most user experiences

95th Percentile (P95)
├── 95% of requests faster than this
└── Industry standard SLA metric

99th Percentile (P99)
├── 99% of requests faster than this
└── Captures slow requests

Max Response Time
├── Slowest request
└── Useful for identifying outliers
```

### Example Metrics Analysis

```javascript
// Analyze performance test results
class PerformanceAnalyzer {
  analyze(results) {
    const responseTimes = results.map(r => r.duration).sort((a, b) => a - b);
    const count = responseTimes.length;

    return {
      count,
      avg: this.average(responseTimes),
      median: this.percentile(responseTimes, 50),
      p90: this.percentile(responseTimes, 90),
      p95: this.percentile(responseTimes, 95),
      p99: this.percentile(responseTimes, 99),
      max: Math.max(...responseTimes),
      min: Math.min(...responseTimes),
      stdDev: this.standardDeviation(responseTimes)
    };
  }

  percentile(sorted, pct) {
    const index = Math.ceil((pct / 100) * sorted.length) - 1;
    return sorted[index];
  }

  average(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  standardDeviation(values) {
    const avg = this.average(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.average(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
}

// Usage
const results = [
  { duration: 120 }, { duration: 150 }, { duration: 180 },
  { duration: 200 }, { duration: 250 }, { duration: 300 },
  // ... more results
];

const analyzer = new PerformanceAnalyzer();
const metrics = analyzer.analyze(results);

console.log(`
Response Time Analysis:
- Average: ${metrics.avg.toFixed(2)}ms
- Median: ${metrics.median}ms
- P90: ${metrics.p90}ms
- P95: ${metrics.p95}ms
- P99: ${metrics.p99}ms
- Max: ${metrics.max}ms
- Std Dev: ${metrics.stdDev.toFixed(2)}ms
`);
```

### Throughput Metrics

```
Throughput Measurements:

Requests Per Second (RPS)
= Total Requests / Time Period

Transactions Per Second (TPS)
= Completed Transactions / Time Period

Concurrent Users
= Active users at any given time

Think Time
= Time users wait between actions

Example:
- 100 concurrent users
- Each user makes 10 requests
- Test duration: 60 seconds
- Throughput: (100 * 10) / 60 = 16.67 RPS
```

## Performance Testing Best Practices

### 1. Realistic Load Patterns

```javascript
// ❌ Unrealistic: All users start at once
export const options = {
  vus: 1000,
  duration: '10m',
};

// ✅ Realistic: Gradual ramp-up
export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Normal ramp
    { duration: '10m', target: 1000 }, // Gradual increase
    { duration: '30m', target: 1000 }, // Sustain
    { duration: '5m', target: 0 },     // Ramp down
  ],
};
```

### 2. Production-Like Environment

```
Environment Checklist:

Infrastructure:
- [ ] Same hardware specifications
- [ ] Same network topology
- [ ] Same database configuration
- [ ] Same caching setup
- [ ] Same CDN configuration

Data:
- [ ] Production-like data volume
- [ ] Realistic data distribution
- [ ] Proper indexes
- [ ] Representative queries

Configuration:
- [ ] Production settings
- [ ] Connection pools sized correctly
- [ ] Timeouts configured
- [ ] Resource limits set
```

### 3. Think Time and Pacing

```javascript
// Simulate realistic user behavior
export default function () {
  // User views homepage
  http.get('https://api.example.com/');
  sleep(Math.random() * 3 + 2); // 2-5 seconds thinking

  // User searches
  http.get('https://api.example.com/search?q=laptop');
  sleep(Math.random() * 5 + 3); // 3-8 seconds reading results

  // User views product
  http.get('https://api.example.com/products/123');
  sleep(Math.random() * 10 + 5); // 5-15 seconds reading details

  // User adds to cart
  http.post('https://api.example.com/cart/add', payload);
  sleep(1); // Quick action
}
```

### 4. Monitor System Resources

```javascript
// Monitor system health during test
import { check } from 'k6';
import http from 'k6/http';
import { Gauge } from 'k6/metrics';

const cpuUsage = new Gauge('cpu_usage');
const memoryUsage = new Gauge('memory_usage');

export default function () {
  // Make request
  const res = http.get('https://api.example.com/products');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Check system metrics endpoint
  const metrics = http.get('https://api.example.com/metrics').json();
  cpuUsage.add(metrics.cpu);
  memoryUsage.add(metrics.memory);

  // Alert if resources are exhausted
  if (metrics.cpu > 90) {
    console.warn(`High CPU usage: ${metrics.cpu}%`);
  }
  if (metrics.memory > 85) {
    console.warn(`High memory usage: ${metrics.memory}%`);
  }
}
```

## Performance Bottleneck Analysis

### Common Bottlenecks

```
Database:
├── Slow queries (missing indexes)
├── Connection pool exhaustion
├── N+1 query problem
├── Lock contention
└── Inefficient joins

Application:
├── Synchronous processing
├── Memory leaks
├── Inefficient algorithms
├── Blocking I/O operations
└── Poor caching strategy

Network:
├── High latency
├── Bandwidth limitations
├── DNS resolution delays
├── SSL/TLS handshake overhead
└── Too many HTTP requests

Infrastructure:
├── CPU bottleneck
├── Memory bottleneck
├── Disk I/O bottleneck
├── Network bottleneck
└── Load balancer limits
```

### Profiling Tools

```javascript
// Node.js performance profiling
const { performance, PerformanceObserver } = require('perf_hooks');

// Mark performance points
performance.mark('start-processing');

// ... do work ...
processLargeDataset(data);

performance.mark('end-processing');

// Measure duration
performance.measure('processing-time', 'start-processing', 'end-processing');

// Observe measures
const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });

// Memory profiling
console.log(process.memoryUsage());
/*
{
  rss: 36864000,        // Resident Set Size
  heapTotal: 6537216,   // Total heap allocated
  heapUsed: 4243728,    // Heap actually used
  external: 856592,     // C++ objects bound to JS
  arrayBuffers: 10000   // ArrayBuffers and SharedArrayBuffers
}
*/
```

## Performance Testing Checklist

### Pre-Test Checklist
- [ ] Test objectives defined
- [ ] Success criteria established
- [ ] Test environment configured
- [ ] Baseline metrics captured
- [ ] Monitoring tools configured
- [ ] Test data prepared
- [ ] Test scripts validated

### During Test Checklist
- [ ] System resources monitored
- [ ] Error logs reviewed
- [ ] Response times tracked
- [ ] Throughput measured
- [ ] Bottlenecks identified
- [ ] Alerts configured
- [ ] Test data refreshed as needed

### Post-Test Checklist
- [ ] Results analyzed
- [ ] Bottlenecks documented
- [ ] Recommendations made
- [ ] Report generated
- [ ] Stakeholders informed
- [ ] Action items created
- [ ] Baseline updated

## References

### Tools
- **k6**: Modern, developer-friendly load testing
- **JMeter**: Enterprise standard
- **Gatling**: Scala-based, high performance
- **Locust**: Python-based, distributed testing
- **Artillery**: Node.js-based, easy to use

### Books
- "The Art of Application Performance Testing" - Ian Molyneaux
- "Performance Testing Guidance for Web Applications" - Microsoft
- "Web Performance in Action" - Jeremy Wagner

### Resources
- [k6 Documentation](https://k6.io/docs/)
- [JMeter Best Practices](https://jmeter.apache.org/usermanual/best-practices.html)
- [Web Performance Working Group](https://www.w3.org/webperf/)

## Related Topics

- [Load Testing](load-testing.md)
- [Scalability Testing](scalability-testing.md)
- [Monitoring & Observability](../09-metrics-monitoring/observability.md)
- [System Testing](../05-test-levels/system-testing.md)

---

*Part of: [Quality Attributes](README.md)*
