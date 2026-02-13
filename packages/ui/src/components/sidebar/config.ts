import {
  Briefcase,
  FileText,
  Users,
  BarChart3,
  Palette,
  Building2,
  Newspaper,
  UserPlus,
  Kanban,
  FolderTree,
  Presentation,
  Calendar,
  Star,
  Clock,
  Trash2,
  Settings,
  LayoutDashboard,
  Mail,
  TrendingUp,
  Globe,
  Home,
  FileEdit,
  Sparkles,
  User,
  Award,
  Paintbrush,
  Bell,
  FolderLock,
  ClipboardList,
  Gauge,
  CheckCheck,
  Brain,
  Calculator,
  Table2,
  FileSpreadsheet,
  Layers,
  Activity,
  Workflow,
  FileSignature,
  Lock,
  Rss,
  Search,
} from "lucide-react";
import type { SidebarConfig } from "./types";

/**
 * Default unified sidebar configuration
 *
 * Categories:
 * - Colab: Collaborative features (documents, boards, presentations) - colab context only
 * - Panel: Admin dashboard and M&A tools - panel context only
 * - Site: Marketing website content management - panel context only
 * - CRM: Customer relationship management - panel context only
 * - Automation: Workflow automation with Activepieces - panel context only
 * - Signatures: E-signature management with DocuSeal - panel context only
 * - Vault: Password manager with Vaultwarden - panel context only
 * - Analytics: Web analytics with Plausible - panel context only
 * - Feeds: RSS feed aggregator with Miniflux - panel context only
 * - Research: Company research with SearXNG + Pappers - panel context only
 */
export const defaultSidebarConfig: SidebarConfig = {
  brand: {
    name: "Alecia",
    href: "/",
  },
  categories: [
    // ========================
    // COLAB CATEGORY
    // Collaborative Studio features - COLAB ONLY
    // ========================
    {
      id: "colab",
      label: "Colab",
      labelFr: "Colab",
      icon: FolderTree,
      defaultOpen: true,
      context: "colab",
      items: [
        {
          id: "colab-dashboard",
          label: "Dashboard",
          labelFr: "Tableau de bord",
          icon: LayoutDashboard,
          href: "/dashboard",
        },
        {
          id: "colab-documents",
          label: "Documents",
          labelFr: "Documents",
          icon: FileText,
          href: "/documents",
          dataKey: "documentCount",
          children: [
            {
              id: "colab-documents-new",
              label: "New Document",
              labelFr: "Nouveau document",
              href: "/documents/new",
            },
            {
              id: "colab-documents-recent",
              label: "Recent",
              labelFr: "Récents",
              icon: Clock,
              href: "/recent",
            },
            {
              id: "colab-documents-favorites",
              label: "Favorites",
              labelFr: "Favoris",
              icon: Star,
              href: "/favorites",
            },
            {
              id: "colab-documents-trash",
              label: "Trash",
              labelFr: "Corbeille",
              icon: Trash2,
              href: "/trash",
            },
          ],
        },
        {
          id: "colab-boards",
          label: "Kanban Boards",
          labelFr: "Tableaux Kanban",
          icon: Kanban,
          href: "/colab/boards",
          dataKey: "boardCount",
        },
        {
          id: "colab-presentations",
          label: "Presentations",
          labelFr: "Présentations",
          icon: Presentation,
          href: "/presentations",
          dataKey: "presentationCount",
        },
        {
          id: "colab-calendar",
          label: "Calendar",
          labelFr: "Calendrier",
          icon: Calendar,
          href: "/calendar",
        },
      ],
    },

    // ========================
    // PANEL CATEGORY
    // Admin Dashboard - PANEL ONLY
    // ========================
    {
      id: "panel",
      label: "Panel",
      labelFr: "Panel",
      icon: Home,
      defaultOpen: true,
      context: "panel",
      items: [
        {
          id: "panel-dashboard",
          label: "Dashboard",
          labelFr: "Tableau de bord",
          icon: LayoutDashboard,
          href: "/admin/dashboard",
        },
        {
          id: "panel-workspace",
          label: "Workspace",
          labelFr: "Espace de travail",
          icon: FileEdit,
          href: "/admin/colab",
          badge: "Colab",
        },
        {
          id: "panel-studio",
          label: "Studio",
          labelFr: "Studio",
          icon: Sparkles,
          href: "/studio",
        },
        {
          id: "panel-notifications",
          label: "Notifications",
          labelFr: "Notifications",
          icon: Bell,
          href: "/admin/notifications",
          dataKey: "unreadNotificationCount",
        },
        {
          id: "panel-data-rooms",
          label: "Data Rooms",
          labelFr: "Data Rooms",
          icon: FolderLock,
          href: "/admin/data-rooms",
          badge: "VDR",
        },
        {
          id: "panel-dd-checklists",
          label: "DD Checklists",
          labelFr: "Checklists DD",
          icon: ClipboardList,
          href: "/admin/dd-checklists",
        },
        {
          id: "panel-pipeline-analytics",
          label: "Pipeline Analytics",
          labelFr: "Analytics Pipeline",
          icon: Gauge,
          href: "/admin/pipeline-analytics",
          badge: "Nouveau",
        },
        {
          id: "panel-approvals",
          label: "Approvals",
          labelFr: "Approbations",
          icon: CheckCheck,
          href: "/admin/approvals",
          dataKey: "pendingApprovalCount",
        },
        {
          id: "panel-calendar",
          label: "Calendar",
          labelFr: "Calendrier",
          icon: Calendar,
          href: "/admin/calendar",
          badge: "Sync",
        },
        {
          id: "panel-ai-tools",
          label: "AI Tools",
          labelFr: "Outils IA",
          icon: Sparkles,
          href: "/admin/ai-tools",
          badge: "Nouveau",
        },
        {
          id: "panel-business-intelligence",
          label: "Business Intelligence",
          labelFr: "Business Intelligence",
          icon: Brain,
          href: "/admin/business-intelligence",
          badge: "IA",
        },
        {
          id: "panel-alecia-analytics",
          label: "Alecia Analytics",
          labelFr: "Alecia Analytics",
          icon: Activity,
          href: "/admin/alecia-analytics",
          badge: "Nouveau",
        },
        {
          id: "panel-numbers",
          label: "Numbers",
          labelFr: "Numbers",
          icon: Calculator,
          href: "/admin/numbers",
          badge: "Nouveau",
          children: [
            {
              id: "panel-numbers-hub",
              label: "Hub",
              labelFr: "Hub",
              icon: Table2,
              href: "/admin/numbers",
            },
            {
              id: "panel-numbers-fee",
              label: "Fee Calculator",
              labelFr: "Calcul Honoraires",
              icon: Calculator,
              href: "/admin/numbers/fee-calculator",
            },
            {
              id: "panel-numbers-valuation",
              label: "Valuation",
              labelFr: "Valorisation",
              icon: TrendingUp,
              href: "/admin/numbers/valuation",
            },
            {
              id: "panel-numbers-financial-model",
              label: "Financial Model",
              labelFr: "Modele Financier",
              icon: FileSpreadsheet,
              href: "/admin/numbers/financial-model",
            },
            {
              id: "panel-numbers-comparables",
              label: "Comparables",
              labelFr: "Comparables",
              icon: BarChart3,
              href: "/admin/numbers/comparables",
            },
            {
              id: "panel-numbers-pipeline",
              label: "Pipeline",
              labelFr: "Pipeline",
              icon: Kanban,
              href: "/admin/numbers/pipeline",
            },
            {
              id: "panel-numbers-timeline",
              label: "Timeline",
              labelFr: "Timeline",
              icon: Calendar,
              href: "/admin/numbers/timeline",
            },
            {
              id: "panel-numbers-dd",
              label: "DD Checklist",
              labelFr: "Checklist DD",
              icon: ClipboardList,
              href: "/admin/numbers/dd-checklist",
            },
            {
              id: "panel-numbers-teaser",
              label: "Teaser/IM",
              labelFr: "Teaser/IM",
              icon: FileText,
              href: "/admin/numbers/teaser-tracking",
            },
            {
              id: "panel-numbers-post-deal",
              label: "Post-Deal",
              labelFr: "Post-Deal",
              icon: Layers,
              href: "/admin/numbers/post-deal",
            },
            {
              id: "panel-numbers-spreadsheet",
              label: "Spreadsheet",
              labelFr: "Tableur",
              icon: Table2,
              href: "/admin/numbers/spreadsheet",
            },
          ],
        },
      ],
    },

    // ========================
    // SITE CATEGORY
    // Marketing website content management - PANEL ONLY
    // ========================
    {
      id: "site",
      label: "Site",
      labelFr: "Site",
      icon: Globe,
      defaultOpen: true,
      context: "panel",
      roles: ["sudo", "partner", "advisor"],
      items: [
        {
          id: "site-visual-editor",
          label: "Visual Editor",
          labelFr: "Éditeur Visuel",
          icon: Paintbrush,
          href: "/admin/visual-editor",
          badge: "Nouveau",
        },
        {
          id: "site-operations",
          label: "Operations",
          labelFr: "Opérations",
          icon: Award,
          href: "/admin/operations",
          dataKey: "transactionCount",
        },
        {
          id: "site-team",
          label: "Team",
          labelFr: "Équipe",
          icon: Users,
          href: "/admin/team",
          dataKey: "teamMemberCount",
        },
        {
          id: "site-blog",
          label: "Blog Articles",
          labelFr: "Articles",
          icon: Newspaper,
          href: "/admin/blog",
          dataKey: "blogPostCount",
        },
        {
          id: "site-kpis",
          label: "KPIs",
          labelFr: "KPIs",
          icon: BarChart3,
          href: "/admin/kpis",
          dataKey: "kpiCount",
        },
        {
          id: "site-design",
          label: "Design",
          labelFr: "Design",
          icon: Palette,
          href: "/admin/design",
          children: [
            {
              id: "site-design-colors",
              label: "Colors",
              labelFr: "Couleurs",
              href: "/admin/design/colors",
            },
            {
              id: "site-design-typography",
              label: "Typography",
              labelFr: "Typographie",
              href: "/admin/design/typography",
            },
            {
              id: "site-design-components",
              label: "Components",
              labelFr: "Composants",
              href: "/admin/design/components",
            },
          ],
        },
        {
          id: "site-jobs",
          label: "Job Offers",
          labelFr: "Carrières",
          icon: UserPlus,
          href: "/admin/careers",
          dataKey: "jobOfferCount",
        },
      ],
    },

    // ========================
    // CRM CATEGORY
    // Customer Relationship Management - PANEL ONLY
    // ========================
    {
      id: "crm",
      label: "CRM",
      labelFr: "CRM",
      icon: Building2,
      defaultOpen: false,
      context: "panel",
      roles: ["sudo", "partner", "advisor"],
      items: [
        {
          id: "crm-main",
          label: "CRM",
          labelFr: "CRM",
          icon: Users,
          href: "/admin/crm",
        },
        {
          id: "crm-pipeline",
          label: "Deal Pipeline",
          labelFr: "Pipeline",
          icon: TrendingUp,
          href: "/pipeline",
          dataKey: "dealCount",
        },
        {
          id: "crm-leads",
          label: "Leads",
          labelFr: "Leads",
          icon: Mail,
          href: "/admin/leads",
          dataKey: "leadCount",
          badgeVariant: "success",
        },
        {
          id: "crm-companies",
          label: "Companies",
          labelFr: "Entreprises",
          icon: Building2,
          href: "/companies",
          dataKey: "companyCount",
        },
        {
          id: "crm-contacts",
          label: "Contacts",
          labelFr: "Contacts",
          icon: Users,
          href: "/admin/contacts",
          dataKey: "contactCount",
        },
      ],
    },

    // ========================
    // AUTOMATION CATEGORY
    // Workflow automation with Activepieces - PANEL ONLY
    // ========================
    {
      id: "automation",
      label: "Automation",
      labelFr: "Automation",
      icon: Workflow,
      defaultOpen: false,
      context: "panel",
      roles: ["sudo", "partner", "advisor"],
      items: [
        {
          id: "automation-flows",
          label: "Flows",
          labelFr: "Flux",
          icon: Workflow,
          href: "/admin/flows",
          badge: "Activepieces",
        },
        {
          id: "automation-workflows",
          label: "Workflows",
          labelFr: "Workflows",
          icon: Workflow,
          href: "/admin/flows/workflows",
          dataKey: "workflowCount",
        },
        {
          id: "automation-logs",
          label: "Execution Logs",
          labelFr: "Logs d'exécution",
          icon: Activity,
          href: "/admin/flows/logs",
        },
        {
          id: "automation-connections",
          label: "API Connections",
          labelFr: "Connexions API",
          icon: Globe,
          href: "/admin/flows/connections",
          dataKey: "connectionCount",
        },
      ],
    },

    // ========================
    // SIGNATURES CATEGORY
    // E-signature management with DocuSeal - PANEL ONLY
    // ========================
    {
      id: "signatures",
      label: "Signatures",
      labelFr: "Signatures",
      icon: FileSignature,
      defaultOpen: false,
      context: "panel",
      roles: ["sudo", "partner", "advisor"],
      items: [
        {
          id: "signatures-dashboard",
          label: "Dashboard",
          labelFr: "Tableau de bord",
          icon: LayoutDashboard,
          href: "/admin/signatures",
          badge: "DocuSeal",
        },
        {
          id: "signatures-documents",
          label: "Documents",
          labelFr: "Documents",
          icon: FileText,
          href: "/admin/signatures/documents",
          dataKey: "documentCount",
        },
        {
          id: "signatures-templates",
          label: "Templates",
          labelFr: "Modèles",
          icon: FileText,
          href: "/admin/signatures/templates",
          dataKey: "templateCount",
        },
        {
          id: "signatures-status",
          label: "Status Tracking",
          labelFr: "Suivi des statuts",
          icon: Activity,
          href: "/admin/signatures/status",
        },
        {
          id: "signatures-integrations",
          label: "Deal Integrations",
          labelFr: "Intégrations deals",
          icon: Briefcase,
          href: "/admin/signatures/integrations",
        },
      ],
    },

    // ========================
    // VAULT CATEGORY
    // Password manager with Vaultwarden - PANEL ONLY
    // ========================
    {
      id: "vault",
      label: "Vault",
      labelFr: "Coffre-fort",
      icon: Lock,
      defaultOpen: false,
      context: "panel",
      roles: ["sudo", "partner", "advisor"],
      items: [
        {
          id: "vault-dashboard",
          label: "Dashboard",
          labelFr: "Tableau de bord",
          icon: LayoutDashboard,
          href: "/admin/vault",
          badge: "Vaultwarden",
        },
        {
          id: "vault-items",
          label: "Vault Items",
          labelFr: "Éléments",
          icon: Lock,
          href: "/admin/vault/items",
          dataKey: "vaultItemCount",
        },
        {
          id: "vault-generator",
          label: "Password Generator",
          labelFr: "Générateur de mots de passe",
          icon: Sparkles,
          href: "/admin/vault/generator",
        },
        {
          id: "vault-sharing",
          label: "Secure Sharing",
          labelFr: "Partage sécurisé",
          icon: Users,
          href: "/admin/vault/sharing",
        },
        {
          id: "vault-sso",
          label: "SSO Integration",
          labelFr: "Intégration SSO",
          icon: Globe,
          href: "/admin/vault/sso",
          badge: "Better Auth",
        },
      ],
    },

    // ========================
    // ANALYTICS CATEGORY
    // Web analytics with Plausible - PANEL ONLY
    // ========================
    {
      id: "analytics",
      label: "Analytics",
      labelFr: "Analytics",
      icon: BarChart3,
      defaultOpen: false,
      context: "panel",
      roles: ["sudo", "partner", "advisor"],
      items: [
        {
          id: "analytics-dashboard",
          label: "Dashboard",
          labelFr: "Tableau de bord",
          icon: LayoutDashboard,
          href: "/admin/analytics",
          badge: "Plausible",
        },
        {
          id: "analytics-metrics",
          label: "Site Metrics",
          labelFr: "Métriques site",
          icon: Activity,
          href: "/admin/analytics/metrics",
        },
        {
          id: "analytics-conversions",
          label: "Deal Conversions",
          labelFr: "Conversions deals",
          icon: TrendingUp,
          href: "/admin/analytics/conversions",
        },
        {
          id: "analytics-traffic",
          label: "Traffic Sources",
          labelFr: "Sources de trafic",
          icon: Globe,
          href: "/admin/analytics/traffic",
        },
        {
          id: "analytics-leads",
          label: "Lead Sources",
          labelFr: "Sources leads",
          icon: Users,
          href: "/admin/analytics/leads",
        },
      ],
    },

    // ========================
    // FEEDS CATEGORY
    // RSS feed aggregator with Miniflux - PANEL ONLY
    // ========================
    {
      id: "feeds",
      label: "Feeds",
      labelFr: "Veille",
      icon: Rss,
      defaultOpen: false,
      context: "panel",
      roles: ["sudo", "partner", "advisor"],
      items: [
        {
          id: "feeds-dashboard",
          label: "Dashboard",
          labelFr: "Tableau de bord",
          icon: LayoutDashboard,
          href: "/admin/feeds",
          badge: "Miniflux",
        },
        {
          id: "feeds-subscriptions",
          label: "RSS Subscriptions",
          labelFr: "Abonnements RSS",
          icon: Rss,
          href: "/admin/feeds/subscriptions",
          dataKey: "subscriptionCount",
        },
        {
          id: "feeds-alerts",
          label: "Sector Alerts",
          labelFr: "Alertes secteurs",
          icon: Bell,
          href: "/admin/feeds/alerts",
        },
        {
          id: "feeds-saved",
          label: "Saved Articles",
          labelFr: "Articles sauvegardés",
          icon: Star,
          href: "/admin/feeds/saved",
          dataKey: "savedArticleCount",
        },
        {
          id: "feeds-sharing",
          label: "Team Sharing",
          labelFr: "Partage équipe",
          icon: Users,
          href: "/admin/feeds/sharing",
        },
      ],
    },

    // ========================
    // RESEARCH CATEGORY
    // Company research with SearXNG + Pappers - PANEL ONLY
    // ========================
    {
      id: "research",
      label: "Research",
      labelFr: "Recherche",
      icon: Search,
      defaultOpen: false,
      context: "panel",
      roles: ["sudo", "partner", "advisor"],
      items: [
        {
          id: "research-dashboard",
          label: "Dashboard",
          labelFr: "Tableau de bord",
          icon: LayoutDashboard,
          href: "/admin/research",
          badge: "SearXNG + Pappers",
        },
        {
          id: "research-companies",
          label: "Company Search",
          labelFr: "Recherche entreprises",
          icon: Building2,
          href: "/admin/research/companies",
        },
        {
          id: "research-pappers",
          label: "Pappers Integration",
          labelFr: "Intégration Pappers",
          icon: Briefcase,
          href: "/admin/research/pappers",
        },
        {
          id: "research-web",
          label: "Web Search",
          labelFr: "Recherche Web",
          icon: Search,
          href: "/admin/research/web",
        },
        {
          id: "research-export",
          label: "Data Export",
          labelFr: "Export données",
          icon: FileSpreadsheet,
          href: "/admin/research/export",
        },
      ],
    },
  ],
  footer: [
    {
      id: "settings",
      label: "Settings",
      labelFr: "Paramètres",
      icon: Settings,
      href: "/admin/settings",
    },
    {
      id: "account",
      label: "Account",
      labelFr: "Mon Compte",
      icon: User,
      href: "/admin/account",
    },
  ],
};
