export interface TeamMember {
	id: string;
	slug: string;
	name: string;
	role: string;
	region?: string;
	photo?: string;
	linkedinUrl?: string;
	email?: string;
	formation?: string;
	bio?: string;
	dealIds: string[];
}

/**
 * Team data from legacy_documentation/data/team_data.md
 * Photo paths reference /assets/Equipe_Alecia/ directory
 */
export const team: TeamMember[] = [
	{
		id: "1",
		slug: "gregory-colin",
		name: "Grégory Colin",
		role: "Associé fondateur",
		region: "Grand Ouest",
		photo: "/assets/Equipe_Alecia/team_member_GC_1_cropped.jpg",
		linkedinUrl: "https://www.linkedin.com/in/gregory-colin-alecia",
		email: "gregory.colin@alecia.fr",
		formation: "Audencia",
		bio: "Grégory est diplômé d'Audencia. Il débute sa carrière au sein du groupe Allianz où il exerce durant 7 années des fonctions d'Analyste crédit, d'Auditeur interne et de Contrôleur de gestion. Il rejoint alors les équipes transactionnelles de Deloitte où il intervient pendant 4 ans en tant que Senior Manager et conduit des missions de fusion/acquisition et de due diligence financière. Grégory crée le bureau Grand Ouest d'une banque d'affaires small cap en 2022 avant de co-fonder alecia en 2024. Grégory est par ailleurs membre du comité de sélection du fonds d'amorçage d'Audencia depuis 2022.",
		dealIds: [],
	},
	{
		id: "2",
		slug: "christophe-berthon",
		name: "Christophe Berthon",
		role: "Associé fondateur",
		region: "Sud Est",
		photo: "/assets/Equipe_Alecia/team_member_CB_1_cropped_alt_1080.jpg",
		linkedinUrl: "https://www.linkedin.com/in/christophe-berthon-alecia",
		email: "christophe.berthon@alecia.fr",
		formation: "Études commerciales",
		bio: "Après un diplôme de commerce, Christophe débute sa carrière au sein du Groupe Carrefour. Il y évolue pendant 15 ans, occupant successivement des postes fonctionnels notamment aux achats nationaux et régionaux, ainsi qu'opérationnels à des postes de Direction en hypermarchés. Il s'oriente ensuite vers l'entreprenariat et la prestation de services aux entreprises, en créant un groupe qui grandit progressivement à la fois en croissance organique et en croissance externe. Il expérimente alors pour son propre compte les processus de M&A et de levée de fonds en France et en Europe. Après la cession de son groupe il intègre une banque d'affaires small cap en 2019, et y cofonde le bureau de Nice. En 2024, Christophe cofonde alecia, et apporte son expertise en matière de négociation et d'accompagnement des dirigeants sur les opérations de haut de bilan.",
		dealIds: [],
	},
	{
		id: "3",
		slug: "martin-egasse",
		name: "Martin Egasse",
		role: "Associé fondateur",
		region: "Sud Est",
		photo: "/assets/Equipe_Alecia/team_member_ME_2_cropped_alt_1080.jpg",
		linkedinUrl: "https://www.linkedin.com/in/martin-egasse-alecia",
		email: "martin.egasse@alecia.fr",
		formation: "DECG - Université Panthéon-Sorbonne",
		bio: "Martin est expert-comptable diplômé. Après un parcours académique à l'Université Paris 1 Panthéon-Sorbonne, il débute chez KPMG et intervient pendant 4 ans sur des missions d'expertise-comptable et d'audit légal auprès de TPE, PME et grands comptes. Il évolue ensuite pendant près de 15 ans au sein de différentes PME et ETI où il occupe des postes de Contrôleur de gestion, Responsable ou Directeur financier. Rompu aux situations financières tendues (factoring, procédures collectives, etc.) il accompagne la restructuration ou la cession de plusieurs PME. Martin exerce en tant que conseil en fusion-acquisition depuis plus de 7 ans et cofonde alecia en 2024.",
		dealIds: [],
	},
	{
		id: "4",
		slug: "tristan-cossec",
		name: "Tristan Cossec",
		role: "Associé fondateur",
		region: "Sud Est",
		photo: "/assets/Equipe_Alecia/team_member_TC_2_1080.jpg",
		linkedinUrl: "https://www.linkedin.com/in/tristan-cossec-alecia",
		email: "tristan.cossec@alecia.fr",
		formation: "EDHEC Business School",
		bio: "Diplômé de l'EDHEC Business School, Tristan débute sa carrière en fonds d'investissement au sein d'Apax Partners. Il bascule ensuite en conseil en fusion-acquisition, au cours de 3 expériences au sein de boutiques Small & Midcap sur Paris : Eponyme Partners, Equideals et Raphaël Financial Advisory. Tristan intègre ensuite un groupe d'éducation supérieur au poste de M&A et Stratégie. Il rejoint une banque d'affaires small cap en 2022 avant de co-fonder alecia en 2024. Tristan apporte ses compétences techniques et sa maîtrise des process M&A dans des opérations de cession et de LBO/levée de fonds.",
		dealIds: [],
	},
	{
		id: "5",
		slug: "serge-de-fay",
		name: "Serge de Faÿ",
		role: "Associé fondateur",
		region: "Auvergne Rhône Alpes",
		photo: "/assets/Equipe_Alecia/team_member_SF_2_1080.jpg",
		linkedinUrl: "https://www.linkedin.com/in/serge-de-feij-alecia",
		email: "serge.defay@alecia.fr",
		formation: "EDHEC Business School, Faculté de Droit de Lille",
		bio: "Serge est diplômé d'un MSc de l'EDHEC Business School et d'un Master 2 en Droit des affaires de l'Université de Lille. Il débute sa carrière en participant à la création de Bolden, prêteur alternatif dédié aux PME françaises. Il occupe les postes de Directeur crédit & produit jusqu'à la cession de la startup à la banque luxembourgeoise RiverBank, dont il créé le bureau français de financements structurés small cap. Serge devient ensuite conseil pour des PME et startups en croissance, avant de rejoindre une banque d'affaires small cap. Il cofonde en 2024 alecia et apporte sa double expertise en finance et direction d'entreprise.",
		dealIds: [],
	},
	{
		id: "6",
		slug: "jerome-berthiau",
		name: "Jérôme Berthiau",
		role: "Associé fondateur",
		region: "Sud Est",
		photo: "/assets/Equipe_Alecia/team_member_JB_1_cropped_alt_1080.jpg",
		linkedinUrl: "https://www.linkedin.com/in/jerome-berthiau-alecia",
		email: "jerome.berthiau@alecia.fr",
		formation: "EDHEC Business School",
		bio: "Jérôme est diplômé d'un MSc en finance d'entreprise de l'EDHEC Business School. Après des premières expériences en fusions-acquisitions chez Clearwater puis en dette privée chez LGT, il intègre les équipes de financements structurés de la Société Générale où il participe à de nombreux LBO large-cap en France pendant 2 ans. Il intègre ensuite les équipe de dette privée de Five Arrows, groupe Rothschild & Co, où il participe pendant 6 ans à l'investissement dans une dizaine de sociétés européenes sous format unitranche, dette mezzanine ou PIK Notes. Jérôme est conseil M&A depuis 4 ans, intervenant notamment sur les secteurs tech, santé, industrie et services BtoB. Il cofonde alecia en 2024.",
		dealIds: [],
	},
	{
		id: "7",
		slug: "louise-pini",
		name: "Louise Pini",
		role: "Analyste",
		region: "Sud Est",
		photo: "/assets/Equipe_Alecia/team_member_LP_2_cropped_1080.jpg",
		linkedinUrl: "https://www.linkedin.com/in/louise-pini-alecia",
		email: "louise.pini@alecia.fr",
		formation: "iaelyon School of Management",
		bio: "Louise est diplômée du Master Ingénierie Financière et Transaction de l'iaelyon School of Management. Durant son parcours académique, elle cumule différentes expériences dans le secteur financier (coverage large cap chez ING, analyse financière à la Banque de France, audit financier et transaction services dans des cabinets lyonnais). A la fin de ses études, Louise intègre une banque d'affaires indépendante pendant deux ans, puis rejoint alecia en 2024.",
		dealIds: [],
	},
	{
		id: "8",
		slug: "mickael-furet",
		name: "Mickael Furet",
		role: "Analyste",
		region: "Sud Est",
		photo: "/assets/Equipe_Alecia/team_member_MF_1080.jpg",
		linkedinUrl: "https://www.linkedin.com/in/mickael-furet-alecia",
		email: "mickael.furet@alecia.fr",
		formation: "EDHEC Business School",
		bio: "Mickael est étudiant du MiM et du MSc Finance d'Entreprise de l'EDHEC Business School. Il initie son parcours professionnel au CIC en tant que Chargé d'Affaires Entreprises, avant d'exercer en tant qu'Analyste M&A au sein de deux cabinets de conseil en fusions-acquisitions.",
		dealIds: [],
	},
];
