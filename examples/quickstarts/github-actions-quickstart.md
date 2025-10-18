# GitHub Actions Quick Start

**Time:** 5 minutes
**Prerequisites:** GitHub account, Git repository
**What You'll Learn:** Set up CI/CD with GitHub Actions and run automated tests

## 1. Install (30 seconds)

No installation needed! GitHub Actions runs in the cloud.

```bash
# Ensure you have a GitHub repository
git init
git remote add origin https://github.com/username/repo.git
```

## 2. Configure (1 minute)

Create `.github/workflows` directory:

```bash
mkdir -p .github/workflows
```

## 3. Hello World (2 minutes)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

# When to run
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

# Jobs to run
jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/coverage-final.json
```

## 4. Run Tests (1 minute)

```bash
# Commit and push
git add .github/workflows/ci.yml
git commit -m "Add CI workflow"
git push origin main

# Check workflow status
# Go to: https://github.com/username/repo/actions
```

**Expected Behavior:**
- Workflow triggers on push
- Tests run automatically
- Results appear in GitHub Actions tab
- ✅ Green checkmark if tests pass
- ❌ Red X if tests fail

## 5. Next Steps

### Multi-Job Workflow

```yaml
name: Full CI/CD

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 21]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

### Matrix Testing

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]
        include:
          - os: ubuntu-latest
            node-version: 21
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

### Cache Dependencies

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Artifacts

```yaml
- name: Build
  run: npm run build

- name: Upload build artifacts
  uses: actions/upload-artifact@v3
  with:
    name: build-output
    path: dist/

- name: Download artifacts
  uses: actions/download-artifact@v3
  with:
    name: build-output
```

### Environment Variables & Secrets

```yaml
env:
  NODE_ENV: production
  API_URL: https://api.example.com

jobs:
  deploy:
    steps:
      - run: echo ${{ secrets.API_KEY }}
      - run: npm run deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Add secrets at: `Settings → Secrets and variables → Actions`

## 6. Troubleshooting

### Issue: Workflow not triggering
```yaml
# Check trigger configuration
on:
  push:
    branches: [ main ]  # Only triggers on main branch
  pull_request:        # Triggers on all PRs

# Or use workflow_dispatch for manual triggers
on:
  workflow_dispatch:
```

### Issue: "npm: command not found"
```yaml
# Make sure to setup Node.js
- uses: actions/setup-node@v4
  with:
    node-version: '20'
```

### Issue: Tests fail in CI but pass locally
```yaml
# Use same Node version locally
node -v

# Check for missing environment variables
env:
  CI: true
  NODE_ENV: test
```

### Issue: Slow workflow
```yaml
# Use npm ci instead of npm install
- run: npm ci  # Faster, cleaner installs

# Cache dependencies
- uses: actions/cache@v3

# Run jobs in parallel (default)
jobs:
  test1:
  test2:  # Runs in parallel with test1
```

### Issue: Secrets not working
```bash
# Secrets are NEVER available in pull requests from forks
# For security reasons

# Use pull_request_target with caution:
on:
  pull_request_target:  # Has access to secrets
```

## 🎓 Common Patterns

```yaml
# Full production-ready workflow
name: Production CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Security audit
        run: npm audit --audit-level=moderate

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Unit tests
        run: npm test

      - name: E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: [quality, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npm run build

      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build

      - name: Deploy to production
        run: |
          # Your deployment script
          echo "Deploying..."
```

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Marketplace](https://github.com/marketplace?type=actions)
- [Full CI Examples](../ci-pipelines/)

## ⏭️ What's Next?

1. **Add quality gates** - Lint, type-check, security
2. **Matrix testing** - Multiple Node/OS versions
3. **Deploy automation** - Auto-deploy on merge
4. **Scheduled workflows** - Nightly builds
5. **Status badges** - Show build status in README

---

**Time to first workflow:** ~5 minutes ✅
**Ready for production?** Add quality gates and deployment!
