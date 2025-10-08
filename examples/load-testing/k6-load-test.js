/**
 * k6 Load Testing Script - Production-Ready Example
 *
 * This script demonstrates comprehensive load testing patterns using k6,
 * including multiple load profiles, realistic scenarios, custom metrics,
 * authentication flows, and SLA validation.
 *
 * Usage:
 *   Basic run:              k6 run k6-load-test.js
 *   Specific scenario:      k6 run --env SCENARIO=spike k6-load-test.js
 *   Custom target:          k6 run --env BASE_URL=https://api.example.com k6-load-test.js
 *   With cloud output:      k6 run --out cloud k6-load-test.js
 *   Generate HTML report:   k6 run --out json=results.json k6-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import exec from 'k6/execution';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'https://api.example.com';
const SCENARIO = __ENV.SCENARIO || 'load';  // load, stress, spike, soak

// API endpoints
const ENDPOINTS = {
  health: '/health',
  login: '/auth/login',
  register: '/auth/register',
  products: '/api/products',
  productDetail: '/api/products/:id',
  cart: '/api/cart',
  addToCart: '/api/cart/items',
  checkout: '/api/checkout',
  orders: '/api/orders',
  profile: '/api/users/profile'
};

// ============================================================================
// TEST DATA
// ============================================================================

// Load test data from CSV/JSON files
const users = new SharedArray('users', function() {
  return [
    { username: 'user1@example.com', password: 'Test123!@#' },
    { username: 'user2@example.com', password: 'Test123!@#' },
    { username: 'user3@example.com', password: 'Test123!@#' },
    { username: 'user4@example.com', password: 'Test123!@#' },
    { username: 'user5@example.com', password: 'Test123!@#' }
  ];
});

const products = new SharedArray('products', function() {
  return [
    { id: 101, name: 'Laptop', price: 999.99 },
    { id: 102, name: 'Mouse', price: 29.99 },
    { id: 103, name: 'Keyboard', price: 79.99 },
    { id: 104, name: 'Monitor', price: 299.99 },
    { id: 105, name: 'Headphones', price: 149.99 }
  ];
});

// ============================================================================
// CUSTOM METRICS
// ============================================================================

// Success/failure rates
const loginSuccessRate = new Rate('login_success');
const checkoutSuccessRate = new Rate('checkout_success');
const apiErrorRate = new Rate('api_errors');

// Response time trends
const loginDuration = new Trend('login_duration');
const productListDuration = new Trend('product_list_duration');
const checkoutDuration = new Trend('checkout_duration');

// Business metrics
const ordersCreated = new Counter('orders_created');
const cartItemsAdded = new Counter('cart_items_added');
const activeUsers = new Gauge('active_users');

// ============================================================================
// TEST OPTIONS & SCENARIOS
// ============================================================================

export const options = {
  // Select scenario based on environment variable
  scenarios: getScenarios(SCENARIO),

  // Global thresholds (SLA requirements)
  thresholds: {
    // Overall performance
    'http_req_duration': [
      'p(50)<200',    // 50% of requests under 200ms
      'p(90)<400',    // 90% of requests under 400ms
      'p(95)<500',    // 95% of requests under 500ms
      'p(99)<1000'    // 99% of requests under 1000ms
    ],

    // Error rate must be below 1%
    'http_req_failed': ['rate<0.01'],
    'api_errors': ['rate<0.01'],

    // Minimum throughput requirements
    'http_reqs': ['rate>100'],  // At least 100 RPS

    // Endpoint-specific thresholds
    'http_req_duration{endpoint:login}': ['p(95)<300'],
    'http_req_duration{endpoint:products}': ['p(95)<400'],
    'http_req_duration{endpoint:checkout}': ['p(99)<1500'],

    // Business metric thresholds
    'login_success': ['rate>0.99'],      // 99% login success
    'checkout_success': ['rate>0.98'],   // 98% checkout success

    // Status code specific
    'http_req_duration{status:200}': ['p(95)<500'],
    'http_req_duration{status:201}': ['p(95)<600'],

    // HTTP/2 specific (if enabled)
    'http_req_connecting': ['p(95)<100'],
    'http_req_tls_handshaking': ['p(95)<200']
  },

  // HTTP settings
  http: {
    // HTTP/2 for better performance
    http2: true,
    // Increase timeout for slow endpoints
    timeout: '30s',
    // Connection pooling
    keepAlive: true
  },

  // Tags applied to all requests
  tags: {
    test_type: SCENARIO,
    environment: 'staging'
  },

  // Disable built-in summary for custom reporting
  summaryTrendStats: ['min', 'avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'max'],

  // Cloud configuration (if using k6 Cloud)
  ext: {
    loadimpact: {
      projectID: 12345,
      name: `Load Test - ${SCENARIO}`
    }
  }
};

/**
 * Get scenario configuration based on test type
 */
function getScenarios(scenarioType) {
  const scenarios = {
    // Standard load test - gradual ramp-up to target load
    load: {
      default: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
          { duration: '2m', target: 50 },    // Warm-up
          { duration: '5m', target: 200 },   // Ramp-up to normal load
          { duration: '10m', target: 200 },  // Sustained load
          { duration: '3m', target: 300 },   // Peak load
          { duration: '10m', target: 300 },  // Sustained peak
          { duration: '2m', target: 0 }      // Ramp-down
        ],
        gracefulRampDown: '30s'
      },
      // Concurrent scenario for authenticated flows
      authenticated: {
        executor: 'ramping-vus',
        exec: 'authenticatedUserJourney',
        startVUs: 0,
        stages: [
          { duration: '3m', target: 100 },
          { duration: '10m', target: 100 },
          { duration: '2m', target: 0 }
        ],
        gracefulRampDown: '30s'
      }
    },

    // Stress test - push beyond normal capacity
    stress: {
      default: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
          { duration: '2m', target: 100 },   // Normal load
          { duration: '5m', target: 200 },   // Above normal
          { duration: '5m', target: 400 },   // High load
          { duration: '5m', target: 600 },   // Stress level
          { duration: '5m', target: 800 },   // Breaking point
          { duration: '5m', target: 1000 },  // Maximum stress
          { duration: '5m', target: 0 }      // Recovery
        ],
        gracefulRampDown: '1m'
      }
    },

    // Spike test - sudden traffic surge
    spike: {
      default: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
          { duration: '30s', target: 50 },   // Normal
          { duration: '30s', target: 1000 }, // Sudden spike!
          { duration: '3m', target: 1000 },  // Sustained spike
          { duration: '30s', target: 50 },   // Recovery
          { duration: '2m', target: 50 },    // Normal
          { duration: '30s', target: 0 }     // Ramp-down
        ]
      }
    },

    // Soak test - endurance testing
    soak: {
      default: {
        executor: 'constant-vus',
        vus: 200,
        duration: '2h',  // Run for 2 hours
        gracefulStop: '1m'
      }
    },

    // Smoke test - minimal load verification
    smoke: {
      default: {
        executor: 'constant-vus',
        vus: 1,
        duration: '1m'
      }
    }
  };

  return scenarios[scenarioType] || scenarios.load;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate random integer between min and max
 */
function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Get random item from array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Sleep for random duration (think time)
 */
function randomSleep(min, max) {
  sleep(randomIntBetween(min, max));
}

/**
 * Generate unique email for registration
 */
function generateUniqueEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `user_${timestamp}_${random}@example.com`;
}

/**
 * Make HTTP request with common headers and error handling
 */
function makeRequest(method, url, payload = null, params = {}) {
  const defaultParams = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'k6-load-test/1.0'
    },
    tags: params.tags || {},
    timeout: '10s'
  };

  // Merge custom params with defaults
  const finalParams = Object.assign({}, defaultParams, params);
  if (params.headers) {
    finalParams.headers = Object.assign({}, defaultParams.headers, params.headers);
  }

  let response;
  const startTime = new Date();

  try {
    if (method === 'GET') {
      response = http.get(url, finalParams);
    } else if (method === 'POST') {
      response = http.post(url, JSON.stringify(payload), finalParams);
    } else if (method === 'PUT') {
      response = http.put(url, JSON.stringify(payload), finalParams);
    } else if (method === 'DELETE') {
      response = http.del(url, null, finalParams);
    }

    // Track API errors
    if (response.status >= 400) {
      apiErrorRate.add(1);
    } else {
      apiErrorRate.add(0);
    }

    return response;
  } catch (error) {
    console.error(`Request failed: ${method} ${url}`, error);
    apiErrorRate.add(1);
    return null;
  }
}

/**
 * Perform login and return auth token
 */
function login(username, password) {
  const loginStart = new Date();

  const response = makeRequest('POST', `${BASE_URL}${ENDPOINTS.login}`, {
    username: username,
    password: password
  }, {
    tags: { endpoint: 'login' }
  });

  const duration = new Date() - loginStart;
  loginDuration.add(duration);

  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
    'login duration < 500ms': () => duration < 500
  });

  loginSuccessRate.add(success);

  if (success && response.json('token')) {
    return response.json('token');
  }

  return null;
}

/**
 * Register new user
 */
function register() {
  const email = generateUniqueEmail();
  const password = 'Test123!@#';

  const response = makeRequest('POST', `${BASE_URL}${ENDPOINTS.register}`, {
    email: email,
    password: password,
    firstName: 'Load',
    lastName: 'Test'
  }, {
    tags: { endpoint: 'register' }
  });

  check(response, {
    'registration status is 201': (r) => r.status === 201,
    'registration has user id': (r) => r.json('userId') !== undefined
  });

  return { email, password };
}

// ============================================================================
// TEST LIFECYCLE HOOKS
// ============================================================================

/**
 * Setup - runs once before test
 */
export function setup() {
  console.log(`Starting ${SCENARIO} test against ${BASE_URL}`);
  console.log(`Test ID: ${exec.test.options.tags.test_type}`);

  // Verify API is healthy before starting test
  const healthCheck = http.get(`${BASE_URL}${ENDPOINTS.health}`);

  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed. Status: ${healthCheck.status}`);
  }

  console.log('API health check passed. Starting test...');

  return {
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL,
    scenario: SCENARIO
  };
}

/**
 * Teardown - runs once after test
 */
export function teardown(data) {
  console.log(`Test completed. Started at: ${data.startTime}`);
  console.log(`Scenario: ${data.scenario}`);

  // Could send test results to external system here
  // Could cleanup test data here
}

// ============================================================================
// MAIN TEST SCENARIOS
// ============================================================================

/**
 * Default scenario - Mixed user behavior
 */
export default function(data) {
  // Track active users
  activeUsers.add(1);

  // Simulate different user types with weighted distribution
  const userType = Math.random();

  if (userType < 0.6) {
    // 60% - Browsers (just looking)
    browseProducts();
  } else if (userType < 0.9) {
    // 30% - Shoppers (add to cart)
    shopperJourney();
  } else {
    // 10% - Buyers (complete purchase)
    buyerJourney();
  }
}

/**
 * Browser user journey - Just browsing
 */
function browseProducts() {
  group('Browse Products', function() {
    // View homepage
    const homepage = makeRequest('GET', `${BASE_URL}/`, null, {
      tags: { endpoint: 'homepage', journey: 'browse' }
    });

    check(homepage, {
      'homepage loaded': (r) => r.status === 200
    });

    randomSleep(2, 5);  // User reads homepage

    // View product list
    const productListStart = new Date();
    const productList = makeRequest('GET', `${BASE_URL}${ENDPOINTS.products}`, null, {
      tags: { endpoint: 'products', journey: 'browse' }
    });

    productListDuration.add(new Date() - productListStart);

    check(productList, {
      'product list loaded': (r) => r.status === 200,
      'has products': (r) => r.json('products').length > 0
    });

    randomSleep(3, 8);  // User reviews products

    // View random product details
    const product = randomItem(products);
    const productDetail = makeRequest(
      'GET',
      `${BASE_URL}${ENDPOINTS.productDetail.replace(':id', product.id)}`,
      null,
      { tags: { endpoint: 'product_detail', journey: 'browse' } }
    );

    check(productDetail, {
      'product detail loaded': (r) => r.status === 200,
      'product has price': (r) => r.json('price') !== undefined
    });

    randomSleep(5, 15);  // User reads product details
  });
}

/**
 * Shopper journey - Browse and add to cart
 */
function shopperJourney() {
  group('Shopping Journey', function() {
    // Browse products
    browseProducts();

    // Add item to cart (anonymous user)
    const product = randomItem(products);

    const addToCartResponse = makeRequest('POST', `${BASE_URL}${ENDPOINTS.addToCart}`, {
      productId: product.id,
      quantity: randomIntBetween(1, 3)
    }, {
      tags: { endpoint: 'add_to_cart', journey: 'shop' }
    });

    const added = check(addToCartResponse, {
      'item added to cart': (r) => r.status === 201 || r.status === 200
    });

    if (added) {
      cartItemsAdded.add(1);
    }

    randomSleep(2, 5);

    // View cart
    const cart = makeRequest('GET', `${BASE_URL}${ENDPOINTS.cart}`, null, {
      tags: { endpoint: 'cart', journey: 'shop' }
    });

    check(cart, {
      'cart loaded': (r) => r.status === 200,
      'cart has items': (r) => r.json('items').length > 0
    });

    randomSleep(3, 7);  // User reviews cart
  });
}

/**
 * Buyer journey - Complete purchase flow
 */
function buyerJourney() {
  let token = null;

  group('Purchase Journey', function() {
    // Get user credentials
    const user = randomItem(users);

    // Login
    group('Authentication', function() {
      token = login(user.username, user.password);

      if (!token) {
        console.error('Login failed, aborting purchase journey');
        return;
      }

      randomSleep(1, 3);
    });

    // Browse and add to cart
    group('Shopping', function() {
      const product1 = randomItem(products);
      const product2 = randomItem(products);

      // Add multiple items
      makeRequest('POST', `${BASE_URL}${ENDPOINTS.addToCart}`, {
        productId: product1.id,
        quantity: 1
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { endpoint: 'add_to_cart', journey: 'buy', authenticated: 'true' }
      });

      cartItemsAdded.add(1);
      randomSleep(1, 3);

      makeRequest('POST', `${BASE_URL}${ENDPOINTS.addToCart}`, {
        productId: product2.id,
        quantity: 2
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { endpoint: 'add_to_cart', journey: 'buy', authenticated: 'true' }
      });

      cartItemsAdded.add(1);
      randomSleep(2, 4);
    });

    // Checkout
    group('Checkout', function() {
      const checkoutStart = new Date();

      const checkoutResponse = makeRequest('POST', `${BASE_URL}${ENDPOINTS.checkout}`, {
        paymentMethod: 'credit_card',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          zipCode: '12345',
          country: 'US'
        },
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          zipCode: '12345',
          country: 'US'
        }
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { endpoint: 'checkout', journey: 'buy', authenticated: 'true' }
      });

      const checkoutTime = new Date() - checkoutStart;
      checkoutDuration.add(checkoutTime);

      const success = check(checkoutResponse, {
        'checkout status is 201': (r) => r.status === 201,
        'order id received': (r) => r.json('orderId') !== undefined,
        'checkout duration < 2000ms': () => checkoutTime < 2000
      });

      checkoutSuccessRate.add(success);

      if (success) {
        ordersCreated.add(1);
      }

      randomSleep(2, 5);
    });

    // View order history
    group('Order Confirmation', function() {
      const orders = makeRequest('GET', `${BASE_URL}${ENDPOINTS.orders}`, null, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { endpoint: 'orders', journey: 'buy', authenticated: 'true' }
      });

      check(orders, {
        'orders loaded': (r) => r.status === 200,
        'has orders': (r) => r.json('orders').length > 0
      });
    });
  });
}

/**
 * Authenticated user journey - For dedicated authenticated scenario
 */
export function authenticatedUserJourney(data) {
  const user = randomItem(users);
  const token = login(user.username, user.password);

  if (!token) {
    return;
  }

  group('Authenticated Actions', function() {
    // View profile
    const profile = makeRequest('GET', `${BASE_URL}${ENDPOINTS.profile}`, null, {
      headers: { 'Authorization': `Bearer ${token}` },
      tags: { endpoint: 'profile', authenticated: 'true' }
    });

    check(profile, {
      'profile loaded': (r) => r.status === 200
    });

    randomSleep(2, 4);

    // Update profile
    makeRequest('PUT', `${BASE_URL}${ENDPOINTS.profile}`, {
      firstName: 'Updated',
      lastName: 'User'
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
      tags: { endpoint: 'profile_update', authenticated: 'true' }
    });

    randomSleep(1, 3);

    // View orders
    makeRequest('GET', `${BASE_URL}${ENDPOINTS.orders}`, null, {
      headers: { 'Authorization': `Bearer ${token}` },
      tags: { endpoint: 'orders', authenticated: 'true' }
    });
  });
}

// ============================================================================
// CUSTOM REPORT GENERATION
// ============================================================================

/**
 * Generate custom HTML and text summary
 */
export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2)
  };
}
