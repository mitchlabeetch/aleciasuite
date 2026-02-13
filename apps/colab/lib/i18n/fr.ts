/**
 * French translations for Alecia Colab
 * All UI text should be in French for Phase 1
 */

export const fr = {
	// General
	app: {
		name: "Alecia Colab",
		tagline: "Plateforme de collaboration M&A",
	},

	// Navigation
	nav: {
		home: "Accueil",
		documents: "Documents",
		pipeline: "Pipeline",
		companies: "Sociétés",
		calendar: "Calendrier",
		settings: "Paramètres",
		recentlyOpened: "Récemment ouvert",
		workspace: "Espace de travail",
		noRecentDocuments: "Aucun document récent.",
		recent: "Récents",
		favorites: "Favoris",
		trash: "Corbeille",
		allDocuments: "Tous les documents",
	},

	// Actions
	actions: {
		new: "Nouveau",
		newDeal: "Nouveau Deal",
		newDocument: "Nouveau Document",
		newCompanyProfile: "Nouveau Profil d'Entreprise",
		export: "Exporter",
		exportAsMarkdown: "Exporter en Markdown",
		share: "Partager",
		shareDocument: "Partager le Document",
		save: "Enregistrer",
		cancel: "Annuler",
		delete: "Supprimer",
		edit: "Modifier",
		create: "Créer",
		search: "Rechercher",
		filter: "Filtrer",
		sort: "Trier",
		quickActions: "Actions Rapides",
		quickNote: "Note Rapide",
		upload: "Téléverser",
		download: "Télécharger",
	},

	// Common
	common: {
		collaborator: "Collaborateur",
		collaboratorSingle: "collaborateur",
		collaboratorPlural: "collaborateurs",
		team: "Équipe",
		total: "au total",
	},

	// Time
	time: {
		justNow: "À l'instant",
		minuteAgo: "Il y a {count} minute",
		minutesAgo: "Il y a {count} minutes",
		hourAgo: "Il y a {count} heure",
		hoursAgo: "Il y a {count} heures",
		dayAgo: "Il y a {count} jour",
		daysAgo: "Il y a {count} jours",
		unknown: "Heure inconnue",
	},

	// Deal Pipeline
	pipeline: {
		title: "Pipeline des Deals",
		stages: {
			sourcing: "Sourcing",
			dueDiligence: "Due Diligence",
			negotiation: "Négociation",
			closing: "Clôture",
			closedWon: "Gagné",
			closedLost: "Perdu",
		},
		fields: {
			company: "Entreprise",
			companyName: "Nom de l'entreprise",
			valuation: "Valorisation",
			lead: "Responsable",
			dealLead: "Responsable du Deal",
			stage: "Étape",
			createdAt: "Créé le",
			updatedAt: "Mis à jour le",
			dueDate: "Date d'échéance",
			priority: "Priorité",
			tags: "Tags",
		},
		priority: {
			high: "Haute",
			medium: "Moyenne",
			low: "Basse",
		},
		views: {
			kanban: "Kanban",
			table: "Tableau",
			calendar: "Calendrier",
			flow: "Flux",
		},
		noDealsFound: "Aucun deal trouvé.",
		createDeal: "Créer un Deal",
		moveToNextStage: "Passer à l'étape suivante",
		demoMode: "Mode Démo",
	},

	// Activity
	activity: {
		updatedDocument: "a mis à jour le document",
		createdDeal: "a créé le deal",
		updatedDeal: "a mis à jour le deal",
	},

	// Calendar
	calendar: {
		today: "Aujourd'hui",
		days: {
			short: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
			long: [
				"Dimanche",
				"Lundi",
				"Mardi",
				"Mercredi",
				"Jeudi",
				"Vendredi",
				"Samedi",
			],
		},
		months: {
			short: [
				"Jan",
				"Fév",
				"Mar",
				"Avr",
				"Mai",
				"Juin",
				"Juil",
				"Aoû",
				"Sep",
				"Oct",
				"Nov",
				"Déc",
			],
			long: [
				"Janvier",
				"Février",
				"Mars",
				"Avril",
				"Mai",
				"Juin",
				"Juillet",
				"Août",
				"Septembre",
				"Octobre",
				"Novembre",
				"Décembre",
			],
		},
	},

	// Theme
	theme: {
		appearance: "Apparence",
		system: "Système",
		light: "Clair",
		dark: "Sombre",
	},

	// Profile
	profile: {
		myProfile: "Mon Profil",
		settings: "Paramètres",
		logout: "Se Déconnecter",
		signIn: "Connexion",
	},

	// Editor
	editor: {
		title: "Éditeur",
		placeholder: "Commencez à écrire...",
		untitled: "Sans titre",
		format: "Format",
		template: "Modèle",
		history: "Historique",
	},

	// File Upload
	upload: {
		dragDrop: "Glisser-déposer ou",
		uploadFile: "Téléverser un fichier",
		dragDropHere: "ou glissez-déposez votre fichier ici",
		selectFile: "Sélectionner un fichier",
		uploading: "Téléversement en cours...",
		uploadSuccess: "Téléversement réussi",
		uploadError: "Erreur de téléversement",
	},

	// Loader
	loader: {
		loading: "Chargement...",
		configuringAccount: "Configuration de votre compte...",
		pleaseWait: "Veuillez patienter...",
		processing: "Traitement en cours...",
	},

	// Search
	search: {
		placeholder: "Rechercher...",
		commandTip: "⌘K pour ouvrir les commandes",
		escapeToCancel: "Échap pour annuler",
		noResults: "Aucun résultat trouvé",
		recentSearches: "Recherches récentes",
	},

	// Toolbar
	toolbar: {
		view: "Affichage",
		settings: "Paramètres",
	},

	// Dashboard
	dashboard: {
		welcome: "Bienvenue",
		welcomeBack: "Bon retour",
		quickActions: "Actions Rapides",
		recentDocuments: "Documents Récents",
		activityFeed: "Fil d'Activité",
		notifications: "Notifications",
		lastUpdate: "Dernière mise à jour",
		noDocuments: "Aucun document",
		documentLinkedToDeal: "Document lié à un deal",
		documentCollaboration: "Document de collaboration",
		activeTeam: "Équipe active",
		noMembers: "Aucun membre",
		dealsClosed: "deals clôturés",
		noClosedDeals: "Aucun deal clôturé",
		noRecentActivity: "Aucune activité récente.",
		stats: {
			dealsInProgress: "Deals en cours",
			documentsCreated: "Documents créés",
			teamMembers: "Membres de l'équipe",
			tasksCompleted: "Tâches terminées",
		},
		welcomeMessage:
			"Gérez vos deals, documents et collaborations en un seul endroit",
		recentDocumentsDescription: "Reprenez là où vous vous étiez arrêté",
		quickNavigation: "Navigation Rapide",
		quickNavigationDescription: "Accédez aux zones fréquemment utilisées",
		adminDashboard: "Tableau de bord Admin",
		crmContacts: "Contacts CRM",
		companies: "Entreprises",
		website: "Site Web",
		viewAll: "Voir tout",
		recentFilesUnavailable: "Fichiers récents indisponibles en mode démo.",
		quickAction: {
			deal: "Deal",
			document: "Document",
			company: "Société",
			contact: "Contact",
			other: "Autre",
		},
	},

	// Sidebar
	sidebar: {
		main: "Principal",
		admin: "Admin",
		files: "Fichiers",
		dashboard: "Tableau de bord",
		contacts: "Contacts",
		companies: "Entreprises",
	},

	// Command Menu / Action Search
	command: {
		placeholder: "Que souhaitez-vous faire ?",
		label: "Commandes",
		press: "Appuyez sur",
		toOpen: "pour ouvrir",
		toCancel: "pour annuler",
		actions: {
			bookTickets: "Réserver des billets",
			summarize: "Résumer",
			screenStudio: "Studio d'écran",
			talkToJarvis: "Parler à l'IA",
			components: "Composants",
		},
	},

	// Errors
	errors: {
		somethingWentWrong: "Une erreur s'est produite",
		tryAgain: "Réessayer",
		notFound: "Non trouvé",
		unauthorized: "Non autorisé",
		serverError: "Erreur du serveur",
	},

	// Success messages
	success: {
		saved: "Enregistré avec succès",
		created: "Créé avec succès",
		updated: "Mis à jour avec succès",
		deleted: "Supprimé avec succès",
	},

	// Forms
	form: {
		required: "Requis",
		optional: "Optionnel",
		enterValue: "Entrer une valeur",
		selectOption: "Sélectionner une option",
	},

	// Tabs
	tabs: {
		editor: "Éditeur",
		pipeline: "Pipeline",
	},
};

export type TranslationKeys = typeof fr;

export default fr;
