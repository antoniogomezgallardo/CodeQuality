# Deployment Strategies

## Table of Contents
- [Overview](#overview)
- [Strategy Selection Guide](#strategy-selection-guide)
- [Blue-Green Deployment](#blue-green-deployment)
- [Canary Deployment](#canary-deployment)
- [Rolling Deployment](#rolling-deployment)
- [Feature Flag Deployment](#feature-flag-deployment)
- [Recreate Deployment](#recreate-deployment)
- [Shadow Deployment](#shadow-deployment)
- [A/B Testing Deployment](#ab-testing-deployment)
- [Deployment Verification](#deployment-verification)
- [Rollback Procedures](#rollback-procedures)
- [Cost Considerations](#cost-considerations)
- [Integration with CI/CD](#integration-with-cicd)
- [References](#references)

---

## Overview

Deployment strategies determine how new versions of applications are released to production environments. The choice of strategy impacts downtime, risk, resource requirements, and the ability to roll back changes.

### Key Principles (Google SRE)

1. **Gradual rollouts** minimize blast radius
2. **Automated verification** catches issues early
3. **Quick rollback capability** reduces MTTR
4. **Observability** enables confident deployments
5. **Rehearsal in staging** validates procedures

### Industry Standards Alignment

- **ITIL 4**: Change enablement and release management practices
- **DORA Metrics**: Deployment frequency and lead time optimization
- **Google SRE**: Progressive rollouts and canarying
- **AWS Well-Architected**: Reliability and operational excellence pillars
- **ISO/IEC 20000**: Service management deployment processes

### Deployment vs Release

**Deployment**: Installing new software version in environment
**Release**: Making functionality available to users

Modern strategies decouple these concepts using feature flags and traffic management.

---

## Strategy Selection Guide

### Decision Matrix

| Strategy | Downtime | Cost | Complexity | Rollback Speed | Best For |
|----------|----------|------|------------|----------------|----------|
| Blue-Green | None | High | Medium | Instant | Critical systems, databases |
| Canary | None | Medium | High | Fast | High-traffic applications |
| Rolling | None | Low | Low | Medium | Standard web applications |
| Feature Flags | None | Low | Medium | Instant | Continuous deployment |
| Recreate | Yes | Low | Low | Slow | Dev/test environments |
| Shadow | None | High | High | N/A | High-risk changes |
| A/B Testing | None | Medium | High | Fast | User experience optimization |

### Selection Criteria

**Choose Blue-Green when:**
- Zero downtime is critical
- Instant rollback is required
- Database migrations need validation
- Budget allows for duplicate infrastructure

**Choose Canary when:**
- Gradual risk mitigation needed
- Production traffic testing required
- Advanced monitoring in place
- Want to minimize blast radius

**Choose Rolling when:**
- Standard web application
- Cost-conscious deployment
- Can tolerate brief inconsistency
- Kubernetes or container orchestration available

**Choose Feature Flags when:**
- Multiple deploys per day
- Want to decouple deploy from release
- Need targeted user rollouts
- A/B testing or experimentation needed

**Choose Recreate when:**
- Development/test environments
- Downtime is acceptable
- Simplicity is priority
- Legacy applications

**Choose Shadow when:**
- Testing performance under load
- Validating new algorithms
- Risk of data corruption
- Comparing old vs new behavior

**Choose A/B Testing when:**
- Optimizing user experience
- Data-driven decisions needed
- Multiple variants to test
- Statistical significance required

---

## Blue-Green Deployment

### Overview

Blue-Green deployment maintains two identical production environments. At any time, one (Blue) serves production traffic while the other (Green) is idle or running the new version. After testing, traffic switches instantly to Green.

### Architecture

```
                    Load Balancer / Router
                            |
                    [Traffic Switch]
                    /              \
            Blue Environment    Green Environment
            (v1.0 - Active)    (v2.0 - Standby)
                |                    |
            Database (Shared or Replicated)
```

### Implementation: Kubernetes

```yaml
# blue-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
  namespace: production
  labels:
    app: myapp
    version: blue
    deployment-strategy: blue-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v1.0.0
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: VERSION
          value: "blue"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
---
# green-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
  namespace: production
  labels:
    app: myapp
    version: green
    deployment-strategy: blue-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v2.0.0
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: VERSION
          value: "green"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
---
# active-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
  namespace: production
  labels:
    app: myapp
spec:
  type: LoadBalancer
  selector:
    app: myapp
    version: blue  # Switch to 'green' to activate new version
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
    name: http
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
```

### Deployment Script

```bash
#!/bin/bash
# blue-green-deploy.sh

set -euo pipefail

# Configuration
NAMESPACE="production"
APP_NAME="myapp"
NEW_VERSION="v2.0.0"
CURRENT_COLOR=$(kubectl get service ${APP_NAME}-service -n ${NAMESPACE} \
  -o jsonpath='{.spec.selector.version}')
NEW_COLOR=$([ "$CURRENT_COLOR" = "blue" ] && echo "green" || echo "blue")

echo "Current active environment: $CURRENT_COLOR"
echo "Deploying to: $NEW_COLOR"

# Step 1: Deploy new version to inactive environment
echo "Deploying ${NEW_VERSION} to ${NEW_COLOR} environment..."
kubectl set image deployment/${APP_NAME}-${NEW_COLOR} \
  ${APP_NAME}=myregistry.io/${APP_NAME}:${NEW_VERSION} \
  -n ${NAMESPACE}

# Step 2: Wait for rollout to complete
echo "Waiting for ${NEW_COLOR} deployment to be ready..."
kubectl rollout status deployment/${APP_NAME}-${NEW_COLOR} -n ${NAMESPACE} \
  --timeout=5m

# Step 3: Run smoke tests on new environment
echo "Running smoke tests on ${NEW_COLOR} environment..."
GREEN_POD=$(kubectl get pods -n ${NAMESPACE} \
  -l app=${APP_NAME},version=${NEW_COLOR} \
  -o jsonpath='{.items[0].metadata.name}')

# Port-forward for testing
kubectl port-forward -n ${NAMESPACE} ${GREEN_POD} 9090:8080 &
PF_PID=$!
sleep 5

# Run smoke tests
SMOKE_TESTS_PASSED=false
if curl -f http://localhost:9090/health/ready && \
   curl -f http://localhost:9090/api/version | grep -q ${NEW_VERSION} && \
   curl -f http://localhost:9090/api/smoke-test; then
  echo "Smoke tests passed!"
  SMOKE_TESTS_PASSED=true
else
  echo "Smoke tests failed!"
fi

# Cleanup port-forward
kill $PF_PID

if [ "$SMOKE_TESTS_PASSED" = false ]; then
  echo "Deployment failed smoke tests. Aborting switch."
  exit 1
fi

# Step 4: Switch traffic to new environment
echo "Switching traffic from ${CURRENT_COLOR} to ${NEW_COLOR}..."
kubectl patch service ${APP_NAME}-service -n ${NAMESPACE} \
  -p "{\"spec\":{\"selector\":{\"version\":\"${NEW_COLOR}\"}}}"

# Step 5: Monitor new environment
echo "Monitoring ${NEW_COLOR} environment for 5 minutes..."
for i in {1..30}; do
  ERROR_RATE=$(kubectl exec -n ${NAMESPACE} ${GREEN_POD} -- \
    curl -s http://localhost:8080/metrics | \
    grep 'http_requests_total{status="5' | awk '{sum+=$2} END {print sum}' || echo "0")

  if [ "${ERROR_RATE:-0}" -gt 10 ]; then
    echo "High error rate detected! Rolling back..."
    kubectl patch service ${APP_NAME}-service -n ${NAMESPACE} \
      -p "{\"spec\":{\"selector\":{\"version\":\"${CURRENT_COLOR}\"}}}"
    echo "Rollback complete. Traffic restored to ${CURRENT_COLOR}."
    exit 1
  fi

  echo "Check $i/30: Error rate acceptable"
  sleep 10
done

echo "Deployment successful! ${NEW_COLOR} is now active."
echo "Previous ${CURRENT_COLOR} environment kept for quick rollback if needed."
```

### Database Migration Strategy

```yaml
# database-migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-v2
  namespace: production
spec:
  template:
    spec:
      restartPolicy: OnFailure
      initContainers:
      # Backup database before migration
      - name: backup
        image: postgres:15
        command:
        - /bin/sh
        - -c
        - |
          pg_dump $DATABASE_URL > /backup/pre-migration-$(date +%Y%m%d-%H%M%S).sql
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        volumeMounts:
        - name: backup
          mountPath: /backup
      containers:
      # Run forward-compatible migration
      - name: migrate
        image: myregistry.io/myapp:v2.0.0
        command: ["npm", "run", "migrate:up"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
      volumes:
      - name: backup
        persistentVolumeClaim:
          claimName: db-backup-pvc
```

### Rollback Procedure

```bash
#!/bin/bash
# blue-green-rollback.sh

set -euo pipefail

NAMESPACE="production"
APP_NAME="myapp"

CURRENT_COLOR=$(kubectl get service ${APP_NAME}-service -n ${NAMESPACE} \
  -o jsonpath='{.spec.selector.version}')
PREVIOUS_COLOR=$([ "$CURRENT_COLOR" = "blue" ] && echo "green" || echo "blue")

echo "Current active: ${CURRENT_COLOR}"
echo "Rolling back to: ${PREVIOUS_COLOR}"

# Instant traffic switch
kubectl patch service ${APP_NAME}-service -n ${NAMESPACE} \
  -p "{\"spec\":{\"selector\":{\"version\":\"${PREVIOUS_COLOR}\"}}}"

echo "Rollback complete in <1 second!"
echo "Monitor ${PREVIOUS_COLOR} environment health."
```

### AWS Implementation (ECS/ALB)

```yaml
# terraform/blue-green-alb.tf
resource "aws_lb_target_group" "blue" {
  name     = "${var.app_name}-blue"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Environment = "blue"
    Strategy    = "blue-green"
  }
}

resource "aws_lb_target_group" "green" {
  name     = "${var.app_name}-green"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Environment = "green"
    Strategy    = "blue-green"
  }
}

resource "aws_lb_listener_rule" "production" {
  listener_arn = var.alb_listener_arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = var.active_environment == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

# CodeDeploy application for blue-green
resource "aws_codedeploy_app" "app" {
  compute_platform = "ECS"
  name             = var.app_name
}

resource "aws_codedeploy_deployment_group" "app" {
  app_name               = aws_codedeploy_app.app.name
  deployment_group_name  = "${var.app_name}-deployment"
  service_role_arn       = var.codedeploy_role_arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
  }

  blue_green_deployment_config {
    terminate_blue_instances_on_deployment_success {
      action                           = "KEEP_ALIVE"
      termination_wait_time_in_minutes = 60
    }

    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    green_fleet_provisioning_option {
      action = "COPY_AUTO_SCALING_GROUP"
    }
  }

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }

  ecs_service {
    cluster_name = var.ecs_cluster_name
    service_name = var.ecs_service_name
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [var.alb_listener_arn]
      }

      target_group {
        name = aws_lb_target_group.blue.name
      }

      target_group {
        name = aws_lb_target_group.green.name
      }
    }
  }
}
```

### Monitoring and Verification

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: blue-green-deployment-alerts
  namespace: production
spec:
  groups:
  - name: deployment
    interval: 30s
    rules:
    - alert: HighErrorRateAfterSwitch
      expr: |
        sum(rate(http_requests_total{status=~"5..", app="myapp"}[5m]))
        /
        sum(rate(http_requests_total{app="myapp"}[5m])) > 0.05
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected after blue-green switch"
        description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.version }}"

    - alert: LatencyIncreaseAfterSwitch
      expr: |
        histogram_quantile(0.95,
          sum(rate(http_request_duration_seconds_bucket{app="myapp"}[5m])) by (le, version)
        ) > 2
      for: 3m
      labels:
        severity: warning
      annotations:
        summary: "P95 latency increased after deployment"
        description: "P95 latency is {{ $value }}s for {{ $labels.version }}"

    - alert: TrafficImbalance
      expr: |
        abs(
          sum(rate(http_requests_total{app="myapp", version="blue"}[5m])) -
          sum(rate(http_requests_total{app="myapp", version="green"}[5m]))
        ) > 100
      for: 1m
      labels:
        severity: info
      annotations:
        summary: "Traffic not balanced between blue and green"
        description: "Check if traffic switch is in progress"
```

### Advantages

- Instant rollback capability
- Full production testing before switch
- Zero downtime deployments
- Simple and predictable process
- Easy disaster recovery

### Disadvantages

- Double infrastructure cost during deployment
- Database migration complexity
- Requires duplicate resources
- Stateful application challenges
- Storage synchronization needed

### Best Practices

1. **Database Compatibility**: Use backward-compatible migrations
2. **Session Handling**: Use sticky sessions or external session store
3. **Health Checks**: Comprehensive readiness probes before switch
4. **Monitoring**: Watch metrics closely after switch
5. **Rollback Plan**: Document and practice rollback procedures
6. **Cost Management**: Consider infrastructure-as-code to spin up/down
7. **Testing**: Run full regression in green before switch
8. **Communication**: Notify teams before traffic switch

---

## Canary Deployment

### Overview

Canary deployment gradually rolls out changes to a small subset of users before making it available to everyone. Traffic is incrementally shifted while monitoring metrics to detect issues early.

### Architecture

```
                    Ingress Controller
                            |
                    [Progressive Traffic Split]
                    /          |          \
               v1.0 (90%)   v2.0 (10%)   Future versions
               [Baseline]    [Canary]
```

### Implementation: Kubernetes with Istio

```yaml
# canary-destination-rule.yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: myapp
  namespace: production
spec:
  host: myapp-service
  subsets:
  - name: stable
    labels:
      version: stable
  - name: canary
    labels:
      version: canary
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
---
# canary-virtual-service.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
  namespace: production
spec:
  hosts:
  - myapp-service
  - myapp.example.com
  http:
  - match:
    - headers:
        user-agent:
          regex: ".*Internal.*"
    route:
    - destination:
        host: myapp-service
        subset: canary
      weight: 100
  - route:
    - destination:
        host: myapp-service
        subset: stable
      weight: 90
    - destination:
        host: myapp-service
        subset: canary
      weight: 10
    retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: "5xx,reset,connect-failure,refused-stream"
    timeout: 10s
```

### Stable Deployment

```yaml
# stable-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-stable
  namespace: production
spec:
  replicas: 9
  selector:
    matchLabels:
      app: myapp
      version: stable
  template:
    metadata:
      labels:
        app: myapp
        version: stable
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v1.5.0
        ports:
        - containerPort: 8080
        env:
        - name: VERSION
          value: "stable"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          successThreshold: 1
          failureThreshold: 3
```

### Canary Deployment

```yaml
# canary-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-canary
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
      version: canary
  template:
    metadata:
      labels:
        app: myapp
        version: canary
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v2.0.0
        ports:
        - containerPort: 8080
        env:
        - name: VERSION
          value: "canary"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          successThreshold: 1
          failureThreshold: 3
```

### Progressive Delivery Script

```bash
#!/bin/bash
# canary-progressive-deploy.sh

set -euo pipefail

NAMESPACE="production"
APP_NAME="myapp"
NEW_VERSION="v2.0.0"
CANARY_STAGES=(0 5 10 25 50 75 100)
STAGE_DURATION=300  # 5 minutes per stage

# Deploy canary version
echo "Deploying canary version ${NEW_VERSION}..."
kubectl set image deployment/${APP_NAME}-canary \
  ${APP_NAME}=myregistry.io/${APP_NAME}:${NEW_VERSION} \
  -n ${NAMESPACE}

kubectl rollout status deployment/${APP_NAME}-canary -n ${NAMESPACE}

# Progressive traffic shifting
for WEIGHT in "${CANARY_STAGES[@]}"; do
  STABLE_WEIGHT=$((100 - WEIGHT))

  echo "Shifting traffic: stable=${STABLE_WEIGHT}%, canary=${WEIGHT}%"

  # Update VirtualService
  kubectl patch virtualservice ${APP_NAME} -n ${NAMESPACE} --type merge -p "{
    \"spec\": {
      \"http\": [{
        \"route\": [
          {\"destination\": {\"host\": \"${APP_NAME}-service\", \"subset\": \"stable\"}, \"weight\": ${STABLE_WEIGHT}},
          {\"destination\": {\"host\": \"${APP_NAME}-service\", \"subset\": \"canary\"}, \"weight\": ${WEIGHT}}
        ]
      }]
    }
  }"

  # Monitor metrics for this stage
  echo "Monitoring for ${STAGE_DURATION} seconds..."

  for i in $(seq 1 $((STAGE_DURATION / 30))); do
    # Check error rates
    STABLE_ERROR_RATE=$(kubectl exec -n ${NAMESPACE} \
      deployment/${APP_NAME}-stable -- \
      curl -s http://localhost:8080/metrics | \
      grep 'http_requests_total{status="5' | \
      awk '{sum+=$2} END {print sum+0}')

    CANARY_ERROR_RATE=$(kubectl exec -n ${NAMESPACE} \
      deployment/${APP_NAME}-canary -- \
      curl -s http://localhost:8080/metrics | \
      grep 'http_requests_total{status="5' | \
      awk '{sum+=$2} END {print sum+0}')

    # Compare error rates (canary should not be significantly worse)
    if [ "${CANARY_ERROR_RATE:-0}" -gt $((STABLE_ERROR_RATE * 2)) ]; then
      echo "ALERT: Canary error rate (${CANARY_ERROR_RATE}) is significantly higher than stable (${STABLE_ERROR_RATE})"
      echo "Rolling back deployment..."

      # Rollback: shift all traffic to stable
      kubectl patch virtualservice ${APP_NAME} -n ${NAMESPACE} --type merge -p "{
        \"spec\": {
          \"http\": [{
            \"route\": [
              {\"destination\": {\"host\": \"${APP_NAME}-service\", \"subset\": \"stable\"}, \"weight\": 100},
              {\"destination\": {\"host\": \"${APP_NAME}-service\", \"subset\": \"canary\"}, \"weight\": 0}
            ]
          }]
        }
      }"

      echo "Rollback complete. All traffic on stable version."
      exit 1
    fi

    echo "Stage ${WEIGHT}%: Check $i - Error rates acceptable (stable: ${STABLE_ERROR_RATE}, canary: ${CANARY_ERROR_RATE})"
    sleep 30
  done

  echo "Stage ${WEIGHT}% completed successfully"
done

# Promote canary to stable
echo "Canary deployment successful! Promoting to stable..."
kubectl set image deployment/${APP_NAME}-stable \
  ${APP_NAME}=myregistry.io/${APP_NAME}:${NEW_VERSION} \
  -n ${NAMESPACE}

kubectl rollout status deployment/${APP_NAME}-stable -n ${NAMESPACE}

# Reset traffic to 100% stable
kubectl patch virtualservice ${APP_NAME} -n ${NAMESPACE} --type merge -p "{
  \"spec\": {
    \"http\": [{
      \"route\": [
        {\"destination\": {\"host\": \"${APP_NAME}-service\", \"subset\": \"stable\"}, \"weight\": 100},
        {\"destination\": {\"host\": \"${APP_NAME}-service\", \"subset\": \"canary\"}, \"weight\": 0}
      ]
    }]
  }
}"

echo "Deployment complete! All traffic on new version."
```

### Automated Canary with Flagger

```yaml
# flagger-canary.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
  namespace: production
spec:
  provider: istio
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  progressDeadlineSeconds: 600
  service:
    port: 80
    targetPort: 8080
    gateways:
    - public-gateway
    hosts:
    - myapp.example.com
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
    - name: error-rate
      templateRef:
        name: error-rate
        namespace: istio-system
      thresholdRange:
        max: 1
      interval: 1m
    webhooks:
    - name: load-test
      url: http://flagger-loadtester.test/
      timeout: 5s
      metadata:
        type: cmd
        cmd: "hey -z 1m -q 10 -c 2 http://myapp-canary:80"
    - name: acceptance-test
      type: pre-rollout
      url: http://flagger-loadtester.test/
      timeout: 10s
      metadata:
        type: bash
        cmd: "curl -sd 'test' http://myapp-canary:80/api/smoke | grep OK"
    - name: notify-slack
      type: event
      url: http://event-webhook/
      metadata:
        eventType: "canary"
        channel: "deployments"
```

### Prometheus Metrics for Canary Analysis

```yaml
# prometheus-metrics.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: canary-metrics
  namespace: istio-system
data:
  error-rate: |
    sum(
      rate(
        istio_requests_total{
          reporter="destination",
          destination_workload_namespace="production",
          destination_workload=~"myapp.*",
          response_code=~"5.*"
        }[1m]
      )
    )
    /
    sum(
      rate(
        istio_requests_total{
          reporter="destination",
          destination_workload_namespace="production",
          destination_workload=~"myapp.*"
        }[1m]
      )
    )

  latency-p95: |
    histogram_quantile(0.95,
      sum(
        rate(
          istio_request_duration_milliseconds_bucket{
            reporter="destination",
            destination_workload_namespace="production",
            destination_workload=~"myapp.*"
          }[1m]
        )
      ) by (le, destination_workload)
    )
```

### Canary Analysis Dashboard

```json
{
  "dashboard": {
    "title": "Canary Deployment Analysis",
    "panels": [
      {
        "title": "Request Rate by Version",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{app='myapp'}[5m])) by (version)"
          }
        ]
      },
      {
        "title": "Error Rate Comparison",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{app='myapp',status=~'5..'}[5m])) by (version) / sum(rate(http_requests_total{app='myapp'}[5m])) by (version)"
          }
        ]
      },
      {
        "title": "P95 Latency by Version",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{app='myapp'}[5m])) by (le, version))"
          }
        ]
      },
      {
        "title": "Traffic Split Percentage",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{app='myapp'}[1m])) by (version) / sum(rate(http_requests_total{app='myapp'}[1m])) * 100"
          }
        ]
      }
    ]
  }
}
```

### Advantages

- Minimized blast radius
- Real production traffic testing
- Gradual risk reduction
- Data-driven decision making
- Early issue detection

### Disadvantages

- Complex infrastructure requirements
- Requires sophisticated monitoring
- Longer deployment time
- Difficult with stateful applications
- Version compatibility challenges

### Best Practices

1. **Metrics-Driven**: Base decisions on real data, not intuition
2. **Automated Analysis**: Use tools like Flagger for automation
3. **Clear Success Criteria**: Define thresholds before deployment
4. **Monitor Everything**: Errors, latency, business metrics
5. **User Segmentation**: Consider targeting specific user segments first
6. **Gradual Progression**: Start small (1-5%), increase slowly
7. **Automated Rollback**: Trigger rollback on threshold violations
8. **Communication**: Keep stakeholders informed of progress

---

## Rolling Deployment

### Overview

Rolling deployment updates instances gradually, replacing old versions with new ones incrementally. At any time, both versions may be running, but eventually all instances run the new version.

### Architecture

```
Time 0:  [v1] [v1] [v1] [v1] [v1]  <- All instances on v1
Time 1:  [v2] [v1] [v1] [v1] [v1]  <- Update 1st instance
Time 2:  [v2] [v2] [v1] [v1] [v1]  <- Update 2nd instance
Time 3:  [v2] [v2] [v2] [v1] [v1]  <- Update 3rd instance
Time 4:  [v2] [v2] [v2] [v2] [v1]  <- Update 4th instance
Time 5:  [v2] [v2] [v2] [v2] [v2]  <- All on v2
```

### Implementation: Kubernetes Deployment

```yaml
# rolling-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
    deployment-strategy: rolling
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2        # Maximum number of pods above desired count
      maxUnavailable: 1   # Maximum number of pods unavailable during update
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v2.0.0
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: VERSION
          value: "v2.0.0"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3
        lifecycle:
          preStop:
            exec:
              # Allow time for load balancer to deregister pod
              command: ["/bin/sh", "-c", "sleep 20"]
      terminationGracePeriodSeconds: 30
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
  namespace: production
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  sessionAffinity: None
```

### Deployment Script with Validation

```bash
#!/bin/bash
# rolling-deploy.sh

set -euo pipefail

NAMESPACE="production"
DEPLOYMENT="myapp"
NEW_VERSION="v2.0.0"
TIMEOUT="10m"

echo "Starting rolling deployment for ${DEPLOYMENT}..."

# Update image
kubectl set image deployment/${DEPLOYMENT} \
  ${DEPLOYMENT}=myregistry.io/${DEPLOYMENT}:${NEW_VERSION} \
  -n ${NAMESPACE} \
  --record

# Monitor rollout
echo "Monitoring rollout progress..."
kubectl rollout status deployment/${DEPLOYMENT} \
  -n ${NAMESPACE} \
  --timeout=${TIMEOUT} \
  --watch

# Verify deployment
DESIRED=$(kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} \
  -o jsonpath='{.spec.replicas}')
READY=$(kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} \
  -o jsonpath='{.status.readyReplicas}')
UPDATED=$(kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} \
  -o jsonpath='{.status.updatedReplicas}')

if [ "$DESIRED" -eq "$READY" ] && [ "$DESIRED" -eq "$UPDATED" ]; then
  echo "Deployment successful!"
  echo "Desired: ${DESIRED}, Ready: ${READY}, Updated: ${UPDATED}"
else
  echo "Deployment verification failed!"
  echo "Desired: ${DESIRED}, Ready: ${READY}, Updated: ${UPDATED}"
  exit 1
fi

# Run post-deployment smoke tests
echo "Running smoke tests..."
SERVICE_IP=$(kubectl get service ${DEPLOYMENT}-service -n ${NAMESPACE} \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

if curl -f http://${SERVICE_IP}/health && \
   curl -f http://${SERVICE_IP}/api/version | grep -q ${NEW_VERSION}; then
  echo "Smoke tests passed!"
else
  echo "Smoke tests failed! Consider rollback."
  exit 1
fi

echo "Rolling deployment completed successfully!"
```

### Rollback Procedure

```bash
#!/bin/bash
# rolling-rollback.sh

set -euo pipefail

NAMESPACE="production"
DEPLOYMENT="myapp"

# Show rollout history
echo "Rollout history:"
kubectl rollout history deployment/${DEPLOYMENT} -n ${NAMESPACE}

# Rollback to previous revision
echo "Rolling back to previous revision..."
kubectl rollout undo deployment/${DEPLOYMENT} -n ${NAMESPACE}

# Monitor rollback
kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE}

echo "Rollback complete!"

# Or rollback to specific revision
# kubectl rollout undo deployment/${DEPLOYMENT} -n ${NAMESPACE} --to-revision=3
```

### PodDisruptionBudget for Availability

```yaml
# pod-disruption-budget.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-pdb
  namespace: production
spec:
  minAvailable: 80%  # Keep at least 80% of pods available
  # Or use maxUnavailable: 2
  selector:
    matchLabels:
      app: myapp
```

### Advanced Rolling Strategy

```yaml
# progressive-rolling-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 20
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%       # Allow up to 5 extra pods (25% of 20)
      maxUnavailable: 10%  # Allow max 2 pods unavailable (10% of 20)
  minReadySeconds: 30    # Wait 30s after pod ready before continuing
  progressDeadlineSeconds: 600  # Fail if not progressing after 10min
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v2.0.0
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          successThreshold: 2  # Must succeed 2 times before ready
          failureThreshold: 3
```

### GitLab CI/CD Rolling Deployment

```yaml
# .gitlab-ci.yml
rolling-deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://myapp.example.com
    on_stop: rollback-deploy
  before_script:
    - kubectl config set-cluster k8s --server="$KUBE_URL" --insecure-skip-tls-verify=true
    - kubectl config set-credentials admin --token="$KUBE_TOKEN"
    - kubectl config set-context default --cluster=k8s --user=admin
    - kubectl config use-context default
  script:
    - |
      kubectl set image deployment/myapp \
        myapp=${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA} \
        -n production \
        --record
    - kubectl rollout status deployment/myapp -n production --timeout=10m
    - |
      # Verify all pods are ready
      DESIRED=$(kubectl get deploy myapp -n production -o jsonpath='{.spec.replicas}')
      READY=$(kubectl get deploy myapp -n production -o jsonpath='{.status.readyReplicas}')
      if [ "$DESIRED" != "$READY" ]; then
        echo "Deployment failed: $READY/$DESIRED pods ready"
        exit 1
      fi
  only:
    - main
  when: manual

rollback-deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    action: stop
  before_script:
    - kubectl config set-cluster k8s --server="$KUBE_URL" --insecure-skip-tls-verify=true
    - kubectl config set-credentials admin --token="$KUBE_TOKEN"
    - kubectl config set-context default --cluster=k8s --user=admin
    - kubectl config use-context default
  script:
    - kubectl rollout undo deployment/myapp -n production
    - kubectl rollout status deployment/myapp -n production --timeout=5m
  when: manual
```

### Advantages

- No additional infrastructure required
- Simple and straightforward
- Kubernetes native support
- Gradual transition
- Cost-effective

### Disadvantages

- Both versions run simultaneously
- Slower than blue-green rollback
- API compatibility required
- Session handling complexity
- No easy A/B comparison

### Best Practices

1. **Health Checks**: Robust readiness/liveness probes
2. **Graceful Shutdown**: Use preStop hooks and termination grace period
3. **Resource Limits**: Prevent resource contention during rollout
4. **PodDisruptionBudget**: Ensure minimum availability
5. **Monitoring**: Watch rollout progress and metrics
6. **Version Compatibility**: Ensure N and N-1 versions work together
7. **Session Affinity**: Use external session store
8. **Rollout Pause**: Use `kubectl rollout pause` if issues detected

---

## Feature Flag Deployment

### Overview

Feature flags (feature toggles) decouple deployment from release by allowing features to be turned on/off at runtime without redeploying code. This enables continuous deployment with controlled feature releases.

### Architecture

```
Application Code
    |
    +-- Feature Flag Service
            |
            +-- Configuration Store (LaunchDarkly, Unleash, ConfigCat)
            |
            +-- User Targeting Rules
            |
            +-- Gradual Rollout %
```

### Implementation: LaunchDarkly

```typescript
// feature-flags.ts
import * as LaunchDarkly from 'launchdarkly-node-server-sdk';

export class FeatureFlagService {
  private client: LaunchDarkly.LDClient;

  constructor() {
    this.client = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY!);
  }

  async waitForInitialization(): Promise<void> {
    await this.client.waitForInitialization();
  }

  async isFeatureEnabled(
    flagKey: string,
    user: LaunchDarkly.LDUser,
    defaultValue: boolean = false
  ): Promise<boolean> {
    try {
      return await this.client.variation(flagKey, user, defaultValue);
    } catch (error) {
      console.error(`Error checking feature flag ${flagKey}:`, error);
      return defaultValue;
    }
  }

  async getFeatureVariant(
    flagKey: string,
    user: LaunchDarkly.LDUser,
    defaultValue: string = 'control'
  ): Promise<string> {
    try {
      return await this.client.variation(flagKey, user, defaultValue);
    } catch (error) {
      console.error(`Error getting feature variant ${flagKey}:`, error);
      return defaultValue;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

// Usage in application
import express from 'express';
import { FeatureFlagService } from './feature-flags';

const app = express();
const featureFlags = new FeatureFlagService();

app.get('/api/checkout', async (req, res) => {
  const user = {
    key: req.user.id,
    email: req.user.email,
    custom: {
      accountType: req.user.accountType,
      region: req.user.region
    }
  };

  const useNewCheckout = await featureFlags.isFeatureEnabled(
    'new-checkout-flow',
    user,
    false
  );

  if (useNewCheckout) {
    return res.json(await newCheckoutService.process(req.body));
  } else {
    return res.json(await legacyCheckoutService.process(req.body));
  }
});
```

### Self-Hosted Feature Flags: Unleash

```yaml
# unleash-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unleash
  namespace: feature-flags
spec:
  replicas: 2
  selector:
    matchLabels:
      app: unleash
  template:
    metadata:
      labels:
        app: unleash
    spec:
      containers:
      - name: unleash
        image: unleashorg/unleash-server:latest
        ports:
        - containerPort: 4242
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: unleash-secrets
              key: database-url
        - name: DATABASE_SSL
          value: "false"
        - name: LOG_LEVEL
          value: "info"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: unleash-service
  namespace: feature-flags
spec:
  selector:
    app: unleash
  ports:
  - protocol: TCP
    port: 4242
    targetPort: 4242
  type: LoadBalancer
```

### Feature Flag Configuration

```javascript
// unleash-config.js
const { initialize, isEnabled, getVariant } = require('unleash-client');

const unleash = initialize({
  url: process.env.UNLEASH_URL || 'http://unleash-service:4242/api/',
  appName: 'myapp',
  instanceId: process.env.HOSTNAME,
  customHeaders: {
    Authorization: process.env.UNLEASH_API_TOKEN
  },
  strategies: {
    // Custom strategy for gradual rollout
    gradualRollout: (parameters, context) => {
      const userId = context.userId || '';
      const percentage = parameters.percentage || 0;

      // Hash user ID to get consistent assignment
      const hash = hashCode(userId);
      const normalizedHash = Math.abs(hash) % 100;

      return normalizedHash < percentage;
    },

    // User segment targeting
    userSegment: (parameters, context) => {
      const allowedSegments = parameters.segments || [];
      return allowedSegments.includes(context.properties.segment);
    }
  }
});

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

module.exports = { unleash, isEnabled, getVariant };
```

### Feature Flag Best Practices Implementation

```typescript
// feature-flag-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { FeatureFlagService } from './feature-flags';
import { logger } from './logger';
import { metrics } from './metrics';

export class FeatureFlagMiddleware {
  constructor(private flagService: FeatureFlagService) {}

  /**
   * Middleware to inject feature flags into request context
   */
  injectFlags() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = {
        key: req.user?.id || 'anonymous',
        email: req.user?.email,
        custom: {
          environment: process.env.NODE_ENV,
          region: req.headers['cloudfront-viewer-country'],
          userAgent: req.headers['user-agent']
        }
      };

      // Preload commonly used flags
      req.featureFlags = {
        newUI: await this.flagService.isFeatureEnabled('new-ui', user),
        betaFeatures: await this.flagService.isFeatureEnabled('beta-features', user),
        experimentalAPI: await this.flagService.isFeatureEnabled('experimental-api', user)
      };

      next();
    };
  }

  /**
   * Decorator for feature-gated routes
   */
  requireFeature(flagKey: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = {
        key: req.user?.id || 'anonymous',
        email: req.user?.email
      };

      const enabled = await this.flagService.isFeatureEnabled(flagKey, user, false);

      // Track feature flag usage
      metrics.increment('feature_flag.check', {
        flag: flagKey,
        enabled: enabled.toString(),
        user: user.key
      });

      if (!enabled) {
        logger.warn('Feature flag denied access', { flag: flagKey, user: user.key });
        return res.status(404).json({ error: 'Feature not available' });
      }

      next();
    };
  }
}

// Usage
import express from 'express';
const app = express();
const flagMiddleware = new FeatureFlagMiddleware(featureFlagService);

app.use(flagMiddleware.injectFlags());

app.get('/api/beta/new-feature',
  flagMiddleware.requireFeature('new-feature'),
  async (req, res) => {
    // This handler only runs if feature flag is enabled
    res.json({ feature: 'new-feature', status: 'active' });
  }
);
```

### Progressive Rollout Strategy

```typescript
// progressive-rollout.ts
export class ProgressiveRollout {
  private stages = [
    { percentage: 1, duration: 3600000 },    // 1% for 1 hour
    { percentage: 5, duration: 7200000 },    // 5% for 2 hours
    { percentage: 25, duration: 14400000 },  // 25% for 4 hours
    { percentage: 50, duration: 14400000 },  // 50% for 4 hours
    { percentage: 100, duration: 0 }         // 100% permanently
  ];

  async rolloutFeature(
    flagKey: string,
    monitoringCallback: (percentage: number) => Promise<boolean>
  ): Promise<void> {
    for (const stage of this.stages) {
      console.log(`Rolling out ${flagKey} to ${stage.percentage}%`);

      // Update feature flag percentage via API
      await this.updateFlagPercentage(flagKey, stage.percentage);

      // Monitor metrics during this stage
      const success = await monitoringCallback(stage.percentage);

      if (!success) {
        console.error(`Rollout failed at ${stage.percentage}%. Rolling back.`);
        await this.updateFlagPercentage(flagKey, 0);
        throw new Error(`Rollout failed at ${stage.percentage}%`);
      }

      // Wait for stage duration before proceeding
      if (stage.duration > 0) {
        await this.sleep(stage.duration);
      }
    }

    console.log(`Rollout of ${flagKey} complete at 100%`);
  }

  private async updateFlagPercentage(flagKey: string, percentage: number): Promise<void> {
    // Implementation depends on feature flag service
    // LaunchDarkly, Unleash, etc. have APIs for this
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Feature Flag Cleanup Strategy

```typescript
// flag-cleanup.ts
import { FeatureFlagService } from './feature-flags';

export interface FlagMetadata {
  key: string;
  createdAt: Date;
  createdBy: string;
  permanent: boolean;
  expiryDate?: Date;
}

export class FlagCleanupService {
  constructor(private flagService: FeatureFlagService) {}

  /**
   * Identify flags eligible for removal
   */
  async identifyStaleFlags(flags: FlagMetadata[]): Promise<FlagMetadata[]> {
    const now = new Date();
    const staleFlags: FlagMetadata[] = [];

    for (const flag of flags) {
      // Skip permanent flags
      if (flag.permanent) {
        continue;
      }

      // Flag expired
      if (flag.expiryDate && flag.expiryDate < now) {
        staleFlags.push(flag);
        continue;
      }

      // Flag older than 90 days with 100% rollout
      const age = now.getTime() - flag.createdAt.getTime();
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;

      if (age > ninetyDays) {
        const rolloutPercentage = await this.getFlagRolloutPercentage(flag.key);
        if (rolloutPercentage === 100) {
          staleFlags.push(flag);
        }
      }
    }

    return staleFlags;
  }

  /**
   * Generate code cleanup tasks
   */
  generateCleanupTasks(staleFlags: FlagMetadata[]): string[] {
    return staleFlags.map(flag => {
      return `
TODO: Remove feature flag '${flag.key}'
- Created: ${flag.createdAt.toISOString()}
- Creator: ${flag.createdBy}
- Search codebase for: isFeatureEnabled('${flag.key}')
- Remove flag check and keep enabled branch
- Delete flag from feature flag service
`;
    });
  }

  private async getFlagRolloutPercentage(flagKey: string): Promise<number> {
    // Implementation depends on feature flag service API
    return 100;
  }
}
```

### Feature Flag Testing

```typescript
// feature-flags.test.ts
import { FeatureFlagService } from './feature-flags';

describe('Feature Flags', () => {
  let flagService: FeatureFlagService;

  beforeEach(() => {
    // Use test mode or mock
    process.env.LAUNCHDARKLY_SDK_KEY = 'test-sdk-key';
    flagService = new FeatureFlagService();
  });

  describe('Gradual Rollout', () => {
    it('should enable feature for users in rollout percentage', async () => {
      const user = { key: 'user-123', email: 'test@example.com' };

      // Mock flag to return true for this user
      jest.spyOn(flagService, 'isFeatureEnabled')
        .mockResolvedValue(true);

      const enabled = await flagService.isFeatureEnabled('new-feature', user);
      expect(enabled).toBe(true);
    });

    it('should maintain consistent flag value for same user', async () => {
      const user = { key: 'user-123', email: 'test@example.com' };

      const result1 = await flagService.isFeatureEnabled('new-feature', user);
      const result2 = await flagService.isFeatureEnabled('new-feature', user);

      expect(result1).toBe(result2);
    });
  });

  describe('Targeting Rules', () => {
    it('should enable feature for beta users', async () => {
      const betaUser = {
        key: 'user-123',
        email: 'beta@example.com',
        custom: { segment: 'beta' }
      };

      jest.spyOn(flagService, 'isFeatureEnabled')
        .mockResolvedValue(true);

      const enabled = await flagService.isFeatureEnabled('beta-feature', betaUser);
      expect(enabled).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('should return default value on error', async () => {
      const user = { key: 'user-123' };

      jest.spyOn(flagService, 'isFeatureEnabled')
        .mockRejectedValue(new Error('Network error'));

      const enabled = await flagService.isFeatureEnabled('new-feature', user, false);
      expect(enabled).toBe(false);
    });
  });
});
```

### Advantages

- Deploy anytime, release when ready
- Instant rollback (toggle off)
- Gradual rollout capability
- A/B testing support
- User segmentation
- No redeployment needed

### Disadvantages

- Code complexity increases
- Technical debt from old flags
- Additional service dependency
- Performance overhead
- Testing complexity

### Best Practices

1. **Flag Lifecycle**: Set expiry dates, remove after full rollout
2. **Naming Convention**: Clear, descriptive flag names
3. **Documentation**: Document purpose and owner
4. **Default Values**: Safe defaults when flag service unavailable
5. **Monitoring**: Track flag evaluation metrics
6. **Testing**: Test both branches of flag conditions
7. **Cleanup**: Regular audits and removal of old flags
8. **Ownership**: Assign owner to each flag

---

## Recreate Deployment

### Overview

Recreate deployment terminates all existing instances before creating new ones. This results in downtime but simplifies the deployment process.

### Implementation: Kubernetes

```yaml
# recreate-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: staging
spec:
  replicas: 5
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v2.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Deployment with Downtime Notification

```bash
#!/bin/bash
# recreate-deploy.sh

set -euo pipefail

NAMESPACE="staging"
DEPLOYMENT="myapp"
NEW_VERSION="v2.0.0"

# Notify users of upcoming downtime
echo "Sending maintenance notification..."
curl -X POST https://api.statuspage.io/v1/incidents \
  -H "Authorization: Bearer ${STATUSPAGE_API_KEY}" \
  -d '{
    "incident": {
      "name": "Scheduled Maintenance",
      "status": "investigating",
      "impact": "major",
      "body": "System will be unavailable for approximately 5 minutes during deployment."
    }
  }'

# Update deployment
kubectl set image deployment/${DEPLOYMENT} \
  ${DEPLOYMENT}=myregistry.io/${DEPLOYMENT}:${NEW_VERSION} \
  -n ${NAMESPACE}

# Wait for completion
kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE} --timeout=10m

# Verify health
kubectl wait --for=condition=available --timeout=5m \
  deployment/${DEPLOYMENT} -n ${NAMESPACE}

# Update status page
curl -X PATCH https://api.statuspage.io/v1/incidents/${INCIDENT_ID} \
  -H "Authorization: Bearer ${STATUSPAGE_API_KEY}" \
  -d '{
    "incident": {
      "status": "resolved",
      "body": "Deployment complete. All systems operational."
    }
  }'

echo "Deployment complete!"
```

### Advantages

- Simple to understand
- No version compatibility issues
- Lower resource usage
- Clean state after deployment

### Disadvantages

- Downtime during deployment
- Not suitable for production
- User impact
- Lost in-flight requests

### Best Practices

1. **Schedule Maintenance**: Deploy during low-traffic periods
2. **User Notification**: Inform users in advance
3. **Status Page**: Update status page during deployment
4. **Health Checks**: Verify application health before routing traffic
5. **Backup**: Take backup before deployment
6. **Monitoring**: Watch for issues after deployment

### When to Use

- Development and test environments
- Internal tools with low SLAs
- Applications that can tolerate downtime
- Legacy applications without HA support
- Database migrations requiring exclusive access

---

## Shadow Deployment

### Overview

Shadow deployment runs new version alongside production, receiving copy of production traffic without affecting users. Responses from shadow version are logged but discarded.

### Architecture

```
Production Traffic
       |
   [Duplicator]
       |
       +-- Production v1.0 --> Real Responses (sent to users)
       |
       +-- Shadow v2.0 --> Test Responses (logged, discarded)
```

### Implementation: Istio Traffic Mirroring

```yaml
# shadow-deployment.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
  namespace: production
spec:
  hosts:
  - myapp-service
  http:
  - match:
    - uri:
        prefix: "/api"
    route:
    - destination:
        host: myapp-service
        subset: stable
      weight: 100
    mirror:
      host: myapp-service
      subset: shadow
    mirrorPercentage:
      value: 100.0  # Mirror 100% of traffic
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: myapp
  namespace: production
spec:
  host: myapp-service
  subsets:
  - name: stable
    labels:
      version: stable
  - name: shadow
    labels:
      version: shadow
---
# stable-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-stable
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: myapp
      version: stable
  template:
    metadata:
      labels:
        app: myapp
        version: stable
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v1.0.0
        ports:
        - containerPort: 8080
---
# shadow-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-shadow
  namespace: production
spec:
  replicas: 5  # Match production capacity
  selector:
    matchLabels:
      app: myapp
      version: shadow
  template:
    metadata:
      labels:
        app: myapp
        version: shadow
      annotations:
        sidecar.istio.io/logLevel: "debug"
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:v2.0.0
        ports:
        - containerPort: 8080
        env:
        - name: SHADOW_MODE
          value: "true"
        - name: LOG_LEVEL
          value: "debug"
```

### Shadow Traffic Analysis Service

```typescript
// shadow-analyzer.ts
import { Kafka } from 'kafkajs';
import { logger } from './logger';

interface RequestComparison {
  requestId: string;
  endpoint: string;
  timestamp: Date;
  stable: {
    statusCode: number;
    responseTime: number;
    response: any;
  };
  shadow: {
    statusCode: number;
    responseTime: number;
    response: any;
  };
  differences: string[];
}

export class ShadowTrafficAnalyzer {
  private kafka: Kafka;
  private differences: RequestComparison[] = [];

  constructor() {
    this.kafka = new Kafka({
      clientId: 'shadow-analyzer',
      brokers: process.env.KAFKA_BROKERS!.split(',')
    });
  }

  async start(): Promise<void> {
    const consumer = this.kafka.consumer({ groupId: 'shadow-analysis' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'shadow-traffic', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const comparison: RequestComparison = JSON.parse(message.value!.toString());
        await this.analyzeRequest(comparison);
      }
    });
  }

  private async analyzeRequest(comparison: RequestComparison): Promise<void> {
    const diffs: string[] = [];

    // Compare status codes
    if (comparison.stable.statusCode !== comparison.shadow.statusCode) {
      diffs.push(
        `Status code mismatch: stable=${comparison.stable.statusCode}, shadow=${comparison.shadow.statusCode}`
      );
    }

    // Compare response times
    const responseTimeDiff = Math.abs(
      comparison.stable.responseTime - comparison.shadow.responseTime
    );
    if (responseTimeDiff > 100) {  // More than 100ms difference
      diffs.push(
        `Response time diff: stable=${comparison.stable.responseTime}ms, shadow=${comparison.shadow.responseTime}ms`
      );
    }

    // Compare response content
    if (!this.deepEqual(comparison.stable.response, comparison.shadow.response)) {
      diffs.push('Response content mismatch');
    }

    if (diffs.length > 0) {
      comparison.differences = diffs;
      this.differences.push(comparison);

      logger.warn('Shadow traffic difference detected', {
        requestId: comparison.requestId,
        endpoint: comparison.endpoint,
        differences: diffs
      });
    }
  }

  async generateReport(): Promise<void> {
    const totalRequests = this.differences.length;
    const statusCodeMismatches = this.differences.filter(d =>
      d.differences.some(diff => diff.includes('Status code'))
    ).length;
    const responseMismatches = this.differences.filter(d =>
      d.differences.some(diff => diff.includes('Response content'))
    ).length;

    const report = {
      totalRequests,
      statusCodeMismatches,
      responseMismatches,
      errorRate: totalRequests > 0 ? (statusCodeMismatches / totalRequests) * 100 : 0,
      examples: this.differences.slice(0, 10)
    };

    logger.info('Shadow deployment report', report);

    // Send to monitoring system
    await this.sendToMonitoring(report);
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private async sendToMonitoring(report: any): Promise<void> {
    // Implementation for sending to Datadog, New Relic, etc.
  }
}
```

### Application Code for Shadow Mode

```typescript
// shadow-aware-controller.ts
import { Request, Response } from 'express';
import { logger } from './logger';
import { kafka } from './kafka';

export class ShadowAwareController {
  async handleRequest(req: Request, res: Response): Promise<void> {
    const isShadow = process.env.SHADOW_MODE === 'true';
    const requestId = req.headers['x-request-id'] as string;
    const startTime = Date.now();

    try {
      const result = await this.processRequest(req.body);
      const responseTime = Date.now() - startTime;

      if (isShadow) {
        // Shadow mode: log but don't respond
        await this.logShadowResponse({
          requestId,
          endpoint: req.path,
          statusCode: 200,
          responseTime,
          response: result
        });

        // Don't send response in shadow mode
        // Istio will discard it anyway
      } else {
        // Production mode: send real response
        res.json(result);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (isShadow) {
        await this.logShadowResponse({
          requestId,
          endpoint: req.path,
          statusCode: 500,
          responseTime,
          error: error.message
        });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  private async logShadowResponse(data: any): Promise<void> {
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
      topic: 'shadow-traffic',
      messages: [{
        key: data.requestId,
        value: JSON.stringify({
          ...data,
          version: 'shadow',
          timestamp: new Date()
        })
      }]
    });
    await producer.disconnect();
  }

  private async processRequest(data: any): Promise<any> {
    // Business logic
    return { success: true, data };
  }
}
```

### Monitoring Dashboard

```yaml
# grafana-dashboard.json
{
  "dashboard": {
    "title": "Shadow Deployment Comparison",
    "panels": [
      {
        "title": "Response Time Comparison",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{version=\"stable\"}[5m])) by (le))",
            "legendFormat": "Stable P95"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{version=\"shadow\"}[5m])) by (le))",
            "legendFormat": "Shadow P95"
          }
        ]
      },
      {
        "title": "Error Rate Comparison",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{version=\"stable\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{version=\"stable\"}[5m]))",
            "legendFormat": "Stable Error Rate"
          },
          {
            "expr": "sum(rate(http_requests_total{version=\"shadow\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{version=\"shadow\"}[5m]))",
            "legendFormat": "Shadow Error Rate"
          }
        ]
      },
      {
        "title": "Response Differences",
        "targets": [
          {
            "expr": "sum(rate(shadow_response_differences_total[5m]))",
            "legendFormat": "Differences per second"
          }
        ]
      }
    ]
  }
}
```

### Advantages

- Zero user impact
- Real production traffic testing
- Performance comparison
- Algorithm validation
- Risk-free testing

### Disadvantages

- High infrastructure cost (2x capacity)
- Complexity in traffic duplication
- Potential database side effects
- No guarantee shadow handles traffic identically
- Resource intensive

### Best Practices

1. **Read-Only Operations**: Shadow should not write to production DB
2. **Resource Isolation**: Separate databases/caches for shadow
3. **Cost Management**: Run shadow for limited time
4. **Comparison Logic**: Automated diff detection
5. **Metrics Collection**: Comprehensive logging
6. **Idempotency**: Ensure shadow operations are safe
7. **Traffic Sampling**: Mirror subset of traffic if too costly

### When to Use

- Testing new algorithms
- Performance regression testing
- Validating major refactors
- Comparing database query performance
- Load testing with real patterns

---

## A/B Testing Deployment

### Overview

A/B testing deployment runs multiple versions simultaneously, directing different user segments to different versions to measure impact on business metrics.

### Architecture

```
User Traffic
     |
[Routing Logic based on user segment]
     |
     +-- Variant A (50% of users) --> Measure metrics
     |
     +-- Variant B (50% of users) --> Measure metrics
     |
     +-- Control (baseline)
```

### Implementation: Kubernetes with Header-Based Routing

```yaml
# ab-test-virtual-service.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp-ab-test
  namespace: production
spec:
  hosts:
  - myapp.example.com
  http:
  - match:
    # Variant A: Users with cookie ab_test=variant_a
    - headers:
        cookie:
          regex: ".*ab_test=variant_a.*"
    route:
    - destination:
        host: myapp-service
        subset: variant-a
      headers:
        response:
          set:
            x-variant: "a"
  - match:
    # Variant B: Users with cookie ab_test=variant_b
    - headers:
        cookie:
          regex: ".*ab_test=variant_b.*"
    route:
    - destination:
        host: myapp-service
        subset: variant-b
      headers:
        response:
          set:
            x-variant: "b"
  - route:
    # Default: Control group
    - destination:
        host: myapp-service
        subset: control
      headers:
        response:
          set:
            x-variant: "control"
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: myapp-ab-test
  namespace: production
spec:
  host: myapp-service
  subsets:
  - name: control
    labels:
      version: control
  - name: variant-a
    labels:
      version: variant-a
  - name: variant-b
    labels:
      version: variant-b
```

### A/B Test Assignment Service

```typescript
// ab-test-service.ts
import { randomBytes } from 'crypto';

export interface ABTestConfig {
  name: string;
  variants: {
    id: string;
    weight: number;  // Percentage allocation
  }[];
  startDate: Date;
  endDate: Date;
  targetSegment?: string;
}

export class ABTestService {
  private tests: Map<string, ABTestConfig> = new Map();

  registerTest(config: ABTestConfig): void {
    // Validate weights sum to 100
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error('Variant weights must sum to 100');
    }

    this.tests.set(config.name, config);
  }

  assignVariant(
    testName: string,
    userId: string,
    userSegment?: string
  ): string | null {
    const test = this.tests.get(testName);

    if (!test) {
      return null;
    }

    // Check if test is active
    const now = new Date();
    if (now < test.startDate || now > test.endDate) {
      return null;
    }

    // Check if user is in target segment
    if (test.targetSegment && userSegment !== test.targetSegment) {
      return null;
    }

    // Consistent assignment using hash of user ID
    const hash = this.hashString(userId + testName);
    const bucket = hash % 100;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (bucket < cumulativeWeight) {
        return variant.id;
      }
    }

    return test.variants[0].id;  // Fallback
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  trackEvent(
    testName: string,
    variantId: string,
    userId: string,
    eventType: string,
    value?: number
  ): void {
    // Send to analytics
    console.log('AB Test Event:', {
      test: testName,
      variant: variantId,
      user: userId,
      event: eventType,
      value,
      timestamp: new Date()
    });
  }
}

// Usage
const abTest = new ABTestService();

abTest.registerTest({
  name: 'checkout-redesign',
  variants: [
    { id: 'control', weight: 50 },
    { id: 'variant-a', weight: 25 },
    { id: 'variant-b', weight: 25 }
  ],
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  targetSegment: 'premium-users'
});
```

### Express Middleware for A/B Testing

```typescript
// ab-test-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ABTestService } from './ab-test-service';

export class ABTestMiddleware {
  constructor(private abTestService: ABTestService) {}

  assignVariants() {
    return (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id || req.sessionID;
      const userSegment = req.user?.segment;

      // Check existing assignment from cookie
      let variant = req.cookies?.ab_test;

      if (!variant) {
        // Assign variant
        variant = this.abTestService.assignVariant(
          'checkout-redesign',
          userId,
          userSegment
        );

        if (variant) {
          // Set cookie for consistent experience
          res.cookie('ab_test', `variant_${variant}`, {
            maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
            httpOnly: true,
            secure: true,
            sameSite: 'lax'
          });
        }
      }

      req.abTestVariant = variant;
      next();
    };
  }

  trackConversion(testName: string, eventType: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id || req.sessionID;
      const variant = req.abTestVariant;

      if (variant) {
        this.abTestService.trackEvent(
          testName,
          variant,
          userId,
          eventType,
          req.body.value
        );
      }

      next();
    };
  }
}

// Usage in app
import express from 'express';
const app = express();
const abTestMiddleware = new ABTestMiddleware(abTestService);

app.use(abTestMiddleware.assignVariants());

app.get('/checkout', (req, res) => {
  const variant = req.abTestVariant;

  if (variant === 'variant-a') {
    return res.render('checkout-variant-a');
  } else if (variant === 'variant-b') {
    return res.render('checkout-variant-b');
  } else {
    return res.render('checkout-control');
  }
});

app.post('/checkout/complete',
  abTestMiddleware.trackConversion('checkout-redesign', 'purchase'),
  (req, res) => {
    // Handle checkout completion
    res.json({ success: true });
  }
);
```

### Statistical Analysis

```typescript
// ab-test-analysis.ts
export interface VariantMetrics {
  variant: string;
  users: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerUser: number;
}

export class ABTestAnalysis {
  /**
   * Calculate statistical significance using Z-test
   */
  calculateSignificance(
    controlMetrics: VariantMetrics,
    variantMetrics: VariantMetrics
  ): {
    pValue: number;
    isSignificant: boolean;
    confidenceLevel: number;
  } {
    const p1 = controlMetrics.conversionRate;
    const n1 = controlMetrics.users;
    const p2 = variantMetrics.conversionRate;
    const n2 = variantMetrics.users;

    // Pooled proportion
    const p = ((p1 * n1) + (p2 * n2)) / (n1 + n2);

    // Standard error
    const se = Math.sqrt(p * (1 - p) * ((1 / n1) + (1 / n2)));

    // Z-score
    const z = (p2 - p1) / se;

    // P-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    return {
      pValue,
      isSignificant: pValue < 0.05,
      confidenceLevel: (1 - pValue) * 100
    };
  }

  /**
   * Calculate required sample size
   */
  calculateSampleSize(
    baselineConversionRate: number,
    minimumDetectableEffect: number,  // e.g., 0.1 for 10% improvement
    power: number = 0.8,
    alpha: number = 0.05
  ): number {
    const p1 = baselineConversionRate;
    const p2 = p1 * (1 + minimumDetectableEffect);

    const zAlpha = this.invNormalCDF(1 - alpha / 2);
    const zBeta = this.invNormalCDF(power);

    const numerator = Math.pow(zAlpha + zBeta, 2) *
                      (p1 * (1 - p1) + p2 * (1 - p2));
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  private invNormalCDF(p: number): number {
    // Approximation of inverse normal CDF
    if (p <= 0 || p >= 1) {
      throw new Error('p must be between 0 and 1');
    }

    const a = [
      -3.969683028665376e+01,
      2.209460984245205e+02,
      -2.759285104469687e+02,
      1.383577518672690e+02,
      -3.066479806614716e+01,
      2.506628277459239e+00
    ];

    const b = [
      -5.447609879822406e+01,
      1.615858368580409e+02,
      -1.556989798598866e+02,
      6.680131188771972e+01,
      -1.328068155288572e+01
    ];

    const c = [
      -7.784894002430293e-03,
      -3.223964580411365e-01,
      -2.400758277161838e+00,
      -2.549732539343734e+00,
      4.374664141464968e+00,
      2.938163982698783e+00
    ];

    const d = [
      7.784695709041462e-03,
      3.224671290700398e-01,
      2.445134137142996e+00,
      3.754408661907416e+00
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q, r;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
             ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
             (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
              ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
  }
}
```

### A/B Test Reporting Dashboard

```typescript
// ab-test-report.ts
export class ABTestReporter {
  async generateReport(testName: string): Promise<any> {
    // Fetch metrics from database
    const metrics = await this.fetchMetrics(testName);

    const analysis = new ABTestAnalysis();
    const control = metrics.find(m => m.variant === 'control')!;

    const results = metrics
      .filter(m => m.variant !== 'control')
      .map(variant => {
        const significance = analysis.calculateSignificance(control, variant);
        const lift = ((variant.conversionRate - control.conversionRate) /
                     control.conversionRate) * 100;

        return {
          variant: variant.variant,
          users: variant.users,
          conversions: variant.conversions,
          conversionRate: variant.conversionRate,
          lift: lift.toFixed(2) + '%',
          pValue: significance.pValue.toFixed(4),
          isSignificant: significance.isSignificant,
          confidence: significance.confidenceLevel.toFixed(2) + '%',
          winner: significance.isSignificant && lift > 0
        };
      });

    return {
      testName,
      control,
      variants: results,
      winner: results.find(r => r.winner)?.variant || 'No clear winner',
      recommendation: this.generateRecommendation(results)
    };
  }

  private generateRecommendation(results: any[]): string {
    const winner = results.find(r => r.winner);

    if (winner) {
      return `Deploy ${winner.variant} to production. It shows ${winner.lift} improvement with ${winner.confidence} confidence.`;
    }

    const anySignificant = results.some(r => r.isSignificant);
    if (anySignificant) {
      return 'Results are significant but no clear winner. Consider extending test duration.';
    }

    return 'No statistically significant results. May need larger sample size or longer duration.';
  }

  private async fetchMetrics(testName: string): Promise<VariantMetrics[]> {
    // Implementation to fetch from database
    return [];
  }
}
```

### Advantages

- Data-driven decisions
- Measure real user behavior
- Incremental improvements
- Reduced risk
- Business metric optimization

### Disadvantages

- Complex infrastructure
- Statistical expertise needed
- Longer validation time
- Potential user experience fragmentation
- Multiple versions to maintain

### Best Practices

1. **Clear Hypothesis**: Define what you're testing and why
2. **Sample Size**: Calculate required users before starting
3. **Duration**: Run long enough for statistical significance
4. **Consistent Assignment**: Same user always sees same variant
5. **Avoid Peeking**: Don't stop test early based on preliminary results
6. **Segment Analysis**: Analyze results per user segment
7. **Multiple Metrics**: Track primary and secondary metrics
8. **Clean Variants**: Test one change at a time

---

## Deployment Verification

### Health Check Implementation

```yaml
# comprehensive-health-check.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: health-check-script
  namespace: production
data:
  health-check.sh: |
    #!/bin/bash
    set -e

    # Check application health
    curl -f http://localhost:8080/health/live || exit 1

    # Check database connectivity
    pg_isready -h $DB_HOST -p $DB_PORT || exit 1

    # Check redis connectivity
    redis-cli -h $REDIS_HOST ping || exit 1

    # Check disk space
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 90 ]; then
      echo "Disk usage critical: ${DISK_USAGE}%"
      exit 1
    fi

    # Check memory
    MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100}')
    if [ ${MEM_USAGE%.*} -gt 90 ]; then
      echo "Memory usage critical: ${MEM_USAGE}%"
      exit 1
    fi

    echo "All health checks passed"
    exit 0
```

### Smoke Test Suite

```typescript
// smoke-tests.ts
import axios from 'axios';

export class SmokeTests {
  constructor(private baseUrl: string) {}

  async runAll(): Promise<boolean> {
    try {
      await this.testHealthEndpoint();
      await this.testCriticalEndpoints();
      await this.testDatabaseConnectivity();
      await this.testExternalServices();

      console.log('All smoke tests passed');
      return true;
    } catch (error) {
      console.error('Smoke tests failed:', error);
      return false;
    }
  }

  private async testHealthEndpoint(): Promise<void> {
    const response = await axios.get(`${this.baseUrl}/health`);
    if (response.status !== 200) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
  }

  private async testCriticalEndpoints(): Promise<void> {
    const endpoints = [
      '/api/version',
      '/api/status',
      '/api/users/me'
    ];

    for (const endpoint of endpoints) {
      const response = await axios.get(`${this.baseUrl}${endpoint}`);
      if (response.status >= 500) {
        throw new Error(`Endpoint ${endpoint} failed with status ${response.status}`);
      }
    }
  }

  private async testDatabaseConnectivity(): Promise<void> {
    const response = await axios.get(`${this.baseUrl}/health/db`);
    if (response.data.status !== 'healthy') {
      throw new Error('Database connectivity check failed');
    }
  }

  private async testExternalServices(): Promise<void> {
    const response = await axios.get(`${this.baseUrl}/health/external`);
    const failedServices = response.data.services.filter(
      (s: any) => s.status !== 'healthy'
    );

    if (failedServices.length > 0) {
      throw new Error(`External services failed: ${failedServices.map((s: any) => s.name).join(', ')}`);
    }
  }
}
```

### Deployment Validation Checklist

```markdown
# Deployment Validation Checklist

## Pre-Deployment
- [ ] All tests passing in CI/CD pipeline
- [ ] Security scan completed with no critical issues
- [ ] Performance benchmarks meet SLAs
- [ ] Database migrations tested in staging
- [ ] Rollback procedure documented and tested
- [ ] Monitoring dashboards updated for new version
- [ ] Alert thresholds reviewed and updated
- [ ] Team notified of deployment window
- [ ] Customer communication sent (if needed)

## During Deployment
- [ ] Deployment started successfully
- [ ] Health checks passing
- [ ] No spike in error rates
- [ ] Response times within acceptable range
- [ ] Database migrations completed
- [ ] All pods/instances healthy
- [ ] Traffic routing correctly
- [ ] Smoke tests passed

## Post-Deployment
- [ ] All health checks green for 15 minutes
- [ ] Error rate < 0.1%
- [ ] P95 latency within SLA
- [ ] CPU and memory usage normal
- [ ] Database query performance acceptable
- [ ] External service integrations working
- [ ] User-reported issues < baseline
- [ ] Business metrics stable
- [ ] Logs reviewed for errors/warnings
- [ ] Monitoring alerts reviewed

## Rollback Criteria
- [ ] Error rate > 1%
- [ ] P95 latency > 2x baseline
- [ ] Critical functionality broken
- [ ] Database corruption detected
- [ ] Security vulnerability discovered
- [ ] Cascading failures observed
```

---

## Rollback Procedures

### Automated Rollback Based on Metrics

```yaml
# rollback-policy.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rollback-policy
  namespace: production
data:
  policy.json: |
    {
      "rollback_triggers": [
        {
          "name": "high_error_rate",
          "query": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))",
          "threshold": 0.05,
          "duration": "2m"
        },
        {
          "name": "high_latency",
          "query": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
          "threshold": 2,
          "duration": "3m"
        },
        {
          "name": "pod_crash_loop",
          "query": "sum(kube_pod_container_status_restarts_total) by (pod)",
          "threshold": 5,
          "duration": "1m"
        }
      ],
      "rollback_action": "automatic",
      "notification_channels": ["slack", "pagerduty"]
    }
```

### Rollback Automation Script

```bash
#!/bin/bash
# auto-rollback.sh

set -euo pipefail

NAMESPACE="production"
DEPLOYMENT="myapp"
PROMETHEUS_URL="http://prometheus:9090"

check_metric() {
  local query=$1
  local threshold=$2
  local duration=$3

  local result=$(curl -s "${PROMETHEUS_URL}/api/v1/query" \
    --data-urlencode "query=${query}[${duration}]" | \
    jq -r '.data.result[0].value[1]')

  if (( $(echo "$result > $threshold" | bc -l) )); then
    return 1
  fi
  return 0
}

monitor_deployment() {
  local start_time=$(date +%s)
  local monitoring_duration=600  # 10 minutes

  while [ $(($(date +%s) - start_time)) -lt $monitoring_duration ]; do
    # Check error rate
    if ! check_metric \
      "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))" \
      "0.05" \
      "2m"; then
      echo "ALERT: High error rate detected!"
      trigger_rollback "high_error_rate"
      return 1
    fi

    # Check latency
    if ! check_metric \
      "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))" \
      "2" \
      "3m"; then
      echo "ALERT: High latency detected!"
      trigger_rollback "high_latency"
      return 1
    fi

    # Check pod health
    unhealthy_pods=$(kubectl get pods -n ${NAMESPACE} \
      -l app=${DEPLOYMENT} \
      --field-selector=status.phase!=Running \
      --no-headers | wc -l)

    if [ $unhealthy_pods -gt 1 ]; then
      echo "ALERT: ${unhealthy_pods} unhealthy pods detected!"
      trigger_rollback "unhealthy_pods"
      return 1
    fi

    echo "Health check passed at $(date)"
    sleep 30
  done

  echo "Monitoring complete. Deployment is healthy."
  return 0
}

trigger_rollback() {
  local reason=$1

  echo "Initiating rollback due to: ${reason}"

  # Send notification
  curl -X POST ${SLACK_WEBHOOK} \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"🚨 Auto-rollback triggered for ${DEPLOYMENT}\",
      \"attachments\": [{
        \"color\": \"danger\",
        \"fields\": [
          {\"title\": \"Reason\", \"value\": \"${reason}\", \"short\": true},
          {\"title\": \"Namespace\", \"value\": \"${NAMESPACE}\", \"short\": true},
          {\"title\": \"Time\", \"value\": \"$(date -u)\", \"short\": false}
        ]
      }]
    }"

  # Execute rollback
  kubectl rollout undo deployment/${DEPLOYMENT} -n ${NAMESPACE}
  kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE}

  # Verify rollback
  sleep 60
  if monitor_health_for 300; then
    echo "Rollback successful. System is healthy."
    notify_rollback_success
  else
    echo "Rollback completed but issues persist. Manual intervention required."
    notify_rollback_issues
  fi
}

monitor_health_for() {
  local duration=$1
  local start=$(date +%s)

  while [ $(($(date +%s) - start)) -lt $duration ]; do
    error_rate=$(curl -s "${PROMETHEUS_URL}/api/v1/query" \
      --data-urlencode "query=sum(rate(http_requests_total{status=~\"5..\"}[1m])) / sum(rate(http_requests_total[1m]))" | \
      jq -r '.data.result[0].value[1]')

    if (( $(echo "$error_rate > 0.01" | bc -l) )); then
      return 1
    fi

    sleep 10
  done

  return 0
}

# Main execution
monitor_deployment
```

### Manual Rollback Runbook

```markdown
# Deployment Rollback Runbook

## When to Rollback

Immediate rollback if:
- Error rate > 5%
- P95 latency > 2x baseline
- Critical functionality broken
- Database corruption detected
- Security incident

Consider rollback if:
- Error rate > 1% for 5+ minutes
- User reports spike
- Business metrics degraded

## Kubernetes Rollback

### Quick Rollback (Previous Version)
```bash
kubectl rollout undo deployment/myapp -n production
kubectl rollout status deployment/myapp -n production
```

### Rollback to Specific Version
```bash
# View rollout history
kubectl rollout history deployment/myapp -n production

# Rollback to specific revision
kubectl rollout undo deployment/myapp -n production --to-revision=3

# Verify rollback
kubectl rollout status deployment/myapp -n production
```

### Blue-Green Rollback
```bash
# Switch traffic back to blue
kubectl patch service myapp-service -n production \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# Verify traffic switch
kubectl get service myapp-service -n production -o yaml | grep version
```

### Canary Rollback
```bash
# Reset traffic to 100% stable
kubectl patch virtualservice myapp -n production --type merge -p '{
  "spec": {
    "http": [{
      "route": [
        {"destination": {"host": "myapp-service", "subset": "stable"}, "weight": 100},
        {"destination": {"host": "myapp-service", "subset": "canary"}, "weight": 0}
      ]
    }]
  }
}'
```

## Database Rollback

### Rollback Migration
```bash
# Connect to migration container
kubectl exec -it deployment/myapp -n production -- bash

# Rollback last migration
npm run migrate:down

# Verify database state
npm run migrate:status
```

### Restore from Backup
```bash
# List available backups
aws s3 ls s3://myapp-db-backups/

# Restore from backup
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
  s3://myapp-db-backups/2025-01-08-12-00.dump
```

## Post-Rollback

1. Verify application health
2. Check error rates and latency
3. Review logs for issues
4. Update incident tracking
5. Schedule postmortem
6. Document lessons learned
```

---

## Cost Considerations

### Infrastructure Cost by Strategy

| Strategy | Infrastructure Cost | Duration Cost | Total Cost |
|----------|-------------------|---------------|------------|
| Blue-Green | 2x (during deploy) | Short (minutes) | Medium |
| Canary | 1.1-1.5x | Medium (hours) | Medium |
| Rolling | 1.0-1.1x | Short (minutes) | Low |
| Feature Flags | 1.0x + service cost | Continuous | Low-Medium |
| Recreate | 1.0x | Very short | Very Low |
| Shadow | 2x | Medium (hours-days) | High |
| A/B Testing | 2x (variants) | Long (weeks) | High |

### Cost Optimization Strategies

```yaml
# cost-optimized-deployment.yaml
# Use spot instances for non-critical deployments
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-canary
spec:
  replicas: 1
  template:
    spec:
      nodeSelector:
        node-type: spot
      tolerations:
      - key: "spot"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"
      containers:
      - name: myapp
        image: myregistry.io/myapp:canary
        resources:
          requests:
            memory: "128Mi"  # Smaller footprint for canary
            cpu: "100m"
```

### Cost Monitoring

```typescript
// cost-tracking.ts
export class DeploymentCostTracker {
  async calculateDeployCost(
    strategy: string,
    instanceCost: number,
    duration: number,
    instanceCount: number
  ): Promise<number> {
    switch (strategy) {
      case 'blue-green':
        // Double infrastructure for deployment duration
        return instanceCost * instanceCount * 2 * (duration / 3600);

      case 'canary':
        // 10% extra capacity for canary
        return instanceCost * instanceCount * 1.1 * (duration / 3600);

      case 'rolling':
        // maxSurge adds temporary capacity
        return instanceCost * instanceCount * 1.05 * (duration / 3600);

      case 'shadow':
        // Double infrastructure for shadow duration
        return instanceCost * instanceCount * 2 * (duration / 3600);

      default:
        return instanceCost * instanceCount * (duration / 3600);
    }
  }

  async optimizeStrategy(
    budget: number,
    requirements: {
      zeroDowntime: boolean;
      instantRollback: boolean;
      productionTesting: boolean;
    }
  ): Promise<string> {
    if (requirements.productionTesting) {
      return 'shadow';  // Highest cost but best testing
    }

    if (requirements.instantRollback) {
      return 'blue-green';  // Higher cost but instant rollback
    }

    if (requirements.zeroDowntime) {
      return budget > 1000 ? 'canary' : 'rolling';
    }

    return 'recreate';  // Lowest cost
  }
}
```

---

## Integration with CI/CD

### GitHub Actions Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run tests
        run: npm test

      - name: Run security scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v4
        with:
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy-canary:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy canary
        run: |
          kubectl set image deployment/myapp-canary \
            myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n production

      - name: Wait for canary ready
        run: |
          kubectl rollout status deployment/myapp-canary -n production --timeout=5m

  verify-canary:
    needs: deploy-canary
    runs-on: ubuntu-latest
    steps:
      - name: Run smoke tests
        run: |
          curl -f https://myapp.example.com/health || exit 1

      - name: Monitor metrics
        uses: actions/github-script@v6
        with:
          script: |
            const axios = require('axios');
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            for (let i = 0; i < 10; i++) {
              const response = await axios.get('http://prometheus:9090/api/v1/query', {
                params: {
                  query: 'sum(rate(http_requests_total{version="canary",status=~"5.."}[5m])) / sum(rate(http_requests_total{version="canary"}[5m]))'
                }
              });

              const errorRate = parseFloat(response.data.data.result[0].value[1]);

              if (errorRate > 0.05) {
                throw new Error(`Canary error rate too high: ${errorRate}`);
              }

              await sleep(30000);  // Wait 30s between checks
            }

  promote-to-production:
    needs: verify-canary
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.example.com
    steps:
      - name: Progressive rollout
        run: |
          # 10%
          kubectl patch virtualservice myapp -n production --type merge \
            -p '{"spec":{"http":[{"route":[{"destination":{"host":"myapp-service","subset":"stable"},"weight":90},{"destination":{"host":"myapp-service","subset":"canary"},"weight":10}]}]}}'
          sleep 300

          # 50%
          kubectl patch virtualservice myapp -n production --type merge \
            -p '{"spec":{"http":[{"route":[{"destination":{"host":"myapp-service","subset":"stable"},"weight":50},{"destination":{"host":"myapp-service","subset":"canary"},"weight":50}]}]}}'
          sleep 300

          # 100%
          kubectl set image deployment/myapp-stable \
            myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n production

          kubectl rollout status deployment/myapp-stable -n production

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment to production complete",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": ":rocket: Deployment successful\n*Version:* ${{ github.sha }}\n*Deployed by:* ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## References

### Industry Standards

1. **ITIL 4** - Change Enablement and Release Management
   - Service Design and Transition practices
   - Change control and authorization

2. **Google SRE Book** - Deployment Best Practices
   - Progressive rollouts and canarying
   - Automation and monitoring
   - https://sre.google/sre-book/table-of-contents/

3. **DORA Metrics**
   - Deployment Frequency
   - Lead Time for Changes
   - https://www.devops-research.com/research.html

4. **AWS Well-Architected Framework**
   - Reliability Pillar
   - Operational Excellence
   - https://aws.amazon.com/architecture/well-architected/

### Tools and Platforms

- **Kubernetes**: Container orchestration
- **Istio**: Service mesh for traffic management
- **Flagger**: Progressive delivery operator
- **ArgoCD**: GitOps continuous delivery
- **Spinnaker**: Multi-cloud deployment platform
- **LaunchDarkly**: Feature flag management
- **Unleash**: Open-source feature toggles

### Related Documentation

- [Version Control Workflows](../08-version-control/workflows.md)
- [CI/CD Pipelines](../09-continuous-integration/ci-cd.md)
- [Monitoring and Observability](../11-incident-management/11-README.md)
- [Testing Strategies](../04-testing/README.md)

---

*This documentation is maintained as part of the Code Quality Documentation Project and aligned with industry standards including ITIL, Google SRE practices, and DORA metrics.*

**Last Updated**: 2025-01-08
**Version**: 1.0
**Maintainer**: DevOps Team
