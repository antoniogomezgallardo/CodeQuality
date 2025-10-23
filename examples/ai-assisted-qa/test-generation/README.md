# AI-Powered Test Generation

This directory demonstrates how to use AI (specifically OpenAI's GPT-4) to automatically generate comprehensive test suites.

## Contents

```
test-generation/
├── test_generator.py           # Main test generation tool
├── example_outputs/             # Real examples of AI-generated tests
│   ├── pytest_tests.py         # Comprehensive pytest example
│   ├── jest_tests.test.js      # Comprehensive Jest example
│   ├── integration_tests.py    # API integration tests
│   └── test_data.json          # Generated test data
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set OpenAI API key
export OPENAI_API_KEY="sk-your-key-here"
```

### Basic Usage

```python
from test_generator import AITestGenerator, TestFramework

# Initialize generator
generator = AITestGenerator()

# Generate unit tests
source_code = """
def add(a, b):
    return a + b
"""

tests = generator.generate_unit_tests(
    code=source_code,
    language="Python",
    framework=TestFramework.PYTEST
)

print(tests)
```

## Features

### 1. Unit Test Generation

Generate comprehensive unit tests with:

- ✅ Happy path tests
- ✅ Edge cases and boundary conditions
- ✅ Error handling tests
- ✅ Type validation tests
- ✅ Parameterized tests
- ✅ Test fixtures

**Example:**

```python
generator = AITestGenerator()

code = """
def calculate_discount(price, discount_percent):
    if price < 0:
        raise ValueError("Price cannot be negative")
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    return price * (1 - discount_percent / 100)
"""

tests = generator.generate_unit_tests(
    code=code,
    language="Python",
    framework=TestFramework.PYTEST,
    coverage_target=100
)
```

**Generated Output:** See [example_outputs/pytest_tests.py](example_outputs/pytest_tests.py)

### 2. Integration Test Generation

Generate tests for API endpoints:

```python
api_spec = """
POST /api/users
Request: {"email": "string", "password": "string"}
Response 201: {"id": "string", "email": "string"}
Response 400: {"error": "string"}
"""

tests = generator.generate_integration_tests(
    api_spec=api_spec,
    framework=TestFramework.PYTEST,
    include_auth=True
)
```

### 3. E2E Test Generation

Generate end-to-end tests from user stories:

```python
user_story = """
As a user, I want to login to the application
Given I am on the login page
When I enter valid credentials
Then I should be redirected to the dashboard
"""

tests = generator.generate_e2e_tests(
    user_story=user_story,
    framework=TestFramework.PLAYWRIGHT,
    use_page_objects=True
)
```

### 4. Test Data Generation

Generate realistic test data:

```python
schema = """
interface User {
  id: string;
  email: string;
  age: number;
  country: string;
}
"""

# Generate valid data
valid_data = generator.generate_test_data(
    schema=schema,
    num_samples=10,
    data_type="valid"
)

# Generate invalid data for negative testing
invalid_data = generator.generate_test_data(
    schema=schema,
    num_samples=10,
    data_type="invalid"
)

# Generate edge cases
edge_cases = generator.generate_test_data(
    schema=schema,
    num_samples=10,
    data_type="edge_case"
)
```

### 5. Fill Coverage Gaps

Generate tests for uncovered code:

```python
source_code = "..."
existing_tests = "..."
coverage_report = """
Lines not covered: 45, 67-72, 89
"""

missing_tests = generator.generate_missing_tests(
    source_code=source_code,
    existing_tests=existing_tests,
    coverage_report=coverage_report
)
```

## Example Outputs

### Pytest Example

See [example_outputs/pytest_tests.py](example_outputs/pytest_tests.py) for a complete example showing:

- **Class-based test organization**: Logical grouping of related tests
- **Comprehensive coverage**: Happy path, edge cases, error handling, type validation
- **Descriptive test names**: Self-documenting test purposes
- **AAA pattern**: Arrange-Act-Assert structure
- **Parameterized tests**: Efficient testing of multiple scenarios
- **Fixtures**: Reusable test data
- **146 lines of well-structured tests** for a 30-line function

**Coverage achieved:** 100% line coverage, 100% branch coverage

### Jest Example

See [example_outputs/jest_tests.test.js](example_outputs/jest_tests.test.js) for:

- **Nested describe blocks**: Organized test suites
- **test.each() for parameterized tests**: Data-driven testing
- **Snapshot tests**: Behavior documentation
- **Performance tests**: Speed validation
- **Security tests**: XSS, SQL injection, special characters
- **370+ lines of comprehensive tests**

## Cost Analysis

### Per Test Generation

```yaml
Model: gpt-4-turbo-preview

Average Request:
  Input tokens: ~800 (prompt + code)
  Output tokens: ~1,500 (generated tests)

Cost per generation:
  Input: $0.008 (800 tokens × $0.01/1K)
  Output: $0.045 (1,500 tokens × $0.03/1K)
  Total: ~$0.053 per test suite

ROI Calculation:
  Time saved: 30-60 minutes per test suite
  At $100/hr developer rate: $50-100 value
  Net benefit: $50-100 - $0.053 = ~$50-100 saved
```

### Cost Reduction Strategies

1. **Use GPT-3.5-turbo**: 10x cheaper, ~$0.005 per generation
2. **Cache common patterns**: Reuse similar test structures
3. **Batch generation**: Generate multiple test files in one request
4. **Local LLM**: Use Ollama/Llama 3 (free, but lower quality)

## Quality Validation

### How to Validate AI-Generated Tests

1. **Review test names**: Ensure they describe what's tested
2. **Check coverage**: Run coverage tool to verify completeness
3. **Run tests**: Ensure all generated tests pass
4. **Review edge cases**: Validate edge cases make sense
5. **Check assertions**: Verify assertions are meaningful
6. **Code review**: Treat like human-written code

### Common Issues and Fixes

**Issue: Tests too generic**

```python
# Fix: Add more context to prompt
config = TestGenerationConfig(temperature=0.05)  # More deterministic
generator = AITestGenerator(config)
```

**Issue: Missing edge cases**

```python
# Fix: Explicitly request edge cases
tests = generator.generate_unit_tests(
    code=code,
    language="Python",
    framework=TestFramework.PYTEST,
    include_edge_cases=True,  # ← Ensure this is True
    coverage_target=100
)
```

**Issue: Tests don't match project style**

```python
# Fix: Add style guide to prompt
prompt = f"""
Generate tests following these style rules:
- Use snake_case for test names
- Maximum 80 characters per line
- Use single quotes for strings

{base_prompt}
"""
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Generate and Run Tests

on: [pull_request]

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r examples/ai-assisted-qa/test-generation/requirements.txt

      - name: Generate tests for changed files
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          python scripts/generate_tests_for_changed_files.py

      - name: Run generated tests
        run: pytest

      - name: Check coverage
        run: pytest --cov=. --cov-report=xml

      - name: Comment PR with results
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: 'Generated tests passed! ✅'
            })
```

### Pre-commit Hook Example

```bash
# .git/hooks/pre-commit

#!/bin/bash

# Generate tests for staged Python files
for file in $(git diff --cached --name-only --diff-filter=ACM | grep '\.py$'); do
    if [[ ! -f "tests/test_${file}" ]]; then
        echo "Generating tests for $file..."
        python generate_test.py "$file"
    fi
done
```

## Best Practices

### ✅ Do's

1. **Review all generated tests**: AI can make mistakes
2. **Customize prompts**: Tailor to your project's style
3. **Validate coverage**: Use coverage tools to verify completeness
4. **Version control**: Commit generated tests to track changes
5. **Iterate**: Regenerate if quality is poor
6. **Add context**: Provide function docstrings, types for better results

### ❌ Don'ts

1. **Don't blindly trust**: Always review generated code
2. **Don't skip testing**: Run generated tests before committing
3. **Don't ignore style**: Ensure tests match project conventions
4. **Don't over-generate**: Avoid generating tests for trivial code
5. **Don't commit sensitive data**: Sanitize code before sending to AI

## Advanced Usage

### Custom Test Patterns

```python
from test_generator import AITestGenerator

class CustomTestGenerator(AITestGenerator):
    def _build_unit_test_prompt(self, code, language, framework, **kwargs):
        """Override to add custom test patterns"""
        base_prompt = super()._build_unit_test_prompt(
            code, language, framework, **kwargs
        )

        custom_requirements = """
        Additional Requirements:
        - Use Given-When-Then naming (test_given_X_when_Y_then_Z)
        - Add @pytest.mark.unit decorator
        - Include type hints in test functions
        - Add module-level docstring
        """

        return base_prompt + custom_requirements

generator = CustomTestGenerator()
```

### Batch Generation

```python
import os
from pathlib import Path

def generate_tests_for_directory(src_dir, test_dir):
    """Generate tests for all Python files in directory"""
    generator = AITestGenerator()

    for py_file in Path(src_dir).rglob("*.py"):
        if py_file.name.startswith("test_"):
            continue

        with open(py_file, 'r') as f:
            code = f.read()

        tests = generator.generate_unit_tests(
            code=code,
            language="Python",
            framework=TestFramework.PYTEST
        )

        # Write to corresponding test file
        test_file = Path(test_dir) / f"test_{py_file.name}"
        with open(test_file, 'w') as f:
            f.write(tests)

        print(f"Generated tests for {py_file} -> {test_file}")

# Usage
generate_tests_for_directory("src/", "tests/")
```

### Integration with IDEs

**VS Code Extension:**

```json
// .vscode/settings.json
{
  "python.testing.pytestEnabled": true,
  "python.testing.autoTestDiscoverOnSaveEnabled": true,
  "aiTestGenerator.autoGenerate": true,
  "aiTestGenerator.framework": "pytest"
}
```

**JetBrains Plugin:**
Configure AI test generation as external tool in Settings → Tools → External Tools

## Troubleshooting

### Error: "OpenAI API key not found"

```bash
# Solution: Set environment variable
export OPENAI_API_KEY="sk-your-key-here"

# Or in Python
import os
os.environ["OPENAI_API_KEY"] = "sk-your-key-here"
```

### Error: "Rate limit exceeded"

```python
# Solution: Add retry logic
import time
from openai import RateLimitError

def generate_with_retry(generator, *args, max_retries=3, **kwargs):
    for attempt in range(max_retries):
        try:
            return generator.generate_unit_tests(*args, **kwargs)
        except RateLimitError:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Rate limit hit. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
```

### Issue: Generated tests fail

**Solution:** The AI-generated tests may have assumptions that don't match your actual code. Review and adjust:

1. Check import statements
2. Verify test data assumptions
3. Adjust assertions
4. Update mocking strategy

## Related Documentation

- [AI Test Generation Prompts](../../../templates/ai-test-generation-prompts.md) - Proven prompt templates
- [AI-Assisted Testing Guide](../../../docs/15-ai-in-quality-assurance/ai-assisted-testing.md) - Comprehensive guide
- [AI Fundamentals](../../../docs/15-ai-in-quality-assurance/ai-fundamentals.md) - Understanding LLMs

## Next Steps

1. **Try the examples**: Run `python test_generator.py` to see it in action
2. **Generate tests for your code**: Use the tool on your actual codebase
3. **Customize prompts**: Tailor prompts to your project's needs
4. **Integrate with CI/CD**: Automate test generation in your pipeline
5. **Experiment with frameworks**: Try different testing frameworks

## License

MIT License - See LICENSE file for details
