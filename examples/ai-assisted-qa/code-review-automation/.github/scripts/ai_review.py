#!/usr/bin/env python3
"""
AI Code Review Script for GitHub Actions

This script is called by the GitHub Actions workflow to perform
AI-powered code review on changed files in a pull request.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import List, Dict

# Add parent directory to path to import ai_code_reviewer
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ai_code_reviewer import AICodeReviewer, ReviewResult, Severity, format_review_for_github


def detect_language(file_path: str) -> str:
    """Detect programming language from file extension"""
    extension_map = {
        '.py': 'Python',
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.jsx': 'JavaScript',
        '.java': 'Java',
        '.go': 'Go',
        '.rb': 'Ruby',
        '.php': 'PHP',
        '.cs': 'C#',
        '.cpp': 'C++',
        '.c': 'C',
        '.rs': 'Rust',
        '.swift': 'Swift',
        '.kt': 'Kotlin',
    }

    ext = Path(file_path).suffix
    return extension_map.get(ext, 'Unknown')


def read_file_content(file_path: str) -> str:
    """Read file content safely"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""


def review_files(files: List[str]) -> Dict:
    """
    Review multiple files and aggregate results

    Args:
        files: List of file paths to review

    Returns:
        Dictionary with aggregated review results
    """
    reviewer = AICodeReviewer()

    all_comments = []
    total_score = 0
    num_files = 0
    critical_count = 0
    high_count = 0

    for file_path in files:
        if not os.path.exists(file_path):
            print(f"⚠️  Skipping {file_path} (not found)")
            continue

        language = detect_language(file_path)
        if language == 'Unknown':
            print(f"⚠️  Skipping {file_path} (unknown language)")
            continue

        print(f"🔍 Reviewing {file_path} ({language})...")

        content = read_file_content(file_path)
        if not content:
            continue

        try:
            result = reviewer.review_code(
                code=content,
                language=language,
                context=f"File: {file_path}"
            )

            # Aggregate results
            total_score += result.overall_score
            num_files += 1

            # Prefix comments with file path
            for comment in result.comments:
                comment.message = f"**{file_path}:{comment.line_number}** - {comment.message}"
                all_comments.append(comment)

                if comment.severity == Severity.CRITICAL:
                    critical_count += 1
                elif comment.severity == Severity.HIGH:
                    high_count += 1

            print(f"✅ Reviewed {file_path}: Score {result.overall_score}/100, {len(result.comments)} issues")

        except Exception as e:
            print(f"❌ Error reviewing {file_path}: {e}")
            continue

    if num_files == 0:
        return {
            'overall_score': 100,
            'total_files': 0,
            'comments': [],
            'critical_issues': 0,
            'high_issues': 0,
            'approval_recommended': True,
            'summary': 'No files to review'
        }

    avg_score = total_score // num_files

    return {
        'overall_score': avg_score,
        'total_files': num_files,
        'comments': all_comments,
        'critical_issues': critical_count,
        'high_issues': high_count,
        'approval_recommended': critical_count == 0 and avg_score >= 70,
        'summary': f'Reviewed {num_files} file(s). Found {len(all_comments)} total issues.'
    }


def generate_review_comment(results: Dict) -> str:
    """Generate markdown comment for GitHub PR"""

    output = "## 🤖 AI Code Review Results\n\n"

    # Score badge
    score = results['overall_score']
    if score >= 90:
        badge = "🟢"
    elif score >= 70:
        badge = "🟡"
    else:
        badge = "🔴"

    output += f"{badge} **Overall Score:** {score}/100\n\n"

    # Recommendation
    if results['approval_recommended']:
        output += "✅ **Recommendation:** Approved with suggestions\n\n"
    else:
        output += "❌ **Recommendation:** Changes requested\n\n"

    # Summary
    output += f"**Files Reviewed:** {results['total_files']}\n"
    output += f"**Total Issues:** {len(results['comments'])}\n"

    if results['critical_issues'] > 0:
        output += f"**🔴 Critical Issues:** {results['critical_issues']}\n"

    if results['high_issues'] > 0:
        output += f"**🟠 High Priority Issues:** {results['high_issues']}\n"

    output += "\n---\n\n"

    # Group comments by severity
    if results['comments']:
        critical = [c for c in results['comments'] if c.severity == Severity.CRITICAL]
        high = [c for c in results['comments'] if c.severity == Severity.HIGH]
        medium = [c for c in results['comments'] if c.severity == Severity.MEDIUM]
        low = [c for c in results['comments'] if c.severity == Severity.LOW]

        if critical:
            output += "### 🔴 Critical Issues\n\n"
            for comment in critical:
                output += f"- {comment.message}\n"
                if comment.suggestion:
                    output += f"  💡 *{comment.suggestion}*\n"
                output += "\n"

        if high:
            output += "### 🟠 High Priority Issues\n\n"
            for comment in high:
                output += f"- {comment.message}\n"
                if comment.suggestion:
                    output += f"  💡 *{comment.suggestion}*\n"
                output += "\n"

        if medium:
            output += "### 🟡 Medium Priority Issues\n\n"
            for comment in medium[:5]:  # Limit to 5 to avoid huge comments
                output += f"- {comment.message}\n"
                if comment.suggestion:
                    output += f"  💡 *{comment.suggestion}*\n"
                output += "\n"

            if len(medium) > 5:
                output += f"*...and {len(medium) - 5} more medium priority issues*\n\n"

        if low:
            output += f"### 🔵 Low Priority Issues ({len(low)})\n\n"
            output += "<details>\n<summary>Click to expand</summary>\n\n"
            for comment in low:
                output += f"- {comment.message}\n"
            output += "\n</details>\n\n"

    output += "---\n\n"
    output += "*🤖 Generated by AI Code Reviewer powered by GPT-4*\n"
    output += "*This review is automated and should be used as guidance. Human review is still recommended.*"

    return output


def main():
    parser = argparse.ArgumentParser(description='AI Code Review for GitHub Actions')
    parser.add_argument('--files', required=True, help='Comma-separated list of files to review')
    parser.add_argument('--pr-number', required=True, help='Pull request number')
    parser.add_argument('--repo', required=True, help='Repository (owner/repo)')
    args = parser.parse_args()

    # Parse files
    files = [f.strip() for f in args.files.split(',') if f.strip()]

    if not files:
        print("No files to review")
        sys.exit(0)

    print(f"📝 Starting AI code review for PR #{args.pr_number}")
    print(f"📁 Files to review: {len(files)}")

    # Run review
    results = review_files(files)

    # Convert ReviewComment objects to dicts for JSON serialization
    results_json = {
        'overall_score': results['overall_score'],
        'total_files': results['total_files'],
        'critical_issues': results['critical_issues'],
        'high_issues': results['high_issues'],
        'approval_recommended': results['approval_recommended'],
        'summary': results['summary']
    }

    # Save results
    with open('/tmp/review_result.json', 'w') as f:
        json.dump(results_json, f, indent=2)

    # Generate and save comment
    comment = generate_review_comment(results)
    with open('/tmp/review_comment.md', 'w') as f:
        f.write(comment)

    print("\n" + "=" * 80)
    print("REVIEW SUMMARY")
    print("=" * 80)
    print(f"Score: {results['overall_score']}/100")
    print(f"Files: {results['total_files']}")
    print(f"Issues: {len(results['comments'])}")
    print(f"Critical: {results['critical_issues']}")
    print(f"High: {results['high_issues']}")
    print(f"Approval: {'✅ Yes' if results['approval_recommended'] else '❌ No'}")

    # Exit with appropriate code
    if results['critical_issues'] > 0:
        print("\n❌ Review failed: Critical issues found")
        sys.exit(1)

    if results['overall_score'] < 70:
        print(f"\n❌ Review failed: Score {results['overall_score']} below threshold (70)")
        sys.exit(1)

    print("\n✅ Review passed")
    sys.exit(0)


if __name__ == '__main__':
    main()
