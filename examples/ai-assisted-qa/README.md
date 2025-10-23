# AI-Assisted Quality Assurance Examples

This directory contains production-ready implementations and examples demonstrating how to leverage AI for various quality assurance tasks.

## 📂 Directory Structure

```
ai-assisted-qa/
├── rag-implementation/          # Complete RAG system for QA knowledge base
│   ├── rag_pipeline.py         # RAG orchestration and retrieval
│   ├── api.py                  # FastAPI REST API
│   ├── Dockerfile              # Container setup
│   ├── docker-compose.yml      # Full stack deployment
│   └── README.md               # Comprehensive documentation
│
├── test-generation/             # AI-powered test generation
│   ├── test_generator.py       # Test generation tool
│   ├── example_outputs/        # Real AI-generated tests
│   │   ├── pytest_tests.py    # 146 lines of comprehensive pytest tests
│   │   └── jest_tests.test.js # 370+ lines of Jest tests
│   └── README.md
│
├── code-review-automation/      # Automated code review
│   ├── ai_code_reviewer.py     # Code review tool
│   ├── .github/                # GitHub Actions integration
│   │   ├── workflows/          # CI/CD workflows
│   │   └── scripts/            # Review automation scripts
│   └── README.md
│
├── predictive-analytics/        # ML models for defect prediction
│   └── (coming soon)
│
├── anomaly-detection/           # Anomaly detection in metrics
│   └── (coming soon)
│
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

```bash
# Python 3.9+
python --version

# OpenAI API key
export OPENAI_API_KEY="sk-your-key-here"
```

### Installation

```bash
# Clone repository
cd examples/ai-assisted-qa

# Install dependencies for all examples
pip install openai==1.3.0 \
            langchain==0.1.0 \
            chromadb==0.4.18 \
            fastapi==0.104.1 \
            uvicorn==0.24.0
```

## 📖 Examples Overview

### 1. RAG Implementation

**What it does:** Creates a question-answering system using Retrieval-Augmented Generation to answer questions about your documentation.

**Use cases:**

- Answer developer questions about testing practices
- Provide instant access to CI/CD documentation
- Onboard new team members quickly
- Create internal knowledge assistant

**Key features:**

- ✅ Document ingestion from markdown files
- ✅ Semantic search with embeddings
- ✅ Conversation memory
- ✅ REST API for integration
- ✅ Source citations
- ✅ Production-ready with Docker

**Quick example:**

```python
from rag_pipeline import RAGPipeline, RAGConfig

config = RAGConfig()
rag = RAGPipeline(config)
rag.load_existing()

result = rag.query("What is test-driven development?")
print(result['answer'])
# "Test-driven development (TDD) is a software development approach where..."
```

**Cost:** ~$0.024 per query (GPT-4) or ~$0.002 per query (GPT-3.5)

**[Full Documentation →](rag-implementation/README.md)**

---

### 2. Test Generation

**What it does:** Automatically generates comprehensive test suites using AI.

**Use cases:**

- Generate unit tests for new functions
- Create integration tests for APIs
- Generate E2E test scenarios from user stories
- Fill coverage gaps in existing test suites
- Generate realistic test data

**Key features:**

- ✅ Multiple framework support (pytest, Jest, JUnit, Playwright)
- ✅ Comprehensive coverage (happy path, edge cases, errors)
- ✅ Parameterized tests
- ✅ Test fixtures
- ✅ Descriptive test names
- ✅ Production-quality output

**Quick example:**

```python
from test_generator import AITestGenerator, TestFramework

generator = AITestGenerator()
tests = generator.generate_unit_tests(
    code=my_function_code,
    language="Python",
    framework=TestFramework.PYTEST
)

# Result: 146 lines of comprehensive tests with 100% coverage
```

**Cost:** ~$0.053 per test suite generation

**ROI:** Saves 30-60 minutes per test suite (~$50-100 value)

**[Full Documentation →](test-generation/README.md)**

**[View Example Output →](test-generation/example_outputs/pytest_tests.py)**

---

### 3. Code Review Automation

**What it does:** Automatically reviews code for bugs, security vulnerabilities, performance issues, and best practices.

**Use cases:**

- Automated PR reviews
- Security vulnerability scanning
- Performance optimization suggestions
- Enforce coding standards
- Catch bugs before human review

**Key features:**

- ✅ GitHub Actions integration
- ✅ Multi-category analysis (bugs, security, performance, style)
- ✅ Severity levels (critical, high, medium, low)
- ✅ Actionable suggestions with code examples
- ✅ PR comments and status checks
- ✅ Customizable focus areas

**Quick example:**

```python
from ai_code_reviewer import AICodeReviewer

reviewer = AICodeReviewer()
result = reviewer.review_code(
    code=code,
    language="Python"
)

print(f"Score: {result.overall_score}/100")
print(f"Issues: {len(result.comments)}")
```

**Cost:** ~$0.075 per PR review

**ROI:** Saves 15-30 minutes per PR (~$25-50 value)

**[Full Documentation →](code-review-automation/README.md)**

---

### 4. Predictive Analytics _(Coming Soon)_

**What it does:** Uses machine learning to predict defects and optimize testing strategies.

**Planned features:**

- Defect prediction from code changes
- Test failure prediction
- Optimal test selection
- Release risk assessment
- DORA metrics forecasting

---

### 5. Anomaly Detection _(Coming Soon)_

**What it does:** Detects unusual patterns in application metrics and test results.

**Planned features:**

- Anomaly detection in performance metrics
- Unusual test failure patterns
- Build time anomalies
- Resource usage spikes
- Alert prioritization

## 💰 Cost Comparison

### Monthly Costs (50 team members, 200 PRs/month)

| Tool                | Use Case            | Monthly Cost        | Time Saved        | ROI         |
| ------------------- | ------------------- | ------------------- | ----------------- | ----------- |
| **RAG System**      | Q&A Assistant       | $48 (2,000 queries) | 100 hrs           | $9,952      |
| **Test Generation** | Auto-generate tests | $10.60 (200 suites) | 100 hrs           | $9,989      |
| **Code Review**     | Automated PR review | $15 (200 PRs)       | 60 hrs            | $5,985      |
| **Total**           | All tools           | **$73.60/month**    | **260 hrs/month** | **$25,926** |

_Assumes $100/hr developer rate_

### Cost Reduction Strategies

1. **Use GPT-3.5-turbo**: 10x cheaper, ~90% quality
2. **Use local LLMs**: Free (Ollama/Llama), ~70% quality
3. **Hybrid approach**: GPT-4 for critical, GPT-3.5 for routine
4. **Caching**: Cache common queries/patterns

## 🎯 Use Case Scenarios

### Scenario 1: Onboarding New Team Member

**Problem:** New developer needs to understand testing practices

**Solution:** RAG Implementation

```python
# New team member asks questions
questions = [
    "How do we write unit tests?",
    "What is our CI/CD process?",
    "How do I run integration tests locally?",
    "What are DORA metrics?"
]

for q in questions:
    result = rag.query(q)
    print(f"Q: {q}\nA: {result['answer']}\n")

# Cost: 4 queries × $0.024 = $0.096
# Time saved: 2-3 hours of senior developer time = $200-300
```

---

### Scenario 2: Adding New Feature

**Problem:** Developer writes new function, needs comprehensive tests

**Solution:** Test Generation

```python
# Developer writes function
code = """
def calculate_shipping_cost(weight, distance, is_express=False):
    # Complex shipping calculation logic
    ...
"""

# AI generates comprehensive tests
generator = AITestGenerator()
tests = generator.generate_unit_tests(code, "Python", TestFramework.PYTEST)

# Result: 50+ test cases covering all scenarios
# Cost: $0.053
# Time saved: 45 minutes = $75
```

---

### Scenario 3: Pull Request Review

**Problem:** PR submitted with 5 changed files, manual review takes 30 minutes

**Solution:** Code Review Automation

```yaml
# GitHub Action runs automatically
- Reviews all changed files
- Detects 2 security issues
- Finds 1 performance problem
- Posts detailed review comment
# Cost: $0.075
# Time saved: 20 minutes = $33
# Plus: Catches issues human might miss
```

## 🔧 Integration Patterns

### Pattern 1: Full Automation

```yaml
# GitHub Actions
on: pull_request

jobs:
  ai-quality-check:
    steps:
      - Generate tests for new code
      - Run AI code review
      - Run security scan
      - Post comprehensive report
```

**Pros:** Fully automated, fast feedback
**Cons:** Requires careful threshold tuning

---

### Pattern 2: AI-Assisted Manual Review

```yaml
# AI provides suggestions, human decides
on: pull_request

jobs:
  ai-suggestions:
    steps:
      - Generate suggested tests
      - Provide review comments
      - Flag potential issues
      # Human reviewer approves/rejects
```

**Pros:** Human oversight, better accuracy
**Cons:** Slower, requires human time

---

### Pattern 3: Hybrid Approach

```yaml
# AI for routine, human for critical
on: pull_request

jobs:
  auto-approve:
    if: score >= 90 && no_critical_issues
    steps:
      - Auto-approve

  request-review:
    if: score < 90 || critical_issues
    steps:
      - Request human review
```

**Pros:** Best of both worlds
**Cons:** More complex setup

## 📊 Metrics & Monitoring

### Track These Metrics

```yaml
AI Tool Effectiveness:
  - AI review accuracy (true positives / total flags)
  - False positive rate
  - Issues caught by AI vs human
  - Time saved per PR
  - Developer satisfaction

Test Quality:
  - Coverage increase from AI tests
  - AI test failure rate
  - Test maintenance burden
  - Mutation test score

ROI Metrics:
  - Monthly cost
  - Hours saved
  - Defects prevented
  - Developer productivity increase
```

### Example Dashboard

```
AI QA Metrics - October 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cost:               $73.60
Time Saved:         260 hours
ROI:                +$25,926

Code Reviews:       200 PRs
  - Critical Found: 15 issues
  - Avg Score:      82/100
  - Accuracy:       87%

Test Generation:    200 suites
  - Coverage:       +18%
  - Tests Created:  8,420 tests
  - Failures:       2.1%

RAG Queries:        2,000
  - Avg Response:   2.3s
  - Satisfaction:   4.7/5
  - Deflection:     73%
```

## 🔐 Security & Privacy

### Best Practices

1. **Don't send sensitive data to external APIs**

   ```python
   # ❌ Bad
   code_with_api_keys = "API_KEY = 'sk-secret-123'"
   reviewer.review_code(code_with_api_keys)

   # ✅ Good
   sanitized = sanitize_secrets(code)
   reviewer.review_code(sanitized)
   ```

2. **Use local models for sensitive code**

   ```python
   # Use Ollama for proprietary code
   local_llm = Ollama(model="codellama")
   result = local_llm.review(sensitive_code)
   ```

3. **Audit AI suggestions**
   - Never auto-merge AI-reviewed PRs
   - Log all AI interactions
   - Review AI suggestions before applying

4. **Data retention**
   - OpenAI retains data for 30 days (as of Oct 2024)
   - Consider Azure OpenAI for enterprise (no data retention)
   - Or use on-premise LLMs

## 🚦 Getting Started Roadmap

### Week 1: Experimentation

1. Try RAG implementation locally
2. Generate tests for 5 functions
3. Review 3 PRs with AI
4. Evaluate quality and usefulness

### Week 2: Pilot

1. Deploy RAG API for team access
2. Add test generation to pre-commit hook
3. Enable AI code review for 1 repository
4. Gather team feedback

### Week 3-4: Rollout

1. Expand to all repositories
2. Integrate with CI/CD pipeline
3. Set up monitoring dashboard
4. Train team on best practices

### Month 2+: Optimization

1. Tune prompts based on feedback
2. Adjust thresholds and focus areas
3. Add custom rules and patterns
4. Measure and report ROI

## 📚 Related Documentation

- **[AI Fundamentals](../../docs/15-ai-in-quality-assurance/ai-fundamentals.md)** - Understanding LLMs and RAG
- **[AI-Assisted Testing](../../docs/15-ai-in-quality-assurance/ai-assisted-testing.md)** - Comprehensive guide
- **[Building AI QA Assistant](../../docs/15-ai-in-quality-assurance/building-ai-qa-assistant.md)** - Detailed implementation
- **[AI Metrics & Analytics](../../docs/15-ai-in-quality-assurance/ai-metrics-analytics.md)** - Predictive analytics
- **[Test Generation Prompts](../../templates/ai-test-generation-prompts.md)** - Proven templates
- **[AI Tool Evaluation](../../templates/ai-tool-evaluation.md)** - Evaluation framework

## 🤝 Contributing

Found a bug or want to improve the examples? Contributions welcome!

## 📄 License

MIT License - See LICENSE file for details

---

**Need help?** Open an issue or check the documentation in each subdirectory.
