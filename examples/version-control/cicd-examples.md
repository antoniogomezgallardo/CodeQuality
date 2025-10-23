# Version Control CI/CD Examples

## Overview

This document provides production-ready examples of CI/CD pipelines integrated with version control best practices. All examples follow industry standards and demonstrate real-world implementations.

## Table of Contents

1. [Trunk-Based Development (TBD) Examples](#trunk-based-development-tbd-examples)
2. [GitHub Flow Examples](#github-flow-examples)
3. [GitLab Flow Examples](#gitlab-flow-examples)
4. [GitFlow with GitHub Actions](#gitflow-with-github-actions)
5. [Feature Flags Implementation](#feature-flags-implementation)
6. [Pre-commit Hooks](#pre-commit-hooks)
7. [Semantic Versioning Automation](#semantic-versioning-automation)
8. [Docker Multi-stage Build with CI](#docker-multi-stage-build-with-ci)
9. [Automated Rollback Example](#automated-rollback-example)

---

## Trunk-Based Development (TBD) Examples

### Complete TBD Pipeline with GitHub Actions

**File**: `.github/workflows/trunk-based.yml`

```yaml
name: Trunk-Based Development CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Fast feedback for all commits
  quick-checks:
    name: Quick Checks (< 2 min)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Type check
        run: npm run type-check

  # Unit tests with high coverage
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: quick-checks
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage --maxWorkers=4

      - name: Coverage check (90% threshold for trunk)
        run: |
          COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.lines.pct")
          if (( $(echo "$COVERAGE < 90" | bc -l) )); then
            echo "Coverage ${COVERAGE}% is below 90% threshold"
            exit 1
          fi

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # Integration tests
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
        run: npm run test:integration

  # E2E tests (only on main)
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # Security scanning
  security:
    name: Security Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'

      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  # Build and push Docker image
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, security]
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Continuous deployment to production with canary
  deploy-production:
    name: Deploy to Production (Canary)
    runs-on: ubuntu-latest
    needs: [e2e-tests, build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://example.com
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy canary (10%)
        run: |
          kubectl set image deployment/myapp-canary \
            myapp=${{ needs.build.outputs.image-tag }} \
            -n production

          kubectl rollout status deployment/myapp-canary -n production

      - name: Monitor canary for 5 minutes
        run: |
          sleep 300

          # Check error rates
          ERROR_RATE=$(kubectl exec -n production deploy/monitoring -- \
            curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' | \
            jq -r '.data.result[0].value[1]')

          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "Error rate too high, rolling back canary"
            exit 1
          fi

      - name: Promote canary to 100%
        if: success()
        run: |
          kubectl patch service myapp -n production -p '{"spec":{"selector":{"version":"canary"}}}'
          kubectl scale deployment/myapp-stable --replicas=0 -n production
          kubectl scale deployment/myapp-canary --replicas=10 -n production

      - name: Rollback canary on failure
        if: failure()
        run: |
          kubectl rollout undo deployment/myapp-canary -n production
          echo "Canary deployment failed and was rolled back"

      - name: Notify deployment status
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

### TBD with Feature Flags

**File**: `src/features/featureFlags.ts`

```typescript
// Feature flag configuration
export interface FeatureFlags {
  newCheckoutFlow: boolean;
  enhancedSearch: boolean;
  aiRecommendations: boolean;
  darkMode: boolean;
}

// Feature flag service
export class FeatureFlagService {
  private flags: Map<string, boolean> = new Map();

  constructor() {
    this.initializeFlags();
  }

  private async initializeFlags() {
    // Load from remote config service (e.g., LaunchDarkly, Unleash)
    const response = await fetch('/api/feature-flags');
    const flags = await response.json();

    Object.entries(flags).forEach(([key, value]) => {
      this.flags.set(key, value as boolean);
    });
  }

  isEnabled(flagName: keyof FeatureFlags): boolean {
    return this.flags.get(flagName) ?? false;
  }

  // For gradual rollout
  isEnabledForUser(flagName: keyof FeatureFlags, userId: string): boolean {
    const baseEnabled = this.isEnabled(flagName);
    if (!baseEnabled) return false;

    // Hash user ID to determine if they're in the rollout percentage
    const rolloutPercentage = this.getRolloutPercentage(flagName);
    const userHash = this.hashUserId(userId);
    return userHash <= rolloutPercentage;
  }

  private getRolloutPercentage(flagName: string): number {
    // Get from config
    return 50; // 50% rollout
  }

  private hashUserId(userId: string): number {
    // Simple hash for demo (use better hashing in production)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }
}

// React component example
import { useFeatureFlag } from './hooks/useFeatureFlag';

export function CheckoutPage() {
  const newCheckoutEnabled = useFeatureFlag('newCheckoutFlow');

  if (newCheckoutEnabled) {
    return <NewCheckoutFlow />;
  }

  return <LegacyCheckoutFlow />;
}
```

**File**: `feature-flags.config.json`

```json
{
  "flags": {
    "newCheckoutFlow": {
      "enabled": true,
      "rolloutPercentage": 10,
      "description": "New streamlined checkout process",
      "environments": {
        "development": true,
        "staging": true,
        "production": false
      }
    },
    "enhancedSearch": {
      "enabled": true,
      "rolloutPercentage": 100,
      "description": "AI-powered search with filters"
    },
    "aiRecommendations": {
      "enabled": false,
      "rolloutPercentage": 0,
      "description": "Machine learning product recommendations"
    }
  }
}
```

---

## GitHub Flow Examples

### Complete GitHub Flow Pipeline

**File**: `.github/workflows/github-flow.yml`

```yaml
name: GitHub Flow CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # PR checks (on pull requests)
  pr-checks:
    name: PR Quality Checks
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm run test:unit -- --coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.lines.pct")
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage ${COVERAGE}% is below 80% threshold"
            exit 1
          fi
          echo "✅ Coverage: ${COVERAGE}%"

      - name: Integration tests
        run: npm run test:integration

      - name: Build check
        run: npm run build

      - name: Size check
        run: |
          SIZE=$(du -sh dist/ | cut -f1)
          echo "Bundle size: $SIZE"

  # Deploy preview environment for PRs
  deploy-preview:
    name: Deploy Preview Environment
    runs-on: ubuntu-latest
    needs: pr-checks
    if: github.event_name == 'pull_request'
    environment:
      name: preview-pr-${{ github.event.pull_request.number }}
      url: https://pr-${{ github.event.pull_request.number }}.preview.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: https://api.preview.example.com
          VITE_ENVIRONMENT: preview

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          alias-domains: pr-${{ github.event.pull_request.number }}.preview.example.com

      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `### 🚀 Preview Deployment Ready!\n\n` +
                    `Preview URL: https://pr-${{ github.event.pull_request.number }}.preview.example.com\n\n` +
                    `Commit: ${context.sha.substring(0, 7)}`
            })

  # Production deployment (on merge to main)
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://example.com
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run all tests
        run: |
          npm run test:unit
          npm run test:integration
          npm run test:e2e

      - name: Build for production
        run: npm run build
        env:
          VITE_API_URL: https://api.example.com
          VITE_ENVIRONMENT: production

      - name: Deploy to production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run smoke tests
        run: npm run test:smoke -- --url=https://example.com

      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release ${{ github.run_number }}
          body: |
            ## Changes
            ${{ github.event.head_commit.message }}

            **Deployed**: ${{ github.event.head_commit.timestamp }}
            **Commit**: ${{ github.sha }}

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

### GitHub Flow with Netlify

**File**: `.github/workflows/netlify-github-flow.yml`

```yaml
name: GitHub Flow with Netlify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          npm run lint
          npm run test

      - name: Build
        run: npm run build

      # Deploy preview for PRs
      - name: Deploy to Netlify (Preview)
        if: github.event_name == 'pull_request'
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: false
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: 'Deploy from PR #${{ github.event.pull_request.number }}'
          alias: pr-${{ github.event.pull_request.number }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

      # Deploy to production on main
      - name: Deploy to Netlify (Production)
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: 'Production deployment'
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## GitLab Flow Examples

### Complete GitLab Flow Pipeline

**File**: `.gitlab-ci.yml`

```yaml
stages:
  - test
  - build
  - deploy-staging
  - deploy-pre-production
  - deploy-production

variables:
  DOCKER_DRIVER: overlay2
  REGISTRY: registry.gitlab.com
  IMAGE_NAME: $CI_REGISTRY_IMAGE
  NODE_VERSION: '20'

# Templates
.node_template: &node_template
  image: node:${NODE_VERSION}
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/
  before_script:
    - npm ci --cache .npm --prefer-offline

# ==================== TEST STAGE ====================
lint:
  <<: *node_template
  stage: test
  script:
    - npm run lint
    - npm run format:check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "production"

unit-tests:
  <<: *node_template
  stage: test
  script:
    - npm run test:unit -- --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "production"

integration-tests:
  <<: *node_template
  stage: test
  services:
    - name: postgres:15
      alias: postgres
  variables:
    DATABASE_URL: postgresql://test:test@postgres:5432/testdb
  script:
    - npm run db:migrate
    - npm run test:integration
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "production"

security-scan:
  stage: test
  image: aquasec/trivy:latest
  script:
    - trivy fs --severity HIGH,CRITICAL --exit-code 1 .
  allow_failure: true
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

# ==================== BUILD STAGE ====================
build-docker:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      docker build \
        --build-arg NODE_VERSION=$NODE_VERSION \
        --tag $IMAGE_NAME:$CI_COMMIT_SHA \
        --tag $IMAGE_NAME:$CI_COMMIT_REF_SLUG \
        .
    - docker push $IMAGE_NAME:$CI_COMMIT_SHA
    - docker push $IMAGE_NAME:$CI_COMMIT_REF_SLUG
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "production"

# ==================== STAGING DEPLOYMENT ====================
deploy-staging:
  stage: deploy-staging
  image: alpine/k8s:1.28.0
  script:
    - kubectl config use-context staging
    - |
      kubectl set image deployment/myapp \
        myapp=$IMAGE_NAME:$CI_COMMIT_SHA \
        -n staging
    - kubectl rollout status deployment/myapp -n staging --timeout=5m
  environment:
    name: staging
    url: https://staging.example.com
    on_stop: stop-staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

smoke-tests-staging:
  <<: *node_template
  stage: deploy-staging
  needs: [deploy-staging]
  script:
    - npm run test:smoke -- --url=https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

stop-staging:
  stage: deploy-staging
  image: alpine/k8s:1.28.0
  script:
    - kubectl scale deployment/myapp --replicas=0 -n staging
  when: manual
  environment:
    name: staging
    action: stop
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ==================== PRE-PRODUCTION DEPLOYMENT ====================
deploy-pre-production:
  stage: deploy-pre-production
  image: alpine/k8s:1.28.0
  script:
    - kubectl config use-context pre-production
    - |
      kubectl set image deployment/myapp \
        myapp=$IMAGE_NAME:$CI_COMMIT_SHA \
        -n pre-production
    - kubectl rollout status deployment/myapp -n pre-production --timeout=5m
  environment:
    name: pre-production
    url: https://pre.example.com
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

e2e-tests-pre-production:
  <<: *node_template
  stage: deploy-pre-production
  image: mcr.microsoft.com/playwright:v1.40.0
  needs: [deploy-pre-production]
  script:
    - npm run test:e2e -- --url=https://pre.example.com
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 30 days
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ==================== PRODUCTION DEPLOYMENT ====================
# Merge main to production branch to trigger production deployment
deploy-production:
  stage: deploy-production
  image: alpine/k8s:1.28.0
  before_script:
    - apk add --no-cache postgresql-client
  script:
    # Create database backup
    - |
      pg_dump $PROD_DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
      aws s3 cp backup-*.sql s3://backups/pre-deployment/

    # Blue-green deployment
    - kubectl config use-context production
    - |
      # Deploy to green
      kubectl set image deployment/myapp-green \
        myapp=$IMAGE_NAME:$CI_COMMIT_SHA \
        -n production
    - kubectl rollout status deployment/myapp-green -n production --timeout=10m
    # Smoke tests on green
    - npm run test:smoke -- --url=https://green.example.com

    # Switch traffic to green
    - kubectl patch service myapp -n production -p '{"spec":{"selector":{"version":"green"}}}'

    # Monitor for 5 minutes
    - sleep 300

    # Scale down blue
    - kubectl scale deployment/myapp-blue --replicas=0 -n production
  environment:
    name: production
    url: https://example.com
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "production"
  retry:
    max: 2
    when:
      - script_failure

create-release:
  stage: deploy-production
  image: registry.gitlab.com/gitlab-org/release-cli:latest
  needs: [deploy-production]
  script:
    - echo "Creating release"
  release:
    tag_name: 'v$CI_PIPELINE_IID'
    description: |
      ## Release $CI_PIPELINE_IID

      **Environment**: Production
      **Deployed**: $CI_COMMIT_TIMESTAMP
      **Commit**: $CI_COMMIT_SHA

      ### Changes
      See merge request !$CI_MERGE_REQUEST_IID
  rules:
    - if: $CI_COMMIT_BRANCH == "production"

# Notify on deployment
notify-deployment:
  stage: deploy-production
  image: curlimages/curl:latest
  script:
    - |
      curl -X POST $SLACK_WEBHOOK \
        -H 'Content-Type: application/json' \
        -d "{
          \"text\": \"🚀 Production deployment successful\",
          \"attachments\": [{
            \"color\": \"good\",
            \"fields\": [
              {\"title\": \"Version\", \"value\": \"v$CI_PIPELINE_IID\", \"short\": true},
              {\"title\": \"Commit\", \"value\": \"$CI_COMMIT_SHORT_SHA\", \"short\": true},
              {\"title\": \"Pipeline\", \"value\": \"$CI_PIPELINE_URL\", \"short\": false}
            ]
          }]
        }"
  when: on_success
  rules:
    - if: $CI_COMMIT_BRANCH == "production"
```

---

### GitLab Flow Merge Workflow

**Creating a feature and deploying through environments**:

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature-new-dashboard

# 2. Develop feature with commits
git add .
git commit -m "feat(dashboard): add analytics widgets"
git push origin feature-new-dashboard

# 3. Create merge request to main
# (Triggers CI tests)

# 4. After approval and merge to main
# Automatically deploys to STAGING environment

# 5. Test in staging
# Run manual/exploratory tests

# 6. When ready for production, merge main → production
git checkout production
git pull origin production
git merge main
git push origin production

# Triggers PRODUCTION deployment (with manual approval gate)
```

---

## GitFlow with GitHub Actions

### Complete CI/CD Pipeline

**File**: `.github/workflows/cicd-pipeline.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
      - 'feature/**'
      - 'hotfix/**'
      - 'release/**'
  pull_request:
    branches:
      - main
      - develop

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Code Quality Checks
  code-quality:
    name: Code Quality & Linting
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for better analysis

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

      - name: Validate commit messages
        if: github.event_name == 'pull_request'
        run: |
          npm install -g @commitlint/cli @commitlint/config-conventional
          npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=${{ github.repository_owner }}_${{ github.event.repository.name }}
            -Dsonar.organization=${{ github.repository_owner }}

  # Job 2: Unit Tests
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: code-quality
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage --maxWorkers=2

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unit-tests-node-${{ matrix.node-version }}
          name: codecov-umbrella

      - name: Archive test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-node-${{ matrix.node-version }}
          path: |
            coverage/
            test-results/
          retention-days: 30

  # Job 3: Integration Tests
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
        run: npm run db:migrate

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
        run: npm run test:integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/integration/

  # Job 4: E2E Tests
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/heads/release/')
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox webkit

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-videos
          path: test-results/videos/

  # Job 5: Security Scanning
  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: NPM Audit
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: Secret scanning with Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Job 6: Build Docker Image
  build-image:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, security-scan]
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            VERSION=${{ github.ref_name }}
            COMMIT_SHA=${{ github.sha }}
            BUILD_DATE=${{ github.event.head_commit.timestamp }}

      - name: Scan Docker image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-image-results.sarif'

      - name: Upload image scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-image-results.sarif'

  # Job 7: Deploy to Staging (from develop branch)
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [e2e-tests, build-image]
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to ECS Staging
        run: |
          aws ecs update-service \
            --cluster staging-cluster \
            --service app-service \
            --force-new-deployment \
            --image ${{ needs.build-image.outputs.image-tag }}

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster staging-cluster \
            --services app-service

      - name: Run smoke tests
        run: |
          npm run test:smoke -- --env=staging

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # Job 8: Deploy to Production (from main branch)
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [e2e-tests, build-image]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Create database backup
        run: |
          aws rds create-db-snapshot \
            --db-instance-identifier production-db \
            --db-snapshot-identifier pre-deploy-$(date +%Y%m%d-%H%M%S)

      - name: Deploy to ECS Production (Blue-Green)
        run: |
          # Deploy to green environment
          aws ecs update-service \
            --cluster production-cluster \
            --service app-service-green \
            --force-new-deployment \
            --image ${{ needs.build-image.outputs.image-tag }}

          # Wait for green deployment to stabilize
          aws ecs wait services-stable \
            --cluster production-cluster \
            --services app-service-green

      - name: Run production smoke tests
        run: |
          npm run test:smoke -- --env=production-green

      - name: Switch traffic to green
        if: success()
        run: |
          # Update load balancer to point to green
          aws elbv2 modify-listener \
            --listener-arn ${{ secrets.PROD_LISTENER_ARN }} \
            --default-actions Type=forward,TargetGroupArn=${{ secrets.GREEN_TARGET_GROUP_ARN }}

      - name: Monitor metrics
        run: |
          sleep 300  # Monitor for 5 minutes
          ERROR_RATE=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/ApplicationELB \
            --metric-name HTTPCode_Target_5XX_Count \
            --dimensions Name=LoadBalancer,Value=production-lb \
            --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 300 \
            --statistics Sum \
            --query 'Datapoints[0].Sum' \
            --output text)

          if [ "$ERROR_RATE" -gt "10" ]; then
            echo "Error rate too high, initiating rollback"
            exit 1
          fi

      - name: Rollback on failure
        if: failure()
        run: |
          # Switch traffic back to blue
          aws elbv2 modify-listener \
            --listener-arn ${{ secrets.PROD_LISTENER_ARN }} \
            --default-actions Type=forward,TargetGroupArn=${{ secrets.BLUE_TARGET_GROUP_ARN }}

      - name: Create GitHub Release
        if: success()
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          body: |
            ## Changes
            ${{ github.event.head_commit.message }}

            **Commit**: ${{ github.sha }}
            **Deployed**: ${{ github.event.head_commit.timestamp }}
          draft: false
          prerelease: false

      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## GitLab CI/CD Pipeline

### Complete GitFlow Pipeline

**File**: `.gitlab-ci.yml`

```yaml
stages:
  - validate
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: '/certs'
  REGISTRY: registry.gitlab.com
  IMAGE_NAME: $CI_REGISTRY_IMAGE
  POSTGRES_DB: testdb
  POSTGRES_USER: testuser
  POSTGRES_PASSWORD: testpass

# Templates
.node_template: &node_template
  image: node:18-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/
  before_script:
    - npm ci --cache .npm --prefer-offline

.docker_template: &docker_template
  image: docker:24
  services:
    - docker:24-dind

# Stage 1: Validation
lint:
  <<: *node_template
  stage: validate
  script:
    - npm run lint
    - npm run format:check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH

commitlint:
  <<: *node_template
  stage: validate
  script:
    - npm install -g @commitlint/cli @commitlint/config-conventional
    - echo "$CI_COMMIT_MESSAGE" | commitlint
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH

code-quality:
  stage: validate
  image: sonarsource/sonar-scanner-cli:latest
  variables:
    SONAR_USER_HOME: '${CI_PROJECT_DIR}/.sonar'
    GIT_DEPTH: '0'
  cache:
    key: '${CI_JOB_NAME}'
    paths:
      - .sonar/cache
  script:
    - sonar-scanner
  allow_failure: true
  only:
    - merge_requests
    - develop
    - main

# Stage 2: Testing
unit-tests:
  <<: *node_template
  stage: test
  script:
    - npm run test:unit -- --coverage --maxWorkers=2
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    when: always
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 30 days

integration-tests:
  <<: *node_template
  stage: test
  services:
    - name: postgres:15
      alias: postgres
    - name: redis:7-alpine
      alias: redis
  variables:
    DATABASE_URL: postgresql://testuser:testpass@postgres:5432/testdb
    REDIS_URL: redis://redis:6379
  script:
    - npm run db:migrate
    - npm run test:integration
  artifacts:
    when: always
    paths:
      - test-results/integration/
    expire_in: 30 days

e2e-tests:
  <<: *node_template
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - npm ci
    - npm run build
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 30 days
  only:
    - develop
    - main
    - /^release\/.*/

# Security Scanning
dependency-scanning:
  stage: test
  image: node:18-alpine
  script:
    - npm audit --audit-level=high
    - npx snyk test --severity-threshold=high
  allow_failure: true

secret-scanning:
  stage: test
  image: zricethezav/gitleaks:latest
  script:
    - gitleaks detect --source . --verbose
  allow_failure: true

# Stage 3: Build
build-docker:
  <<: *docker_template
  stage: build
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      docker build \
        --build-arg VERSION=$CI_COMMIT_REF_NAME \
        --build-arg COMMIT_SHA=$CI_COMMIT_SHA \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --tag $IMAGE_NAME:$CI_COMMIT_SHA \
        --tag $IMAGE_NAME:$CI_COMMIT_REF_SLUG \
        .
    - docker push $IMAGE_NAME:$CI_COMMIT_SHA
    - docker push $IMAGE_NAME:$CI_COMMIT_REF_SLUG
    - |
      if [ "$CI_COMMIT_BRANCH" == "main" ]; then
        docker tag $IMAGE_NAME:$CI_COMMIT_SHA $IMAGE_NAME:latest
        docker push $IMAGE_NAME:latest
      fi
  only:
    - develop
    - main
    - /^release\/.*/
    - /^hotfix\/.*/

container-scanning:
  <<: *docker_template
  stage: build
  dependencies:
    - build-docker
  script:
    - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL $IMAGE_NAME:$CI_COMMIT_SHA
  allow_failure: true
  only:
    - develop
    - main

# Stage 4: Deploy Staging
deploy-staging:
  stage: deploy-staging
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - echo "Deploying to staging environment"
    - |
      curl -X POST $STAGING_DEPLOY_WEBHOOK \
        -H "Content-Type: application/json" \
        -d "{\"image\": \"$IMAGE_NAME:$CI_COMMIT_SHA\", \"environment\": \"staging\"}"
  environment:
    name: staging
    url: https://staging.example.com
    on_stop: stop-staging
  only:
    - develop

smoke-tests-staging:
  <<: *node_template
  stage: deploy-staging
  dependencies:
    - deploy-staging
  script:
    - npm run test:smoke -- --env=staging
  only:
    - develop

stop-staging:
  stage: deploy-staging
  script:
    - echo "Stopping staging environment"
  when: manual
  environment:
    name: staging
    action: stop
  only:
    - develop

# Stage 5: Deploy Production
deploy-production:
  stage: deploy-production
  image: alpine:latest
  before_script:
    - apk add --no-cache curl aws-cli
  script:
    - echo "Creating database backup"
    - aws rds create-db-snapshot --db-instance-identifier production-db --db-snapshot-identifier pre-deploy-$(date +%Y%m%d-%H%M%S)
    - echo "Deploying to production"
    - |
      curl -X POST $PRODUCTION_DEPLOY_WEBHOOK \
        -H "Content-Type: application/json" \
        -d "{\"image\": \"$IMAGE_NAME:$CI_COMMIT_SHA\", \"environment\": \"production\"}"
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main

smoke-tests-production:
  <<: *node_template
  stage: deploy-production
  dependencies:
    - deploy-production
  script:
    - npm run test:smoke -- --env=production
  only:
    - main

create-release:
  stage: deploy-production
  image: registry.gitlab.com/gitlab-org/release-cli:latest
  dependencies:
    - deploy-production
  script:
    - echo "Creating release"
  release:
    tag_name: 'v$CI_PIPELINE_IID'
    description: |
      Release $CI_COMMIT_REF_NAME

      Commit: $CI_COMMIT_SHA
      Pipeline: $CI_PIPELINE_URL
  only:
    - main
```

---

## Jenkins Pipeline (Jenkinsfile)

### Declarative Pipeline for GitFlow

**File**: `Jenkinsfile`

```groovy
pipeline {
    agent any

    environment {
        REGISTRY = 'docker.io'
        IMAGE_NAME = 'myorg/myapp'
        DOCKER_CREDENTIALS = credentials('docker-hub-credentials')
        SONAR_TOKEN = credentials('sonarqube-token')
        SLACK_WEBHOOK = credentials('slack-webhook-url')
    }

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['staging', 'production'], description: 'Deployment environment')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip test execution')
        booleanParam(name: 'FORCE_DEPLOY', defaultValue: false, description: 'Force deployment even if tests fail')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.BRANCH_NAME = env.GIT_BRANCH.replaceAll('origin/', '')
                }
            }
        }

        stage('Environment Setup') {
            steps {
                script {
                    // Determine deployment environment based on branch
                    if (env.BRANCH_NAME == 'main') {
                        env.DEPLOY_ENV = 'production'
                    } else if (env.BRANCH_NAME == 'develop') {
                        env.DEPLOY_ENV = 'staging'
                    } else {
                        env.DEPLOY_ENV = 'none'
                    }
                }
                sh '''
                    node --version
                    npm --version
                    docker --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint & Format Check') {
            steps {
                sh 'npm run lint'
                sh 'npm run format:check'
            }
        }

        stage('Commit Message Validation') {
            when {
                changeRequest()
            }
            steps {
                sh '''
                    npm install -g @commitlint/cli @commitlint/config-conventional
                    git log --format=%B -n 1 HEAD | commitlint
                '''
            }
        }

        stage('Unit Tests') {
            when {
                expression { !params.SKIP_TESTS }
            }
            steps {
                sh 'npm run test:unit -- --coverage --maxWorkers=2'
            }
            post {
                always {
                    junit 'junit.xml'
                    publishHTML([
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        stage('Integration Tests') {
            when {
                expression { !params.SKIP_TESTS }
            }
            steps {
                sh '''
                    docker-compose -f docker-compose.test.yml up -d
                    npm run db:migrate
                    npm run test:integration
                    docker-compose -f docker-compose.test.yml down
                '''
            }
        }

        stage('E2E Tests') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                    branch 'release/*'
                }
                expression { !params.SKIP_TESTS }
            }
            steps {
                sh '''
                    npm run build
                    npx playwright install --with-deps
                    npm run test:e2e
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
                }
            }
        }

        stage('Code Quality Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=myapp \
                          -Dsonar.sources=src \
                          -Dsonar.tests=tests \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Security Scanning') {
            parallel {
                stage('Dependency Audit') {
                    steps {
                        sh 'npm audit --audit-level=high || true'
                    }
                }
                stage('Secret Scanning') {
                    steps {
                        sh 'docker run --rm -v $(pwd):/repo zricethezav/gitleaks:latest detect --source /repo --verbose || true'
                    }
                }
                stage('SAST') {
                    steps {
                        sh 'npm run security:sast || true'
                    }
                }
            }
        }

        stage('Build Docker Image') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                    branch 'release/*'
                    branch 'hotfix/*'
                }
            }
            steps {
                script {
                    docker.withRegistry("https://${REGISTRY}", 'docker-hub-credentials') {
                        def customImage = docker.build(
                            "${IMAGE_NAME}:${GIT_COMMIT_SHORT}",
                            "--build-arg VERSION=${BRANCH_NAME} " +
                            "--build-arg COMMIT_SHA=${GIT_COMMIT} " +
                            "--build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') ."
                        )
                        customImage.push()
                        customImage.push(BRANCH_NAME.replaceAll('/', '-'))

                        if (env.BRANCH_NAME == 'main') {
                            customImage.push('latest')
                        }
                    }
                }
            }
        }

        stage('Container Security Scan') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                sh """
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy image \
                      --severity HIGH,CRITICAL \
                      ${IMAGE_NAME}:${GIT_COMMIT_SHORT}
                """
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh """
                        kubectl set image deployment/myapp \
                          myapp=${IMAGE_NAME}:${GIT_COMMIT_SHORT} \
                          -n staging

                        kubectl rollout status deployment/myapp -n staging --timeout=5m
                    """
                }
            }
            post {
                success {
                    sh 'npm run test:smoke -- --env=staging'
                }
            }
        }

        stage('Deploy to Production') {
            when {
                allOf {
                    branch 'main'
                    expression { params.FORCE_DEPLOY || currentBuild.result == 'SUCCESS' }
                }
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'

                script {
                    // Create database backup
                    sh 'aws rds create-db-snapshot --db-instance-identifier production-db --db-snapshot-identifier pre-deploy-$(date +%Y%m%d-%H%M%S)'

                    // Blue-green deployment
                    sh """
                        # Deploy to green
                        kubectl set image deployment/myapp-green \
                          myapp=${IMAGE_NAME}:${GIT_COMMIT_SHORT} \
                          -n production

                        kubectl rollout status deployment/myapp-green -n production --timeout=5m
                    """

                    // Smoke tests on green
                    sh 'npm run test:smoke -- --env=production-green'

                    // Switch traffic
                    sh 'kubectl patch service myapp -n production -p \'{"spec":{"selector":{"version":"green"}}}\''

                    // Wait and monitor
                    sleep 60

                    // Check error rates
                    def errorRate = sh(
                        script: './scripts/check-error-rate.sh production',
                        returnStdout: true
                    ).trim().toFloat()

                    if (errorRate > 5.0) {
                        error("Error rate ${errorRate}% exceeds threshold, rolling back")
                    }
                }
            }
            post {
                failure {
                    script {
                        // Rollback to blue
                        sh 'kubectl patch service myapp -n production -p \'{"spec":{"selector":{"version":"blue"}}}\''
                    }
                }
                success {
                    script {
                        // Create GitHub release
                        sh """
                            gh release create v${BUILD_NUMBER} \
                              --title "Release ${BUILD_NUMBER}" \
                              --notes "Deployed commit ${GIT_COMMIT}"
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            script {
                def message = """
                    ✅ Build Successful
                    Branch: ${env.BRANCH_NAME}
                    Commit: ${env.GIT_COMMIT_SHORT}
                    Build: ${env.BUILD_URL}
                """.stripIndent()

                sh """
                    curl -X POST ${SLACK_WEBHOOK} \
                      -H 'Content-Type: application/json' \
                      -d '{"text": "${message}"}'
                """
            }
        }
        failure {
            script {
                def message = """
                    ❌ Build Failed
                    Branch: ${env.BRANCH_NAME}
                    Commit: ${env.GIT_COMMIT_SHORT}
                    Build: ${env.BUILD_URL}
                """.stripIndent()

                sh """
                    curl -X POST ${SLACK_WEBHOOK} \
                      -H 'Content-Type: application/json' \
                      -d '{"text": "${message}"}'
                """
            }
        }
    }
}
```

---

## Azure DevOps Pipeline

### Multi-stage YAML Pipeline

**File**: `azure-pipelines.yml`

```yaml
trigger:
  branches:
    include:
      - main
      - develop
      - feature/*
      - release/*
      - hotfix/*

pr:
  branches:
    include:
      - main
      - develop

variables:
  - group: common-variables
  - name: dockerRegistryServiceConnection
    value: 'docker-hub-connection'
  - name: imageRepository
    value: 'myorg/myapp'
  - name: containerRegistry
    value: 'docker.io'
  - name: dockerfilePath
    value: '$(Build.SourcesDirectory)/Dockerfile'
  - name: tag
    value: '$(Build.BuildId)'
  - name: vmImageName
    value: 'ubuntu-latest'

stages:
  - stage: Build
    displayName: Build and Test
    jobs:
      - job: CodeQuality
        displayName: Code Quality Checks
        pool:
          vmImage: $(vmImageName)
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
            displayName: 'Install Node.js'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run lint
            displayName: 'Run linter'

          - script: npm run format:check
            displayName: 'Check formatting'

          - task: SonarCloudPrepare@1
            inputs:
              SonarCloud: 'SonarCloud'
              organization: 'myorg'
              scannerMode: 'CLI'
              configMode: 'manual'
              cliProjectKey: 'myapp'

          - task: SonarCloudAnalyze@1

          - task: SonarCloudPublish@1
            inputs:
              pollingTimeoutSec: '300'

      - job: UnitTests
        displayName: Unit Tests
        pool:
          vmImage: $(vmImageName)
        strategy:
          matrix:
            Node_16:
              node_version: 16.x
            Node_18:
              node_version: 18.x
            Node_20:
              node_version: 20.x
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(node_version)

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run test:unit -- --coverage
            displayName: 'Run unit tests'

          - task: PublishTestResults@2
            condition: succeededOrFailed()
            inputs:
              testRunner: JUnit
              testResultsFiles: '**/junit.xml'

          - task: PublishCodeCoverageResults@1
            inputs:
              codeCoverageTool: Cobertura
              summaryFileLocation: '$(System.DefaultWorkingDirectory)/**/*coverage.xml'

      - job: IntegrationTests
        displayName: Integration Tests
        dependsOn: UnitTests
        pool:
          vmImage: $(vmImageName)
        services:
          postgres:
            image: postgres:15
            env:
              POSTGRES_DB: testdb
              POSTGRES_USER: testuser
              POSTGRES_PASSWORD: testpass
            ports:
              - 5432:5432
          redis:
            image: redis:7-alpine
            ports:
              - 6379:6379
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run db:migrate
            displayName: 'Run migrations'
            env:
              DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

          - script: npm run test:integration
            displayName: 'Run integration tests'
            env:
              DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
              REDIS_URL: redis://localhost:6379

      - job: SecurityScan
        displayName: Security Scanning
        pool:
          vmImage: $(vmImageName)
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm audit --audit-level=high
            displayName: 'NPM Audit'
            continueOnError: true

          - task: WhiteSource@21
            inputs:
              cwd: '$(System.DefaultWorkingDirectory)'

      - job: BuildDocker
        displayName: Build Docker Image
        dependsOn:
          - UnitTests
          - IntegrationTests
          - SecurityScan
        condition: and(succeeded(), in(variables['Build.SourceBranch'], 'refs/heads/main', 'refs/heads/develop'))
        pool:
          vmImage: $(vmImageName)
        steps:
          - task: Docker@2
            displayName: Build and push image
            inputs:
              command: buildAndPush
              repository: $(imageRepository)
              dockerfile: $(dockerfilePath)
              containerRegistry: $(dockerRegistryServiceConnection)
              tags: |
                $(tag)
                $(Build.SourceBranchName)
                latest

  - stage: DeployStaging
    displayName: Deploy to Staging
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
    jobs:
      - deployment: DeployStaging
        displayName: Deploy to Staging
        pool:
          vmImage: $(vmImageName)
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebAppContainer@1
                  inputs:
                    azureSubscription: 'Azure-Subscription'
                    appName: 'myapp-staging'
                    containers: '$(containerRegistry)/$(imageRepository):$(tag)'

                - task: AzureCLI@2
                  displayName: 'Run smoke tests'
                  inputs:
                    azureSubscription: 'Azure-Subscription'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: 'npm run test:smoke -- --env=staging'

  - stage: DeployProduction
    displayName: Deploy to Production
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployProduction
        displayName: Deploy to Production
        pool:
          vmImage: $(vmImageName)
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureCLI@2
                  displayName: 'Create database backup'
                  inputs:
                    azureSubscription: 'Azure-Subscription'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      az sql db export \
                        --resource-group production-rg \
                        --server production-sql-server \
                        --name production-db \
                        --admin-user $(SQL_ADMIN_USER) \
                        --admin-password $(SQL_ADMIN_PASSWORD) \
                        --storage-key-type StorageAccessKey \
                        --storage-key $(STORAGE_KEY) \
                        --storage-uri https://backups.blob.core.windows.net/db-backups/pre-deploy-$(Build.BuildId).bacpac

                - task: AzureWebAppContainer@1
                  inputs:
                    azureSubscription: 'Azure-Subscription'
                    appName: 'myapp-production'
                    slotName: 'green'
                    containers: '$(containerRegistry)/$(imageRepository):$(tag)'

                - task: AzureCLI@2
                  displayName: 'Smoke tests on green slot'
                  inputs:
                    azureSubscription: 'Azure-Subscription'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: 'npm run test:smoke -- --env=production-green'

                - task: AzureAppServiceManage@0
                  displayName: 'Swap slots'
                  inputs:
                    azureSubscription: 'Azure-Subscription'
                    WebAppName: 'myapp-production'
                    ResourceGroupName: 'production-rg'
                    SourceSlot: 'green'
                    SwapWithProduction: true
```

---

## Pre-commit Hooks

### Comprehensive Pre-commit Configuration

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged
npx lint-staged

# Check for secrets
echo "🔒 Scanning for secrets..."
docker run --rm -v $(pwd):/repo zricethezav/gitleaks:latest detect --source /repo --verbose --no-git

# Check for large files
echo "📏 Checking file sizes..."
find . -type f -size +5M -not -path "./.git/*" -not -path "./node_modules/*" | while read file; do
    echo "⚠️  Large file detected: $file"
    echo "Please ensure this file should be committed."
    exit 1
done

# Verify tests pass
echo "🧪 Running tests..."
npm run test:unit -- --silent --bail

echo "✅ Pre-commit checks passed!"
```

**File**: `.husky/commit-msg`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "📝 Validating commit message..."

# Validate commit message format
npx --no-install commitlint --edit $1

# Check commit message length
commit_msg=$(cat "$1")
msg_length=${#commit_msg}

if [ $msg_length -lt 10 ]; then
    echo "❌ Commit message is too short (minimum 10 characters)"
    exit 1
fi

if [ $msg_length -gt 100 ]; then
    echo "⚠️  Commit message is longer than 100 characters. Consider making it more concise."
fi

echo "✅ Commit message validated!"
```

**File**: `.husky/pre-push`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."

# Get current branch
branch=$(git rev-parse --abbrev-ref HEAD)

# Prevent pushing to main/develop directly
if [ "$branch" = "main" ] || [ "$branch" = "develop" ]; then
    echo "❌ Direct push to $branch is not allowed!"
    echo "Please create a pull request instead."
    exit 1
fi

# Run full test suite
echo "🧪 Running full test suite..."
npm run test:all

# Check for untracked files
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    git status --short
fi

echo "✅ Pre-push checks passed!"
```

**File**: `package.json` (lint-staged configuration)

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests --passWithNoTests"
    ],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "*.{css,scss}": ["stylelint --fix", "prettier --write"]
  }
}
```

---

## Semantic Versioning Automation

### Automated Version Bumping and Changelog

**File**: `.releaserc.json`

```json
{
  "branches": [
    "main",
    {
      "name": "develop",
      "prerelease": "beta"
    },
    {
      "name": "release/*",
      "prerelease": "rc"
    }
  ],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [
          { "type": "feat", "release": "minor" },
          { "type": "fix", "release": "patch" },
          { "type": "perf", "release": "patch" },
          { "type": "revert", "release": "patch" },
          { "type": "docs", "release": false },
          { "type": "style", "release": false },
          { "type": "refactor", "release": "patch" },
          { "type": "test", "release": false },
          { "type": "build", "release": false },
          { "type": "ci", "release": false" },
          { "type": "chore", "release": false },
          { "scope": "no-release", "release": false }
        ],
        "parserOpts": {
          "noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"]
        }
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "preset": "conventionalcommits",
        "presetConfig": {
          "types": [
            { "type": "feat", "section": "🚀 Features" },
            { "type": "fix", "section": "🐛 Bug Fixes" },
            { "type": "perf", "section": "⚡ Performance" },
            { "type": "revert", "section": "⏪ Reverts" },
            { "type": "docs", "section": "📚 Documentation" },
            { "type": "style", "section": "💄 Styles", "hidden": true },
            { "type": "refactor", "section": "♻️ Refactoring" },
            { "type": "test", "section": "✅ Tests", "hidden": true },
            { "type": "build", "section": "🔧 Build", "hidden": true },
            { "type": "ci", "section": "👷 CI/CD", "hidden": true },
            { "type": "chore", "section": "🧹 Chores", "hidden": true }
          ]
        }
      }
    ],
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md",
        "changelogTitle": "# Changelog\n\nAll notable changes to this project will be documented in this file."
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": true,
        "tarballDir": "dist"
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    [
      "@semantic-release/github",
      {
        "assets": [
          { "path": "dist/*.tgz", "label": "Distribution" }
        ],
        "successComment": false,
        "failComment": false,
        "releasedLabels": ["released"]
      }
    ],
    [
      "@semantic-release/exec",
      {
        "verifyReleaseCmd": "echo ${nextRelease.version} > .version",
        "publishCmd": "./scripts/deploy.sh ${nextRelease.version}"
      }
    ]
  ]
}
```

**File**: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches:
      - main
      - develop

jobs:
  release:
    name: Semantic Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Verify tests pass
        run: npm test

      - name: Build
        run: npm run build

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

---

## Docker Multi-stage Build with CI

### Optimized Dockerfile for CI/CD

**File**: `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1

# Build arguments
ARG NODE_VERSION=18
ARG VERSION=unknown
ARG COMMIT_SHA=unknown
ARG BUILD_DATE=unknown

# ===========================
# Stage 1: Dependencies
# ===========================
FROM node:${NODE_VERSION}-alpine AS dependencies

WORKDIR /app

# Install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ===========================
# Stage 2: Build
# ===========================
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Run linting and tests
RUN npm run lint && \
    npm run test:unit && \
    npm run build

# ===========================
# Stage 3: Production
# ===========================
FROM node:${NODE_VERSION}-alpine AS production

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    tini \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package.json ./

# Add metadata labels
LABEL org.opencontainers.image.title="My Application" \
      org.opencontainers.image.description="Production-ready Node.js application" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${COMMIT_SHA}" \
      org.opencontainers.image.licenses="MIT"

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    VERSION=${VERSION} \
    COMMIT_SHA=${COMMIT_SHA}

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Switch to non-root user
USER nodejs

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/index.js"]
```

**File**: `.dockerignore`

```
# Dependencies
node_modules/
npm-debug.log*

# Testing
coverage/
test-results/
.nyc_output/

# Build
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Git
.git/
.gitignore
.gitattributes

# CI/CD
.github/
.gitlab-ci.yml
azure-pipelines.yml
Jenkinsfile

# Documentation
*.md
docs/

# Environment
.env*
!.env.example

# Misc
.DS_Store
Thumbs.db
```

---

## Automated Rollback Example

### Rollback Script with Health Checks

**File**: `scripts/deploy-with-rollback.sh`

```bash
#!/bin/bash

set -e

# Configuration
ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
NAMESPACE="production"
DEPLOYMENT_NAME="myapp"
HEALTH_CHECK_URL="https://api.example.com/health"
ERROR_THRESHOLD=5.0
MONITORING_DURATION=300  # 5 minutes

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create database backup
create_db_backup() {
    log_info "Creating database backup..."
    BACKUP_NAME="pre-deploy-$(date +%Y%m%d-%H%M%S)"

    aws rds create-db-snapshot \
        --db-instance-identifier production-db \
        --db-snapshot-identifier "$BACKUP_NAME"

    log_info "Database backup created: $BACKUP_NAME"
}

# Function to get current deployment
get_current_deployment() {
    kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" \
        -o jsonpath='{.spec.template.spec.containers[0].image}'
}

# Function to deploy new version
deploy_new_version() {
    local image=$1
    log_info "Deploying new version: $image"

    kubectl set image deployment/"$DEPLOYMENT_NAME" \
        "$DEPLOYMENT_NAME"="$image" \
        -n "$NAMESPACE"

    kubectl rollout status deployment/"$DEPLOYMENT_NAME" \
        -n "$NAMESPACE" \
        --timeout=5m
}

# Function to run health checks
run_health_checks() {
    log_info "Running health checks..."
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"

        response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL")

        if [ "$response" -eq 200 ]; then
            log_info "Health check passed!"
            return 0
        fi

        log_warn "Health check failed (HTTP $response), retrying in 10s..."
        sleep 10
        ((attempt++))
    done

    log_error "Health checks failed after $max_attempts attempts"
    return 1
}

# Function to get error rate from CloudWatch
get_error_rate() {
    local error_count=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/ApplicationELB \
        --metric-name HTTPCode_Target_5XX_Count \
        --dimensions Name=LoadBalancer,Value=production-lb \
        --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Sum \
        --query 'Datapoints[0].Sum' \
        --output text)

    local total_count=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/ApplicationELB \
        --metric-name RequestCount \
        --dimensions Name=LoadBalancer,Value=production-lb \
        --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Sum \
        --query 'Datapoints[0].Sum' \
        --output text)

    if [ "$total_count" -eq 0 ]; then
        echo "0"
    else
        echo "scale=2; ($error_count / $total_count) * 100" | bc
    fi
}

# Function to monitor deployment
monitor_deployment() {
    log_info "Monitoring deployment for $MONITORING_DURATION seconds..."
    local end_time=$((SECONDS + MONITORING_DURATION))

    while [ $SECONDS -lt $end_time ]; do
        local error_rate=$(get_error_rate)
        log_info "Current error rate: ${error_rate}%"

        if (( $(echo "$error_rate > $ERROR_THRESHOLD" | bc -l) )); then
            log_error "Error rate ${error_rate}% exceeds threshold ${ERROR_THRESHOLD}%"
            return 1
        fi

        sleep 30
    done

    log_info "Monitoring completed successfully"
    return 0
}

# Function to rollback deployment
rollback_deployment() {
    local previous_image=$1
    log_error "Rolling back to previous version: $previous_image"

    kubectl rollout undo deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE"

    kubectl rollout status deployment/"$DEPLOYMENT_NAME" \
        -n "$NAMESPACE" \
        --timeout=5m

    log_info "Rollback completed"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"Deployment $status\",
            \"attachments\": [{
                \"color\": \"$([ "$status" = "successful" ] && echo "good" || echo "danger")\",
                \"fields\": [
                    {
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    },
                    {
                        \"title\": \"Image\",
                        \"value\": \"$IMAGE_TAG\",
                        \"short\": true
                    },
                    {
                        \"title\": \"Details\",
                        \"value\": \"$message\",
                        \"short\": false
                    }
                ]
            }]
        }"
}

# Main deployment flow
main() {
    log_info "Starting deployment to $ENVIRONMENT"
    log_info "Image tag: $IMAGE_TAG"

    # Get current deployment for rollback
    PREVIOUS_IMAGE=$(get_current_deployment)
    log_info "Current deployment: $PREVIOUS_IMAGE"

    # Create database backup
    create_db_backup

    # Deploy new version
    if ! deploy_new_version "$IMAGE_TAG"; then
        log_error "Deployment failed"
        send_notification "failed" "Deployment failed during rollout"
        exit 1
    fi

    # Run health checks
    if ! run_health_checks; then
        log_error "Health checks failed"
        rollback_deployment "$PREVIOUS_IMAGE"
        send_notification "failed" "Health checks failed, rolled back to $PREVIOUS_IMAGE"
        exit 1
    fi

    # Monitor deployment
    if ! monitor_deployment; then
        log_error "Monitoring detected issues"
        rollback_deployment "$PREVIOUS_IMAGE"
        send_notification "failed" "Error rate exceeded threshold, rolled back to $PREVIOUS_IMAGE"
        exit 1
    fi

    log_info "Deployment completed successfully!"
    send_notification "successful" "Deployment completed and verified"
}

# Run main function
main
```

---

## Conclusion

These examples demonstrate production-ready CI/CD pipelines that integrate version control best practices with automated testing, security scanning, and deployment strategies. Key takeaways:

1. **GitFlow Integration**: Pipelines respect GitFlow branching model with environment-specific deployments
2. **Comprehensive Testing**: Multi-stage testing from unit to E2E ensures quality
3. **Security First**: Automated security scanning at multiple stages
4. **Automated Versioning**: Semantic versioning with automated changelog generation
5. **Safe Deployments**: Blue-green deployments with automated rollback
6. **Monitoring**: Continuous monitoring with automatic rollback on error thresholds

Adapt these examples to your specific technology stack and requirements while maintaining the core principles of quality, security, and reliability.
