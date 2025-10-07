# Observability

## Overview

Observability is the ability to understand the internal state of a system based on the data it produces. It encompasses logging, metrics, tracing, and monitoring to provide visibility into application behavior and performance.

## Purpose

- **Understand system behavior**: Know what's happening in production
- **Debug issues**: Quickly identify and resolve problems
- **Improve performance**: Identify bottlenecks
- **Ensure reliability**: Detect issues before users do
- **Inform decisions**: Data-driven system improvements

## Three Pillars of Observability

### 1. Metrics

Time-series numerical data about system behavior.

```javascript
// Prometheus metrics example
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Instrument HTTP requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });

  next();
});
```

### 2. Logs

Discrete events with context about what happened.

```javascript
// Structured logging with Winston
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('User login successful', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get('user-agent')
});

logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  database: 'postgres',
  host: process.env.DB_HOST
});
```

### 3. Distributed Tracing

Track requests as they flow through distributed systems.

```javascript
// OpenTelemetry tracing
const { trace } = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

// Setup
const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces'
});

provider.addSpanProcessor(new SpanProcessor(exporter));
provider.register();

// Create tracer
const tracer = trace.getTracer('user-service');

// Instrument operation
async function processOrder(orderId) {
  const span = tracer.startSpan('process_order');

  try {
    span.setAttribute('order.id', orderId);

    // Validate order
    const validateSpan = tracer.startSpan('validate_order', {
      parent: span
    });
    await validateOrder(orderId);
    validateSpan.end();

    // Process payment
    const paymentSpan = tracer.startSpan('process_payment', {
      parent: span
    });
    await processPayment(orderId);
    paymentSpan.end();

    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
}
```

## Monitoring Dashboards

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Application Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{method}} {{route}}"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
          "legendFormat": "5xx errors"
        }]
      },
      {
        "title": "Response Time (P99)",
        "targets": [{
          "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "p99 latency"
        }]
      }
    ]
  }
}
```

## Alerting

```yaml
# Prometheus alerting rules
groups:
  - name: application_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P99 latency is {{ $value }}s"
```

## Related Resources

- [DORA Metrics](dora-metrics.md)
- [Metrics & Monitoring](09-README.md)
- [Continuous Delivery](../08-cicd-pipeline/continuous-delivery.md)

## References

- Google SRE Book - Monitoring Distributed Systems
- OpenTelemetry Documentation
- Prometheus Best Practices

---

*Part of: [Metrics & Monitoring](README.md)*
