/**
 * Feature Flag Deployment Examples
 *
 * This file demonstrates feature flag-based deployment strategies using:
 * - LaunchDarkly SDK
 * - Unleash SDK
 * - Custom feature flag implementation
 * - Gradual rollout patterns
 * - User segmentation
 * - A/B testing
 * - Kill switch functionality
 *
 * Feature flags decouple deployment from release, allowing:
 * - Deploy code with features disabled
 * - Gradually enable features for specific users/segments
 * - Instant rollback without redeployment
 * - A/B testing and experimentation
 * - Canary releases at application level
 */

// ============================================================================
// LAUNCHDARKLY IMPLEMENTATION
// ============================================================================

const LaunchDarkly = require('launchdarkly-node-server-sdk');

class LaunchDarklyFeatureFlags {
  constructor(sdkKey) {
    this.client = LaunchDarkly.init(sdkKey);
    this.ready = false;

    this.client.once('ready', () => {
      console.log('LaunchDarkly SDK initialized');
      this.ready = true;
    });

    this.client.on('error', (err) => {
      console.error('LaunchDarkly error:', err);
    });
  }

  /**
   * Wait for SDK to be ready
   */
  async waitForInitialization(timeout = 5000) {
    return this.client.waitForInitialization({ timeout });
  }

  /**
   * Check if feature is enabled for user
   */
  async isFeatureEnabled(featureKey, user, defaultValue = false) {
    if (!this.ready) {
      await this.waitForInitialization();
    }

    try {
      return await this.client.variation(featureKey, user, defaultValue);
    } catch (error) {
      console.error(`Error evaluating feature flag ${featureKey}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get feature flag value with type safety
   */
  async getFeatureValue(featureKey, user, defaultValue) {
    if (!this.ready) {
      await this.waitForInitialization();
    }

    return await this.client.variation(featureKey, user, defaultValue);
  }

  /**
   * Get all feature flags for user
   */
  async getAllFlags(user) {
    if (!this.ready) {
      await this.waitForInitialization();
    }

    return await this.client.allFlagsState(user);
  }

  /**
   * Track feature flag usage metrics
   */
  async trackEvent(user, eventName, data = null, metricValue = null) {
    if (!this.ready) {
      await this.waitForInitialization();
    }

    this.client.track(eventName, user, data, metricValue);
  }

  /**
   * Flush events and close client
   */
  async close() {
    await this.client.flush();
    await this.client.close();
  }
}

// ============================================================================
// UNLEASH IMPLEMENTATION
// ============================================================================

const { startUnleash } = require('unleash-client');

class UnleashFeatureFlags {
  constructor(config) {
    this.client = null;
    this.config = {
      url: config.url || 'http://localhost:4242/api',
      appName: config.appName || 'my-app',
      environment: config.environment || 'production',
      customHeaders: config.apiKey ? { Authorization: config.apiKey } : {},
      ...config,
    };
  }

  /**
   * Initialize Unleash client
   */
  async initialize() {
    this.client = await startUnleash(this.config);

    this.client.on('ready', () => {
      console.log('Unleash SDK initialized');
    });

    this.client.on('error', (err) => {
      console.error('Unleash error:', err);
    });

    this.client.on('synchronized', () => {
      console.log('Unleash synchronized with server');
    });

    return this.client;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureKey, context = {}, defaultValue = false) {
    if (!this.client) {
      console.warn('Unleash client not initialized');
      return defaultValue;
    }

    return this.client.isEnabled(featureKey, context, defaultValue);
  }

  /**
   * Get feature variant
   */
  getVariant(featureKey, context = {}) {
    if (!this.client) {
      console.warn('Unleash client not initialized');
      return { name: 'disabled', enabled: false };
    }

    return this.client.getVariant(featureKey, context);
  }

  /**
   * Get all feature toggles
   */
  getAllToggles() {
    if (!this.client) {
      return [];
    }

    return this.client.getFeatureToggleDefinitions();
  }

  /**
   * Destroy client
   */
  destroy() {
    if (this.client) {
      this.client.destroy();
    }
  }
}

// ============================================================================
// CUSTOM FEATURE FLAG IMPLEMENTATION
// ============================================================================

class CustomFeatureFlags {
  constructor() {
    this.flags = new Map();
    this.rolloutPercentages = new Map();
    this.userSegments = new Map();
  }

  /**
   * Define a feature flag
   */
  defineFlag(flagKey, config = {}) {
    this.flags.set(flagKey, {
      enabled: config.enabled || false,
      rolloutPercentage: config.rolloutPercentage || 0,
      allowedUsers: config.allowedUsers || [],
      allowedSegments: config.allowedSegments || [],
      startDate: config.startDate || null,
      endDate: config.endDate || null,
      dependencies: config.dependencies || [],
      ...config,
    });
  }

  /**
   * Check if feature is enabled for user
   */
  isEnabled(flagKey, user) {
    const flag = this.flags.get(flagKey);

    if (!flag) {
      console.warn(`Feature flag ${flagKey} not found`);
      return false;
    }

    // Flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check date range
    if (!this.isWithinDateRange(flag)) {
      return false;
    }

    // Check dependencies
    if (!this.areDependenciesMet(flag, user)) {
      return false;
    }

    // Check if user is in allowed list
    if (flag.allowedUsers.length > 0) {
      if (flag.allowedUsers.includes(user.id)) {
        return true;
      }
    }

    // Check if user is in allowed segments
    if (flag.allowedSegments.length > 0) {
      if (this.isUserInSegments(user, flag.allowedSegments)) {
        return true;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage > 0) {
      return this.isUserInRollout(user, flagKey, flag.rolloutPercentage);
    }

    return false;
  }

  /**
   * Check if current date is within flag's date range
   */
  isWithinDateRange(flag) {
    const now = new Date();

    if (flag.startDate && now < new Date(flag.startDate)) {
      return false;
    }

    if (flag.endDate && now > new Date(flag.endDate)) {
      return false;
    }

    return true;
  }

  /**
   * Check if all flag dependencies are met
   */
  areDependenciesMet(flag, user) {
    if (flag.dependencies.length === 0) {
      return true;
    }

    return flag.dependencies.every((depKey) => this.isEnabled(depKey, user));
  }

  /**
   * Check if user is in specified segments
   */
  isUserInSegments(user, allowedSegments) {
    return allowedSegments.some((segment) => {
      const segmentRule = this.userSegments.get(segment);
      return segmentRule ? segmentRule(user) : false;
    });
  }

  /**
   * Consistent hashing to determine if user is in rollout percentage
   */
  isUserInRollout(user, flagKey, percentage) {
    const hash = this.hashUserForFlag(user.id, flagKey);
    const bucket = hash % 100;
    return bucket < percentage;
  }

  /**
   * Simple hash function for consistent user bucketing
   */
  hashUserForFlag(userId, flagKey) {
    const str = `${userId}:${flagKey}`;
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }

  /**
   * Define a user segment with custom rule
   */
  defineSegment(segmentName, rule) {
    this.userSegments.set(segmentName, rule);
  }

  /**
   * Enable flag globally
   */
  enable(flagKey) {
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.enabled = true;
    }
  }

  /**
   * Disable flag globally (kill switch)
   */
  disable(flagKey) {
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.enabled = false;
    }
  }

  /**
   * Set rollout percentage
   */
  setRolloutPercentage(flagKey, percentage) {
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    }
  }

  /**
   * Get flag configuration
   */
  getFlag(flagKey) {
    return this.flags.get(flagKey);
  }

  /**
   * Get all flags
   */
  getAllFlags() {
    return Object.fromEntries(this.flags);
  }
}

// ============================================================================
// GRADUAL ROLLOUT CONTROLLER
// ============================================================================

class GradualRolloutController {
  constructor(featureFlags) {
    this.featureFlags = featureFlags;
    this.rolloutSchedule = [1, 5, 25, 50, 100]; // Percentages
    this.currentStageIndex = new Map();
    this.metrics = new Map();
  }

  /**
   * Start gradual rollout for a feature
   */
  async startRollout(flagKey, config = {}) {
    const {
      schedule = this.rolloutSchedule,
      stageDuration = 15 * 60 * 1000, // 15 minutes
      autoPromote = false,
      metricsThresholds = {},
    } = config;

    this.currentStageIndex.set(flagKey, 0);

    console.log(`Starting gradual rollout for ${flagKey}`);
    console.log(`Schedule: ${schedule.join('% → ')}%`);

    // Set initial percentage
    await this.setRolloutStage(flagKey, schedule[0]);

    if (autoPromote) {
      this.scheduleAutoPromotion(flagKey, schedule, stageDuration, metricsThresholds);
    }
  }

  /**
   * Set rollout to specific stage
   */
  async setRolloutStage(flagKey, percentage) {
    if (this.featureFlags.setRolloutPercentage) {
      this.featureFlags.setRolloutPercentage(flagKey, percentage);
      console.log(`${flagKey}: Rollout set to ${percentage}%`);
    }
  }

  /**
   * Schedule automatic promotion through rollout stages
   */
  scheduleAutoPromotion(flagKey, schedule, stageDuration, metricsThresholds) {
    const promoteToNextStage = async () => {
      const currentIndex = this.currentStageIndex.get(flagKey);

      if (currentIndex >= schedule.length - 1) {
        console.log(`${flagKey}: Rollout complete at 100%`);
        return;
      }

      // Check metrics before promoting
      const metricsOk = await this.checkMetrics(flagKey, metricsThresholds);

      if (!metricsOk) {
        console.error(`${flagKey}: Metrics check failed, halting rollout`);
        return;
      }

      // Promote to next stage
      const nextIndex = currentIndex + 1;
      this.currentStageIndex.set(flagKey, nextIndex);
      await this.setRolloutStage(flagKey, schedule[nextIndex]);

      // Schedule next promotion
      setTimeout(promoteToNextStage, stageDuration);
    };

    setTimeout(promoteToNextStage, stageDuration);
  }

  /**
   * Check metrics to determine if rollout should continue
   */
  async checkMetrics(flagKey, thresholds) {
    // In production, query your metrics system (Prometheus, Datadog, etc.)
    const metrics = await this.collectMetrics(flagKey);

    // Check error rate
    if (thresholds.maxErrorRate && metrics.errorRate > thresholds.maxErrorRate) {
      console.error(
        `Error rate ${metrics.errorRate}% exceeds threshold ${thresholds.maxErrorRate}%`
      );
      return false;
    }

    // Check latency
    if (thresholds.maxLatencyP95 && metrics.latencyP95 > thresholds.maxLatencyP95) {
      console.error(
        `Latency p95 ${metrics.latencyP95}ms exceeds threshold ${thresholds.maxLatencyP95}ms`
      );
      return false;
    }

    // Check custom business metrics
    if (thresholds.minConversionRate && metrics.conversionRate < thresholds.minConversionRate) {
      console.error(
        `Conversion rate ${metrics.conversionRate}% below threshold ${thresholds.minConversionRate}%`
      );
      return false;
    }

    return true;
  }

  /**
   * Collect metrics for feature flag
   */
  async collectMetrics(flagKey) {
    // Mock implementation - replace with actual metrics collection
    return {
      errorRate: Math.random() * 0.5, // 0-0.5%
      latencyP95: 200 + Math.random() * 100, // 200-300ms
      conversionRate: 95 + Math.random() * 5, // 95-100%
    };
  }

  /**
   * Pause rollout
   */
  pauseRollout(flagKey) {
    console.log(`Pausing rollout for ${flagKey}`);
    // Stop auto-promotion (would need to clear timeout in production)
  }

  /**
   * Rollback feature flag
   */
  async rollback(flagKey) {
    console.log(`Rolling back ${flagKey}`);
    this.featureFlags.disable(flagKey);
    this.currentStageIndex.delete(flagKey);
  }
}

// ============================================================================
// A/B TESTING IMPLEMENTATION
// ============================================================================

class ABTestingController {
  constructor(featureFlags) {
    this.featureFlags = featureFlags;
    this.experiments = new Map();
  }

  /**
   * Create A/B test
   */
  createExperiment(experimentKey, config) {
    this.experiments.set(experimentKey, {
      variants: config.variants || ['control', 'treatment'],
      weights: config.weights || [50, 50],
      targetAudience: config.targetAudience || (() => true),
      metrics: config.metrics || [],
      startDate: config.startDate || new Date(),
      endDate: config.endDate || null,
    });
  }

  /**
   * Assign user to experiment variant
   */
  getVariant(experimentKey, user) {
    const experiment = this.experiments.get(experimentKey);

    if (!experiment) {
      return 'control';
    }

    // Check if user is in target audience
    if (!experiment.targetAudience(user)) {
      return 'control';
    }

    // Check if experiment is active
    const now = new Date();
    if (now < experiment.startDate || (experiment.endDate && now > experiment.endDate)) {
      return 'control';
    }

    // Assign variant based on consistent hashing
    return this.assignVariant(user, experimentKey, experiment.variants, experiment.weights);
  }

  /**
   * Consistently assign variant to user
   */
  assignVariant(user, experimentKey, variants, weights) {
    const hash = this.hashUser(user.id, experimentKey);
    const bucket = hash % 100;

    let cumulativeWeight = 0;
    for (let i = 0; i < variants.length; i++) {
      cumulativeWeight += weights[i];
      if (bucket < cumulativeWeight) {
        return variants[i];
      }
    }

    return variants[0]; // Fallback to first variant
  }

  /**
   * Hash user for consistent bucketing
   */
  hashUser(userId, experimentKey) {
    const str = `${userId}:${experimentKey}`;
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash);
  }

  /**
   * Track experiment event
   */
  trackEvent(experimentKey, user, eventName, value = null) {
    const variant = this.getVariant(experimentKey, user);

    // In production, send to analytics platform
    console.log('Experiment event:', {
      experiment: experimentKey,
      variant,
      user: user.id,
      event: eventName,
      value,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// EXPRESS.JS MIDDLEWARE EXAMPLE
// ============================================================================

/**
 * Express middleware for feature flag evaluation
 */
function featureFlagMiddleware(featureFlags) {
  return async (req, res, next) => {
    // Create user context from request
    const user = {
      id: req.user?.id || req.sessionID || req.ip,
      email: req.user?.email,
      name: req.user?.name,
      customAttributes: {
        country: req.headers['cf-ipcountry'] || 'US',
        userAgent: req.headers['user-agent'],
        isPremium: req.user?.isPremium || false,
      },
    };

    // Attach feature flag checker to request
    req.features = {
      isEnabled: async (flagKey, defaultValue = false) => {
        return await featureFlags.isFeatureEnabled(flagKey, user, defaultValue);
      },
      getValue: async (flagKey, defaultValue) => {
        return await featureFlags.getFeatureValue(flagKey, user, defaultValue);
      },
    };

    next();
  };
}

/**
 * Route protection middleware - requires feature flag to be enabled
 */
function requireFeature(flagKey) {
  return async (req, res, next) => {
    const enabled = await req.features.isEnabled(flagKey);

    if (!enabled) {
      return res.status(404).json({
        error: 'Feature not available',
        message: 'This feature is not enabled for your account',
      });
    }

    next();
  };
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

async function examples() {
  // Example 1: LaunchDarkly
  console.log('\n=== LaunchDarkly Example ===');
  const ldFlags = new LaunchDarklyFeatureFlags(process.env.LAUNCHDARKLY_SDK_KEY);
  await ldFlags.waitForInitialization();

  const user = {
    key: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    custom: {
      isPremium: true,
    },
  };

  const newCheckoutEnabled = await ldFlags.isFeatureEnabled('new-checkout', user);
  console.log('New checkout enabled:', newCheckoutEnabled);

  // Example 2: Unleash
  console.log('\n=== Unleash Example ===');
  const unleashFlags = new UnleashFeatureFlags({
    url: process.env.UNLEASH_URL,
    apiKey: process.env.UNLEASH_API_KEY,
    appName: 'my-app',
  });
  await unleashFlags.initialize();

  const context = {
    userId: 'user-123',
    sessionId: 'session-456',
    properties: {
      region: 'us-east-1',
    },
  };

  const betaFeaturesEnabled = unleashFlags.isFeatureEnabled('beta-features', context);
  console.log('Beta features enabled:', betaFeaturesEnabled);

  // Example 3: Custom Feature Flags
  console.log('\n=== Custom Feature Flags Example ===');
  const customFlags = new CustomFeatureFlags();

  // Define user segments
  customFlags.defineSegment('internal-users', (user) => {
    return user.email?.endsWith('@company.com');
  });

  customFlags.defineSegment('premium-users', (user) => {
    return user.isPremium === true;
  });

  // Define feature flags
  customFlags.defineFlag('new-payment-processor', {
    enabled: true,
    rolloutPercentage: 25,
    allowedSegments: ['internal-users'],
  });

  customFlags.defineFlag('advanced-analytics', {
    enabled: true,
    allowedSegments: ['premium-users'],
  });

  // Check feature
  const testUser = { id: 'user-789', email: 'user@company.com' };
  const hasNewPayment = customFlags.isEnabled('new-payment-processor', testUser);
  console.log('New payment processor enabled:', hasNewPayment);

  // Example 4: Gradual Rollout
  console.log('\n=== Gradual Rollout Example ===');
  const rolloutController = new GradualRolloutController(customFlags);

  await rolloutController.startRollout('new-payment-processor', {
    schedule: [1, 5, 25, 50, 100],
    stageDuration: 5000, // 5 seconds for demo
    autoPromote: true,
    metricsThresholds: {
      maxErrorRate: 1.0,
      maxLatencyP95: 2000,
      minConversionRate: 95,
    },
  });

  // Example 5: A/B Testing
  console.log('\n=== A/B Testing Example ===');
  const abController = new ABTestingController(customFlags);

  abController.createExperiment('checkout-button-color', {
    variants: ['blue', 'green', 'red'],
    weights: [34, 33, 33],
    targetAudience: (user) => !user.isPremium,
    metrics: ['clicks', 'conversions'],
  });

  const variant = abController.getVariant('checkout-button-color', testUser);
  console.log('Assigned variant:', variant);

  abController.trackEvent('checkout-button-color', testUser, 'button-clicked');
}

// ============================================================================
// EXPRESS APP EXAMPLE
// ============================================================================

const express = require('express');

function createApp(featureFlags) {
  const app = express();

  // Apply feature flag middleware
  app.use(featureFlagMiddleware(featureFlags));

  // Protected route - requires feature flag
  app.get('/api/v2/checkout', requireFeature('new-checkout'), async (req, res) => {
    res.json({ message: 'New checkout flow' });
  });

  // Conditional feature in route
  app.get('/api/products', async (req, res) => {
    const products = await getProducts();

    // Check if personalization is enabled
    const personalizationEnabled = await req.features.isEnabled('product-personalization');

    if (personalizationEnabled) {
      // Add personalized recommendations
      products.recommendations = await getPersonalizedRecommendations(req.user);
    }

    res.json(products);
  });

  // A/B test variant
  app.get('/api/landing-page', async (req, res) => {
    const variant = await req.features.getValue('landing-page-variant', 'control');

    res.json({
      variant,
      content: getLandingPageContent(variant),
    });
  });

  return app;
}

// Mock functions
async function getProducts() {
  return { items: [] };
}
async function getPersonalizedRecommendations(user) {
  return [];
}
function getLandingPageContent(variant) {
  return {};
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  LaunchDarklyFeatureFlags,
  UnleashFeatureFlags,
  CustomFeatureFlags,
  GradualRolloutController,
  ABTestingController,
  featureFlagMiddleware,
  requireFeature,
  createApp,
  examples,
};

// Run examples if executed directly
if (require.main === module) {
  examples().catch(console.error);
}
