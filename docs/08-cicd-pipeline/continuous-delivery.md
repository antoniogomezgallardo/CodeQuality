# Continuous Delivery (CD)

## Overview

Continuous Delivery is a software development practice where code changes are automatically built, tested, and prepared for release to production. It ensures that software can be reliably released at any time through automated deployment pipelines.

## Purpose

- **Reduce deployment risk**: Small, frequent releases are less risky
- **Faster time to market**: Deploy features when ready
- **Higher quality**: Automated testing in deployment pipeline
- **Lower costs**: Automation reduces manual effort
- **Better products**: Rapid feedback enables quick iterations

## CD Principles

### 1. Build Quality In

```yaml
# Every stage includes quality checks
stages:
  - lint
  - test
  - security-scan
  - build
  - deploy-staging
  - smoke-test
  - deploy-production
```

###  2. Work in Small Batches

```markdown
**Small Batch Benefits:**
- Easier to identify issues
- Faster feedback
- Lower risk
- Quicker rollback

**Target:** Deploy multiple times per day
```

### 3. Automate Everything

```yaml
# Fully automated deployment pipeline
name: CD Pipeline

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to staging
        run: |
          npm run deploy:staging

      - name: Run smoke tests
        run: npm run test:smoke

      - name: Deploy to production
        if: success()
        run: npm run deploy:production

      - name: Verify deployment
        run: npm run verify:production
```

### 4. Everyone Is Responsible

```markdown
**Shared Ownership:**
- Developers deploy their own code
- On-call rotation for all team members
- No separate "ops" team
- "You build it, you run it"
```

### 5. Continuous Improvement

```markdown
**Metrics to Track:**
- Deployment frequency
- Lead time for changes
- Change failure rate
- Mean time to recovery
```

## CD Pipeline Stages

### Stage 1: Commit Stage

```yaml
commit-stage:
  runs-on: ubuntu-latest
  steps:
    - name: Compile
      run: npm run build

    - name: Unit tests
      run: npm run test:unit

    - name: Code analysis
      run: npm run lint && npm run sonar

    - name: Create artifact
      run: |
        tar -czf app-${{ github.sha }}.tar.gz dist/

    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: app-artifact
        path: app-${{ github.sha }}.tar.gz
```

### Stage 2: Acceptance Testing

```yaml
acceptance-tests:
  needs: commit-stage
  runs-on: ubuntu-latest
  steps:
    - name: Download artifact
      uses: actions/download-artifact@v3

    - name: Deploy to test environment
      run: ./deploy.sh test

    - name: Run integration tests
      run: npm run test:integration

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Run performance tests
      run: npm run test:performance
```

### Stage 3: Deploy to Staging

```yaml
deploy-staging:
  needs: acceptance-tests
  environment:
    name: staging
    url: https://staging.example.com
  steps:
    - name: Deploy to staging
      run: |
        kubectl set image deployment/app \
          app=myapp:${{ github.sha }} \
          --namespace=staging

    - name: Wait for rollout
      run: kubectl rollout status deployment/app -n staging

    - name: Run smoke tests
      run: npm run test:smoke -- --env=staging
```

### Stage 4: Manual Approval (Optional)

```yaml
deploy-production:
  needs: deploy-staging
  environment:
    name: production
    url: https://example.com
  steps:
    # GitHub will pause here for manual approval

    - name: Deploy to production
      run: |
        kubectl set image deployment/app \
          app=myapp:${{ github.sha }} \
          --namespace=production
```

### Stage 5: Production Deployment

```yaml
production-deployment:
  steps:
    - name: Blue-green deployment
      run: |
        # Deploy to green environment
        ./deploy.sh production green

        # Run health checks
        ./healthcheck.sh green

        # Switch traffic
        ./switch-traffic.sh green

        # Monitor for 10 minutes
        ./monitor.sh green 10m

        # Rollback if issues detected
        if [ $? -ne 0 ]; then
          ./switch-traffic.sh blue
          exit 1
        fi
```

## Deployment Strategies

### 1. Blue-Green Deployment

```bash
#!/bin/bash
# Blue-Green deployment script

# Deploy to green (inactive) environment
deploy_green() {
  kubectl apply -f k8s/green-deployment.yaml
  kubectl rollout status deployment/app-green
}

# Run health checks on green
health_check_green() {
  curl -f https://green.example.com/health || exit 1
}

# Switch traffic from blue to green
switch_traffic() {
  kubectl patch service app-service \
    -p '{"spec":{"selector":{"version":"green"}}}'
}

# Execute deployment
deploy_green
health_check_green
switch_traffic

echo "Deployment successful. Green is now live."
echo "Blue environment kept for rollback if needed."
```

### 2. Canary Deployment

```yaml
# Gradual rollout
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
  # Traffic split controlled by replica count

---
# 90% traffic to stable version (9 replicas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-stable
spec:
  replicas: 9
  template:
    metadata:
      labels:
        app: myapp
        version: stable

---
# 10% traffic to canary version (1 replica)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-canary
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: myapp
        version: canary
```

### 3. Rolling Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2  # Max 2 extra pods during update
      maxUnavailable: 1  # Max 1 pod down during update
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Feature Flags in CD

```javascript
// Deploy code without exposing features
class FeatureFlags {
  async deployNewCheckout() {
    // Code is deployed to production
    // But feature is hidden behind flag

    if (await this.isEnabled('new-checkout', user)) {
      return <NewCheckoutFlow />;
    } else {
      return <CurrentCheckoutFlow />;
    }
  }

  // Gradual rollout
  async enableGradually(featureName) {
    const schedule = [
      { day: 1, percentage: 1 },   // 1% of users
      { day: 2, percentage: 5 },   // 5% of users
      { day: 3, percentage: 25 },  // 25% of users
      { day: 5, percentage: 100 }  // All users
    ];

    for (const stage of schedule) {
      await this.setRolloutPercentage(featureName, stage.percentage);
      await this.monitorMetrics(featureName, 24); // Monitor for 24 hours

      if (this.metricsLookBad(featureName)) {
        await this.rollback(featureName);
        break;
      }
    }
  }
}
```

## Deployment Pipeline Example

```yaml
# Complete CD pipeline
name: Continuous Delivery

on:
  push:
    branches: [main]

jobs:
  # 1. Build and test
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  # 2. Deploy to staging
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/download-artifact@v3
      - name: Deploy
        run: |
          aws s3 sync dist/ s3://staging-bucket/
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.STAGING_CF_ID }} \
            --paths "/*"

  # 3. Run smoke tests
  smoke-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -f https://staging.example.com/health
          npm run test:smoke -- --env=staging

  # 4. Deploy to production (with approval)
  deploy-production:
    needs: smoke-tests
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v3
      - name: Deploy
        run: |
          aws s3 sync dist/ s3://prod-bucket/
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.PROD_CF_ID }} \
            --paths "/*"

  # 5. Verify production
  verify-production:
    needs: deploy-production
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -f https://example.com/health
          npm run test:smoke -- --env=production

  # 6. Notify team
  notify:
    needs: verify-production
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production: ${{ job.status }}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## CD Metrics (DORA)

```javascript
const cdMetrics = {
  // Deployment Frequency
  deploymentFrequency: {
    perDay: 8,  // Elite: multiple per day
    perWeek: 56,
    perMonth: 240
  },

  // Lead Time for Changes
  leadTime: {
    commitToDeployMinutes: 45,  // Elite: <1 hour
    codeToProdHours: 2
  },

  // Change Failure Rate
  changeFailureRate: 8,  // % (Elite: 0-15%)

  // Mean Time to Recovery
  mttr: {
    minutes: 15  // Elite: <1 hour
  }
};
```

## Best Practices

### 1. Version Everything

```bash
# Use semantic versioning
APP_VERSION=1.2.3
DOCKER_IMAGE=myapp:${APP_VERSION}
DEPLOYMENT_TAG=v${APP_VERSION}
```

### 2. Database Migrations

```javascript
// Backward-compatible migrations
class UserMigration {
  async up() {
    // 1. Add new column (nullable)
    await db.schema.table('users', (table) => {
      table.string('email').nullable();
    });

    // 2. Deploy application code (works with/without email)
    // 3. Backfill data
    // 4. Make column non-nullable
  }
}
```

### 3. Health Checks

```javascript
// /health endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalAPI: await checkExternalAPI()
  };

  const healthy = Object.values(checks).every(c => c.healthy);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    version: process.env.APP_VERSION,
    timestamp: new Date()
  });
});
```

### 4. Rollback Strategy

```bash
#!/bin/bash
# Quick rollback script

rollback() {
  PREVIOUS_VERSION=$(get_previous_version)

  echo "Rolling back to version: $PREVIOUS_VERSION"

  kubectl rollout undo deployment/app

  # Verify rollback
  kubectl rollout status deployment/app

  # Run smoke tests
  npm run test:smoke

  if [ $? -eq 0 ]; then
    echo "Rollback successful"
  else
    echo "Rollback failed! Manual intervention required"
    exit 1
  fi
}
```

## Related Resources

- [Continuous Integration](continuous-integration.md)
- [Deployment Automation](deployment-automation.md)
- [Feature Flags](../07-development-practices/feature-flags.md)
- [DORA Metrics](../09-metrics-monitoring/dora-metrics.md)

## References

- Jez Humble - Continuous Delivery
- DORA - State of DevOps Report
- Martin Fowler - Continuous Delivery

---

*Part of: [CI/CD Pipeline](README.md)*
