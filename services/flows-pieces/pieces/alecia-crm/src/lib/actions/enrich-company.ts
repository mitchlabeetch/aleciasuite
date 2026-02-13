import { createAction, Property } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const enrichCompany = createAction({
  name: "enrich_company",
  displayName: "Enrich Company",
  description: "Enrich company data via Pappers API (SIREN, financials, executives)",
  props: {
    companyId: Property.ShortText({ displayName: "Company ID", required: true }),
    siren: Property.ShortText({ displayName: "SIREN (optional)", required: false }),
    pappersApiKey: Property.ShortText({ displayName: "Pappers API Key", required: true }),
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const { companyId, siren, pappersApiKey } = context.propsValue;

    let targetSiren = siren;

    if (!targetSiren) {
      const result = await pool.query("SELECT siren FROM shared.companies WHERE id = $1", [companyId]);
      targetSiren = result.rows[0]?.siren;
    }

    if (!targetSiren) {
      throw new Error("No SIREN found for company");
    }

    const response = await fetch(
      `https://api.pappers.fr/v2/entreprise?api_token=${pappersApiKey}&siren=${targetSiren}`
    );
    const pappersData = await response.json();

    await pool.query(
      `UPDATE shared.companies SET pappers_data = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(pappersData), companyId]
    );

    return pappersData;
  },
});
