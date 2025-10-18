# pytest Quick Start

**Time:** 3 minutes
**Prerequisites:** Python 3.9+
**What You'll Learn:** Set up pytest and write your first Python unit test

## 1. Install (30 seconds)

```bash
# Create new project
mkdir my-pytest-project && cd my-pytest-project

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install pytest
pip install pytest pytest-cov
```

## 2. Configure (1 minute)

Create `pytest.ini`:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --cov=src
    --cov-report=term-missing
    --cov-report=html
```

Create project structure:

```bash
mkdir -p src tests
touch src/__init__.py tests/__init__.py
```

## 3. Hello World (2 minutes)

Create `src/calculator.py`:

```python
"""Simple calculator module."""

def add(a, b):
    """Add two numbers."""
    return a + b

def subtract(a, b):
    """Subtract b from a."""
    return a - b

def multiply(a, b):
    """Multiply two numbers."""
    return a * b

def divide(a, b):
    """Divide a by b."""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

Create `tests/test_calculator.py`:

```python
"""Tests for calculator module."""

import pytest
from src.calculator import add, subtract, multiply, divide


class TestAddition:
    """Tests for add function."""

    def test_add_positive_numbers(self):
        assert add(2, 3) == 5

    def test_add_negative_numbers(self):
        assert add(-1, -1) == -2

    def test_add_mixed_numbers(self):
        assert add(-1, 1) == 0


class TestSubtraction:
    """Tests for subtract function."""

    def test_subtract_positive_numbers(self):
        assert subtract(5, 3) == 2

    def test_subtract_results_negative(self):
        assert subtract(1, 5) == -4


class TestMultiplication:
    """Tests for multiply function."""

    def test_multiply_positive_numbers(self):
        assert multiply(3, 4) == 12

    def test_multiply_by_zero(self):
        assert multiply(5, 0) == 0


class TestDivision:
    """Tests for divide function."""

    def test_divide_normal(self):
        assert divide(10, 2) == 5

    def test_divide_results_float(self):
        result = divide(10, 3)
        assert abs(result - 3.333) < 0.01

    def test_divide_by_zero_raises_error(self):
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            divide(10, 0)
```

## 4. Run Tests (1 minute)

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov

# Run specific test file
pytest tests/test_calculator.py

# Run specific test class
pytest tests/test_calculator.py::TestAddition

# Run specific test
pytest tests/test_calculator.py::TestAddition::test_add_positive_numbers

# Run in verbose mode
pytest -v

# Run with output (print statements)
pytest -s
```

**Expected Output:**
```
======================== test session starts =========================
collected 10 items

tests/test_calculator.py::TestAddition::test_add_positive_numbers PASSED [10%]
tests/test_calculator.py::TestAddition::test_add_negative_numbers PASSED [20%]
tests/test_calculator.py::TestAddition::test_add_mixed_numbers PASSED [30%]
tests/test_calculator.py::TestSubtraction::test_subtract_positive_numbers PASSED [40%]
tests/test_calculator.py::TestSubtraction::test_subtract_results_negative PASSED [50%]
tests/test_calculator.py::TestMultiplication::test_multiply_positive_numbers PASSED [60%]
tests/test_calculator.py::TestMultiplication::test_multiply_by_zero PASSED [70%]
tests/test_calculator.py::TestDivision::test_divide_normal PASSED [80%]
tests/test_calculator.py::TestDivision::test_divide_results_float PASSED [90%]
tests/test_calculator.py::TestDivision::test_divide_by_zero_raises_error PASSED [100%]

---------- coverage: platform linux, python 3.11.5 -----------
Name                    Stmts   Miss  Cover   Missing
-----------------------------------------------------
src/calculator.py          12      0   100%
-----------------------------------------------------
TOTAL                      12      0   100%

========================= 10 passed in 0.05s =========================
```

## 5. Next Steps

### Fixtures for Setup/Teardown
```python
import pytest

@pytest.fixture
def sample_data():
    """Provide sample data for tests."""
    data = [1, 2, 3, 4, 5]
    return data

def test_using_fixture(sample_data):
    assert len(sample_data) == 5
    assert sum(sample_data) == 15
```

### Parametrized Tests
```python
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
    (100, 200, 300),
])
def test_add_parametrized(a, b, expected):
    assert add(a, b) == expected
```

### Test Markers
```python
@pytest.mark.slow
def test_slow_operation():
    # Long-running test
    pass

@pytest.mark.integration
def test_database_connection():
    # Integration test
    pass

# Run only marked tests
# pytest -m slow
# pytest -m "not slow"
```

### Mock External Dependencies
```python
from unittest.mock import Mock, patch

def test_api_call():
    with patch('requests.get') as mock_get:
        mock_get.return_value.json.return_value = {'data': 'test'}
        result = fetch_from_api()
        assert result == {'data': 'test'}
        mock_get.assert_called_once()
```

### Async Tests
```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    result = await async_operation()
    assert result == expected_value

# Install: pip install pytest-asyncio
```

### Create conftest.py for Shared Fixtures
```python
# tests/conftest.py
import pytest

@pytest.fixture(scope="session")
def database():
    """Setup database for all tests."""
    db = setup_test_database()
    yield db
    teardown_test_database(db)

@pytest.fixture(autouse=True)
def reset_state():
    """Reset state before each test."""
    clear_cache()
    yield
    # Cleanup after test
```

## 6. Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'src'"
```bash
# Solution 1: Install package in editable mode
pip install -e .

# Solution 2: Add to pytest.ini
[pytest]
pythonpath = .

# Solution 3: Set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:${PWD}"  # Unix
set PYTHONPATH=%PYTHONPATH%;%CD%          # Windows
```

### Issue: Tests not discovered
```bash
# Ensure file/function naming follows conventions:
# - Test files: test_*.py or *_test.py
# - Test classes: Test*
# - Test functions: test_*

# Check discovery with:
pytest --collect-only
```

### Issue: "ImportError: attempted relative import with no known parent package"
```python
# Don't use relative imports in test files
# ❌ from ..src import calculator
# ✅ from src import calculator

# Or use absolute imports
# ✅ import src.calculator
```

### Issue: Coverage not including all files
```ini
# Update pytest.ini
[pytest]
addopts =
    --cov=src
    --cov-report=term-missing
    --cov-fail-under=80

# Or use .coveragerc
[run]
source = src
omit =
    */tests/*
    */venv/*
```

### Issue: Fixtures not found
```python
# Make sure conftest.py is in tests directory
# tests/conftest.py

# Fixture must be in:
# 1. Same file as test
# 2. conftest.py in same directory
# 3. conftest.py in parent directory
```

### Issue: Slow test execution
```bash
# Run tests in parallel
pip install pytest-xdist
pytest -n auto  # Auto-detect CPU cores
pytest -n 4     # Use 4 workers

# Run only failed tests
pytest --lf  # Last failed
pytest --ff  # Failed first, then others
```

## 🎓 Common Assertions Reference

```python
# Basic assertions
assert value == expected
assert value != expected
assert value > 5
assert value in [1, 2, 3]
assert "substring" in string

# Type checks
assert isinstance(value, int)
assert isinstance(value, (int, float))

# None checks
assert value is None
assert value is not None

# Boolean
assert condition
assert not condition

# Approximate (for floats)
assert abs(value - expected) < 0.001
# Or use pytest.approx
assert value == pytest.approx(expected, rel=1e-3)

# Exceptions
with pytest.raises(ValueError):
    raise ValueError("error")

with pytest.raises(ValueError, match="specific message"):
    raise ValueError("specific message")

# Warnings
with pytest.warns(UserWarning):
    warnings.warn("warning", UserWarning)

# Multiple assertions with soft assert (requires pytest-check)
# pip install pytest-check
import pytest_check as check
check.equal(1, 1)
check.is_true(True)
# All checks run even if one fails
```

## 📚 Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest Good Practices](https://docs.pytest.org/en/latest/explanation/goodpractices.html)
- [Testing Best Practices](../../docs/05-test-levels/unit-testing.md)
- [Full pytest Examples](../unit-tests/)

## ⏭️ What's Next?

1. **Add coverage thresholds** - Enforce 80%+ coverage
2. **Use fixtures effectively** - Share setup across tests
3. **Parametrize tests** - Test multiple inputs easily
4. **Mock dependencies** - Isolate unit tests
5. **Integrate with CI** - Run tests in GitHub Actions

---

**Time to first test:** ~3 minutes ✅
**Ready for production?** Add coverage enforcement and CI integration!
