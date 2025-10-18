# JUnit 5 Quick Start

**Time:** 4 minutes
**Prerequisites:** Java 17+, Maven or Gradle
**What You'll Learn:** Set up JUnit 5 and write your first Java unit test

## 1. Install (1 minute)

### Option A: Maven

Create `pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>junit-quickstart</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <junit.version>5.10.1</junit.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.3</version>
            </plugin>
        </plugins>
    </build>
</project>
```

### Option B: Gradle

Create `build.gradle`:

```gradle
plugins {
    id 'java'
}

group = 'com.example'
version = '1.0-SNAPSHOT'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
}

test {
    useJUnitPlatform()
}
```

## 2. Configure (30 seconds)

Create directory structure:

```bash
mkdir -p src/main/java/com/example
mkdir -p src/test/java/com/example
```

## 3. Hello World (2 minutes)

Create `src/main/java/com/example/Calculator.java`:

```java
package com.example;

/**
 * Simple calculator class for demonstration.
 */
public class Calculator {

    /**
     * Adds two integers.
     */
    public int add(int a, int b) {
        return a + b;
    }

    /**
     * Subtracts b from a.
     */
    public int subtract(int a, int b) {
        return a - b;
    }

    /**
     * Multiplies two integers.
     */
    public int multiply(int a, int b) {
        return a * b;
    }

    /**
     * Divides a by b.
     * @throws ArithmeticException if b is zero
     */
    public double divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("Cannot divide by zero");
        }
        return (double) a / b;
    }
}
```

Create `src/test/java/com/example/CalculatorTest.java`:

```java
package com.example;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for Calculator.
 */
@DisplayName("Calculator Tests")
class CalculatorTest {

    private Calculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }

    @Nested
    @DisplayName("Addition Tests")
    class AdditionTests {

        @Test
        @DisplayName("Should add two positive numbers")
        void testAddPositiveNumbers() {
            assertEquals(5, calculator.add(2, 3));
        }

        @Test
        @DisplayName("Should add negative numbers")
        void testAddNegativeNumbers() {
            assertEquals(-2, calculator.add(-1, -1));
        }

        @Test
        @DisplayName("Should add mixed sign numbers")
        void testAddMixedNumbers() {
            assertEquals(0, calculator.add(-1, 1));
        }
    }

    @Nested
    @DisplayName("Subtraction Tests")
    class SubtractionTests {

        @Test
        void testSubtractPositiveNumbers() {
            assertEquals(2, calculator.subtract(5, 3));
        }

        @Test
        void testSubtractResultsNegative() {
            assertEquals(-4, calculator.subtract(1, 5));
        }
    }

    @Nested
    @DisplayName("Multiplication Tests")
    class MultiplicationTests {

        @Test
        void testMultiplyPositiveNumbers() {
            assertEquals(12, calculator.multiply(3, 4));
        }

        @Test
        void testMultiplyByZero() {
            assertEquals(0, calculator.multiply(5, 0));
        }
    }

    @Nested
    @DisplayName("Division Tests")
    class DivisionTests {

        @Test
        void testDivideNormal() {
            assertEquals(5.0, calculator.divide(10, 2));
        }

        @Test
        void testDivideResultsFloat() {
            assertEquals(3.333, calculator.divide(10, 3), 0.001);
        }

        @Test
        @DisplayName("Should throw exception when dividing by zero")
        void testDivideByZeroThrowsException() {
            ArithmeticException exception = assertThrows(
                ArithmeticException.class,
                () -> calculator.divide(10, 0)
            );
            assertEquals("Cannot divide by zero", exception.getMessage());
        }
    }

    @AfterEach
    void tearDown() {
        calculator = null;
    }
}
```

## 4. Run Tests (30 seconds)

### Maven
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=CalculatorTest

# Run with verbose output
mvn test -X

# Generate coverage report (requires jacoco plugin)
mvn test jacoco:report
```

### Gradle
```bash
# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests CalculatorTest

# Run with verbose output
./gradlew test --info

# Generate test report
./gradlew test jacocoTestReport
```

**Expected Output:**
```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.example.CalculatorTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] BUILD SUCCESS
```

## 5. Next Steps

### Parametrized Tests
```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

class ParametrizedTests {

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5})
    void testWithValueSource(int number) {
        assertTrue(number > 0);
    }

    @ParameterizedTest
    @CsvSource({
        "1, 2, 3",
        "5, 3, 8",
        "10, 20, 30"
    })
    void testAddWithCsvSource(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }

    @ParameterizedTest
    @MethodSource("provideAdditionTestData")
    void testAddWithMethodSource(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }

    static Stream<Arguments> provideAdditionTestData() {
        return Stream.of(
            Arguments.of(1, 2, 3),
            Arguments.of(5, 3, 8),
            Arguments.of(10, 20, 30)
        );
    }
}
```

### Test Lifecycle Hooks
```java
class LifecycleTests {

    @BeforeAll
    static void initAll() {
        // Runs once before all tests
        System.out.println("Setting up test suite");
    }

    @BeforeEach
    void init() {
        // Runs before each test
        System.out.println("Setting up test");
    }

    @Test
    void testOne() {
        System.out.println("Running test 1");
    }

    @Test
    void testTwo() {
        System.out.println("Running test 2");
    }

    @AfterEach
    void tearDown() {
        // Runs after each test
        System.out.println("Tearing down test");
    }

    @AfterAll
    static void tearDownAll() {
        // Runs once after all tests
        System.out.println("Tearing down test suite");
    }
}
```

### Conditional Test Execution
```java
import org.junit.jupiter.api.condition.*;

class ConditionalTests {

    @Test
    @EnabledOnOs(OS.LINUX)
    void onlyOnLinux() {
        // Only runs on Linux
    }

    @Test
    @EnabledOnJre(JRE.JAVA_17)
    void onlyOnJava17() {
        // Only runs on Java 17
    }

    @Test
    @EnabledIf("customCondition")
    void enabledOnCustomCondition() {
        // Runs if method returns true
    }

    boolean customCondition() {
        return System.getenv("ENV") != null;
    }

    @Test
    @DisabledIfSystemProperty(named = "ci", matches = "true")
    void notOnCI() {
        // Skips on CI environment
    }
}
```

### Timeout Tests
```java
import java.time.Duration;

class TimeoutTests {

    @Test
    @Timeout(1)
    void shouldCompleteInOneSecond() {
        // Fails if takes longer than 1 second
    }

    @Test
    void assertTimeoutExample() {
        assertTimeout(Duration.ofSeconds(2), () -> {
            // Code that should complete within 2 seconds
            Thread.sleep(1000);
        });
    }
}
```

### Add Code Coverage (JaCoCo)

**Maven:**
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <execution>
            <id>jacoco-check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>PACKAGE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**Gradle:**
```gradle
plugins {
    id 'jacoco'
}

jacoco {
    toolVersion = "0.8.11"
}

test {
    finalizedBy jacocoTestReport
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
}

jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.80
            }
        }
    }
}
```

## 6. Troubleshooting

### Issue: "No tests found"
```bash
# Make sure:
# 1. Test class name ends with Test, Tests, or TestCase
# 2. Test methods are annotated with @Test
# 3. Test class is in src/test/java

# For Maven, run with -X for debug output
mvn test -X

# For Gradle
./gradlew test --debug
```

### Issue: Tests not running with Maven
```xml
<!-- Ensure surefire plugin is configured -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.3</version>
</plugin>
```

### Issue: Tests not running with Gradle
```gradle
// Make sure you have this
test {
    useJUnitPlatform()
}
```

### Issue: "NoClassDefFoundError: org/junit/jupiter/api/Test"
```bash
# Make sure dependency scope is correct
# Maven: <scope>test</scope>
# Gradle: testImplementation

# Clean and rebuild
mvn clean install
# or
./gradlew clean build
```

### Issue: Nested tests not running
```java
// Make sure nested classes are annotated with @Nested
@Nested
@DisplayName("Nested Test Group")
class NestedTests {
    @Test
    void nestedTest() {
        // ...
    }
}
```

### Issue: Coverage report not generated
```bash
# Maven: Generate report explicitly
mvn test jacoco:report

# Report is in: target/site/jacoco/index.html

# Gradle: Generate report explicitly
./gradlew test jacocoTestReport

# Report is in: build/reports/jacoco/test/html/index.html
```

## 🎓 Common Assertions Reference

```java
import static org.junit.jupiter.api.Assertions.*;

// Equality
assertEquals(expected, actual);
assertEquals(expected, actual, "Error message");
assertNotEquals(unexpected, actual);

// Boolean
assertTrue(condition);
assertFalse(condition);

// Null checks
assertNull(object);
assertNotNull(object);

// Same instance
assertSame(expected, actual);
assertNotSame(unexpected, actual);

// Arrays
assertArrayEquals(expectedArray, actualArray);

// Exceptions
assertThrows(Exception.class, () -> {
    throw new Exception();
});

Exception ex = assertThrows(Exception.class, executable);
assertEquals("message", ex.getMessage());

// Timeouts
assertTimeout(Duration.ofSeconds(1), executable);
assertTimeoutPreemptively(Duration.ofSeconds(1), executable);

// Multiple assertions
assertAll("grouped assertions",
    () -> assertEquals(4, 2 + 2),
    () -> assertTrue(true),
    () -> assertNotNull(object)
);

// Iterables
assertIterableEquals(expectedList, actualList);

// Hamcrest matchers (requires hamcrest dependency)
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

assertThat(actual, is(equalTo(expected)));
assertThat(list, hasItem(item));
assertThat(string, containsString("substring"));
```

## 📚 Resources

- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [JUnit 5 Samples](https://github.com/junit-team/junit5-samples)
- [Testing Best Practices](../../docs/05-test-levels/unit-testing.md)
- [Full Java Examples](../unit-tests/)

## ⏭️ What's Next?

1. **Add coverage enforcement** - Use JaCoCo with 80%+ threshold
2. **Use parametrized tests** - Test multiple scenarios easily
3. **Mock dependencies** - Use Mockito for isolation
4. **Integrate with CI** - Run tests in GitHub Actions/Jenkins
5. **Try AssertJ** - More fluent assertions

---

**Time to first test:** ~4 minutes ✅
**Ready for production?** Add JaCoCo coverage and CI integration!
