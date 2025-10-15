"""
AI-Powered Code Review Automation

This module demonstrates how to use AI to automatically review code changes,
detect potential issues, suggest improvements, and ensure code quality standards.

Features:
- Code quality analysis
- Bug detection
- Security vulnerability scanning
- Performance issue identification
- Best practice recommendations
- Style and convention checking
"""

import os
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import openai


class Severity(Enum):
    """Issue severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class Category(Enum):
    """Issue categories"""
    BUG = "bug"
    SECURITY = "security"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"
    STYLE = "style"
    BEST_PRACTICE = "best_practice"
    DOCUMENTATION = "documentation"


@dataclass
class ReviewComment:
    """Represents a code review comment"""
    line_number: int
    severity: Severity
    category: Category
    message: str
    suggestion: Optional[str] = None
    code_snippet: Optional[str] = None


@dataclass
class ReviewResult:
    """Complete review result"""
    overall_score: int  # 0-100
    comments: List[ReviewComment]
    summary: str
    approval_recommended: bool


class AICodeReviewer:
    """
    AI-powered code reviewer using OpenAI API

    Example usage:
        reviewer = AICodeReviewer()
        result = reviewer.review_code(
            code=code_diff,
            language="Python",
            context="This is a user authentication module"
        )
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = openai.OpenAI(api_key=self.api_key)

    def review_code(
        self,
        code: str,
        language: str,
        context: Optional[str] = None,
        focus_areas: Optional[List[Category]] = None
    ) -> ReviewResult:
        """
        Perform comprehensive code review

        Args:
            code: Code to review (can be full file or diff)
            language: Programming language
            context: Additional context about the code
            focus_areas: Specific categories to focus on

        Returns:
            ReviewResult with comments and recommendations
        """
        prompt = self._build_review_prompt(code, language, context, focus_areas)

        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert code reviewer with deep knowledge of software engineering best practices, security, and performance optimization."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2000
        )

        return self._parse_review_response(response.choices[0].message.content)

    def _build_review_prompt(
        self,
        code: str,
        language: str,
        context: Optional[str],
        focus_areas: Optional[List[Category]]
    ) -> str:
        """Build prompt for code review"""

        prompt = f"""You are conducting a comprehensive code review for {language} code.

{"Context: " + context if context else ""}

Code to review:
```{language.lower()}
{code}
```

Please analyze the code and provide:

1. **Overall Assessment**: Brief summary and quality score (0-100)

2. **Issues Found**: For each issue, provide:
   - Line number (if applicable)
   - Severity: critical/high/medium/low/info
   - Category: bug/security/performance/maintainability/style/best_practice/documentation
   - Description of the issue
   - Specific suggestion for improvement
   - Code example of fix (if applicable)

{"Focus specifically on: " + ", ".join([area.value for area in focus_areas]) if focus_areas else ""}

3. **Focus Areas**:"""

        if not focus_areas or Category.BUG in (focus_areas or []):
            prompt += "\n   - **Bugs**: Logic errors, edge cases, null/undefined handling"

        if not focus_areas or Category.SECURITY in (focus_areas or []):
            prompt += "\n   - **Security**: SQL injection, XSS, authentication/authorization, data exposure"

        if not focus_areas or Category.PERFORMANCE in (focus_areas or []):
            prompt += "\n   - **Performance**: Inefficient algorithms, unnecessary operations, memory leaks"

        if not focus_areas or Category.MAINTAINABILITY in (focus_areas or []):
            prompt += "\n   - **Maintainability**: Code complexity, duplication, naming, structure"

        if not focus_areas or Category.STYLE in (focus_areas or []):
            prompt += "\n   - **Style**: Formatting, conventions, consistency"

        if not focus_areas or Category.BEST_PRACTICE in (focus_areas or []):
            prompt += "\n   - **Best Practices**: Design patterns, SOLID principles, language idioms"

        if not focus_areas or Category.DOCUMENTATION in (focus_areas or []):
            prompt += "\n   - **Documentation**: Missing docstrings, unclear comments, outdated docs"

        prompt += """

4. **Recommendation**: Should this code be approved, approved with changes, or rejected?

Format your response as:

SCORE: [0-100]

ISSUES:
[For each issue:]
LINE: [number or "general"]
SEVERITY: [critical/high/medium/low/info]
CATEGORY: [category]
MESSAGE: [description]
SUGGESTION: [how to fix]
CODE: [example fix if applicable]
---

SUMMARY: [brief overall summary]

RECOMMENDATION: [approve/approve_with_changes/reject]
"""

        return prompt

    def _parse_review_response(self, response: str) -> ReviewResult:
        """Parse AI response into structured ReviewResult"""

        # Simple parsing logic (in production, use more robust parsing)
        lines = response.split('\n')

        score = 70  # Default
        comments = []
        summary = ""
        recommendation = "approve_with_changes"

        current_comment = {}

        for line in lines:
            line = line.strip()

            if line.startswith("SCORE:"):
                try:
                    score = int(line.split(":")[1].strip())
                except:
                    pass

            elif line.startswith("LINE:"):
                if current_comment:
                    comments.append(self._create_comment(current_comment))
                current_comment = {"line": line.split(":")[1].strip()}

            elif line.startswith("SEVERITY:"):
                current_comment["severity"] = line.split(":")[1].strip()

            elif line.startswith("CATEGORY:"):
                current_comment["category"] = line.split(":")[1].strip()

            elif line.startswith("MESSAGE:"):
                current_comment["message"] = line.split(":", 1)[1].strip()

            elif line.startswith("SUGGESTION:"):
                current_comment["suggestion"] = line.split(":", 1)[1].strip()

            elif line.startswith("CODE:"):
                current_comment["code"] = line.split(":", 1)[1].strip()

            elif line.startswith("SUMMARY:"):
                summary = line.split(":", 1)[1].strip()

            elif line.startswith("RECOMMENDATION:"):
                recommendation = line.split(":")[1].strip().lower()

            elif line == "---" and current_comment:
                comments.append(self._create_comment(current_comment))
                current_comment = {}

        # Add last comment if exists
        if current_comment:
            comments.append(self._create_comment(current_comment))

        approval = recommendation in ["approve", "approve_with_changes"]

        return ReviewResult(
            overall_score=score,
            comments=comments,
            summary=summary or "Code review completed",
            approval_recommended=approval
        )

    def _create_comment(self, data: Dict) -> ReviewComment:
        """Create ReviewComment from parsed data"""

        try:
            line_num = int(data.get("line", "0"))
        except:
            line_num = 0

        severity = Severity.MEDIUM
        try:
            severity = Severity(data.get("severity", "medium").lower())
        except:
            pass

        category = Category.BUG
        try:
            category = Category(data.get("category", "bug").lower())
        except:
            pass

        return ReviewComment(
            line_number=line_num,
            severity=severity,
            category=category,
            message=data.get("message", "No message"),
            suggestion=data.get("suggestion"),
            code_snippet=data.get("code")
        )

    def review_diff(
        self,
        diff: str,
        language: str,
        focus_on_changes: bool = True
    ) -> ReviewResult:
        """
        Review git diff specifically

        Args:
            diff: Git diff output
            language: Programming language
            focus_on_changes: Only review changed lines

        Returns:
            ReviewResult for the changes
        """
        context = "This is a git diff. " + (
            "Focus only on the changed lines (marked with + or -)."
            if focus_on_changes else
            "Consider the full context."
        )

        return self.review_code(diff, language, context)

    def security_scan(self, code: str, language: str) -> ReviewResult:
        """
        Security-focused code review

        Args:
            code: Code to scan
            language: Programming language

        Returns:
            ReviewResult focusing on security issues
        """
        return self.review_code(
            code,
            language,
            context="Security vulnerability scan",
            focus_areas=[Category.SECURITY]
        )

    def performance_review(self, code: str, language: str) -> ReviewResult:
        """
        Performance-focused code review

        Args:
            code: Code to analyze
            language: Programming language

        Returns:
            ReviewResult focusing on performance
        """
        return self.review_code(
            code,
            language,
            context="Performance optimization review",
            focus_areas=[Category.PERFORMANCE]
        )


def format_review_for_github(result: ReviewResult) -> str:
    """
    Format review result for GitHub PR comment

    Args:
        result: ReviewResult to format

    Returns:
        Markdown-formatted comment
    """
    output = f"## 🤖 AI Code Review\n\n"
    output += f"**Overall Score:** {result.overall_score}/100\n\n"

    if result.approval_recommended:
        output += "✅ **Recommendation:** Approved with suggestions\n\n"
    else:
        output += "❌ **Recommendation:** Changes requested\n\n"

    output += f"**Summary:** {result.summary}\n\n"

    if result.comments:
        output += "---\n\n### Issues Found\n\n"

        # Group by severity
        critical = [c for c in result.comments if c.severity == Severity.CRITICAL]
        high = [c for c in result.comments if c.severity == Severity.HIGH]
        medium = [c for c in result.comments if c.severity == Severity.MEDIUM]
        low = [c for c in result.comments if c.severity == Severity.LOW]

        for severity_name, comments in [
            ("🔴 Critical", critical),
            ("🟠 High", high),
            ("🟡 Medium", medium),
            ("🔵 Low", low)
        ]:
            if comments:
                output += f"\n#### {severity_name}\n\n"
                for comment in comments:
                    output += f"**Line {comment.line_number}** - {comment.category.value.title()}\n"
                    output += f"> {comment.message}\n\n"
                    if comment.suggestion:
                        output += f"💡 **Suggestion:** {comment.suggestion}\n\n"
                    if comment.code_snippet:
                        output += f"```\n{comment.code_snippet}\n```\n\n"

    output += "\n---\n"
    output += "*Generated by AI Code Reviewer*"

    return output


# Example usage
def example_basic_review():
    """Example: Basic code review"""

    code = """
def process_user_data(user_input):
    # Process user data
    data = eval(user_input)  # Parse the input

    users = []
    for i in range(len(data)):
        user = data[i]
        if user['age'] > 18:
            users.append(user)

    # Save to database
    db_conn = get_db_connection()
    cursor = db_conn.cursor()
    for user in users:
        query = f"INSERT INTO users (name, age) VALUES ('{user['name']}', {user['age']})"
        cursor.execute(query)

    return users
"""

    reviewer = AICodeReviewer()

    print("Running code review...")
    result = reviewer.review_code(
        code=code,
        language="Python",
        context="User data processing module"
    )

    print("\n" + "=" * 80)
    print("REVIEW RESULTS")
    print("=" * 80)
    print(f"Score: {result.overall_score}/100")
    print(f"Approval: {'✅ Yes' if result.approval_recommended else '❌ No'}")
    print(f"\nSummary: {result.summary}")
    print(f"\nIssues found: {len(result.comments)}")

    for i, comment in enumerate(result.comments, 1):
        print(f"\n--- Issue {i} ---")
        print(f"Line: {comment.line_number}")
        print(f"Severity: {comment.severity.value}")
        print(f"Category: {comment.category.value}")
        print(f"Message: {comment.message}")
        if comment.suggestion:
            print(f"Suggestion: {comment.suggestion}")

    # Generate GitHub-formatted comment
    print("\n" + "=" * 80)
    print("GITHUB PR COMMENT")
    print("=" * 80)
    print(format_review_for_github(result))

    return result


def example_security_scan():
    """Example: Security-focused review"""

    code = """
from flask import Flask, request

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    # Check credentials
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    result = db.execute(query)

    if result:
        session['user'] = username
        return "Login successful"

    return "Login failed"

@app.route('/user/<user_id>')
def get_user(user_id):
    # Get user data
    with open(f'/var/data/users/{user_id}.json') as f:
        user_data = f.read()

    return user_data
"""

    reviewer = AICodeReviewer()

    print("Running security scan...")
    result = reviewer.security_scan(code, "Python")

    print("\n" + "=" * 80)
    print("SECURITY SCAN RESULTS")
    print("=" * 80)

    for comment in result.comments:
        print(f"\n🔒 Security Issue (Line {comment.line_number})")
        print(f"Severity: {comment.severity.value.upper()}")
        print(f"Issue: {comment.message}")
        if comment.suggestion:
            print(f"Fix: {comment.suggestion}")

    return result


if __name__ == "__main__":
    print("AI Code Reviewer Examples\n")

    print("\n### EXAMPLE 1: Basic Code Review ###\n")
    example_basic_review()

    print("\n\n### EXAMPLE 2: Security Scan ###\n")
    example_security_scan()
