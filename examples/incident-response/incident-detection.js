/**
 * Automated Incident Detection Script
 *
 * This script monitors service health, SLI metrics, and detects anomalies
 * to automatically create incidents and alert on-call engineers.
 *
 * Features:
 * - Health endpoint monitoring
 * - SLI/SLO violation detection
 * - Anomaly detection
 * - Automatic incident creation
 * - Integration with PagerDuty/Opsgenie
 * - Slack notifications
 *
 * Usage:
 *   node incident-detection.js
 *
 * Environment Variables:
 *   PROMETHEUS_URL - Prometheus server URL
 *   PAGERDUTY_API_KEY - PagerDuty API key
 *   SLACK_WEBHOOK_URL - Slack webhook for notifications
 *   CHECK_INTERVAL - Check interval in seconds (default: 60)
 *
 * @author Code Quality Project
 */

const axios = require('axios');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Configuration
const config = {
  prometheus: {
    url: process.env.PROMETHEUS_URL || 'http://localhost:9090',
    timeout: 5000,
  },
  pagerduty: {
    apiKey: process.env.PAGERDUTY_API_KEY || '',
    routingKey: process.env.PAGERDUTY_ROUTING_KEY || '',
    enabled: !!process.env.PAGERDUTY_API_KEY,
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    enabled: !!process.env.SLACK_WEBHOOK_URL,
  },
  services: [
    {
      name: 'order-service',
      healthEndpoint: 'http://order-service:3000/health',
      slo: {
        availability: 0.999, // 99.9%
        latency: {
          p95: 500, // ms
          p99: 1000, // ms
        },
        errorRate: 0.01, // 1%
      },
    },
    {
      name: 'payment-service',
      healthEndpoint: 'http://payment-service:3000/health',
      slo: {
        availability: 0.9995, // 99.95%
        latency: {
          p95: 300,
          p99: 800,
        },
        errorRate: 0.005, // 0.5%
      },
    },
    {
      name: 'inventory-service',
      healthEndpoint: 'http://inventory-service:3000/health',
      slo: {
        availability: 0.995, // 99.5%
        latency: {
          p95: 400,
          p99: 900,
        },
        errorRate: 0.01,
      },
    },
  ],
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '60') * 1000,
  anomalyThreshold: 2.0, // Standard deviations from mean
};

/**
 * Incident tracker to prevent duplicate incidents
 */
class IncidentTracker {
  constructor() {
    this.activeIncidents = new Map();
    this.resolvedIncidents = new Map();
  }

  createIncident(key, incident) {
    if (this.activeIncidents.has(key)) {
      return null; // Already have an active incident
    }

    incident.id = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    incident.createdAt = new Date();
    this.activeIncidents.set(key, incident);
    return incident;
  }

  resolveIncident(key) {
    const incident = this.activeIncidents.get(key);
    if (incident) {
      incident.resolvedAt = new Date();
      incident.duration = incident.resolvedAt - incident.createdAt;
      this.activeIncidents.delete(key);
      this.resolvedIncidents.set(key, incident);
      return incident;
    }
    return null;
  }

  isActive(key) {
    return this.activeIncidents.has(key);
  }

  getActiveIncident(key) {
    return this.activeIncidents.get(key);
  }

  getActiveCount() {
    return this.activeIncidents.size;
  }
}

const incidentTracker = new IncidentTracker();

/**
 * Query Prometheus for metrics
 */
async function queryPrometheus(query) {
  try {
    const response = await axios.get(`${config.prometheus.url}/api/v1/query`, {
      params: { query },
      timeout: config.prometheus.timeout,
    });

    if (response.data.status === 'success') {
      return response.data.data.result;
    }

    throw new Error(`Prometheus query failed: ${response.data.error}`);
  } catch (error) {
    console.error('Prometheus query error:', error.message);
    return [];
  }
}

/**
 * Check service health endpoint
 */
async function checkHealthEndpoint(service) {
  try {
    const response = await axios.get(service.healthEndpoint, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status code
    });

    const healthy = response.status === 200 && response.data.status === 'healthy';

    return {
      service: service.name,
      healthy,
      status: response.status,
      responseTime: response.headers['x-response-time'] || 'unknown',
      data: response.data,
    };
  } catch (error) {
    return {
      service: service.name,
      healthy: false,
      error: error.message,
    };
  }
}

/**
 * Check SLO compliance for a service
 */
async function checkSLOCompliance(service) {
  const violations = [];

  // Check availability
  const availabilityQuery = `
    sum(rate(http_requests_total{service="${service.name}", status!~"5.."}[5m]))
    /
    sum(rate(http_requests_total{service="${service.name}"}[5m]))
  `;

  const availabilityResult = await queryPrometheus(availabilityQuery);
  if (availabilityResult.length > 0) {
    const availability = parseFloat(availabilityResult[0].value[1]);
    if (availability < service.slo.availability) {
      violations.push({
        type: 'availability',
        current: availability,
        target: service.slo.availability,
        severity: 'critical',
        message: `Availability ${(availability * 100).toFixed(2)}% is below SLO ${(service.slo.availability * 100).toFixed(2)}%`,
      });
    }
  }

  // Check p95 latency
  const latencyQuery = `
    histogram_quantile(0.95,
      sum(rate(http_request_duration_seconds_bucket{service="${service.name}"}[5m])) by (le)
    )
  `;

  const latencyResult = await queryPrometheus(latencyQuery);
  if (latencyResult.length > 0) {
    const latency = parseFloat(latencyResult[0].value[1]) * 1000; // Convert to ms
    if (latency > service.slo.latency.p95) {
      violations.push({
        type: 'latency_p95',
        current: latency,
        target: service.slo.latency.p95,
        severity: latency > service.slo.latency.p99 ? 'critical' : 'warning',
        message: `p95 latency ${latency.toFixed(0)}ms exceeds SLO ${service.slo.latency.p95}ms`,
      });
    }
  }

  // Check error rate
  const errorRateQuery = `
    sum(rate(http_requests_total{service="${service.name}", status=~"5.."}[5m]))
    /
    sum(rate(http_requests_total{service="${service.name}"}[5m]))
  `;

  const errorRateResult = await queryPrometheus(errorRateQuery);
  if (errorRateResult.length > 0) {
    const errorRate = parseFloat(errorRateResult[0].value[1]);
    if (errorRate > service.slo.errorRate) {
      violations.push({
        type: 'error_rate',
        current: errorRate,
        target: service.slo.errorRate,
        severity: errorRate > service.slo.errorRate * 2 ? 'critical' : 'warning',
        message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds SLO ${(service.slo.errorRate * 100).toFixed(2)}%`,
      });
    }
  }

  return violations;
}

/**
 * Detect anomalies using statistical analysis
 */
async function detectAnomalies(service) {
  const anomalies = [];

  // Check for sudden traffic spike
  const trafficQuery = `
    rate(http_requests_total{service="${service.name}"}[5m])
  `;

  const currentTraffic = await queryPrometheus(trafficQuery);
  const historicalTraffic = await queryPrometheus(`${trafficQuery} offset 1h`);

  if (currentTraffic.length > 0 && historicalTraffic.length > 0) {
    const current = parseFloat(currentTraffic[0].value[1]);
    const historical = parseFloat(historicalTraffic[0].value[1]);

    if (current > historical * config.anomalyThreshold) {
      anomalies.push({
        type: 'traffic_spike',
        current,
        historical,
        ratio: current / historical,
        message: `Traffic spike detected: ${current.toFixed(0)} req/s vs ${historical.toFixed(0)} req/s (${((current / historical - 1) * 100).toFixed(0)}% increase)`,
      });
    }
  }

  // Check for sudden error spike
  const errorQuery = `
    rate(http_requests_total{service="${service.name}", status=~"5.."}[5m])
  `;

  const currentErrors = await queryPrometheus(errorQuery);
  const historicalErrors = await queryPrometheus(`${errorQuery} offset 1h`);

  if (currentErrors.length > 0 && historicalErrors.length > 0) {
    const current = parseFloat(currentErrors[0].value[1]);
    const historical = parseFloat(historicalErrors[0].value[1]);

    if (historical > 0 && current > historical * config.anomalyThreshold) {
      anomalies.push({
        type: 'error_spike',
        current,
        historical,
        ratio: current / historical,
        message: `Error spike detected: ${current.toFixed(2)} errors/s vs ${historical.toFixed(2)} errors/s`,
      });
    }
  }

  return anomalies;
}

/**
 * Create incident in PagerDuty
 */
async function createPagerDutyIncident(incident) {
  if (!config.pagerduty.enabled) {
    console.log('PagerDuty not configured, skipping incident creation');
    return null;
  }

  try {
    const payload = {
      routing_key: config.pagerduty.routingKey,
      event_action: 'trigger',
      dedup_key: incident.id,
      payload: {
        summary: incident.title,
        severity: incident.severity,
        source: incident.service,
        timestamp: incident.createdAt.toISOString(),
        custom_details: {
          description: incident.description,
          violations: incident.violations,
          anomalies: incident.anomalies,
          runbook_url: `https://runbooks.company.com/${incident.service}`,
          dashboard_url: `https://grafana.company.com/d/${incident.service}`,
        },
      },
    };

    const response = await axios.post('https://events.pagerduty.com/v2/enqueue', payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token token=${config.pagerduty.apiKey}`,
      },
    });

    console.log(`PagerDuty incident created: ${response.data.dedup_key}`);
    return response.data;
  } catch (error) {
    console.error('Failed to create PagerDuty incident:', error.message);
    return null;
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(incident, action = 'created') {
  if (!config.slack.enabled) {
    console.log('Slack not configured, skipping notification');
    return null;
  }

  try {
    const color = incident.severity === 'critical' ? 'danger' : 'warning';
    const emoji = incident.severity === 'critical' ? ':fire:' : ':warning:';

    const payload = {
      username: 'Incident Detection Bot',
      icon_emoji: ':robot_face:',
      attachments: [
        {
          color,
          title: `${emoji} Incident ${action.toUpperCase()}: ${incident.title}`,
          text: incident.description,
          fields: [
            {
              title: 'Service',
              value: incident.service,
              short: true,
            },
            {
              title: 'Severity',
              value: incident.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Incident ID',
              value: incident.id,
              short: true,
            },
            {
              title: 'Created At',
              value: incident.createdAt.toISOString(),
              short: true,
            },
          ],
          actions: [
            {
              type: 'button',
              text: 'View Runbook',
              url: `https://runbooks.company.com/${incident.service}`,
            },
            {
              type: 'button',
              text: 'View Dashboard',
              url: `https://grafana.company.com/d/${incident.service}`,
            },
          ],
        },
      ],
    };

    if (incident.violations && incident.violations.length > 0) {
      payload.attachments[0].fields.push({
        title: 'SLO Violations',
        value: incident.violations.map(v => `• ${v.message}`).join('\n'),
        short: false,
      });
    }

    if (incident.anomalies && incident.anomalies.length > 0) {
      payload.attachments[0].fields.push({
        title: 'Anomalies Detected',
        value: incident.anomalies.map(a => `• ${a.message}`).join('\n'),
        short: false,
      });
    }

    await axios.post(config.slack.webhookUrl, payload);
    console.log('Slack notification sent');
    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error.message);
    return null;
  }
}

/**
 * Main monitoring loop
 */
async function monitorServices() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Incident Detection Check - ${new Date().toISOString()}`);
  console.log(`Active Incidents: ${incidentTracker.getActiveCount()}`);
  console.log(`${'='.repeat(60)}\n`);

  for (const service of config.services) {
    console.log(`Checking ${service.name}...`);

    // Check health endpoint
    const health = await checkHealthEndpoint(service);
    console.log(`  Health: ${health.healthy ? '✓ Healthy' : '✗ Unhealthy'}`);

    // Check SLO compliance
    const violations = await checkSLOCompliance(service);
    if (violations.length > 0) {
      console.log(`  SLO Violations: ${violations.length}`);
      violations.forEach(v => console.log(`    - ${v.message}`));
    } else {
      console.log(`  SLO Compliance: ✓ All metrics within SLO`);
    }

    // Check for anomalies
    const anomalies = await detectAnomalies(service);
    if (anomalies.length > 0) {
      console.log(`  Anomalies: ${anomalies.length}`);
      anomalies.forEach(a => console.log(`    - ${a.message}`));
    }

    // Determine if we should create an incident
    const incidentKey = `${service.name}`;

    if (!health.healthy || violations.length > 0) {
      // Create incident if not already active
      if (!incidentTracker.isActive(incidentKey)) {
        const severity =
          !health.healthy || violations.some(v => v.severity === 'critical')
            ? 'critical'
            : 'warning';

        const incident = incidentTracker.createIncident(incidentKey, {
          service: service.name,
          title: `${service.name} - ${!health.healthy ? 'Service Down' : 'SLO Violation'}`,
          description: !health.healthy
            ? `Health check failed: ${health.error || 'Service unreachable'}`
            : `SLO violations detected`,
          severity,
          violations,
          anomalies,
          health,
        });

        if (incident) {
          console.log(`\n  🚨 NEW INCIDENT CREATED: ${incident.id}`);
          await createPagerDutyIncident(incident);
          await sendSlackNotification(incident, 'created');
        }
      } else {
        console.log(
          `  ℹ️  Incident already active: ${incidentTracker.getActiveIncident(incidentKey).id}`
        );
      }
    } else {
      // Resolve incident if it exists
      if (incidentTracker.isActive(incidentKey)) {
        const incident = incidentTracker.resolveIncident(incidentKey);
        if (incident) {
          console.log(
            `\n  ✅ INCIDENT RESOLVED: ${incident.id} (Duration: ${Math.round(incident.duration / 1000)}s)`
          );
          await sendSlackNotification(incident, 'resolved');
        }
      }
    }

    console.log('');
  }
}

/**
 * Graceful shutdown
 */
let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\nShutting down incident detection...');
  console.log(`Final active incidents: ${incidentTracker.getActiveCount()}`);

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 * Main execution
 */
async function main() {
  console.log('Incident Detection System Starting...');
  console.log('Configuration:');
  console.log(`  Prometheus: ${config.prometheus.url}`);
  console.log(`  PagerDuty: ${config.pagerduty.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`  Slack: ${config.slack.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`  Check Interval: ${config.checkInterval / 1000}s`);
  console.log(`  Monitoring ${config.services.length} services\n`);

  // Run initial check
  await monitorServices();

  // Schedule periodic checks
  setInterval(async () => {
    if (!isShuttingDown) {
      try {
        await monitorServices();
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
    }
  }, config.checkInterval);

  console.log('Incident detection system is running. Press Ctrl+C to stop.\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  checkHealthEndpoint,
  checkSLOCompliance,
  detectAnomalies,
  createPagerDutyIncident,
  sendSlackNotification,
  IncidentTracker,
};
