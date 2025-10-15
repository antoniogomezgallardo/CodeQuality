"""
AI-Powered Test Generator

This module demonstrates how to use OpenAI API to automatically generate
comprehensive test suites for functions, classes, and APIs.

Features:
- Unit test generation (Jest, Pytest, JUnit)
- Integration test generation
- E2E test generation (Playwright, Cypress)
- Test data generation
- Edge case detection
- Customizable test frameworks
"""

import os
from typing import List, Dict, Optional
from dataclasses import dataclass
import openai
from enum import Enum


class TestFramework(Enum):
    """Supported testing frameworks"""
    JEST = "Jest"
    PYTEST = "pytest"
    JUNIT = "JUnit"
    MOCHA = "Mocha"
    RSPEC = "RSpec"
    PLAYWRIGHT = "Playwright"
    CYPRESS = "Cypress"


class TestType(Enum):
    """Types of tests to generate"""
    UNIT = "unit"
    INTEGRATION = "integration"
    E2E = "e2e"
    COMPONENT = "component"


@dataclass
class TestGenerationConfig:
    """Configuration for test generation"""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    model: str = "gpt-4-turbo-preview"
    temperature: float = 0.1  # Low for deterministic tests
    max_tokens: int = 2000


class AITestGenerator:
    """
    AI-powered test generator using OpenAI API

    Example usage:
        generator = AITestGenerator()
        tests = generator.generate_unit_tests(
            code=my_function_code,
            language="Python",
            framework=TestFramework.PYTEST
        )
    """

    def __init__(self, config: Optional[TestGenerationConfig] = None):
        self.config = config or TestGenerationConfig()
        self.client = openai.OpenAI(api_key=self.config.openai_api_key)

    def generate_unit_tests(
        self,
        code: str,
        language: str,
        framework: TestFramework,
        include_edge_cases: bool = True,
        include_error_handling: bool = True,
        coverage_target: int = 100
    ) -> str:
        """
        Generate comprehensive unit tests for given code

        Args:
            code: Source code to test
            language: Programming language
            framework: Testing framework to use
            include_edge_cases: Include edge case tests
            include_error_handling: Include error handling tests
            coverage_target: Target code coverage percentage

        Returns:
            Generated test code as string
        """
        prompt = self._build_unit_test_prompt(
            code=code,
            language=language,
            framework=framework,
            include_edge_cases=include_edge_cases,
            include_error_handling=include_error_handling,
            coverage_target=coverage_target
        )

        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert software testing engineer. Generate comprehensive, production-ready tests."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )

        return response.choices[0].message.content

    def _build_unit_test_prompt(
        self,
        code: str,
        language: str,
        framework: TestFramework,
        include_edge_cases: bool,
        include_error_handling: bool,
        coverage_target: int
    ) -> str:
        """Build comprehensive prompt for unit test generation"""

        prompt = f"""You are an expert QA engineer specializing in {language} and {framework.value}.

Task: Generate comprehensive unit tests for the following code.

Code to test:
```{language.lower()}
{code}
```

Requirements:
1. Testing Framework: {framework.value}
2. Coverage Goal: {coverage_target}% line coverage
3. Test Types Required:
   - Happy path scenarios (main functionality)"""

        if include_edge_cases:
            prompt += "\n   - Edge cases and boundary conditions"

        if include_error_handling:
            prompt += "\n   - Error handling (all exception paths)"

        prompt += """
   - Null/undefined/empty input handling
   - Type validation (if applicable)

4. Code Quality:
   - Use descriptive test names that explain what is tested
   - Follow AAA (Arrange, Act, Assert) pattern
   - Add setup/teardown if needed
   - Group related tests using describe/context blocks
   - Add comments for complex assertions

5. Test Data:
   - Use realistic test data
   - Avoid hardcoded magic numbers
   - Extract test data to constants when reused

6. Assertions:
   - Use appropriate matchers/assertions
   - Test both positive and negative cases
   - Verify return values and side effects

Output: Complete, runnable test file with all necessary imports.
"""

        return prompt

    def generate_integration_tests(
        self,
        api_spec: str,
        framework: TestFramework,
        include_auth: bool = True
    ) -> str:
        """
        Generate integration tests for API endpoints

        Args:
            api_spec: API specification or endpoint description
            framework: Testing framework to use
            include_auth: Include authentication tests

        Returns:
            Generated integration test code
        """
        prompt = f"""You are an expert in integration testing.

Task: Generate integration tests for the following API endpoint/component.

API/Component Details:
{api_spec}

Test Scenarios to Cover:
1. Successful request/response
2. Invalid input validation
{"3. Authentication/Authorization" if include_auth else ""}
4. Error handling (4xx, 5xx)
5. Database interactions
6. Response schema validation

Requirements:
- Framework: {framework.value}
- Use appropriate HTTP client library
- Include setup/teardown for test data
- Verify status codes, response structure, headers
- Test idempotency where applicable

Output: Complete integration test suite with setup/teardown.
"""

        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": "You are an integration testing expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )

        return response.choices[0].message.content

    def generate_e2e_tests(
        self,
        user_story: str,
        framework: TestFramework,
        use_page_objects: bool = True
    ) -> Dict[str, str]:
        """
        Generate E2E tests from user story

        Args:
            user_story: User story or feature description
            framework: E2E testing framework (Playwright/Cypress)
            use_page_objects: Use Page Object Model pattern

        Returns:
            Dictionary with test file and page objects
        """
        prompt = f"""You are an E2E testing expert using {framework.value}.

User Story:
{user_story}

Task: Generate comprehensive E2E tests that validate this user story.

Requirements:
1. Framework: {framework.value}
{"2. Pattern: Use Page Object Model" if use_page_objects else "2. Pattern: Direct selector approach"}
3. Selectors: Prefer data-testid attributes
4. Waits: Use explicit waits, no hard-coded sleeps
5. Assertions: Check both UI state and API responses where applicable

Test Scenarios:
- Happy path (user completes flow successfully)
- Alternative paths (user takes different route)
- Error scenarios (invalid inputs, network errors)
- Edge cases (boundary values, special characters)

Output:
{"1. Page Object classes for each page/component" if use_page_objects else ""}
{"2. Test file with all scenarios" if use_page_objects else "1. Test file with all scenarios"}
{"3. Fixture file with test data" if use_page_objects else "2. Fixture file with test data"}
"""

        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": "You are an E2E testing specialist."},
                {"role": "user", "content": prompt}
            ],
            temperature=self.config.temperature,
            max_tokens=3000  # E2E tests tend to be longer
        )

        # Parse response into separate files
        content = response.choices[0].message.content
        return {"combined": content}  # In production, parse into separate files

    def generate_test_data(
        self,
        schema: str,
        num_samples: int = 10,
        data_type: str = "valid"
    ) -> str:
        """
        Generate realistic test data

        Args:
            schema: Data schema or interface definition
            num_samples: Number of samples to generate
            data_type: "valid", "invalid", or "edge_case"

        Returns:
            Generated test data in JSON format
        """
        prompt = f"""You are a test data specialist.

Task: Generate realistic, diverse test data for the following schema.

Schema:
{schema}

Requirements:
- Generate {num_samples} test data samples
- Data Type: {data_type.upper()}
- Format: Output as JSON array

"""

        if data_type == "valid":
            prompt += """For VALID data:
- Follow all validation rules
- Ensure referential integrity
- Use realistic values (real names, valid emails, etc.)
- Include diversity (different demographics, locales, formats)
"""
        elif data_type == "invalid":
            prompt += """For INVALID data:
- Violate specific validation rules systematically
- Include boundary violations
- Include type mismatches
- Each sample should fail validation for a different reason
"""
        else:  # edge_case
            prompt += """For EDGE CASE data:
- Minimum/maximum values
- Empty strings, nulls, undefined
- Special characters, Unicode
- Very long strings
- Unusual but valid formats
"""

        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": "You are a test data generation expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Slightly higher for diversity
            max_tokens=2000
        )

        return response.choices[0].message.content

    def generate_missing_tests(
        self,
        source_code: str,
        existing_tests: str,
        coverage_report: Optional[str] = None
    ) -> str:
        """
        Generate tests for uncovered code paths

        Args:
            source_code: Source code
            existing_tests: Current test suite
            coverage_report: Optional coverage report showing gaps

        Returns:
            Additional test cases to improve coverage
        """
        prompt = f"""You are a QA analyst specializing in test coverage analysis.

Task: Analyze the code and existing tests, then generate tests for uncovered code paths.

Source Code:
```
{source_code}
```

Existing Tests:
```
{existing_tests}
```

{"Coverage Report:\n" + coverage_report if coverage_report else ""}

Requirements:
1. Analyze which code paths are not covered
2. Generate tests specifically for uncovered lines
3. Prioritize:
   - Error handling paths
   - Edge cases
   - Conditional branches
4. Match style of existing tests
5. Do not duplicate existing test scenarios

Output:
- List of uncovered scenarios (bullet points)
- New test cases to add to existing test file
- Explanation of what each new test covers
"""

        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": "You are a test coverage expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=self.config.temperature,
            max_tokens=2000
        )

        return response.choices[0].message.content


# Example usage and demonstrations
def example_unit_test_generation():
    """Example: Generate unit tests for a Python function"""

    source_code = """
def calculate_discount(price, discount_percent, member_tier="regular"):
    '''
    Calculate discounted price based on percentage and member tier

    Args:
        price: Original price (must be positive)
        discount_percent: Discount percentage (0-100)
        member_tier: Member tier (regular, silver, gold)

    Returns:
        Final price after discount and tier bonus
    '''
    if price < 0:
        raise ValueError("Price cannot be negative")

    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")

    tier_bonuses = {
        "regular": 0,
        "silver": 5,
        "gold": 10
    }

    if member_tier not in tier_bonuses:
        raise ValueError(f"Invalid member tier: {member_tier}")

    # Apply discount
    discounted = price * (1 - discount_percent / 100)

    # Apply tier bonus
    tier_bonus = tier_bonuses[member_tier]
    final_price = discounted * (1 - tier_bonus / 100)

    return round(final_price, 2)
"""

    generator = AITestGenerator()

    print("Generating unit tests...")
    tests = generator.generate_unit_tests(
        code=source_code,
        language="Python",
        framework=TestFramework.PYTEST,
        include_edge_cases=True,
        include_error_handling=True,
        coverage_target=100
    )

    print("\n" + "=" * 80)
    print("GENERATED TESTS:")
    print("=" * 80)
    print(tests)

    return tests


def example_api_integration_tests():
    """Example: Generate integration tests for API"""

    api_spec = """
POST /api/users
Creates a new user account

Request Body:
{
  "email": "string",
  "username": "string",
  "password": "string",
  "age": number
}

Response 201:
{
  "id": "string",
  "email": "string",
  "username": "string",
  "created_at": "timestamp"
}

Validation:
- Email must be valid format
- Username must be 3-20 characters, alphanumeric
- Password must be 8+ characters
- Age must be 18+

Error Responses:
- 400: Validation error
- 409: User already exists
- 500: Server error
"""

    generator = AITestGenerator()

    print("Generating integration tests...")
    tests = generator.generate_integration_tests(
        api_spec=api_spec,
        framework=TestFramework.PYTEST,
        include_auth=True
    )

    print("\n" + "=" * 80)
    print("GENERATED INTEGRATION TESTS:")
    print("=" * 80)
    print(tests)

    return tests


def example_test_data_generation():
    """Example: Generate test data"""

    schema = """
interface User {
  id: string;
  email: string;
  username: string;
  age: number;
  country: string;
  created_at: Date;
  is_active: boolean;
}
"""

    generator = AITestGenerator()

    print("Generating valid test data...")
    valid_data = generator.generate_test_data(
        schema=schema,
        num_samples=5,
        data_type="valid"
    )

    print("\n" + "=" * 80)
    print("GENERATED TEST DATA (VALID):")
    print("=" * 80)
    print(valid_data)

    print("\n\nGenerating invalid test data...")
    invalid_data = generator.generate_test_data(
        schema=schema,
        num_samples=5,
        data_type="invalid"
    )

    print("\n" + "=" * 80)
    print("GENERATED TEST DATA (INVALID):")
    print("=" * 80)
    print(invalid_data)

    return valid_data, invalid_data


if __name__ == "__main__":
    print("AI Test Generator Examples\n")

    # Run examples
    print("\n\n### EXAMPLE 1: Unit Test Generation ###\n")
    example_unit_test_generation()

    print("\n\n### EXAMPLE 2: Integration Test Generation ###\n")
    example_api_integration_tests()

    print("\n\n### EXAMPLE 3: Test Data Generation ###\n")
    example_test_data_generation()
