# Snyk Quick Start

**Time:** 3 minutes
**Prerequisites:** Node.js 18+ or Docker
**What You'll Learn:** Set up Snyk and scan for security vulnerabilities

## 1. Install (30 seconds)

```bash
# Install Snyk CLI globally
npm install -g snyk

# Or use with npx (no install)
npx snyk --version

# Or use Docker
docker pull snyk/snyk:node
```

## 2. Configure (1 minute)

```bash
# Authenticate with Snyk
snyk auth

# This opens browser to login/signup
# Free tier available: https://snyk.io/

# Verify authentication
snyk whoami
```

## 3. Hello World (1 minute)

```bash
# Navigate to your project
cd my-project

# Test for vulnerabilities
snyk test

# Test and monitor
snyk monitor

# Test Docker image
snyk container test node:20

# Test Infrastructure as Code
snyk iac test terraform/
```

**Example Output:**

```
Testing /path/to/project...

✗ High severity vulnerability found in lodash
  Description: Prototype Pollution
  Info: https://snyk.io/vuln/SNYK-JS-LODASH-590103
  Introduced through: lodash@4.17.11
  Fixed in: lodash@4.17.12

Tested 245 dependencies for known issues, found 3 issues, 3 vulnerable paths.
```

## 4. Run Tests (30 seconds)

```bash
# Scan dependencies
snyk test

# Scan with JSON output
snyk test --json > results.json

# Scan with severity threshold
snyk test --severity-threshold=high

# Fix vulnerabilities automatically
snyk fix

# Guided fix (interactive)
snyk wizard
```

## 5. Next Steps

### Integrate with CI/CD

**GitHub Actions:**

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

**GitLab CI:**

```yaml
snyk-scan:
  image: node:20
  script:
    - npm install -g snyk
    - snyk auth $SNYK_TOKEN
    - snyk test
  only:
    - merge_requests
```

### Monitor in Production

```bash
# Monitor project (sends snapshot to Snyk dashboard)
snyk monitor

# Monitor with custom project name
snyk monitor --project-name="My App - Production"

# Monitor Docker image
snyk container monitor node:20 --project-name="Node Base Image"
```

### Scan Docker Images

```bash
# Test image for vulnerabilities
snyk container test node:20

# Test with Dockerfile
snyk container test myapp:latest --file=Dockerfile

# Test with specific platform
snyk container test node:20 --platform=linux/amd64
```

### Scan IaC Files

```bash
# Test Terraform
snyk iac test terraform/

# Test Kubernetes manifests
snyk iac test kubernetes/

# Test CloudFormation
snyk iac test cloudformation/

# Test Helm charts
snyk iac test helm/
```

### Scan Code (SAST)

```bash
# Enable Snyk Code (requires signup)
snyk code test

# Test specific file
snyk code test src/index.js

# Output to JSON
snyk code test --json > code-scan.json
```

### Policy Files

Create `.snyk` file to ignore specific vulnerabilities:

```yaml
# Snyk (https://snyk.io) policy file
version: v1.25.0

ignore:
  'SNYK-JS-LODASH-590103':
    - '*':
        reason: Not exploitable in our usage
        expires: 2024-12-31T00:00:00.000Z

patch: {}
```

### Fix Vulnerabilities

```bash
# Automatic fix (upgrades dependencies)
snyk fix

# Wizard for guided fixing
snyk wizard

# Check what would be fixed
snyk fix --dry-run
```

## 6. Troubleshooting

### Issue: "Snyk token not found"

```bash
# Authenticate again
snyk auth

# Or set token manually
export SNYK_TOKEN=your-token-here
snyk test

# Get token from: https://app.snyk.io/account
```

### Issue: Too many vulnerabilities

```bash
# Filter by severity
snyk test --severity-threshold=high

# Only show fixable issues
snyk test --show-vulnerable-paths=some

# Ignore dev dependencies
snyk test --prod
```

### Issue: "No supported package files found"

```bash
# Snyk looks for:
# - package.json (Node.js)
# - pom.xml (Maven)
# - build.gradle (Gradle)
# - requirements.txt (Python)
# - Gemfile (Ruby)
# - etc.

# Make sure you're in project root
cd /path/to/project
snyk test
```

### Issue: Rate limiting

```bash
# Use --all-projects cautiously
# It can trigger rate limits on free tier

# Upgrade to paid plan for higher limits
# Or space out scans
```

### Issue: False positives

```yaml
# Use .snyk policy file to ignore
# Create .snyk file in project root
ignore:
  'VULN-ID':
    - 'path > to > package':
        reason: Not applicable
        expires: 2024-12-31T00:00:00.000Z
```

## 🎓 Common Commands

```bash
# Basic scanning
snyk test                          # Test project
snyk test --all-projects           # Test all sub-projects
snyk test --file=package.json      # Test specific manifest

# Monitoring
snyk monitor                       # Send snapshot to dashboard
snyk monitor --org=my-org          # Monitor in specific org

# Container scanning
snyk container test image:tag      # Scan Docker image
snyk container monitor image:tag   # Monitor image

# IaC scanning
snyk iac test                      # Scan IaC files
snyk iac test --report             # Generate report

# Code scanning (SAST)
snyk code test                     # Scan source code
snyk code test --severity-threshold=high

# Fixing
snyk fix                           # Auto-fix vulnerabilities
snyk wizard                        # Interactive fixing

# Reporting
snyk test --json                   # JSON output
snyk test --sarif                  # SARIF format
snyk test --severity-threshold=medium  # Only medium+

# Configuration
snyk config set api=TOKEN          # Set API token
snyk config get                    # View config
snyk auth                          # Authenticate

# Help
snyk --help                        # General help
snyk test --help                   # Command-specific help
```

## 🔐 Best Practices

```bash
# 1. Scan on every PR
# Add to CI/CD pipeline

# 2. Set severity thresholds
snyk test --severity-threshold=high

# 3. Monitor production dependencies
snyk monitor --project-name="Production"

# 4. Regular scans
# Schedule nightly scans in CI

# 5. Fix vulnerabilities quickly
snyk fix

# 6. Ignore responsibly
# Document why in .snyk file

# 7. Scan containers
snyk container test image:tag

# 8. Scan IaC
snyk iac test terraform/
```

## 📚 Resources

- [Snyk Documentation](https://docs.snyk.io/)
- [Snyk CLI Reference](https://docs.snyk.io/snyk-cli)
- [Vulnerability Database](https://security.snyk.io/)
- [Full Security Examples](../api-testing/)

## ⏭️ What's Next?

1. **CI/CD integration** - Automate security scans
2. **Policy files** - Manage false positives
3. **Container scanning** - Secure Docker images
4. **IaC scanning** - Secure infrastructure code
5. **Scheduled monitoring** - Track over time

---

**Time to first scan:** ~3 minutes ✅
**Ready for production?** Add to CI/CD and set up monitoring!
