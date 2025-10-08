# Security Test Checklist

## Document Information

| Field | Details |
|-------|---------|
| **Application** | [Application Name] |
| **Version** | [Version Number] |
| **Test Date** | YYYY-MM-DD |
| **Tester** | [Name] |
| **Environment** | Development / Staging / Pre-Production |

---

## Table of Contents

1. [OWASP Top 10 (2021)](#owasp-top-10-2021)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Session Management](#session-management)
5. [Encryption & Data Protection](#encryption--data-protection)
6. [API Security](#api-security)
7. [Database Security](#database-security)
8. [File Upload Security](#file-upload-security)
9. [Security Headers](#security-headers)
10. [Dependency Vulnerabilities](#dependency-vulnerabilities)
11. [Infrastructure Security](#infrastructure-security)
12. [Compliance & Privacy](#compliance--privacy)

---

## OWASP Top 10 (2021)

### A01:2021 - Broken Access Control

**Description:** Access control enforces policy such that users cannot act outside of their intended permissions.

#### Tests to Perform

- [ ] **Vertical Privilege Escalation**
  - [ ] Regular user cannot access admin functions
  - [ ] Test direct URL access to admin pages while logged in as regular user
  - [ ] Test API endpoints that should be admin-only
  - [ ] Example: `/admin/users`, `/api/admin/settings`

- [ ] **Horizontal Privilege Escalation**
  - [ ] User A cannot view/modify User B's data
  - [ ] Test by changing user IDs in URLs/requests
  - [ ] Example: `/user/123/profile` → `/user/456/profile`
  - [ ] Test object references in API calls

- [ ] **Insecure Direct Object References (IDOR)**
  - [ ] Sequential ID enumeration is prevented
  - [ ] UUIDs or secure tokens used instead of incremental IDs
  - [ ] Authorization checked on backend, not just frontend

- [ ] **Path Traversal**
  - [ ] Test: `../../etc/passwd` in file paths
  - [ ] Test: URL encoding bypass `..%2F..%2Fetc%2Fpasswd`
  - [ ] File downloads restricted to intended directories

- [ ] **Missing Function Level Access Control**
  - [ ] Hidden/disabled UI elements are also protected on backend
  - [ ] API endpoints verify permissions server-side
  - [ ] Test endpoints with insufficient privileges

**Test Cases:**
```
1. Login as regular user
2. Attempt to access: /admin/dashboard
   Expected: 403 Forbidden or redirect to access denied page

3. Attempt API call: GET /api/v1/admin/users
   Expected: 403 Forbidden with error message

4. Change user ID in URL: /profile/123 → /profile/999
   Expected: 403 or only show own profile
```

**Tools:** Burp Suite, OWASP ZAP, Postman

---

### A02:2021 - Cryptographic Failures

**Description:** Failures related to cryptography (or lack thereof) which often lead to exposure of sensitive data.

#### Tests to Perform

- [ ] **Sensitive Data Exposure**
  - [ ] No sensitive data in URLs (passwords, tokens, SSN)
  - [ ] No sensitive data in logs
  - [ ] No sensitive data in error messages
  - [ ] Response headers don't leak version information

- [ ] **Data in Transit**
  - [ ] HTTPS enforced on all pages (HTTP auto-redirects to HTTPS)
  - [ ] TLS 1.2 or higher used (TLS 1.0/1.1 disabled)
  - [ ] Strong cipher suites configured
  - [ ] Test with: `nmap --script ssl-enum-ciphers -p 443 example.com`

- [ ] **Data at Rest**
  - [ ] Passwords hashed with bcrypt/Argon2 (not MD5/SHA1)
  - [ ] Sensitive data encrypted in database
  - [ ] Database backups encrypted
  - [ ] PII (Personally Identifiable Information) encrypted

- [ ] **Cryptographic Standards**
  - [ ] No hardcoded encryption keys in code
  - [ ] Keys stored securely (environment variables, key management service)
  - [ ] Proper random number generation (not `Math.random()`)
  - [ ] Use of established crypto libraries (not custom crypto)

**Test Cases:**
```
1. Check password storage:
   - Verify passwords are hashed (not plaintext or base64)
   - Verify bcrypt/Argon2 used (salt rounds >= 10)

2. Test HTTPS enforcement:
   - Access: http://example.com
   - Expected: Redirect to https://example.com

3. Check for data leakage:
   - View page source for sensitive data
   - Check browser DevTools Network tab
   - Review error messages for information disclosure
```

**Tools:** SSL Labs, testssl.sh, nmap, Burp Suite

---

### A03:2021 - Injection

**Description:** Untrusted data is sent to an interpreter as part of a command or query.

#### Tests to Perform

- [ ] **SQL Injection**
  - [ ] Test login form: `' OR '1'='1`
  - [ ] Test search: `'; DROP TABLE users--`
  - [ ] Test numeric input: `1 OR 1=1`
  - [ ] Parameterized queries/prepared statements used
  - [ ] ORM properly configured (not raw SQL strings)

- [ ] **NoSQL Injection**
  - [ ] Test MongoDB: `{"$gt": ""}` in username/password
  - [ ] Test operators: `{"$ne": null}`
  - [ ] Input validation on all NoSQL queries

- [ ] **Command Injection**
  - [ ] Test shell commands: `; ls -la`
  - [ ] Test piping: `| cat /etc/passwd`
  - [ ] Test chaining: `& whoami`
  - [ ] User input never passed directly to shell

- [ ] **LDAP Injection**
  - [ ] Test LDAP queries with special characters
  - [ ] Example: `*)(uid=*))(|(uid=*`

- [ ] **XML Injection / XXE**
  - [ ] XML parsers configured to prevent XXE
  - [ ] Test: `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>`
  - [ ] Billion Laughs attack prevented

- [ ] **XPath Injection**
  - [ ] XPath queries properly sanitized
  - [ ] Test: `' or '1'='1`

**Test Cases:**
```
SQL Injection Test:
1. Input in login username: admin' OR '1'='1'--
2. Expected: Login fails, no SQL error shown
3. Actual: [Document result]

NoSQL Injection Test:
1. POST to /api/login with: {"username": {"$gt": ""}, "password": {"$gt": ""}}
2. Expected: Login fails with validation error
3. Actual: [Document result]
```

**Tools:** sqlmap, Burp Suite, OWASP ZAP, NoSQLMap

---

### A04:2021 - Insecure Design

**Description:** Missing or ineffective control design.

#### Tests to Perform

- [ ] **Business Logic Flaws**
  - [ ] Negative quantity in shopping cart (-5 items)
  - [ ] Price manipulation (change price in client-side code)
  - [ ] Coupon code reuse beyond limit
  - [ ] Race conditions (double-spending, duplicate submissions)
  - [ ] Workflow bypass (skip payment step in checkout)

- [ ] **Rate Limiting**
  - [ ] Login attempts rate-limited (block after 5 failed attempts)
  - [ ] API endpoints rate-limited (100 req/min)
  - [ ] Password reset rate-limited (3 per hour)
  - [ ] Account registration rate-limited (prevent bulk creation)

- [ ] **Threat Modeling**
  - [ ] Critical business flows identified
  - [ ] Abuse cases documented
  - [ ] Security requirements defined
  - [ ] Risk assessment completed

**Test Cases:**
```
Race Condition Test:
1. Add $1000 to account balance twice simultaneously
2. Expected: Balance increases by $1000 once (transaction lock)
3. Use: Burp Suite Repeater (send 2 concurrent requests)

Rate Limiting Test:
1. Attempt 10 failed logins in 1 minute
2. Expected: Account locked or CAPTCHA after 5 attempts
3. Tool: Python script with requests library
```

**Tools:** Burp Suite Intruder, custom scripts

---

### A05:2021 - Security Misconfiguration

**Description:** Missing appropriate security hardening or improperly configured permissions.

#### Tests to Perform

- [ ] **Default Credentials**
  - [ ] No default admin/admin accounts exist
  - [ ] No default passwords (admin/password, root/root)
  - [ ] Database default credentials changed

- [ ] **Directory Listing**
  - [ ] Web server directory listing disabled
  - [ ] Test: `https://example.com/uploads/`
  - [ ] Expected: 403 Forbidden

- [ ] **Information Disclosure**
  - [ ] Server version not exposed (Server header)
  - [ ] Technology stack not revealed
  - [ ] Detailed error messages disabled in production
  - [ ] Debug mode disabled
  - [ ] No `.git`, `.env`, `backup.sql` files accessible

- [ ] **Unnecessary Features**
  - [ ] Unused pages/endpoints removed or disabled
  - [ ] Sample applications removed
  - [ ] Test/debug endpoints disabled in production
  - [ ] Unnecessary HTTP methods disabled (TRACE, OPTIONS)

- [ ] **CORS Misconfiguration**
  - [ ] `Access-Control-Allow-Origin` not set to `*`
  - [ ] Only trusted domains allowed
  - [ ] Credentials allowed only for specific origins

**Test Cases:**
```
1. Check for exposed files:
   GET /.git/config
   GET /.env
   GET /backup.sql
   GET /config.php.bak
   Expected: 404 Not Found

2. Test CORS:
   Request with Origin: https://evil.com
   Expected: No CORS headers or explicit denial

3. Check HTTP methods:
   OPTIONS /api/users
   Expected: Only GET, POST allowed (not DELETE for regular users)
```

**Tools:** Nikto, OWASP ZAP, curl, nmap

---

### A06:2021 - Vulnerable and Outdated Components

**Description:** Using components with known vulnerabilities.

#### Tests to Perform

- [ ] **Dependency Scanning**
  - [ ] Run `npm audit` / `pip check` / `bundle audit`
  - [ ] All dependencies up to date
  - [ ] No critical/high severity vulnerabilities
  - [ ] Automated scanning in CI/CD pipeline

- [ ] **Third-Party Libraries**
  - [ ] jQuery, Bootstrap, React versions current
  - [ ] No end-of-life (EOL) libraries in use
  - [ ] CDN links use Subresource Integrity (SRI)

- [ ] **Operating System / Runtime**
  - [ ] OS patches up to date
  - [ ] Node.js / Python / Java versions supported
  - [ ] Web server (nginx, Apache) versions current

- [ ] **Transitive Dependencies**
  - [ ] Dependencies of dependencies also checked
  - [ ] Lockfile used (package-lock.json, Pipfile.lock)

**Test Cases:**
```
1. Run dependency scan:
   npm audit
   Expected: 0 vulnerabilities

2. Check library versions:
   Check package.json / requirements.txt
   Compare against latest versions on npm/PyPI

3. Verify SRI tags:
   <script src="https://cdn.example.com/lib.js"
           integrity="sha384-..."
           crossorigin="anonymous"></script>
```

**Tools:** npm audit, Snyk, OWASP Dependency-Check, Retire.js

---

### A07:2021 - Identification and Authentication Failures

**Description:** Confirmation of user's identity, authentication, and session management.

#### Tests to Perform

- [ ] **Password Policy**
  - [ ] Minimum 8 characters required
  - [ ] Complexity requirements enforced (uppercase, lowercase, number, special char)
  - [ ] Common passwords rejected (password123, qwerty)
  - [ ] No maximum password length restriction (or very high limit)

- [ ] **Brute Force Protection**
  - [ ] Account lockout after 5 failed attempts
  - [ ] CAPTCHA after 3 failed attempts
  - [ ] Progressive delays between attempts
  - [ ] IP-based rate limiting

- [ ] **Multi-Factor Authentication (MFA)**
  - [ ] MFA available for all users
  - [ ] MFA enforced for admin accounts
  - [ ] SMS, authenticator app, or hardware token supported

- [ ] **Password Recovery**
  - [ ] Password reset tokens expire (1 hour max)
  - [ ] Tokens are single-use only
  - [ ] Reset links sent via email only
  - [ ] Security questions not used (vulnerable)

- [ ] **Session Management**
  - [ ] (See dedicated section below)

**Test Cases:**
```
Weak Password Test:
1. Attempt to set password: "password123"
2. Expected: Rejected with error message
3. Actual: [Document result]

Brute Force Test:
1. Attempt 10 failed logins with different passwords
2. Expected: Account locked after 5 attempts
3. Tool: Burp Suite Intruder with password list
```

**Tools:** Burp Suite, Hydra, custom scripts

---

### A08:2021 - Software and Data Integrity Failures

**Description:** Code and infrastructure that does not protect against integrity violations.

#### Tests to Perform

- [ ] **Unsigned Code / Packages**
  - [ ] All packages from trusted sources
  - [ ] Package signatures verified
  - [ ] Dependency confusion attacks prevented

- [ ] **Insecure Deserialization**
  - [ ] User input not deserialized without validation
  - [ ] JSON used instead of pickle/yaml (Python)
  - [ ] Java serialization avoided or validated

- [ ] **CI/CD Pipeline Security**
  - [ ] Build process secured
  - [ ] No secrets in git history
  - [ ] Pipeline permissions restricted
  - [ ] Artifact signing implemented

- [ ] **Auto-Update Mechanism**
  - [ ] Updates signed and verified
  - [ ] Update channel secured (HTTPS)
  - [ ] Rollback mechanism available

**Test Cases:**
```
Deserialization Test:
1. Send serialized object in request
2. Example (Python pickle): Craft malicious pickle payload
3. Expected: Request rejected or safely handled
4. Actual: [Document result]
```

**Tools:** ysoserial, Burp Suite, manual testing

---

### A09:2021 - Security Logging and Monitoring Failures

**Description:** Insufficient logging and monitoring, coupled with missing or ineffective integration with incident response.

#### Tests to Perform

- [ ] **Logging Coverage**
  - [ ] Failed login attempts logged
  - [ ] Successful logins logged
  - [ ] Authorization failures logged
  - [ ] Input validation failures logged
  - [ ] Admin actions logged (user creation, permission changes)
  - [ ] Sensitive operations logged (password changes, data exports)

- [ ] **Log Content**
  - [ ] Logs include: timestamp, user ID, IP, action, result
  - [ ] No sensitive data in logs (passwords, tokens, credit cards)
  - [ ] Stack traces not exposed to users

- [ ] **Log Integrity**
  - [ ] Logs stored securely (append-only)
  - [ ] Log tampering detected
  - [ ] Logs retained for adequate period (90 days minimum)
  - [ ] Logs backed up regularly

- [ ] **Monitoring & Alerting**
  - [ ] Alerts for multiple failed logins
  - [ ] Alerts for privilege escalation attempts
  - [ ] Alerts for suspicious patterns
  - [ ] Real-time monitoring dashboard

**Test Cases:**
```
1. Perform failed login attempt
2. Check logs for entry:
   Expected format:
   [2024-01-15 10:30:00] WARN: Failed login attempt
   User: john@example.com, IP: 192.168.1.100, Reason: Invalid password

3. Verify password not in logs:
   Expected: Password field not logged
```

**Tools:** ELK Stack, Splunk, CloudWatch, manual log review

---

### A10:2021 - Server-Side Request Forgery (SSRF)

**Description:** Web application fetches a remote resource without validating the user-supplied URL.

#### Tests to Perform

- [ ] **URL Validation**
  - [ ] User-supplied URLs validated
  - [ ] Allowlist of allowed domains
  - [ ] Internal IP addresses blocked (127.0.0.1, 10.x.x.x, 192.168.x.x)
  - [ ] Cloud metadata endpoints blocked (169.254.169.254)

- [ ] **SSRF Attack Tests**
  - [ ] Test: `http://127.0.0.1/admin`
  - [ ] Test: `http://169.254.169.254/latest/meta-data/` (AWS metadata)
  - [ ] Test: `http://metadata.google.internal/` (GCP metadata)
  - [ ] Test: `file:///etc/passwd`
  - [ ] Test: URL bypass techniques (URL encoding, redirects)

- [ ] **Webhook Security**
  - [ ] Webhook URLs validated before use
  - [ ] Cannot point to internal resources
  - [ ] Timeout configured (5 seconds max)

**Test Cases:**
```
SSRF Test:
1. Feature: Import data from URL
2. Input URL: http://127.0.0.1:8080/admin
3. Expected: Request blocked, error message shown
4. Actual: [Document result]

AWS Metadata Test:
1. Input URL: http://169.254.169.254/latest/meta-data/iam/security-credentials/
2. Expected: Blocked
3. Actual: [Document result]
```

**Tools:** Burp Suite, curl, custom scripts

---

## Authentication & Authorization

### Authentication Tests

- [ ] **Password Strength**
  - [ ] Minimum 8 characters
  - [ ] Uppercase + lowercase + number + special char required
  - [ ] Common passwords rejected
  - [ ] Password strength meter displayed

- [ ] **Login Security**
  - [ ] Username enumeration prevented (same error for invalid user/password)
  - [ ] Timing attacks prevented (consistent response time)
  - [ ] No verbose error messages ("Invalid username" vs "Invalid password")

- [ ] **Multi-Factor Authentication**
  - [ ] TOTP (Time-based One-Time Password) supported
  - [ ] Backup codes provided
  - [ ] MFA can't be bypassed
  - [ ] Recovery process secure

- [ ] **Password Reset**
  - [ ] Reset token is cryptographically secure (128+ bits)
  - [ ] Token expires in 1 hour
  - [ ] Token single-use only
  - [ ] Old password required for change (not reset)

- [ ] **Remember Me**
  - [ ] Secure remember-me tokens (not just session extension)
  - [ ] Tokens expire (30 days max)
  - [ ] Tokens invalidated on password change

### Authorization Tests

- [ ] **Role-Based Access Control (RBAC)**
  - [ ] Roles properly defined (admin, user, guest)
  - [ ] Permissions assigned correctly
  - [ ] Default deny (whitelist approach)

- [ ] **Permission Checks**
  - [ ] Every API endpoint checks permissions
  - [ ] Frontend checks supplemented by backend checks
  - [ ] Cannot bypass via direct API access

- [ ] **Privilege Escalation**
  - [ ] User cannot elevate own privileges
  - [ ] Role changes require admin approval
  - [ ] Admin actions logged

**Test Scenarios:**
```
1. Create test user with 'user' role
2. Attempt to access admin endpoint: POST /api/admin/users
3. Expected: 403 Forbidden
4. Modify request to add admin role
5. Expected: Still rejected (backend validation)
```

---

## Input Validation & Sanitization

### Input Validation

- [ ] **Server-Side Validation**
  - [ ] All input validated on server (not just client)
  - [ ] Whitelist approach used (allow known-good)
  - [ ] Data type validation (string, integer, email, etc.)
  - [ ] Length limits enforced
  - [ ] Format validation (regex for phone, email, etc.)

- [ ] **Special Characters**
  - [ ] HTML special chars escaped (`<`, `>`, `&`, `"`, `'`)
  - [ ] SQL special chars escaped (`'`, `"`, `;`, `--`)
  - [ ] JavaScript special chars escaped
  - [ ] Shell special chars escaped (`|`, `&`, `;`, `$`, `\``)

- [ ] **File Names**
  - [ ] Path traversal characters blocked (`../`, `..\`)
  - [ ] Null bytes blocked (`%00`)
  - [ ] Only allowed file extensions accepted

### Output Encoding

- [ ] **Cross-Site Scripting (XSS) Prevention**
  - [ ] **Reflected XSS:** User input not reflected without encoding
  - [ ] **Stored XSS:** User data stored safely, encoded on output
  - [ ] **DOM-based XSS:** JavaScript safely handles URL parameters
  - [ ] Content Security Policy (CSP) implemented

- [ ] **XSS Test Payloads**
  - [ ] `<script>alert('XSS')</script>`
  - [ ] `<img src=x onerror=alert('XSS')>`
  - [ ] `<svg onload=alert('XSS')>`
  - [ ] `javascript:alert('XSS')`
  - [ ] `"><script>alert('XSS')</script>`

**Test Cases:**
```
XSS Test:
1. Input in search box: <script>alert('XSS')</script>
2. Submit search
3. Expected: Script tag escaped/encoded, no alert shown
4. View source: Should see &lt;script&gt; instead of <script>
```

---

## Session Management

- [ ] **Session Cookie Security**
  - [ ] `HttpOnly` flag set (prevents JavaScript access)
  - [ ] `Secure` flag set (HTTPS only)
  - [ ] `SameSite` attribute set (`Strict` or `Lax`)
  - [ ] Cookie domain properly scoped

**Example Secure Cookie:**
```
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

- [ ] **Session Management**
  - [ ] Session ID is cryptographically random (128+ bits)
  - [ ] New session ID on login (prevent session fixation)
  - [ ] Session expires after inactivity (30 minutes)
  - [ ] Absolute session timeout (12 hours)
  - [ ] Logout properly destroys session

- [ ] **Session Fixation**
  - [ ] Session ID regenerated after login
  - [ ] Session ID not accepted from URL
  - [ ] Session ID not accepted from GET parameter

- [ ] **Concurrent Session Control**
  - [ ] Multiple logins handled securely
  - [ ] Option to view active sessions
  - [ ] Option to terminate other sessions

**Test Cases:**
```
Session Fixation Test:
1. Get session ID before login
2. Login with credentials
3. Check session ID after login
4. Expected: New session ID generated
```

---

## Encryption & Data Protection

- [ ] **TLS/SSL Configuration**
  - [ ] TLS 1.2 or 1.3 only (1.0 and 1.1 disabled)
  - [ ] Strong cipher suites only
  - [ ] Certificate valid and from trusted CA
  - [ ] Certificate not expired
  - [ ] HSTS header set (`Strict-Transport-Security`)

**Test with SSL Labs:** https://www.ssllabs.com/ssltest/

- [ ] **Password Storage**
  - [ ] Passwords hashed with bcrypt/Argon2/PBKDF2
  - [ ] Salt rounds >= 10 (bcrypt) or equivalent
  - [ ] Never stored in plaintext
  - [ ] Not reversibly encrypted

- [ ] **Sensitive Data**
  - [ ] Credit card data never stored (use tokenization)
  - [ ] PII encrypted in database
  - [ ] Encryption keys stored securely (not in code)
  - [ ] Key rotation policy in place

- [ ] **Data Transmission**
  - [ ] All API calls over HTTPS
  - [ ] WebSocket connections secure (WSS)
  - [ ] No sensitive data in GET parameters
  - [ ] No sensitive data in URL

---

## API Security

- [ ] **Authentication**
  - [ ] API keys required for access
  - [ ] JWT tokens used securely
  - [ ] Bearer token in Authorization header (not URL)
  - [ ] Token expiration enforced

- [ ] **Rate Limiting**
  - [ ] Per-user rate limits (1000 req/hour)
  - [ ] Per-IP rate limits (100 req/hour)
  - [ ] Rate limit headers returned (X-RateLimit-*)
  - [ ] HTTP 429 status on limit exceeded

- [ ] **Input Validation**
  - [ ] JSON schema validation
  - [ ] Request size limits (< 10 MB)
  - [ ] Content-Type validation
  - [ ] Reject unexpected fields

- [ ] **Output**
  - [ ] No sensitive data in error responses
  - [ ] Consistent error format
  - [ ] No stack traces in production

- [ ] **API Versioning**
  - [ ] Version in URL (/api/v1/) or header
  - [ ] Old versions deprecated gracefully
  - [ ] Breaking changes properly communicated

**Test Cases:**
```
API Rate Limiting Test:
1. Send 150 requests in 1 minute to /api/products
2. Expected: First 100 succeed, rest get 429 status
3. Response headers: X-RateLimit-Limit: 100, X-RateLimit-Remaining: 0
```

---

## Database Security

- [ ] **SQL Injection Prevention**
  - [ ] Parameterized queries / prepared statements used
  - [ ] ORM used correctly (no raw SQL string concatenation)
  - [ ] Stored procedures parameterized
  - [ ] Input validation as defense-in-depth

- [ ] **Database Access**
  - [ ] Least privilege principle (app user can't drop tables)
  - [ ] Separate users for read/write operations
  - [ ] Strong passwords on database accounts
  - [ ] No default credentials

- [ ] **Database Configuration**
  - [ ] Database not publicly accessible
  - [ ] Firewall rules restrict access
  - [ ] Encryption in transit (SSL/TLS)
  - [ ] Encryption at rest enabled

- [ ] **Backup Security**
  - [ ] Backups encrypted
  - [ ] Backups stored securely
  - [ ] Backup retention policy
  - [ ] Restore process tested

---

## File Upload Security

- [ ] **File Type Validation**
  - [ ] Whitelist allowed extensions (.jpg, .png, .pdf)
  - [ ] MIME type checked (not just extension)
  - [ ] Magic number validation (actual file content)
  - [ ] Executable files rejected (.exe, .sh, .bat)

- [ ] **File Size Limits**
  - [ ] Maximum file size enforced (5 MB)
  - [ ] Per-file and total upload limits
  - [ ] Disk quota enforced

- [ ] **File Storage**
  - [ ] Files stored outside web root
  - [ ] Randomized file names (prevent guessing)
  - [ ] Separate storage per user
  - [ ] No execute permissions on upload directory

- [ ] **Malware Scanning**
  - [ ] Antivirus scan on upload
  - [ ] Suspicious files quarantined
  - [ ] Known malware signatures blocked

- [ ] **Image Processing**
  - [ ] Images re-encoded (strips metadata/malicious code)
  - [ ] Thumbnail generation safe
  - [ ] ImageMagick vulnerabilities patched

**Test Cases:**
```
File Upload Test:
1. Upload file: malicious.php.jpg (PHP code in image)
2. Expected: File rejected or safely stored without execution
3. Attempt to access: https://example.com/uploads/malicious.php.jpg
4. Expected: File served as image, not executed as PHP
```

---

## Security Headers

### Required Headers

- [ ] **Content-Security-Policy (CSP)**
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; style-src 'self' 'unsafe-inline'
  ```
  - Prevents XSS attacks
  - Restricts resource loading

- [ ] **X-Content-Type-Options**
  ```
  X-Content-Type-Options: nosniff
  ```
  - Prevents MIME-sniffing attacks

- [ ] **X-Frame-Options**
  ```
  X-Frame-Options: DENY
  ```
  - Prevents clickjacking attacks
  - Alternative: use CSP `frame-ancestors`

- [ ] **X-XSS-Protection**
  ```
  X-XSS-Protection: 1; mode=block
  ```
  - Enables browser XSS filter (legacy browsers)

- [ ] **Strict-Transport-Security (HSTS)**
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  ```
  - Forces HTTPS for 1 year

- [ ] **Referrer-Policy**
  ```
  Referrer-Policy: strict-origin-when-cross-origin
  ```
  - Controls referrer information

- [ ] **Permissions-Policy**
  ```
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  ```
  - Controls browser features

### Headers to Remove

- [ ] **X-Powered-By**
  - Remove to hide technology stack
  - Example: `X-Powered-By: Express` → Remove

- [ ] **Server**
  - Remove or minimize version info
  - Example: `Server: nginx/1.18.0` → `Server: nginx`

**Test Headers:**
```bash
curl -I https://example.com

# Expected headers in response:
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
```

**Tools:** SecurityHeaders.com, OWASP ZAP

---

## Dependency Vulnerabilities

### Automated Scanning

- [ ] **JavaScript (npm)**
  ```bash
  npm audit
  npm audit fix
  ```
  - [ ] 0 critical vulnerabilities
  - [ ] 0 high vulnerabilities

- [ ] **Python (pip)**
  ```bash
  pip check
  safety check
  ```

- [ ] **Ruby (bundler)**
  ```bash
  bundle audit check --update
  ```

- [ ] **Java (Maven)**
  ```bash
  mvn dependency-check:check
  ```

### CI/CD Integration

- [ ] Dependency scanning in CI pipeline
- [ ] Build fails on critical vulnerabilities
- [ ] Weekly automated scans
- [ ] Notifications for new vulnerabilities

### Third-Party Services

- [ ] **Snyk:** https://snyk.io
- [ ] **Dependabot:** GitHub automatic dependency updates
- [ ] **npm audit:** Built-in npm tool
- [ ] **OWASP Dependency-Check**

---

## Infrastructure Security

- [ ] **Server Hardening**
  - [ ] Unnecessary services disabled
  - [ ] Default accounts removed/disabled
  - [ ] SSH key-only authentication (no passwords)
  - [ ] Firewall configured (only necessary ports open)
  - [ ] Fail2ban or similar for intrusion prevention

- [ ] **Network Security**
  - [ ] DMZ properly configured
  - [ ] Internal services not publicly accessible
  - [ ] VPN for remote access
  - [ ] Network segmentation implemented

- [ ] **Cloud Security (AWS/Azure/GCP)**
  - [ ] IAM roles follow least privilege
  - [ ] MFA enabled on all accounts
  - [ ] S3 buckets not publicly accessible
  - [ ] Security groups properly configured
  - [ ] CloudTrail / Activity logs enabled

- [ ] **Container Security (Docker/K8s)**
  - [ ] Base images from trusted sources
  - [ ] Images scanned for vulnerabilities
  - [ ] Containers run as non-root user
  - [ ] Resource limits set
  - [ ] Secrets not in images (use secrets management)

**Tools:** Lynis, OpenVAS, Nessus, Cloud security tools (AWS Security Hub)

---

## Compliance & Privacy

### GDPR (General Data Protection Regulation)

- [ ] **Data Subject Rights**
  - [ ] Right to access (data export)
  - [ ] Right to erasure (account deletion)
  - [ ] Right to rectification (data correction)
  - [ ] Right to data portability

- [ ] **Consent & Privacy**
  - [ ] Cookie consent obtained
  - [ ] Privacy policy accessible
  - [ ] Data processing purposes clear
  - [ ] Opt-in for marketing communications

- [ ] **Data Protection**
  - [ ] Data minimization practiced
  - [ ] Data retention policy
  - [ ] Breach notification process (within 72 hours)

### PCI DSS (Payment Card Industry)

- [ ] **Cardholder Data**
  - [ ] Never store CVV/CVC
  - [ ] Card numbers tokenized
  - [ ] PAN (Primary Account Number) masked
  - [ ] Use payment processor (Stripe, PayPal)

- [ ] **Network Security**
  - [ ] Firewalls configured
  - [ ] Encrypted transmission
  - [ ] Vulnerability scanning

### HIPAA (Health Insurance Portability)

- [ ] PHI (Protected Health Information) encrypted
- [ ] Access controls implemented
- [ ] Audit logs maintained
- [ ] Breach notification procedures

---

## Penetration Testing Checklist

### Reconnaissance

- [ ] Subdomain enumeration
- [ ] Port scanning
- [ ] Technology fingerprinting
- [ ] Google dorking for exposed data

### Vulnerability Assessment

- [ ] Automated scanning (OWASP ZAP, Burp Suite)
- [ ] Manual testing of critical functions
- [ ] Social engineering assessment (if authorized)

### Exploitation

- [ ] Attempt to exploit found vulnerabilities (in test environment only)
- [ ] Privilege escalation attempts
- [ ] Lateral movement testing

### Reporting

- [ ] Document all findings
- [ ] Severity ratings (Critical, High, Medium, Low)
- [ ] Steps to reproduce
- [ ] Remediation recommendations
- [ ] Executive summary for stakeholders

---

## Tools Reference

### Web Application Scanners
- **OWASP ZAP:** Free, open-source web app scanner
- **Burp Suite:** Professional web security testing
- **Nikto:** Web server scanner
- **Acunetix:** Commercial web vulnerability scanner

### Dependency Scanners
- **npm audit:** Built-in Node.js tool
- **Snyk:** Dependency vulnerability scanning (free tier available)
- **OWASP Dependency-Check:** Open-source dependency scanner
- **Safety:** Python dependency checker

### Network Scanners
- **nmap:** Network port scanner
- **OpenVAS:** Open-source vulnerability scanner
- **Nessus:** Professional vulnerability scanner

### Specialized Tools
- **sqlmap:** Automated SQL injection testing
- **testssl.sh:** SSL/TLS configuration testing
- **Hydra:** Password brute-forcing
- **Metasploit:** Penetration testing framework

### Cloud Security
- **AWS Security Hub:** AWS security assessment
- **ScoutSuite:** Multi-cloud security auditing
- **Prowler:** AWS security best practices checker

---

## Severity Ratings

| Severity | Description | Examples | Response Time |
|----------|-------------|----------|---------------|
| **Critical** | Immediate risk, data breach possible | SQL injection, RCE, authentication bypass | < 24 hours |
| **High** | Significant risk, limited data exposure | XSS, CSRF, privilege escalation | < 1 week |
| **Medium** | Moderate risk, limited impact | Missing security headers, verbose errors | < 1 month |
| **Low** | Minimal risk, best practice | Version disclosure, minor config issue | Next release |

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Security Tester** | | | |
| **Development Lead** | | | |
| **Security Officer** | | | |
| **Product Manager** | | | |

---

**Document Version:** 1.0
**Last Updated:** YYYY-MM-DD
**Next Review:** Quarterly or after major releases

**References:**
- [OWASP Top 10 - 2021](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
