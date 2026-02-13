// services/flows-pieces/pieces/alecia-pappers/src/actions/search-company.ts
// Search French companies via Pappers API

import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const searchCompany = createAction({
  name: 'search-company',
  displayName: 'Search Company',
  description: 'Search for French companies by name or SIREN',
  props: {
    apiKey: Property.ShortText({
      displayName: 'Pappers API Key',
      description: 'Get from https://www.pappers.fr/api',
      required: true,
    }),
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Company name or SIREN number',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      defaultValue: 10,
      required: false,
    }),
  },
  async run(context) {
    const response = await axios.get('https://api.pappers.fr/v2/recherche', {
      params: {
        api_token: context.propsValue.apiKey,
        q: context.propsValue.query,
        par_page: context.propsValue.limit || 10,
      },
    });

    return {
      success: true,
      total: response.data.total,
      companies: response.data.resultats.map((company: any) => ({
        siren: company.siren,
        name: company.nom_entreprise,
        legalForm: company.forme_juridique,
        address: company.siege?.adresse_ligne_1,
        city: company.siege?.ville,
        postalCode: company.siege?.code_postal,
        creationDate: company.date_creation,
        employees: company.tranche_effectif_salarie,
        revenue: company.chiffre_affaires,
      })),
    };
  },
});
