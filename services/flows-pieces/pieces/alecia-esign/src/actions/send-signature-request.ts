// services/flows-pieces/pieces/alecia-esign/src/actions/send-signature-request.ts
// Send signature request via DocuSeal

import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const sendSignatureRequest = createAction({
  name: 'send-signature-request',
  displayName: 'Send Signature Request',
  description: 'Request signatures via DocuSeal',
  props: {
    docusealUrl: Property.ShortText({
      displayName: 'DocuSeal URL',
      defaultValue: 'https://sign.alecia.markets',
      required: false,
    }),
    apiKey: Property.ShortText({
      displayName: 'DocuSeal API Key',
      required: true,
    }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'DocuSeal template ID (or use documentUrl)',
      required: false,
    }),
    documentUrl: Property.ShortText({
      displayName: 'Document URL',
      description: 'URL to PDF document (if not using template)',
      required: false,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description: 'Array of {email, name, role}',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Email Message',
      required: false,
    }),
    expiresAt: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'Signature request expiration',
      required: false,
    }),
  },
  async run(context) {
    const submissionData: any = {
      send_email: true,
      subject: context.propsValue.subject,
      message: context.propsValue.message || 'Veuillez signer ce document.',
      submitters: (context.propsValue.signers as any[]).map((signer, idx) => ({
        email: signer.email,
        name: signer.name,
        role: signer.role || 'Signer',
      })),
    };

    if (context.propsValue.templateId) {
      submissionData.template_id = context.propsValue.templateId;
    } else if (context.propsValue.documentUrl) {
      submissionData.template = {
        document_url: context.propsValue.documentUrl,
      };
    } else {
      throw new Error('Either templateId or documentUrl must be provided');
    }

    if (context.propsValue.expiresAt) {
      submissionData.expires_at = new Date(context.propsValue.expiresAt).toISOString();
    }

    const response = await axios.post(
      `${context.propsValue.docusealUrl}/api/submissions`,
      submissionData,
      {
        headers: {
          'X-Auth-Token': context.propsValue.apiKey,
          'Content-Type': 'application/json',
        },
      }
    ).catch(error => {
      throw new Error(`Failed to send signature request: ${error.response?.data?.message || error.message}`);
    });

    return {
      success: true,
      submissionId: response.data.id,
      status: response.data.status || 'pending',
      signers: response.data.submitters?.map((s: any) => ({
        email: s.email,
        name: s.name,
        status: s.status || 'pending',
        signedAt: s.completed_at || null,
      })) || [],
      expiresAt: response.data.expires_at,
      viewUrl: `${context.propsValue.docusealUrl}/d/${response.data.slug}`,
    };
  },
});
