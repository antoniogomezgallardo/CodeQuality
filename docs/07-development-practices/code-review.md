# Code Review

## Overview

Code review is the systematic examination of source code by peers to identify bugs, improve code quality, share knowledge, and maintain coding standards before code is merged into the main codebase.

## Purpose

- **Quality assurance**: Catch bugs and issues before production
- **Knowledge sharing**: Spread understanding across team
- **Mentorship**: Learn from each other's approaches
- **Standards enforcement**: Maintain consistent code style
- **Risk reduction**: Multiple eyes reduce oversight
- **Documentation**: Review comments provide context

## Code Review Process

### 1. Pre-Review (Author)

```markdown
**Before Creating Pull Request:**

- [ ] Code is complete and tested
- [ ] All tests pass locally
- [ ] Code follows style guide
- [ ] Self-review completed
- [ ] Commits are logical and well-messaged
- [ ] PR description is clear
- [ ] Related issue is linked

**Pull Request Template:**

## Description

[What changes were made and why]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guide
- [ ] Self-reviewed
- [ ] Documentation updated
- [ ] No new warnings

## Screenshots (if applicable)

[Add screenshots]
```

### 2. Review (Reviewer)

```markdown
**Review Checklist:**

- [ ] Code solves the stated problem
- [ ] Logic is correct and efficient
- [ ] Error handling is appropriate
- [ ] Tests are comprehensive
- [ ] Code is readable and maintainable
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Documentation is adequate
```

### 3. Feedback

```markdown
**Comment Types:**

**Must Fix (Blocking):**
"This will cause a null pointer exception when user is undefined"

**Should Fix (Non-blocking but important):**
"Consider extracting this into a separate function for reusability"

**Nit (Nice to have):**
"Nit: This variable could have a more descriptive name"

**Question:**
"Why did we choose approach X over Y here?"

**Praise:**
"Great use of the strategy pattern here!"
```

## Review Best Practices

### For Authors

```markdown
**Keep PRs Small:**
✅ 50-250 lines changed
✅ Single responsibility
✅ Completable in <1 day
❌ 1000+ line PRs

**Write Clear Descriptions:**
✅ "Adds password reset via email with 1-hour expiry token"
❌ "Fix bugs"

**Respond to Feedback Promptly:**
✅ Address within 24 hours
✅ Mark conversations as resolved
✅ Explain decisions clearly

**Be Open to Feedback:**
✅ "Good catch, I'll fix that"
✅ "I hadn't considered that, let me refactor"
❌ "This is fine as is"
```

### For Reviewers

```markdown
**Be Kind and Constructive:**
✅ "What do you think about extracting this to a helper function?"
❌ "This code is terrible"

**Explain the Why:**
✅ "Using const here prevents accidental reassignment"
❌ "Change var to const"

**Suggest, Don't Command:**
✅ "Consider using Array.map() for better readability"
✅ "What if we..."
❌ "You must use map()"

**Balance Feedback:**

- Point out positives, not just issues
- Prioritize critical issues
- Don't nitpick excessively

**Review Promptly:**

- Within 24 hours
- Block time for reviews daily
- Use notifications effectively
```

## What to Look For

### 1. Correctness

```javascript
// ❌ BAD: Off-by-one error
for (let i = 1; i <= array.length; i++) {
  console.log(array[i]); // Will error on last iteration
}

// ✅ GOOD: Correct loop
for (let i = 0; i < array.length; i++) {
  console.log(array[i]);
}

// Review Comment:
('This loop will throw an error on the last iteration. Use i < array.length instead.');
```

### 2. Error Handling

```javascript
// ❌ BAD: No error handling
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();
  return user;
}

// ✅ GOOD: Proper error handling
async function getUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching user', { id, error });
    throw new Error('Unable to retrieve user');
  }
}

// Review Comment:
('Add error handling for failed requests and JSON parsing errors');
```

### 3. Security

```javascript
// ❌ BAD: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD: Parameterized query
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email]);

// Review Comment:
('⚠️ Security: This is vulnerable to SQL injection. Use parameterized queries.');
```

### 4. Performance

```javascript
// ❌ BAD: N+1 query problem
for (const user of users) {
  user.orders = await db.query('SELECT * FROM orders WHERE user_id = ?', [user.id]);
}

// ✅ GOOD: Single query
const userIds = users.map(u => u.id);
const orders = await db.query('SELECT * FROM orders WHERE user_id IN (?)', [userIds]);
users.forEach(user => {
  user.orders = orders.filter(o => o.user_id === user.id);
});

// Review Comment:
('This will make N database queries. Fetch all orders in one query instead.');
```

### 5. Readability

```javascript
// ❌ BAD: Unclear logic
if (u.a && (u.s === 'p' || u.s === 'e') && !u.d) {
  // ...
}

// ✅ GOOD: Clear and self-documenting
const isActiveUser = user.isActive;
const isPremiumOrEnterprise = user.status === 'premium' || user.status === 'enterprise';
const isNotDeleted = !user.deletedAt;

if (isActiveUser && isPremiumOrEnterprise && isNotDeleted) {
  // ...
}

// Review Comment:
('Consider extracting this condition to a well-named variable or function for clarity');
```

## Code Review Metrics

```javascript
const reviewMetrics = {
  // Time from PR created to first review
  timeToFirstReview: 4, // hours (target: <24 hours)

  // Time from PR created to merged
  timeToMerge: 18, // hours (target: <48 hours)

  // Number of review rounds
  reviewRounds: 2, // (target: 1-2)

  // Number of comments per PR
  commentsPerPR: 8, // (typical: 5-15)

  // Percentage of PRs approved without changes
  approvalRate: 40, // % (typical: 30-50%)

  // Defects found in review vs. production
  defectCatchRate: 85, // % (target: >80%)
};
```

## Common Pitfalls

```markdown
**Rubber Stamping:**
❌ Approving without actually reviewing
✅ Block time for thorough review

**Analysis Paralysis:**
❌ Endless back-and-forth on minor issues
✅ Accept "good enough", not perfect

**Ego and Defensiveness:**
❌ Taking feedback personally
✅ Focus on code, not person

**Scope Creep:**
❌ "While you're at it, also refactor..."
✅ Keep changes focused on original goal

**Late Reviews:**
❌ Reviewing days after PR created
✅ Review within 24 hours
```

## Related Resources

- [Clean Code Principles](clean-code-principles.md)
- [Definition of Done](../02-agile-planning/definition-of-done.md)
- [Testing Strategy](../04-testing-strategy/README.md)

## References

- Google Engineering Practices - Code Review
- GitHub - Code Review Best Practices
- Smart Bear - Best Practices for Code Review

---

_Part of: [Development Practices](README.md)_
