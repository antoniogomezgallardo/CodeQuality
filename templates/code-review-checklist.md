# Code Review Checklist

## Pre-Review Checklist (Author)

### Before Submitting for Review

- [ ] Self-review completed - read through your own code
- [ ] All tests are passing locally
- [ ] Code follows team style guidelines
- [ ] No debug code, console logs, or commented-out code
- [ ] Pull request has clear title and description
- [ ] Relevant documentation updated
- [ ] Breaking changes clearly documented

### Pull Request Quality

- [ ] PR is focused on a single feature/fix
- [ ] PR size is reasonable (< 400 lines preferred)
- [ ] Commit messages follow conventional format
- [ ] Related issue/ticket linked
- [ ] Screenshots included for UI changes

---

## Code Review Checklist (Reviewer)

### Functionality

- [ ] Code does what it's supposed to do
- [ ] Code handles edge cases appropriately
- [ ] Error conditions are handled gracefully
- [ ] Input validation is appropriate
- [ ] Business logic is correct
- [ ] No obvious bugs present

### Design & Architecture

- [ ] Code follows SOLID principles
- [ ] Appropriate design patterns used
- [ ] Code is modular and loosely coupled
- [ ] No over-engineering or premature optimization
- [ ] Abstractions are at the right level
- [ ] Integration points are well-defined

### Code Quality

- [ ] Variable and function names are descriptive
- [ ] Functions are small and focused (single responsibility)
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Magic numbers/strings are avoided (use constants)
- [ ] Code complexity is reasonable
- [ ] Consistent formatting and style

### Performance

- [ ] No obvious performance bottlenecks
- [ ] Efficient algorithms and data structures used
- [ ] Database queries are optimized
- [ ] Appropriate caching strategies
- [ ] Memory usage considerations
- [ ] Network calls are minimized

### Security

- [ ] Input validation prevents injection attacks
- [ ] Authentication/authorization implemented correctly
- [ ] Sensitive data is not logged or exposed
- [ ] Encryption used for sensitive data
- [ ] XSS prevention measures in place
- [ ] No hardcoded secrets or credentials

### Testing

- [ ] Unit tests cover new functionality
- [ ] Tests are well-written and maintainable
- [ ] Edge cases are tested
- [ ] Mock objects used appropriately
- [ ] Integration tests included where needed
- [ ] Test coverage is adequate (aim for 80%+)

### Documentation

- [ ] Complex logic is documented
- [ ] API changes are documented
- [ ] README updated if necessary
- [ ] Comments explain why, not what
- [ ] Public interfaces are documented
- [ ] Breaking changes clearly explained

### Dependencies

- [ ] New dependencies are justified
- [ ] Dependencies are up-to-date and secure
- [ ] License compatibility verified
- [ ] Dependency versions are pinned appropriately

### Error Handling

- [ ] Exceptions are caught and handled appropriately
- [ ] Error messages are user-friendly
- [ ] Logging is appropriate and helpful
- [ ] Graceful degradation implemented
- [ ] Retry logic included where appropriate

### Concurrency (if applicable)

- [ ] Thread-safety considerations addressed
- [ ] Race conditions avoided
- [ ] Deadlock prevention measures
- [ ] Appropriate synchronization mechanisms
- [ ] Resource cleanup in finally blocks

---

## Review Comments Guidelines

### Providing Constructive Feedback

#### Use Positive Language

```
✅ Good: "Consider using a Map here for better performance"
❌ Avoid: "This is slow and wrong"

✅ Good: "What do you think about extracting this into a separate function?"
❌ Avoid: "This function is too long"

✅ Good: "Great use of the Strategy pattern here!"
❌ Avoid: Only pointing out negatives
```

#### Be Specific and Actionable

```
✅ Good: "Line 42: This could cause a NullPointerException if user is null. Consider adding a null check."
❌ Avoid: "This might have issues"

✅ Good: "Consider using Array.map() instead of forEach for functional style"
❌ Avoid: "This could be better"
```

#### Ask Questions for Clarification

```
✅ Good: "Could you explain why we need this delay here?"
✅ Good: "Is there a reason we're not using the existing UserService?"
✅ Good: "What's the expected behavior when this API fails?"
```

#### Categorize Comments

- **🐛 Bug**: Functional issues that need fixing
- **💡 Suggestion**: Improvements that could be made
- **❓ Question**: Need clarification or explanation
- **🎯 Nitpick**: Style or minor issues
- **🔒 Security**: Security-related concerns
- **⚡ Performance**: Performance implications

### Comment Examples

#### Security Issues

```
🔒 Security: This endpoint appears to be missing authentication.
Should we add middleware to verify user permissions?
```

#### Performance Concerns

```
⚡ Performance: This N+1 query could be expensive with large datasets.
Consider using a JOIN or batch loading.
```

#### Design Suggestions

```
💡 Suggestion: This function has multiple responsibilities.
Consider splitting into:
- validateInput()
- processData()
- saveResult()
```

#### Questions for Understanding

```
❓ Question: I see we're caching this data for 1 hour.
What's the reasoning behind this duration?
```

---

## Special Review Types

### Security-Focused Review

- [ ] Authentication mechanisms properly implemented
- [ ] Authorization checks in place
- [ ] Input sanitization and validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secrets management
- [ ] Audit logging for sensitive operations

### Performance-Focused Review

- [ ] Database query optimization
- [ ] Caching strategy implementation
- [ ] Algorithm efficiency
- [ ] Memory usage patterns
- [ ] Network call optimization
- [ ] Resource cleanup
- [ ] Scalability considerations

### API Review

- [ ] RESTful design principles followed
- [ ] Consistent naming conventions
- [ ] Proper HTTP status codes
- [ ] Versioning strategy
- [ ] Error response format
- [ ] Rate limiting considerations
- [ ] Documentation completeness

### Frontend Review

- [ ] Component reusability
- [ ] State management patterns
- [ ] Performance optimizations (lazy loading, etc.)
- [ ] Accessibility compliance
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] User experience consistency

---

## Post-Review Process

### For Authors

- [ ] Address all reviewer comments
- [ ] Ask for clarification if comments are unclear
- [ ] Update tests if functionality changed
- [ ] Re-request review after major changes
- [ ] Thank reviewers for their time and feedback

### For Reviewers

- [ ] Re-review changes after author updates
- [ ] Approve when all concerns are addressed
- [ ] Follow up on learning opportunities
- [ ] Share knowledge gained during review

---

## Review Metrics to Track

### Team Metrics

- Average review turnaround time
- Number of review iterations per PR
- Defect detection rate in reviews
- Review participation rate
- Review comment quality

### Individual Metrics

- Time spent on reviews
- Quality of review comments
- Defects found in review
- Knowledge sharing contributions

---

## Common Anti-Patterns to Avoid

### As a Reviewer

- ❌ Nitpicking on personal style preferences
- ❌ Reviewing implementation instead of design
- ❌ Being too harsh or personal in comments
- ❌ Approving without actually reviewing
- ❌ Focusing only on negatives

### As an Author

- ❌ Taking feedback personally
- ❌ Submitting work-in-progress for review
- ❌ Making changes without updating tests
- ❌ Ignoring reviewer feedback
- ❌ Submitting massive pull requests

---

## Tools and Automation

### Automated Checks (should pass before human review)

- [ ] Linting rules
- [ ] Code formatting
- [ ] Unit test execution
- [ ] Security scanning
- [ ] Dependency checking
- [ ] Build verification

### Review Tools Integration

- [ ] IDE plugins for review tools
- [ ] Automated reviewer assignment
- [ ] Review analytics dashboards
- [ ] Integration with project management tools

---

## Continuous Improvement

### Regular Review Process Assessment

- [ ] Monthly review of review effectiveness
- [ ] Quarterly update of checklist
- [ ] Annual training on review best practices
- [ ] Feedback collection from team members

### Learning Opportunities

- [ ] Share interesting findings from reviews
- [ ] Discuss patterns and anti-patterns
- [ ] Knowledge sharing sessions
- [ ] Code review workshops

---

_Remember: The goal of code review is to improve code quality, share knowledge, and mentor team members. Keep discussions professional and focus on the code, not the person._
