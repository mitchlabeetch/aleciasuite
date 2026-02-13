import { createAction, Property } from "@activepieces/pieces-framework";

export const enrichCompany = createAction({
  name: "enrich_company",
  displayName: "Enrich Company",
  description: "Get detailed company data from Pappers using SIREN number",
  props: {
    siren: Property.ShortText({ displayName: "SIREN", required: true }),
  },
  async run(context) {
    const apiKey = (context.auth as any).pappersApiKey;
    const url = `https://api.pappers.fr/v2/entreprise?api_token=${apiKey}&siren=${context.propsValue.siren}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pappers API error: ${res.status}`);
    const data = await res.json();
    return { siren: context.propsValue.siren, company: data };
  },
});
