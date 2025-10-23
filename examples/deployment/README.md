# Deployment Strategies - Production-Ready Examples

This directory contains comprehensive, production-ready examples of modern deployment strategies. Each example includes complete configurations, health checks, rollback procedures, and automated validation.

## Overview

Deployment strategies determine how new versions of applications are released to production. The right strategy balances risk, downtime, resource requirements, and rollback speed.

## Deployment Strategy Comparison

| Strategy       | Downtime | Resource Usage      | Rollback Speed | Complexity | Risk Level | Best For                                           |
| -------------- | -------- | ------------------- | -------------- | ---------- | ---------- | -------------------------------------------------- |
| **Blue-Green** | Zero     | 2x (temporary)      | Instant        | Medium     | Low        | Critical applications requiring instant rollback   |
| **Canary**     | Zero     | 1x + small overhead | Fast           | High       | Very Low   | Gradual validation with real traffic               |
| **Rolling**    | Zero     | 1x                  | Medium         | Low        | Medium     | Standard applications with no special requirements |
| **Recreate**   | Yes      | 1x                  | Slow           | Very Low   | High       | Development/testing environments                   |

## Deployment Strategies Explained

### 1. Blue-Green Deployment

**Concept**: Maintain two identical production environments (Blue and Green). Deploy new version to inactive environment, then switch traffic instantly.

**How It Works**:

1. Blue environment runs current version (v1.0)
2. Deploy new version (v2.0) to Green environment
3. Test Green environment thoroughly
4. Switch load balancer/ingress to Green
5. Blue becomes standby for instant rollback

**Advantages**:

- Instant rollback by switching back to Blue
- Zero downtime deployment
- Complete testing before traffic switch
- Clear separation between versions

**Disadvantages**:

- Requires 2x infrastructure temporarily
- Database migrations can be complex
- Shared resources need careful management

**When to Use**:

- Mission-critical applications
- When instant rollback is essential
- Applications with complex startup procedures
- Compliance requires quick rollback capability

**Files**: `blue-green-deployment.yaml`, `docker-compose-blue-green.yml`

### 2. Canary Deployment

**Concept**: Gradually roll out new version to small subset of users, monitoring metrics before full deployment.

**How It Works**:

1. Deploy new version alongside current version
2. Route 1% of traffic to new version
3. Monitor metrics (errors, latency, business KPIs)
4. Gradually increase traffic: 1% → 5% → 25% → 50% → 100%
5. Automatically rollback if metrics degrade

**Advantages**:

- Lowest risk - early issue detection
- Real production validation with minimal impact
- Gradual confidence building
- A/B testing capability

**Disadvantages**:

- Requires sophisticated monitoring
- Complex traffic routing
- Longer deployment timeline
- Need service mesh or advanced load balancing

**When to Use**:

- High-traffic applications
- When risk minimization is critical
- Applications with unpredictable behavior
- When real production validation is needed

**Files**: `canary-deployment.yaml` (with Istio), `feature-flag-deployment.js`

### 3. Rolling Deployment

**Concept**: Gradually replace instances of old version with new version, maintaining service availability.

**How It Works**:

1. Deploy new version to subset of instances
2. Wait for health checks to pass
3. Continue to next subset
4. Repeat until all instances updated

**Advantages**:

- Zero downtime
- No extra infrastructure needed
- Simple to implement
- Gradual rollout reduces blast radius

**Disadvantages**:

- Two versions run simultaneously
- Rollback slower than Blue-Green
- Database migrations complex with mixed versions
- Not suitable for breaking changes

**When to Use**:

- Standard web applications
- Microservices architectures
- Applications with backward-compatible changes
- Default strategy for Kubernetes

**Files**: `rolling-deployment.yaml`

### 4. Feature Flag Deployment

**Concept**: Deploy code with new features disabled, then gradually enable via feature flags without redeployment.

**How It Works**:

1. Deploy code with features behind flags
2. Enable feature for internal users (1%)
3. Gradually increase percentage
4. Monitor metrics and user feedback
5. Full rollout or instant rollback via flag

**Advantages**:

- Decouple deployment from release
- Instant enable/disable (kill switch)
- User segmentation (beta users, regions)
- A/B testing built-in
- No redeployment for rollback

**Disadvantages**:

- Code complexity with flag checks
- Technical debt if flags not removed
- Requires feature flag service
- Testing all flag combinations difficult

**When to Use**:

- SaaS applications with frequent releases
- A/B testing requirements
- Gradual feature rollout needed
- High-risk feature launches
- When deploy and release should be separate

**Files**: `feature-flag-deployment.js`

## Files in This Directory

### Kubernetes Examples

1. **blue-green-deployment.yaml**
   - Complete Kubernetes manifests for Blue-Green deployment
   - Includes: Deployments, Services, Ingress, Health checks
   - Automated switching script
   - Rollback procedures

2. **canary-deployment.yaml**
   - Kubernetes canary deployment with Istio service mesh
   - Progressive traffic splitting configuration
   - Metrics-based validation
   - Automated promotion/rollback

3. **rolling-deployment.yaml**
   - Standard Kubernetes rolling update
   - MaxSurge/MaxUnavailable configuration
   - PodDisruptionBudget for availability
   - Health probes and rollback history

### Docker Compose Example

4. **docker-compose-blue-green.yml**
   - Docker Compose Blue-Green setup
   - Nginx load balancer with health checks
   - Service switching script
   - Suitable for smaller deployments

### Infrastructure as Code

5. **terraform-infra.tf**
   - AWS ECS/Fargate deployment infrastructure
   - Blue-Green deployment with AWS CodeDeploy
   - Auto-scaling and load balancer setup
   - Complete production infrastructure

### Application Code

6. **feature-flag-deployment.js**
   - Feature flag implementation examples
   - LaunchDarkly and Unleash integration
   - Gradual rollout logic
   - User segmentation and A/B testing

### Automation Scripts

7. **deployment-script.sh**
   - Automated deployment orchestration
   - Pre-deployment validation
   - Health checks and smoke tests
   - Automated rollback on failure

8. **smoke-tests.sh**
   - Post-deployment validation suite
   - Health endpoint checks
   - Critical path verification
   - Performance baseline validation

9. **package.json**
   - Node.js dependencies for examples
   - npm scripts for running examples
   - Development and testing tools

## Prerequisites

### For Kubernetes Examples

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install Istio (for canary example)
curl -L https://istio.io/downloadIstio | sh -
istioctl install --set profile=demo

# Verify cluster access
kubectl cluster-info
```

### For Docker Compose Examples

```bash
# Install Docker and Docker Compose
# https://docs.docker.com/get-docker/

# Verify installation
docker --version
docker-compose --version
```

### For Terraform Examples

```bash
# Install Terraform
# https://developer.hashicorp.com/terraform/downloads

# Configure AWS credentials
aws configure

# Initialize Terraform
cd examples/deployment
terraform init
```

### For Feature Flag Examples

```bash
# Install Node.js dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your feature flag service credentials
```

## Quick Start Guide

### 1. Blue-Green Deployment (Kubernetes)

```bash
# Apply blue environment (initial deployment)
kubectl apply -f blue-green-deployment.yaml

# Wait for blue deployment to be ready
kubectl rollout status deployment/myapp-blue

# Deploy green environment (new version)
# Edit blue-green-deployment.yaml to update green image version
kubectl apply -f blue-green-deployment.yaml

# Wait for green deployment to be ready
kubectl rollout status deployment/myapp-green

# Test green environment
kubectl port-forward svc/myapp-green-test 8080:80
curl http://localhost:8080/health

# Switch traffic to green
kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'

# Verify traffic switched
curl http://your-app-url.com

# Rollback if needed (switch back to blue)
kubectl patch service myapp -p '{"spec":{"selector":{"version":"blue"}}}'
```

### 2. Canary Deployment (Kubernetes + Istio)

```bash
# Apply base deployment
kubectl apply -f canary-deployment.yaml

# Deploy canary version
# Edit canary-deployment.yaml to update canary image version
kubectl apply -f canary-deployment.yaml

# Monitor canary metrics
kubectl logs -f deployment/myapp-canary

# Gradually increase traffic (edit VirtualService)
# 1% -> 5% -> 25% -> 50% -> 100%
kubectl apply -f canary-deployment.yaml

# Promote canary to stable
kubectl apply -f canary-deployment.yaml
# (Set stable deployment to canary version, remove canary)

# Rollback if needed
kubectl delete deployment myapp-canary
# Traffic automatically routes to stable version
```

### 3. Rolling Deployment (Kubernetes)

```bash
# Apply initial deployment
kubectl apply -f rolling-deployment.yaml

# Update to new version
# Edit rolling-deployment.yaml to change image version
kubectl apply -f rolling-deployment.yaml

# Watch rolling update progress
kubectl rollout status deployment/myapp

# Check rollout history
kubectl rollout history deployment/myapp

# Rollback to previous version
kubectl rollout undo deployment/myapp

# Rollback to specific revision
kubectl rollout undo deployment/myapp --to-revision=2
```

### 4. Docker Compose Blue-Green

```bash
# Start blue environment
docker-compose -f docker-compose-blue-green.yml up -d blue-app nginx

# Verify blue is running
curl http://localhost/health

# Start green environment with new version
docker-compose -f docker-compose-blue-green.yml up -d green-app

# Test green environment
curl http://localhost:8081/health

# Switch traffic to green
docker-compose -f docker-compose-blue-green.yml exec nginx /switch-to-green.sh

# Rollback if needed
docker-compose -f docker-compose-blue-green.yml exec nginx /switch-to-blue.sh

# Cleanup old environment
docker-compose -f docker-compose-blue-green.yml stop blue-app
```

### 5. Feature Flag Deployment

```bash
# Install dependencies
npm install

# Set up feature flag service credentials
export LAUNCHDARKLY_SDK_KEY="your-sdk-key"

# Deploy application with feature disabled
npm run deploy

# Enable feature for 1% of users
node feature-flag-deployment.js enable my-feature --percentage 1

# Monitor metrics
npm run monitor

# Gradually increase
node feature-flag-deployment.js enable my-feature --percentage 5
node feature-flag-deployment.js enable my-feature --percentage 25
node feature-flag-deployment.js enable my-feature --percentage 100

# Instant rollback if needed
node feature-flag-deployment.js disable my-feature
```

### 6. Automated Deployment with Scripts

```bash
# Make scripts executable
chmod +x deployment-script.sh smoke-tests.sh

# Run automated deployment
./deployment-script.sh \
  --strategy blue-green \
  --version v2.0.0 \
  --environment production \
  --auto-rollback

# Script will:
# 1. Run pre-deployment checks
# 2. Deploy new version
# 3. Run smoke tests
# 4. Automatically rollback if tests fail
```

## Best Practices

### 1. Health Checks and Readiness Probes

Always implement comprehensive health checks:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

**Liveness**: Is the application alive? (Restart if fails)
**Readiness**: Can the application accept traffic? (Remove from load balancer if fails)

### 2. Database Migrations

Handle database changes carefully in zero-downtime deployments:

**Strategy 1 - Backward Compatible Migrations**:

1. Deploy code that works with old and new schema
2. Run migration
3. Deploy code that only uses new schema

**Strategy 2 - Expand-Contract Pattern**:

1. Expand: Add new columns/tables (keep old ones)
2. Deploy new code using both old and new
3. Migrate data
4. Contract: Remove old columns/tables in next release

**Example**:

```sql
-- Phase 1: Expand (safe with old code)
ALTER TABLE users ADD COLUMN email_new VARCHAR(255);

-- Phase 2: Dual write in application (works with both columns)
UPDATE users SET email_new = email WHERE email_new IS NULL;

-- Phase 3: Contract (after all instances updated)
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users RENAME COLUMN email_new TO email;
```

### 3. Monitoring and Observability

Monitor these key metrics during deployment:

**Golden Signals**:

- **Latency**: Response time percentiles (p50, p95, p99)
- **Traffic**: Requests per second
- **Errors**: Error rate and types
- **Saturation**: CPU, memory, disk, network usage

**Business Metrics**:

- Conversion rates
- User signups
- Transaction success rate
- Revenue per minute

**Deployment Metrics**:

- Deployment frequency (DORA)
- Lead time for changes (DORA)
- Time to restore service (DORA)
- Change failure rate (DORA)

### 4. Automated Rollback Criteria

Define clear criteria for automatic rollback:

```javascript
const rollbackCriteria = {
  errorRate: {
    threshold: 1.0, // 1% error rate
    duration: 300, // for 5 minutes
  },
  latencyP95: {
    threshold: 2000, // 2 seconds
    duration: 300,
  },
  availability: {
    threshold: 99.9, // Below 99.9%
    duration: 60,
  },
  customMetric: {
    name: 'checkout_success_rate',
    threshold: 95.0, // Below 95%
    duration: 180,
  },
};
```

### 5. Pre-Deployment Checklist

Before any production deployment:

- [ ] Code reviewed and approved
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed (no high/critical vulnerabilities)
- [ ] Database migrations tested
- [ ] Rollback plan documented and tested
- [ ] Monitoring dashboards ready
- [ ] On-call team notified
- [ ] Feature flags configured correctly
- [ ] Capacity planning verified
- [ ] Communication plan ready (status page, stakeholders)

### 6. Post-Deployment Validation

After deployment, verify:

```bash
# Health checks
curl https://api.example.com/health
curl https://api.example.com/ready

# Critical paths
./smoke-tests.sh

# Monitor error rates
kubectl logs -f deployment/myapp | grep ERROR

# Check metrics
curl http://prometheus:9090/api/v1/query?query=up{job="myapp"}

# Verify version
curl https://api.example.com/version
```

### 7. Communication

Maintain clear communication during deployments:

**Before Deployment**:

- Notify stakeholders of deployment window
- Update status page (maintenance scheduled)
- Brief on-call team on changes

**During Deployment**:

- Update status page (deployment in progress)
- Post updates in team chat
- Monitor metrics actively

**After Deployment**:

- Confirm deployment success
- Update status page (all systems operational)
- Post summary with metrics
- Document any issues encountered

## Risk Mitigation Strategies

### 1. Feature Flags for Kill Switch

```javascript
// Wrap risky features in feature flags
if (featureFlags.isEnabled('new-payment-processor')) {
  return await newPaymentProcessor.process(payment);
} else {
  return await oldPaymentProcessor.process(payment);
}
```

### 2. Progressive Exposure

Start with:

1. Internal users (0.1%)
2. Beta users (1%)
3. Single region (5%)
4. Gradual rollout (25% → 50% → 100%)

### 3. Circuit Breakers

```javascript
const circuitBreaker = new CircuitBreaker(riskyFunction, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});
```

### 4. Request Shadowing

Send duplicate requests to new version without affecting production:

```yaml
# Istio VirtualService
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
    - myapp
  http:
    - match:
        - uri:
            prefix: /api
      route:
        - destination:
            host: myapp-stable
          weight: 100
      mirror:
        host: myapp-canary
      mirrorPercentage:
        value: 10.0
```

### 5. Synthetic Monitoring

Run continuous synthetic tests against production:

```javascript
// Run every minute
setInterval(async () => {
  const response = await fetch('https://api.example.com/health');
  if (!response.ok) {
    alert('Production health check failed');
  }
}, 60000);
```

## Troubleshooting Common Issues

### Issue: Deployment Stuck in Progress

```bash
# Check pod status
kubectl get pods -l app=myapp

# Check events
kubectl describe deployment myapp

# Check logs
kubectl logs -l app=myapp --tail=50

# Common causes:
# - Image pull errors (check image name and registry credentials)
# - Insufficient resources (check resource requests/limits)
# - Failed health checks (check liveness/readiness probe configuration)
```

### Issue: High Error Rate After Deployment

```bash
# Immediate rollback
kubectl rollout undo deployment/myapp

# Or for Blue-Green
kubectl patch service myapp -p '{"spec":{"selector":{"version":"blue"}}}'

# Check logs for errors
kubectl logs -l app=myapp,version=new | grep ERROR

# Review recent changes
git diff v1.0.0 v2.0.0
```

### Issue: Database Migration Failures

```bash
# Check migration status
kubectl exec -it deployment/myapp -- npm run migrate:status

# Rollback migration
kubectl exec -it deployment/myapp -- npm run migrate:down

# Fix migration and retry
# Edit migration file
kubectl exec -it deployment/myapp -- npm run migrate:up
```

### Issue: Traffic Not Switching to New Version

```bash
# Verify service selector
kubectl get service myapp -o yaml | grep -A 5 selector

# Check endpoint status
kubectl get endpoints myapp

# Verify pods have correct labels
kubectl get pods -l app=myapp --show-labels

# Test direct pod access
kubectl port-forward pod/myapp-new-xxx 8080:80
curl http://localhost:8080/health
```

## Additional Resources

### Documentation

- [Kubernetes Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Istio Traffic Management](https://istio.io/latest/docs/concepts/traffic-management/)
- [AWS CodeDeploy Blue-Green](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployments-blue-green.html)
- [Feature Flags Best Practices](https://launchdarkly.com/blog/dos-and-donts-of-feature-flag-testing/)

### Tools

- **Service Meshes**: Istio, Linkerd, Consul
- **Feature Flag Services**: LaunchDarkly, Unleash, Split.io
- **Deployment Tools**: ArgoCD, Flux, Spinnaker
- **Monitoring**: Prometheus, Grafana, Datadog, New Relic

### Books

- "Continuous Delivery" by Jez Humble and David Farley
- "The Phoenix Project" by Gene Kim, Kevin Behr, George Spafford
- "Site Reliability Engineering" by Google

## Contributing

When adding new examples:

1. Include complete, production-ready configurations
2. Add comprehensive error handling
3. Document all prerequisites
4. Include rollback procedures
5. Add monitoring and health checks
6. Provide clear usage instructions
7. Test in realistic environment

## License

All examples are provided as-is for educational and production use. Adapt to your specific requirements and security policies.
