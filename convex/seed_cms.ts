import { mutation } from "./_generated/server";
import { logger } from "./lib/logger";

export const deleteAllBlogPosts = mutation({
	args: {},
	handler: async (ctx) => {
		const posts = await ctx.db.query("blog_posts").collect();

		for (const post of posts) {
			await ctx.db.delete(post._id);
			logger.info(`Deleted blog post: ${post.title}`);
		}

		logger.info(`Deleted ${posts.length} blog posts`);
	},
});

export const seedBlogPosts = mutation({
	args: {},
	handler: async (ctx) => {
		// Check if blog posts already exist
		const existingPosts = await ctx.db.query("blog_posts").collect();

		if (existingPosts.length > 0) {
			logger.info("Blog posts already seeded, skipping.");
			return;
		}

		// Seed blog posts
		const blogPosts = [
			{
				title:
					"Alecia conseille SAFE GROUPE dans l'acquisition de Dogs Security",
				slug: "safe-groupe-acquisition",
				content: `Acteur majeur de la sécurité globale en France, SAFE GROUPE poursuit sa stratégie de développement en annonçant l'acquisition de Dogs Security. Cette opération lui permet de renforcer son maillage territorial avec un nouveau bureau en Île-de-France.

Créé en 2014 sous le nom de SECURIT'SOLUTIONS, SAFE GROUPE a su évoluer pour répondre aux besoins croissants en matière de protection, prévention et formation. En mai 2024, l'entreprise a adopté son identité actuelle, symbolisée par l'acronyme SAFE (Sécurité, Accueil, Facility, Expertise), qui incarne ses valeurs et son engagement à offrir des solutions complètes et innovantes à ses clients.

Avec un chiffre d'affaires consolidé de 12 millions d'euros en 2024, SAFE GROUPE s'inscrit dans une forte dynamique de croissance portée par une diversification de l'offre et des marchés adressés. La stratégie du groupe s'articule autour de trois axes prioritaires :
- Consolider sa position d'acteur majeur de la sécurité globale en France
- Accélérer l'intégration de solutions intelligentes et innovantes
- Placer la responsabilité sociétale et environnementale au cœur des décisions

Dogs Security, acteur reconnu pour son expertise et sa clientèle de qualité, apportera à SAFE GROUPE une base stratégique en région parisienne, permettant d'accompagner ses clients sur toute l'Île-de-France.

**Geoffrey ANTIDORMI, CEO de SAFE GROUPE et repreneur de Dogs Security** :
« Nous sommes ravis d'intégrer Dogs Security au sein de SAFE GROUPE et d'entamer cette nouvelle phase de développement du Groupe. Cette acquisition marque une étape importante de notre plan de déploiement d'un groupe national avec une forte proximité territoriale. »

**Tristan COSSEC, Associé-Fondateur chez alecia** :
« Nous sommes heureux d'avoir pu accompagner Geoffrey et SAFE GROUPE dans leur stratégie de build-up avec la réalisation d'une première acquisition, Dogs Security, dont le positionnement et les équipes sont rapidement apparus complémentaires au groupe. »

### Intervenants de l'opération
- Cédant : Dogs Security (Dominique BELLOY)
- Acquéreur : SAFE GROUPE (Geoffrey ANTIDORMI)
- Conseil M&A : alecia (Tristan COSSEC)
- Conseil juridique – cédant : Conseils Réunis (Laurent FILLUZEAU)
- Conseil juridique – acquéreur : Hepta (Jean-Louis SUDARA, Paul HENRY)

### À propos des sociétés
- **SAFE GROUPE** : Groupe intégré spécialiste de la sécurité globale en France, SAFE GROUPE intervient sur les métiers de la sécurité, de l'accueil et facility management, de la formation et du conseil.
- **Dogs Security** : Société familiale créée il y a 30 ans, entreprise de sécurité privée active en Ile-de-France spécialiste du tertiaire, des ERP et des sites sensibles.
- **alecia** : Banque d'affaires spécialisée dans l'accompagnement des PME et ETI françaises. Ses associés combinent une double expertise entrepreneuriale et financière.`,
				excerpt:
					"Acteur majeur de la sécurité globale en France, SAFE GROUPE renforce son maillage territorial avec cette opération stratégique.",
				coverImage:
					"https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=2070",
				category: "Communiqué",
				status: "published" as const,
				publishedAt: 1734224000000, // December 15, 2024
				seoTitle:
					"Alecia conseille SAFE GROUPE dans l'acquisition de Dogs Security",
				seoDescription:
					"Acteur majeur de la sécurité globale en France, SAFE GROUPE renforce son maillage territorial avec cette opération stratégique.",
			},
			{
				title:
					"Alecia conseille Transports Lerosey pour l'acquisition de Dougen Prim",
				slug: "lerosey-dougen",
				content: `Transports Lerosey renforce son maillage territorial avec l'acquisition de Dougen Prim. Cette première opération de croissance externe lui permet d'atteindre une flotte de 60 ensembles frigorifiques et de 11,5 m€ de chiffre d'affaires.

L'entreprise Transports LEROSEY, créée en 1974 par Jacques LEROSEY, est spécialisée depuis plus de 50 ans dans le transport sous température dirigée. Les Transports LEROSEY sont repris en 2020 par François Tardif, son actuel dirigeant actionnaire, après avoir été employé pendant plus de 24 ans.

Avec cette première opération de croissance externe, Transports Lerosey s'inscrit dans une dynamique de développement et de maillage du territoire. Installée depuis 2022 à Villedieu Les Poêles (50) en Normandie, l'entreprise s'étend donc à l'ouest avec l'acquisition d'un site à Mordelles(35) en Bretagne.

Fondée en 2011 par Gildas Guerin, Dougen Prim livre des produits frais sur la Bretagne et les pays de la Loire ainsi que des marchandises vers l'Angleterre et l'Europe. Elle réalise un chiffre d'affaires de 2,5 millions d'euros en 2025 et emploie 13 salariés.

**Tristan COSSEC, Associé-fondateur chez alecia** :
« Nous sommes heureux d'avoir pu accompagner François Tardif dans cette première opération structurante. Cette acquisition a été rendue possible par l'alignement des équipes sur des valeurs fortes centrées sur la qualité de service. »

### Intervenants de l'opération
- Cédant : Dougen Prim (Gildas Guerin)
- Acquéreur : Transports Lerosey (François Tardif)
- Conseil M&A – cédant : Eurallia (Corentin Le Roc'h, Patrick Vollekindt)
- Conseil M&A – acquéreur : alecia (Tristan Cossec)
- Conseil juridique – acquéreur : Fidal (Sophie Vassal)

### À propos des sociétés
- **Transports Lerosey** : Fondée en 1974, Transports Lerosey est une entreprise de transport frigorifique composée d'une flotte de 60 ensembles semi-remorques basée à Villedieu Les Poêles en Normandie. La société opère en France et à l'international.
- **Dougen Prim** : Acteur breton du transport sous température dirigée qui livre des produits frais sur la Bretagne et les pays de la Loire ainsi que des marchandises vers l'Angleterre et l'Europe. Fondée en 2011.
- **alecia** : Banque d'affaires spécialisée dans l'accompagnement des PME et ETI françaises.`,
				excerpt:
					"Transports Lerosey renforce son maillage avec l'acquisition de Dougen Prim (11,5 m€ CA).",
				coverImage:
					"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2070",
				category: "Communiqué",
				status: "published" as const,
				publishedAt: 1734489600000, // December 18, 2024
				seoTitle:
					"Alecia conseille Transports Lerosey pour l'acquisition de Dougen Prim",
				seoDescription:
					"Transports Lerosey renforce son maillage avec l'acquisition de Dougen Prim (11,5 m€ CA).",
			},
		];

		for (const post of blogPosts) {
			await ctx.db.insert("blog_posts", post);
			logger.info(`Seeded blog post: ${post.title}`);
		}

		logger.info(`Successfully seeded ${blogPosts.length} blog posts`);
	},
});

// Add missing blog posts without deleting existing ones
export const addMissingBlogPosts = mutation({
	args: {},
	handler: async (ctx) => {
		const missingPosts = [
			{
				title:
					"Alecia conseille SAFE GROUPE dans l'acquisition de Dogs Security",
				slug: "safe-groupe-acquisition",
				content: `Acteur majeur de la sécurité globale en France, SAFE GROUPE poursuit sa stratégie de développement en annonçant l'acquisition de Dogs Security. Cette opération lui permet de renforcer son maillage territorial avec un nouveau bureau en Île-de-France.

Créé en 2014 sous le nom de SECURIT'SOLUTIONS, SAFE GROUPE a su évoluer pour répondre aux besoins croissants en matière de protection, prévention et formation. En mai 2024, l'entreprise a adopté son identité actuelle, symbolisée par l'acronyme SAFE (Sécurité, Accueil, Facility, Expertise), qui incarne ses valeurs et son engagement à offrir des solutions complètes et innovantes à ses clients.

Avec un chiffre d'affaires consolidé de 12 millions d'euros en 2024, SAFE GROUPE s'inscrit dans une forte dynamique de croissance portée par une diversification de l'offre et des marchés adressés.

**Geoffrey ANTIDORMI, CEO de SAFE GROUPE et repreneur de Dogs Security** :
« Nous sommes ravis d'intégrer Dogs Security au sein de SAFE GROUPE et d'entamer cette nouvelle phase de développement du Groupe. »

**Tristan COSSEC, Associé-Fondateur chez alecia** :
« Nous sommes heureux d'avoir pu accompagner Geoffrey et SAFE GROUPE dans leur stratégie de build-up avec la réalisation d'une première acquisition. »

### Intervenants de l'opération
- Cédant : Dogs Security (Dominique BELLOY)
- Acquéreur : SAFE GROUPE (Geoffrey ANTIDORMI)
- Conseil M&A : alecia (Tristan COSSEC)`,
				excerpt:
					"Acteur majeur de la sécurité globale en France, SAFE GROUPE renforce son maillage territorial avec cette opération stratégique.",
				coverImage:
					"https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=2070",
				category: "Communiqué",
				status: "published" as const,
				publishedAt: 1734224000000,
				seoTitle:
					"Alecia conseille SAFE GROUPE dans l'acquisition de Dogs Security",
				seoDescription:
					"Acteur majeur de la sécurité globale en France, SAFE GROUPE renforce son maillage territorial avec cette opération stratégique.",
			},
			{
				title:
					"Alecia conseille Transports Lerosey pour l'acquisition de Dougen Prim",
				slug: "lerosey-dougen",
				content: `Transports Lerosey renforce son maillage territorial avec l'acquisition de Dougen Prim. Cette première opération de croissance externe lui permet d'atteindre une flotte de 60 ensembles frigorifiques et de 11,5 m€ de chiffre d'affaires.

L'entreprise Transports LEROSEY, créée en 1974 par Jacques LEROSEY, est spécialisée depuis plus de 50 ans dans le transport sous température dirigée. Les Transports LEROSEY sont repris en 2020 par François Tardif, son actuel dirigeant actionnaire.

Avec cette première opération de croissance externe, Transports Lerosey s'inscrit dans une dynamique de développement et de maillage du territoire.

Fondée en 2011 par Gildas Guerin, Dougen Prim livre des produits frais sur la Bretagne et les pays de la Loire ainsi que des marchandises vers l'Angleterre et l'Europe. Elle réalise un chiffre d'affaires de 2,5 millions d'euros en 2025 et emploie 13 salariés.

**Tristan COSSEC, Associé-fondateur chez alecia** :
« Nous sommes heureux d'avoir pu accompagner François Tardif dans cette première opération structurante. »

### Intervenants de l'opération
- Cédant : Dougen Prim (Gildas Guerin)
- Acquéreur : Transports Lerosey (François Tardif)
- Conseil M&A – acquéreur : alecia (Tristan Cossec)

### À propos des sociétés
- **Transports Lerosey** : Fondée en 1974, entreprise de transport frigorifique basée en Normandie.
- **Dougen Prim** : Acteur breton du transport sous température dirigée fondée en 2011.
- **alecia** : Banque d'affaires spécialisée dans l'accompagnement des PME et ETI françaises.`,
				excerpt:
					"Transports Lerosey renforce son maillage avec l'acquisition de Dougen Prim (11,5 m€ CA).",
				coverImage:
					"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2070",
				category: "Communiqué",
				status: "published" as const,
				publishedAt: 1734489600000,
				seoTitle:
					"Alecia conseille Transports Lerosey pour l'acquisition de Dougen Prim",
				seoDescription:
					"Transports Lerosey renforce son maillage avec l'acquisition de Dougen Prim (11,5 m€ CA).",
			},
		];

		let addedCount = 0;
		for (const post of missingPosts) {
			// Check if already exists
			const existing = await ctx.db
				.query("blog_posts")
				.withIndex("by_slug", (q) => q.eq("slug", post.slug))
				.first();

			if (!existing) {
				await ctx.db.insert("blog_posts", post);
				logger.info(`Added missing blog post: ${post.title}`);
				addedCount++;
			} else {
				logger.info(`Blog post already exists: ${post.slug}`);
			}
		}

		return { added: addedCount, total: missingPosts.length };
	},
});

export const seedHomepage = mutation({
	args: {},
	handler: async (ctx) => {
		// Check if homepage exists
		const existing = await ctx.db
			.query("site_pages")
			.withIndex("by_slug", (q) => q.eq("slug", "home"))
			.first();

		if (existing) {
			logger.info("Homepage already seeded.");
			return;
		}

		// Initial Content (HTML for Tiptap)
		const initialContent = `
      <h1>Vos ambitions, notre engagement</h1>
      <p>Partenaire de confiance des dirigeants de PME et ETI pour leurs opérations de haut de bilan : Cession, Acquisition, Finance.</p>
      <h2>Notre approche</h2>
      <p>Vos décisions stratégiques nécessitent plus qu'un simple accompagnement.</p>
      <ul>
        <li>Expertise sectorielle</li>
        <li>Réseau étendu</li>
        <li>Confidentialité absolue</li>
      </ul>
    `;

		await ctx.db.insert("site_pages", {
			slug: "home",
			title: "Page d'Accueil",
			content: initialContent,
			isPublished: true,
			seo: {
				title: "Alecia - Conseil M&A",
				description: "Conseil en fusion-acquisition pour PME et ETI.",
				keywords: ["M&A", "Cession", "Acquisition"],
			},
		});

		logger.info("Homepage seeded successfully");
	},
});
