# Jest Quick Start

**Time:** 3 minutes
**Prerequisites:** Node.js 18+
**What You'll Learn:** Set up Jest and write your first JavaScript unit test

## 1. Install (30 seconds)

```bash
# Create new project
mkdir my-jest-project && cd my-jest-project
npm init -y

# Install Jest
npm install --save-dev jest
```

## 2. Configure (1 minute)

Add test script to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 3. Hello World (2 minutes)

Create `sum.js`:

```javascript
function sum(a, b) {
  return a + b;
}

module.exports = sum;
```

Create `sum.test.js`:

```javascript
const sum = require('./sum');

describe('sum function', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });

  test('adds -1 + 1 to equal 0', () => {
    expect(sum(-1, 1)).toBe(0);
  });

  test('handles decimal numbers', () => {
    expect(sum(0.1, 0.2)).toBeCloseTo(0.3);
  });
});
```

## 4. Run Tests (1 minute)

```bash
# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Expected Output:**
```
PASS  ./sum.test.js
  sum function
    ✓ adds 1 + 2 to equal 3 (2 ms)
    ✓ adds -1 + 1 to equal 0
    ✓ handles decimal numbers (1 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

## 5. Next Steps

### Add More Matchers
```javascript
test('object assignment', () => {
  const data = { one: 1 };
  data['two'] = 2;
  expect(data).toEqual({ one: 1, two: 2 });
});

test('array contains element', () => {
  const shopping = ['apples', 'bananas'];
  expect(shopping).toContain('apples');
});

test('throws error', () => {
  expect(() => {
    throw new Error('Error!');
  }).toThrow('Error!');
});
```

### Setup and Teardown
```javascript
beforeEach(() => {
  // Runs before each test
  console.log('Setting up test');
});

afterEach(() => {
  // Runs after each test
  console.log('Cleaning up');
});

beforeAll(() => {
  // Runs once before all tests
});

afterAll(() => {
  // Runs once after all tests
});
```

### Mock Functions
```javascript
test('mock callback', () => {
  const mockCallback = jest.fn(x => x * 2);

  [1, 2, 3].forEach(mockCallback);

  expect(mockCallback).toHaveBeenCalledTimes(3);
  expect(mockCallback.mock.results[0].value).toBe(2);
});
```

### Test Async Code
```javascript
test('async data fetch', async () => {
  const data = await fetchData();
  expect(data).toBe('peanut butter');
});

test('promise resolves', () => {
  return expect(fetchData()).resolves.toBe('peanut butter');
});
```

### Create Jest Config
```bash
npx jest --init
```

This creates `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 6. Troubleshooting

### Issue: "Cannot find module"
```bash
# Make sure you're using the correct import/export syntax
# CommonJS (Node.js default)
module.exports = sum;
const sum = require('./sum');

# ES Modules (add "type": "module" to package.json)
export default sum;
import sum from './sum';
```

### Issue: Tests not found
```bash
# Jest looks for files matching these patterns:
# - **/__tests__/**/*.js
# - **/*.test.js
# - **/*.spec.js

# Make sure your test file follows one of these patterns
mv mytest.js mytest.test.js
```

### Issue: "ReferenceError: expect is not defined"
```javascript
// Jest automatically provides expect, describe, test
// No need to import them

// If you need TypeScript types:
// npm install --save-dev @types/jest
```

### Issue: Coverage not showing all files
```javascript
// Update jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/index.js'
  ]
};
```

### Issue: Slow test execution
```javascript
// Run tests in parallel (default)
npm test -- --maxWorkers=4

// Run tests serially for debugging
npm test -- --runInBand

// Run only changed files
npm test -- --onlyChanged
```

## 🎓 Common Matchers Reference

```javascript
// Equality
expect(value).toBe(expected);           // === comparison
expect(value).toEqual(expected);        // Deep equality
expect(value).not.toBe(expected);       // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3.5);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3);  // Floating point

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array).toEqual(expect.arrayContaining([1, 2]));

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', value);
expect(obj).toMatchObject({ key: 'value' });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)
- [Testing Best Practices](../../docs/05-test-levels/unit-testing.md)
- [Full Jest Examples](../unit-tests/javascript-jest-example.js)

## ⏭️ What's Next?

1. **Add test coverage goals** - Aim for 80%+ coverage
2. **Learn mocking** - Mock external dependencies
3. **Test async code** - Promises, async/await
4. **Integrate with CI** - Run tests in GitHub Actions
5. **Try snapshot testing** - For React components

---

**Time to first test:** ~3 minutes ✅
**Ready for production?** Add coverage thresholds and CI integration!
