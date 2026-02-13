export const DOCUMENTS_TEMPLATES = [
	{
		id: "teaser",
		title: "Teaser de cession",
		description:
			"Document de présentation anonymisé pour acquéreurs potentiels",
		content: `
      <h1>Teaser de Cession</h1>
      <p><strong>Secteur : </strong>[Secteur d'activité]</p>
      <p><strong>Code Projet : </strong>[Nom de code]</p>
      <h2>Points Clés d'Investissement</h2>
      <ul>
        <li><p>Position de leader sur le marché de niche</p></li>
        <li><p>Croissance du CA de +XX% par an</p></li>
        <li><p>Technologie propriétaire brevetée</p></li>
      </ul>
      <h2>Aperçu Financier</h2>
      <p>[Insérer tableau synthétique ici]</p>
    `,
	},
	{
		id: "im",
		title: "Mémorandum d'information",
		description: "Document détaillé de présentation de la société",
		content: `
      <h1>Mémorandum d'Information</h1>
      <h2>Résumé Exécutif</h2>
      <p>[Synthèse de l'opportunité]</p>
      <h2>Présentation de la Société</h2>
      <h3>Historique</h3>
      <h3>Produits et Services</h3>
      <h2>Marché et Concurrence</h2>
      <h2>Plan Stratégique</h2>
    `,
	},
	{
		id: "loi",
		title: "Lettre d'Intention (LOI)",
		description: "Structure standard d'une LOI",
		content: `
      <h1>Lettre d'Intention</h1>
      <p><strong>Date : </strong>[Date]</p>
      <p><strong>À l'attention de : </strong>[Cédant]</p>
      <h2>Objet : Offre indicative pour l'acquisition de [Société]</h2>
      <p>Madame, Monsieur,</p>
      <p>Suite à nos échanges...</p>
      <h3>1. Périmètre de l'opération</h3>
      <h3>2. Prix et Modalités de paiement</h3>
      <h3>3. Conditions suspensives</h3>
      <h3>4. Calendrier indicatif</h3>
      <h3>5. Exclusivité</h3>
    `,
	},
	{
		id: "dd",
		title: "Checklist Due Diligence",
		description: "Standard checklist pour Due Diligence",
		content: `
      <h1>Checklist Due Diligence</h1>
      <h2>1. Juridique</h2>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false"><p>Statuts de la société à jour</p></li>
        <li data-type="taskItem" data-checked="false"><p>Kbis de moins de 3 mois</p></li>
        <li data-type="taskItem" data-checked="false"><p>Organigramme juridique</p></li>
      </ul>
      <h2>2. Financier</h2>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false"><p>Liasses fiscales (3 derniers exercices)</p></li>
        <li data-type="taskItem" data-checked="false"><p>Rapports des commissaires aux comptes</p></li>
        <li data-type="taskItem" data-checked="false"><p>Budget prévisionnel</p></li>
      </ul>
      <h2>3. Social</h2>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false"><p>Livre d'entrée et de sortie du personnel</p></li>
        <li data-type="taskItem" data-checked="false"><p>Contrats de travail des cadres dirigeants</p></li>
      </ul>
    `,
	},
];
