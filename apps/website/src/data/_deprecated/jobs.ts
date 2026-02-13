export type JobOffer = {
	id: string;
	title: string;
	location: string;
	contract: "CDI" | "Stage" | "Alternance";
	department: "M&A" | "Opérations" | "Marketing";
	description: string;
};

export const jobOffers: JobOffer[] = [
	{
		id: "analyste-ma",
		title: "Analyste M&A",
		location: "Paris",
		contract: "CDI",
		department: "M&A",
		description:
			"Nous recherchons un Analyste M&A pour rejoindre notre équipe à Paris. Vous participerez à l'exécution des opérations de cession, acquisition et levée de fonds.",
	},
	{
		id: "stagiaire-ma",
		title: "Stagiaire M&A (6 mois)",
		location: "Paris",
		contract: "Stage",
		department: "M&A",
		description:
			"Stage de fin d'études ou césure. Vous serez pleinement intégré aux équipes d'exécution et participerez à la préparation des documents marketing et modèles financiers.",
	},
	{
		id: "charge-marketing",
		title: "Chargé(e) de Marketing & Communication",
		location: "Paris",
		contract: "Alternance",
		department: "Marketing",
		description:
			"Accompagner la stratégie de marque et la communication digitale du cabinet.",
	},
];
