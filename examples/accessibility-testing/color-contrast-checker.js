/**
 * Color Contrast Checker
 *
 * This script automates color contrast checking to ensure compliance with
 * WCAG 2.1 Level AA (4.5:1 for normal text, 3:1 for large text) and
 * Level AAA (7:1 for normal text, 4.5:1 for large text).
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to relative luminance
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
function meetsWCAG(ratio, fontSize, fontWeight) {
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

  return {
    aa: isLargeText ? ratio >= 3 : ratio >= 4.5,
    aaa: isLargeText ? ratio >= 4.5 : ratio >= 7,
    level: isLargeText ? 'large' : 'normal',
    isLargeText,
  };
}

/**
 * Parse CSS color to RGB
 */
function parseColor(colorString) {
  // Handle rgb/rgba
  const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // Handle hex
  if (colorString.startsWith('#')) {
    return hexToRgb(colorString);
  }

  // Handle named colors (simplified - add more as needed)
  const namedColors = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
  };

  return namedColors[colorString.toLowerCase()] || { r: 0, g: 0, b: 0 };
}

/**
 * Scan page for color contrast issues
 */
async function scanPage(url) {
  console.log(`\n🔍 Scanning: ${url}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Extract text elements with their styles
  const textElements = await page.evaluate(() => {
    const elements = [];
    const textTags = [
      'p',
      'span',
      'div',
      'a',
      'button',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'li',
      'td',
      'th',
      'label',
    ];

    function hasVisibleText(element) {
      const text = element.textContent?.trim();
      return text && text.length > 0;
    }

    function getBackgroundColor(element) {
      let el = element;
      let bgColor = window.getComputedStyle(el).backgroundColor;

      // Traverse up the DOM if background is transparent
      while (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        el = el.parentElement;
        if (!el || el === document.body.parentElement) {
          return 'rgb(255, 255, 255)'; // Default to white
        }
        bgColor = window.getComputedStyle(el).backgroundColor;
      }

      return bgColor;
    }

    textTags.forEach(tag => {
      const tagElements = document.querySelectorAll(tag);
      tagElements.forEach(el => {
        if (!hasVisibleText(el)) return;

        // Skip if element is not visible
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const styles = window.getComputedStyle(el);
        if (styles.display === 'none' || styles.visibility === 'hidden') return;

        elements.push({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 50),
          color: styles.color,
          backgroundColor: getBackgroundColor(el),
          fontSize: parseFloat(styles.fontSize),
          fontWeight: parseInt(styles.fontWeight) || 400,
          selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}.${el.className}`,
        });
      });
    });

    return elements;
  });

  await browser.close();

  // Analyze contrast ratios
  const results = textElements.map(element => {
    const fgColor = parseColor(element.color);
    const bgColor = parseColor(element.backgroundColor);
    const ratio = getContrastRatio(fgColor, bgColor);
    const wcag = meetsWCAG(ratio, element.fontSize, element.fontWeight);

    return {
      element,
      ratio: Math.round(ratio * 100) / 100,
      wcag,
      passes: {
        aa: wcag.aa,
        aaa: wcag.aaa,
      },
    };
  });

  return results;
}

/**
 * Generate report
 */
function generateReport(url, results) {
  const failures = {
    aa: results.filter(r => !r.passes.aa),
    aaa: results.filter(r => !r.passes.aaa),
  };

  const report = {
    url,
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passAA: results.length - failures.aa.length,
      failAA: failures.aa.length,
      passAAA: results.length - failures.aaa.length,
      failAAA: failures.aaa.length,
      complianceAA: Math.round(((results.length - failures.aa.length) / results.length) * 100),
      complianceAAA: Math.round(((results.length - failures.aaa.length) / results.length) * 100),
    },
    failures: {
      aa: failures.aa.map(r => ({
        text: r.element.text,
        selector: r.element.selector,
        foreground: r.element.color,
        background: r.element.backgroundColor,
        fontSize: r.element.fontSize,
        fontWeight: r.element.fontWeight,
        ratio: r.ratio,
        required: r.wcag.isLargeText ? 3 : 4.5,
        textSize: r.wcag.level,
      })),
      aaa: failures.aaa.map(r => ({
        text: r.element.text,
        selector: r.element.selector,
        foreground: r.element.color,
        background: r.element.backgroundColor,
        fontSize: r.element.fontSize,
        fontWeight: r.element.fontWeight,
        ratio: r.ratio,
        required: r.wcag.isLargeText ? 4.5 : 7,
        textSize: r.wcag.level,
      })),
    },
  };

  return report;
}

/**
 * Print report to console
 */
function printReport(report) {
  console.log('='.repeat(70));
  console.log('📊 Color Contrast Report');
  console.log('='.repeat(70));
  console.log(`URL: ${report.url}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('\nSummary:');
  console.log(`  Total text elements: ${report.summary.total}`);
  console.log(
    `  WCAG AA compliance: ${report.summary.complianceAA}% (${report.summary.passAA}/${report.summary.total})`
  );
  console.log(
    `  WCAG AAA compliance: ${report.summary.complianceAAA}% (${report.summary.passAAA}/${report.summary.total})`
  );

  if (report.failures.aa.length > 0) {
    console.log('\n❌ WCAG AA Failures:');
    report.failures.aa.slice(0, 10).forEach((failure, index) => {
      console.log(`\n  ${index + 1}. ${failure.selector}`);
      console.log(`     Text: "${failure.text}"`);
      console.log(`     Foreground: ${failure.foreground}`);
      console.log(`     Background: ${failure.background}`);
      console.log(`     Ratio: ${failure.ratio}:1 (Required: ${failure.required}:1)`);
      console.log(`     Font: ${failure.fontSize}px, ${failure.fontWeight} (${failure.textSize})`);
    });

    if (report.failures.aa.length > 10) {
      console.log(`\n  ... and ${report.failures.aa.length - 10} more failures`);
    }
  } else {
    console.log('\n✅ All text passes WCAG AA contrast requirements!');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Generate HTML report
 */
function generateHTMLReport(report, outputPath) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Color Contrast Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .summary-card {
      padding: 15px;
      border-radius: 4px;
      background: #f9f9f9;
    }
    .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #333; }
    .pass { color: #28a745; }
    .fail { color: #dc3545; }
    .failures {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .failure-item {
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin-bottom: 15px;
      background: #fff5f5;
    }
    .color-sample {
      display: inline-block;
      width: 100px;
      height: 30px;
      border: 1px solid #ccc;
      margin: 5px 0;
      border-radius: 4px;
    }
    .ratio {
      font-weight: bold;
      font-size: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    td:first-child {
      font-weight: 600;
      color: #666;
      width: 150px;
    }
  </style>
</head>
<body>
  <h1>🎨 Color Contrast Report</h1>

  <div class="summary">
    <h2>Summary</h2>
    <p><strong>URL:</strong> ${report.url}</p>
    <p><strong>Timestamp:</strong> ${report.timestamp}</p>

    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Elements</h3>
        <div class="value">${report.summary.total}</div>
      </div>
      <div class="summary-card">
        <h3>WCAG AA Compliance</h3>
        <div class="value ${report.summary.complianceAA === 100 ? 'pass' : 'fail'}">
          ${report.summary.complianceAA}%
        </div>
        <div>${report.summary.passAA} / ${report.summary.total} pass</div>
      </div>
      <div class="summary-card">
        <h3>WCAG AAA Compliance</h3>
        <div class="value ${report.summary.complianceAAA === 100 ? 'pass' : 'fail'}">
          ${report.summary.complianceAAA}%
        </div>
        <div>${report.summary.passAAA} / ${report.summary.total} pass</div>
      </div>
    </div>
  </div>

  ${
    report.failures.aa.length > 0
      ? `
  <div class="failures">
    <h2>❌ WCAG AA Failures (${report.failures.aa.length})</h2>
    ${report.failures.aa
      .map(
        (failure, index) => `
      <div class="failure-item">
        <h3>#${index + 1}: ${failure.selector}</h3>
        <table>
          <tr>
            <td>Text Sample</td>
            <td>"${failure.text}"</td>
          </tr>
          <tr>
            <td>Foreground Color</td>
            <td>
              ${failure.foreground}
              <div class="color-sample" style="background: ${failure.foreground};"></div>
            </td>
          </tr>
          <tr>
            <td>Background Color</td>
            <td>
              ${failure.background}
              <div class="color-sample" style="background: ${failure.background};"></div>
            </td>
          </tr>
          <tr>
            <td>Contrast Ratio</td>
            <td>
              <span class="ratio fail">${failure.ratio}:1</span>
              (Required: ${failure.required}:1)
            </td>
          </tr>
          <tr>
            <td>Font Size</td>
            <td>${failure.fontSize}px (${failure.textSize} text)</td>
          </tr>
          <tr>
            <td>Font Weight</td>
            <td>${failure.fontWeight}</td>
          </tr>
        </table>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : `
  <div class="failures">
    <h2>✅ All text passes WCAG AA contrast requirements!</h2>
    <p>No contrast issues detected.</p>
  </div>
  `
  }

  <p style="margin-top: 30px; color: #666; font-size: 14px;">
    Generated by Color Contrast Checker on ${new Date().toLocaleString()}
  </p>
</body>
</html>
  `;

  fs.writeFileSync(outputPath, html);
  console.log(`📄 HTML report saved: ${outputPath}`);
}

/**
 * Main execution
 */
async function main() {
  const urls = ['https://example.com', 'https://example.com/products', 'https://example.com/about'];

  const reportsDir = path.join(__dirname, 'reports', 'contrast');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  console.log('🚀 Starting Color Contrast Analysis...\n');

  const allReports = [];

  for (const url of urls) {
    try {
      const results = await scanPage(url);
      const report = generateReport(url, results);

      printReport(report);

      // Save JSON report
      const urlSlug = url.replace(/https?:\/\//, '').replace(/\//g, '-');
      const jsonPath = path.join(reportsDir, `${urlSlug}-contrast.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

      // Save HTML report
      const htmlPath = path.join(reportsDir, `${urlSlug}-contrast.html`);
      generateHTMLReport(report, htmlPath);

      allReports.push(report);
    } catch (error) {
      console.error(`❌ Error scanning ${url}:`, error.message);
    }
  }

  // Generate summary
  const totalFailures = allReports.reduce((sum, r) => sum + r.failures.aa.length, 0);

  console.log('\n' + '='.repeat(70));
  console.log('📈 Overall Summary');
  console.log('='.repeat(70));
  console.log(`Total URLs scanned: ${allReports.length}`);
  console.log(`Total AA failures: ${totalFailures}`);
  console.log(`Reports directory: ${reportsDir}`);
  console.log('='.repeat(70) + '\n');

  // Exit with error if failures found
  if (totalFailures > 0) {
    console.error('❌ Color contrast issues found\n');
    process.exit(1);
  } else {
    console.log('✅ All pages pass WCAG AA contrast requirements\n');
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
  scanPage,
  generateReport,
  getContrastRatio,
  meetsWCAG,
  parseColor,
};
