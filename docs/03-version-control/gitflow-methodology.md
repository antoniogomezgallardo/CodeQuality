# GitFlow Methodology

## Overview

GitFlow is a branching model for Git that uses multiple long-lived branches and specific branch naming conventions. Created by Vincent Driessen, it provides a robust framework for managing releases in projects with scheduled release cycles.

**⚠️ Note:** While GitFlow is documented here for completeness, this project **recommends Trunk-Based Development** as the modern best practice for continuous delivery. See [Version Control README](03-README.md) for the recommended approach.

## Purpose

- **Release management**: Structured approach for versioned releases
- **Parallel development**: Multiple features developed simultaneously
- **Hotfix handling**: Quick fixes to production without disrupting development
- **Version tracking**: Clear history of releases and features

## When to Use GitFlow

```markdown
**✅ GitFlow is suitable for:**
- Scheduled releases (quarterly, monthly)
- Multiple production versions maintained simultaneously
- Traditional release cycles
- Large teams with formal release process
- Enterprise environments with change management

**❌ GitFlow is NOT suitable for:**
- Continuous deployment (multiple deploys per day)
- SaaS applications with single production version
- Small teams practicing agile/DevOps
- Projects requiring fast iteration
- Mobile apps (app store delays make CD impractical anyway)

**✅ Consider Trunk-Based Development instead when:**
- Deploying multiple times per day
- Practicing continuous delivery
- Using feature flags
- Small to medium teams (<50 developers)
- Cloud-native/SaaS applications
```

## GitFlow Branch Structure

### Permanent Branches

```bash
# main (or master)
# - Production-ready code
# - Each commit is a release
# - Tagged with version numbers

# develop
# - Integration branch
# - Latest delivered development changes
# - Source for next release
```

### Temporary Branches

```bash
# feature/* - New features
feature/user-authentication
feature/payment-integration
feature/dark-mode

# release/* - Release preparation
release/1.2.0
release/2.0.0

# hotfix/* - Production fixes
hotfix/1.1.1-security-patch
hotfix/1.2.1-critical-bug
```

## GitFlow Workflow

### 1. Feature Development

```bash
# Start a new feature from develop
git checkout develop
git pull origin develop
git checkout -b feature/user-profile

# Work on feature
git add .
git commit -m "feat: add user profile editing"

# Keep feature branch updated
git checkout develop
git pull origin develop
git checkout feature/user-profile
git merge develop

# Push feature branch
git push origin feature/user-profile

# Create pull request: feature/user-profile → develop

# After PR approved and merged
git checkout develop
git pull origin develop
git branch -d feature/user-profile
```

### 2. Release Process

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/1.2.0

# Bump version number
npm version 1.2.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump version to 1.2.0"

# Only bug fixes allowed in release branch
git commit -m "fix: correct validation error message"

# Merge to main
git checkout main
git pull origin main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git pull origin develop
git merge --no-ff release/1.2.0
git push origin develop

# Delete release branch
git branch -d release/1.2.0
git push origin --delete release/1.2.0
```

### 3. Hotfix Process

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/1.2.1

# Fix the critical bug
git add .
git commit -m "fix: resolve security vulnerability CVE-2024-1234"

# Bump patch version
npm version 1.2.1 --no-git-tag-version
git add package.json
git commit -m "chore: bump version to 1.2.1"

# Merge to main
git checkout main
git merge --no-ff hotfix/1.2.1
git tag -a v1.2.1 -m "Hotfix 1.2.1: Security patch"
git push origin main --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/1.2.1
git push origin develop

# Delete hotfix branch
git branch -d hotfix/1.2.1
```

## GitFlow vs Trunk-Based Development

```markdown
| Aspect | GitFlow | Trunk-Based Development |
|--------|---------|-------------------------|
| **Branches** | Multiple long-lived | Single main branch |
| **Feature branches** | Long-lived (days/weeks) | Short-lived (<1 day) |
| **Releases** | Scheduled | Continuous |
| **Complexity** | High | Low |
| **Merge conflicts** | More frequent | Less frequent |
| **CI/CD friendly** | Moderate | Excellent |
| **Team size** | Good for large teams | Better for small/medium |
| **Deployment frequency** | Low (weekly/monthly) | High (multiple/day) |
| **Learning curve** | Steeper | Gentler |
| **Best for** | Versioned products | SaaS/web apps |
```

## GitFlow Challenges

```markdown
**1. Merge Hell**
- Multiple long-lived branches
- Frequent merge conflicts
- Integration issues discovered late

**Solution:**
- Keep feature branches short
- Merge develop into feature branches frequently
- Consider feature flags instead

**2. Delayed Integration**
- Features integrated only when complete
- Integration bugs found late
- Large merge conflicts

**Solution:**
- Break features into smaller pieces
- Integrate partially complete features with flags
- Use continuous integration

**3. Slow Feedback**
- Code not deployed until release
- User feedback delayed
- Market changes missed

**Solution:**
- Shorten release cycles
- Use beta/staging environments
- Consider trunk-based development

**4. Release Branch Overhead**
- Extra branch to maintain
- Double merging (main + develop)
- Version conflicts possible

**Solution:**
- Automate release process
- Use release automation tools
- Consider GitHub Flow for simpler flow
```

## Automation Tools

### Git-Flow Extension

```bash
# Install git-flow
brew install git-flow  # macOS
apt-get install git-flow  # Ubuntu

# Initialize git-flow in repository
git flow init

# Start a feature
git flow feature start user-profile

# Finish a feature (merges to develop)
git flow feature finish user-profile

# Start a release
git flow release start 1.2.0

# Finish a release (merges to main and develop, tags)
git flow release finish 1.2.0

# Start a hotfix
git flow hotfix start 1.2.1

# Finish a hotfix
git flow hotfix finish 1.2.1
```

## Related Resources

- [Version Control Overview](03-README.md) - **Recommended: Trunk-Based Development**
- [CI/CD Best Practices](cicd-best-practices/03.1-README.md)
- [Feature Flags](../07-development-practices/feature-flags.md)
- [Continuous Delivery](../08-cicd-pipeline/continuous-delivery.md)

## References

- Vincent Driessen - A Successful Git Branching Model
- Atlassian - Comparing Workflows
- Martin Fowler - Patterns for Managing Source Code Branches
- DORA - Trunk-Based Development Research

---

*Part of: [Version Control](README.md)*
