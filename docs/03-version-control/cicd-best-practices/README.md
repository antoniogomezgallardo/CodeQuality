# Version Control Best Practices for CI/CD

## Overview

This document outlines best practices for integrating version control with Continuous Integration (CI) and Continuous Delivery/Deployment (CD) pipelines, aligned with industry standards and modern DevOps methodologies.

## Table of Contents

1. [Branch Strategy for CI/CD](#branch-strategy-for-cicd)
2. [Commit Standards](#commit-standards)
3. [Pull Request Workflow](#pull-request-workflow)
4. [Automated Testing in CI](#automated-testing-in-ci)
5. [Version Tagging and Releases](#version-tagging-and-releases)
6. [Environment-Specific Configurations](#environment-specific-configurations)
7. [Security Best Practices](#security-best-practices)
8. [Pipeline Triggers and Conditions](#pipeline-triggers-and-conditions)
9. [Artifact Management](#artifact-management)
10. [Rollback Strategies](#rollback-strategies)

---

## Branch Strategy for CI/CD

Choosing the right branching strategy is crucial for effective CI/CD. This section covers the three most popular strategies optimized for continuous delivery.

### Comparison: GitFlow vs GitHub Flow vs GitLab Flow vs Trunk-Based Development

| Aspect | GitFlow | GitHub Flow | GitLab Flow | Trunk-Based Development |
|--------|---------|-------------|-------------|------------------------|
| **Complexity** | High | Low | Medium | Low |
| **Best For** | Scheduled releases, multiple versions | Continuous deployment, web apps | Environment-based deployments | High-maturity teams, continuous deployment |
| **Release Cadence** | Planned releases | Continuous | Environment-based | Continuous |
| **Branch Lifespan** | Long-lived (develop, main) | Short-lived (hours to days) | Medium (environment branches) | Very short (hours) |
| **Learning Curve** | Steep | Gentle | Moderate | Moderate |
| **Team Size** | Large teams | Small to medium | Medium to large | Any size (requires discipline) |
| **CI/CD Friendliness** | Medium | High | Very High | Highest |
| **Merge Frequency** | Lower | High | High | Very High |

---

### 1. Trunk-Based Development (TBD) - Recommended for CI/CD

**Overview**: Developers collaborate on a single branch (trunk/main) with very short-lived feature branches or direct commits.

**Why TBD is Best for CI/CD**:
- ✅ Minimizes merge conflicts
- ✅ Fastest feedback loops
- ✅ Simplest branching model
- ✅ Encourages small, incremental changes
- ✅ Highest deployment frequency (DORA metric)
- ✅ Reduces integration issues

#### Branch Structure

**Main/Trunk Branch**
- **Purpose**: Single source of truth, always deployable
- **CI/CD Behavior**:
  - Every commit triggers full CI pipeline
  - Automated tests (unit, integration, E2E)
  - Automatic deployment to production (with feature flags)
  - Progressive rollout (canary/blue-green)
- **Protection Rules**:
  - Require pull request reviews (1-2 approvers)
  - All status checks must pass
  - No force pushes
  - Require signed commits

**Short-Lived Feature Branches** (optional)
- **Purpose**: Isolate work in progress (< 1-2 days)
- **Naming**: `feature/user-authentication` or `fix/login-bug`
- **CI/CD Behavior**:
  - Run unit tests and linting
  - Build verification
  - Preview environment deployment (optional)
- **Lifecycle**:
  - Created from `main`
  - Merged back to `main` within 1-2 days
  - Deleted immediately after merge

**Release Branches** (for releases requiring support)
- **Purpose**: Support production releases (optional)
- **Naming**: `release/v2.x`
- **CI/CD Behavior**:
  - Cherry-pick critical fixes
  - Deploy to production for specific versions
- **Lifecycle**: Long-lived only for supported versions

#### Key Practices

**Feature Flags (Feature Toggles)**:
```javascript
// Example: Feature flag implementation
if (featureFlags.isEnabled('new-checkout-flow')) {
  return <NewCheckoutFlow />;
} else {
  return <LegacyCheckoutFlow />;
}
```

**Continuous Integration**:
- Commit to main at least once per day
- Run all tests on every commit
- Keep build times under 10 minutes
- Automated code review (linting, security scans)

**Deployment Strategy**:
```yaml
# Every commit to main deploys to production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy with feature flags
        run: |
          ./deploy.sh --strategy=canary --percentage=10
          ./monitor.sh --duration=15m
          ./deploy.sh --strategy=canary --percentage=100
```

---

### 2. GitHub Flow - Simple and Effective

**Overview**: A simplified workflow with only feature branches and main. Perfect for continuous deployment.

**Why GitHub Flow Works for CI/CD**:
- ✅ Simple to understand and implement
- ✅ Fast iteration cycles
- ✅ Everything in main is deployable
- ✅ Encourages code review
- ✅ Well-suited for web applications

#### Branch Structure

**Main Branch**
- **Purpose**: Production-ready code, always deployable
- **CI/CD Behavior**:
  - Automatic deployment to production on merge
  - Full test suite execution
  - Security and vulnerability scanning
  - Automated release tagging
- **Protection Rules**:
  - Require pull request reviews (1-2 approvers)
  - Require status checks to pass
  - No direct commits allowed
  - No force pushes

**Feature Branches**
- **Purpose**: New features, bug fixes, experiments
- **Naming**: `add-user-authentication`, `fix-payment-bug`, `refactor-api`
- **CI/CD Behavior**:
  - Run unit and integration tests
  - Build verification
  - Deploy to preview environment
  - Security scanning
- **Lifecycle**:
  - Created from `main`
  - Merged back to `main` via pull request
  - Deleted after merge

#### Workflow

1. **Create branch** from main
2. **Add commits** with descriptive messages
3. **Open pull request** for discussion
4. **Deploy** to preview environment for testing
5. **Code review** by teammates
6. **Merge** to main after approval
7. **Automatic deployment** to production
8. **Delete** feature branch

#### GitHub Flow CI/CD Pipeline

```yaml
# Feature branch pipeline
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test

  deploy-preview:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to preview
        run: ./deploy-preview.sh ${{ github.head_ref }}

# Production deployment on merge
on:
  push:
    branches: [main]

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy-production.sh
```

---

### 3. GitLab Flow - Environment-Based Deployment

**Overview**: Combines feature branches with environment branches (staging, production). Ideal for teams with multiple deployment environments.

**Why GitLab Flow Works for CI/CD**:
- ✅ Clear environment progression
- ✅ Matches deployment pipeline stages
- ✅ Supports multiple environments naturally
- ✅ Balances simplicity with control
- ✅ Good for both continuous delivery and deployment

#### Branch Structure

**Main Branch**
- **Purpose**: Staging/pre-production code
- **CI/CD Behavior**:
  - Automatic deployment to staging environment
  - Full test suite execution
  - Integration and E2E testing
  - Performance testing
- **Protection Rules**:
  - Require pull request reviews
  - All tests must pass
  - No force pushes

**Production Branch**
- **Purpose**: Production-ready code
- **CI/CD Behavior**:
  - Automatic deployment to production
  - Smoke tests and health checks
  - Automated monitoring and alerting
- **Protection Rules**:
  - Require manual approval for merges from main
  - All tests must pass
  - Automated rollback on failure

**Environment Branches** (optional)
- `pre-production`: Pre-prod environment
- `staging`: Staging environment
- Custom environment branches as needed

**Feature Branches**
- **Purpose**: New features and bug fixes
- **Naming**: `feature-user-auth`, `bugfix-login-error`
- **CI/CD Behavior**:
  - Run unit and integration tests
  - Code quality checks
  - Security scanning
- **Lifecycle**:
  - Created from `main`
  - Merged to `main` via merge request
  - Deleted after merge

#### Workflow

1. **Create feature branch** from main
2. **Develop and commit** changes
3. **Open merge request** to main
4. **Automated tests** run on feature branch
5. **Code review** and approval
6. **Merge to main** → Deploys to staging
7. **Test in staging** environment
8. **Merge main to production** → Deploys to production

#### GitLab Flow CI/CD Pipeline

```yaml
stages:
  - test
  - deploy-staging
  - deploy-production

# Test stage (all branches)
test:
  stage: test
  script:
    - npm test
    - npm run lint
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
    - if: '$CI_COMMIT_BRANCH == "production"'

# Deploy to staging (main branch)
deploy-staging:
  stage: deploy-staging
  script:
    - ./deploy.sh staging
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - main

# Deploy to production (production branch)
deploy-production:
  stage: deploy-production
  script:
    - ./deploy.sh production
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - production
```

---

### 4. GitFlow (Traditional) - For Scheduled Releases

**⚠️ Note**: While GitFlow is comprehensive, it's generally **NOT recommended for teams practicing continuous deployment**. It's best suited for projects with scheduled releases and multiple supported versions.

#### When to Use GitFlow

- ✅ Scheduled release cycles (monthly, quarterly)
- ✅ Multiple versions in production requiring support
- ✅ Large teams with defined release managers
- ✅ Complex release processes with extensive QA

#### When NOT to Use GitFlow

- ❌ Continuous deployment to production
- ❌ Small teams (< 10 developers)
- ❌ Web applications with single production version
- ❌ Teams new to version control

#### Branch Structure (Brief Overview)

**Main Branches**:
- `main`: Production releases only
- `develop`: Integration branch

**Supporting Branches**:
- `feature/*`: New features (from develop)
- `release/*`: Release preparation (from develop)
- `hotfix/*`: Production fixes (from main)

**CI/CD Considerations**:
- Longer feedback loops due to develop → release → main flow
- More complex merge strategies
- Higher risk of merge conflicts
- Slower deployment frequency

For full GitFlow details, see [GitFlow documentation](https://nvie.com/posts/a-successful-git-branching-model/).

---

### Choosing the Right Strategy for Your Team

#### Choose **Trunk-Based Development** if:
- ✅ You want the highest deployment frequency
- ✅ Your team has mature testing practices
- ✅ You can implement feature flags
- ✅ You practice continuous deployment
- ✅ You want to optimize for DORA metrics

#### Choose **GitHub Flow** if:
- ✅ You want simplicity and speed
- ✅ You deploy to production frequently (daily)
- ✅ Your team is small to medium sized
- ✅ You have a single production environment
- ✅ You practice continuous deployment

#### Choose **GitLab Flow** if:
- ✅ You have multiple environments (dev, staging, prod)
- ✅ You need environment-specific branches
- ✅ You want controlled progression between environments
- ✅ You practice continuous delivery (not deployment)
- ✅ You need manual approval gates

#### Choose **GitFlow** if:
- ✅ You have scheduled releases (not continuous)
- ✅ You maintain multiple production versions
- ✅ You have a dedicated release management team
- ✅ You need extensive QA cycles before release

---

### Migration Strategies

#### From GitFlow to Trunk-Based Development

1. **Phase 1**: Reduce feature branch lifespan to < 3 days
2. **Phase 2**: Implement feature flags for incomplete features
3. **Phase 3**: Merge develop into main, use main as trunk
4. **Phase 4**: Eliminate long-lived branches
5. **Phase 5**: Increase deployment frequency

#### From GitFlow to GitHub Flow

1. Keep `main` as production branch
2. Remove `develop` branch
3. Merge all feature branches directly to `main`
4. Implement automated deployment from `main`
5. Remove release branches (use tags instead)

#### From GitHub Flow to GitLab Flow

1. Rename `main` to `staging`
2. Create `production` branch from `staging`
3. Implement environment-based deployments
4. Add approval gates for production deployments

---

## Commit Standards

### Conventional Commits

Use the [Conventional Commits](https://www.conventionalcommits.org/) specification for automated changelog generation and semantic versioning:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

- `feat`: New feature (triggers MINOR version bump)
- `fix`: Bug fix (triggers PATCH version bump)
- `docs`: Documentation changes
- `style`: Code formatting (no code change)
- `refactor`: Code restructuring without changing behavior
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks
- `revert`: Reverting previous commits

#### Breaking Changes

- Add `BREAKING CHANGE:` in footer or `!` after type
- Triggers MAJOR version bump
- Example: `feat!: redesign API authentication`

#### Examples

```
feat(auth): add OAuth2 social login support

Implement Google and GitHub OAuth2 providers with PKCE flow.
Includes user profile synchronization and automatic account linking.

Closes #234

BREAKING CHANGE: OAuth tokens now expire after 1 hour instead of 24 hours
```

```
fix(payment): resolve race condition in transaction processing

Add database transaction locks to prevent duplicate charges
when users submit payment multiple times rapidly.

Fixes #567
```

### Commit Message Automation

**Pre-commit Hooks** (using Husky + Commitlint):
```json
{
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-commit": "lint-staged"
    }
  }
}
```

**CI Commit Validation**:
```yaml
- name: Validate Commit Messages
  run: |
    npm install -g @commitlint/cli @commitlint/config-conventional
    commitlint --from=HEAD~1 --to=HEAD --verbose
```

---

## Pull Request Workflow

### PR Creation Standards

**Title Format**: Follow conventional commit format
```
feat(component): Brief description of changes
```

**Description Template**:
```markdown
## Summary
Brief description of what this PR does and why.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #123
Related to #456

## Testing Performed
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review performed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged

## Screenshots (if applicable)
```

### Automated PR Checks

**Status Checks Required**:
1. **Build Success**: Code compiles without errors
2. **Test Coverage**: Minimum 80% coverage maintained
3. **Linting**: No linting errors
4. **Security Scan**: No high/critical vulnerabilities
5. **Code Quality**: Maintainability rating A or B
6. **Performance**: No significant performance regression

**Automated Code Review** (GitHub Actions example):
```yaml
name: PR Checks
on: [pull_request]

jobs:
  automated-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Code Quality Analysis
        uses: sonarsource/sonarcloud-github-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
```

### Review Process

**Approval Requirements**:
- Minimum reviewers based on change risk:
  - Low risk: 1 approval
  - Medium risk: 2 approvals
  - High risk: 3 approvals + architect review

**CODEOWNERS Integration**:
```
# Require specific team approvals for critical paths
/src/auth/**           @security-team
/infrastructure/**     @devops-team
/database/migrations/** @database-team
```

---

## Automated Testing in CI

### Testing Pyramid in CI/CD

```
        /\
       /E2E\         <- Slow, expensive (run on develop/main)
      /------\
     /Integration\   <- Medium speed (run on all branches)
    /------------\
   /  Unit Tests  \  <- Fast, cheap (run on every commit)
  /----------------\
```

### Test Execution Strategy by Branch

**Feature Branches**:
```yaml
tests:
  - unit_tests:
      coverage_threshold: 80%
      parallel: true
  - integration_tests:
      subset: changed_modules_only
  - lint_and_format:
      auto_fix: false
```

**Develop Branch**:
```yaml
tests:
  - unit_tests:
      coverage_threshold: 85%
  - integration_tests:
      scope: full_suite
  - e2e_tests:
      scope: critical_paths
  - performance_tests:
      baseline_comparison: true
```

**Release/Main Branches**:
```yaml
tests:
  - unit_tests:
      coverage_threshold: 90%
  - integration_tests:
      scope: full_suite
  - e2e_tests:
      scope: full_suite
      browsers: [chrome, firefox, safari, edge]
  - performance_tests:
      load_testing: true
  - security_tests:
      penetration_testing: true
  - accessibility_tests:
      wcag_level: AA
```

### Test Reporting and Quality Gates

**Fail-Fast Strategy**:
1. Run linting first (fastest failure detection)
2. Run unit tests in parallel
3. Run integration tests only if unit tests pass
4. Run E2E tests only if integration tests pass

**Test Results Artifacts**:
- JUnit XML reports for test results
- Code coverage reports (Cobertura, LCOV)
- Performance benchmarks (JSON)
- Screenshots/videos for failed E2E tests

**Quality Gates** (SonarQube example):
```yaml
quality_gates:
  coverage: >= 80%
  duplications: <= 3%
  maintainability_rating: >= A
  reliability_rating: >= A
  security_rating: >= A
  security_hotspots_reviewed: 100%
```

---

## Version Tagging and Releases

### Semantic Versioning (SemVer)

Follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH (e.g., 2.3.1)
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

**Pre-release Versions**:
- `1.0.0-alpha.1`: Alpha release
- `1.0.0-beta.2`: Beta release
- `1.0.0-rc.3`: Release candidate

### Automated Version Bumping

**Using semantic-release**:
```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/git"
  ]
}
```

**Version Detection Rules**:
- `feat:` commits → MINOR version bump
- `fix:` commits → PATCH version bump
- `BREAKING CHANGE:` → MAJOR version bump
- No relevant commits → No release

### Git Tag Strategy

**Tag Format**:
```bash
# Production releases
v1.2.3

# Pre-release tags
v1.2.3-beta.1
v1.2.3-rc.2

# Build metadata (not used for version comparison)
v1.2.3+build.20240106
```

**Automated Tagging in CI**:
```yaml
- name: Create Git Tag
  if: github.ref == 'refs/heads/main'
  run: |
    VERSION=$(node -p "require('./package.json').version")
    git tag -a "v${VERSION}" -m "Release v${VERSION}"
    git push origin "v${VERSION}"
```

### Release Notes Generation

**Automated Changelog**:
```yaml
- name: Generate Changelog
  uses: conventional-changelog/standard-version@latest
  with:
    release-as: minor

- name: Create GitHub Release
  uses: actions/create-release@v1
  with:
    tag_name: ${{ github.ref }}
    release_name: Release ${{ github.ref }}
    body_path: CHANGELOG.md
    draft: false
    prerelease: false
```

**Changelog Categories**:
- 🚀 Features
- 🐛 Bug Fixes
- 📚 Documentation
- ⚡ Performance
- 🔒 Security
- 💥 Breaking Changes

---

## Environment-Specific Configurations

### Environment Strategy

**Environment Tiers**:
1. **Development** (`dev`): Individual developer environments
2. **Integration** (`int`): Continuous integration testing
3. **Staging** (`staging`): Pre-production testing
4. **Production** (`prod`): Live environment

### Configuration Management

**Environment Variables in CI/CD**:

```yaml
# DO NOT commit secrets to repository
# Use CI/CD platform's secret management

env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
  API_KEY: ${{ secrets.PROD_API_KEY }}
  AWS_REGION: us-east-1
```

**Configuration Files Strategy**:

```
config/
├── default.yml           # Default configuration
├── development.yml       # Development overrides
├── staging.yml          # Staging overrides
├── production.yml       # Production overrides (no secrets!)
└── .env.example         # Template for local .env
```

**Secret Management Best Practices**:
1. Never commit secrets to version control
2. Use CI/CD platform secrets (GitHub Secrets, GitLab CI Variables)
3. Use external secret management (AWS Secrets Manager, HashiCorp Vault)
4. Rotate secrets regularly
5. Audit secret access

**Example: Environment-Specific Deployments**:
```yaml
deploy:
  staging:
    branch: develop
    environment: staging
    url: https://staging.example.com

  production:
    branch: main
    environment: production
    url: https://example.com
    manual_approval: true
```

---

## Security Best Practices

### Commit Security

**Prevent Secret Commits**:

**Pre-commit Hook** (using git-secrets):
```bash
# Install git-secrets
git secrets --install
git secrets --register-aws

# Scan for secrets before commit
git secrets --scan
```

**CI Secret Scanning**:
```yaml
- name: Secret Scanning
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: main
    head: HEAD
```

### Dependency Security

**Automated Dependency Scanning**:
```yaml
- name: Dependency Check
  uses: dependency-check/Dependency-Check_Action@main
  with:
    project: 'project-name'
    path: '.'
    format: 'HTML'

- name: NPM Audit
  run: npm audit --audit-level=high

- name: Snyk Security Scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**Automated Dependency Updates**:
- Use Dependabot or Renovate Bot
- Configure automatic PR creation for security updates
- Enable auto-merge for patch updates after tests pass

### Code Signing

**Sign Commits**:
```bash
# Configure GPG signing
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_GPG_KEY_ID

# Enforce in CI
- name: Verify Signed Commits
  run: |
    git verify-commit HEAD || exit 1
```

**Sign Container Images**:
```yaml
- name: Sign Container Image
  uses: sigstore/cosign-installer@main

- name: Sign with Cosign
  run: |
    cosign sign --key cosign.key ${{ env.IMAGE_NAME }}:${{ env.VERSION }}
```

### Branch Protection Security

**Required Security Checks**:
- Dependency vulnerability scan passed
- Container image scan passed (no CRITICAL vulnerabilities)
- SAST (Static Application Security Testing) passed
- DAST (Dynamic Application Security Testing) passed (for staging/prod)
- License compliance check passed

---

## Pipeline Triggers and Conditions

### Event-Based Triggers

**Push Events**:
```yaml
on:
  push:
    branches:
      - main
      - develop
      - 'feature/**'
      - 'hotfix/**'
    paths:
      - 'src/**'
      - 'tests/**'
      - 'package.json'
    tags:
      - 'v*.*.*'
```

**Pull Request Events**:
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main
      - develop
```

**Schedule-Based Triggers**:
```yaml
on:
  schedule:
    # Run nightly build at 2 AM UTC
    - cron: '0 2 * * *'
```

**Manual Triggers**:
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - staging
          - production
      version:
        description: 'Version to deploy'
        required: true
```

### Conditional Execution

**Path-Based Conditions**:
```yaml
jobs:
  frontend-tests:
    if: contains(github.event.head_commit.modified, 'frontend/')
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  backend-tests:
    if: contains(github.event.head_commit.modified, 'backend/')
    runs-on: ubuntu-latest
    steps:
      - run: mvn test
```

**Branch-Based Conditions**:
```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to Staging
        run: ./deploy.sh staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: ./deploy.sh production
```

**Status-Based Conditions**:
```yaml
jobs:
  integration-tests:
    needs: unit-tests
    if: success()

  notify-failure:
    needs: [unit-tests, integration-tests]
    if: failure()
    steps:
      - name: Send Slack Notification
        run: ./notify-slack.sh "Build failed!"
```

---

## Artifact Management

### Build Artifacts

**Artifact Types**:
- Compiled binaries
- Container images
- NPM packages
- JAR/WAR files
- Static site bundles
- Test reports
- Code coverage reports

**Artifact Storage Strategy**:

```yaml
- name: Build Application
  run: npm run build

- name: Upload Build Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: build-artifacts-${{ github.sha }}
    path: |
      dist/
      build/
    retention-days: 30

- name: Download Artifacts
  uses: actions/download-artifact@v3
  with:
    name: build-artifacts-${{ github.sha }}
```

### Container Image Management

**Multi-Stage Builds**:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

**Image Tagging Strategy**:
```yaml
tags:
  - latest                           # Latest build from main
  - ${{ github.sha }}               # Commit SHA (immutable)
  - v${{ env.VERSION }}             # Semantic version
  - ${{ github.ref_name }}          # Branch name
  - build-${{ github.run_number }}  # Build number
```

**Image Registry Best Practices**:
- Use private registries for proprietary code
- Implement image scanning before push
- Use multi-architecture images (amd64, arm64)
- Configure lifecycle policies to clean old images
- Enable vulnerability scanning on registry

### Artifact Versioning

**Version Manifest**:
```json
{
  "version": "1.2.3",
  "commit": "a1b2c3d4e5f6",
  "branch": "main",
  "buildNumber": "142",
  "buildTimestamp": "2024-01-06T12:34:56Z",
  "artifacts": {
    "frontend": "frontend-1.2.3.tar.gz",
    "backend": "backend-1.2.3.jar",
    "docker": "myapp:1.2.3"
  }
}
```

---

## Rollback Strategies

### Version Control Rollback

**Git Revert** (Recommended):
```bash
# Revert last commit (creates new commit)
git revert HEAD

# Revert specific commit
git revert a1b2c3d

# Revert without committing (for multiple reverts)
git revert --no-commit HEAD~3..HEAD
```

**Git Reset** (Use with caution):
```bash
# Soft reset (keep changes staged)
git reset --soft HEAD~1

# Hard reset (discard all changes) - DANGEROUS
git reset --hard HEAD~1
```

### Deployment Rollback

**Blue-Green Deployment**:
```yaml
deploy:
  blue_green:
    - name: Deploy to Green
      run: ./deploy.sh green

    - name: Run Smoke Tests
      run: ./smoke-tests.sh green

    - name: Switch Traffic to Green
      if: success()
      run: ./switch-traffic.sh green

    - name: Rollback to Blue
      if: failure()
      run: ./switch-traffic.sh blue
```

**Canary Deployment with Rollback**:
```yaml
- name: Deploy Canary (10%)
  run: ./deploy-canary.sh 10%

- name: Monitor Metrics
  run: ./monitor.sh --duration=15m

- name: Rollback Canary
  if: failure()
  run: ./rollback-canary.sh

- name: Promote Canary
  if: success()
  run: ./promote-canary.sh 100%
```

### Database Rollback

**Migration Rollback Strategy**:
```yaml
- name: Backup Database
  run: ./backup-db.sh

- name: Run Migrations
  run: ./migrate.sh up

- name: Verify Migration
  run: ./verify-db.sh

- name: Rollback Migration
  if: failure()
  run: |
    ./migrate.sh down
    ./restore-db.sh latest-backup
```

**Backward Compatible Migrations**:
1. **Phase 1**: Add new column (nullable)
2. **Deploy**: Application handles both old and new schema
3. **Phase 2**: Backfill data
4. **Phase 3**: Make column required
5. **Phase 4**: Remove old column (after verification)

### Automated Rollback Triggers

**Health Check Monitoring**:
```yaml
- name: Deploy to Production
  run: ./deploy.sh production

- name: Health Check Loop
  run: |
    for i in {1..10}; do
      if ! ./health-check.sh; then
        echo "Health check failed, rolling back"
        ./rollback.sh
        exit 1
      fi
      sleep 30
    done
```

**Error Rate Monitoring**:
```yaml
- name: Monitor Error Rates
  run: |
    ERROR_RATE=$(./get-error-rate.sh)
    if (( $(echo "$ERROR_RATE > 5.0" | bc -l) )); then
      echo "Error rate ${ERROR_RATE}% exceeds threshold, rolling back"
      ./rollback.sh
      exit 1
    fi
```

---

## Best Practices Summary

### Commit Level
✅ Use conventional commits
✅ Sign commits with GPG
✅ Keep commits atomic and focused
✅ Write descriptive commit messages
✅ Scan for secrets before committing

### Branch Level
✅ Follow GitFlow or trunk-based development consistently
✅ Use descriptive branch names with ticket IDs
✅ Keep feature branches short-lived (< 3 days)
✅ Rebase feature branches regularly
✅ Delete merged branches

### Pull Request Level
✅ Require code reviews (minimum 1-2 approvers)
✅ Use PR templates
✅ Run automated checks before review
✅ Keep PRs small (< 400 lines of code)
✅ Link PRs to issues/tickets

### CI Pipeline Level
✅ Fail fast (run quick checks first)
✅ Run tests in parallel when possible
✅ Cache dependencies to speed up builds
✅ Use matrix builds for multi-platform support
✅ Store test results and coverage reports

### CD Pipeline Level
✅ Separate staging and production environments
✅ Require manual approval for production
✅ Implement blue-green or canary deployments
✅ Automate rollback procedures
✅ Monitor deployments with health checks

### Security Level
✅ Scan for vulnerabilities in dependencies
✅ Never commit secrets to repository
✅ Use secret management tools
✅ Sign container images
✅ Implement SAST and DAST scanning

### Monitoring Level
✅ Track DORA metrics (deployment frequency, lead time, MTTR, change failure rate)
✅ Monitor pipeline success rates
✅ Alert on failed deployments
✅ Analyze build times and optimize
✅ Review security scan results regularly

---

## References

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitFlow Workflow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)
- [DORA DevOps Metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)

---

## Related Documentation

- [Version Control Overview](../README.md)
- [GitFlow Methodology](../gitflow-methodology.md)
- [CI/CD Pipeline Documentation](../../08-cicd-pipeline/README.md)
- [Testing Strategy](../../04-testing-strategy/README.md)
- [Security Best Practices](../../06-quality-attributes/README.md)
