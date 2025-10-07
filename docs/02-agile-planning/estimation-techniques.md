# Estimation Techniques

## Overview

Estimation techniques help Agile teams predict the effort, complexity, or time required to complete user stories and tasks. Good estimation enables better planning, commitment, and forecasting while acknowledging the inherent uncertainty in software development.

## Purpose

- **Sprint planning**: Determine how much work fits in a sprint
- **Release planning**: Forecast when features will be delivered
- **Capacity planning**: Balance team workload
- **Risk management**: Identify complex or uncertain work early
- **Continuous improvement**: Track estimation accuracy over time

## Core Principles

### 1. Estimates Are Not Commitments

Estimates are predictions with uncertainty, not promises or deadlines.

### 2. Team-Based Estimation

The people doing the work should do the estimating.

### 3. Relative vs. Absolute

Comparing work items to each other is more accurate than absolute time estimates.

### 4. Refinement Over Time

Estimates improve as understanding increases through conversation and discovery.

## Estimation Techniques

### 1. Planning Poker

**Description:** Team-based consensus-driven estimation using cards with fibonacci sequence numbers.

**How It Works:**

```markdown
**Steps:**
1. Product Owner presents a user story
2. Team asks clarifying questions
3. Each team member privately selects an estimate card
4. All reveal cards simultaneously
5. Discuss differences (especially highest and lowest)
6. Re-estimate until consensus or close alignment

**Cards:** 0, 1, 2, 3, 5, 8, 13, 20, 40, 100, ?, ☕

**Scale Meaning:**
- 1-2: Trivial, very well understood
- 3-5: Small, straightforward
- 8: Moderate complexity
- 13: Large, needs discussion about splitting
- 20+: Too large, must split
- ?: Need more information
- ☕: Need a break
```

**Example Session:**

```markdown
**Story:** "Add password reset functionality"

**Round 1:**
Developer A: 5
Developer B: 13
Developer C: 8
Tech Lead: 5

**Discussion:**
Developer B: "I'm concerned about email delivery reliability and rate limiting"
Developer A: "We already have email service integrated, it's just a new template"
Developer C: "What about forgot username scenario?"
Product Owner: "Let's focus on password reset only, username recovery is separate"

**Round 2:**
All: 5

**Consensus:** 5 story points
```

**Best Practices:**

```markdown
✅ Limit to 5-10 minutes per story
✅ Start with reference stories (small=1, medium=5, large=13)
✅ Outliers explain first (highest and lowest estimates)
✅ Focus on complexity, not hours
✅ Accept "close enough" (5 vs 8 doesn't need perfect consensus)

❌ Don't average numbers
❌ Don't let managers/POs estimate
❌ Don't convert points to hours (yet)
❌ Don't spend >10 min on one story (park and research)
```

**Tools:**
- Physical cards
- PlanITPoker.com
- Scrum Poker apps
- Jira Planning Poker plugin

---

### 2. T-Shirt Sizing

**Description:** High-level estimation using T-shirt sizes (XS, S, M, L, XL, XXL).

**How It Works:**

```markdown
**Size Definitions:**
- **XS:** < 1 day, trivial change
- **S:** 1-2 days, straightforward
- **M:** 2-4 days, moderate complexity
- **L:** 1 week, complex
- **XL:** 2 weeks, very complex
- **XXL:** Epic, must be broken down

**Conversion to Story Points (Example):**
- XS = 1 point
- S = 2-3 points
- M = 5 points
- L = 8 points
- XL = 13 points
- XXL = Split into smaller stories
```

**When to Use:**

```markdown
✅ Early roadmap planning
✅ High-level backlog grooming
✅ Portfolio/epic estimation
✅ Quick relative sizing
✅ Teams new to story points

**Example:**
**Feature:** Mobile app development

Epics:
- User authentication: M
- Product browsing: L
- Shopping cart: M
- Checkout & payment: XL
- Order history: S
- Push notifications: M
```

**Benefits:**
- Fast and lightweight
- Non-intimidating for new teams
- Easy to understand
- Good for initial sizing

**Limitations:**
- Less precise than story points
- Harder to track velocity
- May need conversion later

---

### 3. Relative Estimation (Story Points)

**Description:** Estimate stories relative to a baseline "reference story" using dimensionless units (story points).

**How It Works:**

```markdown
**Choose Reference Stories:**
1. **Small (1-2 points):** Minor UI text change
2. **Medium (5 points):** Add new API endpoint with tests
3. **Large (13 points):** Integrate third-party payment gateway

**Estimate New Stories:**
Compare to reference:
- "This is about twice as complex as the 5-point reference" → 8-13 points
- "This is simpler than the 5-point reference" → 2-3 points
- "This is similar to the 5-point reference" → 5 points
```

**Factors to Consider:**

```markdown
**Complexity:**
- Algorithm complexity
- Business logic intricacy
- Number of edge cases
- Uncertainty/unknowns

**Effort:**
- Lines of code (rough proxy)
- Number of files/components
- Testing effort
- Documentation needs

**Risk:**
- Technical unknowns
- Dependency on external systems
- Performance concerns
- Security considerations
```

**Example:**

```markdown
**Reference Story (5 points):** "Add sorting to product list table"
- Moderate backend query changes
- Simple frontend UI update
- Straightforward testing

**New Story:** "Add filtering to product list table"
**Comparison:**
- Similar backend complexity
- Similar frontend work
- Additional UI for filter controls (+complexity)
- More test combinations needed (+effort)

**Estimate:** 8 points
```

---

### 4. Affinity Estimation

**Description:** Rapid technique for estimating many items by grouping similar-sized stories.

**How It Works:**

```markdown
**Steps:**
1. Write each story on a card
2. Silently arrange cards in columns by size (XS, S, M, L, XL)
3. Anyone can move any card at any time
4. When stable, review and discuss outliers
5. Assign story points to each column

**Example Layout:**

XS (1)    | S (2)      | M (5)       | L (8)      | XL (13)
----------|------------|-------------|------------|-------------
UI fix    | Add button | New API     | Payment    | OAuth login
Text      | Validation | endpoint    | integration|
change    | error msg  | Simple CRUD | Multi-step |
          | Unit tests | With tests  | flow       |

**Time:** Estimate 20-30 stories in 30 minutes
```

**Best Practices:**

```markdown
✅ Use for backlog refinement sessions
✅ Keep silent during initial sorting
✅ Let team self-organize
✅ Review and discuss only when movement stops
✅ Perfect for large backlogs

❌ Don't use for sprint planning (too rough)
❌ Don't overthink individual placements
❌ Don't debate during silent phase
```

---

### 5. Bucket System

**Description:** Similar to affinity estimation but with predefined "buckets" representing exponential sizes.

**How It Works:**

```markdown
**Buckets:** 0, 1, 2, 3, 5, 8, 13, 20, 40, 100

**Process:**
1. Place three reference stories in buckets (small, medium, large)
2. Team takes turns placing stories into buckets
3. Anyone can challenge a placement
4. Discuss and resolve challenges
5. Final review of each bucket

**Example:**

Bucket 1  | Bucket 2  | Bucket 5  | Bucket 8     | Bucket 13
----------|-----------|-----------|--------------|----------
Fix typo  | Add field | New page  | API          | Third-party
CSS tweak | Tooltip   | with form | integration  | integration
          | Email     | Basic     | Multi-step   | Complex
          | template  | validation| workflow     | migration
```

**Benefits:**
- Faster than Planning Poker for large backlogs
- Forces relative thinking
- Visualizes distribution
- Identifies estimation outliers

---

### 6. Dot Voting

**Description:** Team members use dots to vote on the size of stories.

**How It Works:**

```markdown
**Setup:**
- Post stories on wall
- Each team member gets 3 dots per story
- Place dots on size category (S/M/L or 1/2/3/5/8)

**Tallying:**
Count dots to determine consensus size

**Example:**

Story: "Add export to CSV feature"

Size 3: •
Size 5: •••••
Size 8: ••

**Result:** 5 points (most votes)
```

**When to Use:**
- Quick validation of estimates
- Refinement sessions
- Multiple stories to estimate
- Distributed teams (virtual dot voting)

---

### 7. Three-Point Estimation

**Description:** Estimate optimistic, most likely, and pessimistic scenarios, then calculate weighted average.

**Formula:**

```
Estimate = (Optimistic + 4×Most Likely + Pessimistic) / 6
```

**How It Works:**

```markdown
**Example Story:** "Implement user dashboard"

**Estimates:**
- Optimistic (best case): 3 days
- Most Likely (realistic): 5 days
- Pessimistic (worst case): 10 days

**Calculation:**
Estimate = (3 + 4×5 + 10) / 6
         = (3 + 20 + 10) / 6
         = 33 / 6
         = 5.5 days

**Rounded:** 6 days or 8 story points
```

**When to Use:**
- High uncertainty
- Critical path items
- Risk assessment needed
- Complex technical stories

**Benefits:**
- Accounts for uncertainty
- Quantifies risk
- More accurate than single-point estimates
- Useful for Monte Carlo simulations

---

### 8. Historical Data / Reference Class Forecasting

**Description:** Use data from similar past projects/stories to estimate new work.

**How It Works:**

```markdown
**Step 1: Identify Similar Work**
Find previously completed stories similar to new story

**Example:**
New Story: "Add real-time notifications"

Similar Past Stories:
- "Add email notifications" - 8 points, completed in 1.2 sprints
- "Add SMS notifications" - 5 points, completed in 1 sprint
- "Add push notifications" - 13 points, completed in 2 sprints

**Step 2: Analyze Differences**
- Real-time = WebSocket complexity (similar to push)
- Notification UI (similar to email)
- Backend infrastructure (new)

**Step 3: Estimate**
Based on analysis: 10-13 points
```

**Data to Track:**

```markdown
**Story Attributes:**
- Original estimate
- Actual completion time
- Complexity factors
- Team velocity during that sprint
- Issues encountered

**Example Data:**

| Story | Est. | Actual | Variance | Notes |
|-------|------|--------|----------|-------|
| Login | 5    | 5      | 0%       | Smooth |
| Cart  | 8    | 13     | +62%     | State mgmt complex |
| Search| 5    | 3      | -40%     | Simpler than expected |
```

**Benefits:**
- Evidence-based
- Improves over time
- Identifies patterns
- Calibrates team's estimation skill

---

### 9. Expert Judgment

**Description:** Leverage experienced team members' intuition and knowledge.

**When to Use:**

```markdown
✅ Unfamiliar technology or domain
✅ Time-critical estimation needed
✅ Very large or complex epics
✅ Architectural decisions
✅ Risk assessment

**Process:**
1. Identify expert(s) in relevant area
2. Present story/feature
3. Expert provides estimate with reasoning
4. Team discusses and adjusts if needed
```

**Example:**

```markdown
**Story:** "Migrate database from MongoDB to PostgreSQL"

**Expert (DBA):** "Based on our 50-table schema and data volume:
- Schema migration: 2 weeks
- Data migration scripts: 1 week
- Testing and validation: 1 week
- Rollback planning: 3 days
- Total: 4-5 weeks, high risk"

**Team Discussion:** Break into phased approach, estimate per phase
```

**Caution:**
- ⚠️ Can create single point of failure (expert dependency)
- ⚠️ May miss team's collective wisdom
- ⚠️ Risk of anchoring bias

---

### 10. No Estimates (#NoEstimates)

**Description:** Focus on breaking work into similar-sized small pieces and track throughput instead of estimating.

**Principles:**

```markdown
**Instead of estimating:**
- Break all work into 1-3 day stories
- Track number of stories completed per sprint
- Forecast based on throughput (velocity)

**Example:**
- Average throughput: 12 stories/sprint
- Backlog: 60 stories
- Forecast: 5 sprints (60/12)
```

**When It Works:**

```markdown
✅ Mature teams
✅ Consistent story sizing
✅ Predictable work
✅ Flow-based approach (Kanban)
✅ High trust environment

❌ May not work for:
- Mixed-size stories
- New teams
- Fixed-scope contracts
- Regulatory requirements
```

**Techniques:**

```markdown
**Technique 1: Right-sizing**
- All stories 1-3 days
- No estimation needed
- Count completed stories

**Technique 2: Cycle Time**
- Measure time from start to done
- Average cycle time = estimate
- Use historical data to forecast

**Technique 3: Monte Carlo Simulation**
- Use throughput data
- Run simulations
- Probability-based forecasting
```

---

## Choosing the Right Technique

```markdown
**Planning Poker:**
Use for: Sprint planning, refined backlog items
Time: 5-10 min per story
Accuracy: High for small-medium stories

**T-Shirt Sizing:**
Use for: Initial roadmap, epics, early backlog grooming
Time: 2-3 min per item
Accuracy: Low-medium

**Affinity/Bucket:**
Use for: Large backlog refinement (20+ stories)
Time: 30-60 min for 30-40 stories
Accuracy: Medium

**Three-Point:**
Use for: Risky/uncertain work, project planning
Time: 10-15 min per story
Accuracy: Medium-high with confidence intervals

**Historical Data:**
Use for: Similar recurring work
Time: 5 min per story
Accuracy: High for similar work

**No Estimates:**
Use for: Mature teams, flow-based delivery
Time: Minimal
Accuracy: High for throughput forecasting
```

## Common Estimation Pitfalls

### 1. Anchoring Bias

```markdown
❌ **Problem:** First number mentioned influences all estimates

**Example:**
Manager: "This should take about 2 days, right?"
Team: (anchored to 2 days, even if they think 5)

✅ **Solution:**
- Silent voting (Planning Poker)
- Avoid mentioning time before estimation
- Multiple rounds of estimation
```

### 2. Optimism Bias

```markdown
❌ **Problem:** Underestimating due to optimism

**Example:**
"The API integration will be straightforward" (forgetting auth, rate limits, error handling)

✅ **Solution:**
- Include testing, documentation, debugging time
- Use three-point estimation
- Review historical accuracy
- Add buffer for unknowns
```

### 3. Planning Fallacy

```markdown
❌ **Problem:** Underestimating despite past evidence of overruns

✅ **Solution:**
- Track actual vs. estimated
- Calibrate based on historical data
- Include review of past similar work
```

### 4. Groupthink

```markdown
❌ **Problem:** Team converges too quickly without discussion

✅ **Solution:**
- Silent voting first
- Encourage dissenting opinions
- Discuss outliers thoroughly
- Psychological safety to disagree
```

### 5. Converting Points to Hours

```markdown
❌ **Problem:** "8 points = 8 hours" defeats purpose of relative estimation

✅ **Solution:**
- Keep story points dimensionless
- Use velocity for forecasting, not conversion
- Resist pressure to convert
- Educate stakeholders on relative estimation
```

## Estimation Metrics

### Track Estimation Accuracy

```javascript
const estimationMetrics = {
  // Compare estimated vs. actual
  accuracy: () => {
    const variance = stories.map(s =>
      Math.abs(s.estimated - s.actual) / s.estimated
    );
    return 1 - (variance.reduce((a,b) => a+b) / variance.length);
  },

  // Stories completed vs. committed
  commitmentReliability: (planned, completed) => {
    return (completed / planned) * 100; // Target: >85%
  },

  // Velocity stability
  velocityVariance: (velocities) => {
    const avg = velocities.reduce((a,b) => a+b) / velocities.length;
    const variance = velocities.map(v => Math.pow(v - avg, 2));
    const stdDev = Math.sqrt(variance.reduce((a,b) => a+b) / variance.length);
    return (stdDev / avg) * 100; // Target: <20%
  }
};

// Example usage:
const lastSprints = [23, 25, 22, 24, 26]; // velocity
console.log(estimationMetrics.velocityVariance(lastSprints)); // ~6% - very stable
```

## Related Resources

- [Definition of Ready](definition-of-ready.md)
- [Definition of Done](definition-of-done.md)
- [INVEST Criteria](invest-criteria.md)
- [User Story Mapping](../01-requirements/user-story-mapping.md)
- [Metrics & Monitoring](../09-metrics-monitoring/README.md)

## References

- Mike Cohn - Agile Estimating and Planning
- Scrum Guide - Sprint Planning
- SAFe - Program Increment Planning
- Allen Holub - #NoEstimates Movement
- ISTQB - Test Estimation Techniques

---

*Part of: [Agile Planning](README.md)*
