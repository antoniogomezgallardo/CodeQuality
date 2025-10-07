# Continuous Integration (CI)

## Overview

Continuous Integration is a software development practice where team members integrate their work frequently - usually each person integrates at least daily, leading to multiple integrations per day. Each integration is verified by an automated build and automated tests to detect integration errors as quickly as possible.

## Purpose

- **Early bug detection**: Find and fix integration issues quickly
- **Reduce integration risk**: Small, frequent integrations are less risky
- **Improve software quality**: Automated testing catches defects early
- **Faster feedback**: Developers know immediately if changes break build
- **Accelerate delivery**: Always maintain a release-ready codebase

## CI Principles

### 1. Maintain a Single Source Repository

```bash
# All code in version control (Git)
git clone https://github.com/company/project.git
cd project
npm install
npm test
npm run build
```

### 2. Automate the Build

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test -- --coverage

      - name: Build application
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 3. Make Build Self-Testing

```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  }
}
```

### 4. Everyone Commits to Mainline Every Day

```markdown
**Best Practices:**
- Commit at least once per day
- Pull latest changes before pushing
- Fix broken builds immediately
- Use feature flags for incomplete work
```

### 5. Every Commit Triggers a Build

```yaml
# Automated CI pipeline triggers
on:
  push:  # Every push to main/develop
  pull_request:  # Every PR
  schedule:  # Nightly builds
    - cron: '0 2 * * *'  # 2 AM daily
```

### 6. Keep the Build Fast

```markdown
**Target Times:**
- Unit tests: < 5 minutes
- Integration tests: < 15 minutes
- Full CI pipeline: < 20 minutes

**Optimization Strategies:**
- Parallel test execution
- Incremental builds
- Test result caching
- Dependency caching
```

### 7. Test in a Clone of Production

```yaml
# Use production-like environment
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: testpass
  redis:
    image: redis:7
```

### 8. Make Build Results Visible

```markdown
**Visibility:**
- Build status badges on README
- Slack/Teams notifications
- Dashboard displays
- Email on failures
```

### 9. Automate Deployment

```yaml
# Deploy on successful main branch build
- name: Deploy to staging
  if: github.ref == 'refs/heads/main' && success()
  run: |
    npm run deploy:staging
```

### 10. Fix Broken Builds Immediately

```markdown
**Protocol:**
1. Build breaks → Stop committing new features
2. Team swarms to fix build
3. Revert commit if fix takes >10 minutes
4. Resume normal work once green
```

## CI Pipeline Stages

### Stage 1: Code Quality Checks

```yaml
code-quality:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Run linter
      run: npm run lint

    - name: Check formatting
      run: npm run format:check

    - name: Type check
      run: npm run type-check

    - name: Security audit
      run: npm audit --audit-level=high
```

### Stage 2: Unit Tests

```yaml
unit-tests:
  runs-on: ubuntu-latest
  steps:
    - name: Run unit tests
      run: npm run test:unit -- --coverage

    - name: Enforce coverage threshold
      run: |
        COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "Coverage $COVERAGE% is below 80%"
          exit 1
        fi
```

### Stage 3: Integration Tests

```yaml
integration-tests:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
    redis:
      image: redis:7

  steps:
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:password@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379
```

### Stage 4: Build

```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - name: Build application
      run: npm run build

    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-output
        path: dist/
```

### Stage 5: E2E Tests

```yaml
e2e-tests:
  runs-on: ubuntu-latest
  needs: build

  steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-output

    - name: Start application
      run: npm run start &

    - name: Wait for app
      run: npx wait-on http://localhost:3000

    - name: Run E2E tests
      run: npm run test:e2e
```

## CI Best Practices

### 1. Fast Feedback Loops

```yaml
# Run fast tests first
jobs:
  quick-checks:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint  # 30 seconds
      - run: npm run test:unit  # 2 minutes

  slow-tests:
    needs: quick-checks
    steps:
      - run: npm run test:integration  # 10 minutes
      - run: npm run test:e2e  # 15 minutes
```

### 2. Fail Fast

```yaml
# Stop on first failure
jobs:
  test:
    strategy:
      fail-fast: true
      matrix:
        node: [16, 18, 20]
```

### 3. Parallel Execution

```yaml
# Run tests in parallel
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npm test -- --shard=${{ matrix.shard }}/4
```

### 4. Cache Dependencies

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 5. Environment Parity

```yaml
# Use Docker for consistent environments
services:
  app:
    image: node:18
  database:
    image: postgres:15
  cache:
    image: redis:7
```

## CI Metrics

```javascript
const ciMetrics = {
  // Build success rate
  buildSuccessRate: 92, // % (target: >90%)

  // Average build time
  avgBuildTime: 12, // minutes (target: <15 min)

  // Time to fix broken build
  meanTimeToRecover: 25, // minutes (target: <30 min)

  // Builds per day
  buildsPerDay: 45, // (healthy CI: 20-50+)

  // Flaky test rate
  flakyTestRate: 2 // % (target: <5%)
};
```

## Related Resources

- [Build Automation](build-automation.md)
- [Continuous Delivery](continuous-delivery.md)
- [Testing Strategy](../04-testing-strategy/README.md)
- [Version Control](../03-version-control/README.md)

## References

- Martin Fowler - Continuous Integration
- DORA - CI/CD Capabilities
- Google - Site Reliability Engineering

---

*Part of: [CI/CD Pipeline](README.md)*
