const PAPPERS_API_KEY = process.env.PAPPERS_API_KEY;
const PAPPERS_BASE_URL = "https://api.pappers.fr/v2";

export const pappers = {
  async searchCompany(query: string) {
    const url = `${PAPPERS_BASE_URL}/recherche?api_token=${PAPPERS_API_KEY}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pappers API error: ${res.status}`);
    const data = await res.json();
    return data.resultats;
  },

  async enrichBySiren(siren: string) {
    const url = `${PAPPERS_BASE_URL}/entreprise?api_token=${PAPPERS_API_KEY}&siren=${siren}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pappers API error: ${res.status}`);
    const data = await res.json();
    return data;
  },

  async getFinancials(siren: string) {
    const url = `${PAPPERS_BASE_URL}/entreprise?api_token=${PAPPERS_API_KEY}&siren=${siren}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pappers API error: ${res.status}`);
    const data = await res.json();
    return data.finances;
  },

  async getExecutives(siren: string) {
    const url = `${PAPPERS_BASE_URL}/entreprise?api_token=${PAPPERS_API_KEY}&siren=${siren}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pappers API error: ${res.status}`);
    const data = await res.json();
    return data.representants;
  },
};
