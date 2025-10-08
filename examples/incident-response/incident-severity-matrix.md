# Incident Severity Classification Matrix

## Overview

This document defines the incident severity levels used for classifying and responding to incidents. Proper severity classification ensures appropriate response, resource allocation, and communication.

**Last Updated:** March 2024
**Owner:** Engineering Leadership
**Review Frequency:** Quarterly

---

## Quick Reference

| Severity | Summary | Example | Response Time | Page On-Call? |
|----------|---------|---------|---------------|---------------|
| **SEV-1** | Critical - Total outage | Website down for all users | < 5 minutes | Yes |
| **SEV-2** | High - Major degradation | Payment processing 50% slower | < 15 minutes | Yes |
| **SEV-3** | Medium - Partial impact | Single feature broken | < 1 hour | No |
| **SEV-4** | Low - Minimal impact | Cosmetic UI issue | Best effort | No |

---

## Severity Levels

### SEV-1: Critical

#### Definition
**Complete service outage or critical functionality unavailable affecting all or most users, or critical security breach detected.**

#### Characteristics
- ✅ Service is completely down
- ✅ Critical functionality unavailable (e.g., payments, authentication, core features)
- ✅ Affects all users or large percentage (>50%)
- ✅ Data breach or critical security vulnerability
- ✅ Data loss or corruption
- ✅ Compliance violation (GDPR, PCI-DSS, etc.)

#### Examples
1. **Website Completely Down**
   - Main website returns 503 errors
   - All users unable to access application
   - DNS resolution failing

2. **Payment Processing Offline**
   - All payment attempts failing
   - Direct revenue impact
   - No workaround available

3. **Data Breach**
   - Unauthorized access to customer data
   - Security vulnerability being actively exploited
   - Credential leak detected

4. **Database Corruption**
   - Primary database unreachable
   - Data inconsistencies affecting operations
   - Backup restore required

5. **Authentication System Down**
   - Users cannot log in
   - Session management failing
   - Multi-factor authentication broken

#### Impact Assessment
- **User Impact:** All or most users (>50%)
- **Business Impact:** Direct revenue loss, brand damage, legal liability
- **Data Impact:** Potential data loss, corruption, or breach
- **Compliance Impact:** Regulatory violations possible

#### Response Requirements

**Immediate (Within 5 minutes):**
- Page on-call engineer immediately
- On-call engineer acknowledges and begins investigation
- Create incident Slack channel (#incident-[date]-[service])
- Start incident timeline documentation

**Within 15 minutes:**
- Assign Incident Commander
- Assign Technical Lead
- Assign Communications Lead
- Notify Engineering Manager
- Begin regular status updates (every 15 minutes)

**Within 30 minutes:**
- Notify VP Engineering / CTO
- Post initial status page update
- Notify customer support team
- Establish incident war room (Zoom/video call)

**Ongoing:**
- Executive team receives updates every 30 minutes
- Status page updated every 30 minutes
- Customer communications as needed
- All hands on deck - pull in additional engineers as needed

#### Communication Requirements
- **Internal:** #incidents channel, email to leadership, team notifications
- **External:** Status page update, customer email if > 30 min, social media if appropriate
- **Frequency:** Every 15 minutes until resolved

#### Postmortem Requirements
- **Required:** Yes, mandatory
- **Due Date:** Within 48 hours
- **Attendees:** All incident participants, Engineering leadership
- **Distribution:** Engineering team, Leadership, relevant stakeholders
- **Public Summary:** Required for customer-facing incidents

---

### SEV-2: High

#### Definition
**Major functionality degraded or unavailable, affecting many users but with partial workarounds available, or significant performance degradation.**

#### Characteristics
- ✅ Core functionality severely degraded but not completely down
- ✅ Affects significant portion of users (10-50%)
- ✅ Performance degradation making system nearly unusable
- ✅ Partial workaround exists but difficult
- ✅ Single critical feature unavailable
- ✅ Regional outage (one region/availability zone down)

#### Examples
1. **Payment Processing Degraded**
   - 30% of payment attempts failing
   - Significant delays (30+ seconds)
   - Some payment methods unavailable

2. **Search Functionality Down**
   - Product search returning errors
   - Users can browse but not search
   - Affects conversion rates

3. **API Rate Limiting Issues**
   - API responding slowly (>5 second latency)
   - Affecting mobile app and integrations
   - Desktop web still functional

4. **Regional Outage**
   - US-East region down
   - Other regions functioning normally
   - 25% of users affected

5. **Database Performance Degradation**
   - Query times 10x slower than normal
   - Timeouts occurring frequently
   - System functional but nearly unusable

#### Impact Assessment
- **User Impact:** Many users (10-50%)
- **Business Impact:** Revenue impact, user frustration, conversion rate drop
- **Data Impact:** Possible data delays or temporary unavailability
- **Compliance Impact:** SLA violations likely

#### Response Requirements

**Immediate (Within 15 minutes):**
- Page on-call engineer
- On-call engineer acknowledges and begins investigation
- Create incident Slack channel
- Start incident timeline

**Within 30 minutes:**
- Assign Incident Commander (recommended)
- Assign Technical Lead
- Notify Engineering Manager
- Begin status updates (every 30 minutes)

**Within 1 hour:**
- Post status page update
- Notify customer support team
- Notify leadership if not resolved

**Ongoing:**
- Status updates every 30 minutes
- Leadership notified every 1 hour if ongoing
- Additional engineers pulled in as needed

#### Communication Requirements
- **Internal:** #incidents channel, team notifications
- **External:** Status page update, consider customer email if > 1 hour
- **Frequency:** Every 30 minutes until resolved

#### Postmortem Requirements
- **Required:** Yes
- **Due Date:** Within 1 week
- **Attendees:** Incident participants, Team lead
- **Distribution:** Engineering team, Team leadership
- **Public Summary:** Optional, based on impact

---

### SEV-3: Medium

#### Definition
**Minor functionality affected, limited user impact, workarounds available, or non-critical service degradation.**

#### Characteristics
- ✅ Minor feature broken or degraded
- ✅ Affects small percentage of users (<10%)
- ✅ Easy workaround available
- ✅ Non-critical service impacted
- ✅ Cosmetic issues affecting user experience
- ✅ Internal tools affected

#### Examples
1. **Report Generation Slow**
   - Report download taking 5 minutes instead of 30 seconds
   - Users can still access reports
   - Only affects admin users

2. **Email Notifications Delayed**
   - Notification emails delayed by 15 minutes
   - In-app notifications still working
   - Not affecting core functionality

3. **Single Integration Broken**
   - Slack integration not working
   - Other integrations functional
   - Can manually copy/paste instead

4. **Admin Dashboard Errors**
   - Internal admin tool showing errors
   - Workaround available via API
   - Customer-facing app unaffected

5. **Search Suggestions Incorrect**
   - Autocomplete showing wrong suggestions
   - Search itself still functional
   - Users can still find what they need

#### Impact Assessment
- **User Impact:** Few users (<10%)
- **Business Impact:** Minor inconvenience, minimal revenue impact
- **Data Impact:** No data loss, possible minor delays
- **Compliance Impact:** No SLA violations

#### Response Requirements

**Within 1 hour:**
- On-call engineer acknowledges
- Begin investigation during business hours
- Create ticket for tracking
- Notify team in Slack

**Within 4 hours:**
- Provide initial assessment
- Determine fix timeline
- Update ticket with findings

**Ongoing:**
- Fix during business hours
- No after-hours work required
- Can wait for next deployment if low risk

#### Communication Requirements
- **Internal:** Slack notification, ticket updates
- **External:** No status page update required
- **Frequency:** As significant updates occur

#### Postmortem Requirements
- **Required:** No (Optional)
- **Due Date:** N/A
- **Attendees:** Optional team discussion
- **Distribution:** Optional
- **Public Summary:** Not required

---

### SEV-4: Low

#### Definition
**Minimal impact, cosmetic issues, minor bugs, or issues with non-essential functionality.**

#### Characteristics
- ✅ Cosmetic or UI issues
- ✅ Documentation errors
- ✅ Minor bugs with no user impact
- ✅ Feature requests
- ✅ Technical debt
- ✅ Internal process improvements

#### Examples
1. **UI Alignment Issues**
   - Button slightly misaligned
   - Text wrapping oddly
   - Minor visual glitches

2. **Typos in UI**
   - Misspelled words
   - Grammatical errors
   - Translation issues

3. **Non-Critical Log Errors**
   - Warning logs appearing
   - No functional impact
   - Just noise in logs

4. **Documentation Outdated**
   - Help docs need updating
   - API docs missing new fields
   - Internal wiki out of date

5. **Minor Performance Optimization**
   - Page load could be faster
   - Not causing issues
   - Nice to have improvement

#### Impact Assessment
- **User Impact:** Negligible or none
- **Business Impact:** No business impact
- **Data Impact:** No data impact
- **Compliance Impact:** No compliance issues

#### Response Requirements

**No Urgency:**
- Create ticket in backlog
- Address in next sprint planning
- No immediate action required
- Can be batched with other fixes

**Prioritization:**
- Prioritized against other feature work
- Fixed when convenient
- May be closed as "won't fix" if not worth effort

#### Communication Requirements
- **Internal:** Ticket tracking only
- **External:** No communication needed
- **Frequency:** N/A

#### Postmortem Requirements
- **Required:** No
- **Due Date:** N/A
- **Attendees:** N/A
- **Distribution:** N/A
- **Public Summary:** N/A

---

## Severity Classification Decision Tree

```
┌─────────────────────────────────────────────┐
│ Is there ANY customer/user impact?          │
└───────────┬─────────────────────────────────┘
            │
            ├─── NO ──▶ SEV-4 (or not an incident)
            │
            └─── YES
                 │
                 ▼
            ┌─────────────────────────────────────┐
            │ Is the service completely down OR   │
            │ is there a security breach?         │
            └────┬────────────────────────────────┘
                 │
                 ├─── YES ──▶ SEV-1
                 │
                 └─── NO
                      │
                      ▼
                 ┌────────────────────────────────┐
                 │ Are >50% of users affected OR  │
                 │ is revenue directly impacted?  │
                 └────┬───────────────────────────┘
                      │
                      ├─── YES ──▶ SEV-1
                      │
                      └─── NO
                           │
                           ▼
                      ┌────────────────────────────┐
                      │ Is core functionality      │
                      │ severely degraded?         │
                      └────┬───────────────────────┘
                           │
                           ├─── YES ──▶ SEV-2
                           │
                           └─── NO
                                │
                                ▼
                           ┌────────────────────────┐
                           │ Is there an easy       │
                           │ workaround available?  │
                           └────┬───────────────────┘
                                │
                                ├─── NO ──▶ SEV-2
                                │
                                └─── YES ──▶ SEV-3
```

---

## Special Considerations

### Security Incidents

**Always escalate security incidents to SEV-1 or SEV-2:**
- Active data breach: **SEV-1**
- Vulnerability being exploited: **SEV-1**
- Discovered vulnerability (not being exploited): **SEV-2**
- Security policy violation: **SEV-3**

### Data Incidents

**Data-related incidents require special handling:**
- Data loss/corruption: **SEV-1**
- Data delay (>1 hour): **SEV-2**
- Data quality issues: **SEV-3**
- Reportingdata lag: **SEV-3 or SEV-4**

### Compliance Incidents

**Regulatory compliance issues:**
- GDPR/CCPA violation: **SEV-1**
- PCI-DSS compliance issue: **SEV-1**
- SOC 2 control failure: **SEV-2**
- Audit finding: **SEV-3**

### When in Doubt

**If uncertain about severity:**
1. Start with **higher severity** (can always downgrade)
2. Consult with Incident Commander or manager
3. Consider worst-case scenario
4. Better to over-respond than under-respond

---

## Severity Change Process

### Upgrading Severity

**Can be done by:**
- Incident Commander
- On-call engineer
- Engineering Manager
- Any engineer with justification

**Reasons to upgrade:**
- Impact is worse than initially assessed
- More users affected than thought
- Issue is spreading to other services
- Customer complaints increasing
- Business impact higher than expected

**Process:**
1. Announce severity change in incident channel
2. Update incident ticket
3. Notify appropriate stakeholders for new severity level
4. Adjust communication cadence
5. Document reason for change in timeline

### Downgrading Severity

**Can be done by:**
- Incident Commander
- Engineering Manager

**Reasons to downgrade:**
- Impact less severe than initially thought
- Workaround found
- Partial mitigation deployed
- User impact reduced

**Process:**
1. Confirm with Incident Commander
2. Announce in incident channel
3. Update incident ticket
4. Adjust communication cadence
5. Document reason for change in timeline

---

## Metrics and Reporting

### Tracked Metrics

- Total incidents by severity per month
- Mean time to resolution (MTTR) by severity
- Mean time to acknowledgment (MTTA) by severity
- Severity escalations/downgrades
- False positive incidents by severity

### Goals

| Severity | MTTA Goal | MTTR Goal | Target Count/Month |
|----------|-----------|-----------|-------------------|
| SEV-1    | < 2 min   | < 1 hour  | 0-1 |
| SEV-2    | < 10 min  | < 4 hours | 0-3 |
| SEV-3    | < 30 min  | < 24 hours| 5-10 |
| SEV-4    | N/A       | N/A       | Variable |

---

## Related Documents

- [Incident Response Runbook](./incident-runbook-template.md)
- [On-Call Rotation](./on-call-rotation.json)
- [Communication Templates](./communication-templates.md)
- [Postmortem Template](./postmortem-example.md)

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-03-15 | 1.0 | Initial creation | Engineering Team |
| 2024-03-20 | 1.1 | Added decision tree | Alice Johnson |
| 2024-04-01 | 1.2 | Added special considerations | Bob Smith |

---

**Questions or Feedback?**

Contact the On-Call Working Group in #on-call-feedback
