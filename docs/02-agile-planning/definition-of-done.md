# Definition of Done (DoD)

## Overview

The Definition of Done (DoD) is a shared, explicit agreement among the team that defines the criteria a user story, feature, or increment must satisfy to be considered complete. It ensures quality, consistency, and creates a common understanding of what "done" means.

## Purpose

- **Quality assurance**: Establish minimum quality standards for all work
- **Transparency**: Make completion criteria explicit and visible
- **Consistency**: Ensure all team members apply the same standards
- **Prevent technical debt**: Require complete, production-ready work
- **Enable continuous delivery**: Ensure work is always potentially shippable

## Core DoD Principles

### 1. Shippable Quality

Every item meeting DoD should be potentially releasable to production without additional work.

### 2. Incremental Refinement

DoD can evolve and become more stringent as the team matures and tooling improves.

### 3. Team Agreement

DoD is created and owned by the development team, not imposed externally.

### 4. Visible and Referenced

DoD should be prominently displayed and referenced in every sprint review and retrospective.

## Standard DoD Checklist

### Code Complete

```markdown
**Development:**

- [ ] All code written and committed to version control
- [ ] Code follows team coding standards and style guide
- [ ] No commented-out code or debug statements
- [ ] No hardcoded values (use configuration)
- [ ] Error handling implemented
- [ ] Logging added for debugging and monitoring
- [ ] Performance optimizations applied where needed

**Code Quality:**

- [ ] Code complexity within acceptable limits (cyclomatic complexity <10)
- [ ] No code duplication (DRY principle followed)
- [ ] Functions/methods have single responsibility
- [ ] Appropriate design patterns applied
```

### Code Review

```markdown
**Review Process:**

- [ ] Pull request created and linked to story
- [ ] At least one peer code review completed
- [ ] All review comments addressed or discussed
- [ ] No unresolved conversations in PR
- [ ] PR approved by required number of reviewers (typically 1-2)

**Review Checklist:**

- [ ] Code is readable and maintainable
- [ ] Business logic is correct
- [ ] Security vulnerabilities addressed
- [ ] Performance implications considered
- [ ] Proper error handling in place
```

### Testing

```markdown
**Unit Testing:**

- [ ] Unit tests written for all new code
- [ ] Code coverage ≥80% for new code
- [ ] All unit tests passing
- [ ] Edge cases and error conditions tested
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)

**Integration Testing:**

- [ ] Integration tests written for API endpoints/services
- [ ] Database interactions tested
- [ ] External service integrations tested (with mocks)
- [ ] All integration tests passing

**End-to-End Testing:**

- [ ] Critical user journeys have E2E tests
- [ ] Happy path tested
- [ ] Key error scenarios tested
- [ ] All E2E tests passing in CI/CD

**Manual Testing:**

- [ ] Feature tested manually by developer
- [ ] Acceptance criteria verified
- [ ] Cross-browser testing completed (if UI)
- [ ] Mobile responsive testing done (if applicable)
```

### Documentation

```markdown
**Code Documentation:**

- [ ] Public APIs/interfaces documented
- [ ] Complex algorithms explained with comments
- [ ] JSDoc/Javadoc/docstrings added
- [ ] README updated (if needed)

**User Documentation:**

- [ ] User-facing documentation updated
- [ ] Release notes drafted
- [ ] Known limitations documented
- [ ] Migration guide provided (if breaking changes)

**Technical Documentation:**

- [ ] Architecture decisions recorded (ADR)
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] Database schema changes documented
- [ ] Configuration changes documented
```

### Quality Gates

```markdown
**Static Analysis:**

- [ ] Linter passes with no errors
- [ ] Type checking passes (TypeScript, Flow, etc.)
- [ ] Security scanning completed (SAST)
- [ ] Dependency vulnerability check passes

**Build and CI:**

- [ ] Code builds successfully
- [ ] All CI pipeline stages pass
- [ ] No build warnings
- [ ] Artifacts generated correctly

**Code Metrics:**

- [ ] Code coverage meets minimum threshold (80%)
- [ ] No critical or high-severity code smells
- [ ] Technical debt ratio acceptable
- [ ] Maintainability index >65
```

### Acceptance

```markdown
**Acceptance Criteria:**

- [ ] All acceptance criteria met
- [ ] Product Owner reviewed and accepted
- [ ] Demo to stakeholders completed
- [ ] User feedback incorporated (if pilot/beta)

**Business Value:**

- [ ] Feature solves stated user problem
- [ ] Success metrics defined and measurable
- [ ] Feature accessible to target users
```

### Deployment Readiness

```markdown
**Environment:**

- [ ] Feature tested in staging/pre-production
- [ ] Database migrations tested
- [ ] Feature flags configured (if applicable)
- [ ] Configuration deployed to environments

**Deployment:**

- [ ] Deployment runbook created/updated
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured
- [ ] Feature deployed to production (or ready to deploy)

**Operations:**

- [ ] Application logs reviewed
- [ ] Performance metrics within acceptable range
- [ ] Error rates normal
- [ ] Monitoring dashboards show healthy status
```

## DoD by Level

### Story-Level DoD

```markdown
**Applies to:** Individual user stories

✅ Code complete and reviewed
✅ All tests passing (unit, integration, E2E)
✅ Acceptance criteria met
✅ Documentation updated
✅ No known defects
✅ Deployed to staging
✅ Product Owner accepts story
```

### Sprint-Level DoD

```markdown
**Applies to:** Entire sprint increment

✅ All story-level DoD met for all stories
✅ Integration testing complete for sprint features
✅ Sprint demo successfully presented
✅ Release notes updated
✅ No regression in existing features
✅ Performance testing passed
✅ Security scan completed
✅ Ready for production release
```

### Release-Level DoD

```markdown
**Applies to:** Production releases

✅ All sprint-level DoD met
✅ User acceptance testing completed
✅ Performance testing at scale completed
✅ Security penetration testing passed
✅ Compliance requirements verified (GDPR, etc.)
✅ Disaster recovery tested
✅ Documentation complete and published
✅ Training materials prepared
✅ Support team briefed
✅ Monitoring and alerting verified
✅ Production deployment executed
✅ Post-deployment verification passed
```

## DoD Templates by Project Type

### Web Application DoD

```markdown
**Frontend:**

- [ ] UI matches approved designs
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- [ ] No console errors or warnings
- [ ] Performance: Lighthouse score >90
- [ ] Bundle size optimized
- [ ] Lazy loading implemented where appropriate

**Backend:**

- [ ] API endpoints follow REST/GraphQL standards
- [ ] Request/response validation implemented
- [ ] Rate limiting configured
- [ ] Authentication/authorization working
- [ ] Database queries optimized (no N+1 queries)
- [ ] Caching strategy implemented
- [ ] Error responses follow standard format

**DevOps:**

- [ ] CI/CD pipeline green
- [ ] Docker images built and tagged
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] CDN configuration updated
- [ ] Database migrations executed
```

### Mobile App DoD

```markdown
**iOS:**

- [ ] Builds successfully in Xcode
- [ ] No compiler warnings
- [ ] Works on minimum supported iOS version
- [ ] Tested on physical devices (iPhone, iPad)
- [ ] App Store guidelines compliance verified
- [ ] Push notifications working
- [ ] Offline functionality tested

**Android:**

- [ ] Builds successfully in Android Studio
- [ ] No lint errors
- [ ] Works on minimum supported Android version
- [ ] Tested on multiple screen sizes
- [ ] Google Play guidelines compliance verified
- [ ] Background services optimized
- [ ] Permissions requested appropriately

**Cross-Platform:**

- [ ] Consistent UI/UX across platforms
- [ ] Platform-specific features implemented
- [ ] Beta testing completed (TestFlight/Firebase App Distribution)
- [ ] Crash reporting configured
- [ ] Analytics events implemented
```

### API/Microservice DoD

```markdown
**Development:**

- [ ] OpenAPI/Swagger specification updated
- [ ] API versioning implemented
- [ ] Request/response schemas validated
- [ ] Authentication/authorization enforced
- [ ] Rate limiting implemented
- [ ] Circuit breakers configured
- [ ] Health check endpoint working
- [ ] Graceful shutdown implemented

**Testing:**

- [ ] Contract tests passing
- [ ] Load testing completed
- [ ] Chaos engineering tests passed
- [ ] Security testing (OWASP Top 10)
- [ ] API fuzzing completed

**Observability:**

- [ ] Structured logging implemented
- [ ] Distributed tracing configured
- [ ] Metrics exported (Prometheus format)
- [ ] Alerts configured for SLOs
- [ ] Dashboards created in Grafana
```

## Implementing DoD

### Creating Your DoD

```markdown
**Step 1: Team Workshop**

1. Gather the entire Scrum team
2. Brainstorm quality criteria
3. Discuss what "done" means for your project
4. Consider industry standards (ISTQB, ISO 25010)

**Step 2: Categorize Criteria**

1. Group by: Code, Testing, Documentation, Deployment
2. Prioritize must-haves vs. nice-to-haves
3. Identify automated vs. manual checks

**Step 3: Make It Measurable**

1. Convert subjective criteria to objective checks
   ❌ "Code is good quality"
   ✅ "Code coverage ≥80% and complexity <10"

**Step 4: Automate Checks**

1. Integrate into CI/CD pipeline
2. Create pull request checklists
3. Use quality gates in SonarQube/CodeClimate

**Step 5: Make It Visible**

1. Display on team board
2. Include in pull request templates
3. Reference in sprint reviews
```

### DoD Evolution Example

```markdown
**Sprint 1-3 (Basic DoD):**
✅ Code written
✅ Manual testing done
✅ Committed to repository

**Sprint 4-8 (Maturing DoD):**
✅ Code written and reviewed
✅ Unit tests written (>60% coverage)
✅ Manual testing done
✅ Committed to main branch
✅ Build passes

**Sprint 9+ (Advanced DoD):**
✅ Code written and reviewed by 2 developers
✅ Unit tests written (>80% coverage)
✅ Integration tests passing
✅ Static analysis passes (ESLint, SonarQube)
✅ Security scan passes
✅ Performance benchmarks met
✅ Documentation updated
✅ Deployed to staging
✅ Product Owner accepted
```

## DoD Automation

### GitHub Actions Example

```yaml
name: Definition of Done Checks

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  dod-checks:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Code Quality - Linting
        run: npm run lint

      - name: Code Quality - Type Checking
        run: npm run type-check

      - name: Testing - Unit Tests
        run: npm run test:unit

      - name: Testing - Coverage Threshold
        run: |
          npm run test:coverage
          # Enforce 80% coverage
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json | cut -d. -f1) -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi

      - name: Testing - Integration Tests
        run: npm run test:integration

      - name: Security - Dependency Audit
        run: npm audit --audit-level=high

      - name: Security - SAST Scan
        uses: github/codeql-action/analyze@v2

      - name: Build - Compile
        run: npm run build

      - name: Documentation - Check Links
        run: npm run docs:check

      - name: DoD - PR Checklist
        uses: kentaro-m/task-list-check-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Pull Request Template with DoD

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Definition of Done Checklist

### Code Complete

- [ ] All code written and follows style guide
- [ ] No hardcoded values or debug statements
- [ ] Error handling implemented
- [ ] Logging added

### Code Review

- [ ] Self-reviewed code
- [ ] Code reviewed by at least 1 peer
- [ ] All review comments addressed

### Testing

- [ ] Unit tests written and passing
- [ ] Code coverage ≥80% for new code
- [ ] Integration tests passing
- [ ] Manually tested in local environment
- [ ] Tested in staging environment

### Documentation

- [ ] Code comments added for complex logic
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Release notes updated

### Quality Gates

- [ ] Linter passes
- [ ] Type checking passes
- [ ] Security scan passes
- [ ] Build succeeds

### Acceptance

- [ ] Acceptance criteria met
- [ ] Product Owner notified for review
- [ ] Demo prepared

### Deployment

- [ ] Feature flag configured (if needed)
- [ ] Configuration updated in environments
- [ ] Deployment plan documented

## Related Issues

Closes #[issue number]

## Screenshots (if applicable)
```

## Common DoD Challenges

### Challenge 1: DoD Too Strict

```markdown
**Problem:** DoD is so comprehensive that nothing ever gets "done"

**Solution:**

- Start with minimal DoD and expand gradually
- Use "Definition of Ready" to prepare work better
- Time-box DoD creation (2-hour workshop max)
- Prioritize must-haves over nice-to-haves
```

### Challenge 2: DoD Ignored

```markdown
**Problem:** Team doesn't consistently apply DoD

**Solution:**

- Automate DoD checks in CI/CD
- Include DoD review in sprint reviews
- Make DoD visible on team board
- Celebrate when team meets DoD consistently
```

### Challenge 3: DoD Varies by Team Member

```markdown
**Problem:** Different interpretations of DoD

**Solution:**

- Make DoD explicit and unambiguous
- Use objective, measurable criteria
- Review DoD together regularly
- Pair programming to share standards
```

### Challenge 4: DoD Conflicts with Deadlines

```markdown
**Problem:** Pressure to skip DoD to meet deadlines

**Solution:**

- Educate stakeholders on technical debt cost
- Make incomplete work visible
- Use "undone work" burndown chart
- Negotiate scope, not quality
```

## Metrics and Monitoring

### DoD Compliance Tracking

```javascript
const dodMetrics = {
  // Percentage of stories meeting DoD
  dodComplianceRate: (storiesMeetingDoD / totalCompleted) * 100,

  // Technical debt from incomplete DoD
  dodDebt: storiesWithSkippedCriteria,

  // Time to complete DoD items
  dodCompletionTime: avgTimeToMeetAllCriteria,

  // Most commonly skipped DoD items
  skippedCriteria: {
    'Unit tests': 12,
    Documentation: 8,
    'Code review': 3,
  },
};

// Target: >95% DoD compliance rate
```

### DoD Health Indicators

```markdown
**Healthy DoD Signs:**

- ✅ 95%+ stories meet full DoD
- ✅ Minimal production bugs
- ✅ Fast, confident releases
- ✅ Low technical debt
- ✅ High team morale

**Warning Signs:**

- ⚠️ Frequent DoD exceptions
- ⚠️ Growing undone work
- ⚠️ Production issues spike
- ⚠️ Team debates "done" definition
- ⚠️ Difficulty releasing on demand
```

## Related Resources

- [Definition of Ready](definition-of-ready.md)
- [INVEST Criteria](invest-criteria.md)
- [Acceptance Criteria](../01-requirements/acceptance-criteria.md)
- [Testing Strategy](../04-testing-strategy/README.md)
- [CI/CD Pipeline](../08-cicd-pipeline/README.md)

## References

- Scrum Guide - Definition of Done
- SAFe: Built-In Quality
- DORA: Continuous Delivery Capabilities
- IEEE 829: Test Documentation Standard

---

_Part of: [Agile Planning](README.md)_
