# k6 Quick Start

**Time:** 4 minutes
**Prerequisites:** None (k6 is standalone) or Docker
**What You'll Learn:** Set up k6 and run your first load test

## 1. Install (1 minute)

### Option A: Direct Install

**macOS:**

```bash
brew install k6
```

**Windows:**

```powershell
choco install k6
# Or download from https://k6.io/docs/get-started/installation/
```

**Linux:**

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Option B: Docker

```bash
# No installation needed, use Docker
docker pull grafana/k6:latest
```

## 2. Configure (30 seconds)

Create project structure:

```bash
mkdir k6-tests && cd k6-tests
touch load-test.js
```

## 3. Hello World (2 minutes)

Create `load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'], // Error rate under 1%
  },
};

// Test scenario
export default function () {
  // Make HTTP GET request
  const response = http.get('https://test.k6.io');

  // Verify response
  check(response, {
    'status is 200': r => r.status === 200,
    'response time < 500ms': r => r.timings.duration < 500,
  });

  // Think time between requests
  sleep(1);
}
```

## 4. Run Tests (30 seconds)

```bash
# Run with k6 directly
k6 run load-test.js

# Run with Docker
docker run --rm -v $(pwd):/scripts grafana/k6 run /scripts/load-test.js

# Run with custom VUs and duration
k6 run --vus 10 --duration 30s load-test.js

# Run and output results to JSON
k6 run --out json=results.json load-test.js

# Run with cloud output (requires k6 cloud account)
k6 run --out cloud load-test.js
```

**Expected Output:**

```
          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: load-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 20 max VUs, 2m30s max duration

     ✓ status is 200
     ✓ response time < 500ms

     checks.........................: 100.00% ✓ 180      ✗ 0
     data_received..................: 2.4 MB  12 kB/s
     data_sent......................: 18 kB   91 B/s
     http_req_blocked...............: avg=12.43ms  min=0s       med=0s     max=223.45ms p(95)=41.23ms
     http_req_duration..............: avg=142.38ms min=101.25ms med=134ms  max=286.45ms p(95)=234.12ms
     http_req_failed................: 0.00%   ✓ 0        ✗ 180
     http_reqs......................: 180     0.9/s
     iteration_duration.............: avg=1.15s    min=1.11s    med=1.13s  max=1.48s    p(95)=1.24s
     iterations.....................: 180     0.9/s
     vus............................: 2       min=2      max=20
     vus_max........................: 20      min=20     max=20

running (2m00.0s), 00/20 VUs, 180 complete and 0 interrupted iterations
default ✓ [======================================] 00/20 VUs  2m0s
```

## 5. Next Steps

### Load Test Patterns

**Constant Load:**

```javascript
export const options = {
  vus: 50,
  duration: '5m',
};
```

**Stress Test (Find Breaking Point):**

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp to 100 users
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 200 }, // Increase to 200
    { duration: '5m', target: 200 }, // Stay at 200
    { duration: '2m', target: 300 }, // Increase to 300
    { duration: '5m', target: 300 }, // Stay at 300
    { duration: '10m', target: 0 }, // Ramp down
  ],
};
```

**Spike Test:**

```javascript
export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '10s', target: 1400 }, // Spike!
    { duration: '3m', target: 1400 },
    { duration: '10s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '10s', target: 0 },
  ],
};
```

### Multiple Scenarios

```javascript
export const options = {
  scenarios: {
    browse_products: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
      ],
      exec: 'browseProducts',
    },
    checkout: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m30s',
      exec: 'checkout',
    },
  },
};

export function browseProducts() {
  http.get('https://example.com/products');
  sleep(2);
}

export function checkout() {
  http.post(
    'https://example.com/checkout',
    JSON.stringify({
      productId: 123,
      quantity: 1,
    })
  );
  sleep(3);
}
```

### Advanced Checks

```javascript
import { check } from 'k6';

export default function () {
  const response = http.get('https://api.example.com/users');

  check(response, {
    'status is 200': r => r.status === 200,
    'has users': r => {
      const body = JSON.parse(r.body);
      return body.users && body.users.length > 0;
    },
    'response time OK': r => r.timings.duration < 200,
    'content type is JSON': r => r.headers['Content-Type'] === 'application/json',
  });
}
```

### Custom Metrics

```javascript
import { Trend, Counter } from 'k6/metrics';

const customTrend = new Trend('custom_waiting_time');
const errorCounter = new Counter('errors');

export default function () {
  const start = new Date();
  const response = http.get('https://example.com');
  const end = new Date();

  customTrend.add(end - start);

  if (response.status !== 200) {
    errorCounter.add(1);
  }
}
```

### POST Requests with Data

```javascript
import http from 'k6/http';

export default function () {
  const url = 'https://api.example.com/login';
  const payload = JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(url, payload, params);
  check(response, {
    'login successful': r => r.status === 200,
  });
}
```

## 6. Troubleshooting

### Issue: "k6 command not found"

```bash
# Verify installation
k6 version

# If not found, reinstall or use Docker
docker run grafana/k6 version
```

### Issue: High error rate

```javascript
// Increase timeout
export const options = {
  httpDebug: 'full', // Enable HTTP debugging
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Increase threshold
  },
};

// Add delays between requests
sleep(Math.random() * 3 + 1); // 1-4 seconds
```

### Issue: Tests running too long

```javascript
// Set maximum duration
export const options = {
  maxDuration: '5m', // Force stop after 5 minutes
};
```

### Issue: Not enough VUs

```bash
# Increase VUs from command line
k6 run --vus 100 load-test.js

# Or in script
export const options = {
  vus: 100,
};
```

### Issue: Results not saving

```bash
# Output to JSON
k6 run --out json=results.json script.js

# Output to InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 script.js

# Multiple outputs
k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 script.js
```

## 🎓 Key Concepts

```javascript
// Virtual Users (VUs)
export const options = {
  vus: 10,           // 10 concurrent virtual users
  duration: '30s',    // Run for 30 seconds
};

// Stages (ramp up/down)
stages: [
  { duration: '1m', target: 100 },  // Ramp to 100 VUs over 1 min
  { duration: '3m', target: 100 },  // Stay at 100 for 3 min
  { duration: '1m', target: 0 },    // Ramp down to 0
]

// Thresholds (pass/fail criteria)
thresholds: {
  http_req_duration: ['p(95)<500'],      // 95th percentile < 500ms
  http_req_failed: ['rate<0.01'],        // Error rate < 1%
  http_reqs: ['rate>100'],               // Throughput > 100 rps
  checks: ['rate>0.95'],                 // 95% of checks pass
}

// Checks (assertions)
check(response, {
  'status is 200': (r) => r.status === 200,
  'response time OK': (r) => r.timings.duration < 200,
});
```

## 📚 Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [k6 Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [Full k6 Examples](../load-testing/)

## ⏭️ What's Next?

1. **Add custom metrics** - Track business KPIs
2. **Use scenarios** - Test multiple user journeys
3. **Integrate with CI** - Automated performance regression
4. **Output to InfluxDB** - Better visualization
5. **Cloud testing** - Distribute load globally

---

**Time to first test:** ~4 minutes ✅
**Ready for production?** Add thresholds and CI integration!
