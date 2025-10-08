/**
 * Performance Testing Utility Functions
 *
 * This module provides helper functions for load testing scripts including:
 * - Random data generators
 * - Authentication token management
 * - Response validation helpers
 * - Metric calculation utilities
 * - Report formatting functions
 *
 * Compatible with k6, Artillery, and Node.js environments
 */

// ============================================================================
// RANDOM DATA GENERATORS
// ============================================================================

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Generate random string of specified length
 */
function randomString(length = 10, charset = 'alphanumeric') {
  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789',
    hex: '0123456789abcdef',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  };

  const chars = charsets[charset] || charsets.alphanumeric;
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Generate random email address
 */
function randomEmail(domain = 'example.com') {
  const username = randomString(10, 'lowercase');
  const timestamp = Date.now();
  return `${username}_${timestamp}@${domain}`;
}

/**
 * Generate random phone number (US format)
 */
function randomPhoneNumber() {
  const areaCode = randomInt(200, 999);
  const exchange = randomInt(200, 999);
  const number = randomInt(1000, 9999);
  return `${areaCode}-${exchange}-${number}`;
}

/**
 * Generate random credit card number (test format - not real)
 */
function randomCreditCard(type = 'visa') {
  const prefixes = {
    visa: '4',
    mastercard: '5',
    amex: '3',
    discover: '6'
  };

  const prefix = prefixes[type] || prefixes.visa;
  const remaining = 15 - prefix.length;
  const randomDigits = randomString(remaining, 'numeric');

  return prefix + randomDigits;
}

/**
 * Generate random address
 */
function randomAddress() {
  const streetNumber = randomInt(1, 9999);
  const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln'];
  const cities = ['Springfield', 'Riverside', 'Franklin', 'Georgetown', 'Madison'];
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'MI', 'GA', 'NC'];

  return {
    street: `${streetNumber} ${streetNames[randomInt(0, streetNames.length - 1)]}`,
    city: cities[randomInt(0, cities.length - 1)],
    state: states[randomInt(0, states.length - 1)],
    zipCode: randomString(5, 'numeric'),
    country: 'US'
  };
}

/**
 * Generate random user data
 */
function randomUser() {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Anna'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

  const firstName = firstNames[randomInt(0, firstNames.length - 1)];
  const lastName = lastNames[randomInt(0, lastNames.length - 1)];

  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@example.com`,
    phone: randomPhoneNumber(),
    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomInt(1, 9999)}`,
    password: 'Test123!@#',
    address: randomAddress()
  };
}

/**
 * Get random item from array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array (multiple)
 */
function randomItems(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate random boolean with optional weight
 */
function randomBoolean(trueWeight = 0.5) {
  return Math.random() < trueWeight;
}

/**
 * Generate random date between two dates
 */
function randomDate(start = new Date(2020, 0, 1), end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ============================================================================
// AUTHENTICATION & TOKEN MANAGEMENT
// ============================================================================

/**
 * Store for authentication tokens (in-memory)
 */
const tokenStore = new Map();

/**
 * Generate JWT-like token (for testing, not cryptographically secure)
 */
function generateToken(userId, expiresIn = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    userId,
    exp: Math.floor(Date.now() / 1000) + expiresIn
  })).toString('base64');
  const signature = randomString(43, 'alphanumeric');

  return `${header}.${payload}.${signature}`;
}

/**
 * Store authentication token
 */
function storeToken(userId, token) {
  tokenStore.set(userId, {
    token,
    timestamp: Date.now()
  });
}

/**
 * Retrieve authentication token
 */
function getToken(userId) {
  const stored = tokenStore.get(userId);
  return stored ? stored.token : null;
}

/**
 * Clear expired tokens
 */
function clearExpiredTokens(maxAge = 3600000) {
  const now = Date.now();
  for (const [userId, data] of tokenStore.entries()) {
    if (now - data.timestamp > maxAge) {
      tokenStore.delete(userId);
    }
  }
}

/**
 * Create authorization header
 */
function createAuthHeader(token, type = 'Bearer') {
  return { 'Authorization': `${type} ${token}` };
}

// ============================================================================
// RESPONSE VALIDATION HELPERS
// ============================================================================

/**
 * Validate HTTP response
 */
function validateResponse(response, expectedStatus = 200) {
  const validations = {
    hasCorrectStatus: response.status === expectedStatus,
    hasBody: response.body && response.body.length > 0,
    hasContentType: response.headers['content-type'] !== undefined,
    isJSON: false,
    responseTime: response.timings ? response.timings.duration : 0
  };

  // Check if response is valid JSON
  if (validations.hasBody) {
    try {
      JSON.parse(response.body);
      validations.isJSON = true;
    } catch (e) {
      validations.isJSON = false;
    }
  }

  return validations;
}

/**
 * Check if response meets SLA requirements
 */
function checkSLA(responseTime, maxResponseTime = 500, errorRate = 0, maxErrorRate = 0.01) {
  return {
    responseTimeOk: responseTime <= maxResponseTime,
    errorRateOk: errorRate <= maxErrorRate,
    meetsAll: responseTime <= maxResponseTime && errorRate <= maxErrorRate
  };
}

/**
 * Extract data from JSON response
 */
function extractFromJSON(response, path) {
  try {
    const data = JSON.parse(response.body);
    return path.split('.').reduce((obj, key) => obj[key], data);
  } catch (e) {
    console.error('Failed to extract from JSON:', e);
    return null;
  }
}

/**
 * Validate JSON schema (basic)
 */
function validateJSONSchema(data, schema) {
  const errors = [];

  for (const [key, type] of Object.entries(schema)) {
    if (!(key in data)) {
      errors.push(`Missing required field: ${key}`);
    } else if (typeof data[key] !== type) {
      errors.push(`Field ${key} has wrong type: expected ${type}, got ${typeof data[key]}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// METRIC CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate percentile from array of values
 */
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;

  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;

  return sorted[index];
}

/**
 * Calculate statistical metrics
 */
function calculateStats(values) {
  if (values.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      stdDev: 0
    };
  }

  const sorted = values.slice().sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  // Calculate standard deviation
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(mean * 100) / 100,
    median: calculatePercentile(values, 50),
    p50: calculatePercentile(values, 50),
    p90: calculatePercentile(values, 90),
    p95: calculatePercentile(values, 95),
    p99: calculatePercentile(values, 99),
    stdDev: Math.round(stdDev * 100) / 100
  };
}

/**
 * Calculate throughput (requests per second)
 */
function calculateThroughput(requestCount, durationMs) {
  return (requestCount / (durationMs / 1000)).toFixed(2);
}

/**
 * Calculate error rate percentage
 */
function calculateErrorRate(errorCount, totalCount) {
  if (totalCount === 0) return 0;
  return ((errorCount / totalCount) * 100).toFixed(2);
}

// ============================================================================
// REPORT FORMATTING
// ============================================================================

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

/**
 * Format bytes in human-readable format
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)}KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)}MB`;
  return `${(bytes / 1073741824).toFixed(2)}GB`;
}

/**
 * Generate summary report
 */
function generateSummary(testResults) {
  const {
    totalRequests,
    successfulRequests,
    failedRequests,
    responseTimes,
    testDuration,
    bytesReceived
  } = testResults;

  const stats = calculateStats(responseTimes);
  const errorRate = calculateErrorRate(failedRequests, totalRequests);
  const throughput = calculateThroughput(totalRequests, testDuration);

  return {
    overview: {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate: `${errorRate}%`,
      throughput: `${throughput} req/s`,
      duration: formatDuration(testDuration),
      dataTransferred: formatBytes(bytesReceived)
    },
    responseTime: {
      min: `${stats.min}ms`,
      max: `${stats.max}ms`,
      mean: `${stats.mean}ms`,
      median: `${stats.median}ms`,
      p90: `${stats.p90}ms`,
      p95: `${stats.p95}ms`,
      p99: `${stats.p99}ms`,
      stdDev: `${stats.stdDev}ms`
    },
    slaCompliance: {
      p95Under500ms: stats.p95 < 500 ? 'PASS' : 'FAIL',
      p99Under1000ms: stats.p99 < 1000 ? 'PASS' : 'FAIL',
      errorRateUnder1Percent: parseFloat(errorRate) < 1 ? 'PASS' : 'FAIL'
    }
  };
}

/**
 * Print formatted table
 */
function printTable(data, headers) {
  const colWidths = headers.map(h => h.length);

  // Calculate column widths
  data.forEach(row => {
    row.forEach((cell, i) => {
      const cellStr = String(cell);
      if (cellStr.length > colWidths[i]) {
        colWidths[i] = cellStr.length;
      }
    });
  });

  // Print header
  console.log(headers.map((h, i) => h.padEnd(colWidths[i])).join(' | '));
  console.log(colWidths.map(w => '-'.repeat(w)).join('-+-'));

  // Print rows
  data.forEach(row => {
    console.log(row.map((cell, i) => String(cell).padEnd(colWidths[i])).join(' | '));
  });
}

// ============================================================================
// WAIT/SLEEP UTILITIES
// ============================================================================

/**
 * Sleep for specified duration (async)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random sleep between min and max
 */
async function randomSleep(min, max) {
  const duration = randomInt(min, max);
  await sleep(duration);
}

// ============================================================================
// ARTILLERY-SPECIFIC HELPERS
// ============================================================================

/**
 * Artillery before request hook
 */
function setCustomHeaders(requestParams, context, ee, next) {
  // Add custom headers
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['X-Request-ID'] = randomString(16, 'hex');
  requestParams.headers['X-Correlation-ID'] = randomString(16, 'hex');
  requestParams.headers['X-Test-Run'] = 'true';

  return next();
}

/**
 * Artillery after response hook
 */
function validateResponse(requestParams, response, context, ee, next) {
  // Validate response
  const validation = validateResponse(response);

  if (!validation.hasCorrectStatus) {
    ee.emit('error', `Unexpected status code: ${response.status}`);
  }

  if (!validation.isJSON && response.headers['content-type']?.includes('json')) {
    ee.emit('error', 'Invalid JSON response');
  }

  // Store response data in context if needed
  if (validation.isJSON) {
    try {
      context.vars.lastResponse = JSON.parse(response.body);
    } catch (e) {
      // Ignore
    }
  }

  return next();
}

/**
 * Artillery custom function - generate random product ID
 */
function generateProductId(context, events, done) {
  context.vars.productId = randomInt(1, 1000);
  return done();
}

/**
 * Artillery custom function - generate user data
 */
function generateUserData(context, events, done) {
  const user = randomUser();
  context.vars.firstName = user.firstName;
  context.vars.lastName = user.lastName;
  context.vars.email = user.email;
  context.vars.phone = user.phone;
  return done();
}

// ============================================================================
// EXPORTS
// ============================================================================

// CommonJS exports (for Node.js/Artillery)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Random generators
    randomInt,
    randomString,
    randomEmail,
    randomPhoneNumber,
    randomCreditCard,
    randomAddress,
    randomUser,
    randomItem,
    randomItems,
    randomBoolean,
    randomDate,

    // Authentication
    generateToken,
    storeToken,
    getToken,
    clearExpiredTokens,
    createAuthHeader,

    // Validation
    validateResponse,
    checkSLA,
    extractFromJSON,
    validateJSONSchema,

    // Metrics
    calculatePercentile,
    calculateStats,
    calculateThroughput,
    calculateErrorRate,

    // Formatting
    formatDuration,
    formatBytes,
    generateSummary,
    printTable,

    // Utilities
    sleep,
    randomSleep,

    // Artillery hooks
    setCustomHeaders,
    validateResponse,
    generateProductId,
    generateUserData
  };
}

// ES6 exports (for k6 and modern environments)
if (typeof exports !== 'undefined') {
  exports.randomInt = randomInt;
  exports.randomString = randomString;
  exports.randomEmail = randomEmail;
  exports.randomUser = randomUser;
  exports.validateResponse = validateResponse;
  exports.calculateStats = calculateStats;
  // ... add more as needed
}
