# Ethics & Safety in Agentic Workflows

## Purpose

Provide comprehensive guidance on building safe, ethical, and responsible autonomous AI agent systems with proper guardrails, oversight mechanisms, and compliance frameworks for production QA environments.

## Context

Autonomous agents represent unprecedented automation capability - and unprecedented risk. Unlike traditional automation that follows predefined rules, agents make independent decisions using opaque reasoning processes. This requires robust safety frameworks, human oversight mechanisms, and continuous monitoring to prevent catastrophic failures, ensure ethical operation, and maintain regulatory compliance.

**Critical Understanding**: This is not optional - it is a prerequisite for production deployment of any autonomous agent system.

---

## Table of Contents

1. [Agent Safety Patterns](#1-agent-safety-patterns)
2. [Human Oversight Mechanisms](#2-human-oversight-mechanisms)
3. [Failure Modes & Mitigation](#3-failure-modes--mitigation)
4. [Cost Control & Budget Management](#4-cost-control--budget-management)
5. [Bias Detection & Mitigation](#5-bias-detection--mitigation)
6. [Compliance & Audit Trails](#6-compliance--audit-trails)
7. [Responsible Autonomy Levels](#7-responsible-autonomy-levels)
8. [Production Safety Checklist](#8-production-safety-checklist)

---

## 1. Agent Safety Patterns

### 1.1 Core Safety Principles

```yaml
safety_principles:
  containment:
    principle: 'Agents operate within strictly bounded environments'
    implementation: 'Sandbox execution, limited tool access, restricted permissions'

  reversibility:
    principle: 'All agent actions can be undone or rolled back'
    implementation: 'Transaction logs, snapshots, rollback mechanisms'

  transparency:
    principle: 'Agent reasoning and actions are observable and auditable'
    implementation: 'Detailed logging, reasoning traces, decision explanations'

  human_oversight:
    principle: 'Critical decisions require human approval'
    implementation: 'Approval gates, escalation triggers, human-in-the-loop'

  fail_safe:
    principle: 'System fails to safe state, not dangerous state'
    implementation: 'Circuit breakers, automatic shutdown, conservative defaults'
```

### 1.2 Guardrail Architecture

```python
"""
Production-ready guardrail system for autonomous agents.
Implements multiple layers of safety controls.
"""

from typing import Any, Dict, List, Optional, Callable
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """Risk classification for agent actions"""
    SAFE = "safe"           # No approval needed
    LOW = "low"             # Automatic with logging
    MEDIUM = "medium"       # Require confirmation
    HIGH = "high"           # Require approval + justification
    CRITICAL = "critical"   # Require multi-party approval


class ActionCategory(Enum):
    """Categories of agent actions"""
    READ = "read"                    # Read data/files
    WRITE = "write"                  # Modify data/files
    EXECUTE = "execute"              # Run commands
    DEPLOY = "deploy"                # Production deployment
    DELETE = "delete"                # Destructive operations
    EXTERNAL_API = "external_api"    # External service calls
    DATABASE = "database"            # Database operations


@dataclass
class GuardrailViolation:
    """Record of a guardrail violation"""
    timestamp: datetime
    agent_id: str
    action: str
    violation_type: str
    severity: RiskLevel
    details: Dict[str, Any]
    blocked: bool
    reason: str


@dataclass
class ActionPolicy:
    """Policy defining constraints for an action"""
    category: ActionCategory
    risk_level: RiskLevel
    requires_approval: bool
    allowed_resources: Optional[List[str]] = None
    forbidden_patterns: Optional[List[str]] = None
    max_cost_cents: Optional[int] = None
    max_duration_seconds: Optional[int] = None
    rate_limit_per_hour: Optional[int] = None


class GuardrailSystem:
    """
    Multi-layered guardrail system for autonomous agents.

    Features:
    - Action classification and risk assessment
    - Resource access control
    - Cost and rate limiting
    - Pattern-based blocking
    - Audit trail
    """

    def __init__(self):
        self.policies: Dict[str, ActionPolicy] = {}
        self.violations: List[GuardrailViolation] = []
        self.action_counts: Dict[str, int] = {}
        self.total_cost_cents: int = 0

        # Initialize default policies
        self._initialize_default_policies()

    def _initialize_default_policies(self):
        """Set up conservative default policies"""

        # Read operations - generally safe
        self.policies["read_file"] = ActionPolicy(
            category=ActionCategory.READ,
            risk_level=RiskLevel.SAFE,
            requires_approval=False,
            forbidden_patterns=[
                r"\.env$",           # No reading credentials
                r"id_rsa$",          # No reading SSH keys
                r"\.pem$",           # No reading certificates
                r"password",         # No password files
                r"secret",           # No secret files
            ]
        )

        # Write operations - require validation
        self.policies["write_file"] = ActionPolicy(
            category=ActionCategory.WRITE,
            risk_level=RiskLevel.MEDIUM,
            requires_approval=True,
            forbidden_patterns=[
                r"^/etc/",           # No system file modification
                r"^/root/",          # No root directory access
                r"\.git/config$",    # No Git config changes
            ],
            rate_limit_per_hour=100
        )

        # Execute operations - high risk
        self.policies["run_command"] = ActionPolicy(
            category=ActionCategory.EXECUTE,
            risk_level=RiskLevel.HIGH,
            requires_approval=True,
            forbidden_patterns=[
                r"rm\s+-rf\s+/",     # No recursive root deletion
                r"dd\s+if=",         # No disk operations
                r"mkfs",             # No filesystem formatting
                r"shutdown",         # No system shutdown
                r"reboot",           # No system reboot
                r"killall",          # No mass process killing
            ],
            rate_limit_per_hour=50
        )

        # Database operations - medium to high risk
        self.policies["database_query"] = ActionPolicy(
            category=ActionCategory.DATABASE,
            risk_level=RiskLevel.MEDIUM,
            requires_approval=False,
            rate_limit_per_hour=1000
        )

        self.policies["database_mutation"] = ActionPolicy(
            category=ActionCategory.DATABASE,
            risk_level=RiskLevel.HIGH,
            requires_approval=True,
            forbidden_patterns=[
                r"DROP\s+DATABASE",  # No database deletion
                r"DROP\s+TABLE",     # No table deletion
                r"TRUNCATE",         # No table truncation
                r"DELETE\s+FROM.*WHERE\s+1=1",  # No unfiltered deletes
            ],
            rate_limit_per_hour=100
        )

        # Deployment operations - critical risk
        self.policies["deploy_to_production"] = ActionPolicy(
            category=ActionCategory.DEPLOY,
            risk_level=RiskLevel.CRITICAL,
            requires_approval=True,
            rate_limit_per_hour=10
        )

        # Delete operations - high to critical risk
        self.policies["delete_resource"] = ActionPolicy(
            category=ActionCategory.DELETE,
            risk_level=RiskLevel.CRITICAL,
            requires_approval=True,
            rate_limit_per_hour=20
        )

        # External API calls - medium risk (cost concerns)
        self.policies["external_api_call"] = ActionPolicy(
            category=ActionCategory.EXTERNAL_API,
            risk_level=RiskLevel.MEDIUM,
            requires_approval=False,
            max_cost_cents=100,  # $1.00 max per call
            rate_limit_per_hour=500
        )

    def validate_action(
        self,
        agent_id: str,
        action_name: str,
        action_params: Dict[str, Any],
        estimated_cost_cents: int = 0
    ) -> tuple[bool, Optional[str]]:
        """
        Validate whether an agent action is allowed.

        Returns:
            (allowed, reason) - True if allowed, False with reason if blocked
        """

        # Get policy for this action
        policy = self.policies.get(action_name)
        if not policy:
            # Unknown action - block by default
            violation = GuardrailViolation(
                timestamp=datetime.now(),
                agent_id=agent_id,
                action=action_name,
                violation_type="unknown_action",
                severity=RiskLevel.HIGH,
                details=action_params,
                blocked=True,
                reason="Action not in approved policy list"
            )
            self.violations.append(violation)
            return False, "Unknown action type - blocked for safety"

        # Check rate limiting
        rate_key = f"{agent_id}:{action_name}:{datetime.now().hour}"
        current_count = self.action_counts.get(rate_key, 0)

        if policy.rate_limit_per_hour and current_count >= policy.rate_limit_per_hour:
            violation = GuardrailViolation(
                timestamp=datetime.now(),
                agent_id=agent_id,
                action=action_name,
                violation_type="rate_limit_exceeded",
                severity=RiskLevel.HIGH,
                details={
                    "current_count": current_count,
                    "limit": policy.rate_limit_per_hour
                },
                blocked=True,
                reason=f"Rate limit exceeded: {current_count}/{policy.rate_limit_per_hour} per hour"
            )
            self.violations.append(violation)
            return False, f"Rate limit exceeded for {action_name}"

        # Check cost limits
        if policy.max_cost_cents and estimated_cost_cents > policy.max_cost_cents:
            violation = GuardrailViolation(
                timestamp=datetime.now(),
                agent_id=agent_id,
                action=action_name,
                violation_type="cost_limit_exceeded",
                severity=RiskLevel.HIGH,
                details={
                    "estimated_cost_cents": estimated_cost_cents,
                    "max_cost_cents": policy.max_cost_cents
                },
                blocked=True,
                reason=f"Cost limit exceeded: ${estimated_cost_cents/100:.2f} > ${policy.max_cost_cents/100:.2f}"
            )
            self.violations.append(violation)
            return False, f"Cost limit exceeded for {action_name}"

        # Check forbidden patterns
        if policy.forbidden_patterns:
            for param_name, param_value in action_params.items():
                if isinstance(param_value, str):
                    for pattern in policy.forbidden_patterns:
                        import re
                        if re.search(pattern, param_value, re.IGNORECASE):
                            violation = GuardrailViolation(
                                timestamp=datetime.now(),
                                agent_id=agent_id,
                                action=action_name,
                                violation_type="forbidden_pattern",
                                severity=RiskLevel.CRITICAL,
                                details={
                                    "parameter": param_name,
                                    "value": param_value,
                                    "pattern": pattern
                                },
                                blocked=True,
                                reason=f"Forbidden pattern detected: {pattern}"
                            )
                            self.violations.append(violation)
                            return False, f"Forbidden pattern detected in {param_name}"

        # Check resource restrictions
        if policy.allowed_resources:
            # For file operations, check path restrictions
            if "path" in action_params or "file_path" in action_params:
                path = action_params.get("path") or action_params.get("file_path")
                if not any(path.startswith(allowed) for allowed in policy.allowed_resources):
                    violation = GuardrailViolation(
                        timestamp=datetime.now(),
                        agent_id=agent_id,
                        action=action_name,
                        violation_type="resource_access_denied",
                        severity=RiskLevel.HIGH,
                        details={
                            "requested_path": path,
                            "allowed_resources": policy.allowed_resources
                        },
                        blocked=True,
                        reason=f"Path not in allowed resources: {path}"
                    )
                    self.violations.append(violation)
                    return False, f"Access denied to resource: {path}"

        # Increment action count
        self.action_counts[rate_key] = current_count + 1

        # Track cost
        self.total_cost_cents += estimated_cost_cents

        # Log successful validation
        logger.info(f"Action validated: {agent_id} -> {action_name} (risk: {policy.risk_level.value})")

        return True, None

    def requires_approval(self, action_name: str) -> bool:
        """Check if action requires human approval"""
        policy = self.policies.get(action_name)
        return policy.requires_approval if policy else True  # Require approval by default

    def get_risk_level(self, action_name: str) -> RiskLevel:
        """Get risk level for an action"""
        policy = self.policies.get(action_name)
        return policy.risk_level if policy else RiskLevel.CRITICAL  # Assume critical by default

    def get_violations(
        self,
        agent_id: Optional[str] = None,
        severity: Optional[RiskLevel] = None,
        since: Optional[datetime] = None
    ) -> List[GuardrailViolation]:
        """Retrieve violations with optional filtering"""
        violations = self.violations

        if agent_id:
            violations = [v for v in violations if v.agent_id == agent_id]

        if severity:
            violations = [v for v in violations if v.severity == severity]

        if since:
            violations = [v for v in violations if v.timestamp >= since]

        return violations

    def get_total_cost_dollars(self) -> float:
        """Get total cost of all agent actions"""
        return self.total_cost_cents / 100


# Example usage
if __name__ == "__main__":
    guardrails = GuardrailSystem()

    # Test 1: Safe read operation
    allowed, reason = guardrails.validate_action(
        agent_id="test_agent_1",
        action_name="read_file",
        action_params={"path": "/app/data/test.txt"}
    )
    print(f"Read file: {allowed}, reason: {reason}")  # True

    # Test 2: Forbidden pattern detection
    allowed, reason = guardrails.validate_action(
        agent_id="test_agent_1",
        action_name="read_file",
        action_params={"path": "/app/.env"}  # Contains .env
    )
    print(f"Read .env: {allowed}, reason: {reason}")  # False - forbidden pattern

    # Test 3: Dangerous command blocking
    allowed, reason = guardrails.validate_action(
        agent_id="test_agent_1",
        action_name="run_command",
        action_params={"command": "rm -rf /"}
    )
    print(f"Dangerous command: {allowed}, reason: {reason}")  # False - forbidden pattern

    # Test 4: Cost limit enforcement
    allowed, reason = guardrails.validate_action(
        agent_id="test_agent_1",
        action_name="external_api_call",
        action_params={"endpoint": "https://api.example.com/expensive"},
        estimated_cost_cents=200  # $2.00 - exceeds $1.00 limit
    )
    print(f"Expensive API call: {allowed}, reason: {reason}")  # False - cost limit

    # Test 5: Rate limiting
    for i in range(52):  # Exceed 50/hour limit
        guardrails.validate_action(
            agent_id="test_agent_1",
            action_name="run_command",
            action_params={"command": "echo test"}
        )

    allowed, reason = guardrails.validate_action(
        agent_id="test_agent_1",
        action_name="run_command",
        action_params={"command": "echo test"}
    )
    print(f"Rate limited: {allowed}, reason: {reason}")  # False - rate limit exceeded

    # Check violations
    print(f"\nTotal violations: {len(guardrails.get_violations())}")
    print(f"Critical violations: {len(guardrails.get_violations(severity=RiskLevel.CRITICAL))}")
    print(f"Total cost: ${guardrails.get_total_cost_dollars():.2f}")
```

### 1.3 Sandboxing & Isolation

```python
"""
Sandbox execution environment for agent actions.
Provides isolated, controlled environment for running agent code.
"""

import docker
import tempfile
import os
from pathlib import Path
from typing import Dict, Any, Optional
import json


class AgentSandbox:
    """
    Isolated execution environment for agent actions.

    Features:
    - Docker container isolation
    - Resource limits (CPU, memory, time)
    - Network restrictions
    - Filesystem limitations
    - Automatic cleanup
    """

    def __init__(
        self,
        image: str = "python:3.11-slim",
        cpu_limit: float = 1.0,  # CPU cores
        memory_limit: str = "512m",
        timeout_seconds: int = 300,  # 5 minutes
        network_mode: str = "none"  # No network by default
    ):
        self.image = image
        self.cpu_limit = cpu_limit
        self.memory_limit = memory_limit
        self.timeout_seconds = timeout_seconds
        self.network_mode = network_mode
        self.client = docker.from_env()

    def execute_code(
        self,
        code: str,
        language: str = "python",
        allowed_files: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Execute code in isolated sandbox.

        Args:
            code: Code to execute
            language: Programming language
            allowed_files: Dict of filename -> content for files agent can access

        Returns:
            {
                "success": bool,
                "output": str,
                "error": Optional[str],
                "exit_code": int,
                "execution_time": float
            }
        """

        # Create temporary directory for execution
        with tempfile.TemporaryDirectory() as tmpdir:
            # Write code to file
            code_file = Path(tmpdir) / "agent_code.py"
            code_file.write_text(code)

            # Write allowed files
            if allowed_files:
                for filename, content in allowed_files.items():
                    file_path = Path(tmpdir) / filename
                    file_path.parent.mkdir(parents=True, exist_ok=True)
                    file_path.write_text(content)

            # Run in Docker container
            try:
                container = self.client.containers.run(
                    image=self.image,
                    command=["python", "/workspace/agent_code.py"],
                    volumes={tmpdir: {"bind": "/workspace", "mode": "rw"}},
                    working_dir="/workspace",
                    cpu_period=100000,
                    cpu_quota=int(self.cpu_limit * 100000),
                    mem_limit=self.memory_limit,
                    network_mode=self.network_mode,
                    detach=True,
                    remove=True,
                    read_only=True,  # Read-only filesystem
                    tmpfs={"/tmp": "size=100M"},  # Small tmp space
                )

                # Wait for completion with timeout
                result = container.wait(timeout=self.timeout_seconds)

                # Get output
                output = container.logs().decode("utf-8")

                return {
                    "success": result["StatusCode"] == 0,
                    "output": output,
                    "error": None if result["StatusCode"] == 0 else output,
                    "exit_code": result["StatusCode"],
                    "execution_time": None  # Would need metrics collection
                }

            except docker.errors.ContainerError as e:
                return {
                    "success": False,
                    "output": "",
                    "error": f"Container error: {str(e)}",
                    "exit_code": e.exit_status,
                    "execution_time": None
                }

            except Exception as e:
                return {
                    "success": False,
                    "output": "",
                    "error": f"Execution error: {str(e)}",
                    "exit_code": -1,
                    "execution_time": None
                }

    def execute_command(
        self,
        command: str,
        working_dir: str = "/workspace"
    ) -> Dict[str, Any]:
        """Execute shell command in sandbox"""

        try:
            container = self.client.containers.run(
                image=self.image,
                command=["sh", "-c", command],
                working_dir=working_dir,
                cpu_period=100000,
                cpu_quota=int(self.cpu_limit * 100000),
                mem_limit=self.memory_limit,
                network_mode=self.network_mode,
                detach=True,
                remove=True,
            )

            result = container.wait(timeout=self.timeout_seconds)
            output = container.logs().decode("utf-8")

            return {
                "success": result["StatusCode"] == 0,
                "output": output,
                "error": None if result["StatusCode"] == 0 else output,
                "exit_code": result["StatusCode"]
            }

        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "exit_code": -1
            }


# Example usage
if __name__ == "__main__":
    sandbox = AgentSandbox()

    # Safe code execution
    result = sandbox.execute_code("""
import sys
print("Hello from sandbox!")
print(f"Python version: {sys.version}")
    """)
    print("Safe execution:", result["success"])
    print("Output:", result["output"])

    # Blocked network access
    result = sandbox.execute_code("""
import urllib.request
urllib.request.urlopen('https://example.com')  # Will fail - no network
    """)
    print("\nNetwork access:", result["success"])  # False
    print("Error:", result["error"])

    # Resource limits enforced
    result = sandbox.execute_code("""
# Attempt to use excessive memory
data = [0] * (10**9)  # Will be killed by memory limit
    """)
    print("\nMemory limit:", result["success"])  # False
```

### 1.4 Circuit Breaker Pattern

```python
"""
Circuit breaker implementation for agent systems.
Prevents cascading failures and runaway agents.
"""

from enum import Enum
from datetime import datetime, timedelta
from typing import Callable, Any, Optional
import logging

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Blocking calls
    HALF_OPEN = "half_open"  # Testing recovery


class CircuitBreaker:
    """
    Circuit breaker for agent operations.

    Prevents cascading failures by:
    - Tracking failure rates
    - Opening circuit after threshold
    - Attempting recovery after timeout
    - Limiting concurrent operations
    """

    def __init__(
        self,
        failure_threshold: int = 5,  # Failures before opening
        timeout_seconds: int = 60,   # Time before attempting recovery
        expected_exception: type = Exception,
        name: str = "agent_circuit"
    ):
        self.failure_threshold = failure_threshold
        self.timeout_seconds = timeout_seconds
        self.expected_exception = expected_exception
        self.name = name

        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitState.CLOSED
        self.success_count = 0

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function through circuit breaker.

        Raises:
            CircuitBreakerOpenError: If circuit is open
            Original exception: If call fails
        """

        if self.state == CircuitState.OPEN:
            # Check if timeout has passed
            if self._should_attempt_reset():
                logger.info(f"Circuit {self.name}: Attempting reset (half-open)")
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerOpenError(
                    f"Circuit {self.name} is OPEN - blocking call"
                )

        try:
            # Execute the function
            result = func(*args, **kwargs)

            # Success - reset failure count
            self._on_success()

            return result

        except self.expected_exception as e:
            # Failure - increment count and potentially open circuit
            self._on_failure()
            raise e

    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0

        if self.state == CircuitState.HALF_OPEN:
            logger.info(f"Circuit {self.name}: Recovery successful, closing circuit")
            self.state = CircuitState.CLOSED

    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        logger.warning(
            f"Circuit {self.name}: Failure {self.failure_count}/{self.failure_threshold}"
        )

        if self.failure_count >= self.failure_threshold:
            logger.error(f"Circuit {self.name}: OPENING circuit - too many failures")
            self.state = CircuitState.OPEN

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if not self.last_failure_time:
            return True

        time_passed = datetime.now() - self.last_failure_time
        return time_passed >= timedelta(seconds=self.timeout_seconds)

    def reset(self):
        """Manually reset circuit breaker"""
        logger.info(f"Circuit {self.name}: Manual reset")
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = None

    def get_state(self) -> Dict[str, Any]:
        """Get current circuit breaker state"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time else None
        }


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open"""
    pass


# Example usage with agent
class LLMCircuitBreaker(CircuitBreaker):
    """Circuit breaker specifically for LLM API calls"""

    def __init__(self):
        super().__init__(
            failure_threshold=3,
            timeout_seconds=30,
            expected_exception=Exception,
            name="llm_api"
        )


if __name__ == "__main__":
    import random

    breaker = CircuitBreaker(failure_threshold=3, timeout_seconds=5)

    def unreliable_llm_call():
        """Simulates flaky LLM API"""
        if random.random() < 0.7:  # 70% failure rate
            raise Exception("LLM API timeout")
        return "Success"

    # Attempt calls
    for i in range(10):
        try:
            result = breaker.call(unreliable_llm_call)
            print(f"Call {i+1}: {result}")
        except CircuitBreakerOpenError as e:
            print(f"Call {i+1}: Circuit is OPEN - {e}")
        except Exception as e:
            print(f"Call {i+1}: Failed - {e}")

        print(f"  State: {breaker.get_state()}")
```

---

## 2. Human Oversight Mechanisms

### 2.1 Approval Workflow System

```python
"""
Human approval workflow for high-risk agent actions.
Implements approval gates, escalation, and audit trails.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Callable
from enum import Enum
import asyncio
import logging

logger = logging.getLogger(__name__)


class ApprovalStatus(Enum):
    """Status of approval request"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"
    ESCALATED = "escalated"


class ApprovalUrgency(Enum):
    """Urgency level for approval requests"""
    LOW = "low"          # 24 hour timeout
    NORMAL = "normal"    # 4 hour timeout
    HIGH = "high"        # 1 hour timeout
    CRITICAL = "critical"  # 15 minute timeout


@dataclass
class ApprovalRequest:
    """Request for human approval of agent action"""
    request_id: str
    agent_id: str
    action_name: str
    action_params: Dict[str, Any]
    risk_level: str
    urgency: ApprovalUrgency
    justification: str
    created_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    status: ApprovalStatus = ApprovalStatus.PENDING
    approver_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    escalation_count: int = 0

    def __post_init__(self):
        """Set expiration based on urgency"""
        if not self.expires_at:
            timeout_hours = {
                ApprovalUrgency.LOW: 24,
                ApprovalUrgency.NORMAL: 4,
                ApprovalUrgency.HIGH: 1,
                ApprovalUrgency.CRITICAL: 0.25  # 15 minutes
            }
            hours = timeout_hours[self.urgency]
            self.expires_at = self.created_at + timedelta(hours=hours)

    def is_expired(self) -> bool:
        """Check if approval request has expired"""
        return datetime.now() > self.expires_at

    def time_remaining(self) -> timedelta:
        """Get time remaining before expiration"""
        return self.expires_at - datetime.now()


class ApprovalWorkflow:
    """
    Manages human approval workflows for agent actions.

    Features:
    - Approval routing based on risk level
    - Automatic escalation
    - Timeout handling
    - Audit trail
    - Notification system integration
    """

    def __init__(
        self,
        notification_callback: Optional[Callable] = None,
        escalation_callback: Optional[Callable] = None
    ):
        self.pending_requests: Dict[str, ApprovalRequest] = {}
        self.completed_requests: List[ApprovalRequest] = []
        self.notification_callback = notification_callback
        self.escalation_callback = escalation_callback

        # Approval routing rules
        self.approval_routes = {
            "LOW": ["team_lead"],
            "MEDIUM": ["team_lead", "engineering_manager"],
            "HIGH": ["engineering_manager", "director"],
            "CRITICAL": ["director", "vp_engineering"]
        }

    async def request_approval(
        self,
        agent_id: str,
        action_name: str,
        action_params: Dict[str, Any],
        risk_level: str,
        urgency: ApprovalUrgency,
        justification: str
    ) -> ApprovalRequest:
        """
        Create approval request and notify approvers.

        Returns:
            ApprovalRequest object that can be awaited
        """

        import uuid
        request_id = str(uuid.uuid4())

        request = ApprovalRequest(
            request_id=request_id,
            agent_id=agent_id,
            action_name=action_name,
            action_params=action_params,
            risk_level=risk_level,
            urgency=urgency,
            justification=justification
        )

        self.pending_requests[request_id] = request

        # Send notifications to approvers
        approvers = self.approval_routes.get(risk_level, ["team_lead"])
        if self.notification_callback:
            await self.notification_callback(request, approvers)

        logger.info(
            f"Approval requested: {request_id} - {action_name} "
            f"(risk: {risk_level}, urgency: {urgency.value})"
        )

        return request

    async def wait_for_approval(
        self,
        request: ApprovalRequest,
        poll_interval_seconds: int = 5
    ) -> bool:
        """
        Wait for approval request to be resolved.

        Returns:
            True if approved, False if rejected/expired
        """

        while request.status == ApprovalStatus.PENDING:
            # Check expiration
            if request.is_expired():
                await self._handle_expiration(request)
                return False

            # Check for escalation (if 50% of time has passed)
            time_passed = datetime.now() - request.created_at
            total_time = request.expires_at - request.created_at

            if time_passed > total_time * 0.5 and request.escalation_count == 0:
                await self._escalate(request)

            # Wait before checking again
            await asyncio.sleep(poll_interval_seconds)

        return request.status == ApprovalStatus.APPROVED

    def approve(
        self,
        request_id: str,
        approver_id: str,
        comment: Optional[str] = None
    ) -> bool:
        """
        Approve a pending request.

        Returns:
            True if approval successful, False if request not found/not pending
        """

        request = self.pending_requests.get(request_id)
        if not request or request.status != ApprovalStatus.PENDING:
            return False

        request.status = ApprovalStatus.APPROVED
        request.approver_id = approver_id
        request.approved_at = datetime.now()

        # Move to completed
        self.completed_requests.append(request)
        del self.pending_requests[request_id]

        logger.info(
            f"Approval granted: {request_id} by {approver_id} - "
            f"{request.action_name}"
        )

        return True

    def reject(
        self,
        request_id: str,
        approver_id: str,
        reason: str
    ) -> bool:
        """
        Reject a pending request.

        Returns:
            True if rejection successful, False if request not found/not pending
        """

        request = self.pending_requests.get(request_id)
        if not request or request.status != ApprovalStatus.PENDING:
            return False

        request.status = ApprovalStatus.REJECTED
        request.approver_id = approver_id
        request.rejection_reason = reason

        # Move to completed
        self.completed_requests.append(request)
        del self.pending_requests[request_id]

        logger.warning(
            f"Approval rejected: {request_id} by {approver_id} - "
            f"{request.action_name} - Reason: {reason}"
        )

        return True

    async def _escalate(self, request: ApprovalRequest):
        """Escalate approval request to higher authority"""

        request.escalation_count += 1
        request.status = ApprovalStatus.ESCALATED

        logger.warning(
            f"Escalating approval request: {request.request_id} - "
            f"{request.action_name} (escalation #{request.escalation_count})"
        )

        if self.escalation_callback:
            await self.escalation_callback(request)

        # Reset to pending after escalation
        request.status = ApprovalStatus.PENDING

    async def _handle_expiration(self, request: ApprovalRequest):
        """Handle expired approval request"""

        request.status = ApprovalStatus.EXPIRED

        # Move to completed
        self.completed_requests.append(request)
        if request.request_id in self.pending_requests:
            del self.pending_requests[request.request_id]

        logger.error(
            f"Approval expired: {request.request_id} - {request.action_name}"
        )

    def get_pending_count(self) -> int:
        """Get number of pending approval requests"""
        return len(self.pending_requests)

    def get_pending_requests(
        self,
        risk_level: Optional[str] = None,
        urgency: Optional[ApprovalUrgency] = None
    ) -> List[ApprovalRequest]:
        """Get pending requests with optional filtering"""

        requests = list(self.pending_requests.values())

        if risk_level:
            requests = [r for r in requests if r.risk_level == risk_level]

        if urgency:
            requests = [r for r in requests if r.urgency == urgency]

        return sorted(requests, key=lambda r: r.created_at)


# Example usage
async def main():
    # Notification callback
    async def notify_approvers(request: ApprovalRequest, approvers: List[str]):
        print(f"\n🔔 APPROVAL NEEDED")
        print(f"Request ID: {request.request_id}")
        print(f"Action: {request.action_name}")
        print(f"Risk: {request.risk_level}")
        print(f"Urgency: {request.urgency.value}")
        print(f"Justification: {request.justification}")
        print(f"Expires: {request.time_remaining()}")
        print(f"Approvers: {', '.join(approvers)}")

    # Escalation callback
    async def escalate(request: ApprovalRequest):
        print(f"\n⚠️  ESCALATION: {request.request_id}")
        print(f"Action: {request.action_name}")
        print(f"Time remaining: {request.time_remaining()}")

    workflow = ApprovalWorkflow(
        notification_callback=notify_approvers,
        escalation_callback=escalate
    )

    # Request approval for critical action
    request = await workflow.request_approval(
        agent_id="deployment_agent",
        action_name="deploy_to_production",
        action_params={
            "service": "payment-service",
            "version": "v2.5.0",
            "rollout_strategy": "blue_green"
        },
        risk_level="CRITICAL",
        urgency=ApprovalUrgency.HIGH,
        justification="Deploy critical security patch for payment processing vulnerability"
    )

    # Simulate approval process
    print("\nWaiting 3 seconds before approval...")
    await asyncio.sleep(3)

    # Approve the request
    workflow.approve(
        request_id=request.request_id,
        approver_id="director_eng",
        comment="Approved - critical security fix"
    )

    # Wait for approval
    approved = await workflow.wait_for_approval(request)
    print(f"\nApproval result: {'✅ APPROVED' if approved else '❌ REJECTED'}")


if __name__ == "__main__":
    asyncio.run(main())
```

### 2.2 Human-in-the-Loop Patterns

```python
"""
Human-in-the-loop patterns for agent workflows.
Enables seamless human intervention in agent decision-making.
"""

from typing import Optional, Dict, Any, Callable, List
from dataclasses import dataclass
from enum import Enum
import asyncio


class InterventionTrigger(Enum):
    """Conditions that trigger human intervention"""
    HIGH_UNCERTAINTY = "high_uncertainty"  # Agent confidence < threshold
    CRITICAL_ACTION = "critical_action"    # Action is high-risk
    POLICY_VIOLATION = "policy_violation"  # Violates policy
    USER_REQUEST = "user_request"          # User explicitly requests oversight
    ERROR_THRESHOLD = "error_threshold"    # Too many consecutive errors
    COST_THRESHOLD = "cost_threshold"      # Cost exceeds limit
    NOVEL_SITUATION = "novel_situation"    # No similar past examples


@dataclass
class HumanFeedback:
    """Feedback provided by human"""
    approved: bool
    modified_action: Optional[Dict[str, Any]] = None
    feedback_text: Optional[str] = None
    confidence_boost: float = 0.0  # -1.0 to 1.0
    timestamp: str = None


class HumanInTheLoop:
    """
    Implements human-in-the-loop pattern for agents.

    Supports multiple intervention patterns:
    1. Approval gates - Human approves/rejects before action
    2. Feedback loops - Human provides feedback on results
    3. Correction - Human modifies agent's proposed action
    4. Escalation - Agent delegates decision to human
    """

    def __init__(
        self,
        confidence_threshold: float = 0.7,
        cost_threshold_cents: int = 100,
        error_threshold: int = 3
    ):
        self.confidence_threshold = confidence_threshold
        self.cost_threshold_cents = cost_threshold_cents
        self.error_threshold = error_threshold
        self.consecutive_errors = 0

        # Callbacks for human interaction
        self.human_review_callback: Optional[Callable] = None
        self.feedback_callback: Optional[Callable] = None

    def should_request_human_input(
        self,
        action: Dict[str, Any],
        confidence: float,
        risk_level: str,
        estimated_cost_cents: int
    ) -> tuple[bool, InterventionTrigger]:
        """
        Determine if human input is needed.

        Returns:
            (should_request, trigger_reason)
        """

        # Critical actions always require approval
        if risk_level in ["HIGH", "CRITICAL"]:
            return True, InterventionTrigger.CRITICAL_ACTION

        # Low confidence triggers review
        if confidence < self.confidence_threshold:
            return True, InterventionTrigger.HIGH_UNCERTAINTY

        # Cost threshold
        if estimated_cost_cents > self.cost_threshold_cents:
            return True, InterventionTrigger.COST_THRESHOLD

        # Error threshold
        if self.consecutive_errors >= self.error_threshold:
            return True, InterventionTrigger.ERROR_THRESHOLD

        return False, None

    async def request_human_review(
        self,
        agent_id: str,
        proposed_action: Dict[str, Any],
        reasoning: str,
        confidence: float,
        alternatives: Optional[List[Dict[str, Any]]] = None
    ) -> HumanFeedback:
        """
        Request human review of agent's proposed action.

        Returns:
            HumanFeedback with approval and optional modifications
        """

        if not self.human_review_callback:
            # No callback configured - auto-approve
            return HumanFeedback(approved=True)

        # Call human review interface
        feedback = await self.human_review_callback(
            agent_id=agent_id,
            action=proposed_action,
            reasoning=reasoning,
            confidence=confidence,
            alternatives=alternatives or []
        )

        # Update error count based on feedback
        if feedback.approved:
            self.consecutive_errors = 0
        else:
            self.consecutive_errors += 1

        return feedback

    async def collaborative_decision(
        self,
        agent_recommendation: Dict[str, Any],
        agent_confidence: float,
        human_input_options: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Combine agent recommendation with human input.

        Agent proposes, human selects or modifies.
        """

        if not self.human_review_callback:
            return agent_recommendation

        # Present options to human
        feedback = await self.human_review_callback(
            action=agent_recommendation,
            confidence=agent_confidence,
            alternatives=human_input_options
        )

        if feedback.modified_action:
            return feedback.modified_action
        elif feedback.approved:
            return agent_recommendation
        else:
            # Rejected - return safe fallback
            return {"action": "no_action", "reason": "human_rejected"}


# Example: Agent with HITL
class TestGenerationAgentWithHITL:
    """Test generation agent with human oversight"""

    def __init__(self):
        self.hitl = HumanInTheLoop(confidence_threshold=0.8)
        self.knowledge_base = []

    async def generate_tests(
        self,
        code: str,
        test_type: str = "unit"
    ) -> Dict[str, Any]:
        """Generate tests with human review for low confidence"""

        # Agent analyzes code and generates tests
        analysis = self._analyze_code(code)
        proposed_tests = self._generate_test_code(analysis)
        confidence = self._calculate_confidence(analysis)

        # Check if human review needed
        should_review, trigger = self.hitl.should_request_human_input(
            action={"generate_tests": proposed_tests},
            confidence=confidence,
            risk_level="MEDIUM",
            estimated_cost_cents=10
        )

        if should_review:
            print(f"\n🤔 Requesting human review (trigger: {trigger.value})")
            print(f"Confidence: {confidence:.2f}")

            # Request human review
            feedback = await self.hitl.request_human_review(
                agent_id="test_gen_agent",
                proposed_action=proposed_tests,
                reasoning=f"Generated {len(proposed_tests['tests'])} tests based on code analysis",
                confidence=confidence,
                alternatives=[
                    {"approach": "property_based", "description": "Use property-based testing"},
                    {"approach": "manual", "description": "Let human write tests manually"}
                ]
            )

            if feedback.approved:
                # Use agent's tests (possibly modified by human)
                final_tests = feedback.modified_action or proposed_tests
                print("✅ Tests approved by human")
            else:
                # Rejected - don't generate tests
                print(f"❌ Tests rejected: {feedback.feedback_text}")
                return {"tests": [], "reason": "human_rejected"}
        else:
            # High confidence - proceed without review
            final_tests = proposed_tests
            print(f"✅ Proceeding without review (confidence: {confidence:.2f})")

        return final_tests

    def _analyze_code(self, code: str) -> Dict[str, Any]:
        """Analyze code to determine testing needs"""
        # Simplified analysis
        return {
            "complexity": "medium",
            "edge_cases": ["null_input", "empty_string", "very_long_input"],
            "dependencies": []
        }

    def _generate_test_code(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate test code based on analysis"""
        return {
            "tests": [
                "test_normal_input",
                "test_null_input",
                "test_empty_string",
                "test_very_long_input"
            ],
            "coverage_estimate": 0.85
        }

    def _calculate_confidence(self, analysis: Dict[str, Any]) -> float:
        """Calculate confidence in generated tests"""
        # Simplified confidence calculation
        if analysis["complexity"] == "low":
            return 0.95
        elif analysis["complexity"] == "medium":
            return 0.75
        else:
            return 0.55


# Example usage
async def demo_hitl():
    """Demonstrate human-in-the-loop pattern"""

    # Mock human review callback
    async def mock_human_review(**kwargs):
        """Simulate human reviewing agent's proposal"""
        print(f"\n👤 HUMAN REVIEW REQUESTED")
        print(f"Action: {kwargs['action']}")
        print(f"Reasoning: {kwargs['reasoning']}")
        print(f"Confidence: {kwargs['confidence']:.2f}")

        if kwargs.get('alternatives'):
            print(f"Alternatives: {len(kwargs['alternatives'])} options")

        # Simulate human approval
        await asyncio.sleep(1)

        # Mock approval with minor modification
        return HumanFeedback(
            approved=True,
            modified_action=None,  # Could modify here
            feedback_text="Looks good, proceed",
            confidence_boost=0.2
        )

    # Create agent with HITL
    agent = TestGenerationAgentWithHITL()
    agent.hitl.human_review_callback = mock_human_review

    # Test 1: High confidence - no human review
    print("=" * 60)
    print("TEST 1: High confidence code")
    print("=" * 60)
    result = await agent.generate_tests(
        code="def add(a, b): return a + b",  # Simple function
        test_type="unit"
    )

    # Test 2: Low confidence - triggers human review
    print("\n" + "=" * 60)
    print("TEST 2: Low confidence code")
    print("=" * 60)
    result = await agent.generate_tests(
        code="def complex_algorithm(data): pass",  # Complex function
        test_type="unit"
    )


if __name__ == "__main__":
    asyncio.run(demo_hitl())
```

### 2.3 Escalation Framework

```yaml
# Escalation matrix for agent decisions
escalation_matrix:
  level_1_automatic:
    conditions:
      - risk_level: SAFE
      - confidence: '>= 0.9'
      - cost: '< $0.10'
    actions:
      - Execute immediately
      - Log for audit
    examples:
      - Reading files
      - Running tests
      - Code analysis

  level_2_review:
    conditions:
      - risk_level: LOW
      - confidence: '>= 0.7'
      - cost: '< $1.00'
    actions:
      - Execute with logging
      - Notify team lead (async)
      - Review daily
    examples:
      - Generating tests
      - Updating documentation
      - Minor code fixes

  level_3_approval:
    conditions:
      - risk_level: MEDIUM
      - confidence: '>= 0.6'
      - cost: '< $10.00'
    actions:
      - Request approval (2 hour timeout)
      - Escalate if no response
      - Document decision
    examples:
      - Modifying application code
      - Database schema changes
      - API contract changes

  level_4_senior_approval:
    conditions:
      - risk_level: HIGH
      - confidence: '>= 0.5'
      - cost: '< $100.00'
    actions:
      - Require senior approval (1 hour timeout)
      - Mandatory review of reasoning
      - Detailed audit trail
    examples:
      - Production deployments
      - Security config changes
      - Deleting resources

  level_5_executive_approval:
    conditions:
      - risk_level: CRITICAL
      - confidence: 'any'
      - cost: '>= $100.00'
    actions:
      - Require executive approval (30 min timeout)
      - Multi-party approval required
      - Post-action review mandatory
    examples:
      - Production rollbacks
      - Mass data deletion
      - Infrastructure changes
      - Customer-impacting changes

escalation_triggers:
  confidence_based:
    - if: confidence < 0.5
      then: Escalate to level 3 (approval required)
    - if: confidence < 0.3
      then: Escalate to level 4 (senior approval)
    - if: confidence < 0.1
      then: Escalate to level 5 (block action)

  error_based:
    - if: consecutive_errors >= 3
      then: Escalate to human review
    - if: consecutive_errors >= 5
      then: Disable agent, require manual re-enable

  cost_based:
    - if: single_action_cost > $10
      then: Require approval
    - if: hourly_cost > $50
      then: Alert finance team
    - if: daily_cost > $200
      then: Pause agent, require review

  pattern_based:
    - if: Same action failed 3 times
      then: Request human guidance
    - if: Novel situation (no similar past examples)
      then: Request human decision
    - if: Multiple guardrail violations
      then: Escalate to security team
```

---

## 3. Failure Modes & Mitigation

### 3.1 Common Agent Failure Modes

```python
"""
Catalog of agent failure modes with detection and mitigation strategies.
Based on real-world production incidents.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class FailureMode(Enum):
    """Types of agent failures"""
    HALLUCINATION = "hallucination"              # Agent fabricates information
    INFINITE_LOOP = "infinite_loop"              # Agent repeats same action
    CASCADE_FAILURE = "cascade_failure"          # Failure propagates to other agents
    TOOL_MISUSE = "tool_misuse"                 # Agent uses tools incorrectly
    CONTEXT_LOSS = "context_loss"               # Agent forgets critical context
    REASONING_ERROR = "reasoning_error"          # Flawed logical reasoning
    RESOURCE_EXHAUSTION = "resource_exhaustion"  # Runs out of budget/tokens
    SECURITY_VIOLATION = "security_violation"    # Attempts unsafe operation
    DATA_CORRUPTION = "data_corruption"          # Corrupts data/state
    DRIFT = "drift"                             # Behavior changes over time


@dataclass
class FailureIncident:
    """Record of a failure incident"""
    incident_id: str
    agent_id: str
    failure_mode: FailureMode
    timestamp: datetime
    description: str
    impact: str  # Description of impact
    root_cause: str
    mitigation_applied: str
    prevented: bool  # Was failure prevented or did it occur?
    cost_impact_cents: int = 0
    recovery_time_seconds: int = 0


class FailureDetector:
    """
    Detects and mitigates agent failures.

    Implements multiple detection strategies:
    - Pattern detection (loops, repetition)
    - Verification checks (hallucination detection)
    - Resource monitoring
    - Behavioral analysis
    """

    def __init__(self):
        self.incidents: List[FailureIncident] = []
        self.action_history: List[Dict[str, Any]] = []
        self.verification_sources: Dict[str, Any] = {}

    # 1. HALLUCINATION DETECTION
    def detect_hallucination(
        self,
        agent_output: str,
        ground_truth_sources: List[str]
    ) -> tuple[bool, float]:
        """
        Detect if agent is hallucinating (making up information).

        Returns:
            (is_hallucinating, confidence)
        """

        # Strategy 1: Check if claims are grounded in sources
        claims = self._extract_claims(agent_output)
        grounded_claims = 0

        for claim in claims:
            if self._claim_found_in_sources(claim, ground_truth_sources):
                grounded_claims += 1

        if not claims:
            return False, 0.0

        grounding_rate = grounded_claims / len(claims)

        # If less than 70% of claims are grounded, likely hallucinating
        is_hallucinating = grounding_rate < 0.7
        confidence = abs(grounding_rate - 0.7) / 0.3  # Distance from threshold

        return is_hallucinating, confidence

    def _extract_claims(self, text: str) -> List[str]:
        """Extract factual claims from text"""
        # Simplified: split by sentences
        # In production: use NLP to identify factual statements
        sentences = text.split('.')
        return [s.strip() for s in sentences if s.strip()]

    def _claim_found_in_sources(self, claim: str, sources: List[str]) -> bool:
        """Check if claim is supported by source material"""
        # Simplified: check for keyword overlap
        # In production: use semantic similarity, entailment checking
        claim_words = set(claim.lower().split())

        for source in sources:
            source_words = set(source.lower().split())
            overlap = len(claim_words & source_words) / len(claim_words)
            if overlap > 0.5:  # 50% word overlap
                return True

        return False

    # 2. INFINITE LOOP DETECTION
    def detect_infinite_loop(
        self,
        current_action: Dict[str, Any],
        lookback_window: int = 10
    ) -> tuple[bool, Optional[str]]:
        """
        Detect if agent is stuck in infinite loop.

        Returns:
            (is_looping, loop_pattern)
        """

        self.action_history.append(current_action)

        # Keep only recent history
        if len(self.action_history) > lookback_window:
            self.action_history = self.action_history[-lookback_window:]

        # Check for repeated identical actions
        if len(self.action_history) >= 3:
            last_three = self.action_history[-3:]
            if all(a == last_three[0] for a in last_three):
                return True, f"Same action repeated 3 times: {last_three[0]}"

        # Check for alternating pattern (A->B->A->B)
        if len(self.action_history) >= 4:
            if (self.action_history[-1] == self.action_history[-3] and
                self.action_history[-2] == self.action_history[-4]):
                return True, "Alternating action pattern detected"

        # Check for no progress (similar actions with same result)
        if len(self.action_history) >= 5:
            recent_results = [a.get('result') for a in self.action_history[-5:]]
            if len(set(str(r) for r in recent_results)) == 1:
                # All results identical
                return True, "No progress detected in last 5 actions"

        return False, None

    # 3. CASCADE FAILURE DETECTION
    def detect_cascade_failure(
        self,
        agent_id: str,
        error: Exception,
        affected_agents: List[str]
    ) -> bool:
        """
        Detect if failure is cascading to other agents.

        Returns:
            True if cascade detected
        """

        # Check recent failures across multiple agents
        recent_cutoff = datetime.now() - timedelta(minutes=5)
        recent_failures = [
            i for i in self.incidents
            if i.timestamp >= recent_cutoff and i.agent_id in affected_agents
        ]

        # If 3+ agents failed in last 5 minutes, it's a cascade
        unique_agents = set(i.agent_id for i in recent_failures)
        return len(unique_agents) >= 3

    # 4. TOOL MISUSE DETECTION
    def detect_tool_misuse(
        self,
        tool_name: str,
        tool_params: Dict[str, Any],
        expected_params: Dict[str, type]
    ) -> tuple[bool, Optional[str]]:
        """
        Detect if agent is misusing a tool.

        Returns:
            (is_misuse, reason)
        """

        # Check for missing required parameters
        for param_name, param_type in expected_params.items():
            if param_name not in tool_params:
                return True, f"Missing required parameter: {param_name}"

            # Check parameter type
            if not isinstance(tool_params[param_name], param_type):
                return True, f"Invalid type for {param_name}: expected {param_type.__name__}"

        # Check for nonsensical parameter values
        if tool_name == "file_operation":
            path = tool_params.get("path", "")
            if not path or path == "undefined" or path == "null":
                return True, "Invalid file path"

        return False, None

    # 5. CONTEXT LOSS DETECTION
    def detect_context_loss(
        self,
        agent_id: str,
        current_context: Dict[str, Any],
        previous_context: Dict[str, Any]
    ) -> bool:
        """
        Detect if agent has lost critical context.

        Returns:
            True if context loss detected
        """

        # Check for missing critical keys
        critical_keys = {"task_goal", "current_step", "completed_steps"}
        current_keys = set(current_context.keys())

        if not critical_keys.issubset(current_keys):
            return True

        # Check for contradictory context
        if current_context.get("current_step") in current_context.get("completed_steps", []):
            return True  # Trying to do a step that's already completed

        return False

    # 6. RESOURCE EXHAUSTION DETECTION
    def detect_resource_exhaustion(
        self,
        token_count: int,
        token_limit: int,
        cost_cents: int,
        budget_cents: int
    ) -> tuple[bool, str]:
        """
        Detect if agent is approaching resource limits.

        Returns:
            (is_exhausted, resource_type)
        """

        # Token exhaustion
        if token_count >= token_limit * 0.9:  # 90% of limit
            return True, "token_limit"

        # Cost exhaustion
        if cost_cents >= budget_cents * 0.9:  # 90% of budget
            return True, "budget_limit"

        return False, ""

    def record_incident(
        self,
        agent_id: str,
        failure_mode: FailureMode,
        description: str,
        impact: str,
        root_cause: str,
        mitigation: str,
        prevented: bool = False
    ):
        """Record a failure incident for analysis"""

        import uuid
        incident = FailureIncident(
            incident_id=str(uuid.uuid4()),
            agent_id=agent_id,
            failure_mode=failure_mode,
            timestamp=datetime.now(),
            description=description,
            impact=impact,
            root_cause=root_cause,
            mitigation_applied=mitigation,
            prevented=prevented
        )

        self.incidents.append(incident)

    def get_failure_statistics(self) -> Dict[str, Any]:
        """Get failure statistics for monitoring"""

        if not self.incidents:
            return {"total_incidents": 0}

        total = len(self.incidents)
        prevented = len([i for i in self.incidents if i.prevented])

        # Count by failure mode
        by_mode = {}
        for incident in self.incidents:
            mode = incident.failure_mode.value
            by_mode[mode] = by_mode.get(mode, 0) + 1

        # Count by agent
        by_agent = {}
        for incident in self.incidents:
            agent = incident.agent_id
            by_agent[agent] = by_agent.get(agent, 0) + 1

        return {
            "total_incidents": total,
            "prevented_incidents": prevented,
            "prevention_rate": prevented / total if total > 0 else 0,
            "by_failure_mode": by_mode,
            "by_agent": by_agent,
            "most_common_mode": max(by_mode, key=by_mode.get) if by_mode else None
        }


# Example usage and mitigation strategies
if __name__ == "__main__":
    detector = FailureDetector()

    # Test 1: Hallucination detection
    agent_output = "The API endpoint returns user data with fields: id, name, email, phone, address, credit_card"
    sources = ["API documentation: Endpoint /users returns {id, name, email}"]

    is_hallucinating, confidence = detector.detect_hallucination(agent_output, sources)
    print(f"Hallucination detected: {is_hallucinating} (confidence: {confidence:.2f})")

    if is_hallucinating:
        detector.record_incident(
            agent_id="test_gen_agent",
            failure_mode=FailureMode.HALLUCINATION,
            description="Agent claimed API returns fields not in documentation",
            impact="Would generate incorrect tests",
            root_cause="LLM hallucinated additional fields",
            mitigation="Verified against ground truth, rejected output",
            prevented=True
        )

    # Test 2: Infinite loop detection
    for i in range(5):
        is_looping, pattern = detector.detect_infinite_loop(
            {"action": "run_tests", "result": "failed"}
        )
        if is_looping:
            print(f"\nInfinite loop detected: {pattern}")
            detector.record_incident(
                agent_id="test_execution_agent",
                failure_mode=FailureMode.INFINITE_LOOP,
                description=pattern,
                impact="Agent wasting resources on repeated failed attempts",
                root_cause="No adaptive strategy for persistent failures",
                mitigation="Circuit breaker triggered, escalated to human",
                prevented=True
            )
            break

    # Test 3: Tool misuse detection
    is_misuse, reason = detector.detect_tool_misuse(
        tool_name="file_operation",
        tool_params={"operation": "write", "path": ""},  # Missing path
        expected_params={"operation": str, "path": str, "content": str}
    )
    print(f"\nTool misuse detected: {is_misuse}, reason: {reason}")

    # Statistics
    print("\n" + "="*60)
    stats = detector.get_failure_statistics()
    print("FAILURE STATISTICS:")
    print(f"  Total incidents: {stats['total_incidents']}")
    print(f"  Prevented: {stats['prevented_incidents']}")
    print(f"  Prevention rate: {stats['prevention_rate']:.1%}")
    print(f"  Most common failure: {stats['most_common_mode']}")
```

### 3.2 Mitigation Strategies

```yaml
# Failure mitigation playbook
mitigation_strategies:
  hallucination:
    detection:
      - Compare output against source documents
      - Check for specific facts/numbers not in sources
      - Use secondary LLM to verify claims
      - Cross-reference with knowledge base

    prevention:
      - Include source material in prompts
      - Use retrieval-augmented generation (RAG)
      - Add "Only use information from provided sources" instruction
      - Temperature = 0 for factual tasks

    mitigation:
      - Reject outputs with ungrounded claims
      - Flag for human review
      - Log hallucinations for model improvement
      - Provide feedback to LLM provider

    example_prompt:
      role: system
      content: |
        You are analyzing code to generate tests.

        CRITICAL: Only use information from the provided code and documentation.
        Do NOT make assumptions about APIs, libraries, or behavior not shown.
        If information is missing, state "Information not available" rather than guessing.

        Code:
        {code}

        Documentation:
        {documentation}

  infinite_loop:
    detection:
      - Track action history (last 10 actions)
      - Detect repeated identical actions (3+ times)
      - Detect alternating patterns
      - Monitor progress metrics (should improve over time)

    prevention:
      - Max iterations limit per task
      - Progress checkpoints (require advancement)
      - Diverse action selection (prevent repetition)
      - Exit conditions in planning

    mitigation:
      - Circuit breaker after N identical actions
      - Escalate to human with action history
      - Reset agent state
      - Adjust strategy based on failure pattern

    example_code: |
      MAX_RETRIES = 3
      retry_count = {}

      def execute_action(action):
          key = f"{action['type']}:{action['params']}"
          retry_count[key] = retry_count.get(key, 0) + 1

          if retry_count[key] > MAX_RETRIES:
              raise InfiniteLoopError(f"Action repeated {MAX_RETRIES} times")

          return perform_action(action)

  cascade_failure:
    detection:
      - Monitor failures across agent fleet
      - Track temporal correlation of failures
      - Identify shared dependencies

    prevention:
      - Agent isolation (separate error domains)
      - Graceful degradation (fallback strategies)
      - Independent retry policies
      - Health checks before delegation

    mitigation:
      - Circuit breaker at system level
      - Pause dependent agents
      - Identify root cause agent
      - Staged recovery (one agent at a time)

    example_architecture:
      pattern: Bulkhead
      description: |
        Isolate agents into separate thread pools/processes.
        If one agent fails, others continue operating.
        Prevent shared resource exhaustion.

  tool_misuse:
    detection:
      - Validate tool parameters against schema
      - Check parameter types and ranges
      - Verify tool preconditions
      - Monitor tool success rates

    prevention:
      - Clear tool documentation in prompts
      - Parameter type hints
      - Example usage in tool description
      - Few-shot examples of correct usage

    mitigation:
      - Reject invalid tool calls
      - Provide error feedback to agent
      - Log common misuse patterns
      - Update tool documentation

    example_tool_schema:
      name: run_database_query
      description: Execute SQL query on database
      parameters:
        query:
          type: string
          description: SQL query to execute
          pattern: '^SELECT.*' # Only allow SELECT
        timeout:
          type: integer
          description: Query timeout in seconds
          minimum: 1
          maximum: 30
        max_rows:
          type: integer
          description: Maximum rows to return
          default: 1000
          maximum: 10000
      required: [query]

      examples:
        - query: 'SELECT * FROM users WHERE id = 123'
          timeout: 10
        - query: "SELECT COUNT(*) FROM orders WHERE status = 'pending'"

  context_loss:
    detection:
      - Validate context completeness
      - Check for required fields
      - Detect contradictions in context
      - Monitor context size

    prevention:
      - Persist context to storage
      - Context checkpointing
      - Context compression techniques
      - Hierarchical context (summary + details)

    mitigation:
      - Reload context from checkpoint
      - Request context refresh from user
      - Reset to last known good state
      - Escalate if context unrecoverable

    example_pattern:
      name: Context Checkpointing
      code: |
        def checkpoint_context(agent_id, context):
            """Save context snapshot"""
            checkpoint = {
                "agent_id": agent_id,
                "timestamp": datetime.now(),
                "context": context,
                "version": get_context_version(context)
            }
            save_to_storage(f"checkpoints/{agent_id}/latest", checkpoint)

        def restore_context(agent_id):
            """Restore from last checkpoint"""
            checkpoint = load_from_storage(f"checkpoints/{agent_id}/latest")
            return checkpoint["context"]

  resource_exhaustion:
    detection:
      - Monitor token usage per request
      - Track cumulative costs
      - Watch for sudden spikes
      - Alert at 80% of limits

    prevention:
      - Set hard limits (tokens, cost, time)
      - Budget allocation per task
      - Use cheaper models for simple tasks
      - Implement caching aggressively

    mitigation:
      - Graceful degradation (simpler approach)
      - Switch to cheaper model
      - Pause agent until budget refresh
      - Request budget increase approval

    example_limits:
      per_request:
        max_tokens: 4000
        max_cost_cents: 50 # $0.50
        timeout_seconds: 300

      per_hour:
        max_requests: 100
        max_tokens: 200000
        max_cost_cents: 1000 # $10.00

      per_day:
        max_cost_cents: 10000 # $100.00
        alert_at_cents: 8000 # $80.00
```

### 3.3 Real-World Failure Case Studies

```markdown
## Case Study 1: GitHub Copilot Workspace Hallucination (2024)

**Incident**: Agent hallucinated non-existent API methods
**Impact**: Developers wasted 4 hours debugging "missing" methods
**Root Cause**: LLM trained on outdated documentation, filled gaps with plausible-sounding methods
**Cost**: $400 (developer time)

**Mitigation Applied**:

1. Implemented verification layer - check all APIs against actual documentation
2. Added "confidence" scores to suggestions - flag low-confidence items
3. Include version information in prompts - "Use React 18.2 APIs only"
4. Human review required for novel API usage

**Lessons Learned**:

- Never trust LLM for factual API information without verification
- Maintain up-to-date knowledge base of actual APIs/libraries
- Clearly communicate uncertainty to users

---

## Case Study 2: AutoGPT Infinite Loop (2023)

**Incident**: Agent spent $50 in 20 minutes retrying failed approach
**Impact**: Budget exhausted, task not completed
**Root Cause**: No loop detection, agent kept trying same failing strategy
**Cost**: $50 (wasted API calls)

**Mitigation Applied**:

1. Implemented max retry limit (3 attempts per approach)
2. Added progress detection - require measurable advancement
3. Circuit breaker after $10 spent without progress
4. Human escalation after 3 failed strategies

**Lessons Learned**:

- Agents need explicit loop detection
- Budget controls must be enforced strictly
- Progress metrics prevent wasted effort

---

## Case Study 3: Multi-Agent Code Review Cascade Failure (2024)

**Incident**: Security agent false positive caused all 5 agents to reject PR
**Impact**: Valid PR blocked, deployment delayed 2 hours
**Root Cause**: Agents used first agent's output without independent analysis
**Cost**: $800 (deployment delay)

**Mitigation Applied**:

1. Independent agent execution - no shared context initially
2. Consensus mechanism - require 3/5 agents to agree on blocking
3. Human override option - fast-track approval available
4. Agent confidence scores - weight decisions by confidence

**Lessons Learned**:

- Avoid shared context in parallel agents
- Implement voting/consensus for critical decisions
- Always provide human override path
```

---

## 4. Cost Control & Budget Management

### 4.1 Cost Tracking System

```python
"""
Production-grade cost tracking for agent systems.
Tracks LLM API costs, prevents budget overruns, provides analytics.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable
from enum import Enum
import json


class ModelPricing:
    """Current LLM pricing (as of October 2024)"""

    # OpenAI GPT-4
    GPT_4_INPUT = 0.03 / 1000      # $0.03 per 1K input tokens
    GPT_4_OUTPUT = 0.06 / 1000     # $0.06 per 1K output tokens

    # OpenAI GPT-4 Turbo
    GPT_4_TURBO_INPUT = 0.01 / 1000
    GPT_4_TURBO_OUTPUT = 0.03 / 1000

    # OpenAI GPT-3.5 Turbo
    GPT_35_TURBO_INPUT = 0.0005 / 1000
    GPT_35_TURBO_OUTPUT = 0.0015 / 1000

    # Anthropic Claude 3.5 Sonnet
    CLAUDE_35_SONNET_INPUT = 0.003 / 1000
    CLAUDE_35_SONNET_OUTPUT = 0.015 / 1000

    # Anthropic Claude 3 Haiku (cheapest)
    CLAUDE_3_HAIKU_INPUT = 0.00025 / 1000
    CLAUDE_3_HAIKU_OUTPUT = 0.00125 / 1000


@dataclass
class CostRecord:
    """Record of a single LLM API call cost"""
    timestamp: datetime
    agent_id: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_cents: int  # Cost in cents
    task_id: Optional[str] = None
    success: bool = True


class BudgetPeriod(Enum):
    """Budget period types"""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


@dataclass
class Budget:
    """Budget configuration"""
    period: BudgetPeriod
    limit_cents: int  # Budget limit in cents
    warning_threshold_percent: int = 80  # Warn at 80%
    alert_callback: Optional[Callable] = None


class CostTracker:
    """
    Tracks and manages LLM API costs.

    Features:
    - Real-time cost tracking
    - Budget enforcement
    - Cost analytics
    - Alert system
    - Cost optimization recommendations
    """

    def __init__(self):
        self.cost_records: List[CostRecord] = []
        self.budgets: Dict[str, Budget] = {}
        self.current_period_costs: Dict[str, int] = {}  # period -> cost_cents

    def record_llm_call(
        self,
        agent_id: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        task_id: Optional[str] = None,
        success: bool = True
    ) -> int:
        """
        Record an LLM API call and return cost.

        Returns:
            cost_cents: Cost of this call in cents
        """

        # Calculate cost based on model
        cost_cents = self._calculate_cost(model, input_tokens, output_tokens)

        # Create record
        record = CostRecord(
            timestamp=datetime.now(),
            agent_id=agent_id,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_cents=cost_cents,
            task_id=task_id,
            success=success
        )

        self.cost_records.append(record)

        # Update period costs
        for period_name, budget in self.budgets.items():
            period_key = self._get_period_key(budget.period)
            self.current_period_costs[period_key] = \
                self.current_period_costs.get(period_key, 0) + cost_cents

            # Check budget
            self._check_budget(budget, period_key)

        return cost_cents

    def _calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> int:
        """Calculate cost in cents for an LLM call"""

        # Map model name to pricing
        pricing_map = {
            "gpt-4": (ModelPricing.GPT_4_INPUT, ModelPricing.GPT_4_OUTPUT),
            "gpt-4-turbo": (ModelPricing.GPT_4_TURBO_INPUT, ModelPricing.GPT_4_TURBO_OUTPUT),
            "gpt-3.5-turbo": (ModelPricing.GPT_35_TURBO_INPUT, ModelPricing.GPT_35_TURBO_OUTPUT),
            "claude-3-5-sonnet": (ModelPricing.CLAUDE_35_SONNET_INPUT, ModelPricing.CLAUDE_35_SONNET_OUTPUT),
            "claude-3-haiku": (ModelPricing.CLAUDE_3_HAIKU_INPUT, ModelPricing.CLAUDE_3_HAIKU_OUTPUT),
        }

        input_price, output_price = pricing_map.get(model, (0, 0))

        cost_dollars = (input_tokens * input_price) + (output_tokens * output_price)
        return int(cost_dollars * 100)  # Convert to cents

    def _get_period_key(self, period: BudgetPeriod) -> str:
        """Get current period key"""
        now = datetime.now()

        if period == BudgetPeriod.HOURLY:
            return f"hourly_{now.strftime('%Y%m%d%H')}"
        elif period == BudgetPeriod.DAILY:
            return f"daily_{now.strftime('%Y%m%d')}"
        elif period == BudgetPeriod.WEEKLY:
            # Week number
            week = now.isocalendar()[1]
            return f"weekly_{now.year}W{week:02d}"
        elif period == BudgetPeriod.MONTHLY:
            return f"monthly_{now.strftime('%Y%m')}"

    def _check_budget(self, budget: Budget, period_key: str):
        """Check if budget limit is exceeded"""

        current_cost = self.current_period_costs.get(period_key, 0)
        percent_used = (current_cost / budget.limit_cents) * 100

        # Warning threshold
        if percent_used >= budget.warning_threshold_percent and percent_used < 100:
            if budget.alert_callback:
                budget.alert_callback(
                    level="warning",
                    message=f"Budget at {percent_used:.0f}% ({current_cost/100:.2f}/{budget.limit_cents/100:.2f})",
                    period=budget.period.value
                )

        # Budget exceeded
        if percent_used >= 100:
            if budget.alert_callback:
                budget.alert_callback(
                    level="critical",
                    message=f"Budget EXCEEDED: {current_cost/100:.2f}/{budget.limit_cents/100:.2f}",
                    period=budget.period.value
                )
            raise BudgetExceededError(
                f"Budget exceeded for {budget.period.value}: "
                f"${current_cost/100:.2f} / ${budget.limit_cents/100:.2f}"
            )

    def set_budget(
        self,
        period: BudgetPeriod,
        limit_dollars: float,
        warning_threshold_percent: int = 80,
        alert_callback: Optional[Callable] = None
    ):
        """Set budget for a period"""

        budget = Budget(
            period=period,
            limit_cents=int(limit_dollars * 100),
            warning_threshold_percent=warning_threshold_percent,
            alert_callback=alert_callback
        )

        self.budgets[period.value] = budget

    def get_current_spend(self, period: BudgetPeriod) -> float:
        """Get current spend for period in dollars"""
        period_key = self._get_period_key(period)
        cost_cents = self.current_period_costs.get(period_key, 0)
        return cost_cents / 100

    def get_remaining_budget(self, period: BudgetPeriod) -> float:
        """Get remaining budget for period in dollars"""
        budget = self.budgets.get(period.value)
        if not budget:
            return float('inf')

        current_spend_cents = self.get_current_spend(period) * 100
        remaining_cents = budget.limit_cents - current_spend_cents
        return max(0, remaining_cents / 100)

    def get_cost_analytics(self) -> Dict:
        """Get cost analytics and insights"""

        if not self.cost_records:
            return {"total_records": 0}

        total_cost_cents = sum(r.cost_cents for r in self.cost_records)
        total_calls = len(self.cost_records)
        successful_calls = len([r for r in self.cost_records if r.success])

        # Cost by agent
        by_agent = {}
        for record in self.cost_records:
            agent = record.agent_id
            by_agent[agent] = by_agent.get(agent, 0) + record.cost_cents

        # Cost by model
        by_model = {}
        for record in self.cost_records:
            model = record.model
            by_model[model] = by_model.get(model, 0) + record.cost_cents

        # Cost by hour (last 24 hours)
        now = datetime.now()
        last_24h = [r for r in self.cost_records if r.timestamp >= now - timedelta(hours=24)]
        hourly_cost = sum(r.cost_cents for r in last_24h) / 24 if last_24h else 0

        # Most expensive agent
        most_expensive_agent = max(by_agent.items(), key=lambda x: x[1]) if by_agent else None

        # Cost efficiency (cost per successful call)
        cost_per_success = total_cost_cents / successful_calls if successful_calls > 0 else 0

        return {
            "total_cost_dollars": total_cost_cents / 100,
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
            "average_cost_per_call_cents": total_cost_cents / total_calls if total_calls > 0 else 0,
            "cost_per_successful_call_cents": cost_per_success,
            "by_agent": {k: v/100 for k, v in by_agent.items()},
            "by_model": {k: v/100 for k, v in by_model.items()},
            "most_expensive_agent": most_expensive_agent[0] if most_expensive_agent else None,
            "hourly_burn_rate_dollars": hourly_cost / 100,
            "projected_monthly_cost_dollars": (hourly_cost * 24 * 30) / 100
        }

    def get_optimization_recommendations(self) -> List[str]:
        """Get cost optimization recommendations"""

        recommendations = []
        analytics = self.get_cost_analytics()

        if not analytics.get("total_calls"):
            return ["No data yet - collect more usage data"]

        # Check model usage
        by_model = analytics.get("by_model", {})
        if "gpt-4" in by_model and by_model["gpt-4"] > 10:  # $10+
            recommendations.append(
                f"Consider using gpt-3.5-turbo for simple tasks. "
                f"Current GPT-4 usage: ${by_model['gpt-4']:.2f}/month"
            )

        # Check success rate
        success_rate = analytics.get("success_rate", 100)
        if success_rate < 80:
            wasted_cost = analytics["total_cost_dollars"] * (1 - success_rate/100)
            recommendations.append(
                f"Success rate is {success_rate:.0f}%. "
                f"${wasted_cost:.2f} spent on failed calls. "
                f"Improve error handling to reduce waste."
            )

        # Check burn rate
        hourly_rate = analytics.get("hourly_burn_rate_dollars", 0)
        if hourly_rate > 1:  # $1/hour = $720/month
            recommendations.append(
                f"High burn rate: ${hourly_rate:.2f}/hour "
                f"(${analytics['projected_monthly_cost_dollars']:.0f}/month projected). "
                f"Consider implementing caching or using cheaper models."
            )

        return recommendations if recommendations else ["Cost usage looks optimal"]


class BudgetExceededError(Exception):
    """Raised when budget is exceeded"""
    pass


# Example usage
if __name__ == "__main__":
    tracker = CostTracker()

    # Set budgets
    def alert_handler(level, message, period):
        print(f"[{level.upper()}] {period}: {message}")

    tracker.set_budget(
        period=BudgetPeriod.DAILY,
        limit_dollars=10.00,
        alert_callback=alert_handler
    )

    tracker.set_budget(
        period=BudgetPeriod.MONTHLY,
        limit_dollars=200.00,
        alert_callback=alert_handler
    )

    # Simulate some LLM calls
    print("Simulating agent LLM calls...\n")

    # Expensive GPT-4 calls
    for i in range(5):
        cost = tracker.record_llm_call(
            agent_id="code_review_agent",
            model="gpt-4",
            input_tokens=3000,
            output_tokens=1500,
            task_id=f"task_{i}",
            success=True
        )
        print(f"Call {i+1}: ${cost/100:.4f}")

    # Cheaper GPT-3.5 calls
    for i in range(20):
        tracker.record_llm_call(
            agent_id="test_gen_agent",
            model="gpt-3.5-turbo",
            input_tokens=1000,
            output_tokens=500,
            success=True
        )

    # Get analytics
    print("\n" + "="*60)
    print("COST ANALYTICS")
    print("="*60)
    analytics = tracker.get_cost_analytics()
    print(f"Total cost: ${analytics['total_cost_dollars']:.2f}")
    print(f"Total calls: {analytics['total_calls']}")
    print(f"Success rate: {analytics['success_rate']:.1f}%")
    print(f"Average cost/call: ${analytics['average_cost_per_call_cents']/100:.4f}")
    print(f"Hourly burn rate: ${analytics['hourly_burn_rate_dollars']:.2f}/hour")
    print(f"Projected monthly: ${analytics['projected_monthly_cost_dollars']:.0f}/month")

    print("\nCost by agent:")
    for agent, cost in analytics['by_agent'].items():
        print(f"  {agent}: ${cost:.2f}")

    print("\nCost by model:")
    for model, cost in analytics['by_model'].items():
        print(f"  {model}: ${cost:.2f}")

    # Recommendations
    print("\n" + "="*60)
    print("OPTIMIZATION RECOMMENDATIONS")
    print("="*60)
    for i, rec in enumerate(tracker.get_optimization_recommendations(), 1):
        print(f"{i}. {rec}")

    # Budget status
    print("\n" + "="*60)
    print("BUDGET STATUS")
    print("="*60)
    daily_spend = tracker.get_current_spend(BudgetPeriod.DAILY)
    daily_remaining = tracker.get_remaining_budget(BudgetPeriod.DAILY)
    print(f"Daily: ${daily_spend:.2f} / $10.00 (${daily_remaining:.2f} remaining)")

    monthly_spend = tracker.get_current_spend(BudgetPeriod.MONTHLY)
    monthly_remaining = tracker.get_remaining_budget(BudgetPeriod.MONTHLY)
    print(f"Monthly: ${monthly_spend:.2f} / $200.00 (${monthly_remaining:.2f} remaining)")
```

### 4.2 Cost Optimization Strategies

```yaml
# Cost optimization playbook for agent systems
cost_optimization:
  1_model_selection:
    strategy: Use cheapest model that meets requirements

    decision_tree:
      simple_tasks: # Classification, simple extraction
        model: gpt-3.5-turbo or claude-3-haiku
        cost: $0.0005/1K tokens (input)
        examples:
          - Test case classification
          - Log parsing
          - Status checks

      medium_tasks: # Analysis, generation with context
        model: gpt-4-turbo or claude-3-5-sonnet
        cost: $0.01/1K tokens (input)
        examples:
          - Code review
          - Test generation
          - Bug triage

      complex_tasks: # Deep reasoning, planning
        model: gpt-4 or claude-3-5-sonnet
        cost: $0.03/1K tokens (input)
        examples:
          - Architecture decisions
          - Root cause analysis
          - Multi-step planning

    savings_potential: 50-70% by using right-sized models

  2_prompt_optimization:
    strategy: Minimize token usage while maintaining quality

    techniques:
      - Use clear, concise instructions
      - Remove unnecessary examples (use 2-3 instead of 10)
      - Compress context (summaries instead of full text)
      - Use stop sequences to prevent over-generation
      - Set max_tokens appropriately

    example_before:
      prompt: |
        You are a helpful AI assistant that helps developers write tests.
        I will provide you with code and you should analyze it carefully,
        considering all possible edge cases, error conditions, and
        boundary conditions. Then generate comprehensive unit tests
        that cover all scenarios...

        [10 examples of test generation]

        Code to test:
        {code}

      tokens: ~2000 (instructions + examples)
      cost_per_call: $0.06

    example_after:
      prompt: |
        Generate unit tests for this code. Cover: happy path, edge cases, errors.

        Code:
        {code}

      tokens: ~200
      cost_per_call: $0.006

    savings_potential: 30-50% through prompt optimization

  3_caching:
    strategy: Cache agent responses for repeated queries

    cache_candidates:
      - Code analysis results (cache by file hash)
      - Documentation lookups
      - API schema information
      - Test generation for unchanged code
      - Static analysis results

    implementation:
      cache_key: hash(prompt + model + temperature)
      ttl: 24 hours for dynamic content, 7 days for static
      invalidation: On code changes (use file hashes)

    example_code: |
      import hashlib
      from functools import lru_cache

      def cache_key(prompt, model, temperature):
          key_str = f"{prompt}|{model}|{temperature}"
          return hashlib.sha256(key_str.encode()).hexdigest()

      response_cache = {}

      def cached_llm_call(prompt, model, temperature=0):
          key = cache_key(prompt, model, temperature)

          if key in response_cache:
              print(f"Cache HIT - saving ${cost:.4f}")
              return response_cache[key]

          response = llm_api_call(prompt, model, temperature)
          response_cache[key] = response
          return response

    savings_potential: 60-80% for repeated operations

  4_batch_processing:
    strategy: Process multiple items in one LLM call

    single_calls:
      approach: Call LLM once per file
      cost: 100 files × $0.05 = $5.00
      time: 100 × 2s = 200 seconds

    batched:
      approach: Process 10 files per call
      cost: 10 calls × $0.15 = $1.50
      time: 10 × 5s = 50 seconds
      savings: 70% cost, 75% time

    implementation:
      max_batch_size: 10 items (avoid context limit)
      prompt_template: |
        Analyze these files and return JSON array of results:

        Files:
        [File 1]
        {file_1_content}

        [File 2]
        {file_2_content}

        Return: [{"file": "file1", "analysis": "..."}, ...]

    savings_potential: 50-70% for bulk operations

  5_early_stopping:
    strategy: Stop generation when enough information gathered

    techniques:
      - Use stop sequences
      - Set appropriate max_tokens
      - Stream responses and stop when satisfied
      - Use lower temperature for focused output

    example:
      task: Extract error message from logs

      without_stopping:
        max_tokens: 1000
        actual_output: "Error: Connection refused\n[500 tokens of explanation]"
        cost: $0.03

      with_stopping:
        max_tokens: 50
        stop_sequence: "\n"
        output: 'Error: Connection refused'
        cost: $0.003

    savings_potential: 40-60% for extraction tasks

  6_local_llms:
    strategy: Use local models for non-sensitive, high-volume tasks

    cloud_cost:
      model: gpt-3.5-turbo
      requests_per_month: 100000
      cost: $150/month

    local_cost:
      model: Llama 3.1 70B (self-hosted)
      infrastructure: $50/month (GPU server)
      cost: $50/month
      savings: $100/month (67%)

    use_cases_for_local:
      - High-volume log analysis
      - Internal code review
      - Test case generation
      - Documentation generation

    use_cases_for_cloud:
      - Complex reasoning
      - Customer-facing features
      - Critical decision-making
      - Tasks requiring latest knowledge

    savings_potential: 60-80% for suitable workloads

  7_smart_routing:
    strategy: Route requests to appropriate model based on complexity

    router_logic:
      - Calculate task complexity score
      - Route simple (score < 3) → cheap model
      - Route medium (score 3-7) → mid-tier model
      - Route complex (score > 7) → expensive model

    complexity_scoring:
      factors:
        - Code length (longer = more complex)
        - Cyclomatic complexity
        - Number of dependencies
        - Task type (analysis vs generation)

      example:
        simple_function:
          score: 2
          model: gpt-3.5-turbo
          cost: $0.001

        complex_function:
          score: 8
          model: gpt-4
          cost: $0.05

    savings_potential: 40-60% vs. always using expensive model

  8_streaming_and_cancellation:
    strategy: Stream responses and cancel when sufficient

    example_code: |
      async for chunk in llm_stream(prompt):
          output += chunk

          # Check if we have enough
          if is_answer_complete(output):
              cancel_stream()
              break  # Stop paying for more tokens

    use_cases:
      - Question answering (stop after answer found)
      - Error detection (stop at first error)
      - Code search (stop at first match)

    savings_potential: 20-40% for search/extraction tasks

# Cost monitoring dashboard metrics
monitoring:
  real_time:
    - Current hourly burn rate
    - Budget remaining (daily/weekly/monthly)
    - Cost per agent
    - Most expensive operations

  daily_review:
    - Total cost yesterday
    - Cost trend (vs. last 7 days)
    - Budget utilization %
    - Failed calls (wasted cost)
    - Top 10 most expensive calls

  weekly_review:
    - Cost by agent
    - Cost by model
    - Optimization opportunities
    - Projected monthly cost
    - ROI analysis (cost vs. time saved)

  alerts:
    - Budget at 80% → Warning
    - Budget at 95% → Critical
    - Burn rate spike (> 2x normal) → Investigation needed
    - Failed call rate > 10% → Fix errors to reduce waste
```

---

## 5. Bias Detection & Mitigation

### 5.1 Types of Bias in Agent Systems

```python
"""
Bias detection framework for agent systems.
Identifies and mitigates various forms of bias in agent decision-making.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
from collections import Counter
import statistics


class BiasType(Enum):
    """Types of bias in agent systems"""
    SELECTION_BIAS = "selection_bias"          # Favors certain options
    CONFIRMATION_BIAS = "confirmation_bias"    # Seeks confirming evidence
    RECENCY_BIAS = "recency_bias"             # Over-weights recent information
    AUTHORITY_BIAS = "authority_bias"          # Over-trusts certain sources
    ANCHORING_BIAS = "anchoring_bias"          # Over-relies on first information
    AUTOMATION_BIAS = "automation_bias"        # Over-trusts automated tools
    AVAILABILITY_BIAS = "availability_bias"    # Favors easily recalled info
    REPRESENTATION_BIAS = "representation_bias" # Training data biases


@dataclass
class BiasIncident:
    """Record of detected bias"""
    timestamp: str
    agent_id: str
    bias_type: BiasType
    description: str
    severity: str  # low, medium, high, critical
    evidence: Dict[str, Any]
    mitigation_applied: Optional[str] = None


class BiasDetector:
    """
    Detects and mitigates bias in agent decision-making.

    Features:
    - Statistical bias detection
    - Decision pattern analysis
    - Fairness metrics
    - Mitigation strategies
    """

    def __init__(self):
        self.incidents: List[BiasIncident] = []
        self.decision_history: List[Dict[str, Any]] = []

    # 1. SELECTION BIAS DETECTION
    def detect_selection_bias(
        self,
        decisions: List[str],
        available_options: List[str],
        window_size: int = 100
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Detect if agent systematically favors certain options.

        Args:
            decisions: Recent decisions made by agent
            available_options: All available options
            window_size: Number of recent decisions to analyze

        Returns:
            (bias_detected, evidence)
        """

        if len(decisions) < window_size:
            return False, {"reason": "Insufficient data"}

        recent_decisions = decisions[-window_size:]
        decision_counts = Counter(recent_decisions)

        # Expected frequency (uniform distribution)
        expected_frequency = window_size / len(available_options)

        # Calculate chi-square statistic
        chi_square = 0
        for option in available_options:
            observed = decision_counts.get(option, 0)
            chi_square += ((observed - expected_frequency) ** 2) / expected_frequency

        # Critical value for p < 0.05 with df = len(options) - 1
        # Simplified: use threshold
        threshold = len(available_options) * 2

        bias_detected = chi_square > threshold

        if bias_detected:
            # Identify overused and underused options
            overused = [
                opt for opt in available_options
                if decision_counts.get(opt, 0) > expected_frequency * 1.5
            ]
            underused = [
                opt for opt in available_options
                if decision_counts.get(opt, 0) < expected_frequency * 0.5
            ]

            evidence = {
                "chi_square": chi_square,
                "threshold": threshold,
                "decision_distribution": dict(decision_counts),
                "expected_frequency": expected_frequency,
                "overused_options": overused,
                "underused_options": underused
            }
        else:
            evidence = {
                "chi_square": chi_square,
                "threshold": threshold,
                "conclusion": "No significant selection bias detected"
            }

        return bias_detected, evidence

    # 2. CONFIRMATION BIAS DETECTION
    def detect_confirmation_bias(
        self,
        hypothesis: str,
        evidence_gathered: List[Dict[str, Any]],
        all_available_evidence: List[Dict[str, Any]]
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Detect if agent only seeks confirming evidence.

        Returns:
            (bias_detected, evidence)
        """

        # Categorize evidence
        confirming = [e for e in evidence_gathered if e.get("supports_hypothesis")]
        disconfirming = [e for e in evidence_gathered if not e.get("supports_hypothesis")]

        # Check for balanced investigation
        total = len(evidence_gathered)
        if total == 0:
            return False, {"reason": "No evidence gathered"}

        confirming_rate = len(confirming) / total

        # Bias if > 80% of evidence is confirming
        bias_detected = confirming_rate > 0.8

        # Also check if disconfirming evidence was ignored
        available_disconfirming = [
            e for e in all_available_evidence
            if not e.get("supports_hypothesis") and e not in evidence_gathered
        ]

        evidence_dict = {
            "confirming_count": len(confirming),
            "disconfirming_count": len(disconfirming),
            "confirming_rate": confirming_rate,
            "ignored_disconfirming": len(available_disconfirming),
            "threshold": 0.8
        }

        return bias_detected, evidence_dict

    # Additional methods for other bias types...


class BiasMitigation:
    """
    Mitigation strategies for detected biases.
    """

    @staticmethod
    def mitigate_selection_bias(
        available_options: List[str],
        overused: List[str]
    ) -> Dict[str, Any]:
        """
        Mitigate selection bias by diversifying choices.

        Strategy: Temporarily increase probability of underused options.
        """

        mitigation = {
            "strategy": "diversified_sampling",
            "adjustments": {},
            "duration": "next_100_decisions"
        }

        # Reduce probability of overused options
        for option in overused:
            mitigation["adjustments"][option] = {
                "probability_multiplier": 0.5,
                "reason": "Overused in recent decisions"
            }

        return mitigation

    @staticmethod
    def mitigate_confirmation_bias(
        hypothesis: str
    ) -> Dict[str, Any]:
        """
        Mitigate confirmation bias by forcing balanced investigation.

        Strategy: Require agent to actively seek disconfirming evidence.
        """

        mitigation = {
            "strategy": "balanced_investigation",
            "requirements": {
                "min_disconfirming_evidence": 3,
                "evidence_ratio": "40-60% split between confirming/disconfirming",
                "mandate": "Actively seek evidence that could disprove hypothesis"
            },
            "prompt_addition": f"""
CRITICAL: You must investigate both supporting AND contradicting evidence for: {hypothesis}

Required:
1. Find at least 3 pieces of evidence that SUPPORT the hypothesis
2. Find at least 3 pieces of evidence that CONTRADICT the hypothesis
3. Evaluate both sides fairly before concluding
4. If you cannot find contradicting evidence, explain why it might not exist

Do NOT only seek confirming evidence.
"""
        }

        return mitigation


# Fairness metrics for agent decisions
class FairnessMetrics:
    """
    Calculate fairness metrics for agent decisions across groups.
    """

    @staticmethod
    def demographic_parity(
        decisions: Dict[str, List[bool]],  # group -> list of positive decisions
    ) -> Dict[str, float]:
        """
        Calculate demographic parity across groups.

        Demographic parity: P(positive|group A) ≈ P(positive|group B)

        Returns:
            rates: Positive decision rate per group
        """

        rates = {}
        for group, group_decisions in decisions.items():
            if not group_decisions:
                rates[group] = 0.0
            else:
                positive_rate = sum(group_decisions) / len(group_decisions)
                rates[group] = positive_rate

        return rates

    @staticmethod
    def disparate_impact_ratio(
        rates: Dict[str, float],
        reference_group: str
    ) -> Dict[str, float]:
        """
        Calculate disparate impact ratio.

        Ratio of positive rate for group vs. reference group.
        Value < 0.8 indicates potential bias.

        Returns:
            ratios: Disparate impact ratio per group
        """

        reference_rate = rates.get(reference_group, 1.0)
        if reference_rate == 0:
            return {}

        ratios = {}
        for group, rate in rates.items():
            if group != reference_group:
                ratios[group] = rate / reference_rate

        return ratios
```

_See full implementation with all bias detection methods, mitigation strategies, and examples in the production codebase._

### 5.2 Bias Mitigation Playbook

```yaml
# Comprehensive bias mitigation strategies
bias_mitigation_strategies:
  diverse_training_data:
    problem: 'LLM trained on biased data'
    solution: 'Use diverse, representative training data'
    techniques:
      - Audit training data for representation
      - Include examples from diverse contexts
      - Balance positive/negative examples
      - Remove or reweight biased samples

  prompt_debiasing:
    problem: 'Prompt reinforces biases'
    solution: 'Include explicit debiasing instructions'
    example_debiased_prompt: |
      Analyze this code for security issues.

      IMPORTANT:
      - Consider both common and uncommon vulnerabilities
      - Don't assume security based on framework/language
      - Check for issues even if code looks professional
      - Verify don't just trust - assume nothing is secure

  ensemble_decisions:
    problem: 'Single agent may have systematic bias'
    solution: 'Use multiple agents with different approaches'
    implementation:
      - Agent A: Conservative approach
      - Agent B: Aggressive approach
      - Agent C: Balanced approach
      - Final decision: Consensus or voting

  human_bias_checks:
    problem: 'Automated bias detection has limits'
    solution: 'Regular human review of agent decisions'
    review_schedule:
      daily: 'Sample 10 decisions, check for patterns'
      weekly: 'Statistical analysis of decision distribution'
      monthly: 'Deep dive on fairness metrics'

  counterfactual_testing:
    problem: 'Hard to detect subtle biases'
    solution: 'Test agent with counterfactual examples'
    methodology:
      - Create pairs of nearly identical inputs
      - Change only one factor (e.g., naming style)
      - Agent decisions should be identical
      - If different, indicates bias on that factor

fairness_monitoring:
  metrics:
    - Decision distribution across groups
    - Disparate impact ratios
    - Selection bias indicators
    - Confirmation bias patterns

  thresholds:
    disparate_impact: '>= 0.8 (80% rule)'
    selection_variance: '< 20% from expected'
    confirmation_rate: '< 80% confirming evidence'

  reporting:
    frequency: 'Weekly fairness reports'
    escalation: 'Any metric outside threshold'
    review: 'Monthly bias audit with stakeholders'
```

---

## 6. Compliance & Audit Trails

### 6.1 Comprehensive Audit Logging

```python
"""
Production-grade audit logging for agent systems.
Ensures complete traceability and regulatory compliance.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum
import json
import hashlib


class EventType(Enum):
    """Types of auditable events"""
    AGENT_STARTED = "agent_started"
    AGENT_STOPPED = "agent_stopped"
    DECISION_MADE = "decision_made"
    ACTION_EXECUTED = "action_executed"
    APPROVAL_REQUESTED = "approval_requested"
    APPROVAL_GRANTED = "approval_granted"
    APPROVAL_REJECTED = "approval_rejected"
    GUARDRAIL_VIOLATED = "guardrail_violated"
    ERROR_OCCURRED = "error_occurred"
    DATA_ACCESSED = "data_accessed"
    DATA_MODIFIED = "data_modified"
    SECURITY_EVENT = "security_event"


@dataclass
class AuditEvent:
    """Single audit log entry with tamper detection"""
    event_id: str
    timestamp: datetime
    event_type: EventType
    agent_id: str
    agent_version: str
    user_id: Optional[str]
    session_id: str
    action: str
    parameters: Dict[str, Any]
    result: Optional[Any]
    success: bool
    reasoning: Optional[str] = None
    confidence: Optional[float] = None
    data_accessed: List[str] = field(default_factory=list)
    data_modified: List[str] = field(default_factory=list)
    sensitive_data: bool = False
    duration_ms: Optional[int] = None
    cost_cents: Optional[int] = None
    checksum: str = field(default="")

    def __post_init__(self):
        """Calculate checksum for tamper detection"""
        if not self.checksum:
            self.checksum = self._calculate_checksum()

    def _calculate_checksum(self) -> str:
        """Calculate SHA-256 checksum of event data"""
        data = {k: v for k, v in asdict(self).items() if k != 'checksum'}
        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(data_str.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Verify event hasn't been tampered with"""
        return self.checksum == self._calculate_checksum()


class AuditLogger:
    """
    Comprehensive audit logging system.

    Features:
    - Tamper-proof logging
    - Full traceability
    - Compliance reporting
    - Retention management
    """

    def __init__(self):
        self.events: List[AuditEvent] = []

    def log_event(
        self,
        event_type: EventType,
        agent_id: str,
        agent_version: str,
        action: str,
        parameters: Dict[str, Any],
        result: Optional[Any] = None,
        success: bool = True,
        **kwargs
    ) -> AuditEvent:
        """Log an auditable event"""

        import uuid

        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            event_type=event_type,
            agent_id=agent_id,
            agent_version=agent_version,
            user_id=kwargs.get('user_id'),
            session_id=kwargs.get('session_id', str(uuid.uuid4())),
            action=action,
            parameters=parameters,
            result=result,
            success=success,
            reasoning=kwargs.get('reasoning'),
            confidence=kwargs.get('confidence'),
            data_accessed=kwargs.get('data_accessed', []),
            data_modified=kwargs.get('data_modified', []),
            sensitive_data=kwargs.get('sensitive_data', False),
            duration_ms=kwargs.get('duration_ms'),
            cost_cents=kwargs.get('cost_cents')
        )

        self.events.append(event)
        return event

    def generate_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate compliance report for auditors"""

        events = [e for e in self.events if start_date <= e.timestamp <= end_date]

        # Sensitive data access
        sensitive_events = [e for e in events if e.sensitive_data]

        # Guardrail violations
        violations = [
            e for e in events
            if e.event_type == EventType.GUARDRAIL_VIOLATED
        ]

        # Security events
        security_events = [
            e for e in events
            if e.event_type == EventType.SECURITY_EVENT
        ]

        # Data integrity
        integrity_valid = all(e.verify_integrity() for e in self.events)

        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_events": len(events),
                "sensitive_data_accesses": len(sensitive_events),
                "guardrail_violations": len(violations),
                "security_events": len(security_events)
            },
            "integrity": {
                "all_events_valid": integrity_valid
            }
        }
```

_See full implementation with querying, event chains, and storage backends in the production codebase._

### 6.2 Regulatory Compliance Requirements

```yaml
# Compliance frameworks for agent systems
compliance_frameworks:
  gdpr: # General Data Protection Regulation (EU)
    requirements:
      - right_to_explanation: 'Users can request explanation of automated decisions'
      - data_minimization: 'Only collect/process necessary data'
      - purpose_limitation: 'Use data only for stated purpose'
      - storage_limitation: "Don't keep data longer than necessary"

    implementation:
      audit_logs:
        retention: '7 years minimum'
        fields: [timestamp, agent_id, action, data_accessed, user_consent]
      explanations:
        method: 'Log agent reasoning for all decisions'
        format: 'Human-readable explanation available on request'

  hipaa: # Health Insurance Portability and Accountability Act (US)
    requirements:
      - access_controls: 'Restrict PHI access to authorized agents only'
      - audit_trails: 'Log all PHI access with user identification'
      - encryption: 'Encrypt PHI at rest and in transit'

    implementation:
      phi_handling:
        identification: 'Tag all PHI data'
        access_control: 'Role-based access for agents'
        audit: 'Log every PHI read/write with justification'

  sox: # Sarbanes-Oxley Act (US Financial)
    requirements:
      - change_control: 'Document all system changes'
      - access_logs: 'Audit trail of financial data access'
      - segregation_of_duties: 'Separate agent roles'
      - retention: 'Retain records 7 years'

    implementation:
      financial_data:
        access_control: 'Strict agent authorization'
        audit: 'Complete audit trail of all access'
        changes: 'Require approval for modifications'

audit_requirements:
  minimum_retention:
    gdpr: '7 years'
    hipaa: '6 years'
    sox: '7 years'

  required_fields:
    - timestamp (immutable)
    - agent_id
    - action_performed
    - result
    - user_id (if applicable)
    - data_accessed
    - success/failure

  reporting:
    frequency:
      - Real-time monitoring dashboards
      - Weekly compliance summaries
      - Quarterly compliance audits
      - Annual regulatory reports
```

---

## 7. Responsible Autonomy Levels

### 7.1 Autonomy Classification Framework

```python
"""
Framework for classifying and managing agent autonomy levels.
Based on SAE automation levels adapted for AI agents.
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Any


class AutonomyLevel(Enum):
    """Levels of agent autonomy"""
    LEVEL_0_MANUAL = 0       # No autonomy - human does everything
    LEVEL_1_ASSISTED = 1     # Agent suggests, human executes
    LEVEL_2_PARTIAL = 2      # Agent executes simple tasks, human oversees
    LEVEL_3_CONDITIONAL = 3  # Agent handles most tasks, escalates edge cases
    LEVEL_4_HIGH = 4         # Agent fully autonomous in defined domain
    LEVEL_5_FULL = 5         # Agent fully autonomous across all domains


@dataclass
class AutonomyPolicy:
    """Policy defining autonomy level for specific operations"""
    operation_category: str
    autonomy_level: AutonomyLevel
    description: str
    requirements: List[str]
    restrictions: List[str]
    escalation_conditions: List[str]
    approval_required: bool


class AutonomyManager:
    """Manages agent autonomy levels and approval requirements"""

    def __init__(self):
        self.policies: Dict[str, AutonomyPolicy] = {}
        self._initialize_default_policies()

    def _initialize_default_policies(self):
        """Set up default autonomy policies for QA agents"""

        # LEVEL 1: Code review - agent suggests only
        self.policies["code_review"] = AutonomyPolicy(
            operation_category="code_review",
            autonomy_level=AutonomyLevel.LEVEL_1_ASSISTED,
            description="Agent analyzes code and suggests improvements",
            requirements=["Provide detailed reasoning", "Include examples"],
            restrictions=["Cannot modify code", "Cannot approve/reject PRs"],
            escalation_conditions=[],
            approval_required=False
        )

        # LEVEL 3: Test maintenance - conditional autonomy
        self.policies["test_maintenance"] = AutonomyPolicy(
            operation_category="test_maintenance",
            autonomy_level=AutonomyLevel.LEVEL_3_CONDITIONAL,
            description="Agent fixes flaky tests and updates selectors",
            requirements=["Verify fix doesn't reduce coverage", "Run test 5 times"],
            restrictions=["Cannot change test assertions", "Cannot remove coverage"],
            escalation_conditions=["Fix confidence < 0.7", "Test failure indicates real bug"],
            approval_required=False
        )

        # LEVEL 2: Deployment - requires approval
        self.policies["deployment"] = AutonomyPolicy(
            operation_category="deployment",
            autonomy_level=AutonomyLevel.LEVEL_2_PARTIAL,
            description="Agent prepares deployment, human approves",
            requirements=["All tests passing", "No critical security issues"],
            restrictions=["Cannot deploy without approval", "Cannot skip safety checks"],
            escalation_conditions=["Tests failing", "Security vulnerabilities found"],
            approval_required=True
        )

    def requires_approval(self, operation: str) -> bool:
        """Check if operation requires human approval"""
        policy = self.policies.get(operation)
        return policy.approval_required if policy else True


def get_autonomy_recommendation(
    task_complexity: str,
    risk_level: str,
    confidence: float,
    has_rollback: bool,
    impact_scope: str
) -> AutonomyLevel:
    """
    Recommend appropriate autonomy level for a task.

    Args:
        task_complexity: simple, medium, complex
        risk_level: low, medium, high, critical
        confidence: 0.0 to 1.0
        has_rollback: Whether action is reversible
        impact_scope: local, team, org, customer

    Returns:
        Recommended autonomy level
    """

    # Critical risk OR customer impact → Always require approval
    if risk_level == "critical" or impact_scope == "customer":
        return AutonomyLevel.LEVEL_1_ASSISTED

    # High risk → Conditional autonomy at best
    if risk_level == "high":
        if confidence >= 0.9 and has_rollback:
            return AutonomyLevel.LEVEL_3_CONDITIONAL
        else:
            return AutonomyLevel.LEVEL_2_PARTIAL

    # Medium risk
    if risk_level == "medium":
        if confidence >= 0.8 and has_rollback and task_complexity != "complex":
            return AutonomyLevel.LEVEL_4_HIGH
        elif confidence >= 0.7:
            return AutonomyLevel.LEVEL_3_CONDITIONAL
        else:
            return AutonomyLevel.LEVEL_2_PARTIAL

    # Low risk
    if risk_level == "low":
        if confidence >= 0.7 and impact_scope == "local":
            return AutonomyLevel.LEVEL_4_HIGH
        else:
            return AutonomyLevel.LEVEL_3_CONDITIONAL

    # Default: partial autonomy
    return AutonomyLevel.LEVEL_2_PARTIAL
```

### 7.2 Autonomy Decision Matrix

```yaml
# Comprehensive autonomy decision matrix
autonomy_matrix:
  level_5_full: # Rarely appropriate
    conditions:
      risk: low
      confidence: '>= 0.95'
      reversible: true
      impact: local
    examples: [running tests, analyzing logs, generating reports]

  level_4_high: # Autonomous in defined domain
    conditions:
      risk: [low, medium]
      confidence: '>= 0.85'
      reversible: true
      impact: [local, team]
    examples: [updating test selectors, fixing flaky tests, retry builds]

  level_3_conditional: # Handles most, escalates edge cases
    conditions:
      risk: [low, medium, high]
      confidence: '>= 0.70'
      reversible: true
      impact: [local, team, org]
    examples: [creating tests, staging deployments, non-critical fixes]
    escalation: 'On failure or uncertainty'

  level_2_partial: # Prepares, human executes
    conditions:
      risk: [medium, high]
      confidence: '>= 0.60'
      impact: [team, org]
    examples: [code changes, API changes, security patches]
    approval: 'Required before execution'

  level_1_assisted: # Suggests only
    conditions:
      risk: [high, critical]
      impact: [org, customer]
    examples: [prod deployments, security incidents, data deletion]
    control: 'Human in full control'

  level_0_manual: # No agent involvement
    conditions:
      risk: critical
      regulatory: true
      irreversible: true
    examples: [customer data deletion, compliance decisions, legal matters]

autonomy_transitions:
  increase_autonomy:
    conditions:
      - success_rate: '> 95%'
      - zero_critical_failures: '30 days'
      - override_rate: '< 5%'
    process: ['Propose', '30-day trial', 'Monitor', 'Approve']

  decrease_autonomy:
    conditions:
      - success_rate: '< 85%'
      - critical_failure: 'any in 30 days'
      - override_rate: '> 20%'
    process: ['Immediate reduction', 'Root cause analysis', 'Remediation']

  emergency_shutdown:
    triggers: [security_incident, data_corruption, repeated_failures, compliance_violation]
    actions: ['Disable agent', 'Alert team', 'Preserve state', 'Require human re-enable']
```

---

## 8. Production Safety Checklist

### 8.1 Pre-Deployment Verification

```markdown
# Agent System Production Readiness Checklist

## 1. Safety & Guardrails ✅

- [ ] Guardrail system implemented with action policies
- [ ] Forbidden pattern detection configured
- [ ] Rate limiting enabled for all agents
- [ ] Cost limits set per action and per period
- [ ] Sandbox execution environment configured
- [ ] Circuit breakers implemented
- [ ] Emergency shutdown mechanism tested

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 2. Human Oversight ✅

- [ ] Approval workflow system implemented
- [ ] Escalation procedures defined
- [ ] HITL patterns for critical decisions
- [ ] Autonomy policies defined for all operations
- [ ] Override capability available

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 3. Failure Prevention ✅

- [ ] Hallucination detection implemented
- [ ] Infinite loop detection configured
- [ ] Cascade failure monitoring enabled
- [ ] Recovery procedures tested
- [ ] Rollback procedures validated

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 4. Cost Management ✅

- [ ] Budget limits set (hourly, daily, monthly)
- [ ] Cost tracking system implemented
- [ ] Budget alerts configured (80%, 95%, 100%)
- [ ] Cost optimization strategies applied
- [ ] ROI tracking implemented

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 5. Bias & Fairness ✅

- [ ] Bias detection framework implemented
- [ ] Mitigation strategies in place
- [ ] Fairness metrics defined and tracked
- [ ] Regular bias audits scheduled

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 6. Compliance & Audit ✅

- [ ] Comprehensive audit logging implemented
- [ ] Tamper-proof logging configured
- [ ] Regulatory requirements documented
- [ ] Compliance reporting automated
- [ ] Audit trail query API available

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 7. Monitoring & Observability ✅

- [ ] Performance dashboards configured
- [ ] Critical alerts set up
- [ ] Structured logging implemented
- [ ] Reasoning trace capture enabled

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 8. Security ✅

- [ ] Authentication implemented
- [ ] Role-based access control configured
- [ ] Data encryption enabled (at rest & in transit)
- [ ] Security event logging enabled
- [ ] Incident response plan ready

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 9. Testing & Validation ✅

- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Safety tests passing (guardrails, malicious inputs)
- [ ] Performance tests completed
- [ ] Load testing completed

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 10. Documentation ✅

- [ ] System architecture documented
- [ ] Runbook created
- [ ] Troubleshooting guide available
- [ ] User guide created
- [ ] Training materials prepared

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 11. Team Readiness ✅

- [ ] Team trained on agent system
- [ ] On-call rotation established
- [ ] Responsibilities assigned
- [ ] Communication plan ready

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## 12. Rollout Strategy ✅

- [ ] Phased rollout plan (staging → canary → full)
- [ ] Success criteria defined per phase
- [ ] Rollback procedures tested
- [ ] Monitoring increased during rollout

**Sign-off**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

## Final Approval ✅

### Required Approvals

- [ ] **Engineering Lead**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***
- [ ] **QA Lead**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***
- [ ] **Security Officer**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***
- [ ] **Compliance Officer**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***
- [ ] **CTO/VP Engineering**: **\*\*\*\***\_**\*\*\*\*** Date: \***\*\_\*\***

**Production Status**: [ ] READY [ ] NOT READY

**Issues to Address**: ****\*\*****\*\*\*\*****\*\*****\_****\*\*****\*\*\*\*****\*\*****
```

### 8.2 Ongoing Safety Monitoring

```yaml
# Continuous safety monitoring requirements
ongoing_monitoring:
  daily_checks:
    agent_health:
      - Success rate: '> 90%'
      - Error rate: '< 5%'
      - Cost per task: 'Within 10% of baseline'

    safety_metrics:
      - Guardrail violations: '< 5 per day'
      - Human interventions: 'Track and review'
      - Escalations: 'Track resolution time'

    actions:
      - Review dashboard each morning
      - Investigate anomalies
      - Update runbook with new issues

  weekly_reviews:
    performance_trends:
      - Week-over-week metrics comparison
      - Cost trends analysis
      - Efficiency improvements

    safety_analysis:
      - Review all guardrail violations
      - Analyze escalation patterns
      - Check bias metrics

    actions:
      - 30-minute team review
      - Update documentation
      - Adjust policies if needed

  monthly_audits:
    comprehensive_review:
      - Full compliance audit
      - Security assessment
      - Bias analysis
      - ROI analysis

    actions:
      - 2-hour review meeting
      - Generate monthly report
      - Present to leadership

  alert_thresholds:
    critical: # Page on-call immediately
      - agent_down: 'Agent not responding'
      - security_incident: 'Security violation'
      - budget_exceeded: 'Monthly budget exceeded'
      - compliance_violation: 'Regulatory violation'

    warning: # Alert during business hours
      - success_rate_low: '< 85%'
      - cost_spike: '2x normal hourly cost'
      - high_escalation_rate: '> 30%'
```

---

## Summary

### Key Takeaways

1. **Safety First**: Guardrails, sandboxing, and circuit breakers are non-negotiable
2. **Human Oversight**: Critical decisions always require human approval
3. **Fail Gracefully**: Detect failures early, have recovery procedures ready
4. **Control Costs**: Set strict budgets and monitor continuously
5. **Detect Bias**: Actively monitor for and mitigate biases
6. **Maintain Compliance**: Comprehensive audit trails are mandatory
7. **Right-Size Autonomy**: Match autonomy level to risk and confidence
8. **Monitor Continuously**: Daily checks, weekly reviews, monthly audits

### Production Safety Formula

```
Safety = Guardrails + Oversight + Monitoring + Response

Where:
- Guardrails prevent dangerous actions
- Oversight ensures human control
- Monitoring detects issues early
- Response fixes problems quickly
```

### Success Criteria

An agent system is production-ready when:

✅ All safety mechanisms tested and verified
✅ Human oversight procedures in place
✅ Comprehensive monitoring configured
✅ Incident response procedures ready
✅ Compliance requirements met
✅ Team trained and prepared
✅ Documentation complete
✅ Rollback procedures tested

---

## Resources

### Standards & Frameworks

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [ISO/IEC 23894:2023 - AI Risk Management](https://www.iso.org/standard/77304.html)
- [EU AI Act - High-Risk AI Systems](https://artificialintelligenceact.eu/)
- [GDPR Compliance for AI](https://gdpr.eu/)

### Research Papers

- "Concrete Problems in AI Safety" (Amodei et al., 2016)
- "AI Safety via Debate" (Irving et al., 2018)
- "Specification gaming: the flip side of AI ingenuity" (DeepMind, 2020)

### Tools

- [LangSmith](https://www.langchain.com/langsmith) - LLM observability
- [Helicone](https://www.helicone.ai/) - Cost tracking
- [Guardrails AI](https://www.guardrailsai.com/) - Output validation

---

## Related Documentation

- [Agentic Fundamentals](agentic-fundamentals.md) - Core agent concepts
- [Multi-Agent Systems](multi-agent-systems.md) - Agent orchestration
- [Building QA Agent Workflows](building-qa-agent-workflows.md) - Implementation guide
- [AI in Quality Assurance](../15-ai-in-quality-assurance/15-README.md) - AI QA foundations

---

**Remember**: "With great automation comes great responsibility." Never deploy autonomous agents without proper safety measures, human oversight, and continuous monitoring.

**Status**: ✅ Complete - Comprehensive ethics and safety framework (1,200+ lines)

**Last Updated**: October 2024

**Next Review**: January 2025
