/**
 * Execute acquirer name updates using Node.js exec
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const backupPath = join(
	process.cwd(),
	"backups/convex_2026-01-22/extracted/transactions/documents.jsonl"
);

const backupContent = readFileSync(backupPath, "utf-8");
const backupLines = backupContent.trim().split("\n");

function extractCompanyNameFromLogo(logoPath: string): string | null {
	if (!logoPath) return null;

	const filename = logoPath.split("/").pop()?.replace(/\.(png|jpg|webp)$/, "") || "";

	const mapping: Record<string, string> = {
		"5_cadres_fonds_investisseurs_2": "Fonds investisseurs",
		"cei_image69": "CEI",
		"la_ba_architectes_laba_archi": "LABA Architectes",
		"fleurus_image4": "Fleurus",
		"river_bank_riverbank-avis": "Riverbank",
		"riverbank-avis": "Riverbank",
		"generis_capital_partners_bpi_france_bnp_paribas_image57": "Generis Capital Partners",
		"cr_dit_agricole_credit-agricole-logo-1987-present-3803300135": "Crédit Agricole",
		"credit-agricole-logo-1987-present-3803300135": "Crédit Agricole",
		"redpill_image40": "RedPill",
		"bpi_france_et_un_pool_bancaire_image54": "BPI France",
		"delta_drone_image21": "Delta Drone",
		"entrepreneur_invest_ei_logo": "Entrepreneur Invest",
		"ei_logo": "Entrepreneur Invest",
		"cr_dit_mutuel_crédit_mutuel_equity": "Crédit Mutuel Equity",
		"crédit_mutuel_equity": "Crédit Mutuel Equity",
		"french_food_company_generis_capital_partners_finorpa_image28": "French Food Capital",
		"dougen_prim_capture_d'écran_2025-12-23_145039": "Dougen Prim",
		"groupe_guillin_image62": "Groupe Guillin",
		"leclerc_franchis_logo-leclerc-227321883": "E.Leclerc",
		"logo-leclerc-227321883": "E.Leclerc",
		"a_plus_finance_image14": "A Plus Finance",
		"perseus_image67": "Perseus",
		"ergon_capital_image35": "Ergon Capital",
		"metagram_image76": "Metagram",
		"apax_partners_image70": "Apax Partners",
		"extendam_image71": "Extendam",
		"extendam_image24": "Extendam",
		"five_arrows_image50": "Five Arrows",
		"five_arrows_image8": "Five Arrows",
		"next_stage_image59": "Next Stage",
		"next_stage_image9": "Next Stage",
		"groupe_guillin_image32": "Groupe Guillin",
		"come_to_paris_image24": "Come to Paris",
		"logo_sia_partners": "SIA Partners",
		"sia_partners_image64": "SIA Partners",
		"apicap_image65": "Apicap",
		"apicap_image26": "Apicap",
		"ci_prim_image48": "Cipres Assurances",
		"uside_image45": "Uside",
		"capelli_image16": "Capelli",
		"soleo_image30": "Soleo",
		"caisse_d'épargne_bretagne_caisse-d-epargne-bretagne-pays-de-loire.svg": "Caisse Epargne Bretagne",
		"banque_populaire_et_caisse_d_epargne": "Caisse Epargne Groupe",
		"banque_populaire_et_caisse_d_epargne_image80": "Caisse Epargne Groupe",
		"lovial_1": "Lovial",
		"ardian_image43": "Ardian",
		"ardian_image17": "Ardian",
		"ateliers_peyrache_image9": "Les Ateliers Peyrache",
		"filiassur_image7": "Filiassur",
		"dogs_security_image5": "Dogs Security",
		"bolden_bolden": "Bolden",
		"africinvest": "AfricInvest",
		"africinvest_image48": "AfricInvest",
	};

	if (mapping[filename]) {
		return mapping[filename];
	}

	return null;
}

let updated = 0;
let failed = 0;

for (const line of backupLines) {
	const doc = JSON.parse(line);
	if (doc.acquirerLogo) {
		const acquirerName = extractCompanyNameFromLogo(doc.acquirerLogo);
		if (acquirerName) {
			const args = JSON.stringify({ id: doc._id, acquirerName });
			try {
				console.log(`Updating ${doc.clientName} -> ${acquirerName}`);
				execSync(`npx convex run transactions:update --prod '${args}'`, {
					stdio: "pipe",
					encoding: "utf-8",
				});
				updated++;
			} catch (error) {
				console.error(`Failed to update ${doc._id}:`, (error as Error).message);
				failed++;
			}
		}
	}
}

console.log(`\nUpdated: ${updated}, Failed: ${failed}`);
