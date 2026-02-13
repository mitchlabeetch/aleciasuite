# Alecia M&A Workflow Templates

**Version**: 1.0.0
**Created**: 2026-02-09
**Activepieces**: Community Edition

---

## Overview

5 pre-built workflow templates for common M&A processes in the Alecia Suite. These templates leverage the 9 custom Activepieces pieces to automate deal pipeline management.

## Templates

### 1. New Deal Intake
**File**: `new-deal-intake.json`
**Trigger**: Webhook (manual or form submission)

**Flow**:
1. Create deal in PostgreSQL pipeline
2. Research target company via Pappers API
3. Send in-app notification to assigned team member
4. Send email notification
5. Schedule kickoff meeting (Teams)

**Use Case**: Automate intake of new deal opportunities from various sources (CRM, website form, referrals).

---

### 2. Due Diligence Automation
**File**: `due-diligence-automation.json`
**Trigger**: Deal stage changed to "Due Diligence"

**Flow**:
1. Create virtual data room in DocuSeal
2. Generate DD checklist based on deal type
3. Notify team members via email
4. Schedule DD kickoff meeting

**Use Case**: Automatically set up due diligence infrastructure when a deal advances to DD stage.

---

### 3. Buyer Outreach Campaign
**File**: `buyer-outreach-campaign.json`
**Trigger**: Webhook (manual with buyer list)

**Flow**:
1. Fetch deal information from database
2. Generate investment teaser (LOI template)
3. Send personalized emails to buyer list
4. Log campaign activity to deal timeline

**Use Case**: Efficiently reach out to multiple potential buyers for sell-side mandates.

---

### 4. LOI Signature Flow
**File**: `loi-signature-flow.json`
**Trigger**: Deal stage changed to "Negotiation"

**Flow**:
1. Generate LOI document (Markdown → PDF)
2. Upload to Minio S3 storage
3. Send for signature via DocuSeal
4. Notify team
5. Schedule follow-up reminder (3 days)
6. Check signature status

**Use Case**: Automate LOI generation and signature process.

---

### 5. Deal Closing Automation
**File**: `deal-closing-automation.json`
**Trigger**: Deal stage changed to "Closing"

**Flow**:
1. Export final valuation report to Excel
2. Generate closing documents list
3. Send final documents for signature
4. Archive all deal documents to Minio
5. Mark deal as "Closed Won"
6. Send celebration email to team
7. Create post-deal integration tasks

**Use Case**: Streamline final closing steps and celebrate wins.

---

## Installation

### Import into Activepieces

1. Access Activepieces at `https://flows.alecia.fr`
2. Navigate to **Flows** → **Import**
3. Upload JSON template file
4. Configure connections:
   - Microsoft Graph (for email/calendar)
   - DocuSeal API key
   - Pappers API key
5. Activate the flow

### Required Connections

All templates require these authenticated connections:

```json
{
  "microsoft": {
    "type": "oauth2",
    "scope": ["Mail.Send", "Calendars.ReadWrite"]
  },
  "docuseal": {
    "type": "api_key",
    "header": "X-Auth-Token"
  },
  "pappers": {
    "type": "api_key",
    "param": "api_token"
  }
}
```

### Environment Variables

Ensure these are set in Activepieces container:

```bash
DATABASE_URL=postgresql://alecia:password@postgres:5432/alecia
MINIO_ROOT_USER=alecia
MINIO_ROOT_PASSWORD=<password>
GOTENBERG_URL=http://gotenberg:3000
```

---

## Customization

### Modify Template Fields

Edit JSON files to customize:
- Email templates (subject, body)
- Meeting durations and descriptions
- Notification messages
- Stage names
- Automation triggers

### Add Custom Logic

Use **CODE** action type to inject custom business logic:

```json
{
  "name": "custom_logic",
  "displayName": "Custom Business Logic",
  "type": "CODE",
  "settings": {
    "code": "// Your TypeScript/JavaScript code here\nreturn { result: 'value' };"
  }
}
```

### Chain Multiple Templates

Trigger one template from another using webhooks:

```javascript
// In template A final step
await fetch('https://flows.alecia.fr/webhook/template-b', {
  method: 'POST',
  body: JSON.stringify({ dealId: deal.id })
});
```

---

## Testing

### Local Testing

```bash
# Start Activepieces locally
docker-compose up activepieces-app

# Import template via UI
# Trigger manually with test payload
```

### Test Payloads

**New Deal Intake**:
```json
{
  "dealTitle": "Acquisition of TechCorp SAS",
  "dealType": "buy_side",
  "targetValue": 5000000,
  "companyName": "TechCorp SAS",
  "targetCompanyId": "uuid-here",
  "assignedTo": ["user_123"],
  "assignedToEmail": "advisor@alecia.fr",
  "source": "referral",
  "contactPerson": "Jean Dupont"
}
```

**Buyer Outreach**:
```json
{
  "dealId": "deal_123",
  "buyers": [
    { "email": "buyer1@company.com", "name": "John Smith", "company": "Acme Corp" },
    { "email": "buyer2@company.com", "name": "Jane Doe", "company": "Beta Inc" }
  ],
  "sector": "Technology",
  "location": "Paris, France"
}
```

---

## Troubleshooting

### Common Issues

**1. Template import fails**
- Check JSON syntax (use JSONLint)
- Ensure piece names match installed pieces
- Verify Activepieces version compatibility

**2. Flow execution errors**
- Check connection credentials (Microsoft, DocuSeal, Pappers)
- Verify environment variables are set
- Review Activepieces logs: `docker logs alecia-activepieces`

**3. Database connection errors**
- Ensure `DATABASE_URL` is correct
- Check PostgreSQL is running
- Verify `alecia` user has permissions

**4. Email sending fails**
- Verify Microsoft Graph OAuth token is valid
- Check email addresses are properly formatted
- Review Microsoft 365 sending limits

---

## Monitoring

### Flow Execution Logs

View execution history in Activepieces UI:
- **Flows** → **[Flow Name]** → **Runs**
- Filter by status (success, failed, running)
- View step-by-step execution details

### Performance Metrics

Track workflow performance:
- Average execution time
- Success/failure rates
- Most-used flows
- Bottleneck identification

---

## Roadmap

**Future Templates**:
- Post-merger integration (PMI) workflows
- Quarterly portfolio review automation
- LP reporting generation
- Fund performance dashboards

**Enhancements**:
- AI-powered deal matching
- Automated valuation suggestions
- Smart document extraction
- Predictive deal scoring

---

## Support

**Documentation**: `docs/M&A_WORKFLOW_PIECES_GUIDE.md`
**Issues**: GitHub or internal support

**Generated by**: Alecia Suite automation
**Last Updated**: 2026-02-09
