# Deployment Automation

## Overview

Deployment automation is the practice of using tools and scripts to automatically deploy applications to various environments without manual intervention, ensuring consistent, reliable, and repeatable deployments.

## Purpose

- **Consistency**: Same process every time
- **Speed**: Deploy in minutes, not hours
- **Reliability**: Reduce human error
- **Repeatability**: Deploy to any environment identically
- **Audit trail**: Track all deployments

## Deployment Pipeline

```yaml
# Complete deployment automation
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push myapp:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/myapp \
            myapp=myapp:${{ github.sha }}

      - name: Wait for rollout
        run: kubectl rollout status deployment/myapp

      - name: Run health checks
        run: |
          curl -f https://api.example.com/health

      - name: Run smoke tests
        run: npm run test:smoke
```

## Deployment Strategies

### Blue-Green Deployment

```bash
#!/bin/bash
# Blue-green deployment automation

BLUE_URL="https://blue.example.com"
GREEN_URL="https://green.example.com"

# Deploy to green (inactive)
deploy_to_green() {
  echo "Deploying to green environment..."
  kubectl apply -f k8s/green-deployment.yaml
  kubectl wait --for=condition=available deployment/app-green --timeout=300s
}

# Health check
health_check() {
  local url=$1
  local max_attempts=30

  for i in $(seq 1 $max_attempts); do
    if curl -f "$url/health" > /dev/null 2>&1; then
      echo "Health check passed"
      return 0
    fi
    echo "Attempt $i/$max_attempts failed, retrying..."
    sleep 10
  done

  echo "Health check failed after $max_attempts attempts"
  return 1
}

# Switch traffic
switch_traffic() {
  echo "Switching traffic to green..."
  kubectl patch service app-service \
    -p '{"spec":{"selector":{"environment":"green"}}}'
}

# Main execution
deploy_to_green
health_check "$GREEN_URL"

if [ $? -eq 0 ]; then
  switch_traffic
  echo "Deployment successful!"
else
  echo "Deployment failed!"
  exit 1
fi
```

### Canary Deployment

```javascript
// Canary deployment automation
class CanaryDeployment {
  async deploy(version) {
    // Stage 1: Deploy canary (10% traffic)
    await this.deployCanary(version, 10);
    await this.monitor(60); // Monitor for 1 hour

    if (!this.metricsHealthy()) {
      await this.rollback();
      throw new Error('Canary metrics unhealthy');
    }

    // Stage 2: Increase to 50%
    await this.deployCanary(version, 50);
    await this.monitor(60);

    if (!this.metricsHealthy()) {
      await this.rollback();
      throw new Error('Canary metrics unhealthy at 50%');
    }

    // Stage 3: Full deployment
    await this.deployCanary(version, 100);

    console.log('Canary deployment successful');
  }

  async deployCanary(version, percentage) {
    // Calculate replica counts
    const totalReplicas = 10;
    const canaryReplicas = Math.ceil(totalReplicas * percentage / 100);
    const stableReplicas = totalReplicas - canaryReplicas;

    // Update deployments
    await kubectl(`scale deployment/app-stable --replicas=${stableReplicas}`);
    await kubectl(`scale deployment/app-canary --replicas=${canaryReplicas}`);
    await kubectl(`set image deployment/app-canary app=${version}`);
  }

  metricsHealthy() {
    const metrics = this.getMetrics();
    return (
      metrics.errorRate < 0.01 && // <1% error rate
      metrics.latencyP99 < 1000 && // <1s p99 latency
      metrics.successRate > 0.99   // >99% success rate
    );
  }
}
```

## Infrastructure as Code

### Terraform

```hcl
# main.tf - Infrastructure automation
resource "aws_ecs_service" "app" {
  name            = "myapp"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 8080
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512

  container_definitions = jsonencode([{
    name  = "app"
    image = "${var.docker_image}:${var.version}"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      { name = "ENV", value = var.environment }
    ]
  }])
}
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Deployment Scripts

### Zero-Downtime Deployment

```bash
#!/bin/bash
# zero-downtime-deploy.sh

set -e

VERSION=$1
ENVIRONMENT=${2:-production}

echo "Deploying version $VERSION to $ENVIRONMENT"

# Build and push Docker image
docker build -t myapp:$VERSION .
docker push myapp:$VERSION

# Update Kubernetes deployment
kubectl set image deployment/myapp \
  myapp=myapp:$VERSION \
  --namespace=$ENVIRONMENT \
  --record

# Wait for rollout
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/myapp \
  --namespace=$ENVIRONMENT \
  --timeout=10m

# Verify deployment
echo "Running health checks..."
REPLICAS=$(kubectl get deployment myapp -n $ENVIRONMENT -o jsonpath='{.status.readyReplicas}')
EXPECTED=$(kubectl get deployment myapp -n $ENVIRONMENT -o jsonpath='{.spec.replicas}')

if [ "$REPLICAS" != "$EXPECTED" ]; then
  echo "Deployment failed: $REPLICAS/$EXPECTED replicas ready"
  kubectl rollout undo deployment/myapp -n $ENVIRONMENT
  exit 1
fi

echo "Deployment successful!"
```

## Database Migrations

```javascript
// Automated database migrations
class DatabaseMigration {
  async runMigrations() {
    console.log('Running database migrations...');

    // Lock to prevent concurrent migrations
    await this.acquireLock();

    try {
      const pending = await this.getPendingMigrations();

      for (const migration of pending) {
        console.log(`Running migration: ${migration.name}`);

        await this.db.transaction(async (trx) => {
          await migration.up(trx);
          await this.recordMigration(migration.name, trx);
        });

        console.log(`✓ Completed: ${migration.name}`);
      }

      console.log('All migrations completed successfully');
    } finally {
      await this.releaseLock();
    }
  }

  // Example migration
  async addEmailColumn() {
    return {
      name: '2024_01_15_add_email_to_users',
      async up(db) {
        // Step 1: Add column (nullable)
        await db.schema.alterTable('users', (table) => {
          table.string('email').nullable();
        });

        // Step 2: Backfill data
        const users = await db('users').select('*');
        for (const user of users) {
          await db('users')
            .where({ id: user.id })
            .update({ email: `${user.username}@example.com` });
        }

        // Step 3: Make non-nullable
        await db.schema.alterTable('users', (table) => {
          table.string('email').notNullable().alter();
        });

        // Step 4: Add unique constraint
        await db.schema.alterTable('users', (table) => {
          table.unique(['email']);
        });
      }
    };
  }
}
```

## Rollback Automation

```bash
#!/bin/bash
# rollback.sh - Automated rollback

rollback_to_previous() {
  echo "Rolling back deployment..."

  # Get current and previous versions
  CURRENT=$(kubectl get deployment myapp -o jsonpath='{.spec.template.spec.containers[0].image}')
  PREVIOUS=$(kubectl rollout history deployment/myapp | tail -n 2 | head -n 1 | awk '{print $1}')

  echo "Current version: $CURRENT"
  echo "Rolling back to revision: $PREVIOUS"

  # Perform rollback
  kubectl rollout undo deployment/myapp --to-revision=$PREVIOUS

  # Wait for rollback
  kubectl rollout status deployment/myapp --timeout=5m

  # Verify
  NEW_VERSION=$(kubectl get deployment myapp -o jsonpath='{.spec.template.spec.containers[0].image}')

  if curl -f "https://api.example.com/health"; then
    echo "Rollback successful! Now running: $NEW_VERSION"
  else
    echo "Rollback failed! Health check not passing"
    exit 1
  fi
}

# Execute rollback
rollback_to_previous
```

## Deployment Verification

```javascript
// Post-deployment verification
class DeploymentVerification {
  async verify(environment) {
    const checks = [
      this.healthCheck(environment),
      this.smokeTests(environment),
      this.metricsCheck(environment),
      this.logCheck(environment)
    ];

    const results = await Promise.all(checks);

    const allPassed = results.every(r => r.passed);

    if (!allPassed) {
      console.error('Deployment verification failed!');
      await this.rollback(environment);
      throw new Error('Verification failed');
    }

    console.log('All verification checks passed!');
    return true;
  }

  async healthCheck(env) {
    const response = await fetch(`https://${env}.example.com/health`);
    return {
      name: 'Health Check',
      passed: response.ok
    };
  }

  async smokeTests(env) {
    // Run critical path tests
    const tests = [
      () => this.testUserLogin(env),
      () => this.testDataRetrieval(env),
      () => this.testCriticalFeature(env)
    ];

    const results = await Promise.all(tests.map(t => t()));
    const passed = results.every(r => r === true);

    return {
      name: 'Smoke Tests',
      passed
    };
  }

  async metricsCheck(env) {
    // Check error rates, latency
    const metrics = await this.getMetrics(env);

    const passed = (
      metrics.errorRate < 0.01 &&
      metrics.latencyP99 < 1000
    );

    return {
      name: 'Metrics Check',
      passed
    };
  }
}
```

## Metrics

```javascript
const deploymentMetrics = {
  // Deployment frequency
  deploymentsPerDay: 12,

  // Deployment duration
  avgDeploymentTime: 8, // minutes

  // Success rate
  deploymentSuccessRate: 98, // %

  // Rollback rate
  rollbackRate: 2, // %

  // Time to rollback
  avgRollbackTime: 3 // minutes
};
```

## Related Resources

- [Continuous Delivery](continuous-delivery.md)
- [Feature Flags](../07-development-practices/feature-flags.md)
- [Version Control](../03-version-control/README.md)

## References

- Kubernetes Documentation
- AWS ECS Best Practices
- Google Cloud Run Documentation

---

*Part of: [CI/CD Pipeline](README.md)*
