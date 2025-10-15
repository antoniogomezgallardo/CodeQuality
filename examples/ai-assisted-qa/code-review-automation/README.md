# AI-Powered Code Review Automation

Automate code reviews using AI to detect bugs, security vulnerabilities, performance issues, and enforce best practices.

## Features

✅ **Automated PR Reviews**: Automatically review pull requests
✅ **Bug Detection**: Identify logic errors and edge cases
✅ **Security Scanning**: Detect SQL injection, XSS, auth issues
✅ **Performance Analysis**: Find inefficient code and bottlenecks
✅ **Best Practices**: Enforce coding standards and patterns
✅ **GitHub Integration**: Post reviews directly to PRs
✅ **Customizable Focus**: Target specific review areas
✅ **Multi-Language**: Python, JavaScript, TypeScript, Java, Go

## Quick Start

### Local Usage

```bash
# Install dependencies
pip install openai==1.3.0

# Set API key
export OPENAI_API_KEY="sk-your-key-here"

# Run review
python ai_code_reviewer.py
```

### Example: Review a Python file

```python
from ai_code_reviewer import AICodeReviewer

code = """
def process_payment(amount, card_number):
    # Process payment
    query = f"INSERT INTO payments VALUES ('{amount}', '{card_number}')"
    db.execute(query)
    return True
"""

reviewer = AICodeReviewer()
result = reviewer.review_code(code, language="Python")

print(f"Score: {result.overall_score}/100")
print(f"Issues: {len(result.comments)}")
for comment in result.comments:
    print(f"- Line {comment.line_number}: {comment.message}")
```

## GitHub Actions Integration

### Setup

1. **Add GitHub Action workflow**

```yaml
# .github/workflows/ai-code-review.yml
name: AI Code Review

on:
  pull_request:
    branches: [main, develop]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install openai==1.3.0

      - name: Run AI Review
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: python .github/scripts/ai_review.py --files "*.py"
```

2. **Add OpenAI API key to GitHub Secrets**

   - Go to repository Settings → Secrets and variables → Actions
   - Add secret: `OPENAI_API_KEY` with your OpenAI API key

3. **Copy the workflow files**

```bash
# Copy workflow
cp examples/ai-assisted-qa/code-review-automation/.github/workflows/ai-code-review.yml \
   .github/workflows/

# Copy scripts
cp -r examples/ai-assisted-qa/code-review-automation/.github/scripts \
   .github/
```

### Workflow Features

The included GitHub Actions workflow provides:

- ✅ **Automatic PR Reviews**: Runs on every PR
- ✅ **Changed Files Only**: Reviews only modified files
- ✅ **Status Checks**: Pass/fail based on review score
- ✅ **PR Comments**: Posts review findings as comments
- ✅ **Security Scan**: Separate job for security-focused review
- ✅ **Artifacts**: Uploads detailed reports
- ✅ **Fail on Critical**: Blocks merge if critical issues found

## Review Examples

### Example 1: Security Vulnerabilities

**Input Code:**
```python
def login(username, password):
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    result = db.execute(query)
    return result
```

**AI Review Output:**
```
🔴 CRITICAL - Security (Line 2)
SQL Injection vulnerability: User input directly interpolated into SQL query

💡 Suggestion: Use parameterized queries
CODE: cursor.execute("SELECT * FROM users WHERE username=? AND password=?", (username, password))
```

### Example 2: Performance Issues

**Input Code:**
```python
def find_duplicates(items):
    duplicates = []
    for i in range(len(items)):
        for j in range(len(items)):
            if i != j and items[i] == items[j]:
                if items[i] not in duplicates:
                    duplicates.append(items[i])
    return duplicates
```

**AI Review Output:**
```
🟠 HIGH - Performance (Line 3)
O(n²) algorithm: Nested loops over entire list

💡 Suggestion: Use set for O(n) complexity
CODE: return [item for item, count in Counter(items).items() if count > 1]
```

### Example 3: Bug Detection

**Input Code:**
```javascript
function calculateAverage(numbers) {
  let sum = 0;
  for (let i = 0; i <= numbers.length; i++) {
    sum += numbers[i];
  }
  return sum / numbers.length;
}
```

**AI Review Output:**
```
🟠 HIGH - Bug (Line 3)
Off-by-one error: Loop condition should be i < numbers.length, not i <= numbers.length

Also: Division by zero not handled if numbers.length === 0

💡 Suggestion: Fix loop and add validation
CODE:
if (numbers.length === 0) return 0;
for (let i = 0; i < numbers.length; i++) {
  sum += numbers[i];
}
```

## Review Categories

### 1. Bug Detection

Identifies:
- Logic errors
- Off-by-one errors
- Null/undefined handling
- Race conditions
- Edge case failures

### 2. Security Analysis

Detects:
- SQL injection
- XSS vulnerabilities
- CSRF issues
- Authentication/authorization flaws
- Sensitive data exposure
- Insecure cryptography

### 3. Performance Optimization

Finds:
- Inefficient algorithms (O(n²) when O(n) possible)
- Unnecessary loops
- Memory leaks
- Resource exhaustion
- Blocking operations

### 4. Maintainability

Reviews:
- Code complexity
- Code duplication
- Naming conventions
- Function length
- Single Responsibility Principle

### 5. Best Practices

Checks:
- SOLID principles
- Design patterns
- Language idioms
- Error handling
- Logging practices

## Configuration

### Custom Review Focus

```python
from ai_code_reviewer import AICodeReviewer, Category

reviewer = AICodeReviewer()

# Security-only review
result = reviewer.review_code(
    code=code,
    language="Python",
    focus_areas=[Category.SECURITY]
)

# Performance and security
result = reviewer.review_code(
    code=code,
    language="Python",
    focus_areas=[Category.SECURITY, Category.PERFORMANCE]
)
```

### Custom Severity Thresholds

```python
# Modify workflow to adjust thresholds
SCORE_THRESHOLD = 70        # Minimum score to pass
ALLOW_CRITICAL = False      # Block PRs with critical issues
ALLOW_HIGH = 3              # Maximum high-severity issues
```

### Language-Specific Rules

```python
# Add language-specific context
context = {
    "Python": "Follow PEP 8 style guide",
    "JavaScript": "Use ES6+ features, avoid var",
    "Java": "Follow Oracle Java conventions",
}

result = reviewer.review_code(
    code=code,
    language=language,
    context=context.get(language, "")
)
```

## GitHub PR Comment Example

When the workflow runs, it posts a comment like this:

```markdown
## 🤖 AI Code Review Results

🟡 **Overall Score:** 75/100

⚠️  **Recommendation:** Approved with suggestions

**Files Reviewed:** 3
**Total Issues:** 8
**🔴 Critical Issues:** 0
**🟠 High Priority Issues:** 2

---

### 🟠 High Priority Issues

- **auth.py:23** - Security: SQL injection vulnerability in login query
  💡 *Use parameterized queries with bound parameters*

- **utils.py:45** - Performance: O(n²) algorithm in find_duplicates
  💡 *Use Counter from collections for O(n) complexity*

### 🟡 Medium Priority Issues

- **handlers.py:12** - Maintainability: Function exceeds 50 lines
  💡 *Extract helper functions to reduce complexity*

- **models.py:89** - Best Practice: Missing docstring
  💡 *Add docstring describing parameters and return value*

---

*🤖 Generated by AI Code Reviewer powered by GPT-4*
```

## Cost Analysis

### Per Review

```yaml
Typical PR Review:
  - Files changed: 5
  - Lines per file: 200
  - Total code: ~1,000 lines

Cost Breakdown:
  Input tokens: ~3,000 (code + prompt)
  Output tokens: ~1,500 (review comments)

  Cost: $0.03 input + $0.045 output = ~$0.075 per PR

Monthly Cost (50 PRs):
  - 50 PRs × $0.075 = $3.75/month
```

### ROI Calculation

```yaml
Time Savings:
  - Code review time saved: 15-30 min per PR
  - Human reviewer rate: $100/hr
  - Value: $25-50 per PR

Cost: $0.075 per PR

ROI: $25-50 saved - $0.075 cost = $24.93-49.93 net benefit per PR
Monthly ROI (50 PRs): $1,246 - $2,496
```

## Best Practices

### ✅ Do's

1. **Review AI Comments**: Don't auto-merge, always review
2. **Adjust Thresholds**: Set appropriate score thresholds for your team
3. **Focus Reviews**: Use focus_areas for targeted analysis
4. **Track Metrics**: Monitor review quality over time
5. **Combine with Human Review**: AI augments, doesn't replace humans

### ❌ Don'ts

1. **Don't Auto-Merge**: Always have human review
2. **Don't Trust Blindly**: AI can miss context
3. **Don't Skip Security**: Always run security-focused scans
4. **Don't Ignore False Positives**: Adjust prompts if too many
5. **Don't Review Generated Code**: Exclude build artifacts, minified files

## Troubleshooting

### Issue: Too Many False Positives

**Solution:** Adjust temperature and add context
```python
config = TestGenerationConfig(temperature=0.05)  # More conservative
reviewer = AICodeReviewer(config)
```

### Issue: Missing Real Issues

**Solution:** Increase focus areas and lower score threshold
```python
result = reviewer.review_code(
    code=code,
    language=language,
    focus_areas=[Category.BUG, Category.SECURITY, Category.PERFORMANCE]
)
```

### Issue: Reviews Too Slow

**Solution:** Review only changed lines, not entire files
```bash
# Get diff only
git diff main...HEAD > changes.diff

# Review diff instead of full files
python ai_review.py --diff changes.diff
```

## Advanced Usage

### Review Git Diff

```python
import subprocess

# Get diff
diff = subprocess.check_output(['git', 'diff', 'main...HEAD']).decode()

# Review only changes
result = reviewer.review_diff(diff, language="Python")
```

### Batch Review

```python
import os
from pathlib import Path

def review_directory(directory):
    """Review all Python files in directory"""
    for py_file in Path(directory).rglob("*.py"):
        with open(py_file) as f:
            code = f.read()

        result = reviewer.review_code(code, "Python")

        if result.overall_score < 70:
            print(f"⚠️  {py_file}: Score {result.overall_score}")
```

### Custom Reviewers

```python
class StrictSecurityReviewer(AICodeReviewer):
    """Extra strict security-focused reviewer"""

    def review_code(self, code, language, **kwargs):
        # Always focus on security
        kwargs['focus_areas'] = [Category.SECURITY]

        result = super().review_code(code, language, **kwargs)

        # Fail if any security issue
        if any(c.category == Category.SECURITY for c in result.comments):
            result.approval_recommended = False

        return result
```

## Related Documentation

- [AI-Assisted Testing](../../../docs/15-ai-in-quality-assurance/ai-assisted-testing.md)
- [Test Generation Prompts](../../../templates/ai-test-generation-prompts.md)
- [AI Tool Evaluation](../../../templates/ai-tool-evaluation.md)

## License

MIT License
