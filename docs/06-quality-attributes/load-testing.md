# Load Testing

## Overview

Load testing is a type of performance testing that evaluates how a system behaves under expected and peak load conditions. It measures system response time, throughput, resource utilization, and identifies performance bottlenecks.

## Purpose

- **Validate performance**: Ensure system meets performance requirements
- **Identify bottlenecks**: Find performance constraints before production
- **Capacity planning**: Determine infrastructure needs
- **Prevent outages**: Ensure system can handle traffic spikes
- **SLA compliance**: Verify service level agreements are met

## Load Testing Types

### 1. Load Testing (Normal Load)

Testing system under expected user load.

```javascript
// k6 load test - normal load
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.01'], // Error rate < 1%
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');

  check(res, {
    'status is 200': r => r.status === 200,
    'response time < 500ms': r => r.timings.duration < 500,
  });

  sleep(1);
}
```

### 2. Stress Testing (Peak Load)

Testing system beyond normal capacity to find breaking point.

```javascript
// k6 stress test
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Normal load
    { duration: '5m', target: 200 }, // Peak load
    { duration: '2m', target: 300 }, // Stress load
    { duration: '5m', target: 300 }, // Sustain stress
    { duration: '5m', target: 400 }, // Beyond capacity
    { duration: '10m', target: 0 }, // Recovery
  ],
};
```

### 3. Spike Testing

Testing system response to sudden traffic spikes.

```javascript
// k6 spike test
export const options = {
  stages: [
    { duration: '10s', target: 100 }, // Normal
    { duration: '1m', target: 2000 }, // Sudden spike
    { duration: '3m', target: 2000 }, // Sustain spike
    { duration: '10s', target: 100 }, // Back to normal
    { duration: '3m', target: 0 }, // Recovery
  ],
};
```

### 4. Soak Testing (Endurance)

Testing system stability over extended period.

```javascript
// k6 soak test
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '24h', target: 100 }, // Sustained load for 24 hours
    { duration: '2m', target: 0 }, // Ramp down
  ],
};
```

## Load Testing Tools

### 1. k6 (Modern, Developer-Friendly)

```javascript
// Full k6 example with custom metrics
import http from 'k6/http';
import { Counter, Trend, Rate } from 'k6/metrics';
import { check, sleep } from 'k6';

// Custom metrics
const checkoutErrors = new Counter('checkout_errors');
const checkoutDuration = new Trend('checkout_duration');
const checkoutSuccess = new Rate('checkout_success');

export const options = {
  stages: [
    { duration: '5m', target: 200 },
    { duration: '10m', target: 200 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    checkout_success: ['rate>0.95'],
    checkout_errors: ['count<50'],
  },
};

export default function () {
  // Login
  const loginRes = http.post('https://api.example.com/auth/login', {
    email: 'test@example.com',
    password: 'password',
  });

  check(loginRes, { 'login successful': r => r.status === 200 });

  const token = loginRes.json('token');

  // Add to cart
  const params = {
    headers: { Authorization: `Bearer ${token}` },
  };

  http.post(
    'https://api.example.com/cart',
    JSON.stringify({ productId: '123', quantity: 1 }),
    params
  );

  // Checkout
  const checkoutStart = Date.now();
  const checkoutRes = http.post(
    'https://api.example.com/checkout',
    JSON.stringify({ paymentMethod: 'card' }),
    params
  );

  const checkoutTime = Date.now() - checkoutStart;
  checkoutDuration.add(checkoutTime);

  const success = check(checkoutRes, {
    'checkout successful': r => r.status === 200,
  });

  checkoutSuccess.add(success);
  if (!success) checkoutErrors.add(1);

  sleep(Math.random() * 3 + 2); // Random think time 2-5s
}
```

### 2. JMeter

```xml
<!-- JMeter test plan example -->
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan>
      <elementProp name="TestPlan.user_defined_variables">
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

    <ThreadGroup>
      <stringProp name="ThreadGroup.num_threads">${USERS}</stringProp>
      <stringProp name="ThreadGroup.ramp_time">60</stringProp>
      <stringProp name="ThreadGroup.duration">300</stringProp>

      <HTTPSamplerProxy>
        <stringProp name="HTTPSampler.domain">${BASE_URL}</stringProp>
        <stringProp name="HTTPSampler.path">/api/products</stringProp>
        <stringProp name="HTTPSampler.method">GET</stringProp>
      </HTTPSamplerProxy>

      <ResponseAssertion>
        <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
        <stringProp name="Assertion.test_type">8</stringProp>
        <stringProp name="Assertion.test_string">200</stringProp>
      </ResponseAssertion>
    </ThreadGroup>
  </hashTree>
</jmeterTestPlan>
```

### 3. Gatling

```scala
// Gatling load test
import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class LoadTest extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")

  val scn = scenario("E-commerce Load Test")
    .exec(
      http("Get Products")
        .get("/products")
        .check(status.is(200))
    )
    .pause(1)
    .exec(
      http("Get Product Details")
        .get("/products/123")
        .check(status.is(200))
        .check(jsonPath("$.id").is("123"))
    )
    .pause(2)
    .exec(
      http("Add to Cart")
        .post("/cart")
        .body(StringBody("""{"productId":"123","quantity":1}"""))
        .check(status.is(201))
    )

  setUp(
    scn.inject(
      rampUsers(100) during (2 minutes),
      constantUsersPerSec(50) during (10 minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.max.lt(3000),
     global.successfulRequests.percent.gt(95)
   )
}
```

### 4. Locust (Python-Based)

```python
# locustfile.py
from locust import HttpUser, task, between

class EcommerceUser(HttpUser):
    wait_time = between(1, 3)  # Think time between requests

    def on_start(self):
        # Login once at start
        response = self.client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "password"
        })
        self.token = response.json()["token"]

    @task(3)  # Weight: 3x more likely than other tasks
    def browse_products(self):
        self.client.get("/products")

    @task(2)
    def view_product(self):
        self.client.get("/products/123")

    @task(1)
    def add_to_cart(self):
        self.client.post(
            "/cart",
            json={"productId": "123", "quantity": 1},
            headers={"Authorization": f"Bearer {self.token}"}
        )

    @task(1)
    def checkout(self):
        self.client.post(
            "/checkout",
            json={"paymentMethod": "card"},
            headers={"Authorization": f"Bearer {self.token}"}
        )

# Run: locust -f locustfile.py --host=https://api.example.com
```

## Performance Metrics

### Key Metrics to Track

```javascript
const performanceMetrics = {
  // Response time metrics
  responseTime: {
    average: 245, // ms
    p50: 180, // median
    p95: 450, // 95th percentile
    p99: 850, // 99th percentile
    max: 2100, // maximum
  },

  // Throughput
  throughput: {
    requestsPerSecond: 1250,
    transactionsPerSecond: 1100,
  },

  // Error rate
  errors: {
    total: 45,
    rate: 0.008, // 0.8%
    types: {
      500: 30,
      503: 10,
      504: 5,
    },
  },

  // Resource utilization
  resources: {
    cpu: 65, // % average
    memory: 78, // % used
    network: 125, // Mbps
    disk: 45, // % I/O wait
  },

  // Concurrent users
  users: {
    active: 500,
    peak: 750,
    target: 1000,
  },
};
```

### Performance Thresholds

```javascript
// Define acceptable performance criteria
const thresholds = {
  // Response time
  http_req_duration: {
    'p(95)<500': true, // 95% of requests < 500ms
    'p(99)<1000': true, // 99% of requests < 1s
  },

  // Error rate
  http_req_failed: {
    'rate<0.01': true, // < 1% error rate
  },

  // Throughput
  http_reqs: {
    'rate>100': true, // > 100 req/s
  },

  // Custom business metrics
  checkout_duration: {
    'p(95)<2000': true, // Checkout < 2s for 95%
  },
};
```

## Load Testing Strategy

### 1. Define Test Scenarios

```javascript
// User journey scenarios
const scenarios = {
  // Browse products (60% of users)
  browse: {
    executor: 'constant-vus',
    vus: 60,
    duration: '10m',
  },

  // Purchase flow (30% of users)
  purchase: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 30 },
      { duration: '8m', target: 30 },
    ],
  },

  // Admin operations (10% of users)
  admin: {
    executor: 'constant-arrival-rate',
    rate: 10,
    timeUnit: '1s',
    duration: '10m',
    preAllocatedVUs: 20,
  },
};
```

### 2. Gradual Load Increase

```javascript
// Progressive load testing
const progressiveLoad = {
  stages: [
    // Baseline: 10% of target
    { duration: '5m', target: 100 },

    // Step 1: 25% of target
    { duration: '5m', target: 250 },
    { duration: '10m', target: 250 },

    // Step 2: 50% of target
    { duration: '5m', target: 500 },
    { duration: '10m', target: 500 },

    // Step 3: 75% of target
    { duration: '5m', target: 750 },
    { duration: '10m', target: 750 },

    // Step 4: 100% of target
    { duration: '5m', target: 1000 },
    { duration: '20m', target: 1000 },

    // Ramp down
    { duration: '5m', target: 0 },
  ],
};
```

### 3. Think Time and Pacing

```javascript
// Realistic user behavior
export default function () {
  // View homepage
  http.get('/');
  sleep(randomBetween(2, 5));  // User reads page

  // Search products
  http.get('/search?q=laptop');
  sleep(randomBetween(3, 7));  // User reviews results

  // View product
  http.get('/products/123');
  sleep(randomBetween(5, 10)); // User reads details

  // Add to cart (50% of users)
  if (Math.random() < 0.5) {
    http.post('/cart', {...});
    sleep(randomBetween(1, 3));

    // Checkout (80% of those who add to cart)
    if (Math.random() < 0.8) {
      http.post('/checkout', {...});
    }
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
```

## Analyzing Results

### Performance Degradation Analysis

```javascript
// Analyze response time degradation under load
function analyzePerformance(results) {
  const baseline = results.find(r => r.vus === 100);
  const peak = results.find(r => r.vus === 1000);

  const degradation = {
    responseTime: {
      increase: ((peak.p95 - baseline.p95) / baseline.p95) * 100,
      acceptable: (peak.p95 - baseline.p95) / baseline.p95 < 0.5, // < 50% increase
    },
    throughput: {
      increase: ((peak.rps - baseline.rps) / baseline.rps) * 100,
      scaling: peak.rps / baseline.rps / 10, // Should scale ~linearly
    },
    errors: {
      increase: peak.errorRate - baseline.errorRate,
      acceptable: peak.errorRate < 0.01, // < 1%
    },
  };

  return degradation;
}
```

### Bottleneck Identification

```javascript
// Common bottlenecks to investigate
const bottleneckChecklist = {
  application: {
    'CPU usage > 80%': 'Optimize algorithms or scale horizontally',
    'Memory usage increasing': 'Check for memory leaks',
    'Thread pool exhausted': 'Increase pool size or optimize blocking operations',
  },

  database: {
    'Query time increasing': 'Add indexes, optimize queries',
    'Connection pool exhausted': 'Increase pool size',
    'Lock contention': 'Optimize transactions, reduce lock scope',
  },

  network: {
    'Bandwidth saturated': 'Optimize payload size, use CDN',
    'Latency increasing': 'Use caching, move services closer',
  },

  external: {
    'Third-party API slow': 'Implement caching, circuit breakers',
    'Timeout errors': 'Increase timeouts, add retry logic',
  },
};
```

## CI/CD Integration

```yaml
# GitHub Actions - Load testing in CI
name: Load Test

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch: # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: tests/load/api-load-test.js
          cloud: true
          token: ${{ secrets.K6_CLOUD_TOKEN }}

      - name: Check thresholds
        if: failure()
        run: |
          echo "Load test failed! Performance thresholds not met."
          exit 1

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: summary.json
```

## Best Practices

```markdown
**1. Test Production-Like Environment**

- Same infrastructure specs
- Same data volume
- Same configuration

**2. Isolate Test Environment**

- Don't test against production
- Prevent impact on real users
- Use production data copies (anonymized)

**3. Realistic Test Data**

- Varied data sets
- Edge cases included
- Production-like distribution

**4. Monitor Everything**

- Application metrics
- Infrastructure metrics
- Database metrics
- External dependencies

**5. Incremental Load Increase**

- Start with baseline
- Gradually increase load
- Monitor for degradation
- Find breaking point

**6. Run Multiple Test Types**

- Load test (normal)
- Stress test (peak)
- Spike test (sudden)
- Soak test (endurance)
```

## Related Resources

- [Performance Testing](performance-testing.md)
- [Scalability Testing](scalability-testing.md)
- [System Testing](../05-test-levels/system-testing.md)
- [Observability](../09-metrics-monitoring/observability.md)

## References

- ISO 25010 - Performance Efficiency
- ISTQB - Performance Testing
- k6 Documentation
- Google SRE Book - Load Testing

---

_Part of: [Quality Attributes](README.md)_
