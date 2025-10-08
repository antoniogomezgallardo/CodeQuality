# Scalability Testing

## Overview

Scalability testing evaluates a system's ability to scale up or down in response to changing load. It measures how well an application handles increased workload by adding resources (vertical scaling) or distributing load across multiple instances (horizontal scaling).

## Purpose

- **Capacity planning**: Determine resource needs for growth
- **Performance validation**: Ensure system scales efficiently
- **Cost optimization**: Find optimal resource allocation
- **Bottleneck identification**: Discover scaling limitations
- **Architecture validation**: Verify scalability design decisions

## Scaling Strategies

### 1. Vertical Scaling (Scale Up)

Adding more resources to a single machine.

```yaml
# Kubernetes vertical scaling
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: myapp:latest
    resources:
      requests:
        memory: "1Gi"
        cpu: "500m"
      limits:
        memory: "4Gi"      # Scale up to 4GB
        cpu: "2000m"       # Scale up to 2 CPUs
```

**Pros:**
- Simpler to implement
- No code changes needed
- Maintains data consistency

**Cons:**
- Hardware limits
- Single point of failure
- More expensive per unit
- Downtime during upgrades

### 2. Horizontal Scaling (Scale Out)

Adding more instances of the application.

```yaml
# Kubernetes horizontal scaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3              # Start with 3 instances
  selector:
    matchLabels:
      app: myapp
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 3
  maxReplicas: 100
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

**Pros:**
- Nearly unlimited scaling
- High availability
- Better fault tolerance
- Cost-effective

**Cons:**
- Complex architecture
- Requires stateless design
- Data consistency challenges
- More operational overhead

## Scalability Testing Approach

### Phase 1: Baseline Performance

```javascript
// k6 - Establish baseline with minimal load
export const options = {
  stages: [
    { duration: '5m', target: 50 },    // 50 users
    { duration: '10m', target: 50 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

// Baseline results:
// - 50 users
// - 100 req/s
// - p95: 250ms
// - CPU: 25%
// - Memory: 512MB
```

### Phase 2: Linear Scaling Test

```javascript
// Test if performance scales linearly with load
export const options = {
  stages: [
    { duration: '5m', target: 50 },     // 1x baseline
    { duration: '10m', target: 50 },
    { duration: '5m', target: 100 },    // 2x baseline
    { duration: '10m', target: 100 },
    { duration: '5m', target: 200 },    // 4x baseline
    { duration: '10m', target: 200 },
    { duration: '5m', target: 400 },    // 8x baseline
    { duration: '10m', target: 400 },
  ],
};

// Expected: Response time should remain relatively constant
// Actual: Monitor for degradation
```

### Phase 3: Scale-Up Test

```javascript
// Test system's ability to handle continuous growth
export const options = {
  stages: [
    { duration: '10m', target: 100 },
    { duration: '10m', target: 200 },
    { duration: '10m', target: 400 },
    { duration: '10m', target: 800 },
    { duration: '10m', target: 1600 },
    { duration: '10m', target: 3200 },
    // Continue until system degrades
  ],
};
```

### Phase 4: Auto-Scaling Test

```javascript
// Test auto-scaling behavior
import { sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    // Trigger scale-up
    { duration: '2m', target: 1000 },   // Sudden spike
    { duration: '5m', target: 1000 },   // Sustain

    // Allow scale-down
    { duration: '2m', target: 100 },    // Drop load
    { duration: '10m', target: 100 },   // Sustain low load

    // Verify system recovered
  ],
};

export default function () {
  http.get('https://api.example.com/');
  sleep(1);
}

// Monitor:
// - Time to scale up (should be < 3 minutes)
// - Time to scale down (should be > 5 minutes to avoid flapping)
// - Instance count changes
// - Performance during scaling transitions
```

## Scalability Metrics

```javascript
const scalabilityMetrics = {
  // Scaling efficiency
  scalingEfficiency: {
    baseline: {
      instances: 1,
      throughput: 100,     // req/s
      responseTime: 200    // ms
    },
    scaled: {
      instances: 10,
      throughput: 850,     // req/s (should be ~1000)
      responseTime: 220    // ms (acceptable < 10% increase)
    },
    efficiency: 0.85       // 85% efficiency (850/1000)
  },

  // Resource utilization
  resourceUtilization: {
    cpu: {
      perInstance: 70,     // % (target: 60-80%)
      total: 700           // % across 10 instances
    },
    memory: {
      perInstance: 2.1,    // GB
      total: 21            // GB across 10 instances
    }
  },

  // Scaling metrics
  scaling: {
    scaleUpTime: 145,      // seconds (target: < 180s)
    scaleDownTime: 320,    // seconds (target: > 300s)
    maxInstances: 50,
    minInstances: 3
  },

  // Cost efficiency
  costPerRequest: {
    baseline: 0.0001,      // $ per request with 1 instance
    scaled: 0.00009,       // $ per request with 10 instances
    savings: 0.10          // 10% cost reduction per request
  }
};
```

## Database Scalability

### Read Replicas

```javascript
// Database scaling with read replicas
class DatabaseScaling {
  constructor() {
    this.primary = new DatabaseConnection('primary');
    this.replicas = [
      new DatabaseConnection('replica-1'),
      new DatabaseConnection('replica-2'),
      new DatabaseConnection('replica-3')
    ];
    this.currentReplica = 0;
  }

  // Writes go to primary
  async write(query, params) {
    return await this.primary.execute(query, params);
  }

  // Reads distributed across replicas
  async read(query, params) {
    const replica = this.replicas[this.currentReplica];
    this.currentReplica = (this.currentReplica + 1) % this.replicas.length;
    return await replica.execute(query, params);
  }
}

// Usage
const db = new DatabaseScaling();

// Write operation
await db.write('INSERT INTO users (name) VALUES (?)', ['John']);

// Read operations (load-balanced across replicas)
const user1 = await db.read('SELECT * FROM users WHERE id = ?', [1]);
const user2 = await db.read('SELECT * FROM users WHERE id = ?', [2]);
const user3 = await db.read('SELECT * FROM users WHERE id = ?', [3]);
```

### Sharding

```javascript
// Database sharding for horizontal scaling
class ShardedDatabase {
  constructor() {
    this.shards = [
      new DatabaseConnection('shard-0'),
      new DatabaseConnection('shard-1'),
      new DatabaseConnection('shard-2'),
      new DatabaseConnection('shard-3')
    ];
  }

  // Determine shard based on user ID
  getShard(userId) {
    const shardId = userId % this.shards.length;
    return this.shards[shardId];
  }

  async query(userId, sql, params) {
    const shard = this.getShard(userId);
    return await shard.execute(sql, params);
  }

  // Cross-shard queries (expensive)
  async queryAll(sql, params) {
    const promises = this.shards.map(shard =>
      shard.execute(sql, params)
    );
    const results = await Promise.all(promises);
    return results.flat();
  }
}
```

## Caching for Scalability

```javascript
// Multi-layer caching strategy
class CachingLayer {
  constructor() {
    this.l1Cache = new Map();          // In-memory cache
    this.l2Cache = new RedisClient();  // Distributed cache
    this.database = new Database();
  }

  async get(key) {
    // L1: Check in-memory cache
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }

    // L2: Check Redis
    const cached = await this.l2Cache.get(key);
    if (cached) {
      this.l1Cache.set(key, cached);  // Populate L1
      return cached;
    }

    // L3: Query database
    const data = await this.database.query(key);

    // Populate caches
    await this.l2Cache.set(key, data, { ttl: 3600 });
    this.l1Cache.set(key, data);

    return data;
  }
}

// Cache reduces database load by 90%+
```

## Load Balancing

```nginx
# Nginx load balancer configuration
upstream backend {
    least_conn;  # Route to server with fewest connections

    server backend1.example.com:8080 weight=3;
    server backend2.example.com:8080 weight=2;
    server backend3.example.com:8080 weight=1;

    # Health checks
    check interval=3000 rise=2 fall=3 timeout=1000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Connection pooling
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Scalability Testing Checklist

```markdown
**Before Testing:**
- [ ] Establish baseline performance
- [ ] Define scaling targets (users, throughput)
- [ ] Set up monitoring (metrics, logs, traces)
- [ ] Configure auto-scaling rules
- [ ] Prepare test environment (production-like)

**During Testing:**
- [ ] Monitor instance count changes
- [ ] Track response times across load levels
- [ ] Measure resource utilization (CPU, memory, network)
- [ ] Verify data consistency across instances
- [ ] Test failover and recovery
- [ ] Monitor costs during scaling

**After Testing:**
- [ ] Calculate scaling efficiency
- [ ] Identify bottlenecks
- [ ] Optimize auto-scaling parameters
- [ ] Document capacity limits
- [ ] Plan infrastructure capacity
```

## Scalability Anti-Patterns

```markdown
**1. Stateful Sessions**
❌ Storing session data in application memory
✅ Use distributed session store (Redis, database)

**2. Shared Mutable State**
❌ Multiple instances modifying shared file system
✅ Use message queues or event streams

**3. Database as Bottleneck**
❌ All instances hitting single database
✅ Read replicas, caching, sharding

**4. Hardcoded Instance References**
❌ Instance A calling Instance B directly
✅ Use load balancer, service discovery

**5. Synchronous Processing**
❌ Blocking long-running operations
✅ Asynchronous processing with queues
```

## Related Resources

- [Load Testing](load-testing.md)
- [Performance Testing](performance-testing.md)
- [System Testing](../05-test-levels/system-testing.md)
- [Observability](../09-metrics-monitoring/observability.md)

## References

- ISO 25010 - Performance Efficiency
- Google SRE Book - Capacity Planning
- AWS Well-Architected Framework
- Kubernetes Autoscaling Best Practices

---

*Part of: [Quality Attributes](README.md)*
