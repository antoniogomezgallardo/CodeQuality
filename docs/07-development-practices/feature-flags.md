# Feature Flags (Feature Toggles)

## Overview

Feature flags are a software development technique that allows teams to enable or disable features without deploying new code. They decouple deployment from release, enabling continuous delivery, gradual rollouts, and rapid rollback.

## Purpose

- **Decouple deployment from release**: Deploy code to production without exposing features
- **Gradual rollout**: Release features to subset of users (canary releases)
- **A/B testing**: Test multiple variants of features
- **Kill switch**: Disable problematic features instantly
- **Trunk-based development**: Merge incomplete features to main branch safely
- **Risk mitigation**: Reduce blast radius of bugs

## Feature Flag Types

### 1. Release Flags (Release Toggles)

**Purpose:** Control when features become available to users

```javascript
// Example: New checkout flow
if (featureFlags.isEnabled('new-checkout-flow', user)) {
  return <NewCheckoutFlow />;
} else {
  return <LegacyCheckoutFlow />;
}
```

**Characteristics:**
- Short-lived (days to weeks)
- Removed after feature is fully released
- Used for gradual rollouts

### 2. Operational Flags (Ops Toggles)

**Purpose:** Control system behavior for operational reasons

```javascript
// Example: Circuit breaker for external API
if (featureFlags.isEnabled('use-external-recommendation-api')) {
  return await externalAPI.getRecommendations();
} else {
  return fallbackRecommendations();
}
```

**Characteristics:**
- Long-lived (months to years)
- Managed by operations team
- Performance and reliability focused

### 3. Experiment Flags (Experiment Toggles)

**Purpose:** Run A/B tests and multivariate experiments

```javascript
// Example: A/B test for button color
const variant = featureFlags.getVariant('checkout-button-experiment', user);

if (variant === 'red-button') {
  return <Button color="red">Checkout</Button>;
} else {
  return <Button color="green">Checkout</Button>;
}
```

**Characteristics:**
- Time-limited (duration of experiment)
- Tracked with analytics
- Removed after winner chosen

### 4. Permission Flags (Permissioning Toggles)

**Purpose:** Control feature access by user role or plan

```javascript
// Example: Premium feature access
if (user.plan === 'premium' || featureFlags.isEnabled('advanced-analytics', user)) {
  return <AdvancedAnalyticsDashboard />;
} else {
  return <UpgradeToPremiumPrompt />;
}
```

**Characteristics:**
- Long-lived (permanent)
- Part of business logic
- Managed through user permissions

## Implementation Patterns

### Basic Feature Flag

```javascript
// featureFlags.js
class FeatureFlagService {
  constructor() {
    this.flags = {
      'new-dashboard': { enabled: true, rolloutPercentage: 100 },
      'beta-feature': { enabled: true, rolloutPercentage: 10 },
      'experimental-ui': { enabled: false, rolloutPercentage: 0 }
    };
  }

  isEnabled(flagName, user = null) {
    const flag = this.flags[flagName];

    if (!flag || !flag.enabled) {
      return false;
    }

    // Percentage-based rollout
    if (user && flag.rolloutPercentage < 100) {
      const userHash = this.hashUser(user.id);
      return (userHash % 100) < flag.rolloutPercentage;
    }

    return true;
  }

  hashUser(userId) {
    // Simple hash function for consistent user bucketing
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

module.exports = new FeatureFlagService();
```

### Gradual Rollout

```javascript
// Gradually increase rollout percentage
const rolloutSchedule = {
  'new-checkout': [
    { date: '2024-01-01', percentage: 5 },   // 5% of users
    { date: '2024-01-03', percentage: 25 },  // 25% of users
    { date: '2024-01-07', percentage: 50 },  // 50% of users
    { date: '2024-01-10', percentage: 100 }  // All users
  ]
};

class GradualRollout {
  getRolloutPercentage(featureName) {
    const schedule = rolloutSchedule[featureName];
    if (!schedule) return 0;

    const now = new Date();
    for (let i = schedule.length - 1; i >= 0; i--) {
      if (now >= new Date(schedule[i].date)) {
        return schedule[i].percentage;
      }
    }
    return 0;
  }

  isEnabled(featureName, user) {
    const percentage = this.getRolloutPercentage(featureName);
    const userHash = this.hashUser(user.id);
    return (userHash % 100) < percentage;
  }
}
```

### User Targeting

```javascript
class TargetedFeatureFlags {
  isEnabled(flagName, user) {
    const flag = this.flags[flagName];

    // Target specific users
    if (flag.targetedUsers && flag.targetedUsers.includes(user.id)) {
      return true;
    }

    // Target by user attributes
    if (flag.targetRules) {
      return this.evaluateRules(flag.targetRules, user);
    }

    // Default behavior
    return flag.enabled;
  }

  evaluateRules(rules, user) {
    // Example: Enable for premium users in US
    if (rules.plan && user.plan !== rules.plan) {
      return false;
    }
    if (rules.country && user.country !== rules.country) {
      return false;
    }
    if (rules.email && !user.email.includes(rules.email)) {
      return false;
    }
    return true;
  }
}

// Usage
const flags = {
  'premium-feature': {
    enabled: true,
    targetRules: {
      plan: 'premium',
      country: 'US'
    }
  }
};
```

### Feature Flag with Analytics

```javascript
class AnalyticsAwareFeatureFlags {
  isEnabled(flagName, user) {
    const enabled = this.evaluateFlag(flagName, user);

    // Track flag evaluation
    this.analytics.track('feature_flag_evaluated', {
      flagName,
      userId: user.id,
      enabled,
      timestamp: new Date()
    });

    return enabled;
  }

  async trackConversion(flagName, user, eventName) {
    // Track feature flag impact on key metrics
    await this.analytics.track('feature_flag_conversion', {
      flagName,
      userId: user.id,
      eventName,
      variant: this.getVariant(flagName, user)
    });
  }
}

// Usage in component
if (featureFlags.isEnabled('new-checkout', user)) {
  // User sees new checkout
  onCheckoutComplete(() => {
    featureFlags.trackConversion('new-checkout', user, 'checkout_completed');
  });
}
```

## Best Practices

### 1. Naming Conventions

```javascript
// ✅ GOOD: Clear, descriptive names
'enable-dark-mode'
'new-recommendation-engine'
'gradual-rollout-mobile-app-v2'
'experiment-checkout-button-color'

// ❌ BAD: Vague or technical names
'flag1'
'test'
'new-thing'
'refactor'
```

### 2. Flag Lifecycle Management

```javascript
// Track flag metadata
const flagMetadata = {
  'new-dashboard': {
    createdAt: '2024-01-01',
    createdBy: 'jane@example.com',
    jiraTicket: 'PROJ-123',
    expectedRemovalDate: '2024-02-01',
    status: 'active', // active, deprecated, removed
    type: 'release' // release, ops, experiment, permission
  }
};

// Automated flag cleanup alerts
function flagsNeedingCleanup() {
  const now = new Date();
  return Object.entries(flagMetadata)
    .filter(([_, meta]) => {
      const removalDate = new Date(meta.expectedRemovalDate);
      return now > removalDate && meta.status === 'active';
    })
    .map(([name]) => name);
}
```

### 3. Default to Safe State

```javascript
// ✅ GOOD: Default to existing/safe behavior
if (featureFlags.isEnabled('risky-new-feature', user)) {
  return newRiskyImplementation();
} else {
  return existingSafeImplementation(); // Fallback
}

// ❌ BAD: Default to untested behavior
if (!featureFlags.isEnabled('keep-old-feature', user)) {
  return newUntestedImplementation();
}
```

### 4. Short-Lived Release Flags

```javascript
// Flag lifecycle
const flagLifecycle = {
  week1: 'Create flag, deploy code',
  week2: 'Gradual rollout 5% → 25% → 50%',
  week3: 'Rollout to 100%, monitor',
  week4: 'Remove flag, clean up code'
};

// ⚠️ WARNING: Flags older than 3 months need review
```

## Feature Flag Platforms

### LaunchDarkly Example

```javascript
import LaunchDarkly from 'launchdarkly-node-server-sdk';

const client = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY);

await client.waitForInitialization();

const user = {
  key: 'user-123',
  email: 'user@example.com',
  custom: {
    plan: 'premium',
    country: 'US'
  }
};

const showNewFeature = await client.variation('new-feature', user, false);

if (showNewFeature) {
  // Show new feature
}
```

### Split.io Example

```javascript
import { SplitFactory } from '@splitsoftware/splitio';

const factory = SplitFactory({
  core: {
    authorizationKey: process.env.SPLIT_API_KEY,
    key: user.id
  }
});

const client = factory.client();

await client.ready();

const treatment = client.getTreatment('new-checkout-flow');

if (treatment === 'on') {
  // Show new checkout
} else {
  // Show old checkout
}
```

### Custom Solution with Database

```javascript
// Feature flags stored in database
const FeatureFlag = {
  async isEnabled(flagName, user) {
    const flag = await db.featureFlags.findOne({ name: flagName });

    if (!flag || !flag.enabled) return false;

    // Check user targeting
    if (flag.targetedUserIds?.includes(user.id)) return true;
    if (flag.excludedUserIds?.includes(user.id)) return false;

    // Check percentage rollout
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashUser(user.id);
      return (hash % 100) < flag.rolloutPercentage;
    }

    return true;
  }
};

// Database schema
const featureFlagSchema = {
  name: String,
  enabled: Boolean,
  rolloutPercentage: Number,
  targetedUserIds: [String],
  excludedUserIds: [String],
  targetRules: Object,
  createdAt: Date,
  expectedRemovalDate: Date
};
```

## Testing with Feature Flags

```javascript
describe('Checkout Flow', () => {
  it('should use new checkout when flag is enabled', () => {
    featureFlags.override('new-checkout', true);

    const result = renderCheckout(user);

    expect(result).toContain('NewCheckoutFlow');
  });

  it('should use old checkout when flag is disabled', () => {
    featureFlags.override('new-checkout', false);

    const result = renderCheckout(user);

    expect(result).toContain('LegacyCheckoutFlow');
  });

  afterEach(() => {
    featureFlags.clearOverrides();
  });
});
```

## Common Pitfalls

### 1. Too Many Flags

```markdown
❌ **Problem:** Flag sprawl, technical debt accumulates

✅ **Solution:**
- Remove flags after rollout complete
- Track flag age, alert on old flags
- Regular cleanup sprints
- Maximum flag lifetime policy
```

### 2. Complex Flag Logic

```javascript
// ❌ BAD: Nested flag conditions
if (flags.isEnabled('feature-a')) {
  if (flags.isEnabled('feature-b')) {
    if (user.plan === 'premium' || flags.isEnabled('temp-access')) {
      // Too complex!
    }
  }
}

// ✅ GOOD: Single clear condition
if (flags.canAccessPremiumFeatures(user)) {
  // Clear abstraction
}
```

### 3. Testing All Flag Combinations

```markdown
❌ **Problem:** 2^n test combinations for n flags

✅ **Solution:**
- Test each flag independently
- Integration tests for critical paths
- Use flag overrides in tests
```

## Related Resources

- [Continuous Delivery](../08-cicd-pipeline/continuous-delivery.md)
- [Trunk-Based Development](../03-version-control/03-README.md)
- [Deployment Strategies](../10-deployment/deployment-strategies.md)
- [A/B Testing](../12-continuous-improvement/README.md)

## References

- Martin Fowler - Feature Toggles
- Trunk Based Development - Feature Flags
- DORA - Continuous Delivery Practices
- LaunchDarkly - Feature Flag Best Practices

---

*Part of: [Development Practices](README.md)*
