# CI/CD Pipeline

## Purpose

Design and implement robust Continuous Integration and Continuous Delivery pipelines that automate testing, security scanning, and deployment while maintaining high quality standards.

## Context

CI/CD pipelines are the automation backbone of modern software delivery, enabling teams to integrate code changes frequently and deploy reliably while maintaining quality gates.

## Prerequisites

- Understanding of [Version Control & GitFlow](../03-version-control/README.md)
- Knowledge of [Testing Strategy](../04-testing-strategy/README.md)
- Familiarity with automation concepts

## CI/CD Overview

```mermaid
graph LR
    A[Code Commit] --> B[CI Pipeline]
    B --> C[Build]
    C --> D[Test]
    D --> E[Security Scan]
    E --> F[Package]
    F --> G[CD Pipeline]
    G --> H[Deploy to Staging]
    H --> I[Integration Tests]
    I --> J[Deploy to Production]
    J --> K[Monitor]
    K --> L[Feedback]
    L --> A
```

## Continuous Integration (CI)

### CI Principles

**Core Practices:**

1. **Frequent Integration**: Multiple commits per day
2. **Automated Build**: Every commit triggers build
3. **Self-Testing**: Automated test execution
4. **Fast Feedback**: Results within 10 minutes
5. **Fix Broken Builds**: Immediate priority

### CI Pipeline Stages

#### 1. Source Control Trigger

```yaml
# GitHub Actions trigger configuration
name: CI Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'
```

#### 2. Build Stage

```yaml
# Build job configuration
build:
  runs-on: ubuntu-latest

  steps:
    - name: Checkout Code
      uses: actions/checkout@v3
      with:
        fetch-depth: 0 # Full history for SonarQube

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install Dependencies
      run: |
        npm ci
        pip install -r requirements.txt

    - name: Build Application
      run: |
        npm run build
        python setup.py build

    - name: Upload Build Artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-artifacts
        path: |
          dist/
          build/
        retention-days: 7
```

#### 3. Quality Gates

```yaml
# Quality assurance job
quality:
  runs-on: ubuntu-latest
  needs: build

  steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Download Build Artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-artifacts

    - name: Lint Code
      run: |
        npm run lint
        flake8 src/
        pylint src/

    - name: Type Check
      run: |
        npm run type-check
        mypy src/

    - name: Code Formatting Check
      run: |
        npm run format:check
        black --check src/

    - name: Dependency Security Audit
      run: |
        npm audit --audit-level moderate
        safety check
        bandit -r src/

    - name: License Compliance Check
      run: |
        npm run license-check
        pip-licenses --allow-only="MIT;BSD;Apache;ISC"
```

#### 4. Testing Stage

```yaml
# Testing job with matrix strategy
test:
  runs-on: ${{ matrix.os }}
  needs: build

  strategy:
    matrix:
      os: [ubuntu-latest, windows-latest, macos-latest]
      node-version: [16, 18, 20]
      python-version: [3.9, 3.10, 3.11]

  services:
    postgres:
      image: postgres:14
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: testdb
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

    redis:
      image: redis:7
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

  steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Setup Environment
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}

    - name: Install Dependencies
      run: npm ci

    - name: Run Unit Tests
      run: npm run test:unit
      env:
        CI: true
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379

    - name: Run Integration Tests
      run: npm run test:integration
      env:
        CI: true
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb

    - name: Run E2E Tests
      run: |
        npm run start:test &
        sleep 30
        npm run test:e2e
        kill %1

    - name: Upload Test Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results-${{ matrix.os }}-${{ matrix.node-version }}
        path: |
          coverage/
          test-results/
          screenshots/
```

#### 5. Security Scanning

```yaml
# Security scanning job
security:
  runs-on: ubuntu-latest
  needs: build

  steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Run Trivy Vulnerability Scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy Results to GitHub Security
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

    - name: SonarQube Scan
      uses: sonarqube-quality-gate-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

    - name: SAST with CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: javascript, python

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2

    - name: OWASP Dependency Check
      run: |
        wget https://github.com/jeremylong/DependencyCheck/releases/download/v8.4.0/dependency-check-8.4.0-release.zip
        unzip dependency-check-8.4.0-release.zip
        ./dependency-check/bin/dependency-check.sh --project "My Project" --scan . --format XML --format HTML
```

#### 6. Package and Artifact Creation

```yaml
# Package job
package:
  runs-on: ubuntu-latest
  needs: [quality, test, security]
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

  steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ secrets.REGISTRY_URL }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}

    - name: Build and Push Docker Image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ secrets.REGISTRY_URL }}/myapp:${{ github.sha }}
          ${{ secrets.REGISTRY_URL }}/myapp:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Generate SBOM
      run: |
        curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
        syft ${{ secrets.REGISTRY_URL }}/myapp:${{ github.sha }} -o spdx-json > sbom.json

    - name: Upload SBOM
      uses: actions/upload-artifact@v3
      with:
        name: sbom
        path: sbom.json
```

### Branch-Specific CI Workflows

```yaml
# Feature branch workflow
feature-branch:
  if: startsWith(github.ref, 'refs/heads/feature/')
  jobs:
    - lint
    - unit-tests
    - security-scan
    - build-verification

# Develop branch workflow
develop-branch:
  if: github.ref == 'refs/heads/develop'
  jobs:
    - full-test-suite
    - integration-tests
    - package-staging
    - deploy-staging

# Main branch workflow
main-branch:
  if: github.ref == 'refs/heads/main'
  jobs:
    - full-test-suite
    - security-deep-scan
    - package-production
    - deploy-production
```

## Continuous Delivery (CD)

### CD Principles

**Core Practices:**

1. **Deployment Automation**: No manual deployment steps
2. **Environment Parity**: Consistent environments
3. **Rollback Capability**: Quick recovery mechanism
4. **Progressive Delivery**: Gradual rollout strategies
5. **Monitoring Integration**: Automated health checks

### Deployment Strategies

#### Blue-Green Deployment

```yaml
# Blue-Green deployment configuration
deploy-blue-green:
  runs-on: ubuntu-latest

  steps:
    - name: Determine Target Environment
      id: target
      run: |
        CURRENT=$(kubectl get service myapp-service -o jsonpath='{.spec.selector.version}')
        if [ "$CURRENT" = "blue" ]; then
          echo "target=green" >> $GITHUB_OUTPUT
        else
          echo "target=blue" >> $GITHUB_OUTPUT
        fi

    - name: Deploy to Target Environment
      run: |
        kubectl set image deployment/myapp-${{ steps.target.outputs.target }} \
          app=${{ secrets.REGISTRY_URL }}/myapp:${{ github.sha }}
        kubectl rollout status deployment/myapp-${{ steps.target.outputs.target }}

    - name: Run Health Checks
      run: |
        kubectl run health-check --rm -i --restart=Never \
          --image=curlimages/curl -- \
          curl -f http://myapp-${{ steps.target.outputs.target }}-service/health

    - name: Switch Traffic
      run: |
        kubectl patch service myapp-service \
          -p '{"spec":{"selector":{"version":"${{ steps.target.outputs.target }}"}}}'

    - name: Verify Deployment
      run: |
        sleep 30
        kubectl run traffic-test --rm -i --restart=Never \
          --image=curlimages/curl -- \
          curl -f http://myapp-service/health
```

#### Canary Deployment

```yaml
# Canary deployment with Argo Rollouts
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: myapp-canary
spec:
  replicas: 10
  strategy:
    canary:
      maxSurge: '25%'
      maxUnavailable: 0
      steps:
        - setWeight: 10
        - pause: { duration: 1m }
        - analysis:
            templates:
              - templateName: success-rate
            args:
              - name: service-name
                value: myapp-canary
        - setWeight: 50
        - pause: { duration: 2m }
        - analysis:
            templates:
              - templateName: success-rate
              - templateName: latency
        - setWeight: 100

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
          image: myapp:stable
          ports:
            - containerPort: 8080
```

#### Rolling Deployment

```yaml
# Rolling deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-rolling
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2 # Allow 2 extra pods during update
      maxUnavailable: 1 # Allow 1 pod to be unavailable
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
          image: myapp:latest
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 30
```

### Environment Management

#### Environment Configuration

```yaml
# Multi-environment deployment
environments:
  development:
    cluster: dev-cluster
    namespace: myapp-dev
    replicas: 1
    resources:
      cpu: 100m
      memory: 128Mi
    config:
      log_level: debug
      database_pool_size: 5

  staging:
    cluster: staging-cluster
    namespace: myapp-staging
    replicas: 2
    resources:
      cpu: 200m
      memory: 256Mi
    config:
      log_level: info
      database_pool_size: 10

  production:
    cluster: prod-cluster
    namespace: myapp-prod
    replicas: 5
    resources:
      cpu: 500m
      memory: 512Mi
    config:
      log_level: warn
      database_pool_size: 20
```

#### Infrastructure as Code

```yaml
# Terraform configuration for environments
resource "aws_ecs_service" "app" {
  name            = "${var.environment}-myapp"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_count

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  deployment_controller {
    type = "ECS"
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 8080
  }
}

# Environment-specific variables
variable "app_count" {
  description = "Number of app instances"
  type        = number
  default = {
    development = 1
    staging     = 2
    production  = 5
  }
}
```

## Pipeline as Code

### GitHub Actions Advanced Configuration

```yaml
# Complete CI/CD pipeline
name: Complete CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'feature/*']
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Determine what changed
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      infrastructure: ${{ steps.changes.outputs.infrastructure }}
    steps:
      - uses: actions/checkout@v3
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            frontend:
              - 'frontend/**'
              - 'package.json'
            backend:
              - 'backend/**'
              - 'requirements.txt'
            infrastructure:
              - 'infrastructure/**'
              - 'Dockerfile'

  # Frontend pipeline
  frontend:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Lint
        run: cd frontend && npm run lint

      - name: Type check
        run: cd frontend && npm run type-check

      - name: Test
        run: cd frontend && npm run test -- --coverage --watchAll=false

      - name: Build
        run: cd frontend && npm run build

      - name: E2E tests
        run: |
          cd frontend
          npm start &
          sleep 30
          npm run test:e2e
          kill %1

  # Backend pipeline
  backend:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Lint
        run: |
          cd backend
          flake8 src/
          pylint src/

      - name: Type check
        run: cd backend && mypy src/

      - name: Test
        run: |
          cd backend
          pytest --cov=src --cov-report=xml
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: backend/coverage.xml

  # Security scanning
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'

      - name: Run Bandit security linter
        run: |
          pip install bandit
          bandit -r backend/src/

      - name: Run npm audit
        run: |
          cd frontend
          npm audit --audit-level moderate

  # Build and push container
  build:
    needs: [frontend, backend, security]
    if: always() && (needs.frontend.result == 'success' || needs.frontend.result == 'skipped') && (needs.backend.result == 'success' || needs.backend.result == 'skipped') && needs.security.result == 'success'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy to staging
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # kubectl apply commands or Helm deployment

      - name: Run smoke tests
        run: |
          echo "Running smoke tests"
          # Smoke test commands

  # Deploy to production
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Production deployment commands

      - name: Run health checks
        run: |
          echo "Running production health checks"
          # Health check commands
```

### Jenkins Pipeline

```groovy
// Jenkinsfile for complex pipeline
pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'registry.company.com'
        DOCKER_REPO = 'myapp'
        SONAR_TOKEN = credentials('sonar-token')
        KUBECONFIG = credentials('kubeconfig')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_HASH = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()
                    env.BUILD_VERSION = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_HASH.take(8)}"
                }
            }
        }

        stage('Parallel Quality Checks') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                        sh 'flake8 backend/src/'
                    }
                }

                stage('Security Scan') {
                    steps {
                        sh 'npm audit --audit-level moderate'
                        sh 'bandit -r backend/src/'
                        sh 'safety check'
                    }
                }

                stage('Dependencies Check') {
                    steps {
                        sh 'npm outdated || true'
                        sh 'pip list --outdated'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
                sh 'python setup.py build'

                archiveArtifacts artifacts: 'dist/**', fingerprint: true
            }
        }

        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:unit -- --coverage'
                        sh 'pytest --cov=backend/src --cov-report=xml'
                    }
                    post {
                        always {
                            publishCoverage adapters: [
                                coberturaAdapter('coverage/cobertura-coverage.xml')
                            ], sourceFileResolver: sourceFiles('STORE_ALL_BUILD')
                        }
                    }
                }

                stage('Integration Tests') {
                    steps {
                        sh 'docker-compose -f docker-compose.test.yml up -d'
                        sh 'npm run test:integration'
                        sh 'pytest tests/integration/'
                    }
                    post {
                        always {
                            sh 'docker-compose -f docker-compose.test.yml down'
                        }
                    }
                }
            }
        }

        stage('Code Quality Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'sonar-scanner'
                }

                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Package') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${DOCKER_REPO}:${BUILD_VERSION}")
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh """
                        helm upgrade --install myapp-staging ./helm/myapp \\
                            --namespace staging \\
                            --set image.tag=${BUILD_VERSION} \\
                            --set environment=staging \\
                            --wait
                    """
                }

                // Run smoke tests
                sh 'pytest tests/smoke/ --environment=staging'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'

                script {
                    sh """
                        helm upgrade --install myapp-prod ./helm/myapp \\
                            --namespace production \\
                            --set image.tag=${BUILD_VERSION} \\
                            --set environment=production \\
                            --wait
                    """
                }

                // Run health checks
                sh 'curl -f http://myapp-prod.company.com/health'
            }
        }
    }

    post {
        always {
            publishTestResults testResultsPattern: 'test-results/**/*.xml'
            publishCoverage adapters: [
                coberturaAdapter('coverage/cobertura-coverage.xml')
            ]

            archiveArtifacts artifacts: 'logs/**', allowEmptyArchive: true
        }

        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }

        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    slackSend (
                        color: 'good',
                        message: "✅ Production deployment successful: ${env.BUILD_VERSION}"
                    )
                }
            }
        }
    }
}
```

## Quality Gates

### Quality Gate Configuration

```yaml
# SonarQube quality gate
quality_gate:
  conditions:
    - metric: coverage
      operator: GREATER_THAN
      threshold: 80

    - metric: duplicated_lines_density
      operator: LESS_THAN
      threshold: 3

    - metric: maintainability_rating
      operator: BETTER_THAN
      threshold: B

    - metric: reliability_rating
      operator: BETTER_THAN
      threshold: B

    - metric: security_rating
      operator: BETTER_THAN
      threshold: B

    - metric: sqale_rating
      operator: BETTER_THAN
      threshold: B

    - metric: new_bugs
      operator: EQUALS
      threshold: 0

    - metric: new_vulnerabilities
      operator: EQUALS
      threshold: 0
```

### Automated Quality Checks

```javascript
// Custom quality gate implementation
class QualityGate {
  constructor(config) {
    this.config = config;
    this.results = {};
  }

  async checkCoverage() {
    const coverage = await this.getCoverageFromReport();
    this.results.coverage = {
      value: coverage.total,
      passed: coverage.total >= this.config.minCoverage,
      threshold: this.config.minCoverage,
    };
  }

  async checkComplexity() {
    const complexity = await this.getComplexityMetrics();
    this.results.complexity = {
      value: complexity.average,
      passed: complexity.average <= this.config.maxComplexity,
      threshold: this.config.maxComplexity,
    };
  }

  async checkSecurity() {
    const vulnerabilities = await this.getSecurityReport();
    this.results.security = {
      value: vulnerabilities.high + vulnerabilities.critical,
      passed: vulnerabilities.high === 0 && vulnerabilities.critical === 0,
      threshold: 0,
    };
  }

  async checkPerformance() {
    const performance = await this.getPerformanceMetrics();
    this.results.performance = {
      value: performance.p95ResponseTime,
      passed: performance.p95ResponseTime <= this.config.maxResponseTime,
      threshold: this.config.maxResponseTime,
    };
  }

  async evaluate() {
    await Promise.all([
      this.checkCoverage(),
      this.checkComplexity(),
      this.checkSecurity(),
      this.checkPerformance(),
    ]);

    const passed = Object.values(this.results).every(result => result.passed);

    return {
      passed,
      results: this.results,
      summary: this.generateSummary(),
    };
  }

  generateSummary() {
    const total = Object.keys(this.results).length;
    const passed = Object.values(this.results).filter(r => r.passed).length;

    return {
      total,
      passed,
      failed: total - passed,
      passRate: (passed / total) * 100,
    };
  }
}

// Usage in pipeline
const qualityGate = new QualityGate({
  minCoverage: 80,
  maxComplexity: 10,
  maxResponseTime: 500,
});

const gateResult = await qualityGate.evaluate();

if (!gateResult.passed) {
  console.error('Quality gate failed:', gateResult.summary);
  process.exit(1);
}
```

## Monitoring and Observability

### Pipeline Monitoring

```yaml
# Monitoring configuration
monitoring:
  metrics:
    - name: pipeline_duration
      type: histogram
      description: Pipeline execution time
      labels: [branch, stage, result]

    - name: pipeline_success_rate
      type: gauge
      description: Pipeline success rate
      labels: [branch, period]

    - name: deployment_frequency
      type: counter
      description: Number of deployments
      labels: [environment, application]

    - name: build_queue_time
      type: histogram
      description: Time spent waiting in build queue
      labels: [branch, agent]

  alerts:
    - name: pipeline_failure_rate_high
      condition: pipeline_success_rate < 0.8
      for: 5m
      severity: warning
      message: 'Pipeline success rate below 80%'

    - name: pipeline_duration_high
      condition: pipeline_duration > 30m
      for: 1m
      severity: critical
      message: 'Pipeline taking longer than 30 minutes'
```

### Application Health Monitoring

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    checks: {},
  };

  try {
    // Database health
    health.checks.database = await checkDatabase();

    // Redis health
    health.checks.redis = await checkRedis();

    // External services
    health.checks.paymentService = await checkExternalService('payment');
    health.checks.emailService = await checkExternalService('email');

    // System resources
    health.checks.memory = await checkMemoryUsage();
    health.checks.disk = await checkDiskSpace();

    const allHealthy = Object.values(health.checks).every(check => check.status === 'healthy');

    if (!allHealthy) {
      health.status = 'degraded';
      res.status(503);
    }
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(503);
  }

  res.json(health);
});

async function checkDatabase() {
  try {
    await db.raw('SELECT 1');
    return { status: 'healthy', responseTime: '5ms' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

## Rollback Strategies

### Automated Rollback

```yaml
# Automated rollback configuration
rollback:
  triggers:
    - metric: error_rate
      threshold: 0.05
      duration: 2m

    - metric: response_time_p95
      threshold: 2000
      duration: 5m

    - metric: health_check_failures
      threshold: 3
      duration: 1m

  strategy: blue_green

  steps:
    - name: stop_traffic
      action: switch_traffic_to_previous_version

    - name: scale_down
      action: scale_new_version_to_zero

    - name: notify
      action: send_alert
      channels: [slack, email]

    - name: create_incident
      action: create_incident_ticket
      priority: high
```

### Manual Rollback Process

```bash
#!/bin/bash
# Manual rollback script

set -e

ENVIRONMENT=$1
PREVIOUS_VERSION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$PREVIOUS_VERSION" ]; then
    echo "Usage: $0 <environment> <previous_version>"
    exit 1
fi

echo "Rolling back $ENVIRONMENT to version $PREVIOUS_VERSION"

# Confirm rollback
read -p "Are you sure you want to rollback? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Switch traffic to previous version
kubectl patch service myapp-service \
    -p '{"spec":{"selector":{"version":"'$PREVIOUS_VERSION'"}}}'

# Wait for traffic switch
sleep 30

# Verify health
kubectl run health-check --rm -i --restart=Never \
    --image=curlimages/curl -- \
    curl -f http://myapp-service/health

# Scale down current version
kubectl scale deployment myapp-current --replicas=0

# Create incident ticket
curl -X POST "https://api.incident-tool.com/incidents" \
    -H "Authorization: Bearer $INCIDENT_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Production Rollback: '$ENVIRONMENT'",
        "description": "Rolled back to version '$PREVIOUS_VERSION'",
        "severity": "high"
    }'

echo "Rollback completed successfully"
```

## Performance Optimization

### Pipeline Performance

```yaml
# Optimized pipeline configuration
performance_optimizations:
  caching:
    - type: dependency_cache
      paths: [node_modules, .pip]
      key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json', '**/requirements.txt') }}

    - type: build_cache
      paths: [dist, build]
      key: ${{ runner.os }}-build-${{ github.sha }}

    - type: docker_layer_cache
      registry: ghcr.io
      mode: max

  parallelization:
    matrix_strategy:
      os: [ubuntu-latest, windows-latest]
      node_version: [16, 18, 20]
      exclude:
        - os: windows-latest
          node_version: 16

  resource_optimization:
    runner_type: large # Use larger runners for compute-intensive tasks
    timeout: 30 # Prevent hanging jobs
    concurrency:
      group: ${{ github.workflow }}-${{ github.ref }}
      cancel-in-progress: true # Cancel old runs
```

### Build Optimization

```dockerfile
# Optimized multi-stage Dockerfile
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS backend-builder
WORKDIR /app/backend
RUN pip install --upgrade pip
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
RUN python -m py_compile src/**/*.py

FROM python:3.11-slim AS runtime
RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /app

# Copy only production dependencies
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /app/backend/src ./backend/src
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

USER appuser
EXPOSE 8080
CMD ["python", "-m", "backend.src.main"]
```

## Checklist

### CI/CD Implementation Checklist

**CI Pipeline:**

- [ ] Automated build on every commit
- [ ] Comprehensive test suite execution
- [ ] Code quality checks (linting, formatting)
- [ ] Security vulnerability scanning
- [ ] Dependency audit
- [ ] Fast feedback (< 10 minutes)
- [ ] Parallel execution where possible
- [ ] Artifact generation and storage

**CD Pipeline:**

- [ ] Automated deployment to staging
- [ ] Integration testing in staging
- [ ] Production deployment strategy defined
- [ ] Rollback mechanism in place
- [ ] Environment parity maintained
- [ ] Configuration management
- [ ] Health checks and monitoring
- [ ] Deployment approval process

**Quality Gates:**

- [ ] Coverage thresholds defined
- [ ] Security vulnerability limits
- [ ] Performance benchmarks
- [ ] Code complexity limits
- [ ] Automated quality gate enforcement
- [ ] Manual approval for production
- [ ] Failed build notifications

**Monitoring & Alerting:**

- [ ] Pipeline metrics collection
- [ ] Application health monitoring
- [ ] Deployment success tracking
- [ ] Error rate monitoring
- [ ] Performance monitoring
- [ ] Alert configuration
- [ ] Incident response procedures

## References

### CI/CD Platforms

- **GitHub Actions** - GitHub-native CI/CD
- **GitLab CI/CD** - Integrated DevOps platform
- **Jenkins** - Open-source automation server
- **Azure DevOps** - Microsoft's DevOps platform
- **CircleCI** - Cloud-native CI/CD
- **TeamCity** - JetBrains CI/CD server

### Deployment Tools

- **Kubernetes** - Container orchestration
- **Docker** - Containerization platform
- **Helm** - Kubernetes package manager
- **Terraform** - Infrastructure as Code
- **Ansible** - Configuration management

### Books

- "Continuous Delivery" - Jez Humble & David Farley
- "The DevOps Handbook" - Gene Kim, et al.
- "Accelerate" - Nicole Forsgren, et al.

## Related Topics

- [Version Control & GitFlow](../03-version-control/README.md)
- [Testing Strategy](../04-testing-strategy/README.md)
- [Metrics & Monitoring](../09-metrics-monitoring/README.md)
- [Tools Ecosystem](../10-tools-ecosystem/README.md)

---

_Next: [Build Automation](build-automation.md) - Deep dive into build processes_
