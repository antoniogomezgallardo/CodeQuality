# Pull Request

## PR Information

**PR Title**: [Brief, descriptive title - will become the commit message]

**Author**: [Your Name]
**Date**: [YYYY-MM-DD]
**Branch**: `[feature/bugfix/hotfix branch name]` → `[target branch]`
**Related Issue(s)**: Closes #[issue number] | Fixes #[issue number] | Relates to #[issue number]

---

## Description and Motivation

### What does this PR do?

[Provide a clear and concise description of what this pull request accomplishes. Explain the changes at a high level.]

### Why is this change needed?

[Explain the motivation behind this change. What problem does it solve? What value does it add?]

### What is the current behavior?

[Describe what currently happens before this change]

### What is the new behavior?

[Describe what will happen after this change is merged]

---

## Type of Change

Please check the boxes that apply to this PR:

- [ ] **Feature**: New feature or functionality
- [ ] **Bugfix**: Fix for a bug or defect
- [ ] **Hotfix**: Urgent fix for production issue
- [ ] **Refactor**: Code refactoring (no functional changes)
- [ ] **Performance**: Performance improvement
- [ ] **Documentation**: Documentation only changes
- [ ] **Test**: Adding or updating tests
- [ ] **Build**: Changes to build process or dependencies
- [ ] **CI/CD**: Changes to CI/CD pipeline configuration
- [ ] **Style**: Code style/formatting changes
- [ ] **Chore**: Other changes that don't modify src or test files

---

## Breaking Changes

- [ ] **This PR introduces breaking changes**

If checked, please describe the breaking changes and migration path:

### Breaking Changes Description

[Describe what will break and why]

### Migration Guide

[Provide step-by-step instructions for users to migrate]

### Deprecation Warnings

[List any deprecation warnings added or features being phased out]

---

## Changes Made

### Files Changed Summary

[Provide a high-level summary organized by area/module]

**Frontend:**

- [List frontend changes]

**Backend:**

- [List backend changes]

**Database:**

- [List database changes]

**Infrastructure:**

- [List infrastructure changes]

**Documentation:**

- [List documentation changes]

### Key Implementation Details

[Explain important implementation decisions, design patterns used, or architectural considerations]

1. **[Component/Module Name]**
   - [Detail what changed and why]
   - [Note any design decisions]

2. **[Component/Module Name]**
   - [Detail what changed and why]
   - [Note any design decisions]

### Code Examples

[If helpful, include before/after code snippets to illustrate key changes]

**Before:**

```javascript
// Old code example
```

**After:**

```javascript
// New code example
```

---

## Testing

### Test Coverage

- [ ] **Unit tests added/updated**
  - [ ] All new functions have unit tests
  - [ ] Edge cases covered
  - [ ] Error scenarios tested

- [ ] **Integration tests added/updated**
  - [ ] API endpoints tested
  - [ ] Database interactions tested
  - [ ] External service integrations tested

- [ ] **End-to-end tests added/updated**
  - [ ] User workflows tested
  - [ ] Critical paths verified

- [ ] **Component tests added/updated** (for UI changes)
  - [ ] Component rendering tested
  - [ ] User interactions tested
  - [ ] Props/state changes tested

- [ ] **Manual testing completed**
  - [ ] Happy path tested
  - [ ] Edge cases tested
  - [ ] Error scenarios tested

### Test Results

**Coverage Report:**

- Overall Coverage: \_\_\_%
- Lines: \_\_\_%
- Branches: \_\_\_%
- Functions: \_\_\_%
- Statements: \_\_\_%

**Test Execution Results:**

- [ ] All tests passing
- Total tests: \_\_\_
- Passed: \_\_\_
- Failed: \_\_\_
- Skipped: \_\_\_

### Testing Instructions for Reviewers

[Provide step-by-step instructions for reviewers to test this PR]

**Prerequisites:**

- [Any setup required before testing]

**Test Steps:**

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Results:**

- [What reviewers should observe]

**Test Data:**

- [Sample data or test accounts needed]

---

## Screenshots / Videos

### UI Changes

[Include screenshots or videos for any visual changes]

**Before:**
[Screenshot of old UI]

**After:**
[Screenshot of new UI]

**Demo Video:**
[Link to demo video or attach file]

### Mobile Responsive Views

- [ ] **Mobile tested**
  - [ ] iOS Safari
  - [ ] Android Chrome

[Include mobile screenshots if applicable]

### Different States

[Show loading states, error states, empty states, etc.]

---

## Quality Checklist

### Code Quality

- [ ] **Code follows project style guide and conventions**
- [ ] **Code is self-documenting with clear variable/function names**
- [ ] **Complex logic includes comments explaining "why" not "what"**
- [ ] **No commented-out code (removed or TODO added)**
- [ ] **No console.log() or debugging statements left in code**
- [ ] **No hardcoded values (using constants/config instead)**
- [ ] **Error handling implemented appropriately**
- [ ] **Input validation added where needed**
- [ ] **No code duplication (DRY principle followed)**
- [ ] **Functions are small and single-purpose**
- [ ] **No magic numbers or strings**

### Testing

- [ ] **All new code has unit tests**
- [ ] **Test coverage meets project standards (minimum \_\_%)**
- [ ] **Tests are meaningful and test behavior, not implementation**
- [ ] **Tests use descriptive names**
- [ ] **No flaky tests**
- [ ] **Integration tests added for new integrations**
- [ ] **E2E tests updated for user-facing changes**

### Documentation

- [ ] **README updated (if applicable)**
- [ ] **API documentation updated (if applicable)**
- [ ] **Inline code comments added for complex logic**
- [ ] **CHANGELOG updated**
- [ ] **JSDoc/TSDoc comments added for public APIs**
- [ ] **Architecture decision records (ADR) created if needed**
- [ ] **Runbook updated (if operational changes)**

### Build and Linting

- [ ] **Build passes locally**
- [ ] **All linting rules pass**
- [ ] **No TypeScript errors**
- [ ] **No ESLint warnings or errors**
- [ ] **Prettier formatting applied**
- [ ] **No dependency vulnerabilities introduced**
- [ ] **Dependencies updated in package.json and lock file**

### Git Hygiene

- [ ] **Commits are atomic and well-organized**
- [ ] **Commit messages follow conventional commits format**
- [ ] **No merge commits in feature branch (rebased on latest target)**
- [ ] **Branch is up to date with target branch**
- [ ] **No unrelated changes included**
- [ ] **Sensitive data not committed (credentials, API keys, etc.)**

---

## Performance Impact

### Performance Considerations

- [ ] **No performance degradation**
- [ ] **Performance improved**
- [ ] **Performance impact unknown** (needs profiling)
- [ ] **Performance regression acceptable** (explain below)

### Performance Testing

[Describe any performance testing done]

**Metrics:**

- Page load time: [before] → [after]
- Time to interactive: [before] → [after]
- API response time: [before] → [after]
- Bundle size: [before] → [after]
- Memory usage: [before] → [after]

**Profiling Results:**
[Link to or describe profiling results]

**Optimization Notes:**
[Describe any performance optimizations made]

---

## Security Considerations

### Security Checklist

- [ ] **No sensitive data exposed in code or logs**
- [ ] **Input validation and sanitization implemented**
- [ ] **SQL injection prevention (parameterized queries)**
- [ ] **XSS prevention (output encoding)**
- [ ] **CSRF protection implemented**
- [ ] **Authentication required for protected routes**
- [ ] **Authorization checks in place**
- [ ] **No hardcoded credentials or secrets**
- [ ] **Secrets stored in environment variables or secret manager**
- [ ] **Dependencies scanned for vulnerabilities**
- [ ] **No eval() or dangerous functions used**
- [ ] **File upload validation (if applicable)**
- [ ] **Rate limiting considered (if applicable)**

### Security Review Notes

[Describe any security considerations or review needed]

**Threat Model:**
[If applicable, describe potential security threats addressed]

**Security Testing:**

- [ ] OWASP Top 10 considered
- [ ] Security scanning tools run
- [ ] Penetration testing performed (if needed)

---

## Accessibility Impact

### Accessibility Checklist

- [ ] **Keyboard navigation works**
- [ ] **Focus indicators visible**
- [ ] **Screen reader tested** (specify which: NVDA / JAWS / VoiceOver / TalkBack)
- [ ] **Color contrast meets WCAG 2.1 AA standards (4.5:1)**
- [ ] **Alt text provided for images**
- [ ] **ARIA attributes used correctly**
- [ ] **Semantic HTML used**
- [ ] **Form labels associated with inputs**
- [ ] **Error messages accessible**
- [ ] **No accessibility regressions**

### Accessibility Testing

[Describe accessibility testing performed]

**Tools Used:**

- [ ] axe DevTools
- [ ] WAVE
- [ ] Lighthouse
- [ ] Manual testing

**Lighthouse Accessibility Score:** \_\_\_ / 100

---

## Database Changes

- [ ] **This PR includes database changes**

### Migration Details

**Migration Script:** [Link to migration file or describe changes]

**Migration Type:**

- [ ] Schema change (tables, columns, indexes)
- [ ] Data migration
- [ ] Seed data update
- [ ] No migration needed

**Reversibility:**

- [ ] **Migration is reversible** (down migration provided)
- [ ] **Migration is not reversible** (explain why)

**Migration Testing:**

- [ ] Tested on local database
- [ ] Tested on staging database
- [ ] Tested with production-like data volume
- [ ] Rollback tested

**Performance Impact:**

- Estimated migration time: \_\_\_
- Table locking required: Yes / No
- Downtime required: Yes / No
- Index rebuilding: Yes / No

### Backward Compatibility

- [ ] **Changes are backward compatible**
- [ ] **Requires coordinated deployment** (explain below)

[Explain any backward compatibility considerations or coordination needed]

---

## Deployment Notes

### Deployment Requirements

- [ ] **Standard deployment** (no special steps required)
- [ ] **Special deployment steps required** (detailed below)
- [ ] **Requires configuration changes** (detailed below)
- [ ] **Requires environment variable updates** (detailed below)
- [ ] **Requires infrastructure changes** (detailed below)

### Pre-deployment Steps

[List any steps that must be taken BEFORE deployment]

1. [Step 1]
2. [Step 2]

### Deployment Steps

[List deployment steps if different from standard process]

1. [Step 1]
2. [Step 2]

### Post-deployment Steps

[List any steps that must be taken AFTER deployment]

1. [Step 1]
2. [Step 2]

### Configuration Changes

**Environment Variables:**

```bash
# Add these to .env or environment configuration
NEW_VAR_NAME=value
UPDATED_VAR_NAME=new_value
```

**Feature Flags:**

- [ ] Requires feature flag: `[flag_name]`
- Initial state: ON / OFF
- Rollout strategy: [describe gradual rollout plan]

**Infrastructure Updates:**

- [ ] New service/container required
- [ ] Resource scaling needed
- [ ] DNS changes required
- [ ] CDN configuration update

### Monitoring and Alerts

**Metrics to Watch:**

- [Metric 1: expected baseline and thresholds]
- [Metric 2: expected baseline and thresholds]

**New Alerts:**

- [Describe any new alerts that should be set up]

**Dashboard Updates:**

- [Link to or describe any dashboard changes]

---

## Rollback Plan

### Rollback Procedure

**Can this change be rolled back?**

- [ ] **Yes - simple rollback** (revert deployment)
- [ ] **Yes - with steps** (procedure below)
- [ ] **No - not reversible** (mitigation plan below)

### Rollback Steps

[Provide clear steps to rollback this change if needed]

1. [Step 1]
2. [Step 2]

### Data Rollback

- [ ] **No data changes** (safe to rollback)
- [ ] **Data changes are reversible** (rollback script available)
- [ ] **Data changes are NOT reversible** (describe mitigation)

### Rollback Testing

- [ ] Rollback procedure tested in staging
- [ ] Rollback time estimated: \_\_\_

---

## Dependencies

### Dependency Changes

- [ ] **New dependencies added**
- [ ] **Dependencies updated**
- [ ] **Dependencies removed**
- [ ] **No dependency changes**

**New Dependencies:**
| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [name] | [version] | [why needed] | [license] |

**Updated Dependencies:**
| Package | Old Version | New Version | Reason |
|---------|-------------|-------------|--------|
| [name] | [old] | [new] | [why] |

**Security Vulnerabilities Fixed:**

- [List any security vulnerabilities fixed by dependency updates]

### Breaking Dependency Changes

- [ ] **Dependency updates may affect other teams/projects**
- [ ] **Requires peer dependency updates**

[Describe any breaking changes in dependencies]

---

## Related PRs and Issues

### Depends On

This PR depends on:

- [ ] #[PR number] - [PR title] (must be merged first)
- [ ] #[PR number] - [PR title]

### Related PRs

Related or follow-up PRs:

- #[PR number] - [PR title] (parallel work)
- #[PR number] - [PR title] (follow-up work)

### Related Issues

- Closes #[issue number]
- Fixes #[issue number]
- Relates to #[issue number]
- Part of #[epic/milestone number]

### Blocks

This PR blocks:

- #[issue number] - [issue title]
- #[PR number] - [PR title]

---

## Reviewer Notes and Questions

### Questions for Reviewers

[List any specific questions or areas where you'd like reviewer feedback]

1. [Question 1]
2. [Question 2]

### Areas of Concern

[Call out any areas where you're uncertain or would like extra scrutiny]

- [Concern 1]
- [Concern 2]

### Review Focus Areas

[Guide reviewers to the most critical parts]

**Please pay special attention to:**

- [File/component 1 - reason]
- [File/component 2 - reason]

### Assumptions Made

[List any assumptions made during implementation]

1. [Assumption 1]
2. [Assumption 2]

---

## Additional Context

### Background Research

[Link to any relevant resources, RFCs, design docs, or research]

- [Design doc link]
- [RFC link]
- [External article or documentation]

### Alternative Approaches Considered

[Describe other approaches considered and why this approach was chosen]

**Approach 1:** [Description]

- Pros: [List pros]
- Cons: [List cons]
- Why not chosen: [Reason]

**Approach 2:** [Description]

- Pros: [List pros]
- Cons: [List cons]
- Why not chosen: [Reason]

**Chosen Approach:** [Description]

- Pros: [List pros]
- Cons: [List cons]
- Why chosen: [Reason]

### Technical Debt

- [ ] **This PR introduces technical debt** (explain below)
- [ ] **This PR reduces technical debt**
- [ ] **No technical debt impact**

[Describe any technical debt introduced or reduced]

**Follow-up Issues Created:**

- #[issue number] - [Description of follow-up work]

### Lessons Learned

[Document any interesting learnings or gotchas discovered during implementation]

---

## Definition of Done

This PR meets the Definition of Done:

**Development:**

- [ ] Code complete and follows project standards
- [ ] Self-review completed
- [ ] No known bugs or issues
- [ ] Handles errors gracefully
- [ ] Logging added for debugging

**Testing:**

- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests updated (if applicable)
- [ ] Manual testing completed
- [ ] Regression testing completed
- [ ] Edge cases tested
- [ ] Cross-browser testing (if UI changes)
- [ ] Mobile testing (if applicable)

**Code Review:**

- [ ] Peer review completed
- [ ] All review comments addressed
- [ ] Approved by required reviewers
- [ ] No unresolved conversations

**Documentation:**

- [ ] Code documented
- [ ] API documentation updated
- [ ] User documentation updated
- [ ] README updated
- [ ] CHANGELOG updated

**Quality:**

- [ ] Build passing
- [ ] All tests passing
- [ ] Linting passing
- [ ] No console errors or warnings
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Accessibility reviewed

**Deployment:**

- [ ] Deployment plan documented
- [ ] Environment variables documented
- [ ] Migration scripts tested
- [ ] Rollback plan documented
- [ ] Monitoring in place

---

## Pre-merge Checklist

Before merging, ensure:

- [ ] **All CI/CD checks passing**
- [ ] **Required approvals obtained** (minimum \_\_\_ approvals)
- [ ] **All review comments resolved**
- [ ] **No merge conflicts**
- [ ] **Branch up to date with target**
- [ ] **Tests are passing on target branch**
- [ ] **Documentation is complete**
- [ ] **Stakeholders notified** (if needed)
- [ ] **Deployment window confirmed** (if needed)
- [ ] **On-call team notified** (if needed)

---

## Post-merge Checklist

After merging:

- [ ] **Verify deployment successful**
- [ ] **Monitor metrics and logs**
- [ ] **Verify feature works in production/staging**
- [ ] **Close related issues**
- [ ] **Update project board**
- [ ] **Notify stakeholders of completion**
- [ ] **Delete feature branch**
- [ ] **Update documentation site** (if applicable)

---

## Communication

### Announcement

- [ ] **Requires announcement** to team/users
- [ ] **Release notes prepared**
- [ ] **Stakeholders identified and will be notified**

**Notification Channels:**

- [ ] Team Slack channel
- [ ] Company-wide announcement
- [ ] Email to customers
- [ ] Blog post
- [ ] Release notes

**Announcement Message:**
[Draft announcement message here]

---

## Acknowledgments

**Pair Programming / Collaboration:**

- [Name] - [Contribution]

**Special Thanks:**

- [Name] - [What they helped with]

**Reviewers:**

- @[username]
- @[username]

---

## Checklist Legend

✅ - Completed
⏳ - In Progress
❌ - Not Applicable
⚠️ - Needs Attention

---

## Additional Notes

[Any other information that reviewers or future developers should know]

---

**Ready for Review:** [ ] Yes [ ] No - [Reason]

**Priority:** [ ] Low [ ] Medium [ ] High [ ] Critical

**Target Merge Date:** [YYYY-MM-DD] (if applicable)

**Target Release:** v[version] (if applicable)

---

## PR Workflow Status

- [ ] **Draft** - Work in progress, not ready for review
- [ ] **Ready for Review** - Complete and ready for review
- [ ] **In Review** - Currently being reviewed
- [ ] **Changes Requested** - Reviewer feedback being addressed
- [ ] **Approved** - Approved and ready to merge
- [ ] **Merged** - Successfully merged

**Current Status:** [Draft / Ready for Review / In Review / Changes Requested / Approved / Merged]

---

<!--
Template Version: 1.0
Last Updated: [Date]

Instructions for using this template:
1. Fill out all applicable sections
2. Check all boxes that apply
3. Remove sections marked as "Not Applicable" if desired
4. Add screenshots/videos for UI changes
5. Ensure all checklist items are addressed before requesting review
6. Request reviews from appropriate team members
7. Respond to all review comments
8. Update this PR description as changes are made

Tips for great PRs:
- Keep PRs focused and reasonably sized (< 400 lines if possible)
- Write clear, descriptive commit messages
- Test thoroughly before requesting review
- Respond promptly to reviewer feedback
- Use draft PRs for work in progress
- Link to related issues and documentation
-->
