/**
 * Chaos Engineering for Microservices
 *
 * This file demonstrates chaos engineering practices to test system
 * resilience by introducing controlled failures: network issues,
 * service failures, resource exhaustion, and cascading failures.
 *
 * Best Practices:
 * - Start with low blast radius
 * - Run in non-production first
 * - Monitor continuously during experiments
 * - Document findings and improvements
 * - Automate chaos experiments in CI/CD
 *
 * WARNING: Only run chaos tests in dedicated test environments!
 *
 * @see https://principlesofchaos.org/
 */

const axios = require('axios');
const { spawn } = require('child_process');

/**
 * Chaos Engineering Toolkit
 */
class ChaosToolkit {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      safetyChecks: config.safetyChecks !== false,
      environment: config.environment || 'test',
      ...config,
    };

    // Safety check
    if (this.config.environment === 'production' && this.config.safetyChecks) {
      throw new Error(
        'SAFETY CHECK: Chaos experiments should not run in production without explicit confirmation'
      );
    }
  }

  /**
   * Introduce network latency to a service
   */
  async injectNetworkLatency(targetService, latencyMs, duration = 30000) {
    console.log(
      `[CHAOS] Injecting ${latencyMs}ms network latency to ${targetService} for ${duration}ms`
    );

    if (!this.config.enabled) {
      console.log('[CHAOS] Chaos experiments disabled - skipping');
      return;
    }

    const startTime = Date.now();
    const originalRequest = axios.request;

    // Monkey patch axios to add latency
    axios.request = async function (config) {
      if (config.baseURL && config.baseURL.includes(targetService)) {
        await new Promise(resolve => setTimeout(resolve, latencyMs));
      }
      return originalRequest.call(this, config);
    };

    // Restore after duration
    setTimeout(() => {
      axios.request = originalRequest;
      console.log(`[CHAOS] Network latency injection ended after ${Date.now() - startTime}ms`);
    }, duration);

    return {
      stop: () => {
        axios.request = originalRequest;
      },
    };
  }

  /**
   * Simulate service failure with specific error rate
   */
  async injectServiceFailure(targetService, errorRate = 0.5, duration = 30000) {
    console.log(
      `[CHAOS] Injecting ${errorRate * 100}% error rate to ${targetService} for ${duration}ms`
    );

    if (!this.config.enabled) {
      console.log('[CHAOS] Chaos experiments disabled - skipping');
      return;
    }

    const originalRequest = axios.request;
    let requestCount = 0;

    // Monkey patch to inject failures
    axios.request = async function (config) {
      if (config.baseURL && config.baseURL.includes(targetService)) {
        requestCount++;
        if (Math.random() < errorRate) {
          const error = new Error('Service temporarily unavailable (chaos test)');
          error.code = 'ECONNREFUSED';
          error.response = {
            status: 503,
            data: { error: 'Service Unavailable' },
          };
          throw error;
        }
      }
      return originalRequest.call(this, config);
    };

    // Restore after duration
    setTimeout(() => {
      axios.request = originalRequest;
      console.log(
        `[CHAOS] Service failure injection ended. Failed ${Math.floor(requestCount * errorRate)}/${requestCount} requests`
      );
    }, duration);

    return {
      stop: () => {
        axios.request = originalRequest;
      },
    };
  }

  /**
   * Simulate resource exhaustion (CPU, Memory)
   */
  async simulateResourceExhaustion(type = 'cpu', intensity = 80, duration = 10000) {
    console.log(`[CHAOS] Simulating ${type} exhaustion at ${intensity}% for ${duration}ms`);

    if (!this.config.enabled) {
      console.log('[CHAOS] Chaos experiments disabled - skipping');
      return;
    }

    let stopExhaustion = false;

    if (type === 'cpu') {
      // CPU exhaustion simulation
      const workers = Array.from({ length: 4 }, () => {
        return setInterval(() => {
          if (stopExhaustion) return;

          const start = Date.now();
          while (Date.now() - start < (intensity / 100) * 10) {
            // Busy loop to consume CPU
            Math.sqrt(Math.random());
          }
        }, 10);
      });

      setTimeout(() => {
        stopExhaustion = true;
        workers.forEach(interval => clearInterval(interval));
        console.log('[CHAOS] CPU exhaustion ended');
      }, duration);

      return {
        stop: () => {
          stopExhaustion = true;
          workers.forEach(interval => clearInterval(interval));
        },
      };
    } else if (type === 'memory') {
      // Memory exhaustion simulation
      const chunks = [];
      const chunkSize = 1024 * 1024; // 1MB chunks
      const targetMB = (intensity / 100) * 500; // Scale to intensity

      const interval = setInterval(() => {
        if (stopExhaustion || chunks.length * chunkSize > targetMB * 1024 * 1024) {
          return;
        }
        chunks.push(Buffer.alloc(chunkSize));
      }, 100);

      setTimeout(() => {
        stopExhaustion = true;
        clearInterval(interval);
        chunks.length = 0; // Release memory
        if (global.gc) global.gc(); // Force GC if available
        console.log('[CHAOS] Memory exhaustion ended');
      }, duration);

      return {
        stop: () => {
          stopExhaustion = true;
          clearInterval(interval);
          chunks.length = 0;
        },
      };
    }
  }

  /**
   * Simulate database connection failures
   */
  async injectDatabaseFailure(dbClient, errorRate = 0.3, duration = 30000) {
    console.log(`[CHAOS] Injecting ${errorRate * 100}% database failure rate for ${duration}ms`);

    if (!this.config.enabled) {
      console.log('[CHAOS] Chaos experiments disabled - skipping');
      return;
    }

    // Store original methods
    const originalQuery = dbClient.query;
    let queryCount = 0;

    // Inject failures
    dbClient.query = async function (...args) {
      queryCount++;
      if (Math.random() < errorRate) {
        throw new Error('Database connection lost (chaos test)');
      }
      return originalQuery.apply(this, args);
    };

    // Restore after duration
    setTimeout(() => {
      dbClient.query = originalQuery;
      console.log(
        `[CHAOS] Database failure injection ended. Failed ${Math.floor(queryCount * errorRate)}/${queryCount} queries`
      );
    }, duration);

    return {
      stop: () => {
        dbClient.query = originalQuery;
      },
    };
  }

  /**
   * Test circuit breaker by overwhelming a service
   */
  async testCircuitBreaker(serviceUrl, requestsPerSecond = 100, duration = 10000) {
    console.log(
      `[CHAOS] Testing circuit breaker with ${requestsPerSecond} req/sec for ${duration}ms`
    );

    if (!this.config.enabled) {
      console.log('[CHAOS] Chaos experiments disabled - skipping');
      return;
    }

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      circuitOpen: 0,
      errors: {},
    };

    const startTime = Date.now();
    const interval = 1000 / requestsPerSecond;

    const makeRequest = async () => {
      if (Date.now() - startTime > duration) {
        return;
      }

      results.total++;

      try {
        await axios.get(serviceUrl, { timeout: 1000 });
        results.successful++;
      } catch (error) {
        results.failed++;

        // Track error types
        const errorType = error.code || error.message || 'Unknown';
        results.errors[errorType] = (results.errors[errorType] || 0) + 1;

        if (error.message && error.message.includes('circuit')) {
          results.circuitOpen++;
        }
      }

      // Schedule next request
      setTimeout(makeRequest, interval);
    };

    // Start concurrent requests
    const concurrency = 10;
    for (let i = 0; i < concurrency; i++) {
      setTimeout(() => makeRequest(), i * (interval / concurrency));
    }

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, duration + 1000));

    console.log('[CHAOS] Circuit breaker test results:', results);

    return results;
  }

  /**
   * Simulate cascading failures across services
   */
  async simulateCascadingFailure(services, initialFailureRate = 0.8) {
    console.log(
      `[CHAOS] Simulating cascading failure starting with ${initialFailureRate * 100}% error rate`
    );

    if (!this.config.enabled) {
      console.log('[CHAOS] Chaos experiments disabled - skipping');
      return;
    }

    const chaos = [];

    // Fail first service heavily
    chaos.push(await this.injectServiceFailure(services[0], initialFailureRate, 20000));

    // Cascade failures with increasing delay
    for (let i = 1; i < services.length; i++) {
      setTimeout(async () => {
        const errorRate = initialFailureRate * (1 - i / services.length);
        console.log(`[CHAOS] Cascading to ${services[i]} with ${errorRate * 100}% error rate`);
        chaos.push(await this.injectServiceFailure(services[i], errorRate, 15000));
      }, i * 3000);
    }

    return {
      stop: () => {
        chaos.forEach(c => c && c.stop && c.stop());
      },
    };
  }

  /**
   * Kill random service instances (useful for Docker/Kubernetes)
   */
  async killRandomInstance(serviceName, probability = 0.3) {
    console.log(
      `[CHAOS] Attempting to kill ${serviceName} instances with ${probability * 100}% probability`
    );

    if (!this.config.enabled) {
      console.log('[CHAOS] Chaos experiments disabled - skipping');
      return;
    }

    if (Math.random() > probability) {
      console.log('[CHAOS] Instance kill skipped this time');
      return { killed: false };
    }

    try {
      // Example: Kill Docker container
      // In real scenarios, use docker API or kubectl
      const result = await new Promise((resolve, reject) => {
        const process = spawn('docker', ['kill', '--signal=SIGKILL', `${serviceName}`]);

        process.on('close', code => {
          if (code === 0) {
            resolve({ killed: true, service: serviceName });
          } else {
            resolve({ killed: false, error: `Exit code ${code}` });
          }
        });

        process.on('error', error => {
          resolve({ killed: false, error: error.message });
        });
      });

      console.log('[CHAOS] Kill instance result:', result);
      return result;
    } catch (error) {
      console.error('[CHAOS] Failed to kill instance:', error.message);
      return { killed: false, error: error.message };
    }
  }

  /**
   * Monitor system metrics during chaos experiments
   */
  async monitorDuringChaos(metricsEndpoint, duration = 30000, interval = 1000) {
    console.log('[CHAOS] Starting metrics monitoring');

    const metrics = {
      timestamps: [],
      values: [],
      stats: {},
    };

    const startTime = Date.now();

    const collectMetrics = async () => {
      if (Date.now() - startTime > duration) {
        // Calculate statistics
        const values = metrics.values.flat();
        metrics.stats = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
        };

        console.log('[CHAOS] Monitoring complete. Stats:', metrics.stats);
        return;
      }

      try {
        const response = await axios.get(metricsEndpoint, { timeout: 5000 });
        metrics.timestamps.push(Date.now() - startTime);
        metrics.values.push(response.data);
      } catch (error) {
        console.warn('[CHAOS] Failed to collect metrics:', error.message);
      }

      setTimeout(collectMetrics, interval);
    };

    collectMetrics();

    return metrics;
  }
}

/**
 * Chaos Experiment Runner
 */
class ChaosExperiment {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.toolkit = new ChaosToolkit(config);
    this.results = {
      name,
      startTime: null,
      endTime: null,
      success: false,
      observations: [],
      metrics: {},
    };
  }

  /**
   * Define steady state hypothesis
   */
  steadyStateHypothesis(check) {
    this.steadyStateCheck = check;
    return this;
  }

  /**
   * Run experiment
   */
  async run(chaosAction) {
    console.log(`\n[CHAOS EXPERIMENT] Starting: ${this.name}`);
    this.results.startTime = new Date();

    try {
      // 1. Verify steady state before chaos
      console.log('[CHAOS] Verifying steady state...');
      const steadyStateBefore = await this.steadyStateCheck();
      this.results.observations.push({
        phase: 'before',
        steady: steadyStateBefore,
        timestamp: new Date(),
      });

      if (!steadyStateBefore) {
        throw new Error('System not in steady state before chaos');
      }

      // 2. Introduce chaos
      console.log('[CHAOS] Introducing chaos...');
      const chaosControl = await chaosAction(this.toolkit);

      // 3. Observe system behavior
      console.log('[CHAOS] Observing system behavior...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 4. Verify steady state during chaos
      const steadyStateDuring = await this.steadyStateCheck();
      this.results.observations.push({
        phase: 'during',
        steady: steadyStateDuring,
        timestamp: new Date(),
      });

      // 5. Stop chaos
      console.log('[CHAOS] Stopping chaos...');
      if (chaosControl && chaosControl.stop) {
        chaosControl.stop();
      }

      // 6. Verify recovery to steady state
      console.log('[CHAOS] Verifying recovery...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const steadyStateAfter = await this.steadyStateCheck();
      this.results.observations.push({
        phase: 'after',
        steady: steadyStateAfter,
        timestamp: new Date(),
      });

      // 7. Evaluate results
      this.results.success = steadyStateDuring && steadyStateAfter;
      this.results.endTime = new Date();

      console.log(`[CHAOS EXPERIMENT] ${this.name}: ${this.results.success ? 'PASSED' : 'FAILED'}`);

      return this.results;
    } catch (error) {
      console.error(`[CHAOS EXPERIMENT] Failed: ${error.message}`);
      this.results.error = error.message;
      this.results.endTime = new Date();
      throw error;
    }
  }
}

/**
 * Example Chaos Experiments
 */

// Example 1: Network latency experiment
async function runNetworkLatencyExperiment() {
  const experiment = new ChaosExperiment('Network Latency Resilience', {
    environment: 'test',
  });

  experiment.steadyStateHypothesis(async () => {
    try {
      const response = await axios.get('http://localhost:3001/health', {
        timeout: 2000,
      });
      return response.status === 200 && response.data.responseTime < 1000;
    } catch (error) {
      return false;
    }
  });

  return experiment.run(async toolkit => {
    return toolkit.injectNetworkLatency('localhost:3001', 500, 10000);
  });
}

// Example 2: Service failure experiment
async function runServiceFailureExperiment() {
  const experiment = new ChaosExperiment('Service Failure Resilience', {
    environment: 'test',
  });

  experiment.steadyStateHypothesis(async () => {
    try {
      // Check if system can handle some failures
      const results = await Promise.allSettled([
        axios.get('http://localhost:3001/orders'),
        axios.get('http://localhost:3001/orders'),
        axios.get('http://localhost:3001/orders'),
      ]);

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      return successCount >= 2; // At least 2 out of 3 should succeed
    } catch (error) {
      return false;
    }
  });

  return experiment.run(async toolkit => {
    return toolkit.injectServiceFailure('localhost:3001', 0.5, 10000);
  });
}

// Example 3: Circuit breaker experiment
async function runCircuitBreakerExperiment() {
  const experiment = new ChaosExperiment('Circuit Breaker Test', {
    environment: 'test',
  });

  experiment.steadyStateHypothesis(async () => {
    // Circuit should be closed and requests succeeding
    try {
      await axios.get('http://localhost:3001/health');
      return true;
    } catch (error) {
      return false;
    }
  });

  return experiment.run(async toolkit => {
    return toolkit.testCircuitBreaker('http://localhost:3001/health', 50, 5000);
  });
}

// Export for use in tests
module.exports = {
  ChaosToolkit,
  ChaosExperiment,
  runNetworkLatencyExperiment,
  runServiceFailureExperiment,
  runCircuitBreakerExperiment,
};

/**
 * CHAOS ENGINEERING PRINCIPLES:
 *
 * 1. Build a Hypothesis around Steady State Behavior
 *    - Define what "normal" looks like
 *    - Measure key metrics
 *    - Set acceptable thresholds
 *
 * 2. Vary Real-World Events
 *    - Network delays and failures
 *    - Service crashes
 *    - Resource exhaustion
 *    - Traffic spikes
 *
 * 3. Run Experiments in Production (eventually)
 *    - Start in test/staging
 *    - Gradually increase blast radius
 *    - Run during business hours
 *    - Monitor continuously
 *
 * 4. Automate Experiments to Run Continuously
 *    - Integrate into CI/CD
 *    - Schedule regular runs
 *    - Alert on failures
 *    - Track improvements
 *
 * 5. Minimize Blast Radius
 *    - Start small
 *    - Limit scope
 *    - Have rollback plan
 *    - Monitor closely
 *
 * COMMON CHAOS EXPERIMENTS:
 *
 * - Network latency injection
 * - Service instance termination
 * - Resource exhaustion (CPU/Memory/Disk)
 * - Database connection failures
 * - Message queue delays
 * - DNS failures
 * - Clock skew
 * - Dependency failures
 * - Traffic spikes
 * - Data corruption
 *
 * SAFETY MEASURES:
 *
 * - Environment checks
 * - Blast radius limits
 * - Automatic rollback
 * - Continuous monitoring
 * - Clear abort procedures
 * - Stakeholder communication
 */
