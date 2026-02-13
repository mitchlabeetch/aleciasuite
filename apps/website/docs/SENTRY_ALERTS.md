# Sentry Alert Rules Configuration

This document describes the recommended Sentry alert rules for the Alecia Panel application.

## Critical Alerts (Immediate Response Required)

### 1. Error Rate Spike
- **Trigger**: When the error rate exceeds 1% of total requests over 5 minutes
- **Severity**: Critical
- **Action**: PagerDuty/Slack notification + Email
- **Sentry Config**:
  ```
  Alert Rule: High Error Rate
  Conditions: Event count > 50 in 5 minutes
  Actions: Send notification to #alerts-m&a, Send email to on-call
  ```

### 2. Unhandled Exceptions
- **Trigger**: Any unhandled JavaScript error
- **Severity**: High
- **Action**: Slack notification
- **Sentry Config**:
  ```
  Alert Rule: Unhandled Exceptions
  Conditions: Event type = error AND handled = false
  Filter: environment = production
  Actions: Send notification to #alerts-m&a
  ```

### 3. Performance Degradation
- **Trigger**: P95 latency > 3 seconds for any transaction
- **Severity**: Medium
- **Action**: Slack notification
- **Sentry Config**:
  ```
  Alert Rule: Slow Transactions
  Conditions: Transaction duration p95 > 3000ms
  Filter: transaction contains /api/
  Actions: Send notification to #perf-alerts
  ```

## Warning Alerts (Review During Business Hours)

### 4. New Error Types
- **Trigger**: First occurrence of any new error type
- **Severity**: Low
- **Action**: Daily digest
- **Sentry Config**:
  ```
  Alert Rule: New Issue Alert
  Conditions: First seen event
  Actions: Email daily digest to dev team
  ```

### 5. Integration Failures
- **Trigger**: Pipedrive or O365 sync errors
- **Severity**: Medium
- **Action**: Slack notification
- **Sentry Config**:
  ```
  Alert Rule: Integration Errors
  Conditions: Tag "category" = "integration" AND Event count > 3 in 10 minutes
  Actions: Send notification to #integrations
  ```

## Setting Up Alerts in Sentry Dashboard

1. Go to **Settings > Alerts** in your Sentry project
2. Click **Create Alert Rule**
3. Select **Issue Alert** or **Metric Alert** based on the rule type
4. Configure conditions as described above
5. Add notification channels (Slack, email, PagerDuty)
6. Set the action interval to avoid alert fatigue

## Alert Response Playbook

| Alert | First Response | Escalation |
|-------|---------------|------------|
| Error Rate Spike | Check Sentry for common errors | Notify dev on-call |
| Unhandled Exception | Review stack trace, check related errors | Create issue if recurring |
| Performance Degradation | Check Convex dashboard for slow queries | Optimize or add indexes |
| New Error Type | Triage: is it critical or noise? | Add to backlog if needed |
| Integration Failure | Check API status pages | Contact integration support |

## Slack Channel Setup

Create these channels for alerts:
- `#alerts-m&a` - Critical production alerts
- `#perf-alerts` - Performance monitoring
- `#integrations` - Third-party integration status

## Environment Variables for Sentry

Ensure these are set in production:

```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=alecia-panel
SENTRY_AUTH_TOKEN=your-auth-token
```
