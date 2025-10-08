/**
 * API Performance Testing Examples
 *
 * This file demonstrates comprehensive performance testing patterns including:
 * - Response time measurement and assertions
 * - Throughput testing (requests per second)
 * - Concurrent request handling
 * - Load simulation
 * - Memory usage monitoring
 * - Performance regression detection
 * - Bottleneck identification
 * - SLA validation
 *
 * Performance tests help identify bottlenecks, ensure APIs meet
 * performance requirements, and detect performance regressions.
 *
 * @requires jest
 * @requires supertest
 * @requires autocannon (for load testing)
 */

const request = require('supertest');
const express = require('express');
const autocannon = require('autocannon');

// ============================================================================
// Mock Express Application
// ============================================================================

const createApp = () => {
  const app = express();
  app.use(express.json());

  // Mock data
  const users = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 10 === 0 ? 'admin' : 'user',
    createdAt: new Date().toISOString()
  }));

  /**
   * Fast endpoint - should respond quickly
   */
  app.get('/api/fast', (req, res) => {
    res.json({ message: 'Fast response', timestamp: Date.now() });
  });

  /**
   * Slow endpoint - simulates database query
   */
  app.get('/api/slow', async (req, res) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    res.json({ message: 'Slow response', timestamp: Date.now() });
  });

  /**
   * CPU-intensive endpoint
   */
  app.get('/api/cpu-intensive', (req, res) => {
    // Simulate CPU-intensive operation
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i);
    }
    res.json({ result, timestamp: Date.now() });
  });

  /**
   * Memory-intensive endpoint
   */
  app.get('/api/memory-intensive', (req, res) => {
    // Create large array
    const largeArray = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      data: `Data ${i}`.repeat(10)
    }));

    res.json({
      count: largeArray.length,
      timestamp: Date.now()
    });
  });

  /**
   * Paginated users endpoint
   */
  app.get('/api/users', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const paginatedUsers = users.slice(offset, offset + limit);

    res.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit)
      }
    });
  });

  /**
   * Search endpoint with filtering
   */
  app.get('/api/search', (req, res) => {
    const { query: searchQuery, role } = req.query;

    let results = users;

    if (searchQuery) {
      results = results.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (role) {
      results = results.filter(user => user.role === role);
    }

    res.json({
      results,
      count: results.length,
      timestamp: Date.now()
    });
  });

  /**
   * Endpoint with variable response time
   */
  app.get('/api/variable', async (req, res) => {
    const delay = Math.random() * 1000; // 0-1000ms random delay
    await new Promise(resolve => setTimeout(resolve, delay));
    res.json({ delay, timestamp: Date.now() });
  });

  /**
   * Concurrent request handler
   */
  app.post('/api/process', async (req, res) => {
    const { data } = req.body;

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));

    res.json({
      processed: true,
      data,
      timestamp: Date.now()
    });
  });

  return app;
};

// ============================================================================
// Performance Testing Utilities
// ============================================================================

/**
 * Measure request response time
 * @param {Function} requestFn - Function that makes the request
 * @returns {Promise<Object>} Response and duration
 */
const measureResponseTime = async (requestFn) => {
  const start = Date.now();
  const response = await requestFn();
  const duration = Date.now() - start;

  return { response, duration };
};

/**
 * Run multiple concurrent requests
 * @param {Function} requestFn - Function that makes the request
 * @param {number} count - Number of concurrent requests
 * @returns {Promise<Array>} Results of all requests
 */
const runConcurrentRequests = async (requestFn, count) => {
  const requests = Array(count).fill(null).map(() => requestFn());
  return Promise.all(requests);
};

/**
 * Calculate statistics from durations
 * @param {Array<number>} durations - Array of response durations
 * @returns {Object} Statistics
 */
const calculateStats = (durations) => {
  const sorted = [...durations].sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / durations.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
};

/**
 * Run load test using autocannon
 * @param {string} url - URL to test
 * @param {Object} options - Load test options
 * @returns {Promise<Object>} Load test results
 */
const runLoadTest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      connections: options.connections || 10,
      duration: options.duration || 10,
      pipelining: options.pipelining || 1,
      ...options
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });

    autocannon.track(instance);
  });
};

// ============================================================================
// Test Suite
// ============================================================================

describe('API Performance Testing', () => {
  let app;
  let server;

  beforeAll(() => {
    app = createApp();
    server = app.listen(0); // Random port
  });

  afterAll((done) => {
    server.close(done);
  });

  // ==========================================================================
  // Response Time Tests
  // ==========================================================================

  describe('Response Time', () => {
    it('should respond to fast endpoint within 100ms', async () => {
      const { duration } = await measureResponseTime(() =>
        request(app).get('/api/fast').expect(200)
      );

      expect(duration).toBeLessThan(100);
    });

    it('should meet SLA for user list endpoint (< 500ms)', async () => {
      const { duration } = await measureResponseTime(() =>
        request(app)
          .get('/api/users')
          .query({ page: 1, limit: 10 })
          .expect(200)
      );

      expect(duration).toBeLessThan(500);
    });

    it('should measure and validate search endpoint performance', async () => {
      const { duration, response } = await measureResponseTime(() =>
        request(app)
          .get('/api/search')
          .query({ query: 'user', role: 'admin' })
          .expect(200)
      );

      expect(duration).toBeLessThan(1000);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('count');
    });

    it('should track response times over multiple requests', async () => {
      const iterations = 20;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const { duration } = await measureResponseTime(() =>
          request(app).get('/api/fast').expect(200)
        );
        durations.push(duration);
      }

      const stats = calculateStats(durations);

      console.log('Response Time Statistics:', stats);

      expect(stats.mean).toBeLessThan(100);
      expect(stats.p95).toBeLessThan(150);
      expect(stats.p99).toBeLessThan(200);
    });

    it('should detect slow endpoints', async () => {
      const { duration } = await measureResponseTime(() =>
        request(app).get('/api/slow').expect(200)
      );

      // Document that this endpoint is intentionally slow
      expect(duration).toBeGreaterThan(500);
      expect(duration).toBeLessThan(600); // But not too slow
    });
  });

  // ==========================================================================
  // Throughput Tests
  // ==========================================================================

  describe('Throughput', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();

      const results = await runConcurrentRequests(
        () => request(app).get('/api/fast').expect(200),
        concurrentRequests
      );

      const totalTime = Date.now() - startTime;
      const requestsPerSecond = (concurrentRequests / totalTime) * 1000;

      console.log(`Throughput: ${requestsPerSecond.toFixed(2)} requests/second`);

      expect(results).toHaveLength(concurrentRequests);
      expect(requestsPerSecond).toBeGreaterThan(10); // At least 10 req/s
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentRequests = 100;
      const durations = [];

      const results = await runConcurrentRequests(
        async () => {
          const { duration, response } = await measureResponseTime(() =>
            request(app).get('/api/users').expect(200)
          );
          durations.push(duration);
          return response;
        },
        concurrentRequests
      );

      const stats = calculateStats(durations);

      console.log('Concurrent Request Statistics:', stats);

      expect(results).toHaveLength(concurrentRequests);
      expect(stats.p95).toBeLessThan(1000); // 95% under 1 second
      expect(stats.p99).toBeLessThan(2000); // 99% under 2 seconds
    });

    it('should handle POST requests under load', async () => {
      const concurrentRequests = 50;
      const durations = [];

      const results = await runConcurrentRequests(
        async () => {
          const { duration, response } = await measureResponseTime(() =>
            request(app)
              .post('/api/process')
              .send({ data: 'test data' })
              .expect(200)
          );
          durations.push(duration);
          return response;
        },
        concurrentRequests
      );

      const stats = calculateStats(durations);

      console.log('POST Request Statistics:', stats);

      expect(results).toHaveLength(concurrentRequests);
      expect(stats.mean).toBeLessThan(500);
    });
  });

  // ==========================================================================
  // Load Testing with Autocannon
  // ==========================================================================

  describe('Load Testing', () => {
    it('should handle sustained load', async () => {
      const port = server.address().port;
      const url = `http://localhost:${port}/api/fast`;

      const result = await runLoadTest(url, {
        connections: 10,
        duration: 5, // 5 seconds
        pipelining: 1
      });

      console.log('Load Test Results:');
      console.log(`  Requests: ${result.requests.total}`);
      console.log(`  Throughput: ${result.throughput.mean} bytes/sec`);
      console.log(`  Latency (mean): ${result.latency.mean} ms`);
      console.log(`  Latency (p95): ${result.latency.p95} ms`);
      console.log(`  Latency (p99): ${result.latency.p99} ms`);
      console.log(`  Errors: ${result.errors}`);

      expect(result.requests.total).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
      expect(result.latency.mean).toBeLessThan(100);
      expect(result.latency.p99).toBeLessThan(200);
    }, 30000); // 30 second timeout

    it('should measure pagination performance under load', async () => {
      const port = server.address().port;
      const url = `http://localhost:${port}/api/users?page=1&limit=10`;

      const result = await runLoadTest(url, {
        connections: 20,
        duration: 5
      });

      console.log('Pagination Load Test Results:');
      console.log(`  Requests: ${result.requests.total}`);
      console.log(`  Latency (p95): ${result.latency.p95} ms`);
      console.log(`  Latency (p99): ${result.latency.p99} ms`);

      expect(result.errors).toBe(0);
      expect(result.latency.p95).toBeLessThan(500);
    }, 30000);

    it('should handle high connection count', async () => {
      const port = server.address().port;
      const url = `http://localhost:${port}/api/fast`;

      const result = await runLoadTest(url, {
        connections: 50,
        duration: 5
      });

      console.log('High Connection Load Test:');
      console.log(`  Connections: 50`);
      console.log(`  Total Requests: ${result.requests.total}`);
      console.log(`  Requests/sec: ${result.requests.mean}`);
      console.log(`  Errors: ${result.errors}`);

      expect(result.errors).toBe(0);
      expect(result.requests.mean).toBeGreaterThan(100); // At least 100 req/s
    }, 30000);
  });

  // ==========================================================================
  // Resource Utilization Tests
  // ==========================================================================

  describe('Resource Utilization', () => {
    it('should not cause memory leaks with multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make many requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/users').expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);

      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50);
    });

    it('should measure memory usage of memory-intensive endpoint', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      await request(app).get('/api/memory-intensive').expect(200);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsed = (finalMemory - initialMemory) / 1024 / 1024; // MB

      console.log(`Memory-intensive endpoint used: ${memoryUsed.toFixed(2)} MB`);

      // Document memory usage
      expect(memoryUsed).toBeGreaterThan(0);
    });

    it('should track CPU-intensive operation performance', async () => {
      const { duration } = await measureResponseTime(() =>
        request(app).get('/api/cpu-intensive').expect(200)
      );

      console.log(`CPU-intensive operation took: ${duration}ms`);

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });

  // ==========================================================================
  // Performance Regression Detection
  // ==========================================================================

  describe('Performance Regression Detection', () => {
    // Baseline performance metrics (would typically be stored/loaded)
    const baselineMetrics = {
      fastEndpoint: { mean: 50, p95: 80, p99: 100 },
      userListEndpoint: { mean: 200, p95: 350, p99: 450 },
      searchEndpoint: { mean: 300, p95: 500, p99: 600 }
    };

    it('should detect regression in fast endpoint', async () => {
      const iterations = 50;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const { duration } = await measureResponseTime(() =>
          request(app).get('/api/fast').expect(200)
        );
        durations.push(duration);
      }

      const stats = calculateStats(durations);
      const baseline = baselineMetrics.fastEndpoint;

      // Allow 20% variance
      const threshold = 1.2;

      console.log('Fast Endpoint Regression Test:');
      console.log(`  Baseline mean: ${baseline.mean}ms`);
      console.log(`  Current mean: ${stats.mean}ms`);
      console.log(`  Baseline p95: ${baseline.p95}ms`);
      console.log(`  Current p95: ${stats.p95}ms`);

      expect(stats.mean).toBeLessThan(baseline.mean * threshold);
      expect(stats.p95).toBeLessThan(baseline.p95 * threshold);
      expect(stats.p99).toBeLessThan(baseline.p99 * threshold);
    });

    it('should compare pagination performance with baseline', async () => {
      const iterations = 30;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const { duration } = await measureResponseTime(() =>
          request(app)
            .get('/api/users')
            .query({ page: 1, limit: 10 })
            .expect(200)
        );
        durations.push(duration);
      }

      const stats = calculateStats(durations);
      const baseline = baselineMetrics.userListEndpoint;

      console.log('User List Endpoint Regression Test:');
      console.log(`  Baseline p95: ${baseline.p95}ms`);
      console.log(`  Current p95: ${stats.p95}ms`);

      // Performance should not degrade by more than 20%
      expect(stats.p95).toBeLessThan(baseline.p95 * 1.2);
    });
  });

  // ==========================================================================
  // Scalability Tests
  // ==========================================================================

  describe('Scalability', () => {
    it('should scale linearly with data size', async () => {
      const sizes = [10, 50, 100];
      const results = [];

      for (const size of sizes) {
        const { duration } = await measureResponseTime(() =>
          request(app)
            .get('/api/users')
            .query({ limit: size })
            .expect(200)
        );

        results.push({ size, duration });
        console.log(`Size: ${size}, Duration: ${duration}ms`);
      }

      // Response time should scale reasonably
      // 10x data should not take 10x time
      const ratio = results[2].duration / results[0].duration;
      expect(ratio).toBeLessThan(5); // Less than 5x slower
    });

    it('should handle increasing concurrent connections', async () => {
      const connectionCounts = [10, 25, 50];
      const results = [];

      for (const connections of connectionCounts) {
        const durations = [];

        await runConcurrentRequests(
          async () => {
            const { duration } = await measureResponseTime(() =>
              request(app).get('/api/fast').expect(200)
            );
            durations.push(duration);
          },
          connections
        );

        const stats = calculateStats(durations);
        results.push({ connections, p95: stats.p95 });

        console.log(`Connections: ${connections}, P95: ${stats.p95}ms`);
      }

      // P95 should not increase dramatically
      expect(results[2].p95).toBeLessThan(results[0].p95 * 3);
    });
  });

  // ==========================================================================
  // Percentile-based SLA Validation
  // ==========================================================================

  describe('SLA Validation', () => {
    const SLA = {
      p50: 100,  // 50% of requests should complete in < 100ms
      p95: 500,  // 95% of requests should complete in < 500ms
      p99: 1000, // 99% of requests should complete in < 1000ms
      errorRate: 0.01 // < 1% error rate
    };

    it('should meet SLA for all percentiles', async () => {
      const iterations = 100;
      const durations = [];
      let errors = 0;

      for (let i = 0; i < iterations; i++) {
        try {
          const { duration } = await measureResponseTime(() =>
            request(app).get('/api/users').expect(200)
          );
          durations.push(duration);
        } catch (error) {
          errors++;
        }
      }

      const stats = calculateStats(durations);
      const errorRate = errors / iterations;

      console.log('SLA Validation Results:');
      console.log(`  P50: ${stats.median}ms (SLA: ${SLA.p50}ms)`);
      console.log(`  P95: ${stats.p95}ms (SLA: ${SLA.p95}ms)`);
      console.log(`  P99: ${stats.p99}ms (SLA: ${SLA.p99}ms)`);
      console.log(`  Error Rate: ${(errorRate * 100).toFixed(2)}% (SLA: ${SLA.errorRate * 100}%)`);

      expect(stats.median).toBeLessThan(SLA.p50);
      expect(stats.p95).toBeLessThan(SLA.p95);
      expect(stats.p99).toBeLessThan(SLA.p99);
      expect(errorRate).toBeLessThan(SLA.errorRate);
    });
  });

  // ==========================================================================
  // Variability Tests
  // ==========================================================================

  describe('Response Time Variability', () => {
    it('should have consistent response times', async () => {
      const iterations = 50;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const { duration } = await measureResponseTime(() =>
          request(app).get('/api/fast').expect(200)
        );
        durations.push(duration);
      }

      const stats = calculateStats(durations);
      const mean = stats.mean;

      // Calculate standard deviation
      const variance = durations.reduce((acc, val) => {
        return acc + Math.pow(val - mean, 2);
      }, 0) / durations.length;

      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / mean) * 100;

      console.log('Response Time Variability:');
      console.log(`  Mean: ${mean.toFixed(2)}ms`);
      console.log(`  Std Dev: ${stdDev.toFixed(2)}ms`);
      console.log(`  Coefficient of Variation: ${coefficientOfVariation.toFixed(2)}%`);

      // Low variability indicates consistent performance
      expect(coefficientOfVariation).toBeLessThan(50); // < 50% variation
    });

    it('should document variable endpoint behavior', async () => {
      const iterations = 20;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const { duration, response } = await measureResponseTime(() =>
          request(app).get('/api/variable').expect(200)
        );
        durations.push(duration);
        console.log(`Request ${i + 1}: ${duration}ms (delay: ${response.body.delay}ms)`);
      }

      const stats = calculateStats(durations);

      console.log('Variable Endpoint Statistics:');
      console.log(`  Min: ${stats.min}ms`);
      console.log(`  Max: ${stats.max}ms`);
      console.log(`  Range: ${stats.max - stats.min}ms`);

      // Document that this endpoint has high variability
      expect(stats.max - stats.min).toBeGreaterThan(500);
    });
  });
});

/**
 * Performance Testing Best Practices
 *
 * 1. **Baseline Metrics**:
 *    - Establish performance baselines
 *    - Track metrics over time
 *    - Set realistic SLAs
 *    - Monitor for regressions
 *
 * 2. **Test Environment**:
 *    - Use production-like environment
 *    - Isolate from other processes
 *    - Consistent hardware/network
 *    - Warm up before measuring
 *
 * 3. **Metrics to Track**:
 *    - Response time (mean, median, p95, p99)
 *    - Throughput (requests per second)
 *    - Error rate
 *    - Resource utilization (CPU, memory)
 *    - Concurrent connections
 *
 * 4. **Load Testing**:
 *    - Gradual ramp-up
 *    - Sustained load
 *    - Spike testing
 *    - Stress testing
 *    - Endurance testing
 *
 * 5. **Tools**:
 *    - Jest for test framework
 *    - Supertest for HTTP assertions
 *    - Autocannon for load testing
 *    - Clinic.js for profiling
 *    - Apache JMeter for complex scenarios
 *    - k6 for modern load testing
 *
 * 6. **Reporting**:
 *    - Document all findings
 *    - Track trends over time
 *    - Share with team
 *    - Integrate with CI/CD
 *    - Set up alerts
 *
 * 7. **Optimization**:
 *    - Profile slow endpoints
 *    - Optimize database queries
 *    - Add caching where appropriate
 *    - Use connection pooling
 *    - Enable compression
 *    - Implement rate limiting
 */
