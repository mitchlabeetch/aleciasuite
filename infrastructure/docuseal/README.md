# Alecia Sign - DocuSeal Configuration

DocuSeal (AGPL-3.0) configuration for M&A electronic signatures and document management.

## Architecture

- **Service**: DocuSeal (official image `docuseal/docuseal:latest`)
- **Branding**: Configured via environment variables (no fork needed)
- **Storage**: Minio S3-compatible object storage (`alecia-signatures` bucket)
- **Database**: Shared PostgreSQL instance
- **Domain**: `sign.alecia.fr`

## Configuration

### Docker Compose

The `docker-compose.yml` includes:

- **Database**: PostgreSQL connection to shared Alecia database
- **Branding**:
  - `FORCE_SSL=true` - Enforce HTTPS
  - `HOST=sign.alecia.fr` - Domain configuration
  - `COMPANY_NAME=Alecia` - Company branding
- **Storage**: S3-compatible storage via Minio
- **Templates**: Mounted from `./templates` directory (read-only)

### Environment Variables Required

Add to your `.env` file:

```bash
DOCUSEAL_SECRET_KEY=<generate_with_openssl_rand_hex_64>
POSTGRES_PASSWORD=<your_postgres_password>
MINIO_ROOT_USER=<your_minio_user>
MINIO_ROOT_PASSWORD=<your_minio_password>
```

Generate the secret key:

```bash
openssl rand -hex 64
```

## M&A Document Templates

Five pre-configured French templates for M&A workflows:

### 1. NDA (Accord de Confidentialité)
**File**: `templates/nda-fr.json`

Standard confidentiality agreement for M&A operations.

**Key fields**:
- Disclosing and receiving parties
- Project codename
- Duration (default: 24 months)
- Dual signatures

### 2. LOI (Lettre d'Intention)
**File**: `templates/loi-fr.json`

Non-binding letter of intent for acquisition.

**Key fields**:
- Buyer and seller information
- Proposed price and structure
- Exclusivity period (default: 90 days)
- Due diligence scope
- Target closing date
- Dual signatures

### 3. Sell-Side Mandate (Mandat de Vente)
**File**: `templates/sell-mandate-fr.json`

Exclusive sell-side M&A advisory mandate.

**Key fields**:
- Client company information
- Mandate scope and type
- Target valuation
- Success fee percentage
- Retainer fee
- Duration (default: 12 months)
- Exclusivity clause
- Dual signatures

### 4. Buy-Side Mandate (Mandat d'Acquisition)
**File**: `templates/buy-mandate-fr.json`

Buy-side M&A search and advisory mandate.

**Key fields**:
- Client information
- Acquisition criteria (sector, size, geography)
- Budget range
- Fee structure
- Duration (default: 12 months)
- Dual signatures

### 5. VDR Access Agreement (Engagement de Confidentialité - Accès Data Room)
**File**: `templates/vdr-access-fr.json`

Confidentiality agreement for virtual data room access.

**Key fields**:
- Participant details (name, company, role, email)
- Project codename
- Access level
- Confidentiality duration (default: 36 months)
- Watermark acknowledgment
- Signature and date

## Template Import

### Using the Import Script

```bash
# Get your API key from DocuSeal admin panel
# Settings > API > Generate API Key

./import-templates.sh <YOUR_API_KEY>
```

The script will:
1. Validate the templates directory
2. Import all JSON templates via DocuSeal REST API
3. Report success/failure for each template

### Manual Import via API

```bash
curl -X POST https://sign.alecia.fr/api/templates \
  -H "X-Auth-Token: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @templates/nda-fr.json
```

### Manual Import via UI

1. Navigate to `https://sign.alecia.fr/admin/templates`
2. Click "New Template"
3. Upload or paste JSON template
4. Configure field positions on document
5. Save template

## Deployment

### 1. Start the service

```bash
cd infrastructure/docuseal
docker-compose up -d
```

### 2. Initial setup

Access `https://sign.alecia.fr` and complete the initial admin setup.

### 3. Create S3 bucket

Ensure the `alecia-signatures` bucket exists in Minio:

```bash
# Using mc (Minio client)
mc mb alecia-s3/alecia-signatures
mc anonymous set download alecia-s3/alecia-signatures
```

### 4. Import templates

```bash
./import-templates.sh <YOUR_API_KEY>
```

## Integration with Alecia Suite

### With Alecia Business Intelligence (CRM)

- Trigger signature workflows from deal pipeline
- Auto-populate templates with deal data
- Track signature status in CRM

### With Alecia Flows (Activepieces)

Create custom pieces for:
- **Trigger**: Document signed webhook
- **Action**: Create signature request
- **Action**: Download signed document to Minio

### With Alecia Colab (VDR)

- Link VDR access to signed confidentiality agreements
- Auto-generate VDR access after signature
- Track who has signed vs who has VDR access

## API Reference

DocuSeal REST API documentation: https://www.docuseal.co/docs/api

### Common Endpoints

- `POST /api/templates` - Create template
- `GET /api/templates` - List templates
- `POST /api/submissions` - Create signature request
- `GET /api/submissions` - List signature requests
- `GET /api/submissions/:id` - Get signature details
- `GET /api/submissions/:id/download` - Download signed document

## Security Considerations

1. **SSL/TLS**: Always use HTTPS in production (enforced via `FORCE_SSL=true`)
2. **API Keys**: Store securely, rotate regularly
3. **S3 Access**: Limit Minio bucket access to DocuSeal service only
4. **Database**: Use strong passwords, separate schema if needed
5. **Watermarks**: Enable for VDR documents to track leaks
6. **Audit Logs**: DocuSeal tracks all signature events

## Troubleshooting

### Templates not appearing

- Check volume mount: `docker-compose logs docuseal`
- Verify JSON syntax: `jq . templates/*.json`
- Import via API if volume mount fails

### Storage errors

- Verify Minio credentials
- Check bucket exists and is accessible
- Test S3 endpoint: `curl https://s3.alecia.fr`

### Database connection issues

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `alecia` exists

## License

DocuSeal is licensed under AGPL-3.0. This configuration uses the official image without modifications.

## Support

- DocuSeal Docs: https://www.docuseal.co/docs
- DocuSeal GitHub: https://github.com/docusealco/docuseal
- Alecia Internal: Contact infrastructure team
