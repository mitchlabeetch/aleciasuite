// services/flows-pieces/pieces/alecia-docgen/src/actions/generate-loi.ts
// Generate Letter of Intent from template

import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';
import FormData from 'form-data';

export const generateLOI = createAction({
  name: 'generate-loi',
  displayName: 'Generate LOI',
  description: 'Generate Letter of Intent from template',
  props: {
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      required: true,
    }),
    buyerName: Property.ShortText({
      displayName: 'Buyer Name',
      required: true,
    }),
    sellerName: Property.ShortText({
      displayName: 'Seller Name',
      required: true,
    }),
    targetCompany: Property.ShortText({
      displayName: 'Target Company',
      required: true,
    }),
    proposedValue: Property.Number({
      displayName: 'Proposed Value (EUR)',
      required: true,
    }),
    exclusivityDays: Property.Number({
      displayName: 'Exclusivity Period (days)',
      defaultValue: 60,
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Response Due Date',
      required: true,
    }),
    gotenbergUrl: Property.ShortText({
      displayName: 'Gotenberg URL',
      defaultValue: 'http://gotenberg:3000',
      required: false,
    }),
  },
  async run(context) {
    // Generate markdown LOI
    const markdown = `---
title: LETTRE D'INTENTION
author: ${context.propsValue.buyerName}
date: ${new Date().toLocaleDateString('fr-FR')}
---

# LETTRE D'INTENTION

**Date :** ${new Date().toLocaleDateString('fr-FR')}
**De :** ${context.propsValue.buyerName}
**À :** ${context.propsValue.sellerName}
**Objet :** Proposition d'acquisition de ${context.propsValue.targetCompany}

---

## 1. Transaction Proposée

${context.propsValue.buyerName} (« l'Acquéreur ») exprime par la présente son intention d'acquérir 100% des parts sociales de ${context.propsValue.targetCompany} (« la Cible ») auprès de ${context.propsValue.sellerName} (« le Vendeur »).

## 2. Prix d'Acquisition Proposé

Le prix d'acquisition proposé pour la Cible s'élève à **${context.propsValue.proposedValue.toLocaleString('fr-FR')} EUR**.

## 3. Période d'Exclusivité

Le Vendeur s'engage à accorder à l'Acquéreur une période de négociation exclusive de **${context.propsValue.exclusivityDays} jours** à compter de la date de la présente lettre d'intention.

Durant cette période, le Vendeur s'interdit de :
- Négocier avec tout autre acquéreur potentiel
- Fournir des informations confidentielles à des tiers
- Prendre des engagements incompatibles avec la présente transaction

## 4. Due Diligence

L'Acquéreur procédera à une due diligence approfondie de la Cible, incluant notamment les aspects :
- Financiers (états financiers, fiscalité)
- Juridiques (statuts, contrats, litiges)
- Opérationnels (processus, organisation)
- Commerciaux (clients, fournisseurs, marchés)

Le Vendeur s'engage à fournir l'accès à toutes les informations nécessaires.

## 5. Conditions Suspensives

La réalisation de la transaction est soumise aux conditions suspensives suivantes :
- Résultats satisfaisants de la due diligence
- Obtention des autorisations réglementaires nécessaires
- Accord définitif des organes de gouvernance de l'Acquéreur

## 6. Confidentialité

Les parties s'engagent à traiter de manière strictement confidentielle toutes les informations échangées dans le cadre de cette transaction.

## 7. Délai de Réponse

Le Vendeur devra répondre à la présente lettre d'intention au plus tard le **${new Date(context.propsValue.dueDate).toLocaleDateString('fr-FR')}**.

---

## Signatures

**Pour l'Acquéreur :**

${context.propsValue.buyerName}

Nom : ______________________
Fonction : __________________
Date : _____________________
Signature :


**Pour le Vendeur :**

${context.propsValue.sellerName}

Nom : ______________________
Fonction : __________________
Date : _____________________
Signature :

---

*Document généré automatiquement par Alecia Suite*
`;

    // Convert to PDF via Gotenberg
    const formData = new FormData();
    formData.append('files', Buffer.from(markdown), {
      filename: 'index.md',
      contentType: 'text/markdown',
    });

    const pdfResponse = await axios.post(
      `${context.propsValue.gotenbergUrl}/forms/chromium/convert/markdown`,
      formData,
      {
        headers: formData.getHeaders(),
        responseType: 'arraybuffer',
      }
    );

    const filename = `loi_${context.propsValue.dealId}_${Date.now()}.pdf`;
    const pdfBase64 = Buffer.from(pdfResponse.data).toString('base64');

    return {
      success: true,
      filename,
      markdown,
      pdfSize: pdfResponse.data.length,
      pdfBase64,
      metadata: {
        dealId: context.propsValue.dealId,
        buyerName: context.propsValue.buyerName,
        sellerName: context.propsValue.sellerName,
        targetCompany: context.propsValue.targetCompany,
        proposedValue: context.propsValue.proposedValue,
        generatedAt: new Date().toISOString(),
      },
    };
  },
});
