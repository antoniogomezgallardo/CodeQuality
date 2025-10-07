# Build Automation

## Purpose

Build automation is the process of automatically creating a software build including compiling source code, packaging binaries, running tests, and generating deployable artifacts. This document covers build automation tools, patterns, optimization strategies, and integration with CI/CD pipelines.

## Table of Contents

1. [Overview](#overview)
2. [Build Automation Tools](#build-automation-tools)
3. [Build Process Components](#build-process-components)
4. [Build Configuration Patterns](#build-configuration-patterns)
5. [Dependency Management](#dependency-management)
6. [Build Optimization](#build-optimization)
7. [Artifact Management](#artifact-management)
8. [Build Pipeline Integration](#build-pipeline-integration)
9. [Quality Gates in Builds](#quality-gates-in-builds)
10. [Multi-Stage Builds](#multi-stage-builds)
11. [Build Reproducibility](#build-reproducibility)
12. [Common Patterns](#common-patterns)
13. [Best Practices](#best-practices)
14. [Checklist](#checklist)
15. [References](#references)

---

## Overview

### What is Build Automation?

Build automation transforms source code into executable artifacts through repeatable, consistent processes without manual intervention.

### Why Build Automation?

**Benefits:**
- **Consistency**: Same input → same output every time
- **Speed**: Automated builds run faster than manual processes
- **Reliability**: Eliminates human error
- **Traceability**: Complete audit trail of what was built
- **Integration**: Seamless CI/CD pipeline integration
- **Quality**: Automated testing and quality checks
- **Reproducibility**: Can recreate any build at any time

**Key Metrics:**
- Build time (target: < 10 minutes)
- Build success rate (target: > 95%)
- Time to detect failures (target: < 5 minutes)
- Deployment frequency (DORA metric)

### How Build Automation Works

```
Source Code → Build Tool → [Compile + Test + Package] → Artifacts
                ↓
           Quality Gates
                ↓
         Pass/Fail Result
```

---

## Build Automation Tools

### JavaScript/Node.js

**npm Scripts**
```json
{
  "scripts": {
    "clean": "rimraf dist coverage",
    "lint": "eslint src --ext .js,.ts",
    "test": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "build": "npm run clean && npm run lint && npm run test && webpack --mode production",
    "build:dev": "webpack --mode development",
    "prebuild": "npm run lint",
    "postbuild": "npm run analyze",
    "analyze": "webpack-bundle-analyzer dist/stats.json",
    "version": "node -p \"require('./package.json').version\""
  }
}
```

**Webpack Configuration**
```javascript
// webpack.config.js
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        }
      ]
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction
            }
          }
        })
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          }
        }
      }
    },

    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: isProduction
      }),
      ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : [])
    ],

    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};
```

**Vite Configuration**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false
    })
  ],

  build: {
    outDir: 'dist',
    sourcemap: mode === 'production' ? true : 'inline',
    minify: mode === 'production' ? 'terser' : false,

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },

    terserOptions: {
      compress: {
        drop_console: mode === 'production'
      }
    }
  },

  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}));
```

### Java

**Maven (pom.xml)**
```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.example</groupId>
  <artifactId>myapp</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <build>
    <plugins>
      <!-- Compiler -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.11.0</version>
        <configuration>
          <source>17</source>
          <target>17</target>
        </configuration>
      </plugin>

      <!-- Unit Tests -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.0.0</version>
        <configuration>
          <includes>
            <include>**/*Test.java</include>
          </includes>
        </configuration>
      </plugin>

      <!-- Integration Tests -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-failsafe-plugin</artifactId>
        <version>3.0.0</version>
        <executions>
          <execution>
            <goals>
              <goal>integration-test</goal>
              <goal>verify</goal>
            </goals>
          </execution>
        </executions>
      </plugin>

      <!-- Code Coverage -->
      <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
        <version>0.8.10</version>
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

      <!-- Package as executable JAR -->
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <version>3.1.0</version>
        <executions>
          <execution>
            <goals>
              <goal>repackage</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
</project>
```

**Gradle (build.gradle.kts)**
```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.1.0"
    id("io.spring.dependency-management") version "1.1.0"
    jacoco
}

group = "com.example"
version = "1.0.0-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.junit.jupiter:junit-jupiter")
}

tasks.test {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()
            }
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}

tasks.build {
    dependsOn(tasks.check)
}
```

### .NET

**MSBuild (.csproj)**
```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="coverlet.collector" Version="6.0.0" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="xunit" Version="2.6.0" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.0" />
  </ItemGroup>

  <Target Name="BuildAndTest" DependsOnTargets="Build;Test">
    <Message Text="Build and test completed successfully" Importance="high" />
  </Target>
</Project>
```

**Build Script (build.ps1)**
```powershell
#!/usr/bin/env pwsh

param(
    [string]$Configuration = "Release",
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Cleaning previous builds..." -ForegroundColor Cyan
dotnet clean --configuration $Configuration

Write-Host "🔨 Restoring dependencies..." -ForegroundColor Cyan
dotnet restore

Write-Host "🏗️  Building solution..." -ForegroundColor Cyan
dotnet build --configuration $Configuration --no-restore

if (-not $SkipTests) {
    Write-Host "🧪 Running tests..." -ForegroundColor Cyan
    dotnet test `
        --configuration $Configuration `
        --no-build `
        --logger "trx;LogFileName=test-results.trx" `
        /p:CollectCoverage=true `
        /p:CoverletOutputFormat=cobertura `
        /p:Threshold=80 `
        /p:ThresholdType=line

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📦 Publishing artifacts..." -ForegroundColor Cyan
dotnet publish `
    --configuration $Configuration `
    --no-build `
    --output ./artifacts

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
```

### Python

**setup.py / pyproject.toml**
```toml
# pyproject.toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "myapp"
version = "1.0.0"
description = "My Python application"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.5.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.3",
    "pytest-cov>=4.1.0",
    "black>=23.11.0",
    "ruff>=0.1.6",
    "mypy>=1.7.0"
]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = """
    --cov=src
    --cov-report=term-missing
    --cov-report=html
    --cov-report=xml
    --cov-fail-under=80
    -v
"""

[tool.black]
line-length = 100
target-version = ['py311']

[tool.ruff]
line-length = 100
select = ["E", "F", "W", "I", "N"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

**Makefile**
```makefile
.PHONY: help clean install lint test build docker

PYTHON := python3
PIP := $(PYTHON) -m pip
VENV := venv
BIN := $(VENV)/bin

help:
	@echo "Available targets:"
	@echo "  install    - Install dependencies"
	@echo "  lint       - Run linters (black, ruff, mypy)"
	@echo "  test       - Run tests with coverage"
	@echo "  build      - Build distribution packages"
	@echo "  clean      - Remove build artifacts"
	@echo "  docker     - Build Docker image"

$(VENV)/bin/activate:
	$(PYTHON) -m venv $(VENV)

install: $(VENV)/bin/activate
	$(BIN)/pip install --upgrade pip
	$(BIN)/pip install -e ".[dev]"

lint:
	$(BIN)/black --check src tests
	$(BIN)/ruff check src tests
	$(BIN)/mypy src

format:
	$(BIN)/black src tests
	$(BIN)/ruff check --fix src tests

test:
	$(BIN)/pytest

build: clean
	$(BIN)/python -m build

clean:
	rm -rf build dist *.egg-info
	rm -rf .pytest_cache .coverage htmlcov
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

docker:
	docker build -t myapp:latest .
```

---

## Build Process Components

### 1. Compilation

Transform source code into executable code.

**TypeScript Compilation**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "tsBuildInfoFile": "./.cache/tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

### 2. Testing

Run automated tests as part of the build.

**Jest Configuration with Thresholds**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/index.ts'
  ],

  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/core/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
```

### 3. Linting

Enforce code quality standards.

**ESLint + Prettier**
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'import/order': ['error', { 'newlines-between': 'always' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  overrides: [
    {
      files: ['**/*.test.ts'],
      env: { jest: true }
    }
  ]
};
```

### 4. Packaging

Bundle and compress code for deployment.

**Docker Multi-Stage Build**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "dist/index.js"]
```

### 5. Versioning

Automatic version management.

**Semantic Versioning Script**
```javascript
// scripts/version.js
const fs = require('fs');
const { execSync } = require('child_process');

function getVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const baseVersion = packageJson.version;

  // Get git info
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
  const buildNumber = process.env.BUILD_NUMBER || '0';

  if (gitBranch === 'main' || gitBranch === 'trunk') {
    // Production: 1.2.3
    return baseVersion;
  } else if (gitBranch.startsWith('release/')) {
    // Release candidate: 1.2.3-rc.1
    return `${baseVersion}-rc.${buildNumber}`;
  } else {
    // Development: 1.2.3-dev.123.abc1234
    return `${baseVersion}-dev.${buildNumber}.${gitCommit}`;
  }
}

const version = getVersion();
console.log(version);

// Update package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.version = version;
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
```

---

## Build Configuration Patterns

### Environment-Specific Builds

```javascript
// config/env.js
const configs = {
  development: {
    API_URL: 'http://localhost:3000',
    ENABLE_ANALYTICS: false,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_URL: 'https://staging-api.example.com',
    ENABLE_ANALYTICS: true,
    LOG_LEVEL: 'info'
  },
  production: {
    API_URL: 'https://api.example.com',
    ENABLE_ANALYTICS: true,
    LOG_LEVEL: 'error'
  }
};

module.exports = configs[process.env.NODE_ENV || 'development'];
```

**Webpack Environment Configuration**
```javascript
// webpack.config.js
const webpack = require('webpack');
const config = require('./config/env');

module.exports = (env, argv) => ({
  // ... other config

  plugins: [
    new webpack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(config.API_URL),
      'process.env.ENABLE_ANALYTICS': JSON.stringify(config.ENABLE_ANALYTICS),
      '__DEV__': argv.mode === 'development'
    })
  ]
});
```

### Conditional Build Steps

```json
{
  "scripts": {
    "prebuild": "npm run check:env && npm run lint",
    "build": "node scripts/build.js",
    "postbuild": "npm run verify:build",

    "check:env": "node scripts/check-environment.js",
    "verify:build": "node scripts/verify-artifacts.js"
  }
}
```

```javascript
// scripts/build.js
const { execSync } = require('child_process');

const buildSteps = [
  { name: 'Clean', command: 'rimraf dist' },
  { name: 'Compile', command: 'tsc' },
  { name: 'Bundle', command: 'webpack --mode production' },
  { name: 'Optimize', command: 'node scripts/optimize.js' }
];

for (const step of buildSteps) {
  console.log(`\n🔧 ${step.name}...`);
  try {
    execSync(step.command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ ${step.name} failed`);
    process.exit(1);
  }
}

console.log('\n✅ Build completed successfully!');
```

---

## Dependency Management

### Lock Files

**package-lock.json (npm)**
- Ensures deterministic installs
- Records exact versions of all dependencies
- Should be committed to version control

```bash
# Clean install from lock file
npm ci

# Update lock file
npm install
```

**yarn.lock / pnpm-lock.yaml**
- Similar to package-lock.json
- Optimized for different package managers

### Dependency Caching

**GitHub Actions**
```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**GitLab CI**
```yaml
cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
    - .npm/
```

### Security Scanning

```json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "check:licenses": "license-checker --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC'"
  }
}
```

---

## Build Optimization

### 1. Incremental Builds

**TypeScript Incremental Compilation**
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./.cache/tsbuildinfo"
  }
}
```

**Webpack Caching**
```javascript
module.exports = {
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
    buildDependencies: {
      config: [__filename]
    }
  }
};
```

### 2. Parallel Execution

**Concurrent npm Scripts**
```json
{
  "scripts": {
    "lint": "npm-run-all --parallel lint:*",
    "lint:js": "eslint src",
    "lint:css": "stylelint 'src/**/*.css'",
    "lint:types": "tsc --noEmit",

    "test": "npm-run-all --parallel test:unit test:integration",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration"
  },
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  }
}
```

**Parallel Jest Tests**
```javascript
module.exports = {
  maxWorkers: '50%', // Use 50% of available CPU cores
  testPathIgnorePatterns: ['/node_modules/'],
  workerIdleMemoryLimit: '512MB'
};
```

### 3. Build Output Optimization

**Tree Shaking**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    usedExports: true, // Tree shaking
    minimize: true,
    sideEffects: false
  }
};
```

**Code Splitting**
```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '')}`;
          }
        },
        common: {
          minChunks: 2,
          priority: -10,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

### 4. Build Time Monitoring

```javascript
// webpack.config.js
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
  // ... webpack config
});
```

---

## Artifact Management

### Artifact Storage

**Directory Structure**
```
dist/
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── metadata/
│   ├── build-info.json
│   ├── dependencies.json
│   └── test-results.xml
└── app.tar.gz
```

**Build Metadata**
```javascript
// scripts/generate-build-info.js
const fs = require('fs');
const { execSync } = require('child_process');

const buildInfo = {
  version: require('../package.json').version,
  buildNumber: process.env.BUILD_NUMBER,
  buildTime: new Date().toISOString(),
  gitCommit: execSync('git rev-parse HEAD').toString().trim(),
  gitBranch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
  nodeVersion: process.version,
  env: process.env.NODE_ENV
};

fs.writeFileSync(
  'dist/metadata/build-info.json',
  JSON.stringify(buildInfo, null, 2)
);
```

### Artifact Registry Integration

**npm Registry**
```bash
# Publish to registry
npm publish --registry=https://registry.example.com

# Install from registry
npm install --registry=https://registry.example.com
```

**.npmrc Configuration**
```ini
registry=https://registry.npmjs.org/
@myorg:registry=https://npm.pkg.github.com/

//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

**Docker Registry**
```bash
# Build and tag
docker build -t myapp:1.0.0 .
docker tag myapp:1.0.0 registry.example.com/myapp:1.0.0

# Push to registry
docker push registry.example.com/myapp:1.0.0
```

---

## Build Pipeline Integration

### GitHub Actions

```yaml
name: Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for versioning

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Generate build metadata
        run: node scripts/generate-build-info.js

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            dist/
            !dist/**/*.map
          retention-days: 30

      - name: Build Docker image
        if: github.ref == 'refs/heads/main'
        run: |
          docker build \
            --tag ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            --tag ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest \
            .

      - name: Log in to Container registry
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Push Docker image
        if: github.ref == 'refs/heads/main'
        run: docker push --all-tags ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
```

### GitLab CI

```yaml
stages:
  - build
  - test
  - package
  - publish

variables:
  NODE_VERSION: "20"
  DOCKER_DRIVER: overlay2

.node_template: &node_template
  image: node:${NODE_VERSION}
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
      - .npm/
  before_script:
    - npm ci --cache .npm --prefer-offline

build:
  <<: *node_template
  stage: build
  script:
    - npm run lint
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

test:unit:
  <<: *node_template
  stage: test
  script:
    - npm run test:unit -- --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

test:integration:
  <<: *node_template
  stage: test
  services:
    - postgres:15
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: testuser
    POSTGRES_PASSWORD: testpass
  script:
    - npm run test:integration

package:
  stage: package
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
  only:
    - main

publish:
  stage: publish
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main
```

---

## Quality Gates in Builds

### Code Coverage Gates

```javascript
// jest.config.js
module.exports = {
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**Fail Build on Low Coverage**
```bash
# In CI pipeline
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

### Code Quality Gates

**SonarQube Integration**
```yaml
# .github/workflows/sonar.yml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@v2
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

- name: SonarQube Quality Gate
  uses: sonarsource/sonarqube-quality-gate-action@v1
  timeout-minutes: 5
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**sonar-project.properties**
```properties
sonar.projectKey=myapp
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.ts,**/*.spec.ts
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts

# Quality Gate Conditions
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300
```

### Security Gates

```json
{
  "scripts": {
    "security:audit": "npm audit --audit-level=high",
    "security:snyk": "snyk test --severity-threshold=high",
    "prebuild": "npm run security:audit"
  }
}
```

### Bundle Size Gates

```javascript
// webpack.config.js
module.exports = {
  performance: {
    maxEntrypointSize: 250000, // 250 KB
    maxAssetSize: 250000,
    hints: 'error'
  }
};
```

**bundlesize Configuration**
```json
{
  "name": "myapp",
  "bundlesize": [
    {
      "path": "./dist/bundle.js",
      "maxSize": "200 KB"
    },
    {
      "path": "./dist/vendor.js",
      "maxSize": "150 KB"
    }
  ]
}
```

---

## Multi-Stage Builds

### Dockerfile Multi-Stage Example

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && \
    npm run test

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only necessary files
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/index.js"]
```

**Benefits:**
- Smaller final image (only production dependencies)
- Improved security (no build tools in production)
- Faster deployment (optimized layers)

---

## Build Reproducibility

### Deterministic Builds

**Requirements:**
1. **Fixed dependency versions**: Use lock files
2. **Fixed tool versions**: Specify exact versions
3. **Fixed environment**: Use containers
4. **No timestamps**: Exclude build time from artifacts
5. **Sorted inputs**: Process files in consistent order

**Example: Reproducible npm Build**
```json
{
  "engines": {
    "node": "20.10.0",
    "npm": "10.2.3"
  },
  "scripts": {
    "build": "SOURCE_DATE_EPOCH=$(git log -1 --format=%ct) webpack"
  }
}
```

### Build Fingerprinting

```javascript
// scripts/fingerprint.js
const crypto = require('crypto');
const fs = require('fs');
const glob = require('glob');

function generateFingerprint() {
  const files = glob.sync('dist/**/*', { nodir: true }).sort();
  const hash = crypto.createHash('sha256');

  for (const file of files) {
    const content = fs.readFileSync(file);
    hash.update(content);
  }

  return hash.digest('hex');
}

const fingerprint = generateFingerprint();
console.log(`Build fingerprint: ${fingerprint}`);

fs.writeFileSync('dist/BUILD_FINGERPRINT', fingerprint);
```

### Build Verification

```bash
#!/bin/bash
# verify-build.sh

EXPECTED_FINGERPRINT=$1
ACTUAL_FINGERPRINT=$(node scripts/fingerprint.js)

if [ "$EXPECTED_FINGERPRINT" = "$ACTUAL_FINGERPRINT" ]; then
  echo "✅ Build verified successfully"
  exit 0
else
  echo "❌ Build verification failed"
  echo "Expected: $EXPECTED_FINGERPRINT"
  echo "Actual: $ACTUAL_FINGERPRINT"
  exit 1
fi
```

---

## Common Patterns

### Pattern 1: Clean Build

Always start from a clean slate to ensure reproducibility.

```json
{
  "scripts": {
    "clean": "rimraf dist coverage .cache",
    "prebuild": "npm run clean",
    "build": "tsc && webpack"
  }
}
```

### Pattern 2: Fail Fast

Stop the build at the first error.

```bash
#!/bin/bash
set -e  # Exit on any error
set -o pipefail  # Exit on pipe failure

npm run lint
npm run test
npm run build
```

### Pattern 3: Build Matrix

Test across multiple environments.

```yaml
# GitHub Actions
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
  - run: npm ci
  - run: npm test
```

### Pattern 4: Conditional Builds

Skip unnecessary builds.

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'package*.json'
      - '.github/workflows/**'
```

### Pattern 5: Build Promotions

Promote artifacts through environments.

```yaml
# Build once, deploy many times
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      - run: ./deploy.sh staging

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      - run: ./deploy.sh production
```

---

## Best Practices

### ✅ DO

1. **Use lock files** for deterministic builds
2. **Cache dependencies** to speed up builds
3. **Run tests** as part of the build process
4. **Generate metadata** (version, commit, timestamp)
5. **Fail fast** on errors
6. **Use multi-stage builds** for Docker
7. **Implement quality gates** (coverage, security, bundle size)
8. **Version your build tools** (Node, npm, etc.)
9. **Monitor build times** and optimize
10. **Keep builds under 10 minutes**

### ❌ DON'T

1. **Don't commit build artifacts** to version control
2. **Don't skip tests** to save time
3. **Don't use `latest` tags** in production
4. **Don't hardcode secrets** in build scripts
5. **Don't run builds on developer machines** for production
6. **Don't ignore build warnings**
7. **Don't build different artifacts** for different environments
8. **Don't modify source during build**
9. **Don't use non-deterministic inputs** (timestamps, random values)
10. **Don't skip dependency audits**

---

## Checklist

### Build Configuration
- [ ] Build completes in < 10 minutes
- [ ] All tests pass before build completes
- [ ] Build artifacts are reproducible
- [ ] Dependencies are locked (package-lock.json, etc.)
- [ ] Build tools have fixed versions
- [ ] Environment variables are documented

### Quality Gates
- [ ] Code coverage thresholds enforced (≥ 80%)
- [ ] Linting rules enforced
- [ ] Security vulnerabilities scanned
- [ ] Bundle size limits enforced
- [ ] Build fails on warnings

### Artifacts
- [ ] Build metadata included (version, commit, timestamp)
- [ ] Source maps generated
- [ ] Documentation generated
- [ ] Artifacts uploaded to registry
- [ ] Artifacts are signed/verified

### Optimization
- [ ] Incremental builds enabled
- [ ] Dependencies cached
- [ ] Parallel execution used where possible
- [ ] Build time monitored
- [ ] Unnecessary files excluded from output

### CI/CD Integration
- [ ] Build runs on every commit
- [ ] Build runs on multiple environments (if applicable)
- [ ] Artifacts promoted through environments
- [ ] Build status reported to PR/commit
- [ ] Failed builds block deployments

---

## References

### Tools

**JavaScript/Node.js:**
- [npm](https://docs.npmjs.com/) - Package manager
- [Webpack](https://webpack.js.org/) - Module bundler
- [Vite](https://vitejs.dev/) - Build tool
- [esbuild](https://esbuild.github.io/) - Fast bundler
- [Rollup](https://rollupjs.org/) - Module bundler

**Java:**
- [Maven](https://maven.apache.org/) - Build automation
- [Gradle](https://gradle.org/) - Build tool

**.NET:**
- [MSBuild](https://docs.microsoft.com/en-us/visualstudio/msbuild/) - Build platform
- [dotnet CLI](https://docs.microsoft.com/en-us/dotnet/core/tools/) - Command-line tools

**Python:**
- [setuptools](https://setuptools.pypa.io/) - Build system
- [Poetry](https://python-poetry.org/) - Dependency management
- [PyInstaller](https://pyinstaller.org/) - Package applications

**Containers:**
- [Docker](https://docs.docker.com/) - Containerization
- [BuildKit](https://github.com/moby/buildkit) - Build toolkit

### Standards & Best Practices

- [12-Factor App](https://12factor.net/) - Methodology for building SaaS apps
- [Semantic Versioning](https://semver.org/) - Version numbering scheme
- [Reproducible Builds](https://reproducible-builds.org/) - Verifiable path from source to binary

### Articles & Guides

- [Google's Build Performance Guide](https://developer.android.com/build/optimize-your-build)
- [Microsoft's DevOps Build Best Practices](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/triggers)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/learn-github-actions/best-practices-for-using-github-actions)

---

## Related Documentation

- [CI/CD Pipeline Overview](08-README.md)
- [Deployment Automation](deployment-automation.md)
- [Version Control](../03-version-control/03-README.md)
- [Testing Strategy](../04-testing-strategy/04-README.md)
- [Clean Code Principles](../07-development-practices/clean-code-principles.md)
