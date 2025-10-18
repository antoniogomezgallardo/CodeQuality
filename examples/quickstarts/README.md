# Quick Start Guides

Get up and running with essential QA tools in 5 minutes or less. Each guide provides minimal setup, a "Hello World" example, and common troubleshooting tips.

## 📚 Available Quick Starts

### Testing Frameworks

| Tool | Time | Focus | Link |
|------|------|-------|------|
| **Jest** | 3 min | JavaScript unit testing | [→ Start](jest-quickstart.md) |
| **pytest** | 3 min | Python unit testing | [→ Start](pytest-quickstart.md) |
| **JUnit 5** | 4 min | Java unit testing | [→ Start](junit-quickstart.md) |
| **Cypress** | 5 min | E2E web testing | [→ Start](cypress-quickstart.md) |
| **Playwright** | 5 min | Modern E2E testing | [→ Start](playwright-quickstart.md) |
| **Supertest** | 3 min | API testing | [→ Start](supertest-quickstart.md) |
| **Postman** | 4 min | API testing & docs | [→ Start](postman-quickstart.md) |

### Performance & Load Testing

| Tool | Time | Focus | Link |
|------|------|-------|------|
| **k6** | 4 min | Modern load testing | [→ Start](k6-quickstart.md) |
| **JMeter** | 5 min | Enterprise load testing | [→ Start](jmeter-quickstart.md) |

### CI/CD Platforms

| Tool | Time | Focus | Link |
|------|------|-------|------|
| **GitHub Actions** | 5 min | GitHub CI/CD | [→ Start](github-actions-quickstart.md) |
| **GitLab CI** | 5 min | GitLab CI/CD | [→ Start](gitlab-ci-quickstart.md) |
| **Jenkins** | 5 min | Self-hosted CI/CD | [→ Start](jenkins-quickstart.md) |

### Monitoring & Observability

| Tool | Time | Focus | Link |
|------|------|-------|------|
| **Prometheus** | 5 min | Metrics collection | [→ Start](prometheus-quickstart.md) |
| **Grafana** | 4 min | Metrics visualization | [→ Start](grafana-quickstart.md) |

### Security Testing

| Tool | Time | Focus | Link |
|------|------|-------|------|
| **OWASP ZAP** | 5 min | Security scanning | [→ Start](owasp-zap-quickstart.md) |
| **Snyk** | 3 min | Dependency scanning | [→ Start](snyk-quickstart.md) |

### Accessibility Testing

| Tool | Time | Focus | Link |
|------|------|-------|------|
| **axe-core** | 3 min | Automated a11y testing | [→ Start](axe-quickstart.md) |
| **Pa11y** | 4 min | Command-line a11y | [→ Start](pa11y-quickstart.md) |

## 🎯 How to Use These Guides

### For Beginners
1. Start with your language's unit testing framework (Jest/pytest/JUnit)
2. Move to E2E testing (Cypress or Playwright)
3. Add CI/CD (GitHub Actions or GitLab CI)
4. Integrate monitoring (Prometheus + Grafana)

### For Experienced Users
- Jump to specific tools you need
- Use as reference for setup commands
- Check troubleshooting sections for common issues

### For Teams
- Share relevant guides during onboarding
- Use as templates for internal documentation
- Customize for your specific stack

## 📋 Quick Start Template

Each guide follows this structure:

```markdown
# Tool Name Quick Start

**Time:** X minutes
**Prerequisites:** List
**What You'll Learn:** Brief description

## 1. Install (30 seconds)
## 2. Configure (1 minute)
## 3. Hello World (2 minutes)
## 4. Run Tests (1 minute)
## 5. Next Steps
## 6. Troubleshooting
```

## 🔧 General Prerequisites

Most guides assume you have:

- **Git** - Version control
- **Node.js** 18+ (for JavaScript tools)
- **Python** 3.9+ (for Python tools)
- **Java** 17+ (for Java tools)
- **Docker** (optional, for containerized setups)
- **Code Editor** (VS Code, IntelliJ, etc.)

## 💡 Pro Tips

### Speed Up Installation
```bash
# Use package manager for faster installs
# macOS
brew install node python@3.11 openjdk@17

# Ubuntu/Debian
sudo apt install nodejs python3 openjdk-17-jdk

# Windows (with Chocolatey)
choco install nodejs python openjdk17
```

### Common Environment Setup
```bash
# Create .tool-versions file for multiple projects
cat > ~/.tool-versions << EOF
nodejs 20.10.0
python 3.11.5
java openjdk-17.0.9
EOF
```

### Docker Alternative
Many tools can run in Docker if you prefer not to install locally:

```bash
# Example: Run pytest in Docker
docker run -v $(pwd):/app -w /app python:3.11 sh -c "pip install pytest && pytest"

# Example: Run k6 in Docker
docker run -v $(pwd):/scripts grafana/k6 run /scripts/load-test.js
```

## 🚨 Common Pitfalls

### Path Issues
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc)
export PATH="$HOME/.local/bin:$PATH"
export PATH="/usr/local/bin:$PATH"
```

### Permission Errors
```bash
# Don't use sudo with npm (can cause issues)
# Instead, configure npm prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Version Conflicts
```bash
# Use version managers
nvm use 20    # Node Version Manager
pyenv local 3.11.5    # Python version manager
sdk use java 17.0.9-tem    # SDKMAN for Java
```

## 📚 Related Resources

- [Full Testing Examples](../unit-tests/) - Comprehensive examples
- [CI/CD Pipelines](../ci-pipelines/) - Complete pipeline configs
- [Monitoring Configs](../monitoring-configs/) - Production setups
- [Templates](../../templates/) - Production-ready templates

## 🤝 Contributing

To add a new quick start guide:

1. Copy an existing guide structure
2. Keep setup under 5 minutes
3. Include troubleshooting section
4. Test on fresh environment
5. Update this README

## 📖 Quick Start Philosophy

These guides prioritize:

- **Speed** - Get running in minutes, not hours
- **Simplicity** - Minimal configuration
- **Practical** - Real examples, not toy demos
- **Troubleshooting** - Common issues with solutions
- **Next Steps** - Where to go deeper

---

**Ready to start?** Pick a tool from the tables above and get testing in 5 minutes!
