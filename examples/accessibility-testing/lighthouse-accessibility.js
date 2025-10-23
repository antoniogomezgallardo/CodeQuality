/**
 * Lighthouse Accessibility Automation
 *
 * This script demonstrates programmatic Lighthouse testing focused on
 * accessibility audits. It generates detailed reports and validates
 * accessibility scores against thresholds.
 *
 * @see https://github.com/GoogleChrome/lighthouse
 * @see https://web.dev/accessibility-scoring/
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

/**
 * Lighthouse configuration optimized for accessibility testing
 */
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['accessibility', 'best-practices', 'seo'],
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    formFactor: 'desktop',
    // Run multiple times for consistency
    auditMode: false,
  },
};

/**
 * URLs to test with expected minimum scores
 */
const testUrls = [
  {
    url: 'https://example.com',
    name: 'Homepage',
    minAccessibilityScore: 90,
    minBestPractices: 80,
  },
  {
    url: 'https://example.com/products',
    name: 'Products Page',
    minAccessibilityScore: 90,
    minBestPractices: 80,
  },
  {
    url: 'https://example.com/checkout',
    name: 'Checkout Page',
    minAccessibilityScore: 95,
    minBestPractices: 85,
  },
];

/**
 * Launch Chrome and run Lighthouse audit
 */
async function runLighthouse(url, config) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
  });

  const options = {
    logLevel: 'info',
    output: ['html', 'json'],
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options, config);
    await chrome.kill();
    return runnerResult;
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

/**
 * Analyze accessibility audit results
 */
function analyzeAccessibilityResults(lhr) {
  const accessibility = lhr.categories.accessibility;
  const auditRefs = accessibility.auditRefs;

  const results = {
    score: accessibility.score * 100,
    passed: [],
    failed: [],
    notApplicable: [],
    manual: [],
  };

  auditRefs.forEach(auditRef => {
    const audit = lhr.audits[auditRef.id];

    const auditInfo = {
      id: audit.id,
      title: audit.title,
      description: audit.description,
      score: audit.score,
      displayValue: audit.displayValue,
      details: audit.details,
    };

    if (audit.scoreDisplayMode === 'manual') {
      results.manual.push(auditInfo);
    } else if (audit.scoreDisplayMode === 'notApplicable') {
      results.notApplicable.push(auditInfo);
    } else if (audit.score === null || audit.score < 1) {
      results.failed.push(auditInfo);
    } else {
      results.passed.push(auditInfo);
    }
  });

  return results;
}

/**
 * Generate detailed accessibility report
 */
function generateReport(testResult, results, reportDir) {
  const { url, name } = testResult;
  const { lhr } = results;

  const analysis = analyzeAccessibilityResults(lhr);

  const report = {
    metadata: {
      url,
      name,
      timestamp: new Date().toISOString(),
      fetchTime: lhr.fetchTime,
      lighthouseVersion: lhr.lighthouseVersion,
      userAgent: lhr.userAgent,
    },
    scores: {
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    },
    accessibility: {
      passed: analysis.passed.length,
      failed: analysis.failed.length,
      manual: analysis.manual.length,
      notApplicable: analysis.notApplicable.length,
    },
    failedAudits: analysis.failed.map(audit => ({
      id: audit.id,
      title: audit.title,
      description: audit.description,
      impact: getImpactLevel(audit),
      details: formatAuditDetails(audit.details),
    })),
    manualAudits: analysis.manual.map(audit => ({
      id: audit.id,
      title: audit.title,
      description: audit.description,
    })),
    recommendations: generateRecommendations(analysis.failed),
  };

  // Save JSON report
  const reportPath = path.join(reportDir, `${name.replace(/\s+/g, '-').toLowerCase()}-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save HTML report
  const htmlPath = path.join(reportDir, `${name.replace(/\s+/g, '-').toLowerCase()}-report.html`);
  fs.writeFileSync(htmlPath, results.report[0]);

  console.log(`\n📊 Report saved: ${reportPath}`);

  return report;
}

/**
 * Get impact level from audit
 */
function getImpactLevel(audit) {
  if (audit.details && audit.details.items) {
    const items = audit.details.items;
    if (items.some(item => item.impact === 'critical')) return 'critical';
    if (items.some(item => item.impact === 'serious')) return 'serious';
    if (items.some(item => item.impact === 'moderate')) return 'moderate';
    return 'minor';
  }
  return 'unknown';
}

/**
 * Format audit details for report
 */
function formatAuditDetails(details) {
  if (!details || !details.items) return [];

  return details.items.slice(0, 5).map(item => {
    if (item.node) {
      return {
        selector: item.node.selector,
        snippet: item.node.snippet,
        explanation: item.node.explanation,
      };
    }
    return item;
  });
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(failedAudits) {
  const recommendations = [];

  const auditRecommendations = {
    'aria-allowed-attr': 'Remove invalid ARIA attributes from elements',
    'aria-required-attr': 'Add required ARIA attributes to elements with ARIA roles',
    'aria-valid-attr-value': 'Ensure ARIA attributes have valid values',
    'button-name': 'Ensure buttons have discernible text',
    'color-contrast': 'Ensure text has sufficient color contrast (4.5:1 for normal, 3:1 for large)',
    'document-title': 'Add a descriptive <title> element to the document',
    'html-has-lang': 'Ensure <html> element has a lang attribute',
    'image-alt': 'Add alt text to all images',
    label: 'Ensure form elements have associated labels',
    'link-name': 'Ensure links have discernible text',
    list: 'Ensure lists only contain <li> elements',
    listitem: 'Ensure list items are contained within parent lists',
    'meta-viewport': 'Add a <meta name="viewport"> tag with appropriate zoom settings',
    tabindex: 'Avoid using tabindex values greater than 0',
  };

  failedAudits.forEach(audit => {
    if (auditRecommendations[audit.id]) {
      recommendations.push({
        audit: audit.id,
        title: audit.title,
        recommendation: auditRecommendations[audit.id],
      });
    }
  });

  return recommendations;
}

/**
 * Validate scores against thresholds
 */
function validateScores(testResult, report) {
  const failures = [];

  if (report.scores.accessibility < testResult.minAccessibilityScore) {
    failures.push(
      `Accessibility score ${report.scores.accessibility} is below threshold ${testResult.minAccessibilityScore}`
    );
  }

  if (testResult.minBestPractices && report.scores.bestPractices < testResult.minBestPractices) {
    failures.push(
      `Best Practices score ${report.scores.bestPractices} is below threshold ${testResult.minBestPractices}`
    );
  }

  return failures;
}

/**
 * Print summary to console
 */
function printSummary(testResult, report) {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 ${report.metadata.name} - Accessibility Report`);
  console.log('='.repeat(60));
  console.log(`URL: ${report.metadata.url}`);
  console.log(`Timestamp: ${report.metadata.timestamp}`);
  console.log('\nScores:');
  console.log(
    `  Accessibility: ${report.scores.accessibility}/100 (minimum: ${testResult.minAccessibilityScore})`
  );
  console.log(`  Best Practices: ${report.scores.bestPractices}/100`);
  console.log(`  SEO: ${report.scores.seo}/100`);
  console.log('\nAccessibility Audits:');
  console.log(`  ✅ Passed: ${report.accessibility.passed}`);
  console.log(`  ❌ Failed: ${report.accessibility.failed}`);
  console.log(`  📝 Manual: ${report.accessibility.manual}`);
  console.log(`  ⊘  Not Applicable: ${report.accessibility.notApplicable}`);

  if (report.failedAudits.length > 0) {
    console.log('\n❌ Failed Audits:');
    report.failedAudits.forEach(audit => {
      console.log(`  • ${audit.title}`);
      console.log(`    Impact: ${audit.impact}`);
      console.log(`    Description: ${audit.description}`);
    });
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec.recommendation}`);
    });
  }

  if (report.manualAudits.length > 0) {
    console.log('\n📝 Manual Checks Required:');
    report.manualAudits.slice(0, 5).forEach(audit => {
      console.log(`  • ${audit.title}`);
    });
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Lighthouse Accessibility Testing...\n');

  // Create reports directory
  const reportDir = path.join(__dirname, 'reports', 'lighthouse');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const allResults = [];
  const allFailures = [];

  // Run tests for each URL
  for (const testUrl of testUrls) {
    console.log(`\n🔍 Testing: ${testUrl.name} (${testUrl.url})`);

    try {
      const results = await runLighthouse(testUrl.url, lighthouseConfig);
      const report = generateReport(testUrl, results, reportDir);

      printSummary(testUrl, report);

      const failures = validateScores(testUrl, report);
      if (failures.length > 0) {
        allFailures.push({
          name: testUrl.name,
          url: testUrl.url,
          failures,
        });
      }

      allResults.push({
        name: testUrl.name,
        url: testUrl.url,
        report,
      });
    } catch (error) {
      console.error(`❌ Error testing ${testUrl.name}:`, error.message);
      allFailures.push({
        name: testUrl.name,
        url: testUrl.url,
        failures: [`Test execution failed: ${error.message}`],
      });
    }
  }

  // Generate summary report
  const summaryReport = {
    timestamp: new Date().toISOString(),
    totalTests: testUrls.length,
    passed: testUrls.length - allFailures.length,
    failed: allFailures.length,
    results: allResults.map(r => ({
      name: r.name,
      url: r.url,
      accessibilityScore: r.report.scores.accessibility,
      failedAudits: r.report.accessibility.failed,
    })),
    failures: allFailures,
  };

  const summaryPath = path.join(reportDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));

  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Final Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${summaryReport.totalTests}`);
  console.log(`Passed: ${summaryReport.passed}`);
  console.log(`Failed: ${summaryReport.failed}`);
  console.log(`\nSummary Report: ${summaryPath}`);
  console.log('='.repeat(60) + '\n');

  // Exit with error code if any tests failed
  if (allFailures.length > 0) {
    console.error('❌ Some tests failed to meet accessibility thresholds\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed accessibility thresholds\n');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for use in other scripts
module.exports = {
  runLighthouse,
  analyzeAccessibilityResults,
  generateReport,
  validateScores,
};
