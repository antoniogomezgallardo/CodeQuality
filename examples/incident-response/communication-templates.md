# Incident Communication Templates

## Overview

This document provides pre-written templates for incident communications. Use these templates to ensure clear, consistent, and professional communication during incidents.

**Important:** Customize templates with actual incident details before sending.

---

## Table of Contents

1. [Initial Incident Notification](#initial-incident-notification)
2. [Status Update Templates](#status-update-templates)
3. [Resolution Notification](#resolution-notification)
4. [Postmortem Summary](#postmortem-summary)
5. [Customer Communications](#customer-communications)
6. [Internal Team Updates](#internal-team-updates)
7. [Executive Briefings](#executive-briefings)

---

## Initial Incident Notification

### Template 1: SEV-1 Critical Incident (Internal)

**Subject:** 🚨 SEV-1 INCIDENT: [Service Name] - [Brief Description]

**Channel:** #incidents

```
🚨 **SEV-1 INCIDENT DECLARED** 🚨

**Incident ID:** INC-2024-XXXX
**Service:** [Service Name]
**Severity:** SEV-1 (Critical)
**Started:** [Time] UTC
**Status:** Investigating

**Impact:**
- [Describe user impact]
- [Affected systems/regions]
- [Estimated users affected]

**Actions Taken:**
- Incident war room created: [Zoom link]
- Incident channel: #incident-[date]-[service]
- Incident Commander: @[name]
- Technical Lead: @[name]

**Next Update:** In 15 minutes

**Incident Channel:** #incident-[date]-[service]
**Dashboard:** [Grafana link]
**Runbook:** [Runbook link]
```

### Template 2: SEV-2 High Severity Incident (Internal)

**Subject:** ⚠️ SEV-2 INCIDENT: [Service Name] - [Brief Description]

**Channel:** #incidents

```
⚠️ **SEV-2 INCIDENT**

**Incident ID:** INC-2024-XXXX
**Service:** [Service Name]
**Severity:** SEV-2 (High)
**Started:** [Time] UTC
**Status:** Investigating

**Impact:**
[Describe impact]

**Incident Commander:** @[name]
**Incident Channel:** #incident-[date]-[service]

**Next Update:** In 30 minutes
```

### Template 3: Customer-Facing Incident (Status Page)

**Title:** [Service Name] Experiencing Issues

```
**Current Status:** Identified

We are currently investigating reports of [describe issue] affecting [Service Name].
Users may experience [specific impact like "failed logins" or "slow page loads"].

Our engineering team is actively investigating and we will provide an update
within [timeframe, e.g., "15 minutes"].

**Started:** [Time] UTC
**Last Updated:** [Time] UTC

We apologize for any inconvenience.
```

---

## Status Update Templates

### Template 1: Investigation in Progress

**Channel:** #incident-[date]-[service]

```
**INCIDENT UPDATE - [HH:MM UTC]**

**Status:** Investigating

**What we know:**
- [Key finding 1]
- [Key finding 2]
- [Key finding 3]

**Current Actions:**
- [Action 1 - Owner]
- [Action 2 - Owner]

**Impact:** [Unchanged/Increased/Decreased since last update]

**Next Update:** [Time]
```

### Template 2: Root Cause Identified

**Channel:** #incident-[date]-[service]

```
**INCIDENT UPDATE - [HH:MM UTC]**

**Status:** Root cause identified, implementing fix

**Root Cause:**
[Describe the root cause clearly and concisely]

**Fix Plan:**
1. [Step 1 - Expected time]
2. [Step 2 - Expected time]
3. [Step 3 - Expected time]

**ETA for Resolution:** [Time estimate]

**Current Impact:** [Update on user impact]

**Next Update:** [Time or "when fix is deployed"]
```

### Template 3: Mitigation in Progress

**Channel:** #incident-[date]-[service]

```
**INCIDENT UPDATE - [HH:MM UTC]**

**Status:** Mitigation in progress

**Mitigation Strategy:**
[Describe what's being done: rollback, scaling, config change, etc.]

**Progress:**
- ✅ [Completed action]
- 🔄 [In progress action]
- ⏳ [Pending action]

**Impact Update:**
[How has impact changed?]

**Next Update:** [Time]
```

### Template 4: Monitoring After Fix

**Channel:** #incident-[date]-[service]

```
**INCIDENT UPDATE - [HH:MM UTC]**

**Status:** Fix deployed, monitoring

**Fix Applied:**
[Describe what was fixed]

**Metrics:**
- Error rate: [current vs normal]
- Latency: [current vs normal]
- Traffic: [current vs normal]

**Monitoring Period:** [Duration, e.g., "30 minutes"]

**Next Update:** [Time or "at end of monitoring period"]
```

---

## Resolution Notification

### Template 1: Incident Resolved (Internal)

**Channel:** #incident-[date]-[service], #incidents

```
✅ **INCIDENT RESOLVED**

**Incident ID:** INC-2024-XXXX
**Service:** [Service Name]
**Severity:** SEV-[X]
**Duration:** [Total time]

**Resolution:**
[Brief description of what was done to resolve]

**Metrics:**
- Time to detect: [duration]
- Time to resolve: [duration]
- Users affected: [estimate]

**Impact Summary:**
[Final impact assessment]

**Next Steps:**
- Postmortem scheduled for [date/time]
- Follow-up tickets: [ticket links]
- Runbook updates needed: [Yes/No]

**Thank you to everyone who helped resolve this incident!**

@[IC name], @[Tech Lead name], @[other contributors]
```

### Template 2: Customer-Facing Resolution (Status Page)

**Title:** [Service Name] Issue Resolved

```
**Current Status:** Resolved

The issue affecting [Service Name] has been fully resolved as of [Time] UTC.

**Summary:**
Between [Start Time] and [End Time] UTC, users experienced [describe impact].
The issue was caused by [high-level cause] and was resolved by [high-level solution].

All systems are now operating normally. If you continue to experience issues,
please contact support at [support email/link].

We sincerely apologize for the inconvenience.

**Duration:** [X hours Y minutes]
**Started:** [Time] UTC
**Resolved:** [Time] UTC
```

### Template 3: Partial Resolution

**Channel:** #incident-[date]-[service]

```
**INCIDENT UPDATE - [HH:MM UTC]**

**Status:** Partially Resolved

**Resolved:**
✅ [Aspect 1 - fully recovered]
✅ [Aspect 2 - fully recovered]

**Still Affected:**
⚠️ [Aspect 3 - still degraded]
⚠️ [Aspect 4 - still working on]

**Current Focus:**
[What team is working on now]

**Next Update:** [Time]
```

---

## Postmortem Summary

### Template 1: Internal Postmortem Announcement

**Subject:** Postmortem Available: [Incident Title]

**Channel:** #engineering, #incidents

```
📝 **POSTMORTEM PUBLISHED**

**Incident:** INC-2024-XXXX - [Service Name] [Issue]
**Date:** [Incident Date]
**Severity:** SEV-[X]
**Duration:** [X hours Y minutes]

**Impact:**
- [User impact]
- [Business impact]

**Root Cause:**
[One-sentence summary]

**Key Takeaways:**
1. [Learning 1]
2. [Learning 2]
3. [Learning 3]

**Action Items:** [X] total, [Y] completed
- [High priority item 1 - Owner - Due date]
- [High priority item 2 - Owner - Due date]

**Full Postmortem:** [Link to document]

Please read and add any feedback or questions to the document.

Postmortem review meeting: [Date/Time/Zoom link]
```

### Template 2: Customer-Facing Postmortem Summary

**Subject:** Incident Report: [Service Name] Outage on [Date]

```
Dear valued customers,

On [Date] between [Start Time] and [End Time] UTC, [Service Name] experienced
[describe issue], affecting [scope of impact].

**What Happened:**
[Clear, non-technical explanation of the issue]

**Impact:**
[Describe customer impact]

**Resolution:**
[What was done to fix it]

**What We're Doing to Prevent This:**
We have identified several improvements to prevent similar incidents:
1. [Improvement 1]
2. [Improvement 2]
3. [Improvement 3]

These changes will be implemented by [date].

**Our Commitment:**
We take the reliability of our service very seriously. We have conducted a
thorough review of this incident and are committed to learning from it to
serve you better.

If you have any questions or concerns, please contact us at [support contact].

Thank you for your patience and understanding.

Sincerely,
[Name]
[Title]
```

---

## Customer Communications

### Template 1: Proactive Customer Notification

**Subject:** Important Service Notice - [Service Name]

```
Dear [Customer Name],

We wanted to inform you about a service issue that may have affected your
recent usage of [Service Name].

**When:**
[Start Time] to [End Time] on [Date]

**What Happened:**
[Brief, clear explanation]

**Impact to You:**
[Specific impact to their account/usage]

**Resolution:**
The issue has been resolved, and all systems are operating normally.

**What We Did:**
[Brief explanation of fix]

**What We're Doing:**
We are implementing additional safeguards to prevent this from happening again.

If you experienced any data issues or have concerns, please contact our support
team at [support email/phone] and reference case #[number].

We sincerely apologize for any inconvenience this may have caused.

Thank you for your understanding,
[Name]
[Company]
```

### Template 2: Customer Apology Email

**Subject:** Our Apology for Recent Service Disruption

```
Dear [Customer Name],

We want to sincerely apologize for the service disruption you experienced
on [Date]. We know how important [Service] is to your [business/work/etc.],
and we let you down.

**What Happened:**
[Clear explanation]

**Our Response:**
Our team responded immediately and resolved the issue within [duration].
We have conducted a thorough review and identified the root cause.

**Making It Right:**
As a token of our apology, we are [credit/discount/extension/other compensation].

**Our Commitment to You:**
We are implementing the following improvements:
[List improvements]

Your trust means everything to us. If you have any questions or concerns,
please don't hesitate to reach out to me directly at [email].

Thank you for your patience and continued partnership.

Sincerely,
[Name]
[Title]
[Company]
[Direct contact information]
```

---

## Internal Team Updates

### Template 1: Team Notification (Not On-Call)

**Subject:** FYI: Incident in Progress - [Service]

**Channel:** #team-[name]

```
**FYI - INCIDENT IN PROGRESS**

There is currently a SEV-[X] incident affecting [Service Name].

**Status:** [Current status]
**Impact:** [Brief impact description]
**IC:** @[name]
**Incident Channel:** #incident-[date]-[service]

**What you need to know:**
[Relevant information for team]

**Do you need to do anything?**
[Yes/No - if yes, specify what]

**Follow along:** #incident-[date]-[service]

We'll update when resolved.
```

### Template 2: After-Hours Escalation

**Subject:** 🚨 URGENT: Incident Escalation Required

**Channel:** Direct message to specific person

```
Hi @[name],

I'm escalating this incident and need your help.

**Incident:** INC-2024-XXXX
**Severity:** SEV-[X]
**Issue:** [Brief description]
**Incident Channel:** #incident-[date]-[service]

**Why I'm escalating:**
[Specific reason: need expertise, can't resolve, beyond scope, etc.]

**What I need from you:**
[Specific ask]

**Current war room:** [Zoom link]

Can you join? Let me know if you can't and I'll find someone else.

Thanks,
[Name]
```

---

## Executive Briefings

### Template 1: Executive Incident Brief (During Incident)

**To:** VP Engineering, CTO
**Subject:** Executive Brief: SEV-1 Incident - [Service]

```
**EXECUTIVE INCIDENT BRIEF**

**Status:** [Status] as of [Time] UTC
**Next Update:** [Time]

**SITUATION:**
[Service] is experiencing [issue], affecting [scope of users].

**IMPACT:**
- Users Affected: [number/percentage]
- Business Impact: [revenue, SLA, customer impact]
- Duration So Far: [X hours Y minutes]

**RESPONSE:**
- Incident Commander: [Name]
- Team Size: [X people actively working]
- Status: [Investigating/Mitigating/Monitoring]

**ROOT CAUSE:**
[If known, otherwise: "Still investigating"]

**RESOLUTION PLAN:**
[Brief description of plan]
**ETA:** [Time estimate or "Unknown at this time"]

**CUSTOMER COMMUNICATION:**
- Status Page: [Updated/Will update at X time]
- Customer Emails: [Sent/Planned for X time/Not needed]

**SUPPORT NEEDS:**
[Any support needed from leadership]

[IC Name]
Incident Commander
```

### Template 2: Post-Incident Executive Summary

**To:** Leadership Team
**Subject:** Incident Summary: [Date] - [Service] Outage

```
**INCIDENT SUMMARY**

**Overview:**
On [Date], [Service] experienced [issue] resulting in [impact].

**KEY FACTS:**
- Severity: SEV-[X]
- Duration: [X hours Y minutes]
- Users Affected: [number/percentage]
- Business Impact: [estimated revenue impact]
- Time to Detect: [duration]
- Time to Resolve: [duration]

**CAUSE:**
[Root cause in 1-2 sentences]

**RESOLUTION:**
[What was done to resolve]

**CUSTOMER IMPACT:**
[Describe customer impact and any comms sent]

**LESSONS LEARNED:**
1. [Key learning 1]
2. [Key learning 2]
3. [Key learning 3]

**PREVENTIVE ACTIONS:**
[X total action items, [Y] high priority]
- [Critical action 1 - Owner - Due date - Status]
- [Critical action 2 - Owner - Due date - Status]

**COST:**
- Engineering Time: [X person-hours]
- Revenue Impact: $[amount]
- Customer Credits: $[amount]
- **Total:** $[amount]

**NEXT STEPS:**
- Full postmortem: [Link]
- Postmortem review: [Date]
- Actions tracking: [Link]

Please let me know if you have questions.

[Name]
[Title]
```

---

## Communication Best Practices

### During Incidents

1. **Be Clear and Concise**
   - Use simple language
   - Avoid jargon when possible
   - Be specific about impact

2. **Be Timely**
   - Send updates at promised intervals
   - Don't wait for perfect information
   - It's better to say "still investigating" than to be silent

3. **Be Honest**
   - Don't speculate or promise what you can't deliver
   - Admit when you don't know something
   - Under-promise and over-deliver

4. **Be Professional**
   - Stay calm in communications
   - Avoid blame
   - Focus on resolution

### Customer Communications

1. **Acknowledge Impact**
   - Show empathy
   - Acknowledge the inconvenience
   - Thank them for patience

2. **Explain Clearly**
   - Use non-technical language
   - Focus on impact to them
   - Explain what you're doing

3. **Provide Timeline**
   - When it started
   - When it was resolved
   - How long they were affected

4. **Show Accountability**
   - Take responsibility
   - Explain preventive measures
   - Provide contact for questions

---

## Tone Guidelines

### Internal Communications

- **Direct and factual**
- Professional but casual
- Use emoji sparingly (status indicators okay: ✅ ❌ 🔄)
- Focus on actions and facts

### External Communications

- **Professional and empathetic**
- No jargon or technical terms
- Customer-focused language
- Apologetic when appropriate
- Solution-oriented

### Executive Communications

- **Concise and business-focused**
- Lead with impact
- Include business metrics
- Clear action items
- Professional tone

---

## Quick Reference

| Audience            | Channel           | Frequency               | Tone                       |
| ------------------- | ----------------- | ----------------------- | -------------------------- |
| On-Call Team        | Slack             | Real-time               | Direct, technical          |
| Broader Engineering | Slack/Email       | Major updates           | Professional, informative  |
| Leadership          | Email             | Every 30-60 min         | Concise, business-focused  |
| Customers           | Email/Status Page | Hourly or major updates | Empathetic, clear          |
| Support Team        | Slack/Email       | Every update            | Clear, with talking points |

---

**Questions?** Contact the On-Call Working Group in #on-call-feedback
