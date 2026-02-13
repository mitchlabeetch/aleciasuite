export interface NewsArticle {
	slug: string;
	title: string;
	date: string;
	category: string;
	imageUrl?: string;
	content: string;
	excerpt: string;
	pdfUrl?: string;
}

export const newsArticles: NewsArticle[] = [
	{
		slug: "safe-groupe-acquisition",
		title: "Alecia conseille SAFE GROUPE dans l'acquisition de Dogs Security",
		date: "15 Décembre 2024",
		category: "Communiqué",
		imageUrl: "/assets/Operations_alecia/Safe_Groupe.png", // Placeholder path
		excerpt:
			"Acteur majeur de la sécurité globale, SAFE GROUPE renforce son maillage territorial avec cette opération stratégique.",
		content: `
      <p>Alecia est fier d'avoir accompagné SAFE GROUPE dans l'acquisition de la société Dogs Security. Cette opération permet à SAFE GROUPE de consolider sa présence dans le sud de la France et d'intégrer de nouvelles compétences en sécurité cynophile.</p>
    `,
		pdfUrl: "/assets/press/safe-groupe.pdf",
	},
	{
		slug: "lerosey-dougen",
		title:
			"Alecia conseille Transports Lerosey pour l'acquisition de Dougen Prim",
		date: "18 Décembre 2024",
		category: "Communiqué",
		excerpt:
			"Transports Lerosey renforce son maillage avec l'acquisition de Dougen Prim (11,5 m€ CA).",
		content: `
      <p>Les Transports Lerosey, acteur historique du transport routier, annoncent l'acquisition de Dougen Prim. Cette opération de croissance externe, conseillée par Alecia, permet au groupe d'atteindre une taille critique et de diversifier son portefeuille clients.</p>
    `,
		pdfUrl: "/assets/press/lerosey.pdf",
	},
	{
		slug: "acquisition-leader-industrie",
		title: "Alecia accompagne l'acquisition d'un leader de l'industrie 4.0",
		date: "12 Mars 2024",
		category: "Transaction",
		imageUrl:
			"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80",
		excerpt:
			"Notre équipe a conseillé avec succès le groupe industriel dans sa stratégie de croissance externe.",
		content: `
      <p>Alecia Partners est fière d'annoncer la finalisation d'une opération majeure dans le secteur de l'industrie 4.0. Notre équipe a accompagné un groupe industriel de premier plan dans l'acquisition stratégique d'une PME innovante spécialisée dans la robotique collaborative.</p>

      <h3>Une synergie stratégique</h3>
      <p>Cette opération permet à notre client de renforcer sa position sur le marché européen et d'intégrer des technologies de pointe à son offre existante. La cible, reconnue pour son expertise en automatisation, bénéficiera quant à elle de la force de frappe commerciale d'un grand groupe.</p>

      <h3>Le rôle d'Alecia</h3>
      <p>Nos équipes sont intervenues sur l'ensemble du processus :</p>
      <ul>
        <li>Identification de la cible</li>
        <li>Valorisation et structuration de l'offre</li>
        <li>Négociations exclusives</li>
        <li>Audit et Due Diligence</li>
        <li>Closing de l'opération</li>
      </ul>

      <p>Cette transaction illustre notre capacité à mener à bien des opérations complexes cross-border.</p>
    `,
	},
	{
		slug: "levee-de-fonds-tech",
		title: "Succès d'une levée de fonds de 5 m€ pour une Scale-up",
		date: "28 Février 2024",
		category: "Levée de fonds",
		imageUrl:
			"https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80",
		excerpt:
			"Nouvelle étape franchie pour cette pépite de la Tech française accompagnée par nos experts.",
		content: `
      <p>Nous sommes ravis d'avoir accompagné cette scale-up prometteuse dans son tour de table de série A. Cette levée de fonds de 5 millions d'euros va permettre d'accélérer le développement commercial et l'innovation produit.</p>

      <h3>Investisseurs de premier plan</h3>
      <p>Le tour de table a réuni des fonds d'investissement reconnus ainsi que des Business Angels stratégiques, témoignant de la solidité du modèle économique et du potentiel de croissance.</p>

      <h3>Perspectives</h3>
      <p>Avec ces nouveaux capitaux, l'entreprise prévoit de doubler ses effectifs d'ici la fin de l'année et de s'attaquer au marché nord-américain.</p>
    `,
	},
	{
		slug: "analyse-marche-2024",
		title: "Tendances M&A : Bilan T1 2024 et perspectives",
		date: "10 Avril 2024",
		category: "Analyse",
		imageUrl:
			"https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80",
		excerpt:
			"Découvrez notre analyse exclusive sur les dynamiques du marché des fusions-acquisitions.",
		content: `
      <p>Le premier trimestre 2024 marque un tournant dans le marché du M&A. Après une année 2023 en demi-teinte, nous observons un regain d'activité significatif, porté par la stabilisation des taux d'intérêt et le retour de la confiance des investisseurs.</p>

      <h3>Secteurs en vogue</h3>
      <p>Les secteurs de la santé, de la transition énergétique et de la cybersécurité continuent d'attirer l'essentiel des capitaux. Les valorisations restent soutenues pour les actifs de qualité, tandis que les processus se fluidifient.</p>

      <h3>Notre vision pour la suite</h3>
      <p>Nous anticipons une accélération des opérations mid-cap au second semestre, avec une consolidation accrue dans les services B2B.</p>
    `,
	},
];

export function getNewsArticleBySlug(slug: string): NewsArticle | undefined {
	return newsArticles.find((a) => a.slug === slug);
}

export function parseFrenchDate(dateStr: string): Date {
	const months: { [key: string]: number } = {
		janvier: 0,
		février: 1,
		mars: 2,
		avril: 3,
		mai: 4,
		juin: 5,
		juillet: 6,
		août: 7,
		septembre: 8,
		octobre: 9,
		novembre: 10,
		décembre: 11,
		Janvier: 0,
		Février: 1,
		Mars: 2,
		Avril: 3,
		Mai: 4,
		Juin: 5,
		Juillet: 6,
		Août: 7,
		Septembre: 8,
		Octobre: 9,
		Novembre: 10,
		Décembre: 11,
	};
	const parts = dateStr.split(" ");
	if (parts.length >= 3) {
		const day = parseInt(parts[0], 10);
		const month = months[parts[1]];
		const year = parseInt(parts[2], 10);
		if (!isNaN(day) && month !== undefined && !isNaN(year)) {
			return new Date(Date.UTC(year, month, day));
		}
	}
	return new Date();
}
